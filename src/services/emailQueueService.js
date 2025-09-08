// Email Queue Service - Writes to Google Sheets for Apps Script processing
class EmailQueueService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
    this.emailQueueSheetId = process.env.REACT_APP_GOOGLE_SHEETS_SHEET_ID;
    this.emailQueueRange = 'EmailQueue!A:Z'; // We'll create an EmailQueue tab
    this.webhookUrl = process.env.REACT_APP_EMAIL_WEBHOOK_URL; // Apps Script Web App URL
    
    // Use the working webhook URL from SimpleEmailTest
    this.workingWebhookUrl = 'https://script.google.com/macros/s/AKfycbx9PRWvVJCEIqxivmz1PpT0yfjaM-LU5LqEfKWt-hBqwQIYYkaZdX2GiSYxynT2QLtK/exec';
  }

  // Queue approval emails by writing to Google Sheets
  async queueApprovalEmails(requestData) {
    try {
      console.log('📧 Queuing approval emails to Google Sheets...');
      console.log('🔗 Webhook URL configured:', !!this.webhookUrl);
      console.log('🔑 API Key configured:', !!this.apiKey);
      
      if (!this.webhookUrl && !this.apiKey) {
        throw new Error('No email service configured. Please set REACT_APP_EMAIL_WEBHOOK_URL or REACT_APP_GOOGLE_API_KEY in environment variables.');
      }
      
      const emailRows = [];
      const timestamp = new Date().toISOString();
      
      // Scout email row
      if (requestData.scoutEmail) {
        const scoutName = requestData.scoutPreferredName || 
          `${requestData.scoutFirstName} ${requestData.scoutLastName}`;
        
        emailRows.push([
          timestamp,
          'APPROVAL',
          requestData.scoutEmail,
          scoutName,
          'scout',
          `Welcome to Troop 468, ${scoutName}!`,
          this.generateApprovalEmailBody(scoutName, 'scout', requestData.scoutEmail),
          'PENDING',
          JSON.stringify(requestData) // Full data for reference
        ]);
      }
      
      // Father email row (if included)
      if (requestData.includeFather && requestData.fatherEmail) {
        const fatherName = requestData.fatherPreferredName || 
          `${requestData.fatherFirstName} ${requestData.fatherLastName}`;
        
        emailRows.push([
          timestamp,
          'APPROVAL',
          requestData.fatherEmail,
          fatherName,
          'parent',
          `Welcome to Troop 468, ${fatherName}!`,
          this.generateApprovalEmailBody(fatherName, 'parent', requestData.fatherEmail),
          'PENDING',
          JSON.stringify(requestData)
        ]);
      }
      
      // Mother email row (if included)
      if (requestData.includeMother && requestData.motherEmail) {
        const motherName = requestData.motherPreferredName || 
          `${requestData.motherFirstName} ${requestData.motherLastName}`;
        
        emailRows.push([
          timestamp,
          'APPROVAL',
          requestData.motherEmail,
          motherName,
          'parent',
          `Welcome to Troop 468, ${motherName}!`,
          this.generateApprovalEmailBody(motherName, 'parent', requestData.motherEmail),
          'PENDING',
          JSON.stringify(requestData)
        ]);
      }
      
      // Use the working webhook approach (same as SimpleEmailTest)
      for (const row of emailRows) {
        const emailPayload = {
          type: row[1], // 'APPROVAL'
          to: row[2],   // recipient email
          cc: '',       // No CC for approval emails
          subject: row[5], // subject
          htmlBody: row[6], // HTML body
          mon: 'false', // One-time email, no repeats
          tue: 'false',
          wed: 'false',
          thu: 'false',
          fri: 'false',
          sat: 'false',
          sun: 'false',
          stopDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
        };

        console.log('📤 Sending approval email payload:', emailPayload);

        const response = await fetch(this.workingWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain' // Using text/plain to avoid CORS preflight
          },
          body: JSON.stringify(emailPayload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ HTTP Error Response:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const responseData = await response.json();
        console.log('✅ Approval email sent successfully:', responseData);
      }
      
      console.log(`✅ Queued ${emailRows.length} approval emails to Google Sheets`);
      console.log('📧 Google Apps Script will automatically send these emails');
      
      return {
        success: true,
        emailsQueued: emailRows.length,
        message: 'Approval emails queued successfully'
      };
      
    } catch (error) {
      console.error('❌ Error queuing approval emails:', error);
      throw error;
    }
  }

  // Queue rejection emails by writing to Google Sheets
  async queueRejectionEmails(requestData, reason = '') {
    try {
      console.log('📧 Queuing rejection emails to Google Sheets...');
      
      const emailRows = [];
      const timestamp = new Date().toISOString();
      const scoutFullName = `${requestData.scoutFirstName} ${requestData.scoutLastName}`;
      
      // Collect all recipients
      const recipients = [];
      
      if (requestData.scoutEmail) {
        const scoutName = requestData.scoutPreferredName || scoutFullName;
        recipients.push({ email: requestData.scoutEmail, name: scoutName });
      }
      
      if (requestData.includeFather && requestData.fatherEmail) {
        const fatherName = requestData.fatherPreferredName || 
          `${requestData.fatherFirstName} ${requestData.fatherLastName}`;
        recipients.push({ email: requestData.fatherEmail, name: fatherName });
      }
      
      if (requestData.includeMother && requestData.motherEmail) {
        const motherName = requestData.motherPreferredName || 
          `${requestData.motherFirstName} ${requestData.motherLastName}`;
        recipients.push({ email: requestData.motherEmail, name: motherName });
      }
      
      // Create email rows for each recipient
      recipients.forEach(recipient => {
        emailRows.push([
          timestamp,
          'REJECTION',
          recipient.email,
          recipient.name,
          'notification',
          `Troop 468 Registration Update`,
          this.generateRejectionEmailBody(recipient.name, scoutFullName, reason),
          'PENDING',
          JSON.stringify(requestData)
        ]);
      });
      
      if (this.webhookUrl) {
        await this.postToWebhook(
          emailRows.map(r => ({
            type: r[1], to: r[2], name: r[3], role: r[4], subject: r[5], htmlBody: r[6], meta: JSON.parse(r[8])
          }))
        );
      } else {
        await this.appendRowsToSheet(emailRows);
      }
      
      console.log(`✅ Queued ${emailRows.length} rejection emails to Google Sheets`);
      console.log('📧 Google Apps Script will automatically send these emails');
      
      return {
        success: true,
        emailsQueued: emailRows.length,
        message: 'Rejection emails queued successfully'
      };
      
    } catch (error) {
      console.error('❌ Error queuing rejection emails:', error);
      throw error;
    }
  }

  // Append rows to Google Sheets
  async appendRowsToSheet(rows) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.emailQueueSheetId}/values/${this.emailQueueRange}:append`;
      
      const response = await fetch(`${url}?valueInputOption=RAW&key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: rows
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to write to Google Sheets: ${response.status} - ${errorData}`);
      }
      
      const result = await response.json();
      console.log('📊 Successfully wrote to Google Sheets:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error writing to Google Sheets:', error);
      throw error;
    }
  }

  // Post rows to Apps Script webhook
  async postToWebhook(items) {
    console.log('📤 Posting to webhook:', this.webhookUrl);
    console.log('📦 Payload:', { rows: items });
    
    try {
      // Get Firebase ID token for authentication
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not authenticated - cannot send emails');
      }
      
      const idToken = await currentUser.getIdToken();
      console.log('🔐 Firebase ID token obtained for authentication');
      
      const headers = {
        'Content-Type': 'application/json',
        'X-Firebase-IdToken': idToken
      };
      
      // Add webhook token if configured
      const webhookToken = process.env.REACT_APP_WEBHOOK_TOKEN;
      if (webhookToken) {
        headers['X-Webhook-Token'] = webhookToken;
        console.log('🔑 Webhook token added to headers');
      }
      
      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ rows: items })
      });
      
      console.log('📡 Response status:', res.status);
      
      if (!res.ok) {
        const txt = await res.text();
        console.error('❌ Webhook error response:', txt);
        throw new Error(`Webhook error ${res.status}: ${txt}`);
      }
      
      const result = await res.json();
      console.log('✅ Webhook success:', result);
      return result;
    } catch (error) {
      console.error('❌ Webhook request failed:', error);
      throw new Error(`Failed to connect to email webhook: ${error.message}`);
    }
  }

  // Generate approval email HTML body
  generateApprovalEmailBody(recipientName, role, userEmail) {
    const isScout = role === 'scout';
    const roleText = isScout ? 'scout' : 'parent/guardian';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Welcome to Troop 468!</h2>
        
        <p>Dear ${recipientName},</p>
        
        <p>Great news! Your registration request for Troop 468 has been <strong>approved</strong>.</p>
        
        <p>As a ${roleText}, you now have access to the Troop 468 management system.</p>
        
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1976d2; margin-top: 0;">Next Steps:</h3>
          <ol>
            <li>Go to the Troop 468 website</li>
            <li>Click "Forgot Password" to set up your password</li>
            <li>Use your email address: <strong>${userEmail}</strong></li>
            <li>Check your email for password reset instructions</li>
            <li>Log in and start using the system!</li>
          </ol>
        </div>
        
        <p style="text-align: center; margin: 30px 0;">
          <a href="https://troop-468.web.app/login" 
             style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Go to Troop 468 Login
          </a>
        </p>
        
        <p><strong>Your Account Details:</strong></p>
        <ul>
          <li><strong>Email:</strong> ${userEmail}</li>
          <li><strong>Role:</strong> ${roleText}</li>
          <li><strong>Status:</strong> Active</li>
        </ul>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 14px;">
          If you have any questions or need assistance, please contact us at: 
          <a href="mailto:troop468.system@gmail.com">troop468.system@gmail.com</a>
        </p>
        
        <p style="color: #666; font-size: 14px;">
          Welcome to the Troop 468 family!<br>
          The Troop 468 Leadership Team
        </p>
      </div>
    `;
  }

  // Queue invitation email for new user account setup
  async queueInvitationEmail({ to, name, isGmail, setupUrl, userData }) {
    try {
      console.log('📧 Queuing invitation email for:', to);
      
      // Use the same working approach as SimpleEmailTest
      const emailPayload = {
        type: 'INVITATION',
        to: to,
        cc: '', // No CC for invitations
        subject: 'Welcome to Troop 468 - Complete Your Account Setup',
        htmlBody: this.generateInvitationEmailBody(name, isGmail, setupUrl, userData),
        plainTextBody: this.generateInvitationPlainTextBody(name, isGmail, setupUrl, userData),
        mon: 'false', // One-time email, no repeats
        tue: 'false',
        wed: 'false',
        thu: 'false',
        fri: 'false',
        sat: 'false',
        sun: 'false',
        stopDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      };

      console.log('📤 Sending invitation email payload:', emailPayload);

      const response = await fetch(this.workingWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain' // Using text/plain to avoid CORS preflight
        },
        body: JSON.stringify(emailPayload)
      });

      console.log('📨 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      console.log('✅ Invitation email sent successfully:', responseData);
      
      return {
        success: true,
        message: 'Invitation email queued successfully',
        response: responseData
      };
      
    } catch (error) {
      console.error('❌ Error queuing invitation email:', error);
      throw error;
    }
  }

  // Generate invitation email HTML body
  generateInvitationEmailBody(recipientName, isGmail, setupUrl, userData) {
    const roleText = userData.roles?.includes('scout') ? 'scout' : 'parent/guardian';
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Welcome to Troop 468!</h2>
        
        <p>Dear ${recipientName},</p>
        
        <p>Great news! Your registration for Troop 468 has been <strong>approved</strong>.</p>
        
        <p>As a ${roleText}, you now have access to the Troop 468 management system.</p>
        
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1976d2; margin-top: 0;">Complete Your Account Setup</h3>
          <p>Click the button below to complete your account setup:</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${setupUrl}" 
               style="background-color: #4caf50; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Complete Account Setup
            </a>
          </div>
          
          ${isGmail ? `
            <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <strong>📧 Gmail User:</strong> You can sign in using your Google account - no password needed!
            </div>
          ` : `
            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <strong>🔐 Account Setup:</strong> You'll be able to set up your password on the next page.
            </div>
          `}
          
          <p><strong>This link will expire in 24 hours</strong> and can only be used once.</p>
        </div>
        
        <p><strong>Your Account Details:</strong></p>
        <ul>
          <li><strong>Email:</strong> ${userData.email}</li>
          <li><strong>Role:</strong> ${roleText}</li>
          <li><strong>Status:</strong> Approved</li>
        </ul>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 12px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${setupUrl}">${setupUrl}</a>
        </p>
        
        <p style="color: #666; font-size: 14px;">
          If you have any questions or need assistance, please contact us at: 
          <a href="mailto:troop468.system@gmail.com">troop468.system@gmail.com</a>
        </p>
        
        <p style="color: #666; font-size: 14px;">
          Welcome to the Troop 468 family!<br>
          The Troop 468 Leadership Team
        </p>
      </div>
    `;
  }

  // Generate invitation email plain text body (for better deliverability)
  generateInvitationPlainTextBody(recipientName, isGmail, setupUrl, userData) {
    const roleText = userData.roles?.includes('scout') ? 'scout' : 'parent/guardian';
    
    return `
Welcome to Troop 468!

Dear ${recipientName},

Great news! Your registration for Troop 468 has been approved.

As a ${roleText}, you now have access to the Troop 468 management system.

COMPLETE YOUR ACCOUNT SETUP
Click this link to complete your account setup:
${setupUrl}

${isGmail ? `
GMAIL USER: You can sign in using your Google account - no password needed!
` : `
ACCOUNT SETUP: You'll be able to set up a secure password for your account.
`}

Once your account is set up, you'll have access to:
• Scout information and updates
• Event calendar and RSVP
• Communication with troop leadership
• Merit badge tracking
• And much more!

If you have any questions or need assistance, please contact us at:
troop468.system@gmail.com

Welcome to the Troop 468 family!

Best regards,
The Troop 468 Leadership Team

---
This is an automated message from the Troop 468 Management System.
If you received this email in error, please contact troop468.system@gmail.com
    `.trim();
  }

  // Generate rejection email HTML body
  generateRejectionEmailBody(recipientName, scoutName, reason = '') {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Troop 468 Registration Update</h2>
        
        <p>Dear ${recipientName},</p>
        
        <p>Thank you for your interest in Troop 468.</p>
        
        <p>After careful review, we regret to inform you that the registration request for <strong>${scoutName}</strong> cannot be approved at this time.</p>
        
        ${reason ? `
          <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; border-left: 4px solid #ff9800; margin: 20px 0;">
            <strong>Reason:</strong> ${reason}
          </div>
        ` : ''}
        
        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2e7d32; margin-top: 0;">Next Steps:</h3>
          <p>If you have questions about this decision or would like to discuss your application further, please don't hesitate to contact us.</p>
          <p>We're here to help and provide guidance on how you might reapply in the future.</p>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 14px;">
          <strong>Questions or concerns?</strong><br>
          Please contact us at: <a href="mailto:troop468.system@gmail.com">troop468.system@gmail.com</a>
        </p>
        
        <p style="color: #666; font-size: 14px;">
          Thank you for your understanding.<br>
          The Troop 468 Leadership Team
        </p>
      </div>
    `;
  }
}

// Export singleton instance
const emailQueueService = new EmailQueueService();
export default emailQueueService;
