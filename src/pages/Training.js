import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import { School as TrainingIcon } from '@mui/icons-material';

const Training = () => {
  return (
    <Container maxWidth="lg">
      <Box display="flex" alignItems="center" mb={4}>
        <TrainingIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Training
        </Typography>
      </Box>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Training Records & Requirements
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This page will track youth and adult training requirements,
            completion status, and training schedules.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Training;
