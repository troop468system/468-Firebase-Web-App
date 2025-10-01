import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Email as EmailIcon,
  Send as SendIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

const SimpleEmailTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  
  // Google Apps Script URL
  const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbx9PRWvVJCEIqxivmz1PpT0yfjaM-LU5LqEfKWt-hBqwQIYYkaZdX2GiSYxynT2QLtK/exec';

  const sendTestEmail = async () => {
    setLoading(true);
    setResult('');
    setError('');

    try {
      console.log('📧 Sending test email via Google Apps Script...');
      
      // Create test email data in flat object format to match your working payload
      const emailPayload = {
        type: 'TEST',
        to: 'test@troop468.com',
        cc: 'cc@troop468.com',
        subject: 'Test Email from Settings Page - ' + new Date().toLocaleString(),
        htmlBody: `<p>This is a test email sent from the Settings page diagnostic tool.</p><p><strong>Timestamp:</strong> ${new Date().toISOString()}</p><p><strong>Purpose:</strong> Testing Google Sheets integration</p>`,
        mon: 'true',
        tue: 'false', 
        wed: 'false',
        thu: 'false',
        fri: 'false',
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
        
        setResult(`✅ SUCCESS! Email record sent to Google Sheets

📊 **Server Response:**
• Status: ${response.status}
• Success: ${responseData.success}
• Message: ${responseData.message}
• Timestamp: ${responseData.timestamp}

📧 **Email Record Details:**
• Type: ${emailPayload.type}
• To: ${emailPayload.to}
• CC: ${emailPayload.cc}
• Subject: ${emailPayload.subject}
• Repeat Days: ${[
          emailPayload.mon === 'true' ? 'Mon' : null,
          emailPayload.tue === 'true' ? 'Tue' : null,
          emailPayload.wed === 'true' ? 'Wed' : null,
          emailPayload.thu === 'true' ? 'Thu' : null,
          emailPayload.fri === 'true' ? 'Fri' : null,
          emailPayload.sat === 'true' ? 'Sat' : null,
          emailPayload.sun === 'true' ? 'Sun' : null
        ].filter(Boolean).join(', ') || 'None'}
• Stop Date: ${new Date(emailPayload.stopDate).toLocaleDateString()}

🔗 **Google Sheet URL:**
https://docs.google.com/spreadsheets/d/1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM/edit#gid=759662525

🎯 **Next Steps:**
1. Check your Google Sheets to verify the record was added
2. Verify the email data appears in the correct columns
3. Test with different email addresses if needed`);
        
      } else {
        const errorText = await response.text();
        console.error('❌ HTTP Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

    } catch (err) {
      console.error('Email test error:', err);
      setError(`Failed to send test email: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ 
      mb: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(15px)',
      WebkitBackdropFilter: 'blur(15px)',
      border: '1px solid rgba(76, 175, 80, 0.3)',
      borderRadius: '15px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <EmailIcon sx={{ 
            mr: 1, 
            color: '#4caf50',
            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
          }} />
          <Typography variant="h6" sx={{ 
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.95)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)'
          }}>
            📧 Email Integration Test
          </Typography>
        </Box>
        
        <Typography variant="body2" sx={{ 
          mb: 3,
          color: 'rgba(255, 255, 255, 0.8)',
          textShadow: '0 1px 1px rgba(0, 0, 0, 0.3)'
        }}>
          Test the email system by sending a sample email record to Google Sheets via Apps Script.
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Button
            onClick={sendTestEmail}
            disabled={loading}
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
            fullWidth
          >
            {loading ? 'Sending Test Email...' : '📤 Send Test Email'}
          </Button>
        </Box>

        {/* Success Display */}
        {result && (
          <Alert severity="success" icon={<SuccessIcon />} sx={{ mb: 2 }}>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {result}
            </Typography>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" icon={<ErrorIcon />}>
            <Typography variant="body2">
              {error}
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleEmailTest;
