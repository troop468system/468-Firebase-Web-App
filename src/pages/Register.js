import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Button
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import RegistrationForm from '../components/RegistrationForm';

const Register = () => {
  const navigate = useNavigate();

  const handleRegistrationSuccess = () => {
    // Optionally redirect or show additional instructions
    setTimeout(() => {
      navigate('/login');
    }, 3000);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 2 }}
        >
          Back to Home
        </Button>
      </Box>

      <RegistrationForm onSuccess={handleRegistrationSuccess} />
    </Container>
  );
};

export default Register;
