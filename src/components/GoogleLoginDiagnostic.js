import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Alert, 
  Card, 
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';

const GoogleLoginDiagnostic = () => {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const checkFirebaseConfig = () => {
    const config = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    };

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔧 Firebase Configuration
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText 
                primary="API Key" 
                secondary={config.apiKey ? '✅ Configured' : '❌ Missing'} 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Auth Domain" 
                secondary={config.authDomain ? '✅ Configured' : '❌ Missing'} 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Project ID" 
                secondary={config.projectId ? '✅ Configured' : '❌ Missing'} 
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    );
  };

  const testGoogleAuth = async () => {
    setLoading(true);
    setTestResult('');

    try {
      console.log('🔍 Testing Google Authentication...');
      
      // Step 1: Check if auth is initialized
      if (!auth) {
        throw new Error('Firebase auth is not initialized');
      }
      console.log('✅ Firebase auth is initialized');

      // Step 2: Create Google provider
      const provider = new GoogleAuthProvider();
      console.log('✅ Google provider created');

      // Step 3: Attempt sign in
      console.log('🚀 Attempting Google sign-in popup...');
      const result = await signInWithPopup(auth, provider);
      
      console.log('✅ Google sign-in successful:', result.user);
      
      setTestResult(`✅ Google Authentication Test Successful!

📋 Test Results:
1. ✅ Firebase auth initialized
2. ✅ Google provider created  
3. ✅ Popup opened successfully
4. ✅ User authenticated: ${result.user.email}
5. ✅ User display name: ${result.user.displayName}

🎉 Google login is working correctly!`);

    } catch (error) {
      console.error('❌ Google authentication test failed:', error);
      
      let errorMessage = '❌ Google Authentication Test Failed!\n\n';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage += `🔍 Error: Popup closed by user
        
📋 This means:
• The popup opened successfully
• User closed it before completing authentication
• Try again and complete the Google sign-in process`;
        
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage += `🔍 Error: Popup blocked by browser
        
📋 Solutions:
• Allow popups for this site in browser settings
• Try a different browser
• Check if browser extensions are blocking popups`;
        
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage += `🔍 Error: Unauthorized domain
        
📋 Solutions:
• Add '${window.location.hostname}' to authorized domains in Firebase Console
• Go to Firebase Console > Authentication > Settings > Authorized domains
• Add both 'localhost' and your production domain`;
        
      } else if (error.code === 'auth/configuration-not-found') {
        errorMessage += `🔍 Error: Authentication configuration not found
        
📋 Solutions:
• Enable Google sign-in provider in Firebase Console
• Go to Firebase Console > Authentication > Sign-in method
• Enable Google provider and configure OAuth consent screen`;
        
      } else {
        errorMessage += `🔍 Error Code: ${error.code}
🔍 Error Message: ${error.message}

📋 General troubleshooting:
• Check Firebase Console for Google sign-in provider status
• Verify authorized domains include this domain
• Check browser console for additional errors
• Ensure OAuth consent screen is configured`;
      }
      
      setTestResult(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkDomainStatus = () => {
    const currentDomain = window.location.hostname;
    const currentOrigin = window.location.origin;
    
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🌐 Domain Information
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText 
                primary="Current Domain" 
                secondary={currentDomain} 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Current Origin" 
                secondary={currentOrigin} 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Protocol" 
                secondary={window.location.protocol} 
              />
            </ListItem>
          </List>
          <Alert severity="info" sx={{ mt: 1 }}>
            Make sure this domain is added to Firebase Console → Authentication → Settings → Authorized domains
          </Alert>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🔍 Google Login Diagnostic Tool
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        This tool helps diagnose Google authentication issues by testing the configuration step by step.
      </Typography>

      {checkFirebaseConfig()}
      {checkDomainStatus()}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🧪 Authentication Test
          </Typography>
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={testGoogleAuth}
            disabled={loading}
            sx={{ mb: 2 }}
          >
            {loading ? 'Testing...' : 'Test Google Authentication'}
          </Button>
          
          {testResult && (
            <Alert 
              severity={testResult.includes('✅') ? 'success' : 'error'} 
              sx={{ mt: 2 }}
            >
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
                {testResult}
              </pre>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📝 Manual Checklist
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="1. Firebase Console - Authentication" 
                secondary="Go to Firebase Console → Authentication → Sign-in method → Enable Google provider"
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText 
                primary="2. Authorized Domains" 
                secondary="Add your domain to Firebase Console → Authentication → Settings → Authorized domains"
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText 
                primary="3. OAuth Consent Screen" 
                secondary="Configure OAuth consent screen in Google Cloud Console"
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText 
                primary="4. Browser Settings" 
                secondary="Allow popups for this site and check for browser extensions blocking popups"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default GoogleLoginDiagnostic;
