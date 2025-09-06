/**
 * Google Apps Script - Email Queue Logger for Troop 468
 * This script receives email requests from React app and saves them to Google Sheets
 * 
 * Your Google Sheet Structure (EmailQueue tab):
 * A: timestamp | B: type | C: to | D: name | E: role | F: subject | G: htmlBody | H: status | I: meta | J: sentAt
 */

// Configuration
const EMAIL_QUEUE_SHEET_ID = '1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM';
const EMAIL_QUEUE_SHEET_NAME = 'EmailQueue';

/**
 * Handle HTTP POST requests from React app
 */
function doPost(e) {
  try {
    console.log('📧 Received email request from React app');
    
    // Parse request data
    const requestData = JSON.parse(e.postData.contents);
    console.log('📦 Request data:', requestData);
    
    // Log headers for debugging
    console.log('📋 Headers:', e.postData.headers);
    
    let processedCount = 0;
    let errors = [];
    
    // Process email rows
    if (requestData.rows && Array.isArray(requestData.rows)) {
      console.log(`📬 Processing ${requestData.rows.length} email requests`);
      
      // Save all emails to Google Sheets
      try {
        processedCount = saveEmailsToSheet(requestData.rows);
        console.log(`✅ Saved ${processedCount} email records to Google Sheets`);
      } catch (error) {
        console.error('❌ Error saving to sheets:', error);
        errors.push(`Failed to save emails to sheet: ${error.toString()}`);
      }
    } else {
      console.log('⚠️ No email rows found in request');
    }
    
    // Create response
    const response = {
      success: true,
      processed: processedCount,
      errors: errors,
      timestamp: new Date().toISOString(),
      message: `Successfully processed ${processedCount} email records`
    };
    
    console.log('✅ Request completed:', response);
    
    // Return JSON response
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('❌ Error in doPost:', error);
    
    const errorResponse = {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle OPTIONS requests for CORS
 */
function doOptions(e) {
  console.log('🔄 CORS preflight request received');
  
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Save email records to Google Sheets
 */
function saveEmailsToSheet(emailRows) {
  try {
    console.log(`📊 Saving ${emailRows.length} emails to Google Sheets...`);
    
    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(EMAIL_QUEUE_SHEET_ID);
    let sheet = spreadsheet.getSheetByName(EMAIL_QUEUE_SHEET_NAME);
    
    // Create EmailQueue sheet if it doesn't exist
    if (!sheet) {
      console.log('📋 Creating EmailQueue sheet...');
      sheet = spreadsheet.insertSheet(EMAIL_QUEUE_SHEET_NAME);
      
      // Add headers
      const headers = ['timestamp', 'type', 'to', 'name', 'role', 'subject', 'htmlBody', 'status', 'meta', 'sentAt'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#E8F0FE');
      
      console.log('✅ EmailQueue sheet created with headers');
    }
    
    // Prepare data rows
    const timestamp = new Date().toISOString();
    const sheetRows = emailRows.map(emailData => [
      timestamp,                                    // A: timestamp
      emailData.type || 'EMAIL',                    // B: type
      emailData.to || '',                           // C: to
      emailData.name || '',                         // D: name
      emailData.role || '',                         // E: role
      emailData.subject || '',                      // F: subject
      emailData.htmlBody || emailData.body || '',   // G: htmlBody
      'QUEUED',                                     // H: status
      JSON.stringify({                              // I: meta
        source: 'ReactApp',
        queuedAt: timestamp,
        userAgent: 'TroopManager',
        ...emailData.meta
      }),
      ''                                            // J: sentAt (empty for queued)
    ]);
    
    // Add rows to sheet
    if (sheetRows.length > 0) {
      const startRow = sheet.getLastRow() + 1;
      const range = sheet.getRange(startRow, 1, sheetRows.length, sheetRows[0].length);
      range.setValues(sheetRows);
      
      console.log(`📊 Added ${sheetRows.length} rows starting at row ${startRow}`);
      
      // Auto-resize columns for better readability
      sheet.autoResizeColumns(1, sheetRows[0].length);
    }
    
    return sheetRows.length;
    
  } catch (error) {
    console.error('❌ Error saving to Google Sheets:', error);
    throw error;
  }
}

/**
 * Get email queue statistics
 */
function getQueueStats() {
  try {
    const sheet = SpreadsheetApp.openById(EMAIL_QUEUE_SHEET_ID).getSheetByName(EMAIL_QUEUE_SHEET_NAME);
    
    if (!sheet) {
      return { total: 0, queued: 0, sent: 0, failed: 0 };
    }
    
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    if (values.length <= 1) {
      return { total: 0, queued: 0, sent: 0, failed: 0 };
    }
    
    const headers = values[0];
    const rows = values.slice(1);
    const statusCol = headers.indexOf('status');
    
    if (statusCol === -1) {
      return { total: rows.length, queued: 0, sent: 0, failed: 0 };
    }
    
    const stats = { total: rows.length, queued: 0, sent: 0, failed: 0 };
    
    rows.forEach(row => {
      const status = row[statusCol];
      if (status === 'QUEUED') stats.queued++;
      else if (status === 'SENT') stats.sent++;
      else if (status === 'FAILED') stats.failed++;
    });
    
    return stats;
    
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return { error: error.toString() };
  }
}

/**
 * Manual test function - run this to test the system
 */
function testEmailQueue() {
  try {
    console.log('🧪 Testing email queue system...');
    
    // Test email data
    const testEmails = [
      {
        to: 'test1@troop468.com',
        name: 'Test Scout 1',
        role: 'scout',
        subject: 'Welcome to Troop 468!',
        htmlBody: '<p>Welcome to our troop! We are excited to have you join us.</p>',
        type: 'APPROVAL'
      },
      {
        to: 'parent@troop468.com',
        name: 'Test Parent',
        role: 'parent',
        subject: 'Your Scout Has Been Approved',
        htmlBody: '<p>Your scout has been approved to join Troop 468.</p>',
        type: 'NOTIFICATION'
      }
    ];
    
    // Test saving to sheet
    const saved = saveEmailsToSheet(testEmails);
    console.log(`✅ Test saved ${saved} email records`);
    
    // Test getting stats
    const stats = getQueueStats();
    console.log('📊 Queue stats:', stats);
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

/**
 * Clear all email queue data (use with caution!)
 */
function clearEmailQueue() {
  try {
    const sheet = SpreadsheetApp.openById(EMAIL_QUEUE_SHEET_ID).getSheetByName(EMAIL_QUEUE_SHEET_NAME);
    
    if (!sheet) {
      console.log('No EmailQueue sheet found');
      return;
    }
    
    // Keep headers, clear data rows
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clear();
      console.log(`Cleared ${lastRow - 1} email records`);
    } else {
      console.log('No data to clear');
    }
    
  } catch (error) {
    console.error('Error clearing queue:', error);
  }
}

