import React from 'react';
import {
  Container,
} from '@mui/material';

import PageTitle from '../components/PageTitle';
import { Settings as SettingsIcon } from '@mui/icons-material';
import SimpleEmailTest from '../components/SimpleEmailTest';
import SimpleCalendarTest from '../components/SimpleCalendarTest';

const Settings = () => {
  return (
    <Container maxWidth="lg">
      <PageTitle
        icon={SettingsIcon}
        title="System Settings"
        description="Test email and calendar integrations"
      />

      {/* Email Test Section */}
      <SimpleEmailTest />

      {/* Calendar Management Section */}
      <SimpleCalendarTest />
    </Container>
  );
};

export default Settings;