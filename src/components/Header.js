import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useTheme as useAppTheme, useSidebar } from '../App';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
  Notifications as NotificationsIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Menu as MenuIcon,
  Hiking as ScoutIcon,
} from '@mui/icons-material';

const Header = () => {
  const navigate = useNavigate();
  const { currentUser, currentUserProfile, signOut } = useAuth();
  const { mode, toggleTheme } = useAppTheme();
  const { sidebarCollapsed, setSidebarCollapsed } = useSidebar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    const userEmail = currentUser?.email;
    if (userEmail) {
      navigate(`/users/authorized?family=${encodeURIComponent(userEmail)}`);
    } else {
      navigate('/users/authorized');
    }
    handleClose();
  };

  const handleSettings = () => {
    navigate('/settings');
    handleClose();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
    handleClose();
  };

  const getUserDisplayName = () => {
    if (currentUserProfile?.displayName) {
      return currentUserProfile.displayName;
    }
    if (currentUser?.displayName) {
      return currentUser.displayName;
    }
    return currentUser?.email || 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    if (name === currentUser?.email) {
      return name[0].toUpperCase();
    }
    const initials = name.split(' ').map(word => word[0]).join('');
    return initials.toUpperCase();
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'primary.main',
        borderRadius: 0,
        top: 0,
        left: 0,
        right: 0,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar>
        {/* Mobile Menu Button */}
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        {/* Logo and App Name */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              border: '2px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <ScoutIcon
              sx={{
                color: 'white',
                fontSize: '1.5rem',
              }}
            />
          </Box>
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              fontWeight: 'bold',
              color: 'white'
            }}
          >
            Troop 468
          </Typography>
        </Box>

        {/* Notifications and Profile Section */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Theme Switch */}
          <IconButton 
            color="inherit" 
            onClick={toggleTheme} 
            sx={{ mr: 1 }}
            title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
          >
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
          
          <IconButton color="inherit" onClick={() => navigate('/notifications')} sx={{ mr: 1 }}>
            <Badge color="error" variant="dot">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{ ml: 2 }}
            aria-controls={open ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'white', color: '#1976d2' }}>
              {getUserInitials()}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={open}
            onClose={handleClose}
            onClick={handleClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleProfile}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Edit Profile" />
            </MenuItem>
            <MenuItem onClick={handleSettings}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
