import React, { useState, useEffect, useMemo, useDeferredValue, useRef } from 'react';
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
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Man as ManIcon,
  Woman as WomanIcon,
  Boy as BoyIcon,
} from '@mui/icons-material';
import PageTitle from '../components/PageTitle';
import authService from '../services/authService';
import patrolService from '../services/patrolService';

const ContactList = () => {
  const [authorizedUsers, setAuthorizedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const searchInputRef = useRef(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedPatrol, setSelectedPatrol] = useState('all');
  const [showParents, setShowParents] = useState(true);
  const [patrolNames, setPatrolNames] = useState([]);
  // const [patrols, setPatrols] = useState([]);

  useEffect(() => {
    loadAuthorizedUsers();
  }, []);

  const loadAuthorizedUsers = async () => {
    try {
      setLoading(true);
      const [users, patrolData] = await Promise.all([
        authService.getAuthorizedUsers(),
        patrolService.getPatrols()
      ]);
      setAuthorizedUsers(users || []);
      // setPatrols(patrolData || []);
      setPatrolNames((patrolData || []).map(p => p.name));
    } catch (e) {
      console.error('Failed to load data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
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
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';

      // Handle special cases
      if (sortConfig.key === 'displayName') {
        aVal = a.displayName || `${a.firstName || ''} ${a.lastName || ''}`.trim() || '';
        bVal = b.displayName || `${b.firstName || ''} ${b.lastName || ''}`.trim() || '';
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortConfig.direction === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  };

  const highlightText = (text, searchTerm) => {
    if (!searchTerm.trim() || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <Box component="span" key={index} sx={{ backgroundColor: 'yellow', fontWeight: 'bold' }}>
          {part}
        </Box>
      ) : part
    );
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
    return age;
  };

  const contactsByPatrol = useMemo(() => {
    // Only show scouts as primary rows (parents will be shown under scouts)
    const scouts = authorizedUsers.filter(user => (user.roles || []).includes('scout'));
    
    const filtered = scouts.filter(user => {
      // Check if scout matches search
      const scoutMatches = !deferredSearchTerm.trim() || 
        (user.displayName && user.displayName.toLowerCase().includes(deferredSearchTerm.toLowerCase())) ||
        (user.firstName && user.firstName.toLowerCase().includes(deferredSearchTerm.toLowerCase())) ||
        (user.lastName && user.lastName.toLowerCase().includes(deferredSearchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(deferredSearchTerm.toLowerCase())) ||
        (user.phone && user.phone.toLowerCase().includes(deferredSearchTerm.toLowerCase())) ||
        (user.address && user.address.toLowerCase().includes(deferredSearchTerm.toLowerCase()));

      // Check if any parent matches search
      let parentMatches = false;
      if (deferredSearchTerm.trim() && user.parentEmails) {
        const parents = user.parentEmails.map(parentEmail => 
          authorizedUsers.find(u => u.email === parentEmail)
        ).filter(Boolean);
        
        parentMatches = parents.some(parent =>
          (parent.displayName && parent.displayName.toLowerCase().includes(deferredSearchTerm.toLowerCase())) ||
          (parent.firstName && parent.firstName.toLowerCase().includes(deferredSearchTerm.toLowerCase())) ||
          (parent.lastName && parent.lastName.toLowerCase().includes(deferredSearchTerm.toLowerCase())) ||
          (parent.email && parent.email.toLowerCase().includes(deferredSearchTerm.toLowerCase())) ||
          (parent.phone && parent.phone.toLowerCase().includes(deferredSearchTerm.toLowerCase())) ||
          (parent.address && parent.address.toLowerCase().includes(deferredSearchTerm.toLowerCase()))
        );
      }

      const matchesSearch = scoutMatches || parentMatches;
      const matchesPatrol = selectedPatrol === 'all' || user.patrol === selectedPatrol;
      
      return matchesSearch && matchesPatrol;
    });

    const groups = {};
    patrolNames.forEach(patrol => {
      groups[patrol] = filtered.filter(user => user.patrol === patrol);
    });
    
    return groups;
  }, [authorizedUsers, deferredSearchTerm, selectedPatrol, patrolNames]);

  return (
    <Container maxWidth="lg">
      <PageTitle 
        icon={PersonIcon} 
        title="Contacts" 
        description="View authorized users and their family relationships (read-only)" 
      />

      {/* Search and Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={12} md={6}>
              <TextField
                inputRef={searchInputRef}
                fullWidth
                placeholder="Search contacts..."
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
                {Object.values(contactsByPatrol).flat().length} contacts
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={8}>
                  <FormControl fullWidth>
                    <InputLabel>Filter by Patrol</InputLabel>
                    <Select
                      value={selectedPatrol}
                      onChange={(e) => setSelectedPatrol(e.target.value)}
                      label="Filter by Patrol"
                    >
                      <MenuItem value="all">All Patrols</MenuItem>
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
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Contact Display */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : Object.values(contactsByPatrol).flat().length === 0 && searchTerm.trim() !== '' ? (
        <Alert severity="info">
          No contacts match your search. <Button onClick={() => setSearchTerm('')}>Clear Search</Button>
        </Alert>
      ) : Object.values(contactsByPatrol).flat().length === 0 ? (
        <Alert severity="info">No authorized contacts found. Check the Users page for user management.</Alert>
      ) : (
        <Box>
          {Object.entries(contactsByPatrol).map(([patrolName, usersInPatrol]) => {
            if (usersInPatrol.length === 0) return null;
            
            return (
              <Card key={patrolName} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {patrolName} ({usersInPatrol.length})
                  </Typography>
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
                              active={sortConfig.key === 'dob'}
                              direction={sortConfig.key === 'dob' ? sortConfig.direction : 'asc'}
                              onClick={() => handleSort('dob')}
                            >
                              Age
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={sortConfig.key === 'address'}
                              direction={sortConfig.key === 'address' ? sortConfig.direction : 'asc'}
                              onClick={() => handleSort('address')}
                            >
                              Address
                            </TableSortLabel>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortUsers(usersInPatrol).map((user) => {
                          // Find parents by matching emails in user.parentEmails
                          const userParents = user.parentEmails ? 
                            user.parentEmails.map(parentEmail => 
                              authorizedUsers.find(u => u.email === parentEmail)
                            ).filter(Boolean) : [];
                          
                          return (
                            <React.Fragment key={user.id}>
                              {/* Scout/User Row */}
                              <TableRow>
                                <TableCell sx={{ py: '15px' }}>
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
                                <TableCell sx={{ py: '15px' }}>
                                  <Typography variant="body2">
                                    {highlightText(user.email || '—', deferredSearchTerm)}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ py: '15px' }}>
                                  <Typography variant="body2">
                                    {highlightText(user.phone || '—', deferredSearchTerm)}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ py: '15px' }}>
                                  <Typography variant="body2">
                                    {user.dob ? computeAge(user.dob) : '—'}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ py: '15px' }}>
                                  <Typography variant="body2">
                                    {highlightText(user.address || '—', deferredSearchTerm)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                              
                              {/* Parent Rows */}
                              {showParents && userParents.map((parentUser) => (
                                <TableRow key={parentUser.id} sx={{ backgroundColor: 'action.hover' }}>
                                  <TableCell sx={{ padding: '14px 16px 8px 30px' }}>
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
                                  <TableCell sx={{ py: '15px' }}>
                                    <Typography variant="body2">
                                      {highlightText(parentUser.email || '—', deferredSearchTerm)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ py: '15px' }}>
                                    <Typography variant="body2">
                                      {highlightText(parentUser.phone || '—', deferredSearchTerm)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ py: '15px' }}>
                                    <Typography variant="body2">
                                      {parentUser.dob ? computeAge(parentUser.dob) : '—'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ py: '15px' }}>
                                    <Typography variant="body2">
                                      {highlightText(parentUser.address || '—', deferredSearchTerm)}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Container>
  );
};

export default ContactList;
