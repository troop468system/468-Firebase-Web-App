import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import { VolunteerActivism as PSVAIcon } from '@mui/icons-material';

const PSVA = () => {
  return (
    <Container maxWidth="lg">
      <Box display="flex" alignItems="center" mb={4}>
        <PSVAIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          PSVA
        </Typography>
      </Box>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            President's Volunteer Service Award
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This page will track volunteer service hours,
            manage PSVA applications, and monitor award eligibility.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default PSVA;
