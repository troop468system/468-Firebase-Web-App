import React from 'react';
import {
  Container,
  Typography,
  Box,
} from '@mui/material';

import PageTitle from '../components/PageTitle';
import { Settings as SettingsIcon } from '@mui/icons-material';
import GoogleSheetsPostTest from '../components/GoogleSheetsPostTest';

const Settings = () => {
  return (
    <Container maxWidth="lg">
      <PageTitle
        icon={SettingsIcon}
        title="Google Sheets Integration Test"
        description="Test sending email data to your Google Sheets via Apps Script"
      />

      {/* Google Sheets POST Test Component */}
      <GoogleSheetsPostTest />

      <Box sx={{ mt: 4, p: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          📋 How This Works
        </Typography>
        <Typography variant="body2" paragraph>
          This test sends a sample email record to your Google Apps Script webhook, which should:
        </Typography>
        <Box component="ol" sx={{ pl: 2 }}>
          <Typography component="li" variant="body2">
            Receive the POST request with email data
          </Typography>
          <Typography component="li" variant="body2">
            Parse the email information (type, from, to, subject, etc.)
          </Typography>
          <Typography component="li" variant="body2">
            Save the data to your Google Sheets "Email Queue" tab
          </Typography>
          <Typography component="li" variant="body2">
            Return a success response with details
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
          💡 After testing, check your Google Sheets to verify the record was added correctly!
        </Typography>
      </Box>
    </Container>
  );
};

export default Settings;