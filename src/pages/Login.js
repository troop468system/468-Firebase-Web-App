import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
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
import GoogleLogo from '../components/GoogleLogo';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshAuth } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = Login, 1 = Registration
  const [useEmailLogin, setUseEmailLogin] = useState(false); // false = Google (default), true = Email/Password
  const [showForgotPassword, setShowForgotPassword] = useState(false); // Show dedicated forgot password view

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Clear any errors when switching tabs
    setError('');
    setResetEmailSent(false);
    setUseEmailLogin(false); // Reset to Google login when switching tabs
    setShowForgotPassword(false); // Reset forgot password view
  };

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const user = await authService.initialize();
      if (user) {
        navigate('/dashboard');
        return;
      }


    };
    
    checkAuth();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      return 'Email is required';
    }
    
    if (!formData.password) {
      return 'Password is required';
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const user = await authService.signIn(formData.email, formData.password);
      console.log('Login successful, user:', user); // Debug log
      
      // Manually refresh the auth context to ensure immediate state update
      console.log('Refreshing auth context after successful login...');
      await refreshAuth();
      
      // Small delay to ensure auth context is updated
      setTimeout(() => {
        console.log('Navigating to dashboard after auth context refresh...');
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }, 100);
      
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError(error.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show forgot password view
  const showForgotPasswordView = () => {
    setShowForgotPassword(true);
    setError('');
    setResetEmailSent(false);
  };

  // Handle password reset submission
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResetEmailSent(false);
      
      console.log('🔍 Checking if user is Google Login user:', formData.email);
      
      // First check if this is a Google Login user
      const isGoogleUser = await authService.isGoogleLoginUser(formData.email);
      
      if (isGoogleUser) {
        console.log('🔍 Google Login user detected');
        setError('You are using Google Login for this account. No password reset is needed - simply use "Continue with Google" to access your account.');
        return;
      }
      
      console.log('🔄 Sending password reset email to:', formData.email);
      await authService.resetPassword(formData.email);
      setResetEmailSent(true);
      console.log('✅ Password reset email sent successfully');
    } catch (error) {
      console.error('❌ Password reset error:', error);
      
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many reset attempts. Please try again later.');
      } else {
        setError('Failed to send password reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Go back to login view
  const backToLogin = () => {
    setShowForgotPassword(false);
    setError('');
    setResetEmailSent(false);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex',
      bgcolor: '#f5f5f5'
    }}>
      {/* Left Panel - Hidden on mobile, visible on tablet+ */}
      <Box sx={{
        flex: '1 1 50%',
        width: '50%',
        bgcolor: '#34495e',
        color: 'white',
        p: 6,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <Typography variant="h3" component="h1" sx={{ 
          fontWeight: 'bold', 
          mb: 2,
          fontSize: { md: '2.5rem', lg: '3rem' },
          color: '#ffffff'
        }}>
          Welcome to
        </Typography>
        <Typography variant="h3" component="h1" sx={{ 
          fontWeight: 'bold', 
          mb: 4,
          fontSize: { md: '2.5rem', lg: '3rem' },
          color: '#ffffff'
        }}>
          Troop 468
        </Typography>
        
        <Box sx={{ 
          width: 60, 
          height: 4, 
          bgcolor: '#4caf50', 
          mb: 4,
          borderRadius: 2
        }} />
        
        <Typography variant="h6" sx={{ 
          color: '#ffffff',
          opacity: 0.95,
          lineHeight: 1.6,
          maxWidth: 400,
          fontSize: '1.1rem'
        }}>
          Sign in to continue to your account.
        </Typography>
      </Box>

      {/* Right Panel - Full width on mobile, half width on desktop */}
      <Box sx={{
        flex: { xs: 1, md: '1 1 50%' },
        width: { xs: '100%', md: '50%' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 4 },
        minHeight: '100vh'
      }}>
        <Paper elevation={3} sx={{ 
          p: { xs: 4, sm: 6 }, 
          maxWidth: 480, 
          width: '100%',
          borderRadius: 2
        }}>
          {/* Header - Only show on mobile when left panel is hidden */}
          <Box sx={{ 
            textAlign: 'center', 
            mb: 4,
            display: { xs: 'block', md: 'none' }
          }}>
            <Typography variant="h4" component="h1" sx={{ 
              fontWeight: 'bold', 
              mb: 1,
              color: '#34495e'
            }}>
              Welcome to Troop 468
            </Typography>
            
            <Box sx={{ 
              width: 60, 
              height: 4, 
              bgcolor: '#4caf50', 
              mx: 'auto',
              mb: 2,
              borderRadius: 2
            }} />
            
            <Typography variant="body1" sx={{ 
              color: 'text.secondary',
              fontSize: '1rem'
            }}>
              Sign in to continue to your account
            </Typography>
          </Box>

          {/* Tabs for Login and Registration */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
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
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  '&.Mui-selected': {
                    color: '#4caf50'
                  }
                }} 
              />
              <Tab 
                label="New Member" 
                sx={{ 
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  '&.Mui-selected': {
                    color: '#4caf50'
                  }
                }} 
              />
            </Tabs>
          </Box>

          {/* Forgot Password View */}
          {showForgotPassword ? (
            <>
              <Typography variant="h5" component="h2" sx={{ 
                textAlign: 'center', 
                mb: 2,
                fontWeight: 600,
                color: '#34495e'
              }}>
                Reset Your Password
              </Typography>
              
              <Typography variant="body2" sx={{ 
                textAlign: 'center', 
                mb: 4,
                color: 'text.secondary'
              }}>
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
                      {useEmailLogin ? 'Use Google Login' : 'Use Email & Password'}
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
              onClick={async () => {
                setError('');
                setLoading(true);
                try {
                  console.log('🔍 Starting Google sign-in...');
                  const result = await authService.signInWithGoogle();
                  console.log('✅ Google sign-in successful:', result);
                  await refreshAuth();
                  navigate('/dashboard', { replace: true });
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
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              Continue with Google
            </Button>
          </Box>
          )}

          {/* Email/Password Login - Show when switch is ON */}
          {useEmailLogin && (
            <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              placeholder="Email address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f8f9fa',
                  '& fieldset': {
                    borderColor: '#e0e0e0'
                  },
                  '&:hover fieldset': {
                    borderColor: '#1976d2'
                  }
                }
              }}
            />

            <TextField
              fullWidth
              placeholder="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              required
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f8f9fa',
                  '& fieldset': {
                    borderColor: '#e0e0e0'
                  },
                  '&:hover fieldset': {
                    borderColor: '#1976d2'
                  }
                }
              }}
            />

            {/* Forgot Password Link - positioned right below password input */}
            <Box sx={{ mb: 3, textAlign: 'left' }}>
              <Link
                component="button"
                type="button"
                onClick={showForgotPasswordView}
                disabled={loading}
                sx={{ 
                  color: '#1976d2',
                  textDecoration: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 400,
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Forgot Password?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ 
                py: 1.5,
                bgcolor: '#4caf50',
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#45a049'
                },
                mb: 2
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
          </Box>
          )}
          </>
          )}

          {/* Registration Tab Content */}
          {activeTab === 1 && (
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="info" sx={{ mb: 4, textAlign: 'left' }}>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
                  Ready to join Troop 468?
                </Typography>
                <Typography variant="body2">
                  We'll review your registration request and contact you once it's approved. 
                  You'll receive an email with instructions to complete your account setup and begin your scouting journey with us.
                </Typography>
              </Alert>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                sx={{ 
                  py: 1.5,
                  bgcolor: '#4caf50',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  mb: 3,
                  '&:hover': {
                    bgcolor: '#45a049'
                  }
                }}
              >
                Start Registration
              </Button>

            </Box>
          )}
              </>
            )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Login;
