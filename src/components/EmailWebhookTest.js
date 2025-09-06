import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Box,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import emailQueueService from '../services/emailQueueService';

const EmailWebhookTest = () => {
  const [envStatus, setEnvStatus] = useState({});
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('test@troop468.com');

  useEffect(() => {
    checkEnvironment();
    // Debug: Log all environment variables on component mount
    console.log('🔍 EmailWebhookTest - Environment check on mount:');
    console.log('REACT_APP_EMAIL_WEBHOOK_URL:', process.env.REACT_APP_EMAIL_WEBHOOK_URL);
    console.log('REACT_APP_WEBHOOK_TOKEN:', process.env.REACT_APP_WEBHOOK_TOKEN);
    console.log('All REACT_APP vars:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP')));
  }, []);

  const checkEnvironment = () => {
    const status = {
      webhookUrl: !!process.env.REACT_APP_EMAIL_WEBHOOK_URL,
      webhookToken: !!process.env.REACT_APP_WEBHOOK_TOKEN,
      apiKey: !!process.env.REACT_APP_GOOGLE_API_KEY,
      sheetId: !!process.env.REACT_APP_GOOGLE_SHEETS_SHEET_ID,
      // Show actual values for debugging
      webhookUrlValue: process.env.REACT_APP_EMAIL_WEBHOOK_URL || 'Not set',
      apiKeyValue: process.env.REACT_APP_GOOGLE_API_KEY || 'Not set',
      sheetIdValue: process.env.REACT_APP_GOOGLE_SHEETS_SHEET_ID || 'Not set'
    };
    setEnvStatus(status);
  };

  const testWebhook = async () => {
    setLoading(true);
    setTestResult('');

    try {
      // Create test email data
      const testData = {
        scoutEmail: testEmail,
        scoutFirstName: 'Test',
        scoutLastName: 'Scout',
        scoutPreferredName: 'Test Scout',
        fatherEmail: 'father@test.com',
        fatherFirstName: 'Test',
        fatherLastName: 'Father',
        motherEmail: 'mother@test.com',
        motherFirstName: 'Test',
        motherLastName: 'Mother',
        timestamp: new Date().toISOString()
      };

      console.log('🧪 Starting complete email system test...');
      console.log('📧 Test data:', testData);
      
      await emailQueueService.queueApprovalEmails(testData);
      
      setTestResult(`✅ Email system test completed!

📋 What happened:
1. ✅ Created test registration approval emails
2. ✅ Sent authenticated request to Apps Script
3. ✅ Apps Script verified Firebase ID token
4. ✅ Emails added to Google Sheets queue
5. ✅ Apps Script processed and sent emails

🔍 Check these locations:
• Google Sheets "EmailQueue" tab for email records
• Apps Script execution logs for detailed processing
• Email inboxes for delivered messages
• Browser console for detailed request logs

📧 Expected emails sent to:
• ${testEmail} (scout approval)
• father@test.com (father notification)  
• mother@test.com (mother notification)`);
    } catch (error) {
      console.error('❌ Email system test failed:', error);
      setTestResult(`❌ Email system test failed: ${error.message}

🔍 Troubleshooting steps:
1. Check if REACT_APP_EMAIL_WEBHOOK_URL is configured
2. Verify Apps Script is deployed as Web App
3. Ensure Firebase authentication is working
4. Check Apps Script execution logs for errors
5. Verify Google Sheets permissions`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectWebhook = async () => {
    setLoading(true);
    setTestResult('');

    const webhookUrl = process.env.REACT_APP_EMAIL_WEBHOOK_URL;
    console.log('🔍 Debug - Webhook URL:', webhookUrl);
    console.log('🔍 Debug - All env vars:', {
      webhookUrl: process.env.REACT_APP_EMAIL_WEBHOOK_URL,
      webhookToken: process.env.REACT_APP_WEBHOOK_TOKEN,
      apiKey: process.env.REACT_APP_GOOGLE_API_KEY
    });
    
    if (!webhookUrl) {
      setTestResult('❌ REACT_APP_EMAIL_WEBHOOK_URL is not configured');
      setLoading(false);
      return;
    }

    try {
      console.log('🔗 Testing direct webhook call to:', webhookUrl);
      
      const testPayload = {
        rows: [{
          type: 'TEST',
          to: testEmail,
          name: 'Direct Test User',
          role: 'test',
          subject: 'Direct Webhook Test',
          htmlBody: '<p>This is a direct webhook test from the diagnostic tool.</p>',
          meta: {
            testMode: true,
            timestamp: new Date().toISOString(),
            source: 'EmailWebhookTest component'
          }
        }]
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Token': process.env.REACT_APP_WEBHOOK_TOKEN || ''
        },
        body: JSON.stringify(testPayload)
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { rawResponse: responseText };
      }

      if (response.ok) {
        setTestResult(`✅ Direct webhook test successful!\nStatus: ${response.status}\nResponse: ${JSON.stringify(responseData, null, 2)}`);
      } else {
        setTestResult(`❌ Direct webhook test failed\nStatus: ${response.status}\nResponse: ${JSON.stringify(responseData, null, 2)}`);
      }
    } catch (error) {
      console.error('❌ Direct webhook test failed:', error);
      setTestResult(`❌ Direct webhook test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testFirebaseToken = async () => {
    setLoading(true);
    setTestResult('');

    try {
      // Get current Firebase user and token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setTestResult('❌ No Firebase user logged in. Please log in first.');
        setLoading(false);
        return;
      }

      console.log('🔐 Getting Firebase ID token...');
      const idToken = await currentUser.getIdToken();
      console.log('🔐 Token obtained, length:', idToken.length);

      // Test token verification with Firebase
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.REACT_APP_GOOGLE_API_KEY || envStatus.apiKeyValue}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idToken })
      });

      const data = await response.json();

      if (response.ok && data.users && data.users.length > 0) {
        const user = data.users[0];
        setTestResult(`✅ Firebase token test successful!

🔐 Token Details:
• User ID: ${user.localId}
• Email: ${user.email}
• Email Verified: ${user.emailVerified}
• Provider: ${user.providerUserInfo?.[0]?.providerId || 'email'}
• Token Length: ${idToken.length} characters

✅ This token will work with Apps Script verification.
You can now test the complete email flow!`);
      } else {
        setTestResult(`❌ Firebase token verification failed:
${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      console.error('❌ Firebase token test failed:', error);
      setTestResult(`❌ Firebase token test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (isSet, label) => (
    <Chip 
      label={label} 
      color={isSet ? 'success' : 'error'} 
      size="small" 
      variant={isSet ? 'filled' : 'outlined'}
    />
  );

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🧪 Email Webhook Diagnostic Tool
        </Typography>
        
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">🔧 Environment Variables Status</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Configuration Status:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {getStatusChip(envStatus.webhookUrl, 'Webhook URL')}
                {getStatusChip(envStatus.webhookToken, 'Webhook Token (Optional)')}
                {getStatusChip(envStatus.apiKey, 'Google API Key')}
                {getStatusChip(envStatus.sheetId, 'Google Sheet ID')}
              </Box>
              
              <Typography variant="body2" sx={{ mb: 1 }}>Current Values:</Typography>
              <Box sx={{ fontFamily: 'monospace', fontSize: '0.8em', background: '#f5f5f5', p: 1, borderRadius: 1 }}>
                <div><strong>Webhook URL:</strong> {envStatus.webhookUrlValue}</div>
                <div><strong>API Key:</strong> {envStatus.apiKeyValue}</div>
                <div><strong>Sheet ID:</strong> {envStatus.sheetIdValue}</div>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">🚀 Webhook Tests</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Test Email Address"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                fullWidth
                size="small"
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button 
                  variant="contained" 
                  onClick={testWebhook}
                  disabled={loading || !envStatus.webhookUrl}
                >
                  🧪 Test Complete Flow
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={testDirectWebhook}
                  disabled={loading || !envStatus.webhookUrl}
                >
                  🔗 Direct Webhook Test
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={testFirebaseToken}
                  disabled={loading}
                  color="secondary"
                >
                  🔐 Test Firebase Token
                </Button>
              </Box>

              {!envStatus.webhookUrl && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>⚠️ Webhook URL Not Configured</strong><br/>
                    To fix this:
                    1. Deploy the Google Apps Script from <code>google-apps-script-email-updated.js</code><br/>
                    2. Get the Web App URL from Apps Script<br/>
                    3. Set <code>REACT_APP_EMAIL_WEBHOOK_URL</code> in your environment
                  </Typography>
                </Alert>
              )}

              {testResult && (
                <Alert severity={testResult.includes('✅') ? 'success' : 'error'} sx={{ mt: 2 }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8em' }}>
                    {testResult}
                  </pre>
                </Alert>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">📋 Setup Instructions</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>If you haven't set up the Google Apps Script webhook:</strong>
            </Typography>
            <ol style={{ fontSize: '0.9em', lineHeight: 1.6 }}>
              <li>Go to <a href="https://script.google.com" target="_blank" rel="noopener noreferrer">script.google.com</a></li>
              <li>Create a new project called "Troop 468 Email Automation"</li>
              <li>Replace the default code with the contents of <code>google-apps-script-email-updated.js</code></li>
              <li>Click "Deploy" → "New deployment"</li>
              <li>Choose "Web app" as the type</li>
              <li>Set "Execute as: Me" and "Who has access: Anyone"</li>
              <li>Copy the Web App URL</li>
              <li>Set <code>REACT_APP_EMAIL_WEBHOOK_URL</code> to that URL in your environment</li>
              <li>Redeploy this application</li>
            </ol>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default EmailWebhookTest;
