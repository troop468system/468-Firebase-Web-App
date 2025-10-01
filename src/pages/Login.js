import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import {
  Box
} from '@mui/material';
import authService from '../services/authService';
import LoginForm from '../components/LoginForm';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshAuth } = useAuth();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const user = await authService.initialize();
      if (user) {
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    };
    
    checkAuth();
  }, [navigate, location.state]);

  // Handle login success
  const handleLoginSuccess = async (user) => {
    console.log('✅ Login successful:', user);
    await refreshAuth();
    const from = location.state?.from?.pathname || '/dashboard';
    navigate(from, { replace: true });
  };

  // Handle login error
  const handleLoginError = (error) => {
    console.error('❌ Login error:', error);
    // Error handling is already done in the LoginForm component
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `
        linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)),
        url('https://images.unsplash.com/photo-1599575527475-f9e3d069fb01?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      p: { xs: 2, sm: 4 }
    }}>
      {/* Centered Login Form */}
      <LoginForm
        onSuccess={handleLoginSuccess}
        onError={handleLoginError}
        showRegistration={true}
        title="Welcome Back"
        subtitle="Sign in to continue to your account"
        showGreenLine={true}
        defaultTab={0}
      />
    </Box>
  );
};

export default Login;