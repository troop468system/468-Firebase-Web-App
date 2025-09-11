import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import {
  Typography,
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      {/* Left Panel - Hidden on mobile, visible on desktop */}
      <Box sx={{
        flex: '1 1 50%',
        width: '50%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
        {/* Header - Only show on mobile when left panel is hidden */}
        <Box sx={{ 
          textAlign: 'center', 
          mb: 4,
          display: { xs: 'block', md: 'none' },
          position: 'absolute',
          top: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1
        }}>
          <Typography variant="h4" component="h1" sx={{ 
            fontWeight: 'bold', 
            mb: 1,
            color: '#ffffff'
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
            color: '#ffffff',
            fontSize: '1rem',
            opacity: 0.9
          }}>
            Sign in to continue to your account
          </Typography>
        </Box>

        {/* Reusable Login Form */}
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
    </Box>
  );
};

export default Login;