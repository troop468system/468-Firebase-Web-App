import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import { Gavel as BORIcon } from '@mui/icons-material';

const BOR = () => {
  return (
    <Container maxWidth="lg">
      <Box display="flex" alignItems="center" mb={4}>
        <BORIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          BOR (Board of Review)
        </Typography>
      </Box>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Board of Review Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This page will schedule board of reviews, track advancement approvals,
            and manage review committee assignments.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default BOR;
