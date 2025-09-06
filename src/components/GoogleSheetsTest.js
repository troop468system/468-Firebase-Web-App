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

const GoogleSheetsTest = () => {
  const [testResults, setTestResults] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(process.env.REACT_APP_GOOGLE_SHEETS_API_KEY || '');
  const [sheetId, setSheetId] = useState(process.env.REACT_APP_GOOGLE_SHEETS_SHEET_ID || '');
  const [testData, setTestData] = useState({
    firstName: 'Test',
    lastName: 'Scout',
    email: 'test.scout@troop468.com',
    phone: '555-0123',
    rank: 'Scout'
  });

  const testReadAccess = async () => {
    setLoading(true);
    setTestResults('');

    try {
      if (!apiKey || !sheetId) {
        setTestResults('❌ Please provide both API Key and Sheet ID before testing.');
        setLoading(false);
        return;
      }

      console.log('🔍 Testing Google Sheets READ access...');
      
      // Test 1: Get sheet metadata
      const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${apiKey}&fields=properties(title),sheets(properties(title,sheetId))`;
      const metadataResponse = await fetch(metadataUrl);
      
      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
        setTestResults(`❌ Failed to access sheet metadata: ${errorData.error?.message || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      const metadata = await metadataResponse.json();
      console.log('📊 Sheet metadata:', metadata);

      // Test 2: Read data from the first sheet
      const firstSheet = metadata.sheets[0];
      const sheetName = firstSheet.properties.title;
      const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!A1:Z100?key=${apiKey}`;
      const dataResponse = await fetch(dataUrl);

      if (!dataResponse.ok) {
        const errorData = await dataResponse.json();
        setTestResults(`❌ Failed to read sheet data: ${errorData.error?.message || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      const data = await dataResponse.json();
      const rowCount = data.values ? data.values.length : 0;
      const headers = data.values && data.values.length > 0 ? data.values[0] : [];

      setTestResults(`✅ Google Sheets READ test successful!

📊 Sheet Information:
• Sheet Name: "${metadata.properties.title}"
• First Tab: "${sheetName}"
• Total Rows: ${rowCount}
• Headers: ${headers.join(', ')}

🔍 Available Sheets:
${metadata.sheets.map(sheet => `• ${sheet.properties.title} (ID: ${sheet.properties.sheetId})`).join('\n')}

✅ The Google Sheets API connection is working correctly for reading data.`);

    } catch (error) {
      console.error('❌ Google Sheets read test failed:', error);
      setTestResults(`❌ Google Sheets read test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testWriteAccess = async () => {
    setLoading(true);
    setTestResults('');

    try {
      if (!apiKey || !sheetId) {
        setTestResults('❌ Please provide both API Key and Sheet ID before testing.');
        setLoading(false);
        return;
      }

      console.log('✍️ Testing Google Sheets WRITE access...');
      
      // First, get sheet metadata to find available sheets
      const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${apiKey}&fields=sheets(properties(title,sheetId))`;
      const metadataResponse = await fetch(metadataUrl);
      
      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
        setTestResults(`❌ Failed to access sheet: ${errorData.error?.message || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      const metadata = await metadataResponse.json();
      
      // Look for a test sheet or use the first sheet
      let targetSheet = metadata.sheets.find(sheet => 
        sheet.properties.title.toLowerCase().includes('test') ||
        sheet.properties.title.toLowerCase().includes('temp')
      );
      
      if (!targetSheet) {
        targetSheet = metadata.sheets[0]; // Use first sheet as fallback
      }

      const sheetName = targetSheet.properties.title;
      console.log(`📝 Using sheet "${sheetName}" for write test`);

      // Create test data row
      const timestamp = new Date().toISOString();
      const testRow = [
        testData.firstName,
        testData.lastName,
        testData.email,
        testData.phone,
        testData.rank,
        'TEST_RECORD',
        timestamp,
        'Created by Google Sheets Test Component'
      ];

      // Try to append the test data
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!A:H:append?valueInputOption=RAW&key=${apiKey}`;
      
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

📝 Test Record Created:
• Sheet: "${sheetName}"
• Row Range: ${result.updates.updatedRange}
• Cells Updated: ${result.updates.updatedCells}
• Data Written: ${testRow.join(' | ')}

✅ The Google Sheets API connection is working correctly for both reading AND writing data.

⚠️ Note: A test record was added to your sheet. You may want to delete it manually if this was a production sheet.`);
      } else {
        const errorData = await appendResponse.json();
        
        // Check if it's a permission error
        if (errorData.error?.code === 403) {
          setTestResults(`❌ Google Sheets WRITE test failed: Permission denied

🔐 This means:
• Your API key has READ access but not WRITE access
• The sheet may be protected or read-only
• You may need to use OAuth2 instead of API key for write operations

💡 Solutions:
1. Check if the Google Sheet is shared with edit permissions
2. Consider using Google Apps Script for write operations
3. Use OAuth2 authentication for full read/write access

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

  const testCompleteFlow = async () => {
    setLoading(true);
    setTestResults('Testing complete Google Sheets flow...\n\n');

    try {
      // Step 1: Test read access
      setTestResults(prev => prev + '🔍 Step 1: Testing READ access...\n');
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
      
      await testReadAccess();
      
      // Step 2: Test write access
      setTestResults(prev => prev + '\n✍️ Step 2: Testing WRITE access...\n');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testWriteAccess();

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
          📊 Google Sheets Integration Test
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
                {getStatusChip(!!sheetId, 'Sheet ID Set')}
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
              
              <TextField
                label="Google Sheet ID"
                value={sheetId}
                onChange={(e) => setSheetId(e.target.value)}
                fullWidth
                size="small"
                sx={{ mb: 2 }}
                placeholder="Enter your Google Sheet ID (from the URL)"
              />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                💡 Get these from: Google Cloud Console → APIs & Services → Credentials (API Key) and your Google Sheet URL (Sheet ID)
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">📝 Test Data</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 2 }}>
              <TextField
                label="First Name"
                value={testData.firstName}
                onChange={(e) => setTestData({...testData, firstName: e.target.value})}
                size="small"
              />
              <TextField
                label="Last Name"
                value={testData.lastName}
                onChange={(e) => setTestData({...testData, lastName: e.target.value})}
                size="small"
              />
              <TextField
                label="Email"
                value={testData.email}
                onChange={(e) => setTestData({...testData, email: e.target.value})}
                size="small"
              />
              <TextField
                label="Phone"
                value={testData.phone}
                onChange={(e) => setTestData({...testData, phone: e.target.value})}
                size="small"
              />
              <TextField
                label="Rank"
                value={testData.rank}
                onChange={(e) => setTestData({...testData, rank: e.target.value})}
                size="small"
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
                disabled={loading || !apiKey || !sheetId}
                startIcon={loading ? <CircularProgress size={16} /> : null}
              >
                🧪 Complete Test
              </Button>
              <Button 
                variant="outlined" 
                onClick={testReadAccess}
                disabled={loading || !apiKey || !sheetId}
              >
                🔍 Test Read Only
              </Button>
              <Button 
                variant="outlined" 
                onClick={testWriteAccess}
                disabled={loading || !apiKey || !sheetId}
                color="secondary"
              >
                ✍️ Test Write Only
              </Button>
            </Box>

            {(!apiKey || !sheetId) && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>⚠️ Configuration Required</strong><br/>
                  Please provide both API Key and Sheet ID above to run tests.
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
          • <strong>Read Test:</strong> Connects to your Google Sheet and reads metadata + data<br/>
          • <strong>Write Test:</strong> Attempts to add a test record to verify write permissions<br/>
          • <strong>Complete Test:</strong> Runs both tests in sequence<br/><br/>
          
          <strong>⚠️ Important Notes:</strong><br/>
          • Write operations may require OAuth2 instead of API keys<br/>
          • Test records will be added to your actual sheet<br/>
          • Make sure you have proper permissions on the target sheet
        </Typography>
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsTest;

