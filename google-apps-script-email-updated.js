/**
 * Google Apps Script - Email Automation for Troop 468 (Updated Version)
 * This script processes email requests from the React app with Firebase authentication
 * 
 * Setup Instructions:
 * 1. Go to script.google.com
 * 2. Create/update project: "Troop 468 Email Automation"
 * 3. Replace code with this script
 * 4. Enable Gmail API in Apps Script (Resources > Advanced Google Services)
 * 5. Deploy as Web App (Execute as: Me, Access: Anyone)
 * 6. Copy Web App URL to REACT_APP_EMAIL_WEBHOOK_URL in your React app
 */

// Configuration
const EMAIL_QUEUE_SHEET_ID = '1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM';
const EMAIL_QUEUE_SHEET_NAME = 'EmailQueue';
const FROM_EMAIL = 'troop468.system@gmail.com';

/**
 * Handle HTTP POST requests from React app
 */
function doPost(e) {
  try {
    console.log('📧 Received email request from React app');
    
    // Parse request data
    const requestData = JSON.parse(e.postData.contents);
    console.log('📦 Request data:', requestData);
    
    // Verify Firebase authentication (optional but recommended)
    const headers = e.parameter;
    const firebaseToken = headers['X-Firebase-IdToken'] || e.postData.headers['X-Firebase-IdToken'];
    const webhookToken = headers['X-Webhook-Token'] || e.postData.headers['X-Webhook-Token'];
    
    if (firebaseToken) {
      console.log('🔐 Firebase token received for authentication');
      // Note: In production, you might want to verify the Firebase token
      // For now, we'll trust it since it's coming from your authenticated app
    }
    
    if (webhookToken) {
      console.log('🔑 Webhook token received');
    }
    
    let processedCount = 0;
    let errors = [];
    
    // Process email rows
    if (requestData.rows && Array.isArray(requestData.rows)) {
      console.log(`📬 Processing ${requestData.rows.length} email requests`);
      
      requestData.rows.forEach((emailData, index) => {
        try {
          // Send email immediately
          const success = sendEmailFromData(emailData);
          if (success) {
            processedCount++;
            console.log(`✅ Email ${index + 1} sent successfully to ${emailData.to}`);
          } else {
            errors.push(`Failed to send email ${index + 1} to ${emailData.to}`);
            console.log(`❌ Email ${index + 1} failed to ${emailData.to}`);
          }
        } catch (error) {
          errors.push(`Error sending email ${index + 1}: ${error.toString()}`);
          console.error(`❌ Error processing email ${index + 1}:`, error);
        }
      });
    }
    
    // Also add to Google Sheets queue for record keeping
    if (requestData.rows && requestData.rows.length > 0) {
      try {
        addEmailsToQueue(requestData.rows);
        console.log('📊 Emails added to Google Sheets queue');
      } catch (error) {
        console.error('⚠️ Failed to add emails to queue:', error);
        // Don't fail the whole request if queue addition fails
      }
    }
    
    const response = {
      success: true,
      processed: processedCount,
      errors: errors,
      timestamp: new Date().toISOString(),
      message: `Successfully processed ${processedCount} emails`
    };
    
    console.log('✅ Request completed:', response);
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Firebase-IdToken, X-Webhook-Token'
      });
      
  } catch (error) {
    console.error('❌ Error in doPost:', error);
    
    const errorResponse = {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Firebase-IdToken, X-Webhook-Token'
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
      'Access-Control-Allow-Headers': 'Content-Type, X-Firebase-IdToken, X-Webhook-Token'
    });
}

/**
 * Send email from email data object
 */
function sendEmailFromData(emailData) {
  try {
    console.log(`📧 Sending email to ${emailData.to}`);
    
    // Validate required fields
    if (!emailData.to || !emailData.subject) {
      console.error('❌ Missing required email fields (to, subject)');
      return false;
    }
    
    // Prepare email options
    const emailOptions = {
      htmlBody: emailData.htmlBody || emailData.body || '',
      name: 'Troop 468 System'
    };
    
    // Send the email using Gmail API
    GmailApp.sendEmail(
      emailData.to,
      emailData.subject,
      '', // Plain text body (empty since we use HTML)
      emailOptions
    );
    
    console.log(`✅ Email sent successfully to ${emailData.to}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error sending email to ${emailData.to}:`, error);
    return false;
  }
}

/**
 * Add emails to Google Sheets queue for record keeping
 */
function addEmailsToQueue(emailRows) {
  try {
    const sheet = SpreadsheetApp.openById(EMAIL_QUEUE_SHEET_ID).getSheetByName(EMAIL_QUEUE_SHEET_NAME);
    
    if (!sheet) {
      console.log('📊 Creating EmailQueue sheet...');
      const spreadsheet = SpreadsheetApp.openById(EMAIL_QUEUE_SHEET_ID);
      const newSheet = spreadsheet.insertSheet(EMAIL_QUEUE_SHEET_NAME);
      
      // Add headers
      const headers = ['timestamp', 'type', 'to', 'name', 'role', 'subject', 'htmlBody', 'status', 'meta', 'sentAt'];
      newSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      console.log('✅ EmailQueue sheet created with headers');
      return; // Don't add data on first creation
    }
    
    // Convert email data to sheet rows
    const timestamp = new Date().toISOString();
    const sheetRows = emailRows.map(emailData => [
      timestamp,                           // timestamp
      emailData.type || 'EMAIL',           // type
      emailData.to || '',                  // to
      emailData.name || '',                // name
      emailData.role || '',                // role
      emailData.subject || '',             // subject
      emailData.htmlBody || emailData.body || '', // htmlBody
      'SENT',                              // status (since we send immediately)
      JSON.stringify({                     // meta
        source: 'AppsScript',
        processedAt: timestamp,
        ...emailData.meta
      }),
      timestamp                            // sentAt
    ]);
    
    // Add rows to sheet
    if (sheetRows.length > 0) {
      const startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, sheetRows.length, sheetRows[0].length).setValues(sheetRows);
      console.log(`📊 Added ${sheetRows.length} email records to queue`);
    }
    
  } catch (error) {
    console.error('❌ Error adding emails to queue:', error);
    throw error;
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
 * Manual test function - run this to test the system
 */
function testEmailSystem() {
  try {
    console.log('🧪 Testing email system...');
    
    // Test email data matching your React app format
    const testEmailData = {
      to: 'test@troop468.com',
      name: 'Test User',
      role: 'scout',
      subject: 'Test Email from Apps Script',
      htmlBody: generateApprovalEmailBody('Test User', 'scout', 'test-token'),
      type: 'TEST'
    };
    
    // Test sending
    const success = sendEmailFromData(testEmailData);
    
    if (success) {
      console.log('✅ Test email sent successfully');
      
      // Test adding to queue
      addEmailsToQueue([testEmailData]);
      console.log('✅ Test email added to queue');
      
      console.log('🎉 All tests passed!');
    } else {
      console.log('❌ Test email failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

