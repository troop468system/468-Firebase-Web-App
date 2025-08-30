import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';

import { notificationsService } from '../services/firestoreService';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'info', 'warning', 'error', 'success'

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsService.getAll();
      setNotifications(data);
      setError('');
    } catch (error) {
      setError('Failed to load notifications');
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      setError('Failed to mark notification as read');
      console.error('Error marking notification as read:', error);
    }
  };

  const handleViewNotification = (notification) => {
    setSelectedNotification(notification);
    setDialogOpen(true);
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <SuccessIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const readFilter = filter === 'all' || 
                      (filter === 'read' && notification.read) ||
                      (filter === 'unread' && !notification.read);
    
    const typeMatches = typeFilter === 'all' || notification.type === typeFilter;
    
    return readFilter && typeMatches;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h4" component="h1">
              Notification Center
            </Typography>
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            )}
          </Box>
          <Typography variant="subtitle1" color="text.secondary">
            System notifications and alerts
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadNotifications}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <FilterIcon color="action" />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="unread">Unread</MenuItem>
                <MenuItem value="read">Read</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No notifications yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Notifications will appear here when events occur in your system
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No notifications match your filters
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your filter settings
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <List>
            {filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    backgroundColor: notification.read ? 'transparent' : 'action.hover',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                  }}
                  onClick={() => handleViewNotification(notification)}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: notification.read ? 'normal' : 'bold',
                          }}
                        >
                          {notification.title}
                        </Typography>
                        <Chip
                          label={notification.type || 'info'}
                          size="small"
                          color={getNotificationColor(notification.type)}
                          variant="outlined"
                        />
                        {!notification.read && (
                          <Chip
                            label="NEW"
                            size="small"
                            color="error"
                            variant="filled"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            mt: 1,
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                          {notification.createdAt
                            ? new Date(notification.createdAt.seconds * 1000).toLocaleString()
                            : 'Unknown time'
                          }
                        </Typography>
                      </Box>
                    }
                  />
                  <Box display="flex" flexDirection="column" gap={1}>
                    {!notification.read && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        title="Mark as read"
                      >
                        <MarkReadIcon />
                      </IconButton>
                    )}
                  </Box>
                </ListItem>
                {index < filteredNotifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Card>
      )}

      {/* Notification Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedNotification && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                {getNotificationIcon(selectedNotification.type)}
                <Box>
                  <Typography variant="h6">
                    {selectedNotification.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedNotification.createdAt
                      ? new Date(selectedNotification.createdAt.seconds * 1000).toLocaleString()
                      : 'Unknown time'
                    }
                  </Typography>
                </Box>
                <Chip
                  label={selectedNotification.type || 'info'}
                  color={getNotificationColor(selectedNotification.type)}
                  variant="outlined"
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {selectedNotification.message}
              </Typography>
              {selectedNotification.details && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Additional Details:
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: 'pre-wrap' }}
                  >
                    {selectedNotification.details}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default NotificationCenter;