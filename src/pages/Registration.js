import React from 'react';
import { Container, Card, CardContent } from '@mui/material';
import { Assignment as JobIcon } from '@mui/icons-material';
import PageTitle from '../components/PageTitle';

const Registration = () => {
  return (
    <Container maxWidth="lg">
      <PageTitle icon={JobIcon} title="Job" description="Create and manage scout/adult assignments" />
      
      <Card>
        <CardContent>
          {/* Placeholder content for now */}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Registration;
