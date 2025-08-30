import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  LinearProgress,
  Paper,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Person as ScoutIcon,
  Man as FatherIcon,
  Woman as MotherIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import authService from '../services/authService';

const RegistrationForm = ({ onSuccess, isAdminMode = false, onClose = null }) => {
  const [formData, setFormData] = useState({
    // Scout Information
    scoutFirstName: '',
    scoutLastName: '',
    scoutPreferredName: '',
    scoutEmail: '',
    scoutPhone: '',
    
    // Father Information
    fatherFirstName: '',
    fatherLastName: '',
    fatherPreferredName: '',
    fatherEmail: '',
    fatherPhone: '',
    
    // Mother Information
    motherFirstName: '',
    motherLastName: '',
    motherPreferredName: '',
    motherEmail: '',
    motherPhone: '',
    
    // Address Information
    address: '',
    dateToJoin: '',
    scoutDOB: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [includeFather, setIncludeFather] = useState(true);
  const [includeMother, setIncludeMother] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    // Scout fields are always required
    const requiredFields = [
      'scoutFirstName',
      'scoutLastName', 
      'scoutEmail'
    ];

    // Add father fields if father section is enabled
    if (includeFather) {
      requiredFields.push('fatherFirstName', 'fatherLastName', 'fatherEmail');
    }

    // Add mother fields if mother section is enabled
    if (includeMother) {
      requiredFields.push('motherFirstName', 'motherLastName', 'motherEmail');
    }

    for (const field of requiredFields) {
      if (!formData[field].trim()) {
        return `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.scoutEmail)) {
      return 'Scout email is invalid';
    }
    if (includeFather && !emailRegex.test(formData.fatherEmail)) {
      return 'Father email is invalid';
    }
    if (includeMother && !emailRegex.test(formData.motherEmail)) {
      return 'Mother email is invalid';
    }

    // Check for duplicate emails
    const emails = [formData.scoutEmail];
    if (includeFather) emails.push(formData.fatherEmail);
    if (includeMother) emails.push(formData.motherEmail);
    
    const uniqueEmails = new Set(emails.filter(email => email.trim()));
    if (uniqueEmails.size !== emails.filter(email => email.trim()).length) {
      return 'Each person must have a unique email address';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    console.log('Form submission started');
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      console.log('Validation error:', validationError);
      setError(validationError);
      return;
    }

    console.log('Validation passed, starting submission...');
    setLoading(true);

    try {
      // Prepare submission data based on enabled sections
      const submissionData = {
        // Scout information (always included)
        scoutFirstName: formData.scoutFirstName,
        scoutLastName: formData.scoutLastName,
        scoutPreferredName: formData.scoutPreferredName,
        scoutEmail: formData.scoutEmail,
        scoutPhone: formData.scoutPhone,
        dateToJoin: formData.dateToJoin,
        scoutDOB: formData.scoutDOB,
        
        // Address information (always included)
        address: formData.address,
        
        // Father information (only if enabled)
        ...(includeFather && {
          fatherFirstName: formData.fatherFirstName,
          fatherLastName: formData.fatherLastName,
          fatherPreferredName: formData.fatherPreferredName,
          fatherEmail: formData.fatherEmail,
          fatherPhone: formData.fatherPhone,
        }),
        
        // Mother information (only if enabled)
        ...(includeMother && {
          motherFirstName: formData.motherFirstName,
          motherLastName: formData.motherLastName,
          motherPreferredName: formData.motherPreferredName,
          motherEmail: formData.motherEmail,
          motherPhone: formData.motherPhone,
        }),
        
        // Metadata
        includeFather,
        includeMother
      };
      
      console.log('Submitting data:', submissionData);
      
      if (isAdminMode) {
        // Admin mode: Submit registration and immediately approve it
        console.log('🔧 Admin mode: Submitting and auto-approving registration...');
        const registrationResult = await authService.submitRegistrationRequest(submissionData);
        console.log('Registration created:', registrationResult);
        
        // Immediately approve the registration
        const approvalResult = await authService.approveRegistrationRequest(registrationResult.id);
        console.log('Registration approved:', approvalResult);
        
        console.log('✅ Family successfully registered and approved!');
      } else {
        // Normal mode: Just submit registration request
        const result = await authService.submitRegistrationRequest(submissionData);
        console.log('Submission result:', result);
      }
      
      setSuccess(true);
      
      // Reset form
      setFormData({
        scoutFirstName: '',
        scoutLastName: '',
        scoutPreferredName: '',
        scoutEmail: '',
        scoutPhone: '',
        fatherFirstName: '',
        fatherLastName: '',
        fatherPreferredName: '',
        fatherEmail: '',
        fatherPhone: '',
        motherFirstName: '',
        motherLastName: '',
        motherPreferredName: '',
        motherEmail: '',
        motherPhone: '',
        address: '',
        dateToJoin: '',
        scoutDOB: ''
      });
      
      // Reset toggle states
      setIncludeFather(true);
      setIncludeMother(true);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error details:', error.message, error.code);
      setError(`Failed to submit registration request: ${error.message}. Please try again.`);
    } finally {
      console.log('Submission finished, setting loading to false');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Paper elevation={2} sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            {isAdminMode ? 'Family Successfully Registered & Approved!' : 'Registration Request Submitted Successfully!'}
          </Typography>
          <Typography variant="body2">
            {isAdminMode 
              ? 'The family has been immediately registered and approved. All family members now have active accounts and have been sent welcome emails.'
              : 'Thank you for your registration request. An administrator will review your application and send invitation emails to each family member once approved. This typically takes 1-2 business days.'
            }
          </Typography>
        </Alert>
        <Box textAlign="center" mt={3}>
          <Button 
            variant="outlined" 
            onClick={() => setSuccess(false)}
            sx={{ mr: 2 }}
          >
            {isAdminMode ? 'Register Another Family' : 'Submit Another Registration'}
          </Button>
          {isAdminMode && onClose && (
            <Button 
              variant="contained" 
              onClick={onClose}
            >
              Close
            </Button>
          )}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 4, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4, fontSize: '2rem' }}>
        {isAdminMode ? 'Register & Approve Family' : 'Troop 468 Registration'}
      </Typography>
      
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        <Typography component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          {isAdminMode 
            ? 'Family will be immediately approved and activated upon submission.'
            : 'Each person will receive a separate invitation email once approved.'
          }
        </Typography>
      </Typography>

      {/* Debug info */}
      <Typography variant="caption" sx={{ mb: 2, display: 'block', textAlign: 'center', color: 'text.secondary' }}>
        Debug: Father={includeFather ? 'ON' : 'OFF'}, Mother={includeMother ? 'ON' : 'OFF'}
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        {/* Scout Information */}
        <Card sx={{ mb: 3, backgroundColor: '#e3f2fd' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ScoutIcon sx={{ mr: 1, color: '#1976d2', fontSize: '1.5rem' }} />
              <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 0 }}>
                Scout Information
              </Typography>
            </Box>
            <Grid container spacing={2}>
              {/* First Row: First Name and Preferred First Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name *"
                  name="scoutFirstName"
                  value={formData.scoutFirstName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Preferred First Name"
                  name="scoutPreferredName"
                  value={formData.scoutPreferredName}
                  onChange={handleChange}
                  disabled={loading}
                  helperText="What they like to be called"
                />
              </Grid>
              
              {/* Second Row: Last Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name *"
                  name="scoutLastName"
                  value={formData.scoutLastName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              
              {/* Contact Information */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address *"
                  name="scoutEmail"
                  type="email"
                  value={formData.scoutEmail}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number (if any)"
                  name="scoutPhone"
                  value={formData.scoutPhone}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Joined Date"
                  name="dateToJoin"
                  type="date"
                  value={formData.dateToJoin}
                  onChange={handleChange}
                  disabled={loading}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  name="scoutDOB"
                  type="date"
                  value={formData.scoutDOB}
                  onChange={handleChange}
                  disabled={loading}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Father Information */}
        <Card sx={{ mb: 3, backgroundColor: '#e8f5e8' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FatherIcon sx={{ mr: 1, color: '#2e7d32', fontSize: '1.5rem' }} />
                <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 0 }}>
                  Father Information
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={includeFather}
                    onChange={(e) => {
                      console.log('Father toggle changed:', e.target.checked);
                      setIncludeFather(e.target.checked);
                    }}
                    color="primary"
                  />
                }
                label={includeFather ? "Included" : "Optional"}
                labelPlacement="start"
                sx={{ ml: 2 }}
              />
            </Box>
            {includeFather && (
              <Grid container spacing={2}>
                {/* First Row: First Name and Preferred First Name */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name *"
                    name="fatherFirstName"
                    value={formData.fatherFirstName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Preferred First Name"
                    name="fatherPreferredName"
                    value={formData.fatherPreferredName}
                    onChange={handleChange}
                    disabled={loading}
                    helperText="What they like to be called"
                  />
                </Grid>
                
                {/* Second Row: Last Name */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name *"
                    name="fatherLastName"
                    value={formData.fatherLastName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Grid>
                
                {/* Contact Information */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address *"
                    name="fatherEmail"
                    type="email"
                    value={formData.fatherEmail}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="fatherPhone"
                    value={formData.fatherPhone}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Grid>
              </Grid>
            )}
            {!includeFather && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                Father information is disabled. Toggle the switch above to include father details.
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Mother Information */}
        <Card sx={{ mb: 3, backgroundColor: '#fce4ec' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MotherIcon sx={{ mr: 1, color: '#c2185b', fontSize: '1.5rem' }} />
                <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 0 }}>
                  Mother Information
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={includeMother}
                    onChange={(e) => {
                      console.log('Mother toggle changed:', e.target.checked);
                      setIncludeMother(e.target.checked);
                    }}
                    color="primary"
                  />
                }
                label={includeMother ? "Included" : "Optional"}
                labelPlacement="start"
                sx={{ ml: 2 }}
              />
            </Box>
            {includeMother && (
              <Grid container spacing={2}>
                {/* First Row: First Name and Preferred First Name */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name *"
                    name="motherFirstName"
                    value={formData.motherFirstName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Preferred First Name"
                    name="motherPreferredName"
                    value={formData.motherPreferredName}
                    onChange={handleChange}
                    disabled={loading}
                    helperText="What they like to be called"
                  />
                </Grid>
                
                {/* Second Row: Last Name */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name *"
                    name="motherLastName"
                    value={formData.motherLastName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Grid>
                
                {/* Contact Information */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address *"
                    name="motherEmail"
                    type="email"
                    value={formData.motherEmail}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="motherPhone"
                    value={formData.motherPhone}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Grid>
              </Grid>
            )}
            {!includeMother && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                Mother information is disabled. Toggle the switch above to include mother details.
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card sx={{ mb: 3, backgroundColor: '#fff3e0' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <HomeIcon sx={{ mr: 1, color: '#f57c00', fontSize: '1.5rem' }} />
              <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 0 }}>
                Address Information
              </Typography>
            </Box>
            <TextField
              fullWidth
              label="Home Address"
              name="address"
              multiline
              rows={3}
              value={formData.address}
              onChange={handleChange}
              disabled={loading}
            />
          </CardContent>
        </Card>

        <Box textAlign="center">
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ minWidth: 200 }}
          >
            {loading ? 'Submitting...' : 'Submit Registration'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default RegistrationForm;
