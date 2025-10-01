import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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

  // Registration is handled on a dedicated page now

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
    <Paper elevation={0} className="glass-form" sx={{ 
      p: { xs: 4, sm: 6 }, 
      maxWidth: 480, 
      width: '100%',
      borderRadius: 4,
      background: 'transparent',
      backdropFilter: 'blur(20px)',
      border: 'none',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      WebkitBackdropFilter: 'blur(20px)' // Safari support
    }}>
      {/* Header */}
      <Box sx={{ 
        textAlign: 'center', 
        mb: 4
      }}>
        {/* Troop 468 Logo */}
        <Box 
          className="logo-container"
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            overflow: 'hidden'
          }}>
          <img 
            src="/assets/images/logo-troop-468.png" 
            alt="Troop 468 Logo"
            style={{
              width: '60px',
              height: '60px',
              objectFit: 'contain'
            }}
          />
        </Box>

        <Typography variant="h4" component="h1" sx={{ 
          fontWeight: 'bold', 
          mb: showGreenLine ? 1 : 2,
          color: 'rgba(255, 255, 255, 0.95)'
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
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '1rem'
        }}>
          {subtitle}
        </Typography>
      </Box>

      {/* Tabs for Login and Registration */}
      {showRegistration && (
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.2)', mb: 3 }}>
          <Tabs 
            key={inFlippedContainer ? 'flipped-tabs' : 'normal-tabs'}
            value={activeTab} 
            onChange={handleTabChange} 
            centered
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: 'rgba(255, 255, 255, 0.8)'
              }
            }}
          >
            <Tab 
              label="Sign In" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-selected': {
                  color: 'rgba(255, 255, 255, 0.95)'
                }
              }}
            />
            <Tab 
              label="New Member" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-selected': {
                  color: 'rgba(255, 255, 255, 0.95)'
                }
              }}
            />
          </Tabs>
        </Box>
      )}

      {/* Forgot Password View */}
      {showForgotPassword ? (
        <>
          <Typography variant="h6" sx={{ mb: 3, textAlign: 'center', color: 'rgba(255, 255, 255, 0.95)' }}>
            Reset Password
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'rgba(255, 255, 255, 0.8)' }}>
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
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
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
                    variant="contained"
                    size="large"
                    startIcon={<GoogleLogo size={20} />}
                    sx={{ 
                      mb: 3, 
                      py: 1.5
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

              <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', color: 'rgba(255, 255, 255, 0.95)' }}>
                New to Troop 468?
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'rgba(255, 255, 255, 0.8)' }}>
                Use our registration page to request an account.
              </Typography>

              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate('/register')}
                sx={{ 
                  py: 1.5,
                  bgcolor: '#4caf50',
                  '&:hover': {
                    bgcolor: '#45a049'
                  }
                }}
              >
                Go to Registration
              </Button>
            </>
          )}
        </>
      )}
    </Paper>
  );
};

export default LoginForm;
