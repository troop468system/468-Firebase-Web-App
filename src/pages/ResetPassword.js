import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../App';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Container,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import GoogleIcon from '@mui/icons-material/Google';
import { IconButton, InputAdornment } from '@mui/material';
import authService from '../services/authService';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshAuth } = useAuth();
  
  // Get parameters from URL
  const mode = searchParams.get('mode'); // 'resetPassword' for Firebase, 'newUser' for new registrations, 'customReset' for Google Sheets reset
  const oobCode = searchParams.get('oobCode'); // Firebase out-of-band code
  const userId = searchParams.get('userId'); // For new user registrations
  const token = searchParams.get('token'); // Custom token for new users or password reset
  const urlEmail = searchParams.get('email'); // Email from account setup URL
  // Email is no longer in URL for security - will be retrieved from token (except for account setup)

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [email, setEmail] = useState(''); // Email retrieved from token for security
  const [passwordFeedback, setPasswordFeedback] = useState([]);
  const [validatingCode, setValidatingCode] = useState(true);
  const [codeValid, setCodeValid] = useState(false);
  const [resetType, setResetType] = useState(''); // 'firebase', 'newUser', or 'accountSetup'
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isGmailUser, setIsGmailUser] = useState(false);
  const [showGoogleLogin, setShowGoogleLogin] = useState(false);
  const [isAccountSetup, setIsAccountSetup] = useState(false); // For Gmail users, hide password form initially

  // Helper function to detect Gmail addresses
  const isGmailAddress = (email) => {
    return email && email.toLowerCase().endsWith('@gmail.com');
  };

  // Helper function to handle Google sign-in
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 Starting Google sign-in from reset page...');
      
      // Use different method for account setup vs regular login
      let result;
      if (resetType === 'accountSetup' && email && token) {
        console.log('🔧 Using account setup Google sign-in method');
        result = await authService.signInWithGoogleForAccountSetup(email, token);
      } else {
        console.log('🔧 Using regular Google sign-in method');
        result = await authService.signInWithGoogle();
      }
      
      console.log('✅ Google sign-in successful:', result);
      
      // Refresh auth context to ensure immediate state update
      console.log('Refreshing auth context after successful Google account setup...');
      await refreshAuth();
      
      // Small delay to ensure auth context is updated before navigation
      setTimeout(() => {
        console.log('Navigating to dashboard after auth context refresh...');
        navigate('/dashboard', { replace: true });
      }, 100);
    } catch (error) {
      console.error('❌ Google login error:', error);
      setError('Failed to sign in with Google. Please try again or use the password option below.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const validateResetCode = async () => {
      try {
        setValidatingCode(true);
        
        // Check if this is the new account setup flow
        const currentPath = window.location.pathname;
        const isAccountSetupFlow = currentPath === '/account-setup';
        setIsAccountSetup(isAccountSetupFlow);
        
        console.log('🔍 DEBUG: Current path:', currentPath);
        console.log('🔍 DEBUG: Is account setup flow:', isAccountSetupFlow);
        console.log('🔍 DEBUG: URL email:', urlEmail);
        console.log('🔍 DEBUG: Token present:', !!token);
        
        if (isAccountSetupFlow && urlEmail && token) {
          // New account setup flow from invitation email
          console.log('🔍 Validating account setup token for:', urlEmail);
          setEmail(urlEmail);
          setIsGmailUser(isGmailAddress(urlEmail));
          
          // Validate the token
          const result = await authService.validateNewUserToken(urlEmail, token);
          if (result.valid) {
            setResetType('accountSetup');
            setCodeValid(true);
            
            // For Gmail users, show Google login option first
            if (isGmailAddress(urlEmail)) {
              setShowGoogleLogin(true);
            } else {
              setShowPasswordForm(true);
            }
            
            console.log('✅ Account setup token valid for:', result.email);
          } else {
            throw new Error('Invalid or expired setup link');
          }
        } else if (mode === 'resetPassword' && oobCode) {
          // Firebase password reset flow
          console.log('🔍 Validating Firebase reset code...');
          const userEmail = await authService.verifyPasswordResetCode(oobCode);
          setEmail(userEmail);
          setResetType('firebase');
          setCodeValid(true);
          console.log('✅ Firebase reset code valid for:', userEmail);
        } else if (mode === 'customReset' && token) {
          // Custom password reset flow (Google Sheets email system)
          console.log('🔍 DEBUG: Taking customReset path');
          console.log('🔍 DEBUG: mode:', mode, 'token:', !!token);
          console.log('🔍 Validating custom reset token...');
          
          // First get email from token (for security)
          const tokenEmail = await authService.getEmailFromResetToken(token);
          setEmail(tokenEmail);
          console.log('🔍 Retrieved email from token:', tokenEmail);
          
          // For non-Gmail users, show password form immediately
          if (!isGmailAddress(tokenEmail)) {
            setShowPasswordForm(true);
          }
          
          // Then validate the token
          const result = await authService.validateCustomResetToken(token, tokenEmail);
          if (result.valid) {
            setResetType('customReset');
            setCodeValid(true);
            console.log('✅ Custom reset token valid for:', result.email);
          } else {
            throw new Error(result.error || 'Invalid or expired reset link');
          }
        } else if (userId && token) {
          // Legacy new user registration flow
          console.log('🔍 Validating new user token...');
          const result = await authService.validateNewUserToken(userId, token);
          if (result.valid) {
            setEmail(result.email);
            setResetType('newUser');
            setCodeValid(true);
            
            // For non-Gmail users, show password form immediately
            if (!isGmailAddress(result.email)) {
              setShowPasswordForm(true);
            }
            
            console.log('✅ New user token valid for:', result.email);
          } else {
            throw new Error('Invalid or expired registration link');
          }
        } else {
          throw new Error('Invalid reset link parameters');
        }
      } catch (error) {
        console.error('❌ Reset code validation failed:', error);
        setError(error.message || 'Invalid or expired reset link');
        setCodeValid(false);
      } finally {
        setValidatingCode(false);
      }
    };

    validateResetCode();
  }, [mode, oobCode, userId, token, urlEmail]);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Real-time password strength checking
    if (name === 'password' && value) {
      try {
        const validation = await authService.validatePasswordStrength(value);
        setPasswordStrength(validation.strength);
        setPasswordFeedback(validation.issues);
      } catch (error) {
        console.warn('Password validation error:', error);
      }
    } else if (name === 'password' && !value) {
      setPasswordStrength(null);
      setPasswordFeedback([]);
    }
  };

  const validateForm = () => {
    if (!formData.password) {
      return 'Password is required';
    }
    
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
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
      if (resetType === 'firebase') {
        // Firebase password reset
        console.log('🔄 Resetting password via Firebase...');
        await authService.confirmPasswordReset(oobCode, formData.password);
        console.log('✅ Firebase password reset successful');
      } else if (resetType === 'customReset') {
        // Custom password reset (Google Sheets email system)
        console.log('🔄 Resetting password via custom system...');
        const result = await authService.completeCustomPasswordReset(token, email, formData.password);
        console.log('✅ Custom password reset successful:', result);
        
        // Handle different result types
        if (result.method === 'firebase_builtin') {
          // For Firebase builtin, we don't set success since they need to check email
          setError('Password reset email sent via Firebase. Please check your email and follow the Firebase reset link.');
          return; // Don't redirect to login
        } else if (result.method === 'completed') {
          // Password reset completed successfully
          console.log('✅ Password reset completed successfully');
          // Continue to success flow
        }
      } else if (resetType === 'newUser') {
        // Legacy new user password setup
        console.log('🔄 Setting up password for new user...');
        await authService.completeNewUserRegistration(userId, token, formData.password);
        console.log('✅ New user password setup successful');
      } else if (resetType === 'accountSetup') {
        // New account setup flow
        console.log('🔄 Setting up password for new account...');
        await authService.completeNewUserRegistration(email, token, formData.password);
        console.log('✅ New account setup successful');
      }
      
      setSuccess(true);
      
      // Handle redirect based on reset type
      if (resetType === 'accountSetup') {
        // For account setup, user is now authenticated - go to dashboard
        console.log('Account setup complete, refreshing auth and redirecting to dashboard...');
        await refreshAuth();
        
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500); // Shorter delay for better UX
      } else {
        // For password reset, redirect to login
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: resetType === 'firebase' || resetType === 'customReset'
                ? 'Password reset successful! Please sign in with your new password.' 
                : 'Account setup complete! Please sign in with your new password.',
              email: email
            }
          });
        }, 3000);
      }
      
    } catch (error) {
      console.error('❌ Password reset error:', error);
      
      let errorMessage = 'Failed to reset password. Please try again.';
      if (error.code === 'auth/expired-action-code') {
        errorMessage = 'This reset link has expired. Please request a new one.';
      } else if (error.code === 'auth/invalid-action-code') {
        errorMessage = 'This reset link is invalid. Please request a new one.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (validatingCode) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Validating Reset Link...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we verify your reset link.
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (!codeValid) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <LockIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="error">
            Invalid Reset Link
          </Typography>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            This reset link is invalid, expired, or has already been used.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/login')}
            sx={{ mr: 2 }}
          >
            Back to Login
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/login', { state: { showForgotPassword: true } })}
          >
            Request New Reset Link
          </Button>
        </Paper>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <LockIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="success.main">
            {resetType === 'firebase' || resetType === 'customReset' 
              ? 'Password Reset Complete!' 
              : resetType === 'accountSetup'
              ? 'Welcome to Troop 468!'
              : 'Account Setup Complete!'
            }
          </Typography>
          <Alert severity="success" sx={{ mb: 3 }}>
            {resetType === 'firebase' || resetType === 'customReset'
              ? 'Your password has been successfully reset.'
              : resetType === 'accountSetup'
              ? 'Your account has been set up successfully! You can now sign in to access the Troop 468 system.'
              : 'Your account has been set up successfully.'
            }
          </Alert>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You will be redirected to the login page shortly, or you can click below to sign in now.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/login', { 
              state: { 
                message: resetType === 'firebase' 
                  ? 'Password reset successful! Please sign in with your new password.' 
                  : 'Account setup complete! Please sign in with your new password.',
                email: email
              }
            })}
          >
            Sign In Now
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box textAlign="center" mb={4}>
          <LockIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            {resetType === 'firebase' || resetType === 'customReset' 
              ? 'Reset Your Password' 
              : resetType === 'accountSetup'
              ? 'Complete Your Account Setup'
              : 'Set Up Your Password'
            }
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {resetType === 'firebase' || resetType === 'customReset'
              ? `Enter a new password for ${email}`
              : resetType === 'accountSetup'
              ? `Welcome to Troop 468! Complete your account setup for ${email}`
              : `Welcome! Please set up your password for ${email}`
            }
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Show Google Login option for Gmail users */}
        {isGmailAddress(email) && !showPasswordForm && (
          <Box sx={{ mb: 4 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              We detected you're using a Gmail address. You can sign in directly with Google for easier access!
            </Alert>
            
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleSignIn}
              disabled={loading}
              sx={{ 
                mb: 3, 
                py: 1.5,
                bgcolor: '#4285f4',
                '&:hover': {
                  bgcolor: '#3367d6'
                }
              }}
            >
              Continue with Google
            </Button>
            
            <Box textAlign="center">
              <Typography 
                variant="body2" 
                component="button"
                type="button"
                onClick={() => setShowPasswordForm(true)}
                sx={{ 
                  color: '#1976d2',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                  '&:hover': {
                    color: '#1565c0'
                  }
                }}
              >
                Or set up a password instead
              </Typography>
            </Box>
          </Box>
        )}

        {/* Show password form for non-Gmail users or when explicitly requested */}
        {showPasswordForm && (
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="New Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              required
              sx={{ mb: 1 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ mr: 1 }}>
                    Password Strength:
                  </Typography>
                  <Chip
                    size="small"
                    label={passwordStrength || 'Checking...'}
                    color={
                      passwordStrength === 'strong' ? 'success' :
                      passwordStrength === 'medium' ? 'warning' :
                      passwordStrength === 'weak' ? 'error' : 'default'
                    }
                    icon={
                      passwordStrength === 'strong' ? <CheckIcon /> :
                      passwordStrength === 'medium' ? <WarningIcon /> :
                      <CloseIcon />
                    }
                  />
                </Box>
                
                {/* Password Requirements */}
                {passwordFeedback.length > 0 && (
                  <Box sx={{ bgcolor: '#fff3e0', p: 2, borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      Password Requirements:
                    </Typography>
                    <List dense sx={{ py: 0 }}>
                      {passwordFeedback.map((issue, index) => (
                        <ListItem key={index} sx={{ py: 0, px: 1 }}>
                          <ListItemIcon sx={{ minWidth: 24 }}>
                            <CloseIcon sx={{ fontSize: 16, color: 'error.main' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={issue} 
                            primaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
                
                {/* Strength Progress Bar */}
                <LinearProgress
                  variant="determinate"
                  value={
                    passwordStrength === 'strong' ? 100 :
                    passwordStrength === 'medium' ? 75 :
                    passwordStrength === 'weak' ? 50 : 25
                  }
                  color={
                    passwordStrength === 'strong' ? 'success' :
                    passwordStrength === 'medium' ? 'warning' : 'error'
                  }
                  sx={{ height: 6, borderRadius: 3, mt: 1 }}
                />
              </Box>
            )}
          
          <TextField
            fullWidth
            label="Confirm New Password"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={loading}
            required
            sx={{ mb: 3 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mb: 2 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              resetType === 'firebase' || resetType === 'customReset' ? 'Reset Password' : 'Set Up Password'
            )}
          </Button>

          <Box textAlign="center">
            <Button
              variant="text"
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              Back to Login
            </Button>
          </Box>
        </Box>
        )}
        
        {/* Back to Login button for Gmail users who don't want to use password form */}
        {isGmailAddress(email) && !showPasswordForm && (
          <Box textAlign="center" sx={{ mt: 2 }}>
            <Button
              variant="text"
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              Back to Login
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ResetPassword;
