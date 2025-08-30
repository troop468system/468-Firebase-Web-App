import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Grid,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save as SaveIcon,
  Science as TestIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

import { settingsService } from '../services/firestoreService';
import googleSheetsService from '../services/googleSheetsService';
import PageTitle from '../components/PageTitle';
import { Settings as SettingsIcon } from '@mui/icons-material';
import EmailWebhookTest from '../components/EmailWebhookTest';
import GoogleLoginDiagnostic from '../components/GoogleLoginDiagnostic';

const Settings = () => {
  const [settings, setSettings] = useState({
    googleSheetsApiKey: '',
    googleSheetsSheetId: '',
    emailSettings: {
      enabled: false,
      smtpHost: '',
      smtpPort: '',
      username: '',
      password: '',
    },
    notificationSettings: {
      autoSync: false,
      syncInterval: 60, // minutes
      emailNotifications: true,
      pushNotifications: false,
    },
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [testResults, setTestResults] = useState('');
  const [showTestDialog, setShowTestDialog] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Try to load from Firebase first, but fallback to environment variables
      let googleSheetsSettings, emailSettings, notificationSettings;
      
      try {
        googleSheetsSettings = await settingsService.get('googleSheets');
        emailSettings = await settingsService.get('email');
        notificationSettings = await settingsService.get('notifications');
      } catch (firebaseError) {
        console.log('Firebase not configured, using environment variables');
        googleSheetsSettings = null;
        emailSettings = null;
        notificationSettings = null;
      }

      setSettings({
        googleSheetsApiKey: googleSheetsSettings?.apiKey || process.env.REACT_APP_GOOGLE_SHEETS_API_KEY || '',
        googleSheetsSheetId: googleSheetsSettings?.sheetId || process.env.REACT_APP_GOOGLE_SHEETS_SHEET_ID || '',
        emailSettings: {
          enabled: emailSettings?.enabled || false,
          smtpHost: emailSettings?.smtpHost || process.env.REACT_APP_EMAIL_HOST || 'smtp.gmail.com',
          smtpPort: emailSettings?.smtpPort || process.env.REACT_APP_EMAIL_PORT || '587',
          username: emailSettings?.username || process.env.REACT_APP_EMAIL_USER || '',
          password: emailSettings?.password || process.env.REACT_APP_EMAIL_PASS || '',
        },
        notificationSettings: {
          autoSync: notificationSettings?.autoSync || false,
          syncInterval: notificationSettings?.syncInterval || 60,
          emailNotifications: notificationSettings?.emailNotifications !== false,
          pushNotifications: notificationSettings?.pushNotifications || false,
        },
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      // Fallback to environment variables only
      setSettings({
        googleSheetsApiKey: process.env.REACT_APP_GOOGLE_SHEETS_API_KEY || '',
        googleSheetsSheetId: process.env.REACT_APP_GOOGLE_SHEETS_SHEET_ID || '',
        emailSettings: {
          enabled: false,
          smtpHost: process.env.REACT_APP_EMAIL_HOST || 'smtp.gmail.com',
          smtpPort: process.env.REACT_APP_EMAIL_PORT || '587',
          username: process.env.REACT_APP_EMAIL_USER || '',
          password: process.env.REACT_APP_EMAIL_PASS || '',
        },
        notificationSettings: {
          autoSync: false,
          syncInterval: 60,
          emailNotifications: true,
          pushNotifications: false,
        },
      });
    }
  };

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      setError('');

      // Save Google Sheets settings
      await settingsService.update('googleSheets', {
        apiKey: settings.googleSheetsApiKey,
        sheetId: settings.googleSheetsSheetId,
      });

      // Save email settings
      await settingsService.update('email', settings.emailSettings || {});

      // Save notification settings
      await settingsService.update('notifications', settings.notificationSettings || {});

      setSuccess('Settings saved successfully!');
    } catch (error) {
      setError('Failed to save settings');
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestGoogleSheets = async () => {
    try {
      setTestResults('Testing Google Sheets connection...');
      setShowTestDialog(true);

      // Create a temporary service instance with current settings
      const tempApiKey = settings.googleSheetsApiKey;
      const tempSheetId = settings.googleSheetsSheetId;

      if (!tempApiKey || !tempSheetId) {
        setTestResults('Please provide both API Key and Sheet ID before testing.');
        return;
      }

      // Test the connection by trying to fetch sheet info
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${tempSheetId}?key=${tempApiKey}&fields=properties(title)`
      );

      if (response.ok) {
        const data = await response.json();
        setTestResults(`✅ Success! Connected to sheet: "${data.properties.title}"`);
      } else {
        const errorData = await response.json();
        setTestResults(`❌ Failed: ${errorData.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      setTestResults(`❌ Error: ${error.message}`);
    }
  };

  const configurationStatus = [
    {
      name: 'Google Sheets API',
      status: settings.googleSheetsApiKey && settings.googleSheetsSheetId ? 'configured' : 'incomplete',
      description: 'Required for syncing contact data from Google Sheets',
    },
    {
      name: 'Email Notifications',
      status: settings.emailSettings.enabled && settings.emailSettings.smtpHost ? 'configured' : 'incomplete',
      description: 'Required for sending email notifications to stakeholders',
    },
    {
      name: 'Auto-sync',
      status: settings.notificationSettings.autoSync ? 'enabled' : 'disabled',
      description: 'Automatically sync contact data at regular intervals',
    },
  ];

  return (
    <Container maxWidth="lg">
      <PageTitle
        icon={SettingsIcon}
        title="System Settings"
        description="Configure integrations and notification preferences"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Email Webhook Test Component */}
      <EmailWebhookTest />

      {/* Google Login Diagnostic Component */}
      <GoogleLoginDiagnostic />

      <Grid container spacing={3}>
        {/* Configuration Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configuration Status
              </Typography>
              <List>
                {configurationStatus.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={item.name}
                      secondary={item.description}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={item.status}
                        color={
                          item.status === 'configured' || item.status === 'enabled'
                            ? 'success'
                            : item.status === 'disabled'
                            ? 'default'
                            : 'warning'
                        }
                        variant="outlined"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Google Sheets Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Google Sheets Integration
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  label="API Key"
                  value={settings.googleSheetsApiKey}
                  onChange={(e) => handleInputChange('googleSheetsApiKey', '', e.target.value)}
                  fullWidth
                  type="password"
                  helperText="Get your API key from Google Cloud Console"
                />
                <TextField
                  label="Sheet ID"
                  value={settings.googleSheetsSheetId}
                  onChange={(e) => handleInputChange('googleSheetsSheetId', '', e.target.value)}
                  fullWidth
                  helperText="Found in the URL of your Google Sheet"
                />
                <Button
                  variant="outlined"
                  startIcon={<TestIcon />}
                  onClick={handleTestGoogleSheets}
                  disabled={!settings.googleSheetsApiKey || !settings.googleSheetsSheetId}
                >
                  Test Connection
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Email Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Email Configuration
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailSettings.enabled}
                      onChange={(e) => handleInputChange('emailSettings', 'enabled', e.target.checked)}
                    />
                  }
                  label="Enable Email Notifications"
                />
                <TextField
                  label="SMTP Host"
                  value={settings.emailSettings.smtpHost}
                  onChange={(e) => handleInputChange('emailSettings', 'smtpHost', e.target.value)}
                  fullWidth
                  disabled={!settings.emailSettings?.enabled}
                  placeholder="smtp.gmail.com"
                />
                <TextField
                  label="SMTP Port"
                  value={settings.emailSettings.smtpPort}
                  onChange={(e) => handleInputChange('emailSettings', 'smtpPort', e.target.value)}
                  fullWidth
                  disabled={!settings.emailSettings?.enabled}
                  placeholder="587"
                />
                <TextField
                  label="Username"
                  value={settings.emailSettings.username}
                  onChange={(e) => handleInputChange('emailSettings', 'username', e.target.value)}
                  fullWidth
                  disabled={!settings.emailSettings?.enabled}
                />
                <TextField
                  label="Password"
                  type="password"
                  value={settings.emailSettings.password}
                  onChange={(e) => handleInputChange('emailSettings', 'password', e.target.value)}
                  fullWidth
                  disabled={!settings.emailSettings?.enabled}
                  helperText="Use app-specific password for Gmail"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notification Preferences
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notificationSettings.autoSync}
                        onChange={(e) => handleInputChange('notificationSettings', 'autoSync', e.target.checked)}
                      />
                    }
                    label="Enable Auto-sync"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Sync Interval (minutes)"
                    type="number"
                    value={settings.notificationSettings.syncInterval}
                    onChange={(e) => handleInputChange('notificationSettings', 'syncInterval', parseInt(e.target.value))}
                    disabled={!settings.notificationSettings?.autoSync}
                    inputProps={{ min: 5, max: 1440 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notificationSettings.emailNotifications}
                        onChange={(e) => handleInputChange('notificationSettings', 'emailNotifications', e.target.checked)}
                      />
                    }
                    label="Email Notifications"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notificationSettings.pushNotifications}
                        onChange={(e) => handleInputChange('notificationSettings', 'pushNotifications', e.target.checked)}
                      />
                    }
                    label="Push Notifications"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveSettings}
              disabled={loading}
              size="large"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Test Results Dialog */}
      <Dialog open={showTestDialog} onClose={() => setShowTestDialog(false)}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <InfoIcon />
            Google Sheets Test Results
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {testResults}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTestDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings;