import React, { useState } from 'react';
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
  Chip,
  CircularProgress,
  Divider
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

const ServiceAccountSheetsTest = () => {
  const [testResults, setTestResults] = useState('');
  const [loading, setLoading] = useState(false);
  const [serviceAccountKey, setServiceAccountKey] = useState('');
  
  // Your actual sheet ID from the URL
  const SHEET_ID = '1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM';
  const SHEET_NAME = 'EmailQueue';

  const [testEmailData, setTestEmailData] = useState({
    to: 'test@troop468.com',
    name: 'Test User',
    role: 'scout',
    subject: 'Service Account Test',
    htmlBody: '<p>This is a test email record created using Service Account authentication.</p>'
  });

  const getAccessToken = async (serviceAccountJson) => {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      
      // Create JWT for Google OAuth2
      const header = {
        alg: 'RS256',
        typ: 'JWT',
        kid: serviceAccount.private_key_id
      };

      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
      };

      // Note: This is a simplified example. In production, you'd use a proper JWT library
      // and handle the RSA signing properly. For client-side apps, service accounts
      // should be used server-side only for security reasons.
      
      throw new Error('Service Account authentication requires server-side implementation for security. Please use API Key method instead.');
      
    } catch (error) {
      throw new Error(`Service Account parsing failed: ${error.message}`);
    }
  };

  const testServiceAccountAccess = async () => {
    setLoading(true);
    setTestResults('');

    try {
      if (!serviceAccountKey) {
        setTestResults('❌ Please provide Service Account JSON key before testing.');
        setLoading(false);
        return;
      }

      setTestResults(`🔐 Service Account Authentication Test

⚠️ IMPORTANT SECURITY NOTE:
Service Account keys contain private keys and should NEVER be used in client-side applications for security reasons.

🛡️ Recommended Approach:
1. Use Service Accounts on your SERVER-SIDE only
2. Create a backend API endpoint that uses the service account
3. Your frontend calls your backend API
4. Your backend uses the service account to access Google Sheets

🔧 Alternative for Testing:
Use a Google Sheets API Key instead (simpler for client-side testing):

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Click "CREATE CREDENTIALS" → "API key"
3. Enable Google Sheets API
4. Use the API key in the other test component

❌ This test cannot proceed with Service Account in the browser for security reasons.`);

    } catch (error) {
      console.error('❌ Service Account test failed:', error);
      setTestResults(`❌ Service Account test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testWithApiKeyInstead = () => {
    setTestResults(`💡 How to get a Google Sheets API Key:

1. 🌐 Go to Google Cloud Console (console.cloud.google.com)
2. 📂 Navigate to "APIs & Services" → "Credentials"
3. ➕ Click "CREATE CREDENTIALS" → "API key"
4. 🔧 Configure the API key:
   - Click on the newly created API key
   - Under "API restrictions", select "Restrict key"
   - Choose "Google Sheets API"
   - Save the changes
5. 📋 Copy the API key string
6. 🔒 Make sure Google Sheets API is enabled:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click "Enable" if not already enabled

📊 Share your Google Sheet:
- Open your sheet: https://docs.google.com/spreadsheets/d/1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM/edit
- Click "Share" button
- Set to "Anyone with the link can view" (for API access)
- Or add your service account email as an editor

🧪 Then use the "Email Queue Google Sheets Test" component above with your API key!`);
  };

  const getStatusChip = (condition, label) => (
    <Chip 
      label={label} 
      color={condition ? 'success' : 'error'} 
      size="small" 
      variant={condition ? 'filled' : 'outlined'}
    />
  );

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🔐 Service Account Google Sheets Test
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Testing with Service Account authentication (Server-side recommended)
        </Typography>
        
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>⚠️ Security Warning:</strong><br/>
            Service Account keys should only be used server-side, not in browser applications.
            For client-side testing, use a Google Sheets API Key instead.
          </Typography>
        </Alert>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">🔧 Service Account Configuration</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Status:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {getStatusChip(!!serviceAccountKey, 'Service Account JSON Set')}
                {getStatusChip(true, 'Sheet ID Configured')}
                {getStatusChip(false, 'Client-Side Not Recommended')}
              </Box>
              
              <TextField
                label="Service Account JSON Key"
                value={serviceAccountKey}
                onChange={(e) => setServiceAccountKey(e.target.value)}
                fullWidth
                size="small"
                sx={{ mb: 2 }}
                multiline
                rows={4}
                placeholder='{"type": "service_account", "project_id": "...", "private_key": "...", ...}'
                helperText="⚠️ WARNING: Never paste real service account keys in browser applications!"
              />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                🔑 Your Service Account ID from the screenshot: <code>cad385908d22320ed04ef6ebda32bfe0f7af6ba0</code>
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">🚀 Tests</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Button 
                variant="outlined" 
                onClick={testServiceAccountAccess}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : null}
                color="warning"
              >
                ⚠️ Test Service Account (Not Recommended)
              </Button>
              <Button 
                variant="contained" 
                onClick={testWithApiKeyInstead}
                disabled={loading}
                color="primary"
              >
                💡 Show API Key Instructions
              </Button>
            </Box>

            {testResults && (
              <Alert severity={testResults.includes('✅') ? 'success' : testResults.includes('💡') ? 'info' : 'warning'} sx={{ mt: 2 }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8em' }}>
                  {testResults}
                </pre>
              </Alert>
            )}
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 2 }} />
        
        <Typography variant="body2" color="text.secondary">
          <strong>🏗️ Recommended Architecture:</strong><br/>
          <strong>Frontend (Browser):</strong> Uses API Keys for read-only access<br/>
          <strong>Backend (Server):</strong> Uses Service Accounts for full read/write access<br/>
          <strong>Production:</strong> Frontend → Your API → Google Sheets (with Service Account)<br/><br/>
          
          <strong>🎯 For immediate testing:</strong><br/>
          Use the "Email Queue Google Sheets Test" component above with an API Key instead.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ServiceAccountSheetsTest;

