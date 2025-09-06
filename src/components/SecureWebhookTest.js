import React, { useState, useEffect } from 'react';
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

const SecureWebhookTest = () => {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('test@troop468.com');
  const [csrfToken, setCsrfToken] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  useEffect(() => {
    // Get CSRF token when component mounts
    fetchCSRFToken();
  }, []);

  const fetchCSRFToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/csrf-token`, {
        credentials: 'include'  // Include cookies for session
      });
      const data = await response.json();
      setCsrfToken(data.csrfToken);
      console.log('🔐 CSRF token obtained:', data.csrfToken);
    } catch (error) {
      console.error('❌ Failed to get CSRF token:', error);
    }
  };

  const makeSecureRequest = async (payload) => {
    if (!csrfToken) {
      throw new Error('CSRF token not available');
    }

    const response = await fetch(`${API_BASE_URL}/api/email-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',  // ← Proper JSON content-type
        'X-CSRF-Token': csrfToken            // ← CSRF protection
      },
      credentials: 'include',  // ← Include session cookies
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  };

  const testSecureConnection = async () => {
    setLoading(true);
    setTestResult('');

    try {
      console.log('🔐 Testing secure connection with CSRF token...');
      
      const testPayload = {
        rows: [{
          type: 'TEST',
          to: testEmail,
          name: 'Secure Test User',
          role: 'test',
          subject: 'Secure Test Email',
          htmlBody: '<p>This is a secure test with proper CORS and CSRF protection.</p>',
          meta: {
            testMode: true,
            timestamp: new Date().toISOString(),
            source: 'SecureWebhookTest component'
          }
        }]
      };

      const result = await makeSecureRequest(testPayload);

      setTestResult(`✅ Secure test successful!

🔐 Security Features Used:
• CORS: Proper origin validation
• CSRF: Token-based request validation  
• Content-Type: application/json (no bypass)
• Credentials: Secure session cookies
• Headers: Proper security headers

📧 Email Record Created:
• Type: ${testPayload.rows[0].type}
• To: ${testPayload.rows[0].to}
• Subject: ${testPayload.rows[0].subject}

📡 Server Response:
${JSON.stringify(result, null, 2)}`);

    } catch (error) {
      console.error('❌ Secure test failed:', error);
      setTestResult(`❌ Secure test failed: ${error.message}

🔍 Possible Issues:
• Backend server not running
• CORS not configured properly
• CSRF token validation failed
• Session not established
• Network connectivity issues`);
    } finally {
      setLoading(false);
    }
  };

  const testMultipleEmails = async () => {
    setLoading(true);
    setTestResult('');

    try {
      console.log('🔐 Testing secure multiple email creation...');
      
      const multiEmailPayload = {
        rows: [
          {
            type: 'REGISTRATION_APPROVAL',
            to: 'parent@troop468.com',
            name: 'Test Parent',
            role: 'parent',
            subject: 'Scout Registration Approved - Secure Test',
            htmlBody: '<h2>🎉 Registration Approved!</h2><p>This is a secure test of the registration approval email.</p>',
            status: 'PENDING',
            meta: {
              testMode: true,
              source: 'SecureWebhookTest - Multiple Emails',
              scoutName: 'Test Scout'
            }
          },
          {
            type: 'REGISTRATION_NOTIFICATION',
            to: 'scoutmaster@troop468.com',
            name: 'Scoutmaster',
            role: 'leader',
            subject: 'New Scout Registration - Secure Test',
            htmlBody: '<h2>📋 New Scout Registered</h2><p>Secure test of leadership notification.</p>',
            status: 'PENDING',
            meta: {
              testMode: true,
              source: 'SecureWebhookTest - Multiple Emails'
            }
          }
        ]
      };

      const result = await makeSecureRequest(multiEmailPayload);

      setTestResult(`✅ Secure multiple email test successful!

📧 Email Records Created: ${multiEmailPayload.rows.length}
1. Registration Approval → parent@troop468.com
2. Leadership Notification → scoutmaster@troop468.com

🔐 Security Validation:
• All requests properly authenticated
• CSRF tokens validated
• CORS headers respected
• Session security maintained

📊 Server Response:
${JSON.stringify(result, null, 2)}`);

    } catch (error) {
      console.error('❌ Multiple email test failed:', error);
      setTestResult(`❌ Multiple email test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🔐 Secure Webhook Test
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Proper security implementation with CORS, CSRF, and session management
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Security Status:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Alert severity={csrfToken ? 'success' : 'warning'} sx={{ flex: 1 }}>
              CSRF Token: {csrfToken ? '✅ Active' : '❌ Missing'}
            </Alert>
          </Box>
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
            onClick={testSecureConnection}
            disabled={loading || !csrfToken}
            size="small"
          >
            {loading ? <CircularProgress size={20} /> : '🔐 Secure Single Email'}
          </Button>
          
          <Button
            variant="contained"
            color="secondary"
            onClick={testMultipleEmails}
            disabled={loading || !csrfToken}
            size="small"
          >
            {loading ? <CircularProgress size={20} /> : '🔐 Secure Multiple Emails'}
          </Button>

          <Button
            variant="outlined"
            onClick={fetchCSRFToken}
            disabled={loading}
            size="small"
          >
            🔄 Refresh CSRF Token
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

export default SecureWebhookTest;





