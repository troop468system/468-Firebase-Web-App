import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Alert,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as ScoutIcon,
  Man as FatherIcon,
  Woman as MotherIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import authService from '../services/authService';

const EditUserDialog = ({ 
  open, 
  onClose, 
  user = null, 
  onSave = null,
  onDelete = null,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    phone: '',
    dob: '',
    joinDate: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    patrol: 'Unassigned',
    rank: '',
    roles: [],
    accessStatus: 'pending',
    scoutingStatus: 'Registered',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const patrols = ['Unassigned', 'Vipers', 'Hwaks', 'Red Bulls', 'Ninjas', 'Dragons'];
  const ranks = ['Scout', 'Tenderfoot', 'Second Class', 'First Class', 'Star', 'Life', 'Eagle'];
  const availableRoles = ['admin', 'approver', 'user', 'scout', 'parent'];
  const accessStatusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'retired', label: 'Retired' }
  ];
  
  const scoutingStatusOptions = [
    { value: 'Registered', label: 'Registered' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Dropped', label: 'Dropped' },
    { value: 'AgeOut', label: 'Age Out' }
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
        joinDate: user.joinDate ? (user.joinDate.toDate ? user.joinDate.toDate().toISOString().slice(0,10) : new Date(user.joinDate).toISOString().slice(0,10)) : '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
        patrol: user.patrol || 'Unassigned',
        rank: user.rank || '',
        roles: user.roles || [],
        accessStatus: user.accessStatus || 'pending',
        scoutingStatus: user.scoutingStatus || 'Registered',
        notes: user.notes || ''
      });
    }
    setErrors({});
  }, [open, user]);

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
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Email format is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    
    if (onSave) {
      onSave(formData);
    }
  };

  const handleDelete = () => {
    if (onDelete && user) {
      onDelete(user);
    }
    setShowDeleteConfirm(false);
  };

  const isScout = user?.roles?.includes('scout');
  const isParent = user?.roles?.includes('parent');
  
  // Determine which form section to show based on user roles
  const getFormTitle = () => {
    if (isScout) return 'Scout Information';
    if (isParent) return `${user.relation === 'father' ? 'Father' : user.relation === 'mother' ? 'Mother' : 'Parent'} Information`;
    return 'User Information';
  };

  const getFormIcon = () => {
    if (isScout) return <ScoutIcon sx={{ mr: 1, color: '#1976d2', fontSize: '1.5rem' }} />;
    if (isParent && user.relation === 'father') return <FatherIcon sx={{ mr: 1, color: '#2e7d32', fontSize: '1.5rem' }} />;
    if (isParent && user.relation === 'mother') return <MotherIcon sx={{ mr: 1, color: '#c2185b', fontSize: '1.5rem' }} />;
    return <ScoutIcon sx={{ mr: 1, color: '#1976d2', fontSize: '1.5rem' }} />;
  };

  const getCardColor = () => {
    if (isScout) return '#e3f2fd';
    if (isParent && user.relation === 'father') return '#e8f5e8';
    if (isParent && user.relation === 'mother') return '#fce4ec';
    return '#f5f5f5';
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="body"
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>Edit {getFormTitle()}</Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pb: 2 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        {/* Main Information Card - styled like registration form */}
        <Card sx={{ backgroundColor: getCardColor(), mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {getFormIcon()}
              <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 0 }}>
                {getFormTitle()}
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              {/* Basic Information */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name *"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name *"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Preferred First Name"
                  value={formData.displayName}
                  onChange={(e) => handleChange('displayName', e.target.value)}
                  disabled={loading}
                  helperText="How they prefer to be called"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address *"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={loading}
                />
              </Grid>
              
              {/* Show Date of Birth only for scouts or if not a parent */}
              {(isScout || !isParent) && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleChange('dob', e.target.value)}
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              )}
              
              {/* Scout-specific fields */}
              {isScout && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Join Date"
                      type="date"
                      value={formData.joinDate}
                      onChange={(e) => handleChange('joinDate', e.target.value)}
                      disabled={loading}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Patrol</InputLabel>
                      <Select
                        value={formData.patrol}
                        onChange={(e) => handleChange('patrol', e.target.value)}
                        label="Patrol"
                        disabled={loading}
                      >
                        {patrols.map(patrol => (
                          <MenuItem key={patrol} value={patrol}>{patrol}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Rank</InputLabel>
                      <Select
                        value={formData.rank}
                        onChange={(e) => handleChange('rank', e.target.value)}
                        label="Rank"
                        disabled={loading}
                      >
                        <MenuItem value="">None</MenuItem>
                        {ranks.map(rank => (
                          <MenuItem key={rank} value={rank}>{rank}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Address Information - show for scouts */}
        {isScout && (
          <Card sx={{ mb: 3, backgroundColor: '#f9f9f9' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 2 }}>
                Address Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="State"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="ZIP Code"
                    value={formData.zipCode}
                    onChange={(e) => handleChange('zipCode', e.target.value)}
                    disabled={loading}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* System Information */}
        <Card sx={{ mb: 3, backgroundColor: '#fff3e0' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 2 }}>
              System Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    label="Status"
                    disabled={loading}
                  >
                    {accessStatusOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Roles:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {availableRoles.map(role => (
                    <FormControlLabel
                      key={role}
                      control={
                        <Checkbox
                          checked={formData.roles.includes(role)}
                          onChange={() => handleRoleToggle(role)}
                          disabled={loading}
                        />
                      }
                      label={role.charAt(0).toUpperCase() + role.slice(1)}
                    />
                  ))}
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  disabled={loading}
                  multiline
                  rows={3}
                  helperText="Additional notes or comments"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Are you sure you want to delete this user? This action cannot be undone.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                size="small" 
                color="error" 
                variant="contained"
                onClick={handleDelete}
                disabled={loading}
              >
                Yes, Delete
              </Button>
              <Button 
                size="small" 
                variant="outlined"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </Box>
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        {/* Delete button - only show for existing users */}
        {user && onDelete ? (
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            color="error"
            variant="outlined"
            disabled={loading}
            startIcon={<DeleteIcon />}
          >
            Delete User
          </Button>
        ) : (
          <Box />
        )}
        
        <Box>
          <Button onClick={onClose} disabled={loading} sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            variant="contained"
            disabled={loading}
          >
            Save Changes
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserDialog;
