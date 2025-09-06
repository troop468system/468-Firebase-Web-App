/**
 * Google Apps Script - Email Queue Webhook Handler
 * 
 * This script receives single email data from the React frontend and saves it to Google Sheets.
 * Handles single email objects sent directly (not in 'rows' array).
 * 
 * Deployment Instructions:
 * 1. Deploy as Web App with "Execute as: Me" and "Who has access: Anyone"
 * 2. Use the deployment URL in your React app
 * 3. Send POST requests with Content-Type: text/plain to avoid CORS preflight
 */

// Configuration - Define your Google Sheets ID here
const SHEET_ID_EMAIL_MANAGER = '1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM';

function doGet(e) {
  // Handle GET requests - used for testing if the webhook is accessible
  console.log('🔍 GET request received - webhook health check');
  
  const response = ContentService
    .createTextOutput("✅ Troop 468 Email Webhook is running! Use POST requests to send data.")
    .setMimeType(ContentService.MimeType.TEXT);
  
  return response;
}

function doPost(e) {
  // Handle POST requests - main email processing endpoint
  console.log('📧 POST request received');
  console.log('📦 Raw request data:', e.postData ? e.postData.contents : 'No post data');
  
  let requestData = {};
  let result = {};
  
  try {
    // Parse the JSON data from the request body
    if (e.postData && e.postData.contents) {
      requestData = JSON.parse(e.postData.contents);
      console.log('📦 Parsed request data:', requestData);
    } else {
      throw new Error('No post data received');
    }
    
    // Handle single email object (your current format)
    if (requestData.type || requestData.subject) {
      console.log('📧 Processing single email record');
      result = saveEmailToSheet(requestData);
    } else {
      // Simple test request format
      console.log('🧪 Processing test request');
      result = {
        success: true,
        message: "POST request received successfully!",
        timestamp: new Date().toISOString(),
        receivedData: requestData
      };
    }

  } catch (error) {
    console.error('❌ Error processing request:', error);
    result = {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
  }
  
  // Return JSON response
  console.log('✅ Sending response:', result);
  const response = ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
  
  return response;
}

function doOptions(e) {
  // Handle preflight OPTIONS requests for CORS
  // Note: Google Apps Script has limited CORS support, so we use text/plain in frontend
  console.log('🔄 OPTIONS preflight request received');
  
  const response = ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
  
  return response;
}
  
/**
 * Check if email should be sent repeatedly based on stopDate and schedule
 * @param {Object} emailData - Email object with stopDate and day flags
 * @returns {boolean} - True if email should repeat
 */
function shouldRepeatEmail(emailData) {
  // Check if stopDate exists and is not empty
  if (!emailData.stopDate || emailData.stopDate.trim() === '') {
    console.log('📅 No repeat: stopDate is empty or missing');
    return false;
  }
  
  // Validate stopDate is a valid future date
  const stopDate = new Date(emailData.stopDate);
  if (isNaN(stopDate.getTime())) {
    console.log('📅 No repeat: stopDate is not a valid date');
    return false;
  }
  
  if (stopDate <= new Date()) {
    console.log('📅 No repeat: stopDate is in the past');
    return false;
  }
  
  // Check if at least one day is selected for repetition
  const scheduledDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const hasScheduledDays = scheduledDays.some(day => 
    emailData[day] === 'true' || emailData[day] === true
  );
  
  if (!hasScheduledDays) {
    console.log('📅 No repeat: no days selected for repetition');
    return false;
  }
  
  const selectedDays = scheduledDays.filter(day => 
    emailData[day] === 'true' || emailData[day] === true
  );
  
  console.log(`📅 Repeat enabled: until ${stopDate.toISOString().split('T')[0]}, days: ${selectedDays.join(', ')}`);
  return true;
}

/**
 * Save a single email to Google Sheets
 * @param {Object} emailData - Single email object with properties like type, from, to, etc.
 * @returns {Object} - Success response with result details
 */
function saveEmailToSheet(emailData) {
  try {
    console.log('📊 Opening Google Sheets with ID:', SHEET_ID_EMAIL_MANAGER);
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID_EMAIL_MANAGER);
    
    // Get the Email Queue sheet (must exist)
    let sheet = spreadsheet.getSheetByName('Email Queue');
    if (!sheet) {
      console.error('❌ Email Queue sheet not found!');
      throw new Error('Email Queue sheet not found in the spreadsheet');
    }
    
    console.log('📋 Found Email Queue sheet, preparing row data...');
    
    // Map email data to sheet columns (14 columns total)
    // Column order: type, from, to, cc, subject, htmlBody, mon, tue, wed, thu, fri, sat, sun, stopDate
    const rowData = [
      emailData.type || '',           // A: type
      emailData.from || '',           // B: from  
      emailData.to || '',             // C: to
      emailData.cc || '',             // D: cc
      emailData.subject || '',        // E: subject
      emailData.htmlBody || emailData.body || '', // F: htmlBody (fallback to body)
      emailData.mon || '',            // G: mon
      emailData.tue || '',            // H: tue
      emailData.wed || '',            // I: wed
      emailData.thu || '',            // J: thu
      emailData.fri || '',            // K: fri
      emailData.sat || '',            // L: sat
      emailData.sun || '',            // M: sun
      emailData.stopDate || ''        // N: stopDate
    ];
    
    console.log('📝 Row data prepared:', rowData);
    
    // Add the row to the sheet
    sheet.appendRow(rowData);
    const rowNumber = sheet.getLastRow();
    
    console.log(`✅ Successfully added email to row ${rowNumber}: "${emailData.subject}"`);
    
    // Check if email should repeat
    const isRepeat = shouldRepeatEmail(emailData);
    
    // Prepare the result object
    const result = {
      rowNumber: rowNumber,
      range: `A${rowNumber}:N${rowNumber}`,
      timestamp: new Date().toISOString(),
      email: {
        type: emailData.type,
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        repeat: isRepeat
      }
    };
    
    // Return success response
    return {
      success: true,
      message: "Successfully processed 1 email record",
      timestamp: new Date().toISOString(),
      result: result,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID_EMAIL_MANAGER}/edit#gid=0`
    };
    
  } catch (error) {
    console.error('❌ Sheet save error:', error);
    throw new Error(`Failed to save email to sheet: ${error.message}`);
  }
}

/**
 * Manual test function - run this in the Apps Script editor to test functionality
 * Creates a test email and saves it to the sheet
 * @returns {Object} - Test result
 */
function manualTest() {
  console.log('🧪 Running manual test of saveEmailsToSheet function...');
  
  // Create test email data matching your React app format
  const testEmail = {
    type: 'TEST',
    from: 'test@troop468.com',
    to: 'manual-test@troop468.com',
    cc: 'cc-test@troop468.com',
    subject: 'Manual Test Email from Apps Script Editor',
    htmlBody: '<p>This is a manual test email created directly in the Apps Script editor.</p><p>Timestamp: ' + new Date().toISOString() + '</p>',
    mon: 'true',
    tue: 'true',
    wed: 'false',
    thu: 'false',
    fri: 'true',
    sat: 'false',
    sun: 'false',
    stopDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
  };
  
  try {
    const result = saveEmailToSheet(testEmail);
    console.log('✅ Manual test successful:', result);
    return result;
  } catch (error) {
    console.error('❌ Manual test failed:', error);
    return { 
      success: false, 
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
  }
}
  