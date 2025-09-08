import React, { useState, useEffect, useMemo, useDeferredValue, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Card,
  CardContent,
  Grid,
  InputAdornment,

  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Checkbox,
  FormControlLabel,
  Divider,
  Tabs,
  Tab,
  Chip,
  Switch,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Man as ManIcon,
  Woman as WomanIcon,
  Boy as BoyIcon,
  // Patrol icons
  Pets as PetsIcon,
  FlightTakeoff as EagleIcon,
  LocalFireDepartment as DragonIcon,
  SportsEsports as NinjaIcon,
  SportsFootball as BullIcon,
  Shield as ShieldIcon,
  Star as StarIcon,
  Bolt as BoltIcon,
  Whatshot as FlameIcon,
  // Additional icons for selection
  Forest as WolfIcon,
  FlashOn as ThunderIcon,
  Waves as WaveIcon,
  Terrain as MountainIcon,
  Brightness5 as SunIcon,
  NightsStay as MoonIcon,
  Cloud as CloudIcon,
  AcUnit as SnowIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

// Import FontAwesome icons from react-icons for better animal representations
import {
  FaDragon,
  FaFire,
  FaBug,
  FaEye,
  FaStar,
} from 'react-icons/fa';
import PageTitle from '../components/PageTitle';
import authService from '../services/authService';
import patrolService from '../services/patrolService';

// Available icons for patrol selection
const PATROL_ICON_OPTIONS = [
  // Specific patrol icons with FontAwesome (better representations)
  { value: 'vipers', label: 'Vipers', icon: <FaBug /> },
  { value: 'bulls', label: 'Bulls', icon: <BullIcon /> },
  { value: 'hawks', label: 'Hawks', icon: <FaEye /> },
  { value: 'dragons', label: 'Dragons', icon: <FaDragon /> },
  { value: 'ninjas', label: 'Ninjas', icon: <FaStar /> },
  { value: 'phoenix', label: 'Phoenix', icon: <FaFire /> },
  // Generic options
  { value: 'pets', label: 'Animal/Pet', icon: <PetsIcon /> },
  { value: 'eagle', label: 'Eagle/Bird', icon: <EagleIcon /> },
  { value: 'dragon', label: 'Dragon/Fire', icon: <DragonIcon /> },
  { value: 'ninja', label: 'Ninja/Gaming', icon: <NinjaIcon /> },
  { value: 'bull', label: 'Bull/Sports', icon: <BullIcon /> },
  { value: 'shield', label: 'Shield/Guard', icon: <ShieldIcon /> },
  { value: 'star', label: 'Star', icon: <StarIcon /> },
  { value: 'bolt', label: 'Lightning/Bolt', icon: <BoltIcon /> },
  { value: 'flame', label: 'Flame/Fire', icon: <FlameIcon /> },
  { value: 'wolf', label: 'Wolf/Forest', icon: <WolfIcon /> },
  { value: 'thunder', label: 'Thunder/Flash', icon: <ThunderIcon /> },
  { value: 'wave', label: 'Wave/Water', icon: <WaveIcon /> },
  { value: 'mountain', label: 'Mountain', icon: <MountainIcon /> },
  { value: 'sun', label: 'Sun/Light', icon: <SunIcon /> },
  { value: 'moon', label: 'Moon/Night', icon: <MoonIcon /> },
  { value: 'cloud', label: 'Cloud/Sky', icon: <CloudIcon /> },
  { value: 'snow', label: 'Snow/Ice', icon: <SnowIcon /> },
  { value: 'group', label: 'Group/Team', icon: <GroupIcon /> },
];

// Predefined color options
const PATROL_COLOR_OPTIONS = [
  '#4caf50', // Green
  '#f44336', // Red
  '#2196f3', // Blue
  '#ff9800', // Orange
  '#9c27b0', // Purple
  '#607d8b', // Blue Gray
  '#795548', // Brown
  '#ffc107', // Amber
  '#e91e63', // Pink
  '#00bcd4', // Cyan
  '#8bc34a', // Light Green
  '#ff5722', // Deep Orange
  '#673ab7', // Deep Purple
  '#3f51b5', // Indigo
  '#009688', // Teal
  '#424242', // Dark Gray
];

// Function to get patrol icon component from icon value
const getPatrolIconComponent = (iconValue) => {
  const iconOption = PATROL_ICON_OPTIONS.find(option => option.value === iconValue);
  return iconOption ? iconOption.icon : <GroupIcon />;
};

// Memoized PendingRequestsTab component defined outside to prevent re-creation
const PendingRequestsTab = React.memo(({ pendingRequests, onApprove, onReject }) => {
  const computeAge = (dob) => {
    if (!dob) return '—';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  // Group pending users by family
  const familyGroups = pendingRequests.reduce((groups, user) => {
    const familyId = user.familyId || 'individual';
    if (!groups[familyId]) {
      groups[familyId] = [];
    }
    groups[familyId].push(user);
    return groups;
  }, {});

  return (
    <Box>
      {pendingRequests.length === 0 ? (
        <Alert severity="info">No pending user approvals.</Alert>
      ) : (
        <Grid container spacing={3}>
          {Object.entries(familyGroups).map(([familyId, familyUsers]) => {
            const scout = familyUsers.find(user => user.roles?.includes('scout'));
            const parents = familyUsers.filter(user => user.roles?.includes('parent'));
            
            return (
              <Grid item xs={12} key={familyId}>
                <Card sx={{ border: '2px solid #f0f0f0' }}>
                  <CardContent>
                    {/* Header with Scout Information */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                          {scout ? scout.displayName : familyUsers[0].displayName}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                          {familyUsers.length > 1 ? `Family Registration (${familyUsers.length} users)` : 'User Registration'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Submitted: {scout?.createdAt ? new Date(scout.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => {
                            // Approve all users in the family
                            familyUsers.forEach(user => onApprove(user));
                          }}
                          size="large"
                        >
                          Approve Family
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<CloseIcon />}
                          onClick={() => {
                            // Reject all users in the family
                            familyUsers.forEach(user => onReject(user));
                          }}
                          size="large"
                        >
                          Reject Family
                        </Button>
                      </Box>
                    </Box>

                  <Divider sx={{ mb: 3 }} />

                  {/* Family Information Grid */}
                  <Grid container spacing={3}>
                    {/* Scout Information */}
                    {scout && (
                      <Grid item xs={12} md={4}>
                        <Card variant="outlined" sx={{ height: '100%', backgroundColor: '#e3f2fd' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <PersonIcon sx={{ mr: 1, color: '#1976d2' }} />
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Scout</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Box>
                                <Typography variant="body2" color="text.secondary">Name:</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                  {scout.firstName} {scout.lastName}
                                </Typography>
                              </Box>
                              {scout.displayName && scout.displayName !== `${scout.firstName} ${scout.lastName}` && (
                                <Box>
                                  <Typography variant="body2" color="text.secondary">Display Name:</Typography>
                                  <Typography variant="body1">{scout.displayName}</Typography>
                                </Box>
                              )}
                              <Box>
                                <Typography variant="body2" color="text.secondary">Email:</Typography>
                                <Typography variant="body1">{scout.email}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" color="text.secondary">Phone:</Typography>
                                <Typography variant="body1">{scout.phone || '—'}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" color="text.secondary">Date of Birth:</Typography>
                                <Typography variant="body1">
                                  {scout.dob ? `${new Date(scout.dob).toLocaleDateString()} (Age: ${computeAge(scout.dob)})` : '—'}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" color="text.secondary">Address:</Typography>
                                <Typography variant="body1">
                                  {scout.address || '—'}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}

                    {/* Parent Information */}
                    {parents.map((parent, index) => (
                      <Grid item xs={12} md={4} key={parent.id}>
                        <Card variant="outlined" sx={{ height: '100%', backgroundColor: parent.relation === 'father' ? '#e8f5e8' : '#fce4ec' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <PersonIcon sx={{ mr: 1, color: parent.relation === 'father' ? '#388e3c' : '#c2185b' }} />
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {parent.relation === 'father' ? 'Father' : parent.relation === 'mother' ? 'Mother' : 'Parent'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Box>
                                <Typography variant="body2" color="text.secondary">Name:</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                  {parent.firstName} {parent.lastName}
                                </Typography>
                              </Box>
                              {parent.displayName && parent.displayName !== `${parent.firstName} ${parent.lastName}` && (
                                <Box>
                                  <Typography variant="body2" color="text.secondary">Display Name:</Typography>
                                  <Typography variant="body1">{parent.displayName}</Typography>
                                </Box>
                              )}
                              <Box>
                                <Typography variant="body2" color="text.secondary">Email:</Typography>
                                <Typography variant="body1">{parent.email}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" color="text.secondary">Phone:</Typography>
                                <Typography variant="body1">{parent.phone || '—'}</Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}

                    {/* Address Information */}
                    <Grid item xs={12}>
                      <Card variant="outlined" sx={{ backgroundColor: '#fff3e0' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <HomeIcon sx={{ mr: 1, color: '#f57c00' }} />
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Address</Typography>
                          </Box>
                          <Typography variant="body1">
                            {scout?.address || parents[0]?.address || 'No address provided'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
});

// Memoized PatrolManagementTab component defined outside to prevent re-creation
const PatrolManagementTab = React.memo(({ patrols, onPatrolsUpdated }) => {
  const [newPatrolData, setNewPatrolData] = useState({
    name: '',
    icon: 'group',
    color: '#1976d2'
  });
  const [editingPatrol, setEditingPatrol] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);

  const handleAddPatrol = async () => {
    if (!newPatrolData.name.trim()) return;
    
    try {
      setLoading(true);
      // Get current patrols to determine the next order
      const existingPatrols = await patrolService.getPatrols();
      const maxOrder = existingPatrols.length > 0 ? Math.max(...existingPatrols.map(p => p.order || 0)) : 0;
      
      await patrolService.addPatrol({
        name: newPatrolData.name.trim(),
        icon: newPatrolData.icon,
        color: newPatrolData.color,
        order: maxOrder + 1
      });
      setNewPatrolData({ name: '', icon: 'group', color: '#1976d2' });
      await onPatrolsUpdated();
    } catch (error) {
      console.error('Error adding patrol:', error);
      alert('Failed to add patrol. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPatrol = (patrol) => {
    setEditingPatrol(patrol.id);
    setEditData({
      name: patrol.name,
      icon: patrol.icon || 'group',
      color: patrol.color || '#1976d2'
    });
  };

  const handleSaveEdit = async () => {
    if (!editData.name.trim()) {
      setEditingPatrol(null);
      return;
    }

    try {
      setLoading(true);
      await patrolService.updatePatrol(editingPatrol, editData);
      setEditingPatrol(null);
      setEditData({});
      await onPatrolsUpdated();
    } catch (error) {
      console.error('Error updating patrol:', error);
      alert('Failed to update patrol. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingPatrol(null);
    setEditData({});
  };

  const handleDeletePatrol = async (patrol) => {
    if (!window.confirm(`Are you sure you want to delete the "${patrol.name}" patrol? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await patrolService.deletePatrol(patrol.id);
      await onPatrolsUpdated();
    } catch (error) {
      console.error('Error deleting patrol:', error);
      alert('Failed to delete patrol. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Patrol Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage patrol names, icons, and colors. Changes will be reflected in all scout patrol assignments.
      </Typography>

      {/* Add New Patrol */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Add New Patrol
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                label="Patrol Name"
                value={newPatrolData.name}
                onChange={(e) => setNewPatrolData({ ...newPatrolData, name: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleAddPatrol()}
                disabled={loading}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Icon</InputLabel>
                <Select
                  value={newPatrolData.icon}
                  onChange={(e) => setNewPatrolData({ ...newPatrolData, icon: e.target.value })}
                  label="Icon"
                  disabled={loading}
                >
                  {PATROL_ICON_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {option.icon}
                        <Typography>{option.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Color</InputLabel>
                <Select
                  value={newPatrolData.color}
                  onChange={(e) => setNewPatrolData({ ...newPatrolData, color: e.target.value })}
                  label="Color"
                  disabled={loading}
                  renderValue={(value) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          bgcolor: value,
                          border: '1px solid #ccc'
                        }}
                      />
                      <Typography>{value}</Typography>
                    </Box>
                  )}
                >
                  {PATROL_COLOR_OPTIONS.map((color) => (
                    <MenuItem key={color} value={color}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            bgcolor: color,
                            border: '1px solid #ccc'
                          }}
                        />
                        <Typography>{color}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                variant="contained"
                onClick={handleAddPatrol}
                disabled={!newPatrolData.name.trim() || loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
                fullWidth
              >
                Add Patrol
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Patrols Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current Patrols ({patrols.length})
          </Typography>
          {patrols.length === 0 ? (
            <Alert severity="info">
              No patrols found. Add your first patrol above.
            </Alert>
          ) : (
            <TableContainer
              sx={{ 
                overflowX: 'auto',
                '& .MuiTable-root': {
                  minWidth: { xs: 400, sm: 500 }
                }
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Icon</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Color</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patrols.map((patrol) => (
                    <TableRow key={patrol.id}>
                      <TableCell>
                        {editingPatrol === patrol.id ? (
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                              value={editData.icon}
                              onChange={(e) => setEditData({ ...editData, icon: e.target.value })}
                              disabled={loading}
                            >
                              {PATROL_ICON_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {option.icon}
                                    <Typography variant="caption">{option.label}</Typography>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <Tooltip title={patrol.icon || 'group'}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                bgcolor: patrol.color || '#1976d2',
                                color: 'white'
                              }}
                            >
                              {getPatrolIconComponent(patrol.icon || 'group')}
                            </Box>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingPatrol === patrol.id ? (
                          <TextField
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                            disabled={loading}
                            size="small"
                            autoFocus
                            fullWidth
                          />
                        ) : (
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {patrol.name}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingPatrol === patrol.id ? (
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                              value={editData.color}
                              onChange={(e) => setEditData({ ...editData, color: e.target.value })}
                              disabled={loading}
                              renderValue={(value) => (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box
                                    sx={{
                                      width: 16,
                                      height: 16,
                                      borderRadius: '50%',
                                      bgcolor: value,
                                      border: '1px solid #ccc'
                                    }}
                                  />
                                </Box>
                              )}
                            >
                              {PATROL_COLOR_OPTIONS.map((color) => (
                                <MenuItem key={color} value={color}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box
                                      sx={{
                                        width: 16,
                                        height: 16,
                                        borderRadius: '50%',
                                        bgcolor: color,
                                        border: '1px solid #ccc'
                                      }}
                                    />
                                    <Typography variant="caption">{color}</Typography>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                bgcolor: patrol.color || '#1976d2',
                                border: '1px solid #ccc'
                              }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {patrol.color || '#1976d2'}
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {editingPatrol === patrol.id ? (
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <IconButton
                              size="small"
                              onClick={handleSaveEdit}
                              disabled={loading}
                              color="primary"
                            >
                              <SaveIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={handleCancelEdit}
                              disabled={loading}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <IconButton
                              size="small"
                              onClick={() => handleEditPatrol(patrol)}
                              disabled={loading}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeletePatrol(patrol)}
                              disabled={loading}
                              color="error"
                            >
                              <CloseIcon />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
});

const Users = () => {
  const navigate = useNavigate();
  const { tab: urlTab } = useParams();
  const [searchParams] = useSearchParams();
  const familyFilter = searchParams.get('family');
  
  const [authorizedUsers, setAuthorizedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const searchInputRef = useRef(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedPatrol, setSelectedPatrol] = useState('all');
  
  // Dynamic patrol management
  const [patrolNames, setPatrolNames] = useState([]);
  const [patrols, setPatrols] = useState([]);
  
  // Initialize tab based on URL parameter
  const getTabFromUrl = (urlTab) => {
    switch(urlTab) {
      case 'pending': return 0;
      case 'authorized': return 1;
      case 'patrols': return 2;
      default: return 0; // Default to pending requests
    }
  };
  
  // Tab management
  const [activeTab, setActiveTab] = useState(getTabFromUrl(urlTab));
  
  // Update URL when tab changes
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    const tabPaths = ['pending', 'authorized', 'patrols'];
    navigate(`/users/${tabPaths[newValue]}`, { replace: true });
  };
  
  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getTabFromUrl(urlTab));
  }, [urlTab]);
  const [pendingRequests, setPendingRequests] = useState([]);
  
  // Parent visibility toggle
  const [showParents, setShowParents] = useState(true);
  
  // Dialog states
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  // Form states
  const [formData, setFormData] = useState({
    scout: {
      firstName: '',
      lastName: '',
      displayName: '',
      email: '',
      phone: '',
      dob: '',
      joinedDate: '',
      address: '',
      patrol: patrolNames[0] || 'Vipers',
      rank: '',
      troopJob: '',
      patrolJob: ''
    },
    father: {
      firstName: '',
      lastName: '',
      displayName: '',
      email: '',
      phone: '',
      dob: '',
      relation: 'father'
    },
    mother: {
      firstName: '',
      lastName: '',
      displayName: '',
      email: '',
      phone: '',
      dob: '',
      relation: 'mother'
    }
  });
  const [includeParents, setIncludeParents] = useState({ father: false, mother: false });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load users and patrols (no more separate registrationRequests)
      const [users, patrolData] = await Promise.all([
        authService.getAllUsers(),
        patrolService.getPatrols()
      ]);
      
      // Filter users by status
      const allUsers = users || [];
      const approvedUsers = allUsers.filter(user => user.accessStatus === 'approved');
      const pendingUsers = allUsers.filter(user => user.accessStatus === 'pending');
      
      setAuthorizedUsers(approvedUsers);
      setPendingRequests(pendingUsers);
      
      setPatrols(patrolData || []);
      setPatrolNames((patrolData || []).map(p => p.name));
    } catch (e) {
      console.error('Failed to load data', e);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    try {
      const users = await authService.getAllUsers();
      const allUsers = users || [];
      // Properly filter users by status
      const approvedUsers = allUsers.filter(user => user.accessStatus === 'approved');
      const pendingUsers = allUsers.filter(user => user.accessStatus === 'pending');
      
      setAuthorizedUsers(approvedUsers);
      setPendingRequests(pendingUsers);
    } catch (e) {
      console.error('Failed to refresh user data', e);
    }
  };

  // Filter out admin users for display purposes
  const nonAdminUsers = useMemo(() => {
    return authorizedUsers.filter(user => !(user.roles || []).includes('admin'));
  }, [authorizedUsers]);

  const contactsByPatrol = useMemo(() => {
    const groups = {};
    patrolNames.forEach(p => groups[p] = []);
    groups['Unassigned'] = []; // Add Unassigned group

    const allParents = nonAdminUsers.filter(u => (u.roles || []).includes('parent'));

    // Filter by patrol first
    let filteredUsers = nonAdminUsers.filter(user => {
      if (selectedPatrol !== 'all') {
        if (selectedPatrol === 'unassigned') {
          // Show users without patrol or with patrol not in patrolNames
          return !user.patrol || !patrolNames.includes(user.patrol);
        } else {
          return user.patrol === selectedPatrol;
        }
      }
      return true;
    });

    // Filter by family if familyFilter is provided
    if (familyFilter) {
      const familyEmail = familyFilter.toLowerCase().trim();
      filteredUsers = filteredUsers.filter(user => {
        const userEmail = (user.email || '').toLowerCase().trim();
        
        // Include the user themselves
        if (userEmail === familyEmail) return true;
        
        // Include scouts whose parent emails include the family email
        if ((user.roles || []).includes('scout')) {
          const parentEmails = (user.parentEmails || []).map(email => email.toLowerCase().trim()).filter(Boolean);
          return parentEmails.includes(familyEmail);
        }
        
        // Include parents whose children have the family email as parent
        if ((user.roles || []).includes('parent')) {
          // Find scouts that have this parent's email in their parentEmails
          const isParentOfFamilyScout = nonAdminUsers.some(scout => {
            if (!(scout.roles || []).includes('scout')) return false;
            const scoutParentEmails = (scout.parentEmails || []).map(email => email.toLowerCase().trim()).filter(Boolean);
            const scoutEmail = (scout.email || '').toLowerCase().trim();
            
            // Check if this scout belongs to the family (either scout email matches or has family email as parent)
            const scoutInFamily = scoutEmail === familyEmail || scoutParentEmails.includes(familyEmail);
            
            // Check if this parent is associated with the scout
            return scoutInFamily && scoutParentEmails.includes(userEmail);
          });
          
          return isParentOfFamilyScout;
        }
        
        return false;
      });
    }

    // Then filter by search term if provided
    if (deferredSearchTerm.trim() !== '') {
      filteredUsers = filteredUsers.filter(user => {
        const userMatches = (user.displayName?.toLowerCase().includes(deferredSearchTerm.toLowerCase())) ||
                          (user.firstName?.toLowerCase().includes(deferredSearchTerm.toLowerCase())) ||
                          (user.lastName?.toLowerCase().includes(deferredSearchTerm.toLowerCase())) ||
                          (user.email?.toLowerCase().includes(deferredSearchTerm.toLowerCase())) ||
                          (user.phone?.includes(deferredSearchTerm));

        if (userMatches) return true;

        // If scout, check if any of their parents match
        if ((user.roles || []).includes('scout')) {
          const parentEmails = (user.parentEmails || []).map(email => email.toLowerCase().trim()).filter(Boolean);
          return allParents.some(parent =>
            parentEmails.includes((parent.email || '').toLowerCase().trim()) &&
            ((parent.displayName?.toLowerCase().includes(deferredSearchTerm.toLowerCase())) ||
             (parent.firstName?.toLowerCase().includes(deferredSearchTerm.toLowerCase())) ||
             (parent.lastName?.toLowerCase().includes(deferredSearchTerm.toLowerCase())) ||
             (parent.email?.toLowerCase().includes(deferredSearchTerm.toLowerCase())) ||
             (parent.phone?.includes(deferredSearchTerm)))
          );
        }
        return false;
      });
    }

    // Only include scouts in the main groups (parents will be shown under scouts)
    const scouts = filteredUsers.filter(u => (u.roles || []).includes('scout'));
    
    scouts.forEach(u => {
      // Assign users to appropriate groups
      if (u.patrol && patrolNames.includes(u.patrol)) {
        groups[u.patrol].push(u);
      } else {
        // Users without patrol or with unknown patrol go to Unassigned
        groups['Unassigned'].push(u);
      }
    });
    return groups;
  }, [nonAdminUsers, deferredSearchTerm, patrolNames, selectedPatrol, familyFilter]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };



  const handleEditUser = (user) => {
    console.log('📝 Opening edit dialog for user:', user);
    setEditingUser(user);
    setEditFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      displayName: user.displayName || '',
      email: user.email || '',
      phone: user.phone || '',
      dob: user.dob || '',
      address: user.address || ''
    });
    setShowEditUserDialog(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    try {
      setLoading(true);
      
      console.log('🔄 Saving user changes...', {
        userId: editingUser.id,
        formData: editFormData
      });
      
      // Update user profile with form data
      await authService.updateUserProfile(editingUser.id, editFormData);
      
      console.log('✅ User updated successfully');
      
      // Refresh the user list
      await refreshUserData();
      
      // Close dialog and reset form
      setShowEditUserDialog(false);
      setEditingUser(null);
      setEditFormData({});
      
      console.log('✅ Dialog closed and data refreshed');
      
    } catch (error) {
      console.error('❌ Error updating user:', error);
      alert('Error updating user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScoutingStatusChange = async (userId, newScoutingStatus) => {
    try {
      await authService.updateUserProfile(userId, { scoutingStatus: newScoutingStatus });
      await refreshUserData(); // Refresh the list
    } catch (error) {
      console.error('Error updating user scouting status:', error);
      alert('Error updating user scouting status. Please try again.');
    }
  };

  const handlePatrolChange = async (userId, newPatrol) => {
    try {
      const user = authorizedUsers.find(u => u.id === userId);
      if (!user) return;

      // Update the scout's patrol
      await authService.updateUserProfile(userId, { patrol: newPatrol });

      // If this is a scout, also update their parents' patrol to match
      if ((user.roles || []).includes('scout') && user.parentEmails) {
        const parentUpdates = user.parentEmails.map(async (parentEmail) => {
          const parent = authorizedUsers.find(p => p.email === parentEmail);
          if (parent) {
            await authService.updateUserProfile(parent.id, { patrol: newPatrol });
          }
        });
        await Promise.all(parentUpdates);
      }

      await refreshUserData(); // Refresh the list
    } catch (error) {
      console.error('Error updating user patrol:', error);
      alert('Error updating user patrol. Please try again.');
    }
  };

  const handleApproveRequest = async (user) => {
    try {
      setLoading(true);
      console.log('Approving user:', user.id);
      
      // Update user status to approved
      await authService.updateUserProfile(user.id, { accessStatus: 'approved' });
      
      // Send invitation email for account setup
      try {
        await authService.sendNewUserInvitation(user.email);
        console.log('✅ Invitation email sent to:', user.email);
      } catch (emailError) {
        console.warn('⚠️ User approved but invitation email failed:', emailError);
        alert(`User approved successfully, but invitation email failed. Please notify ${user.email} manually.`);
      }
      
      // Reload data to reflect changes
      await loadData();
      
      console.log('User approved successfully');
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (user) => {
    try {
      const reason = prompt('Please provide a reason for rejection (optional):');
      if (reason === null) return; // User cancelled
      
      setLoading(true);
      console.log('Rejecting user:', user.id);
      
      // Update user status to rejected
      await authService.updateUserProfile(user.id, { 
        accessStatus: 'rejected',
        rejectionReason: reason,
        rejectedAt: new Date(),
        rejectedBy: authService.getCurrentUser()?.uid
      });
      
      // Reload data to reflect changes
      await loadData();
      
      console.log('User rejected successfully');
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Failed to reject user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async () => {
    try {
      const usersToCreate = [];
      
      // Add scout
      const scoutData = {
        ...formData.scout,
        roles: ['scout'],
        accessStatus: 'approved', // Auto-approve access
        scoutingStatus: 'Registered', // Default scouting status
        patrol: null, // Start unassigned
        parentEmails: []
      };
      
      if (includeParents.father && formData.father.email) {
        scoutData.parentEmails.push(formData.father.email);
      }
      if (includeParents.mother && formData.mother.email) {
        scoutData.parentEmails.push(formData.mother.email);
      }
      
      usersToCreate.push(scoutData);
      
      // Add parents
      if (includeParents.father && formData.father.email) {
        usersToCreate.push({
          ...formData.father,
          roles: ['parent'],
          accessStatus: 'approved', // Auto-approve access
          scoutingStatus: 'Registered', // Default scouting status
          patrol: null // Start unassigned
        });
      }
      
      if (includeParents.mother && formData.mother.email) {
        usersToCreate.push({
          ...formData.mother,
          roles: ['parent'],
          accessStatus: 'approved', // Auto-approve access
          scoutingStatus: 'Registered', // Default scouting status
          patrol: null // Start unassigned
        });
      }
      
      // Create users in the system
      for (const userData of usersToCreate) {
        await authService.createUser(userData);
      }
      
      // Refresh the user list
      await refreshUserData();
      
      // Close dialog and reset form
      setShowAddUserDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error creating users:', error);
      alert('Error creating users. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      scout: {
        firstName: '',
        lastName: '',
        displayName: '',
        email: '',
        phone: '',
        dob: '',
        address: '',
        patrol: '', // No default patrol - will be unassigned
        rank: '',
        troopJob: '',
        patrolJob: ''
      },
      father: {
        firstName: '',
        lastName: '',
        displayName: '',
        email: '',
        phone: '',
        dob: '',
        relation: 'father'
      },
      mother: {
        firstName: '',
        lastName: '',
        displayName: '',
        email: '',
        phone: '',
        dob: '',
        relation: 'mother'
      }
    });
    setIncludeParents({ father: false, mother: false });
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortUsers = (users) => {
    if (!sortConfig.key) return users;
    
    return [...users].sort((a, b) => {
      let aValue = '';
      let bValue = '';
      
      switch (sortConfig.key) {
        case 'firstName':
          aValue = a.firstName || '';
          bValue = b.firstName || '';
          break;
        case 'lastName':
          aValue = a.lastName || '';
          bValue = b.lastName || '';
          break;
        case 'displayName':
          aValue = a.displayName || '';
          bValue = b.displayName || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'phone':
          aValue = a.phone || '';
          bValue = b.phone || '';
          break;
        case 'age':
          aValue = computeAge(a.dob);
          bValue = computeAge(b.dob);
          break;
        case 'dob':
          aValue = a.dob || '';
          bValue = b.dob || '';
          break;
        default:
          return 0;
      }
      
      if (sortConfig.direction === 'asc') {
        return aValue.localeCompare(bValue, undefined, { numeric: true });
      } else {
        return bValue.localeCompare(aValue, undefined, { numeric: true });
      }
    });
  };

  const computeAge = (dob) => {
    if (!dob) return '—';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const highlightText = (text, search) => {
    if (!search.trim() || !text) return text;
    
    const regex = new RegExp(`(${search})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} style={{ backgroundColor: '#ffeb3b', fontWeight: 'bold' }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <PageTitle 
        icon={GroupIcon} 
        title={familyFilter ? `Users - Family View (${familyFilter})` : "Users"}
        description={familyFilter ? "Viewing family members only" : "Manage and edit users, add new users, and view their family relationships"} 
      />



      {/* Tab Navigation */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="users tabs">
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Pending Requests
                <Chip
                  label={pendingRequests.length}
                  size="small"
                  color={pendingRequests.length > 0 ? "error" : "default"}
                />
              </Box>
            }
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Authorized Users
                <Chip
                  label={nonAdminUsers.length}
                  size="small"
                  color="primary"
                />
              </Box>
            }
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Patrol Management
                <Chip
                  label={patrols.length}
                  size="small"
                  color="secondary"
                />
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Tab Content with CSS-based visibility to prevent unmounting */}
      <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
        <PendingRequestsTab 
          pendingRequests={pendingRequests} 
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
        />
      </Box>
      <Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
        {/* Authorized Users Content */}
        
        {/* Search and Filter Controls */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="flex-start">
              <Grid item xs={12} md={6}>
                <TextField
                  inputRef={searchInputRef}
                  fullWidth
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {deferredSearchTerm.trim() !== '' 
                    ? `${Object.values(contactsByPatrol).flat().length} users found` 
                    : `${Object.values(contactsByPatrol).flat().length} users`
                  }
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={5}>
                    <FormControl fullWidth>
                      <InputLabel>Filter by Patrol</InputLabel>
                      <Select
                        value={selectedPatrol}
                        onChange={(e) => setSelectedPatrol(e.target.value)}
                        label="Filter by Patrol"
                      >
                        <MenuItem value="all">All Patrols</MenuItem>
                        <MenuItem value="unassigned">Unassigned</MenuItem>
                        {patrolNames.map(patrol => (
                          <MenuItem key={patrol} value={patrol}>{patrol}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showParents}
                          onChange={(e) => setShowParents(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Show Parents"
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      variant="contained"
                      startIcon={<PersonAddIcon />}
                      onClick={() => setShowAddUserDialog(true)}
                      fullWidth
                      disabled={loading}
                    >
                      Add User
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : Object.values(contactsByPatrol).flat().length === 0 && searchTerm.trim() !== '' ? (
        <Alert severity="info">
          No users match your search. <Button onClick={() => setSearchTerm('')}>Clear Search</Button>
        </Alert>
      ) : Object.values(contactsByPatrol).flat().length === 0 ? (
        <Alert severity="info">No authorized users found. Add users using the form above.</Alert>
      ) : (
        <Box>
          {['Unassigned', ...patrolNames].filter(patrolName => selectedPatrol === 'all' || selectedPatrol === patrolName).map(patrolName => {
            const usersInPatrol = contactsByPatrol[patrolName] || [];
            if (usersInPatrol.length === 0 && searchTerm.trim() === '' && selectedPatrol === 'all') return null;

            const allParents = nonAdminUsers.filter(u => (u.roles || []).includes('parent'));
            const sortedUsers = sortUsers(usersInPatrol);

            return (
              <Card 
                key={patrolName} 
                sx={{ 
                  mb: 3,
                  ...(patrolName === 'Unassigned' && {
                    border: '2px solid #ff9800',
                    backgroundColor: '#fff3e0',
                    boxShadow: '0 4px 12px rgba(255, 152, 0, 0.2)'
                  })
                }}
              >
                <CardContent>
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{
                      ...(patrolName === 'Unassigned' && {
                        color: '#e65100',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      })
                    }}
                  >
                    {patrolName === 'Unassigned' && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#ff9800',
                          animation: 'pulse 2s infinite'
                        }}
                      />
                    )}
                    {patrolName} ({usersInPatrol.length})
                    {patrolName === 'Unassigned' && usersInPatrol.length > 0 && (
                      <Chip 
                        label="Needs Assignment" 
                        size="small" 
                        color="warning"
                        sx={{ ml: 1, fontWeight: 'bold' }}
                      />
                    )}
                  </Typography>
                  {usersInPatrol.length === 0 ? (
                    <Alert severity="info">No users in this patrol match your search.</Alert>
                  ) : (
                    <TableContainer 
                      component={Paper} 
                      variant="outlined"
                      sx={{ 
                        overflowX: 'auto',
                        '& .MuiTable-root': {
                          minWidth: { xs: 600, sm: 750 }
                        }
                      }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <TableSortLabel
                                active={sortConfig.key === 'displayName'}
                                direction={sortConfig.key === 'displayName' ? sortConfig.direction : 'asc'}
                                onClick={() => handleSort('displayName')}
                              >
                                Name
                              </TableSortLabel>
                            </TableCell>
                            <TableCell>Scouting Status</TableCell>
                            <TableCell>Patrol</TableCell>
                            <TableCell>
                              <TableSortLabel
                                active={sortConfig.key === 'email'}
                                direction={sortConfig.key === 'email' ? sortConfig.direction : 'asc'}
                                onClick={() => handleSort('email')}
                              >
                                Email
                              </TableSortLabel>
                            </TableCell>
                            <TableCell>
                              <TableSortLabel
                                active={sortConfig.key === 'phone'}
                                direction={sortConfig.key === 'phone' ? sortConfig.direction : 'asc'}
                                onClick={() => handleSort('phone')}
                              >
                                Phone
                              </TableSortLabel>
                            </TableCell>
                            <TableCell>
                              <TableSortLabel
                                active={sortConfig.key === 'age'}
                                direction={sortConfig.key === 'age' ? sortConfig.direction : 'asc'}
                                onClick={() => handleSort('age')}
                              >
                                Age
                              </TableSortLabel>
                            </TableCell>
                            <TableCell>
                              <TableSortLabel
                                active={sortConfig.key === 'dob'}
                                direction={sortConfig.key === 'dob' ? sortConfig.direction : 'asc'}
                                onClick={() => handleSort('dob')}
                              >
                                Birthday
                              </TableSortLabel>
                            </TableCell>
                            <TableCell>Address</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sortedUsers.map(user => (
                            <React.Fragment key={user.id}>
                              <TableRow>
                                <TableCell>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Box 
                                      sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        width: 24, 
                                        height: 24, 
                                        borderRadius: '50%',
                                        bgcolor: 'primary.main',
                                        color: 'white'
                                      }}
                                    >
                                      <BoyIcon sx={{ fontSize: 16 }} />
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                      {highlightText(user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || '—', deferredSearchTerm)}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    size="small"
                                    value={user.scoutingStatus || 'Registered'}
                                    onChange={(e) => handleScoutingStatusChange(user.id, e.target.value)}
                                    sx={{ minWidth: 100 }}
                                  >
                                    <MenuItem value="Registered">Registered</MenuItem>
                                    <MenuItem value="Inactive">Inactive</MenuItem>
                                    <MenuItem value="Dropped">Dropped</MenuItem>
                                    <MenuItem value="AgeOut">Age Out</MenuItem>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    size="small"
                                    value={user.patrol || ''}
                                    onChange={(e) => handlePatrolChange(user.id, e.target.value)}
                                    sx={{ minWidth: 120 }}
                                    renderValue={(value) => {
                                      const patrol = patrols.find(p => p.name === value);
                                      if (!patrol) return value;
                                      return (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <Box
                                            sx={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              width: 20,
                                              height: 20,
                                              borderRadius: '50%',
                                              bgcolor: patrol.color || '#1976d2',
                                              color: 'white'
                                            }}
                                          >
                                            {getPatrolIconComponent(patrol.icon || 'group')}
                                          </Box>
                                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                            {patrol.name}
                                          </Typography>
                                        </Box>
                                      );
                                    }}
                                  >
                                    {patrols.map(patrol => (
                                      <MenuItem key={patrol.id} value={patrol.name}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                                          <Box
                                            sx={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              width: 24,
                                              height: 24,
                                              borderRadius: '50%',
                                              bgcolor: patrol.color || '#1976d2',
                                              color: 'white'
                                            }}
                                          >
                                            {getPatrolIconComponent(patrol.icon || 'group')}
                                          </Box>
                                          <Typography variant="body2" sx={{ fontWeight: 'medium', flexGrow: 1 }}>
                                            {patrol.name}
                                          </Typography>
                                        </Box>
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </TableCell>
                                <TableCell>{highlightText(user.email, deferredSearchTerm)}</TableCell>
                                <TableCell>{highlightText(user.phone || '—', deferredSearchTerm)}</TableCell>
                                <TableCell>{computeAge(user.dob)}</TableCell>
                                <TableCell>{user.dob ? new Date(user.dob).toLocaleDateString() : '—'}</TableCell>
                                <TableCell>{user.address || '—'}</TableCell>
                                <TableCell>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleEditUser(user)}
                                    color="primary"
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                              {/* Render Parents */}
                              {showParents && user.parentEmails && user.parentEmails.length > 0 &&
                                user.parentEmails.map(parentEmail => {
                                  const parentUser = allParents.find(p => p.email === parentEmail);
                                  if (!parentUser) return null;
                                  return (
                                    <TableRow key={`${user.id}-${parentUser.id}`} sx={{ backgroundColor: 'action.hover' }}>
                                      <TableCell sx={{ padding: '6px 16px 6px 30px' }}>
                                        <Box display="flex" alignItems="center" gap={0}>
                                          {/* Visual connection line */}
                                          <Box 
                                            sx={{ 
                                              width: 24, 
                                              height: 20,
                                              position: 'relative',
                                              mr: 0,
                                              display: 'flex',
                                              alignItems: 'center',
                                              '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                left: 0,
                                                top: -10,
                                                width: 2,
                                                height: 20,
                                                backgroundColor: '#90a4ae',
                                                borderRadius: '1px'
                                              },
                                              '&::after': {
                                                content: '""',
                                                position: 'absolute',
                                                left: 0,
                                                top: '50%',
                                                width: 16,
                                                height: 2,
                                                backgroundColor: '#90a4ae',
                                                borderRadius: '1px',
                                                transform: 'translateY(-50%)'
                                              }
                                            }} 
                                          />
                                          {/* Gender-specific icon */}
                                          {parentUser.relation === 'father' ? (
                                            <ManIcon sx={{ color: '#388e3c', fontSize: 20 }} />
                                          ) : parentUser.relation === 'mother' ? (
                                            <WomanIcon sx={{ color: '#c2185b', fontSize: 20 }} />
                                          ) : (
                                            <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                          )}
                                          <Typography variant="caption" color="text.secondary">
                                            {highlightText(parentUser.displayName || `${parentUser.firstName || ''} ${parentUser.lastName || ''}`.trim() || '—', deferredSearchTerm)}
                                          </Typography>
                                        </Box>
                                      </TableCell>
                                      <TableCell>
                                        <Select
                                          size="small"
                                          value={parentUser.scoutingStatus || 'Registered'}
                                          onChange={(e) => handleScoutingStatusChange(parentUser.id, e.target.value)}
                                          sx={{ minWidth: 100 }}
                                        >
                                          <MenuItem value="Registered">Registered</MenuItem>
                                          <MenuItem value="Inactive">Inactive</MenuItem>
                                          <MenuItem value="Dropped">Dropped</MenuItem>
                                          <MenuItem value="Age out">Age out</MenuItem>
                                        </Select>
                                      </TableCell>
                                      <TableCell><Typography variant="caption" color="text.secondary">—</Typography></TableCell>
                                      <TableCell><Typography variant="caption" color="text.secondary">{highlightText(parentUser.email, deferredSearchTerm)}</Typography></TableCell>
                                      <TableCell><Typography variant="caption" color="text.secondary">{highlightText(parentUser.phone || '—', deferredSearchTerm)}</Typography></TableCell>
                                      <TableCell><Typography variant="caption" color="text.secondary">{computeAge(parentUser.dob)}</Typography></TableCell>
                                      <TableCell><Typography variant="caption" color="text.secondary">{parentUser.dob ? new Date(parentUser.dob).toLocaleDateString() : '—'}</Typography></TableCell>
                                      <TableCell><Typography variant="caption" color="text.secondary">—</Typography></TableCell>
                                      <TableCell>
                                        <IconButton 
                                          size="small" 
                                          onClick={() => handleEditUser(parentUser)}
                                          color="primary"
                                        >
                                          <EditIcon />
                                        </IconButton>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                              }
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
      </Box>
      <Box sx={{ display: activeTab === 2 ? 'block' : 'none' }}>
        {/* Patrol Management Content */}
        <PatrolManagementTab 
          patrols={patrols}
          onPatrolsUpdated={loadData}
        />
      </Box>

      {/* Add User Dialog */}
      <Dialog 
        open={showAddUserDialog} 
        onClose={() => setShowAddUserDialog(false)}
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Scout Information */}
            <Typography variant="h6" gutterBottom>Scout Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.scout.firstName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    scout: { ...prev.scout, firstName: e.target.value }
                  }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.scout.lastName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    scout: { ...prev.scout, lastName: e.target.value }
                  }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Preferred First Name"
                  value={formData.scout.displayName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    scout: { ...prev.scout, displayName: e.target.value }
                  }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.scout.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    scout: { ...prev.scout, email: e.target.value }
                  }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.scout.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    scout: { ...prev.scout, phone: e.target.value }
                  }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={formData.scout.dob}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    scout: { ...prev.scout, dob: e.target.value }
                  }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Joined Date"
                  type="date"
                  value={formData.scout.joinedDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    scout: { ...prev.scout, joinedDate: e.target.value }
                  }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={formData.scout.address}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    scout: { ...prev.scout, address: e.target.value }
                  }))}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Patrol</InputLabel>
                  <Select
                    value={formData.scout.patrol}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      scout: { ...prev.scout, patrol: e.target.value }
                    }))}
                    label="Patrol"
                  >
                    {patrolNames.map(patrol => (
                      <MenuItem key={patrol} value={patrol}>{patrol}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Rank"
                  value={formData.scout.rank}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    scout: { ...prev.scout, rank: e.target.value }
                  }))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Troop Job"
                  value={formData.scout.troopJob}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    scout: { ...prev.scout, troopJob: e.target.value }
                  }))}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Parent Options */}
            <Typography variant="h6" gutterBottom>Parent Information (Optional)</Typography>
            
            {/* Father Section */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeParents.father}
                  onChange={(e) => setIncludeParents(prev => ({
                    ...prev,
                    father: e.target.checked
                  }))}
                />
              }
              label="Add Father"
            />
            
            {includeParents.father && (
              <Grid container spacing={2} sx={{ mt: 1, mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Father's First Name"
                    value={formData.father.firstName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      father: { ...prev.father, firstName: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Father's Last Name"
                    value={formData.father.lastName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      father: { ...prev.father, lastName: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Father's Email"
                    type="email"
                    value={formData.father.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      father: { ...prev.father, email: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Father's Phone"
                    value={formData.father.phone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      father: { ...prev.father, phone: e.target.value }
                    }))}
                  />
                </Grid>
              </Grid>
            )}

            {/* Mother Section */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeParents.mother}
                  onChange={(e) => setIncludeParents(prev => ({
                    ...prev,
                    mother: e.target.checked
                  }))}
                />
              }
              label="Add Mother"
            />
            
            {includeParents.mother && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Mother's First Name"
                    value={formData.mother.firstName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      mother: { ...prev.mother, firstName: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Mother's Last Name"
                    value={formData.mother.lastName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      mother: { ...prev.mother, lastName: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Mother's Email"
                    type="email"
                    value={formData.mother.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      mother: { ...prev.mother, email: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Mother's Phone"
                    value={formData.mother.phone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      mother: { ...prev.mother, phone: e.target.value }
                    }))}
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddUserDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleFormSubmit}
            variant="contained"
            disabled={!formData.scout.firstName || !formData.scout.lastName || !formData.scout.email}
          >
            Add User(s)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog 
        open={showEditUserDialog} 
        onClose={() => setShowEditUserDialog(false)}
        maxWidth="sm" 
        fullWidth
        id="edit-user-dialog"
      >
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {editingUser && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={editFormData.firstName || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={editFormData.lastName || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Preferred First Name"
                    value={editFormData.displayName || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </Grid>
                {/* Only show birthday for scouts */}
                {(editingUser.roles || []).includes('scout') && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Date of Birth"
                      type="date"
                      value={editFormData.dob || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, dob: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                )}
                {/* Only show address for scouts */}
                {(editingUser.roles || []).includes('scout') && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      value={editFormData.address || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                      multiline
                      rows={2}
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditUserDialog(false)} disabled={loading}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveUser}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Users;