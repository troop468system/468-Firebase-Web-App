import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link,
  Divider
} from '@mui/material';
import {
  Login as LoginIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import authService from '../services/authService';
import PageTitle from '../components/PageTitle';

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

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      setError('Please enter your email address first');
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(formData.email);
      setResetEmailSent(true);
      setError('');
    } catch (error) {
      console.error('Password reset error:', error);
      
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else {
        setError('Failed to send password reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box mb={2}>
          <PageTitle icon={LoginIcon} title="Sign In" description="Welcome back to Troop 468" />
        </Box>

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

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            helperText="Enter your email address"
            required
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            required
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
            sx={{ mb: 2 }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>

          <Box textAlign="center">
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={handleForgotPassword}
              disabled={loading}
              sx={{ textDecoration: 'none' }}
            >
              Forgot Password?
            </Link>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box display="flex" flexDirection="column" gap={1.5}>
          <Button
            variant="outlined"
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

          <Divider>or</Divider>

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Don't have an account?
            </Typography>
            <Button
              variant="outlined"
              startIcon={<PersonAddIcon />}
              onClick={() => navigate('/register')}
              disabled={loading}
            >
              Request Registration
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
