import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import { Flag as NHPAIcon } from '@mui/icons-material';

const NHPA = () => {
  return (
    <Container maxWidth="lg">
      <Box display="flex" alignItems="center" mb={4}>
        <NHPAIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          NHPA
        </Typography>
      </Box>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            National Historic Preservation Awards
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This page will manage NHPA program participation,
            track community service projects, and award submissions.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default NHPA;
