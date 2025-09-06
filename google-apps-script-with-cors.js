/**
 * Google Apps Script - Email Webhook with CORS Support
 * 
 * This script handles POST requests from web browsers and includes proper CORS headers.
 * 
 * Deployment Instructions:
 * 1. Replace all code in your Apps Script project with this code
 * 2. Deploy as Web App:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 3. Copy the new Web App URL
 */

function doGet(e) {
  // Handle GET requests (for testing in browser)
  const response = ContentService.createTextOutput("✅ Troop 468 Email Webhook is running! Use POST requests to send data.");
  
  // Add CORS headers for GET requests
  return addCorsHeaders(response);
}

function doPost(e) {
  try {
    console.log('📧 POST request received');
    console.log('📦 Request data:', e.postData.contents);
    
    // Parse the request
    let requestData = {};
    if (e.postData && e.postData.contents) {
      requestData = JSON.parse(e.postData.contents);
    }
    
    // Process the request based on the data structure
    let result;
    if (requestData.rows && Array.isArray(requestData.rows)) {
      // Handle email queue requests
      result = processEmailQueue(requestData.rows);
    } else {
      // Handle simple test requests
      result = {
        success: true,
        message: "POST request received successfully!",
        timestamp: new Date().toISOString(),
        receivedData: requestData
      };
    }
    
    console.log('✅ Sending response:', result);
    
    const response = ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
    
    // Add CORS headers for POST requests
    return addCorsHeaders(response);
      
  } catch (error) {
    console.error('❌ Error in doPost:', error);
    
    const errorResponse = {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
    
    const response = ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
    
    // Add CORS headers for error responses
    return addCorsHeaders(response);
  }
}

function doOptions(e) {
  // Handle preflight OPTIONS requests for CORS
  console.log('🔄 OPTIONS preflight request received');
  
  const response = ContentService.createTextOutput('');
  return addCorsHeaders(response);
}

function addCorsHeaders(response) {
  // Add CORS headers to allow browser requests
  return response
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Token')
    .setHeader('Access-Control-Max-Age', '3600');
}

function processEmailQueue(emailRows) {
  try {
    console.log(`📧 Processing ${emailRows.length} email records`);
    
    // Get the EmailQueue sheet
    const spreadsheet = SpreadsheetApp.openById('1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM');
    const sheet = spreadsheet.getSheetByName('EmailQueue');
    
    if (!sheet) {
      throw new Error('EmailQueue sheet not found');
    }
    
    const results = [];
    
    // Process each email record
    for (let i = 0; i < emailRows.length; i++) {
      const email = emailRows[i];
      
      // Create row data matching your sheet structure
      const timestamp = new Date().toISOString();
      const rowData = [
        timestamp,                           // A: timestamp
        email.type || 'EMAIL',              // B: type
        email.to || '',                     // C: to
        email.name || '',                   // D: name
        email.role || '',                   // E: role
        email.subject || '',                // F: subject
        email.htmlBody || '',               // G: htmlBody
        email.status || 'PENDING',          // H: status
        JSON.stringify(email.meta || {}),   // I: meta
        ''                                  // J: sentAt (empty for pending)
      ];
      
      // Append the row to the sheet
      const range = sheet.appendRow(rowData);
      const rowNumber = sheet.getLastRow();
      
      console.log(`✅ Added email record to row ${rowNumber}`);
      
      results.push({
        rowNumber: rowNumber,
        range: `A${rowNumber}:J${rowNumber}`,
        timestamp: timestamp,
        email: {
          type: email.type,
          to: email.to,
          subject: email.subject,
          status: email.status || 'PENDING'
        }
      });
    }
    
    return {
      success: true,
      message: `Successfully processed ${emailRows.length} email records`,
      timestamp: new Date().toISOString(),
      results: results,
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM/edit?gid=759662525#gid=759662525'
    };
    
  } catch (error) {
    console.error('❌ Error processing email queue:', error);
    throw new Error(`Email queue processing failed: ${error.message}`);
  }
}

/**
 * Test function to verify sheet access
 * Run this manually in the Apps Script editor to test permissions
 */
function testSheetAccess() {
  try {
    const spreadsheet = SpreadsheetApp.openById('1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM');
    const sheet = spreadsheet.getSheetByName('EmailQueue');
    
    if (!sheet) {
      console.log('❌ EmailQueue sheet not found');
      return false;
    }
    
    console.log('✅ Sheet access successful');
    console.log('📊 Sheet name:', sheet.getName());
    console.log('📊 Last row:', sheet.getLastRow());
    console.log('📊 Last column:', sheet.getLastColumn());
    
    return true;
  } catch (error) {
    console.error('❌ Sheet access failed:', error);
    return false;
  }
}

