import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Box,
  TextField,
  CircularProgress,
  Divider
} from '@mui/material';

const HardcodedWebhookTest = () => {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('test@troop468.com');

  // Apps Script URL - Updated with new deployment
  const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbw-aVzwxQvz5tD-XqRjyGOR9LVvn1XlGUtbjmEQRjiW0Dc-O9tRum8QKaqNkXEjAnkQ/exec';
//   const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxJA7n3OdLss2IZyVLdAKEik0vIZMxOIwAaCav0aIPnfAeLQDLsjk17ktj5tI4oL6Y8/exec';

  const testBasicConnection = async () => {
    setLoading(true);
    setTestResult('');

    try {
      console.log('🔗 Testing basic connection to hardcoded URL:', WEBHOOK_URL);
      
      const testPayload = {
        test: 'basic connection',
        timestamp: new Date().toISOString()
      };

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify(testPayload)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', [...response.headers.entries()]);

      const responseText = await response.text();
      console.log('📡 Raw response:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { rawResponse: responseText };
      }

      if (response.ok) {
        setTestResult(`✅ Basic connection test successful!
        
Status: ${response.status}
Response: ${JSON.stringify(responseData, null, 2)}`);
      } else {
        setTestResult(`❌ Basic connection test failed
        
Status: ${response.status}
Response: ${JSON.stringify(responseData, null, 2)}`);
      }
    } catch (error) {
      console.error('❌ Basic connection test failed:', error);
      setTestResult(`❌ Basic connection test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

    const testEmailQueueFlow = async () => {
    setLoading(true);
    setTestResult('');

    try {
      console.log('📧 Testing single email to Google Sheets...');
      
      // Create a single email object (not in 'rows' array)
      const emailPayload = {
        type: 'TEST',
        from: 'test@troop468.com',
        to: testEmail,
        cc: 'cc@troop468.com',
        subject: 'Test Email from Settings Page',
        htmlBody: '<p>This is a test email sent from the Settings page diagnostic tool.</p><p>Timestamp: ' + new Date().toISOString() + '</p>',
        mon: 'fasle',
        tue: 'false',
        wed: 'fasle',
        thu: 'false',
        fri: 'fasle',
        sat: 'false',
        sun: 'false',
        stopDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      };

      console.log('📤 Sending email payload:', emailPayload);

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify(emailPayload)
      });

      console.log('📡 Email response status:', response.status);

      const responseText = await response.text();
      console.log('📡 Email raw response:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { rawResponse: responseText };
      }

      if (response.ok) {
        setTestResult(`✅ Email saved to Google Sheets successfully!

📧 Email Record Details:
• Type: ${emailPayload.type}
• From: ${emailPayload.from}
• To: ${emailPayload.to}
• CC: ${emailPayload.cc}
• Subject: ${emailPayload.subject}
• Repeat Schedule: Mon, Wed, Fri until ${new Date(emailPayload.stopDate).toLocaleDateString()}

📡 Server Response:
Status: ${response.status}
${responseData.success ? '✅ Success: ' + responseData.message : '❌ Error: ' + responseData.error}

📊 Sheet Details:
${responseData.result ? `• Row Number: ${responseData.result.rowNumber}
• Range: ${responseData.result.range}
• Repeat Enabled: ${responseData.result.email.repeat ? 'Yes' : 'No'}` : 'No result details available'}

🔍 Verification:
1. Check Google Sheets EmailQueue tab for the new record
2. Check Apps Script execution logs for processing details
3. Verify email scheduling is configured correctly

📊 Google Sheets URL: https://docs.google.com/spreadsheets/d/1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM/edit?gid=0#gid=0`);
      } else {
        setTestResult(`❌ Email save failed

Status: ${response.status}
Response: ${JSON.stringify(responseData, null, 2)}`);
      }
    } catch (error) {
      console.error('❌ Email queue flow test failed:', error);
      setTestResult(`❌ Email queue flow test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testCompleteRegistrationFlow = async () => {
    setLoading(true);
    setTestResult('');

    try {
      console.log('🎯 Testing complete registration approval flow...');
      
      // Simulate a complete registration approval email
      const registrationPayload = {
        rows: [
          {
            type: 'REGISTRATION_APPROVAL',
            to: 'parent@troop468.com',
            name: 'Test Parent',
            role: 'parent',
            subject: 'Scout Registration Approved - Welcome to Troop 468!',
            htmlBody: `
              <h2>🎉 Registration Approved!</h2>
              <p>Dear Test Parent,</p>
              <p>We're excited to welcome <strong>Test Scout</strong> to Troop 468!</p>
              <h3>Next Steps:</h3>
              <ul>
                <li>Attend the next troop meeting on Monday at 7:00 PM</li>
                <li>Complete the medical forms</li>
                <li>Order your scout handbook</li>
              </ul>
              <p>Welcome to the adventure!</p>
              <p><strong>Troop 468 Leadership</strong></p>
            `,
            status: 'PENDING',
            meta: {
              testMode: true,
              timestamp: new Date().toISOString(),
              source: 'HardcodedWebhookTest - Registration Flow',
              scoutName: 'Test Scout',
              parentEmail: 'parent@troop468.com'
            }
          },
          {
            type: 'REGISTRATION_NOTIFICATION',
            to: 'scoutmaster@troop468.com',
            name: 'Scoutmaster',
            role: 'leader',
            subject: 'New Scout Registration: Test Scout',
            htmlBody: `
              <h2>📋 New Scout Registration</h2>
              <p>A new scout has been approved and registered:</p>
              <ul>
                <li><strong>Scout Name:</strong> Test Scout</li>
                <li><strong>Parent Email:</strong> parent@troop468.com</li>
                <li><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</li>
              </ul>
              <p>Please follow up with the family for next steps.</p>
            `,
            status: 'PENDING',
            meta: {
              testMode: true,
              timestamp: new Date().toISOString(),
              source: 'HardcodedWebhookTest - Registration Flow',
              scoutName: 'Test Scout'
            }
          }
        ]
      };

      console.log('📤 Sending registration payload:', registrationPayload);

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify(registrationPayload)
      });

      console.log('📡 Registration response status:', response.status);

      const responseText = await response.text();
      console.log('📡 Registration raw response:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { rawResponse: responseText };
      }

      if (response.ok) {
        setTestResult(`✅ Complete registration flow test successful!
        
📧 Email Records Created:
1. Registration Approval Email → parent@troop468.com
2. Leadership Notification → scoutmaster@troop468.com

📡 Server Response:
Status: ${response.status}
Data: ${JSON.stringify(responseData, null, 2)}

🎯 What This Tests:
• Multiple email records in one request
• Different email types (approval + notification)
• Rich HTML email content
• Metadata tracking
• Complete registration workflow

🔍 Verification Steps:
1. Check Google Sheets for 2 new email records
2. Verify both emails have PENDING status
3. Check Apps Script execution logs
4. Confirm email content is properly formatted

📊 Google Sheets URL: https://docs.google.com/spreadsheets/d/1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM/edit?gid=759662525#gid=759662525`);
      } else {
        setTestResult(`❌ Complete registration flow test failed
        
Status: ${response.status}
Response: ${JSON.stringify(responseData, null, 2)}`);
      }
    } catch (error) {
      console.error('❌ Registration flow test failed:', error);
      setTestResult(`❌ Registration flow test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          📧 Email System Test & Google Sheets Integration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Test email sending to Google Sheets and trigger email processing. Use this to verify your email system is working correctly.
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Apps Script URL:
          </Typography>
          <Typography variant="body2" sx={{ 
            fontFamily: 'monospace', 
            fontSize: '0.8rem',
            wordBreak: 'break-all',
            backgroundColor: '#f5f5f5',
            padding: 1,
            borderRadius: 1
          }}>
            {WEBHOOK_URL}
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="Test Email Address"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          sx={{ mb: 2 }}
          size="small"
        />

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Button
            variant="contained"
            onClick={testBasicConnection}
            disabled={loading}
            size="small"
          >
            {loading ? <CircularProgress size={20} /> : '🔗 Test Connection'}
          </Button>
          
          <Button
            variant="contained"
            color="success"
            onClick={testEmailQueueFlow}
            disabled={loading}
            size="small"
          >
            {loading ? <CircularProgress size={20} /> : '📧 Send Test Email to Sheets'}
          </Button>
          
          <Button
            variant="outlined"
            color="secondary"
            onClick={testCompleteRegistrationFlow}
            disabled={loading}
            size="small"
          >
            {loading ? <CircularProgress size={20} /> : '🎯 Advanced Multi-Email Test'}
          </Button>
        </Box>

        {testResult && (
          <>
            <Divider sx={{ my: 2 }} />
            <Alert 
              severity={testResult.includes('✅') ? 'success' : 'error'}
              sx={{ mt: 2 }}
            >
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                margin: 0
              }}>
                {testResult}
              </pre>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default HardcodedWebhookTest;
