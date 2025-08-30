import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Divider,
  Alert
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

const UserInfoForm = ({ 
  open, 
  onClose, 
  onSave, 
  onDelete = null,
  user = null, 
  title = "User Information",
  loading = false,
  initialData = null
}) => {
  // Form state
  const [formData, setFormData] = useState({
    // Basic Information
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    phone: '',
    dob: '',
    
    // Address Information
    address: '',
    city: '',
    state: '',
    zipCode: '',
    
    // Scout Information
    patrol: 'Unassigned',
    rank: '',
    joinDate: '',
    
    // Parent Information (for scouts)
    parentEmails: ['', ''],
    emergencyContact: '',
    emergencyPhone: '',
    
    // Medical Information
    allergies: '',
    medications: '',
    medicalConditions: '',
    
    // User System Information
    roles: [],
    accessStatus: 'pending',
    scoutingStatus: 'Registered',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  const patrols = ['Unassigned', 'Vipers', 'Hwaks', 'Red Bulls', 'Ninjas', 'Dragons'];
  const ranks = [
    'Scout', 'Tenderfoot', 'Second Class', 'First Class',
    'Star', 'Life', 'Eagle', 'Eagle Palms'
  ];
  const availableRoles = [
    { value: 'admin', label: 'Admin' },
    { value: 'approver', label: 'Approver' },
    { value: 'user', label: 'User' },
    { value: 'scout', label: 'Scout' },
    { value: 'parent', label: 'Parent' }
  ];
  const accessStatusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' }
  ];
  
  const scoutingStatusOptions = [
    { value: 'Registered', label: 'Registered' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Dropped', label: 'Dropped' },
    { value: 'Age out', label: 'Age out' }
  ];

  // Load user data when dialog opens
  useEffect(() => {
    if (open && user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        displayName: user.displayName || '',
        email: user.email || '',
        phone: user.phone || '',
        dob: user.dob ? (user.dob.toDate ? user.dob.toDate().toISOString().slice(0,10) : new Date(user.dob).toISOString().slice(0,10)) : '',
        
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
        
        patrol: user.patrol || 'Unassigned',
        rank: user.rank || '',
        joinDate: user.joinDate ? (user.joinDate.toDate ? user.joinDate.toDate().toISOString().slice(0,10) : new Date(user.joinDate).toISOString().slice(0,10)) : '',
        
        parentEmails: user.parentEmails || ['', ''],
        emergencyContact: user.emergencyContact || '',
        emergencyPhone: user.emergencyPhone || '',
        
        allergies: user.allergies || '',
        medications: user.medications || '',
        medicalConditions: user.medicalConditions || '',
        
        roles: user.roles || [],
        status: user.status || 'Registered',
        notes: user.notes || ''
      });
    } else if (open && !user) {
      // Reset for new user, apply initial data if provided
      const defaultData = {
        firstName: '',
        lastName: '',
        displayName: '',
        email: '',
        phone: '',
        dob: '',
        
        address: '',
        city: '',
        state: '',
        zipCode: '',
        
        patrol: 'Unassigned',
        rank: '',
        joinDate: '',
        
        parentEmails: ['', ''],
        emergencyContact: '',
        emergencyPhone: '',
        
        allergies: '',
        medications: '',
        medicalConditions: '',
        
        roles: [],
        accessStatus: 'pending',
    scoutingStatus: 'Registered',
        notes: ''
      };
      
      // Merge with initial data if provided
      setFormData(initialData ? { ...defaultData, ...initialData } : defaultData);
    }
    setErrors({});
  }, [open, user, initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleRoleToggle = (role) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.roles.length) newErrors.roles = 'At least one role is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const isScout = formData.roles.includes('scout');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {/* Basic Information */}
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="First Name *"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                fullWidth
                error={!!errors.firstName}
                helperText={errors.firstName}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Last Name *"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                fullWidth
                error={!!errors.lastName}
                helperText={errors.lastName}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Preferred First Name"
                value={formData.displayName}
                onChange={(e) => handleChange('displayName', e.target.value)}
                fullWidth
                helperText="How they prefer to be called"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email Address *"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                fullWidth
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Date of Birth"
                type="date"
                value={formData.dob}
                onChange={(e) => handleChange('dob', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Address Information */}
          <Typography variant="h6" gutterBottom>
            Address Information
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <TextField
                label="Street Address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                label="City"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="State"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="ZIP Code"
                value={formData.zipCode}
                onChange={(e) => handleChange('zipCode', e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Scout Information */}
          {isScout && (
            <>
              <Typography variant="h6" gutterBottom>
                Scout Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Patrol</InputLabel>
                    <Select
                      value={formData.patrol}
                      onChange={(e) => handleChange('patrol', e.target.value)}
                      label="Patrol"
                    >
                      {patrols.map(patrol => (
                        <MenuItem key={patrol} value={patrol}>{patrol}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Current Rank</InputLabel>
                    <Select
                      value={formData.rank}
                      onChange={(e) => handleChange('rank', e.target.value)}
                      label="Current Rank"
                    >
                      <MenuItem value="">Not Set</MenuItem>
                      {ranks.map(rank => (
                        <MenuItem key={rank} value={rank}>{rank}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Join Date"
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => handleChange('joinDate', e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              {/* Parent Information */}
              <Typography variant="subtitle1" gutterBottom>
                Parent Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Parent 1 Email"
                    type="email"
                    value={formData.parentEmails[0]}
                    onChange={(e) => {
                      const newParentEmails = [...formData.parentEmails];
                      newParentEmails[0] = e.target.value;
                      handleChange('parentEmails', newParentEmails);
                    }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Parent 2 Email"
                    type="email"
                    value={formData.parentEmails[1]}
                    onChange={(e) => {
                      const newParentEmails = [...formData.parentEmails];
                      newParentEmails[1] = e.target.value;
                      handleChange('parentEmails', newParentEmails);
                    }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Emergency Contact"
                    value={formData.emergencyContact}
                    onChange={(e) => handleChange('emergencyContact', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Emergency Phone"
                    value={formData.emergencyPhone}
                    onChange={(e) => handleChange('emergencyPhone', e.target.value)}
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Medical Information */}
              <Typography variant="h6" gutterBottom>
                Medical Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <TextField
                    label="Allergies"
                    value={formData.allergies}
                    onChange={(e) => handleChange('allergies', e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    helperText="List any known allergies"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Current Medications"
                    value={formData.medications}
                    onChange={(e) => handleChange('medications', e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    helperText="List current medications and dosages"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Medical Conditions"
                    value={formData.medicalConditions}
                    onChange={(e) => handleChange('medicalConditions', e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    helperText="Any medical conditions leaders should be aware of"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />
            </>
          )}

          {/* System Information */}
          <Typography variant="h6" gutterBottom>
            System Information
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  label="Status"
                >
                  {statusOptions.map(status => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Roles */}
          <Typography variant="subtitle1" gutterBottom>
            Roles *
          </Typography>
          <Box sx={{ mb: 2 }}>
            {availableRoles.map(role => (
              <FormControlLabel
                key={role.value}
                control={
                  <Checkbox
                    checked={formData.roles.includes(role.value)}
                    onChange={() => handleRoleToggle(role.value)}
                  />
                }
                label={role.label}
              />
            ))}
            {errors.roles && (
              <Typography variant="caption" color="error" display="block">
                {errors.roles}
              </Typography>
            )}
          </Box>

          {/* Notes */}
          <TextField
            label="Notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            fullWidth
            multiline
            rows={3}
            helperText="Additional notes or comments"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between' }}>
        {/* Delete button - only show for existing users */}
        {user && onDelete ? (
          <Button
            onClick={() => onDelete(user)}
            color="error"
            variant="outlined"
            disabled={loading}
            startIcon={<DeleteIcon />}
          >
            Delete User
          </Button>
        ) : (
          <Box /> // Empty space when no delete button
        )}
        
        <Box>
          <Button onClick={onClose} disabled={loading} sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default UserInfoForm;
