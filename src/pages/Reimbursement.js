import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import { Receipt as ReimbursementIcon } from '@mui/icons-material';

const Reimbursement = () => {
  return (
    <Container maxWidth="lg">
      <Box display="flex" alignItems="center" mb={4}>
        <ReimbursementIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Reimbursement
        </Typography>
      </Box>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Expense Reimbursement Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This page will handle expense submissions, reimbursement requests,
            approval workflows, and payment tracking.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Reimbursement;
