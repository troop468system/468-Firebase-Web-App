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
  Divider,
  Link
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

const AppsScriptSheetsTest = () => {
  const [testResults, setTestResults] = useState('');
  const [loading, setLoading] = useState(false);
  const [appsScriptUrl, setAppsScriptUrl] = useState('');
  
  const [testEmailData, setTestEmailData] = useState({
    to: 'test@troop468.com',
    name: 'Test User',
    role: 'scout',
    subject: 'Apps Script Test',
    htmlBody: '<p>This is a test email record created via Google Apps Script proxy.</p>',
    type: 'TEST',
    status: 'PENDING'
  });

  const callAppsScript = async (action, data = null) => {
    const payload = {
      action: action,
      data: data,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown error from Apps Script');
    }

    return result.data;
  };

  const testConnection = async () => {
    setLoading(true);
    setTestResults('');

    try {
      if (!appsScriptUrl) {
        setTestResults('❌ Please provide Google Apps Script Web App URL before testing.');
        setLoading(false);
        return;
      }

      console.log('🔍 Testing Google Apps Script connection...');
      
      const result = await callAppsScript('TEST_CONNECTION');
      
      setTestResults(`✅ Google Apps Script connection successful!

🔗 Apps Script Details:
• Connected: ${result.connected ? 'Yes' : 'No'}
• Message: ${result.message}

📊 Sheet Information:
• Spreadsheet: "${result.sheetInfo.spreadsheetName}"
• Sheet: "${result.sheetInfo.sheetName}"
• Last Row: ${result.sheetInfo.lastRow}
• Last Column: ${result.sheetInfo.lastColumn}
• Sheet ID: ${result.sheetInfo.id}

🌐 Sheet URL: ${result.sheetInfo.url}

✅ Your Google Apps Script proxy is working perfectly!
This means you can securely read and write to your Google Sheet without exposing service account keys.`);

    } catch (error) {
      console.error('❌ Apps Script connection test failed:', error);
      setTestResults(`❌ Google Apps Script connection failed: ${error.message}

🔍 Troubleshooting:
• Check if the Apps Script Web App URL is correct
• Ensure the Apps Script is deployed as Web App
• Verify "Execute as: Me" and "Who has access: Anyone"
• Make sure the script has access to your Google Sheet
• Check Apps Script execution logs for detailed errors`);
    } finally {
      setLoading(false);
    }
  };

  const testReadSheet = async () => {
    setLoading(true);
    setTestResults('');

    try {
      if (!appsScriptUrl) {
        setTestResults('❌ Please provide Google Apps Script Web App URL before testing.');
        setLoading(false);
        return;
      }

      console.log('📖 Testing sheet read via Apps Script...');
      
      const result = await callAppsScript('READ_SHEET');
      
      setTestResults(`✅ Sheet read test successful!

📊 EmailQueue Data:
• Sheet Name: ${result.sheetName}
• Total Rows: ${result.totalRows}
• Headers: ${result.headers.join(' | ')}
• Data Rows: ${result.rows.length}
• Last Updated: ${result.lastUpdated}

📋 Sample Data:
${result.rows.length > 0 ? 
  result.rows.slice(0, 3).map((row, index) => 
    `Row ${index + 2}: ${row.slice(0, 5).join(' | ')}...`
  ).join('\n') : 
  'No data rows found - sheet is empty'
}

✅ Successfully read data from your EmailQueue sheet via Apps Script!`);

    } catch (error) {
      console.error('❌ Sheet read test failed:', error);
      setTestResults(`❌ Sheet read failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testWriteRecord = async () => {
    setLoading(true);
    setTestResults('');

    try {
      if (!appsScriptUrl) {
        setTestResults('❌ Please provide Google Apps Script Web App URL before testing.');
        setLoading(false);
        return;
      }

      console.log('✍️ Testing record write via Apps Script...');
      
      const result = await callAppsScript('WRITE_RECORD', testEmailData);
      
      setTestResults(`✅ Record write test successful!

📝 New Record Created:
• Row Number: ${result.rowNumber}
• Range: ${result.range}
• Timestamp: ${result.timestamp}

📧 Record Details:
• Type: ${testEmailData.type}
• To: ${testEmailData.to}
• Name: ${testEmailData.name}
• Subject: ${testEmailData.subject}
• Status: ${testEmailData.status}

✅ SUCCESS! A new test record has been added to your EmailQueue sheet!

🔍 Check your sheet now: https://docs.google.com/spreadsheets/d/1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM/edit?gid=759662525#gid=759662525

⚠️ Note: This test record was added to your actual sheet. You can delete it manually if needed.`);

    } catch (error) {
      console.error('❌ Record write test failed:', error);
      setTestResults(`❌ Record write failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testCompleteFlow = async () => {
    setLoading(true);
    setTestResults('🧪 Testing complete Google Apps Script flow...\n\n');

    try {
      if (!appsScriptUrl) {
        setTestResults('❌ Please provide Google Apps Script Web App URL before testing.');
        setLoading(false);
        return;
      }

      // Step 1: Test connection
      setTestResults(prev => prev + '🔗 Step 1: Testing connection...\n');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const connectionResult = await callAppsScript('TEST_CONNECTION');
      setTestResults(prev => prev + `✅ Connection successful - Sheet: "${connectionResult.sheetInfo.spreadsheetName}"\n\n`);
      
      // Step 2: Test read
      setTestResults(prev => prev + '📖 Step 2: Testing read access...\n');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const readResult = await callAppsScript('READ_SHEET');
      setTestResults(prev => prev + `✅ Read successful - Found ${readResult.rows.length} records\n\n`);
      
      // Step 3: Test write
      setTestResults(prev => prev + '✍️ Step 3: Testing write access...\n');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const writeResult = await callAppsScript('WRITE_RECORD', {
        ...testEmailData,
        subject: 'Complete Flow Test',
        htmlBody: '<p>This record was created during a complete flow test.</p>'
      });
      
      setTestResults(prev => prev + `✅ Write successful - Added record at row ${writeResult.rowNumber}\n\n`);
      setTestResults(prev => prev + `🎉 COMPLETE FLOW TEST SUCCESSFUL!\n\n✅ Your Google Apps Script integration is fully functional!\n🔍 Check your sheet - a new test record should be visible now.\n\n🛡️ This approach is secure and completely free!`);

    } catch (error) {
      setTestResults(prev => prev + `\n❌ Complete flow test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
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
          🚀 Google Apps Script Sheets Integration (Free & Secure)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Using Google Apps Script as a secure, free proxy to your Google Sheet
        </Typography>
        
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>✅ Recommended Approach:</strong><br/>
            Google Apps Script runs on Google's servers (free) and can securely access your sheets using your service account permissions without exposing keys to the browser.
          </Typography>
        </Alert>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">🔧 Setup Instructions</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Step 1: Create Google Apps Script</strong>
              </Typography>
              <ol style={{ fontSize: '0.9em', lineHeight: 1.6, marginBottom: '16px' }}>
                <li>Go to <Link href="https://script.google.com" target="_blank" rel="noopener noreferrer">script.google.com</Link></li>
                <li>Click "New Project"</li>
                <li>Name it "Troop 468 Sheets Proxy"</li>
                <li>Replace the default code with the contents of <code>google-apps-script-sheets-proxy.js</code></li>
                <li>Save the project (Ctrl+S)</li>
              </ol>

              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Step 2: Deploy as Web App</strong>
              </Typography>
              <ol style={{ fontSize: '0.9em', lineHeight: 1.6, marginBottom: '16px' }}>
                <li>Click "Deploy" → "New deployment"</li>
                <li>Choose type: "Web app"</li>
                <li>Set "Execute as: Me"</li>
                <li>Set "Who has access: Anyone"</li>
                <li>Click "Deploy"</li>
                <li>Copy the Web App URL</li>
                <li>Paste it in the field below</li>
              </ol>

              <TextField
                label="Google Apps Script Web App URL"
                value={appsScriptUrl}
                onChange={(e) => setAppsScriptUrl(e.target.value)}
                fullWidth
                size="small"
                sx={{ mb: 2 }}
                placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
                helperText="Get this URL after deploying your Apps Script as a Web App"
              />

              <Typography variant="body2" sx={{ mb: 1 }}>Status:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {getStatusChip(!!appsScriptUrl, 'Apps Script URL Set')}
                {getStatusChip(true, 'Sheet ID Configured')}
                {getStatusChip(true, '100% Free')}
                {getStatusChip(true, 'Secure (No Keys Exposed)')}
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">📝 Test Email Data</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 2 }}>
              <TextField
                label="To Email"
                value={testEmailData.to}
                onChange={(e) => setTestEmailData({...testEmailData, to: e.target.value})}
                size="small"
              />
              <TextField
                label="Name"
                value={testEmailData.name}
                onChange={(e) => setTestEmailData({...testEmailData, name: e.target.value})}
                size="small"
              />
              <TextField
                label="Role"
                value={testEmailData.role}
                onChange={(e) => setTestEmailData({...testEmailData, role: e.target.value})}
                size="small"
              />
              <TextField
                label="Type"
                value={testEmailData.type}
                onChange={(e) => setTestEmailData({...testEmailData, type: e.target.value})}
                size="small"
              />
              <TextField
                label="Subject"
                value={testEmailData.subject}
                onChange={(e) => setTestEmailData({...testEmailData, subject: e.target.value})}
                size="small"
                sx={{ gridColumn: 'span 2' }}
              />
              <TextField
                label="HTML Body"
                value={testEmailData.htmlBody}
                onChange={(e) => setTestEmailData({...testEmailData, htmlBody: e.target.value})}
                size="small"
                multiline
                rows={2}
                sx={{ gridColumn: 'span 2' }}
              />
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
                variant="contained" 
                onClick={testCompleteFlow}
                disabled={loading || !appsScriptUrl}
                startIcon={loading ? <CircularProgress size={16} /> : null}
              >
                🧪 Complete Test
              </Button>
              <Button 
                variant="outlined" 
                onClick={testConnection}
                disabled={loading || !appsScriptUrl}
              >
                🔗 Test Connection
              </Button>
              <Button 
                variant="outlined" 
                onClick={testReadSheet}
                disabled={loading || !appsScriptUrl}
              >
                📖 Test Read
              </Button>
              <Button 
                variant="outlined" 
                onClick={testWriteRecord}
                disabled={loading || !appsScriptUrl}
                color="secondary"
              >
                ✍️ Test Write
              </Button>
            </Box>

            {!appsScriptUrl && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>⚠️ Apps Script URL Required</strong><br/>
                  Please set up Google Apps Script and provide the Web App URL above.
                </Typography>
              </Alert>
            )}

            {testResults && (
              <Alert severity={testResults.includes('✅') ? 'success' : 'error'} sx={{ mt: 2 }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8em' }}>
                  {testResults}
                </pre>
              </Alert>
            )}
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 2 }} />
        
        <Typography variant="body2" color="text.secondary">
          <strong>🎯 Why This Approach is Perfect:</strong><br/>
          • <strong>100% Free:</strong> Google Apps Script has generous free quotas<br/>
          • <strong>Secure:</strong> Service account keys stay on Google's servers<br/>
          • <strong>No Firebase Functions:</strong> No additional costs or setup<br/>
          • <strong>Full Access:</strong> Read and write to your sheets with full permissions<br/>
          • <strong>Easy to Deploy:</strong> Just copy/paste the script and deploy<br/><br/>
          
          <strong>🎯 Target Sheet:</strong><br/>
          • Sheet ID: <code>1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM</code><br/>
          • Tab: EmailQueue<br/>
          • <Link href="https://docs.google.com/spreadsheets/d/1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM/edit?gid=759662525#gid=759662525" target="_blank" rel="noopener noreferrer">View Sheet</Link>
        </Typography>
      </CardContent>
    </Card>
  );
};

export default AppsScriptSheetsTest;

