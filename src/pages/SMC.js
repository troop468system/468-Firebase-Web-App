import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import { Assignment as SMCIcon } from '@mui/icons-material';

const SMC = () => {
  return (
    <Container maxWidth="lg">
      <Box display="flex" alignItems="center" mb={4}>
        <SMCIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          SMC (Scoutmaster Conference)
        </Typography>
      </Box>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Scoutmaster Conference Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This page will schedule and track Scoutmaster conferences,
            record meeting notes, and manage advancement discussions.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default SMC;
