import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import { EmojiEvents as MeritBadgesIcon } from '@mui/icons-material';

const MeritBadges = () => {
  return (
    <Container maxWidth="lg">
      <Box display="flex" alignItems="center" mb={4}>
        <MeritBadgesIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Merit Badges
        </Typography>
      </Box>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Merit Badge Tracking & Progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This page will track merit badge progress, counselor assignments,
            requirements completion, and badge awards.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default MeritBadges;
