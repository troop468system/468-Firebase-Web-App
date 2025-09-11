import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link,
  Tabs,
  Tab,
  Switch,
  FormControlLabel
} from '@mui/material';
import authService from '../services/authService';
import GoogleLogo from './GoogleLogo';

const LoginForm = ({ 
  onSuccess, 
  onError,
  showRegistration = true,
  title = "Sign In",
  subtitle = "Sign in to continue to your account",
  showGreenLine = false,
  defaultTab = 0, // 0 = Sign In, 1 = New Member
  inFlippedContainer = false // Fix for tab indicator in CSS transformed containers
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab); // 0 = Login, 1 = Registration
  const [useEmailLogin, setUseEmailLogin] = useState(false); // false = Google (default), true = Email/Password
  const [showForgotPassword, setShowForgotPassword] = useState(false); // Show dedicated forgot password view

  // Force tabs to recalculate when in flipped container
  React.useEffect(() => {
    if (inFlippedContainer) {
      const timer = setTimeout(() => {
        // Force MUI Tabs to recalculate indicator position
        const tabsElement = document.querySelector('.MuiTabs-root');
        if (tabsElement) {
          // Trigger a resize to force recalculation
          window.dispatchEvent(new Event('resize'));
        }
      }, 200); // Slightly longer delay for flip animation
      return () => clearTimeout(timer);
    }
  }, [inFlippedContainer, activeTab]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Clear any errors when switching tabs
    setError('');
    setResetEmailSent(false);
    setUseEmailLogin(false); // Reset to Google login when switching tabs
    setShowForgotPassword(false); // Reset forgot password view
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      console.log('🔍 Starting Google sign-in...');
      const result = await authService.signInWithGoogle();
      console.log('✅ Google sign-in successful:', result);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (e) {
      console.error('❌ Google login error:', e);
      console.error('Error code:', e.code);
      console.error('Error message:', e.message);
      
      let errorMessage = 'Failed to sign in with Google';
      if (e.code === 'auth/api-key-not-valid') {
        errorMessage = 'Firebase configuration error. Please contact admin.';
      } else if (e.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups for this site and try again.';
      } else if (e.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled. Please try again.';
      } else if (e.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized for Google sign-in.';
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      setError(errorMessage);
      if (onError) {
        onError(e);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle email/password login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await authService.signInWithEmail(formData.email, formData.password);
      console.log('✅ Email login successful:', result);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (e) {
      console.error('❌ Email login error:', e);
      
      let errorMessage = 'Failed to sign in';
      if (e.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (e.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (e.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (e.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      setError(errorMessage);
      if (onError) {
        onError(e);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle registration
  const handleRegistration = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await authService.signUpWithEmail(formData.email, formData.password);
      console.log('✅ Registration successful:', result);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (e) {
      console.error('❌ Registration error:', e);
      
      let errorMessage = 'Failed to create account';
      if (e.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (e.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (e.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      setError(errorMessage);
      if (onError) {
        onError(e);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await authService.sendPasswordResetEmail(formData.email);
      setResetEmailSent(true);
      setError('');
    } catch (e) {
      console.error('❌ Password reset error:', e);
      
      let errorMessage = 'Failed to send reset email';
      if (e.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (e.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Back to login from forgot password
  const backToLogin = () => {
    setShowForgotPassword(false);
    setError('');
    setResetEmailSent(false);
  };

  return (
    <Paper elevation={3} sx={{ 
      p: { xs: 4, sm: 6 }, 
      maxWidth: 480, 
      width: '100%',
      borderRadius: 2
    }}>
      {/* Header */}
      <Box sx={{ 
        textAlign: 'center', 
        mb: 4
      }}>
        <Typography variant="h4" component="h1" sx={{ 
          fontWeight: 'bold', 
          mb: showGreenLine ? 1 : 2,
          color: '#34495e'
        }}>
          {title}
        </Typography>
        
        {showGreenLine && (
          <Box sx={{ 
            width: 60, 
            height: 4, 
            bgcolor: '#4caf50', 
            mx: 'auto',
            mb: 2,
            borderRadius: 2
          }} />
        )}
        
        <Typography variant="body1" sx={{ 
          color: 'text.secondary',
          fontSize: '1rem'
        }}>
          {subtitle}
        </Typography>
      </Box>

      {/* Tabs for Login and Registration */}
      {showRegistration && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            key={inFlippedContainer ? 'flipped-tabs' : 'normal-tabs'}
            value={activeTab} 
            onChange={handleTabChange} 
            centered
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#4caf50'
              }
            }}
          >
            <Tab 
              label="Sign In" 
              sx={{ 
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: '#4caf50'
                }
              }}
            />
            <Tab 
              label="New Member" 
              sx={{ 
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: '#4caf50'
                }
              }}
            />
          </Tabs>
        </Box>
      )}

      {/* Forgot Password View */}
      {showForgotPassword ? (
        <>
          <Typography variant="h6" sx={{ mb: 3, textAlign: 'center', color: '#34495e' }}>
            Reset Password
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
            Enter your email address and we'll send you a link to reset your password.
          </Typography>

          {resetEmailSent && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Password reset email sent! Check your inbox and follow the instructions to reset your password.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handlePasswordReset}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              sx={{ mb: 3 }}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ 
                mb: 3,
                py: 1.5,
                bgcolor: '#4caf50',
                '&:hover': {
                  bgcolor: '#45a049'
                }
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Reset Password'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                type="button"
                onClick={backToLogin}
                sx={{ 
                  color: '#1976d2',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Back to Sign In
              </Link>
            </Box>
          </Box>
        </>
      ) : (
        <>
          {/* Login Tab Content */}
          {activeTab === 0 && (
            <>
              {resetEmailSent && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Password reset email sent! Check your inbox and follow the instructions to reset your password.
                </Alert>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {/* Login Method Switch */}
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={useEmailLogin}
                      onChange={(e) => {
                        setUseEmailLogin(e.target.checked);
                        setError(''); // Clear errors when switching
                        setResetEmailSent(false);
                      }}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#4caf50',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#4caf50',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Use ID & Password Login
                    </Typography>
                  }
                  labelPlacement="start"
                  sx={{ 
                    m: 0,
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.875rem'
                    }
                  }}
                />
              </Box>

              {/* Google Login Button - Show when switch is OFF */}
              {!useEmailLogin && (
                <Box sx={{ mb: 4 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    startIcon={<GoogleLogo size={20} />}
                    sx={{ 
                      mb: 3, 
                      py: 1.5,
                      borderColor: '#e0e0e0',
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: '#4285f4',
                        bgcolor: 'rgba(66, 133, 244, 0.04)'
                      }
                    }}
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Continue with Google'}
                  </Button>
                </Box>
              )}

              {/* Email/Password Login Form - Show when switch is ON */}
              {useEmailLogin && (
                <Box component="form" onSubmit={handleEmailLogin}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    sx={{ mb: 3 }}
                    disabled={loading}
                  />
                  
                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    sx={{ mb: 3 }}
                    disabled={loading}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{ 
                      mb: 3,
                      py: 1.5,
                      bgcolor: '#4caf50',
                      '&:hover': {
                        bgcolor: '#45a049'
                      }
                    }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Sign In'}
                  </Button>

                  <Box sx={{ textAlign: 'center' }}>
                    <Link
                      component="button"
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      sx={{ 
                        color: '#1976d2',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      Forgot Password?
                    </Link>
                  </Box>
                </Box>
              )}
            </>
          )}

          {/* Registration Tab Content */}
          {activeTab === 1 && showRegistration && (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleRegistration}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  sx={{ mb: 3 }}
                  disabled={loading}
                />
                
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  helperText="Password should be at least 6 characters"
                  sx={{ mb: 3 }}
                  disabled={loading}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{ 
                    py: 1.5,
                    bgcolor: '#4caf50',
                    '&:hover': {
                      bgcolor: '#45a049'
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Create Account'}
                </Button>
              </Box>
            </>
          )}
        </>
      )}
    </Paper>
  );
};

export default LoginForm;
