/**
 * Google Apps Script - Email Automation for Troop 468
 * This script processes email queue from Google Sheets and sends emails via Gmail
 * 
 * Setup Instructions:
 * 1. Go to script.google.com
 * 2. Create new project: "Troop 468 Email Automation"
 * 3. Replace default code with this script
 * 4. Enable Gmail API in Apps Script (Resources > Advanced Google Services)
 * 5. Deploy as Web App (Execute as: Me, Access: Anyone)
 * 6. Set up time-driven trigger to process queue periodically
 * 7. Copy Web App URL to REACT_APP_EMAIL_WEBHOOK_URL in your React app
 */

// Configuration
const EMAIL_QUEUE_SHEET_ID = '1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM';
const EMAIL_QUEUE_SHEET_NAME = 'EmailQueue';
const FROM_EMAIL = 'troop468.system@gmail.com'; // Your Gmail address
const BATCH_SIZE = 10; // Process up to 10 emails per run

/**
 * Handle HTTP POST requests from React app
 */
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    
    // Set CORS headers
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      processed: 0
    };
    
    if (requestData.rows && Array.isArray(requestData.rows)) {
      // Direct email sending (immediate)
      response.processed = processBatchEmails(requestData.rows);
      response.message = `Processed ${response.processed} emails immediately`;
    } else {
      // Process pending emails from queue
      response.processed = processEmailQueue();
      response.message = `Processed ${response.processed} emails from queue`;
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
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
 * Process email queue from Google Sheets
 * This function can be called by time-driven triggers
 */
function processEmailQueue() {
  try {
    const sheet = SpreadsheetApp.openById(EMAIL_QUEUE_SHEET_ID).getSheetByName(EMAIL_QUEUE_SHEET_NAME);
    
    if (!sheet) {
      Logger.log('EmailQueue sheet not found');
      return 0;
    }
    
    // Get all data
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    if (values.length <= 1) {
      Logger.log('No emails in queue');
      return 0;
    }
    
    const headers = values[0];
    const rows = values.slice(1);
    
    // Find column indices
    const statusCol = headers.indexOf('status');
    const sentAtCol = headers.indexOf('sentAt');
    
    if (statusCol === -1) {
      Logger.log('Status column not found');
      return 0;
    }
    
    // Find pending emails
    const pendingEmails = [];
    rows.forEach((row, index) => {
      if (row[statusCol] === 'PENDING' && pendingEmails.length < BATCH_SIZE) {
        pendingEmails.push({
          row: row,
          rowIndex: index + 2 // +2 because arrays are 0-indexed and we skip header
        });
      }
    });
    
    if (pendingEmails.length === 0) {
      Logger.log('No pending emails found');
      return 0;
    }
    
    Logger.log(`Processing ${pendingEmails.length} pending emails`);
    
    let processed = 0;
    
    // Process each pending email
    pendingEmails.forEach(emailData => {
      try {
        const row = emailData.row;
        const rowIndex = emailData.rowIndex;
        
        // Extract email data from row
        const emailInfo = {
          timestamp: row[0],
          type: row[1],
          to: row[2],
          name: row[3],
          role: row[4],
          subject: row[5],
          htmlBody: row[6],
          status: row[7],
          meta: row[8]
        };
        
        // Send the email
        const success = sendEmail(emailInfo);
        
        if (success) {
          // Update status to SENT and set sentAt timestamp
          sheet.getRange(rowIndex, statusCol + 1).setValue('SENT');
          if (sentAtCol !== -1) {
            sheet.getRange(rowIndex, sentAtCol + 1).setValue(new Date().toISOString());
          }
          processed++;
          Logger.log(`✅ Sent email to ${emailInfo.to}`);
        } else {
          // Update status to FAILED
          sheet.getRange(rowIndex, statusCol + 1).setValue('FAILED');
          Logger.log(`❌ Failed to send email to ${emailInfo.to}`);
        }
        
      } catch (error) {
        Logger.log(`Error processing email at row ${emailData.rowIndex}: ${error.toString()}`);
      }
    });
    
    Logger.log(`Processed ${processed} emails successfully`);
    return processed;
    
  } catch (error) {
    Logger.log('Error in processEmailQueue: ' + error.toString());
    return 0;
  }
}

/**
 * Process batch of emails sent directly from React app
 */
function processBatchEmails(emailRows) {
  let processed = 0;
  
  emailRows.forEach(emailData => {
    try {
      const success = sendEmail(emailData);
      if (success) {
        processed++;
        Logger.log(`✅ Sent batch email to ${emailData.to}`);
      } else {
        Logger.log(`❌ Failed to send batch email to ${emailData.to}`);
      }
    } catch (error) {
      Logger.log(`Error sending batch email: ${error.toString()}`);
    }
  });
  
  return processed;
}

/**
 * Send individual email using Gmail API
 */
function sendEmail(emailData) {
  try {
    // Validate email data
    if (!emailData.to || !emailData.subject) {
      Logger.log('Invalid email data: missing to or subject');
      return false;
    }
    
    // Prepare email options
    const emailOptions = {
      htmlBody: emailData.htmlBody || emailData.body || '',
      name: 'Troop 468 System'
    };
    
    // Add attachments if specified
    if (emailData.attachments) {
      emailOptions.attachments = emailData.attachments;
    }
    
    // Send the email
    GmailApp.sendEmail(
      emailData.to,
      emailData.subject,
      '', // Plain text body (empty since we're using HTML)
      emailOptions
    );
    
    return true;
    
  } catch (error) {
    Logger.log(`Error sending email to ${emailData.to}: ${error.toString()}`);
    return false;
  }
}

/**
 * Generate approval email HTML body
 */
function generateApprovalEmailBody(recipientName, role, invitationToken) {
  const isScout = role === 'scout';
  const roleText = isScout ? 'scout' : 'parent/guardian';
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #6BA6CD; color: white; padding: 20px; text-align: center;">
        <h1>Welcome to Troop 468!</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p>Dear ${recipientName},</p>
        
        <p>Congratulations! Your registration as a ${roleText} with Troop 468 has been approved.</p>
        
        ${isScout ? `
          <p>We're excited to have you join our scouting family! Here's what happens next:</p>
          <ul>
            <li>You'll receive information about upcoming meetings and activities</li>
            <li>Our leadership team will contact you with orientation details</li>
            <li>You can start participating in troop activities right away</li>
          </ul>
        ` : `
          <p>Thank you for supporting your scout's journey with Troop 468. As a parent/guardian, you're an important part of our scouting community.</p>
          <ul>
            <li>You'll receive updates about troop activities and events</li>
            <li>We encourage your participation in troop functions</li>
            <li>Feel free to reach out with any questions or concerns</li>
          </ul>
        `}
        
        <div style="background-color: #e8f4f8; padding: 15px; margin: 20px 0; border-left: 4px solid #6BA6CD;">
          <h3>Next Steps:</h3>
          <p>Keep an eye on your email for important updates and meeting information. We'll be in touch soon with more details about getting started.</p>
        </div>
        
        <p>If you have any questions, please don't hesitate to contact us at: 
        <a href="mailto:troop468.system@gmail.com">troop468.system@gmail.com</a></p>
        
        <p>Welcome to the adventure!</p>
        
        <p>Best regards,<br>
        <strong>Troop 468 Leadership Team</strong></p>
      </div>
      
      <div style="background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
        <p>This email was sent by the Troop 468 automated system. 
        Please contact us at: <a href="mailto:troop468.system@gmail.com">troop468.system@gmail.com</a></p>
      </div>
    </div>
  `;
}

/**
 * Set up time-driven trigger to process email queue every 5 minutes
 * Run this function once manually to set up the trigger
 */
function setupEmailTrigger() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'processEmailQueue') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger to run every 5 minutes
  ScriptApp.newTrigger('processEmailQueue')
    .timeBased()
    .everyMinutes(5)
    .create();
    
  Logger.log('Email processing trigger set up successfully');
}

/**
 * Manual test function - run this to test email sending
 */
function testEmailSending() {
  try {
    console.log('Testing email sending...');
    
    // Test email data
    const testEmail = {
      to: 'test@troop468.com',
      subject: 'Test Email from Apps Script',
      htmlBody: generateApprovalEmailBody('Test User', 'scout', 'test-token'),
      type: 'TEST'
    };
    
    const success = sendEmail(testEmail);
    
    if (success) {
      console.log('✅ Test email sent successfully');
    } else {
      console.log('❌ Test email failed');
    }
    
    // Test queue processing
    console.log('Testing queue processing...');
    const processed = processEmailQueue();
    console.log(`Processed ${processed} emails from queue`);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

/**
 * Get email queue status for monitoring
 */
function getEmailQueueStatus() {
  try {
    const sheet = SpreadsheetApp.openById(EMAIL_QUEUE_SHEET_ID).getSheetByName(EMAIL_QUEUE_SHEET_NAME);
    
    if (!sheet) {
      return { error: 'EmailQueue sheet not found' };
    }
    
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    if (values.length <= 1) {
      return { total: 0, pending: 0, sent: 0, failed: 0 };
    }
    
    const headers = values[0];
    const rows = values.slice(1);
    const statusCol = headers.indexOf('status');
    
    if (statusCol === -1) {
      return { error: 'Status column not found' };
    }
    
    const stats = { total: rows.length, pending: 0, sent: 0, failed: 0 };
    
    rows.forEach(row => {
      const status = row[statusCol];
      if (status === 'PENDING') stats.pending++;
      else if (status === 'SENT') stats.sent++;
      else if (status === 'FAILED') stats.failed++;
    });
    
    return stats;
    
  } catch (error) {
    return { error: error.toString() };
  }
}

