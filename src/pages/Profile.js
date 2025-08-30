import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Grid,
} from '@mui/material';
import { AccountCircle, Save as SaveIcon } from '@mui/icons-material';

const Profile = () => {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    troop: 'Troop 468',
  });

  const handleChange = (field) => (event) => {
    setProfile(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSave = () => {
    // TODO: Save profile to backend
    console.log('Saving profile:', profile);
  };

  return (
    <Container maxWidth="md">
      <Box display="flex" alignItems="center" mb={4}>
        <AccountCircle sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Profile
        </Typography>
      </Box>
      
      <Card>
        <CardContent>
          <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
            <Avatar sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main' }}>
              <AccountCircle sx={{ fontSize: 60 }} />
            </Avatar>
            <Button variant="outlined" size="small">
              Change Photo
            </Button>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={profile.firstName}
                onChange={handleChange('firstName')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={profile.lastName}
                onChange={handleChange('lastName')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={profile.email}
                onChange={handleChange('email')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={profile.phone}
                onChange={handleChange('phone')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position/Role"
                value={profile.position}
                onChange={handleChange('position')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Troop"
                value={profile.troop}
                onChange={handleChange('troop')}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                >
                  Save Profile
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Profile;
