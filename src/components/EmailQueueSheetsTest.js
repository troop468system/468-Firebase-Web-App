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

const EmailQueueSheetsTest = () => {
  const [testResults, setTestResults] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(process.env.REACT_APP_GOOGLE_SHEETS_API_KEY || '');
  
  // Your actual sheet ID from the URL
  const SHEET_ID = '1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM';
  const SHEET_NAME = 'EmailQueue'; // The tab name from your URL

  const [testEmailData, setTestEmailData] = useState({
    to: 'test@troop468.com',
    name: 'Test User',
    role: 'scout',
    subject: 'Google Sheets API Test',
    htmlBody: '<p>This is a test email record created by the Google Sheets Test Component.</p>'
  });

  const testReadEmailQueue = async () => {
    setLoading(true);
    setTestResults('');

    try {
      if (!apiKey) {
        setTestResults('❌ Please provide Google Sheets API Key before testing.');
        setLoading(false);
        return;
      }

      console.log('🔍 Testing Google Sheets READ access to EmailQueue...');
      
      // Test 1: Get sheet metadata
      const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${apiKey}&fields=properties(title),sheets(properties(title,sheetId))`;
      const metadataResponse = await fetch(metadataUrl);
      
      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
        setTestResults(`❌ Failed to access sheet: ${errorData.error?.message || 'Unknown error'}

🔍 Troubleshooting:
• Check if your API key is valid
• Ensure Google Sheets API is enabled in Google Cloud Console
• Verify the sheet is accessible (not private)`);
        setLoading(false);
        return;
      }

      const metadata = await metadataResponse.json();
      console.log('📊 Sheet metadata:', metadata);

      // Test 2: Read data from EmailQueue sheet
      const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A1:J100?key=${apiKey}`;
      const dataResponse = await fetch(dataUrl);

      if (!dataResponse.ok) {
        const errorData = await dataResponse.json();
        setTestResults(`❌ Failed to read EmailQueue data: ${errorData.error?.message || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      const data = await dataResponse.json();
      const rowCount = data.values ? data.values.length : 0;
      const headers = data.values && data.values.length > 0 ? data.values[0] : [];
      const emailRecords = data.values ? data.values.slice(1).filter(row => row.some(cell => cell && cell.trim())) : [];

      setTestResults(`✅ Google Sheets READ test successful!

📊 Your Email Manager Sheet:
• Sheet Name: "${metadata.properties.title}"
• EmailQueue Tab: Found ✅
• Total Rows: ${rowCount}
• Email Records: ${emailRecords.length}
• Headers: ${headers.join(' | ')}

📋 Available Sheets:
${metadata.sheets.map(sheet => `• ${sheet.properties.title} (ID: ${sheet.properties.sheetId})`).join('\n')}

✅ Successfully connected to your Email Manager sheet!
${emailRecords.length > 0 ? `\n📧 Found ${emailRecords.length} existing email records in the queue.` : '\n📧 EmailQueue is currently empty - ready for test records!'}`);

    } catch (error) {
      console.error('❌ Google Sheets read test failed:', error);
      setTestResults(`❌ Google Sheets read test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testWriteEmailRecord = async () => {
    setLoading(true);
    setTestResults('');

    try {
      if (!apiKey) {
        setTestResults('❌ Please provide Google Sheets API Key before testing.');
        setLoading(false);
        return;
      }

      console.log('✍️ Testing Google Sheets WRITE access to EmailQueue...');
      
      // Create test email record matching your sheet structure
      const timestamp = new Date().toISOString();
      const testRow = [
        timestamp,                    // A: timestamp
        'TEST',                      // B: type
        testEmailData.to,            // C: to
        testEmailData.name,          // D: name
        testEmailData.role,          // E: role
        testEmailData.subject,       // F: subject
        testEmailData.htmlBody,      // G: htmlBody
        'PENDING',                   // H: status
        JSON.stringify({             // I: meta
          testMode: true,
          source: 'GoogleSheetsTest',
          timestamp: timestamp
        }),
        ''                          // J: sentAt (empty for pending)
      ];

      console.log(`📝 Attempting to add test record to EmailQueue sheet`);

      // Try to append the test email record
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A:J:append?valueInputOption=RAW&key=${apiKey}`;
      
      const appendResponse = await fetch(appendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [testRow]
        })
      });

      if (appendResponse.ok) {
        const result = await appendResponse.json();
        setTestResults(`✅ Google Sheets WRITE test successful!

📝 Test Email Record Created:
• Sheet: EmailQueue
• Row Range: ${result.updates.updatedRange}
• Cells Updated: ${result.updates.updatedCells}

📧 Test Record Details:
• Timestamp: ${timestamp}
• Type: TEST
• To: ${testEmailData.to}
• Name: ${testEmailData.name}
• Role: ${testEmailData.role}
• Subject: ${testEmailData.subject}
• Status: PENDING

✅ SUCCESS! Your Google Sheets integration is working perfectly for both reading AND writing.

🔍 Check your sheet now: A new test record should appear in the EmailQueue tab!

⚠️ Note: This test record was added to your actual sheet. You can delete it manually if needed.`);
      } else {
        const errorData = await appendResponse.json();
        
        // Check if it's a permission error
        if (errorData.error?.code === 403) {
          setTestResults(`❌ Google Sheets WRITE test failed: Permission denied

🔐 This means:
• Your API key has READ access but not WRITE access
• The Google Sheet may be protected or read-only
• You may need different authentication for write operations

💡 Solutions:
1. Check Google Sheet sharing settings - ensure it's editable
2. Try using Google Apps Script for write operations instead
3. Use OAuth2 authentication for full read/write access
4. Verify the API key has proper permissions in Google Cloud Console

📖 READ access is working fine, but WRITE access requires additional setup.`);
        } else {
          setTestResults(`❌ Google Sheets WRITE test failed: ${errorData.error?.message || 'Unknown error'}

Error Details:
${JSON.stringify(errorData, null, 2)}`);
        }
      }

    } catch (error) {
      console.error('❌ Google Sheets write test failed:', error);
      setTestResults(`❌ Google Sheets write test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testCompleteEmailFlow = async () => {
    setLoading(true);
    setTestResults('🧪 Testing complete Google Sheets Email Queue flow...\n\n');

    try {
      // Step 1: Test read access
      setTestResults(prev => prev + '🔍 Step 1: Testing READ access to EmailQueue...\n');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!apiKey) {
        setTestResults(prev => prev + '❌ API Key required for testing\n');
        setLoading(false);
        return;
      }

      // Read test
      const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${apiKey}&fields=properties(title)`;
      const metadataResponse = await fetch(metadataUrl);
      
      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json();
        setTestResults(prev => prev + `✅ READ test passed - Connected to "${metadata.properties.title}"\n\n`);
      } else {
        const errorData = await metadataResponse.json();
        setTestResults(prev => prev + `❌ READ test failed: ${errorData.error?.message}\n\n`);
        setLoading(false);
        return;
      }
      
      // Step 2: Test write access
      setTestResults(prev => prev + '✍️ Step 2: Testing WRITE access to EmailQueue...\n');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const timestamp = new Date().toISOString();
      const testRow = [
        timestamp, 'TEST', testEmailData.to, testEmailData.name, testEmailData.role,
        testEmailData.subject, testEmailData.htmlBody, 'PENDING',
        JSON.stringify({ testMode: true, source: 'CompleteFlowTest' }), ''
      ];

      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A:J:append?valueInputOption=RAW&key=${apiKey}`;
      const appendResponse = await fetch(appendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [testRow] })
      });

      if (appendResponse.ok) {
        const result = await appendResponse.json();
        setTestResults(prev => prev + `✅ WRITE test passed - Record added at ${result.updates.updatedRange}\n\n`);
        setTestResults(prev => prev + `🎉 COMPLETE FLOW TEST SUCCESSFUL!\n\n✅ Your Google Sheets Email Queue integration is fully functional!\n🔍 Check your sheet - a new test record should be visible now.`);
      } else {
        const errorData = await appendResponse.json();
        setTestResults(prev => prev + `❌ WRITE test failed: ${errorData.error?.message}\n\n📖 READ works, but WRITE needs additional permissions.`);
      }

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
          📧 Email Queue Google Sheets Test
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Testing connection to your Email Manager sheet: <code>{SHEET_ID}</code>
        </Typography>
        
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">🔧 Configuration</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Status:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {getStatusChip(!!apiKey, 'API Key Set')}
                {getStatusChip(true, 'Sheet ID Configured')}
                {getStatusChip(true, 'EmailQueue Tab Target')}
              </Box>
              
              <TextField
                label="Google Sheets API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                fullWidth
                size="small"
                sx={{ mb: 2 }}
                type="password"
                placeholder="Enter your Google Sheets API key"
              />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                💡 Get API key from: Google Cloud Console → APIs & Services → Credentials
              </Typography>
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
                onClick={testCompleteEmailFlow}
                disabled={loading || !apiKey}
                startIcon={loading ? <CircularProgress size={16} /> : null}
              >
                🧪 Complete Test
              </Button>
              <Button 
                variant="outlined" 
                onClick={testReadEmailQueue}
                disabled={loading || !apiKey}
              >
                🔍 Test Read Only
              </Button>
              <Button 
                variant="outlined" 
                onClick={testWriteEmailRecord}
                disabled={loading || !apiKey}
                color="secondary"
              >
                ✍️ Test Write Record
              </Button>
            </Box>

            {!apiKey && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>⚠️ API Key Required</strong><br/>
                  Please provide your Google Sheets API Key above to run tests.
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
          <strong>📋 What this test does:</strong><br/>
          • <strong>Read Test:</strong> Connects to your EmailQueue sheet and reads existing records<br/>
          • <strong>Write Test:</strong> Adds a test email record to verify write permissions<br/>
          • <strong>Complete Test:</strong> Runs both tests to verify full functionality<br/><br/>
          
          <strong>🎯 Target Sheet:</strong><br/>
          • Sheet ID: <code>1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM</code><br/>
          • Tab: EmailQueue<br/>
          • URL: <a href="https://docs.google.com/spreadsheets/d/1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM/edit?gid=759662525#gid=759662525" target="_blank" rel="noopener noreferrer">View Sheet</a>
        </Typography>
      </CardContent>
    </Card>
  );
};

export default EmailQueueSheetsTest;

