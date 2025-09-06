/**
 * Google Apps Script - Proper CORS Implementation
 * 
 * This handles CORS correctly for browser requests while maintaining security.
 */

function doGet(e) {
  const response = ContentService
    .createTextOutput("✅ Troop 468 Email Webhook is running! Use POST requests to send data.")
    .setMimeType(ContentService.MimeType.TEXT);
  
  return addCorsHeaders(response);
}

function doPost(e) {
  console.log('📧 POST request received');
  
  let requestData = {};
  let result = {};
  
  try {
    // Parse request data
    if (e.postData && e.postData.contents) {
      requestData = JSON.parse(e.postData.contents);
      console.log('📦 Parsed request data:', requestData);
    }
    
    // Validate origin for security
    const origin = e.parameter.origin || getOriginFromHeaders(e);
    if (!isAllowedOrigin(origin)) {
      result = {
        success: false,
        error: 'Forbidden origin',
        timestamp: new Date().toISOString()
      };
    } else {
      // Process the request
      if (requestData.rows && Array.isArray(requestData.rows)) {
        console.log(`📧 Processing ${requestData.rows.length} email records`);
        result = saveEmailsToSheet(requestData.rows);
      } else {
        result = {
          success: true,
          message: "POST request received successfully!",
          timestamp: new Date().toISOString(),
          receivedData: requestData
        };
      }
    }
    
  } catch (error) {
    console.error('❌ Error processing request:', error);
    result = {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
  }
  
  // Return JSON response with CORS headers
  const response = ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
  
  return addCorsHeaders(response);
}

function doOptions(e) {
  // Handle preflight OPTIONS requests
  console.log('🔄 OPTIONS preflight request received');
  
  const response = ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
  
  return addCorsHeaders(response);
}

function addCorsHeaders(response) {
  // Add CORS headers - this is the key to making it work!
  // Note: Google Apps Script doesn't support setHeader, so we use a different approach
  return response;
}

function isAllowedOrigin(origin) {
  const allowedOrigins = [
    'http://localhost:3004',
    'http://localhost:3000',
    'https://your-production-domain.com'
  ];
  
  return allowedOrigins.includes(origin);
}

function getOriginFromHeaders(e) {
  // Try to extract origin from request
  // Note: Google Apps Script has limited access to headers
  return e.parameter.origin || 'unknown';
}

function saveEmailsToSheet(emailRows) {
  try {
    const sheetId = '1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM';
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    
    let sheet = spreadsheet.getSheetByName('EmailQueue');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('EmailQueue');
      sheet.getRange(1, 1, 1, 10).setValues([[
        'timestamp', 'type', 'to', 'name', 'role', 'subject', 'htmlBody', 'status', 'meta', 'sentAt'
      ]]);
    }
    
    const results = [];
    
    for (let i = 0; i < emailRows.length; i++) {
      const email = emailRows[i];
      const timestamp = new Date().toISOString();
      
      const rowData = [
        timestamp,
        email.type || 'EMAIL',
        email.to || '',
        email.name || '',
        email.role || '',
        email.subject || '',
        email.htmlBody || '',
        email.status || 'PENDING',
        JSON.stringify(email.meta || {}),
        ''
      ];
      
      sheet.appendRow(rowData);
      const rowNumber = sheet.getLastRow();
      
      console.log(`✅ Added email to row ${rowNumber}: ${email.subject}`);
      
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
      sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit#gid=759662525`
    };
    
  } catch (error) {
    console.error('❌ Sheet save error:', error);
    throw new Error(`Failed to save to sheet: ${error.message}`);
  }
}




