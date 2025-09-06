/**
 * Google Apps Script - Free Sheets API Proxy
 * This script runs on Google's servers (free) and acts as a secure proxy
 * between your React app and Google Sheets using your service account.
 * 
 * Setup Instructions:
 * 1. Go to script.google.com
 * 2. Create new project: "Troop 468 Sheets Proxy"
 * 3. Replace default code with this script
 * 4. Deploy as Web App (Execute as: Me, Access: Anyone)
 * 5. Copy the Web App URL to use in your React app
 */

// Your Google Sheet ID
const SHEET_ID = '1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM';
const SHEET_NAME = 'EmailQueue';

/**
 * Handle HTTP requests from your React app
 */
function doPost(e) {
  try {
    // Parse the request
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    
    // Set CORS headers
    const response = {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
    
    let result;
    
    switch (action) {
      case 'READ_SHEET':
        result = readSheetData();
        break;
        
      case 'WRITE_RECORD':
        result = writeEmailRecord(requestData.data);
        break;
        
      case 'TEST_CONNECTION':
        result = testConnection();
        break;
        
      default:
        throw new Error('Invalid action: ' + action);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle OPTIONS requests for CORS
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

/**
 * Read data from the EmailQueue sheet
 */
function readSheetData() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet "${SHEET_NAME}" not found`);
    }
    
    // Get all data
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    if (values.length === 0) {
      return {
        headers: [],
        rows: [],
        totalRows: 0
      };
    }
    
    const headers = values[0];
    const rows = values.slice(1);
    
    return {
      headers: headers,
      rows: rows,
      totalRows: values.length,
      sheetName: SHEET_NAME,
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    throw new Error('Failed to read sheet: ' + error.toString());
  }
}

/**
 * Write a new email record to the sheet
 */
function writeEmailRecord(emailData) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet "${SHEET_NAME}" not found`);
    }
    
    // Create the row data matching your sheet structure
    const timestamp = new Date().toISOString();
    const rowData = [
      timestamp,                    // A: timestamp
      emailData.type || 'API',      // B: type
      emailData.to || '',           // C: to
      emailData.name || '',         // D: name
      emailData.role || '',         // E: role
      emailData.subject || '',      // F: subject
      emailData.htmlBody || '',     // G: htmlBody
      emailData.status || 'PENDING', // H: status
      JSON.stringify({              // I: meta
        source: 'GoogleAppsScript',
        apiCall: true,
        timestamp: timestamp,
        ...emailData.meta
      }),
      emailData.sentAt || ''        // J: sentAt
    ];
    
    // Append the row
    sheet.appendRow(rowData);
    
    // Get the range of the newly added row
    const lastRow = sheet.getLastRow();
    const newRowRange = sheet.getRange(lastRow, 1, 1, rowData.length);
    
    return {
      success: true,
      rowNumber: lastRow,
      range: newRowRange.getA1Notation(),
      data: rowData,
      timestamp: timestamp
    };
    
  } catch (error) {
    throw new Error('Failed to write record: ' + error.toString());
  }
}

/**
 * Test the connection to the sheet
 */
function testConnection() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet "${SHEET_NAME}" not found`);
    }
    
    const sheetInfo = {
      spreadsheetName: spreadsheet.getName(),
      sheetName: sheet.getName(),
      lastRow: sheet.getLastRow(),
      lastColumn: sheet.getLastColumn(),
      url: spreadsheet.getUrl(),
      id: SHEET_ID
    };
    
    return {
      connected: true,
      message: 'Successfully connected to Google Sheet',
      sheetInfo: sheetInfo,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    throw new Error('Connection test failed: ' + error.toString());
  }
}

/**
 * Test function you can run manually in the Apps Script editor
 */
function testManually() {
  try {
    console.log('Testing connection...');
    const connectionResult = testConnection();
    console.log('Connection test:', connectionResult);
    
    console.log('Testing read...');
    const readResult = readSheetData();
    console.log('Read test:', readResult);
    
    console.log('Testing write...');
    const writeResult = writeEmailRecord({
      type: 'TEST',
      to: 'test@example.com',
      name: 'Manual Test',
      role: 'test',
      subject: 'Manual Test from Apps Script',
      htmlBody: '<p>This is a manual test</p>',
      status: 'PENDING'
    });
    console.log('Write test:', writeResult);
    
    console.log('All tests completed successfully!');
    
  } catch (error) {
    console.error('Manual test failed:', error);
  }
}

