import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Send as SendIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

const GoogleSheetsPostTest = () => {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [testEmail, setTestEmail] = useState('test@troop468.com');
  
  // Hardcoded Google Apps Script URL
  const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbx9PRWvVJCEIqxivmz1PpT0yfjaM-LU5LqEfKWt-hBqwQIYYkaZdX2GiSYxynT2QLtK/exec';

  const testGoogleSheetsPost = async () => {
    setLoading(true);
    setTestResult('');

    try {
      console.log('🔗 Testing POST request to Google Sheets...');
      
      // Create test email data matching your Google Apps Script format
      const emailPayload = {
        type: 'TEST',
        from: 'test@troop468.com',
        to: testEmail,
        cc: 'cc@troop468.com',
        subject: 'Test Email from Settings Page - ' + new Date().toLocaleString(),
        htmlBody: `
          <div style="font-family: Arial, sans-serif;">
            <h2>🧪 Test Email</h2>
            <p>This is a test email sent from the Settings page diagnostic tool.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Purpose:</strong> Testing Google Sheets integration</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              This email was generated automatically for testing purposes.
            </p>
          </div>
        `,
        mon: 'true',
        tue: 'false', 
        wed: 'true',
        thu: 'false',
        fri: 'true',
        sat: 'false',
        sun: 'false',
        stopDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      };

      console.log('📤 Sending payload:', emailPayload);

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain' // Using text/plain to avoid CORS preflight
        },
        body: JSON.stringify(emailPayload)
      });

      console.log('📨 Response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Response data:', responseData);
        
        setTestResult(`✅ SUCCESS! Email record sent to Google Sheets

📊 **Server Response:**
• Status: ${response.status} ${response.statusText}
• Success: ${responseData.success}
• Message: ${responseData.message}
• Timestamp: ${responseData.timestamp}

📧 **Email Record Details:**
• Type: ${emailPayload.type}
• From: ${emailPayload.from}
• To: ${emailPayload.to}
• Subject: ${emailPayload.subject}
• Repeat Days: Mon, Wed, Fri
• Stop Date: ${new Date(emailPayload.stopDate).toLocaleDateString()}

🔗 **Google Sheet URL:**
${responseData.sheetUrl || 'Check your Google Sheets for the new record!'}

🎯 **Next Steps:**
1. Check your Google Sheets to verify the record was added
2. Verify the email data appears in the correct columns
3. Test with different email addresses if needed`);

      } else {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        
        setTestResult(`❌ FAILED - Server Error

📊 **Response Details:**
• Status: ${response.status} ${response.statusText}
• Error: ${errorText}

🔍 **Troubleshooting:**
1. Check if the Google Apps Script is deployed correctly
2. Verify the webhook URL is accessible
3. Check Google Apps Script execution logs
4. Ensure the script has proper permissions`);
      }

    } catch (error) {
      console.error('❌ Network error:', error);
      
      setTestResult(`❌ FAILED - Network Error

🚨 **Error Details:**
${error.message}

🔍 **Common Causes:**
1. Network connectivity issues
2. CORS policy blocking the request
3. Google Apps Script not responding
4. Invalid webhook URL

💡 **Solutions:**
1. Check your internet connection
2. Verify the Google Apps Script is deployed as "Anyone" access
3. Try refreshing the page and testing again`);
      
    } finally {
      setLoading(false);
    }
  };

  const getResultIcon = () => {
    if (!testResult) return null;
    if (testResult.includes('✅ SUCCESS')) {
      return <SuccessIcon sx={{ color: 'success.main', mr: 1 }} />;
    }
    return <ErrorIcon sx={{ color: 'error.main', mr: 1 }} />;
  };

  const getResultSeverity = () => {
    if (!testResult) return 'info';
    return testResult.includes('✅ SUCCESS') ? 'success' : 'error';
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          📧 Google Sheets Email Test
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Test sending email data to your Google Sheets via Apps Script webhook
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            🎯 Webhook URL:
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              fontFamily: 'monospace', 
              backgroundColor: 'grey.100', 
              p: 1, 
              borderRadius: 1,
              wordBreak: 'break-all'
            }}
          >
            {WEBHOOK_URL}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            label="Test Email Address"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            fullWidth
            size="small"
            helperText="Email address to use in the test record"
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
            onClick={testGoogleSheetsPost}
            disabled={loading || !testEmail}
            fullWidth
            size="large"
          >
            {loading ? 'Sending Test Email Data...' : '🚀 Send Test Email to Google Sheets'}
          </Button>
        </Box>

        {testResult && (
          <Alert 
            severity={getResultSeverity()} 
            icon={getResultIcon()}
            sx={{ mt: 2 }}
          >
            <Typography 
              variant="body2" 
              component="pre" 
              sx={{ 
                whiteSpace: 'pre-wrap', 
                fontFamily: 'inherit',
                margin: 0 
              }}
            >
              {testResult}
            </Typography>
          </Alert>
        )}

        <Box sx={{ mt: 2, p: 2, backgroundColor: 'info.light', borderRadius: 1 }}>
          <Typography variant="caption" color="info.contrastText">
            💡 <strong>How it works:</strong> This test sends a sample email record to your Google Apps Script, 
            which should save it to your Google Sheets "Email Queue" tab. Check your sheet after testing!
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsPostTest;






