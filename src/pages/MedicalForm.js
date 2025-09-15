import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import { LocalHospital as MedicalIcon } from '@mui/icons-material';

const MedicalForm = () => {
  return (
    <Container maxWidth="lg">
      <Box display="flex" alignItems="center" mb={4}>
        <MedicalIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Medical Forms
        </Typography>
      </Box>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Medical Forms & Health Records
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This page will manage medical forms, health information,
            medication tracking, and emergency contact details.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default MedicalForm;
