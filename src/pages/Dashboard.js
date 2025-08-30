import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Contacts as ContactsIcon,
  Sync as SyncIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

import googleSheetsService from '../services/googleSheetsService';
import authService from '../services/authService';
import PageTitle from '../components/PageTitle';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    contacts: 0,
    stakeholders: 0,
    notifications: 0,
    unreadNotifications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncStatus, setSyncStatus] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load from localStorage first (for demo without Firebase)
      const localContacts = JSON.parse(localStorage.getItem('troopmanager_contacts') || '[]');
      const localNotifications = JSON.parse(localStorage.getItem('troopmanager_notifications') || '[]');
      const localStakeholders = JSON.parse(localStorage.getItem('troopmanager_stakeholders') || '[]');

      let contacts = localContacts;
      let notifications = localNotifications;
      let stakeholders = localStakeholders;

      // Try loading from services as fallback
      try {
        if (contacts.length === 0) {
          contacts = await googleSheetsService.fetchContacts();
        }
        if (stakeholders.length === 0) {
          stakeholders = await authService.getAllUsers();
        }
        if (notifications.length === 0) {
          // Mock notifications for now
          notifications = [
            {
              id: 1,
              title: 'Welcome to Troop 468 Manager',
              message: 'Your dashboard is ready to use!',
              read: false,
              createdAt: new Date()
            }
          ];
        }
      } catch (error) {
        console.log('Dashboard: Error loading data from services, using localStorage fallback:', error.message);
      }

      const unreadNotifications = notifications.filter(n => !n.read).length;

      setStats({
        contacts: contacts.length,
        stakeholders: stakeholders.length,
        notifications: notifications.length,
        unreadNotifications,
      });

      // Check for last sync time
      const lastSyncTime = localStorage.getItem('lastSyncTime');
      if (lastSyncTime) {
        setLastSync(new Date(lastSyncTime));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncContacts = async () => {
    if (!googleSheetsService.isConfigured()) {
      setSyncStatus('Google Sheets not configured. Please check your environment variables.');
      return;
    }

    try {
      setSyncLoading(true);
      setSyncStatus('Fetching data from Google Sheets...');

      const sheetData = await googleSheetsService.getSheetData();
      
      if (sheetData.length === 0) {
        setSyncStatus('No data found in the Google Sheet.');
        return;
      }

      const validation = googleSheetsService.validateSheetData(sheetData);
      if (!validation.isValid) {
        setSyncStatus(`Data validation failed: ${validation.issues.join(', ')}`);
        return;
      }

      setSyncStatus('Processing contacts...');
      
      // Store contacts in localStorage for demo purposes (since Firebase isn't configured)
      const contactsWithIds = sheetData.map((contact, index) => ({
        id: `contact_${Date.now()}_${index}`,
        ...contact,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      localStorage.setItem('troopmanager_contacts', JSON.stringify(contactsWithIds));

      const currentTime = new Date();
      localStorage.setItem('lastSyncTime', currentTime.toISOString());
      setLastSync(currentTime);

      setSyncStatus(`Successfully synced ${sheetData.length} contacts!`);
      
      // Refresh dashboard data
      loadDashboardData();

      // Store sync notification in localStorage
      const notifications = JSON.parse(localStorage.getItem('troopmanager_notifications') || '[]');
      notifications.unshift({
        id: `notification_${Date.now()}`,
        title: 'Contact Sync Completed',
        message: `Successfully synced ${sheetData.length} contacts from Google Sheets`,
        type: 'success',
        createdAt: new Date().toISOString(),
        read: false
      });
      localStorage.setItem('troopmanager_notifications', JSON.stringify(notifications));

    } catch (error) {
      console.error('Error syncing contacts:', error);
      setSyncStatus(`Sync failed: ${error.message}`);
    } finally {
      setSyncLoading(false);
    }
  };

  const dashboardCards = [
    {
      title: 'Stakeholder Management',
      description: 'Manage the list of stakeholders who receive notifications',
      icon: <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      count: stats.stakeholders,
      action: 'Manage Stakeholders',
      path: '/stakeholders',
    },
    {
      title: 'Contact',
      description: 'View and search all contacts from Google Sheets',
      icon: <ContactsIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      count: stats.contacts,
      action: 'View Contacts',
      path: '/contacts',
    },
    {
      title: 'Notifications',
      description: 'View system notifications and alerts',
      icon: <NotificationsIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      count: stats.notifications,
      badge: stats.unreadNotifications,
      action: 'View Notifications',
      path: '/notifications',
    },
    {
      title: 'System Settings',
      description: 'Configure Google Sheets integration and notification settings',
      icon: <SettingsIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      action: 'Open Settings',
      path: '/settings',
    },
  ];

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <PageTitle
        icon={PeopleIcon}
        title="TroopManager Dashboard"
        description="Manage your contact notifications and stakeholder communications"
      />

      {/* Sync Section */}
      <Card sx={{ mb: 4, backgroundColor: 'primary.light', color: 'white' }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                Google Sheets Synchronization
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Sync contact data from your Google Sheets form
              </Typography>
              {lastSync && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Last sync: {lastSync.toLocaleString()}
                </Typography>
              )}
            </Box>
            <Button
              variant="contained"
              color="secondary"
              startIcon={syncLoading ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
              onClick={handleSyncContacts}
              disabled={syncLoading}
              sx={{ minWidth: 140 }}
            >
              {syncLoading ? 'Syncing...' : 'Sync Now'}
            </Button>
          </Box>
          {syncStatus && (
            <Alert 
              severity={syncStatus.includes('failed') || syncStatus.includes('validation failed') ? 'error' : 'info'} 
              sx={{ mt: 2 }}
            >
              {syncStatus}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Dashboard Cards */}
      <Grid container spacing={3}>
        {dashboardCards.map((card) => (
          <Grid item xs={12} sm={6} md={6} key={card.title}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
                  <Box>
                    {card.icon}
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    {card.count !== undefined && (
                      <Chip 
                        label={card.count} 
                        color="primary" 
                        size="small"
                      />
                    )}
                    {card.badge > 0 && (
                      <Chip 
                        label={card.badge} 
                        color="error" 
                        size="small"
                      />
                    )}
                  </Box>
                </Box>
                <Typography variant="h6" component="h3" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate(card.path)}
                  fullWidth
                >
                  {card.action}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Dashboard;
