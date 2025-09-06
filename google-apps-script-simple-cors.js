/**
 * Google Apps Script - Simplified Email Webhook (CORS Compatible)
 * 
 * This is a simplified version that should work with CORS.
 * Deploy this as a Web App with "Execute as: Me" and "Who has access: Anyone"
 */

function doGet(e) {
  return ContentService
    .createTextOutput("✅ Troop 468 Email Webhook is running! Use POST requests to send data.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  // Log the incoming request
  console.log('📧 POST request received');
  
  let requestData = {};
  let result = {};
  
  try {
    // Parse request data if available
    if (e.postData && e.postData.contents) {
      requestData = JSON.parse(e.postData.contents);
      console.log('📦 Parsed request data:', requestData);
    }
    
    // Check if this is an email queue request
    if (requestData.rows && Array.isArray(requestData.rows)) {
      console.log(`📧 Processing ${requestData.rows.length} email records`);
      result = saveEmailsToSheet(requestData.rows);
    } else {
      // Simple test response
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
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveEmailsToSheet(emailRows) {
  try {
    // Open the specific Google Sheet
    const sheetId = '1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM';
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    
    // Get or create the EmailQueue sheet
    let sheet = spreadsheet.getSheetByName('EmailQueue');
    if (!sheet) {
      // Create the sheet if it doesn't exist
      sheet = spreadsheet.insertSheet('EmailQueue');
      // Add headers
      sheet.getRange(1, 1, 1, 10).setValues([[
        'timestamp', 'type', 'to', 'name', 'role', 'subject', 'htmlBody', 'status', 'meta', 'sentAt'
      ]]);
    }
    
    const results = [];
    
    // Add each email to the sheet
    for (let i = 0; i < emailRows.length; i++) {
      const email = emailRows[i];
      const timestamp = new Date().toISOString();
      
      const rowData = [
        timestamp,                          // A: timestamp
        email.type || 'EMAIL',             // B: type
        email.to || '',                    // C: to
        email.name || '',                  // D: name
        email.role || '',                  // E: role
        email.subject || '',               // F: subject
        email.htmlBody || '',              // G: htmlBody
        email.status || 'PENDING',         // H: status
        JSON.stringify(email.meta || {}),  // I: meta
        ''                                 // J: sentAt
      ];
      
      // Append the row
      sheet.appendRow(rowData);
      const rowNumber = sheet.getLastRow();
      
      console.log(`✅ Added email to row ${rowNumber}: ${email.subject}`);
      
      results.push({
        rowNumber: rowNumber,
        email: email.subject,
        to: email.to,
        status: 'SAVED'
      });
    }
    
    return {
      success: true,
      message: `Successfully saved ${emailRows.length} email records`,
      timestamp: new Date().toISOString(),
      results: results,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit#gid=759662525`
    };
    
  } catch (error) {
    console.error('❌ Sheet save error:', error);
    throw new Error(`Failed to save to sheet: ${error.message}`);
  }
}

/**
 * Manual test function - run this in the Apps Script editor
 */
function manualTest() {
  const testEmail = {
    type: 'TEST',
    to: 'test@troop468.com',
    name: 'Manual Test',
    role: 'test',
    subject: 'Manual Test Email',
    htmlBody: '<p>This is a manual test from the Apps Script editor.</p>',
    status: 'PENDING',
    meta: { source: 'manual test', timestamp: new Date().toISOString() }
  };
  
  try {
    const result = saveEmailsToSheet([testEmail]);
    console.log('✅ Manual test successful:', result);
    return result;
  } catch (error) {
    console.error('❌ Manual test failed:', error);
    return { success: false, error: error.toString() };
  }
}




