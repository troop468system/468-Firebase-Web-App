import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import authService from '../services/authService';

const SignUp = () => {
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });

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
    
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    
    if (!formData.displayName.trim()) {
      return 'Display name is required';
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

    setSubmitting(true);

    try {
      // Create user account with basic user role (requires admin approval)
      const userData = {
        displayName: formData.displayName,
        roles: ['user'],
        status: 'inactive' // Requires admin approval
      };

      await authService.signUp(formData.email, formData.password, userData);
      
      // Redirect to login page with success message
      navigate('/login', { 
        state: { 
          message: 'Account created successfully! Please wait for admin approval before logging in.' 
        }
      });
      
    } catch (error) {
      console.error('Sign up error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else {
        setError(error.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box textAlign="center" mb={4}>
          <PersonAddIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Sign Up for Troop 468
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your account to join the Troop 468 community
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            name="displayName"
            label="Full Name"
            value={formData.displayName}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            disabled={submitting}
          />

          <TextField
            name="email"
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            disabled={submitting}
          />

          <TextField
            name="password"
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            disabled={submitting}
            helperText="Minimum 6 characters"
          />

          <TextField
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            disabled={submitting}
          />

          <Box mt={3}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} /> : <PersonAddIcon />}
            >
              {submitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Box>

          <Box textAlign="center" mt={3}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Button 
                color="primary" 
                onClick={() => navigate('/login')}
                disabled={submitting}
                sx={{ textTransform: 'none' }}
              >
                Sign In
              </Button>
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Note:</strong> New accounts require admin approval before you can access the system. 
            You'll receive an email confirmation once your account is approved.
          </Typography>
        </Alert>
      </Paper>
    </Container>
  );
};

export default SignUp;