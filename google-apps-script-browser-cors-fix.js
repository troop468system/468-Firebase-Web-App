//======================================================================================
// Save the email request to the sheet if it is for repeating
//
// Handle GET requests - Just confirm it works
//======================================================================================

/**
 * Get current time formatted as Pacific Time (PST/PDT)
 * Automatically handles daylight saving time transitions
 * @returns {string} - Formatted timestamp in Pacific Time
 */
function getPacificTimeString() {
  const now = new Date();
  
  // Convert to Pacific Time using Google Apps Script's built-in timezone support
  // This automatically handles PST/PDT transitions
  const pacificTime = Utilities.formatDate(now, 'America/Los_Angeles', 'yyyy-MM-dd HH:mm:ss z');
  
  console.log(`🕐 Current time: UTC ${now.toISOString()}, Pacific: ${pacificTime}`);
  
  return pacificTime;
}

/**
 * Alternative function to get Pacific Time as ISO string with timezone offset
 * @returns {string} - ISO formatted timestamp with Pacific timezone
 */
function getPacificTimeISO() {
  const now = new Date();
  
  // Get Pacific Time with full ISO format including timezone
  const pacificTimeISO = Utilities.formatDate(now, 'America/Los_Angeles', 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
  
  // Note: The 'Z' above will show as literal 'Z', but we can get the actual offset
  const offset = Utilities.formatDate(now, 'America/Los_Angeles', 'Z');
  const isoWithOffset = Utilities.formatDate(now, 'America/Los_Angeles', 'yyyy-MM-dd\'T\'HH:mm:ss.SSS') + offset;
  
  console.log(`🕐 Pacific Time ISO: ${isoWithOffset}`);
  
  return isoWithOffset;
}

function saveEmailToSheet(emailData) {
    try {
      const spreadsheet = SpreadsheetApp.openById(SHEET_ID_EMAIL_MANAGER);
      
      // Get the Email Queue sheet (must exist)
      let sheet = spreadsheet.getSheetByName('Email Queue');
      if (!sheet) {
        console.error('❌ Email Queue sheet not found!');
        throw new Error('Email Queue sheet not found in the spreadsheet');
      }
      
      // Map email data to sheet columns (14 columns total)
      // Column order: type, from, to, cc, subject, htmlBody, mon, tue, wed, thu, fri, sat, sun, stopDate
      const rowData = [
        emailData.type || '',           // A: type
        emailData.from || '',           // B: from  
        emailData.to || '',             // C: to
        emailData.cc || '',             // D: cc
        emailData.subject || '',        // E: subject
        emailData.htmlBody || '',       // F: htmlBody (fallback to body)
        emailData.mon || '',            // G: mon
        emailData.tue || '',            // H: tue
        emailData.wed || '',            // I: wed
        emailData.thu || '',            // J: thu
        emailData.fri || '',            // K: fri
        emailData.sat || '',            // L: sat
        emailData.sun || '',            // M: sun
        emailData.stopDate || ''        // N: stopDate
      ];
      
      // updateHeader(sheet);
      sheet.appendRow(rowData);
      const rowNumber = sheet.getLastRow();
      
      console.log(`✅ Added email to row ${rowNumber}: ${emailData.subject}`);
      
      // Create Pacific Time timestamp (PST/PDT)
      const pacificTime = getPacificTimeString();
      
      const result = {
        rowNumber: rowNumber,
        timestamp: pacificTime,
        email: {
          type: emailData.type,
          from: emailData.from,
          to: emailData.to,
          subject: emailData.subject,
          repeat: isRepeat
        }
      };
      
      return {
        success: true,
        message: `Successfully processed an email`,
        result: result,
        sheetUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID_EMAIL_MANAGER}/edit#gid=759662525`
      };
      
    } catch (error) {
      console.error('❌ Sheet save error:', error);
      throw new Error(`Failed to save to sheet: ${error.message}`);
    }
  }
  