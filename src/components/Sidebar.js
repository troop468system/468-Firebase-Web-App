import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../App';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  CalendarToday as CalendarIcon,
  Business as OrganizationIcon,

  School as TrainingIcon,
  LocalHospital as MedicalIcon,
  EmojiEvents as MeritBadgesIcon,
  Assignment as SMCIcon,
  Gavel as BORIcon,
  Flag as NHPAIcon,
  VolunteerActivism as PSVAIcon,
  Receipt as ReimbursementIcon,
  People as UsersIcon,
  Contacts as ContactsIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Hiking as OutingIcon,
} from '@mui/icons-material';

const drawerWidth = 240;
const collapsedDrawerWidth = 64;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed: collapsed, setSidebarCollapsed: setCollapsed } = useSidebar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const menuSections = [
    {
      title: 'Main',
      items: [
        { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
        { path: '/calendar', label: 'Calendar', icon: <CalendarIcon /> },
        { path: '/organization', label: 'Organization', icon: <OrganizationIcon /> },
        { path: '/contact-directory', label: 'Contacts', icon: <ContactsIcon /> },
      ]
    },
    {
      title: 'Scouts Management',
      items: [
        { path: '/training', label: 'Training', icon: <TrainingIcon /> },
        { path: '/medical-form', label: 'Medical Form', icon: <MedicalIcon /> },
        { path: '/merit-badges', label: 'Merit Badges', icon: <MeritBadgesIcon /> },
        { path: '/outing', label: 'Outing', icon: <OutingIcon /> },
        { path: '/smc', label: 'SMC', icon: <SMCIcon /> },
        { path: '/bor', label: 'BOR', icon: <BORIcon /> },
      ]
    },
    {
      title: 'Programs',
      items: [
        { path: '/nhpa', label: 'NHPA', icon: <NHPAIcon /> },
        { path: '/psva', label: 'PSVA', icon: <PSVAIcon /> },
        { path: '/reimbursement', label: 'Reimbursement', icon: <ReimbursementIcon /> },
      ]
    },
    {
      title: 'Administration',
      items: [
        { path: '/users', label: 'Users', icon: <UsersIcon /> },
        { path: '/notifications', label: 'Notifications', icon: <NotificationsIcon /> },
        { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
      ]
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? !collapsed : true}
      onClose={isMobile ? () => setCollapsed(true) : undefined}
      sx={{
        width: isMobile ? drawerWidth : (collapsed ? collapsedDrawerWidth : drawerWidth),
        flexShrink: 0,
        transition: 'width 0.3s ease',
        '& .MuiDrawer-paper': {
          width: isMobile ? drawerWidth : (collapsed ? collapsedDrawerWidth : drawerWidth),
          boxSizing: 'border-box',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
        },
      }}
    >
      <Toolbar />
      
      {/* Collapse/Expand Button - Hidden on mobile since hamburger icon serves same purpose */}
      {!isMobile && (
        <Box sx={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', p: 1 }}>
          <IconButton 
            onClick={() => setCollapsed(!collapsed)}
            size="small"
            sx={{ 
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              color: 'rgba(255, 255, 255, 0.9)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
              }
            }}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
      )}

      <Box sx={{ 
        overflow: 'auto', 
        pt: 1,
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(255, 255, 255, 0.5)',
        },
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent'
      }}>
        {menuSections.map((section, sectionIndex) => (
          <Box key={section.title}>
            {sectionIndex > 0 && <Divider sx={{ my: 1 }} />}
            
            {/* Section Title - only show when expanded */}
            {!collapsed && (
              <Box sx={{ px: 2, py: 1 }}>
                <ListItemText
                  primary={section.title}
                  primaryTypographyProps={{
                    variant: 'caption',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                />
              </Box>
            )}
            
            <List dense>
              {section.items.map((item) => (
                <ListItem key={item.path} disablePadding sx={{ px: collapsed ? 0.5 : 1 }}>
                  {collapsed ? (
                    <Tooltip title={item.label} placement="right" arrow>
                      <ListItemButton
                        onClick={() => {
                          navigate(item.path);
                          // Close sidebar on mobile after navigation
                          if (isMobile) {
                            setCollapsed(true);
                          }
                        }}
                        sx={{
                          borderRadius: 1,
                          mx: 0.5,
                          minHeight: 40,
                          justifyContent: 'center',
                          backgroundColor: isActive(item.path) ? '#4caf50' : 'transparent',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: isActive(item.path) 
                              ? '#388e3c' 
                              : 'rgba(76, 175, 80, 0.1)',
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 24,
                            justifyContent: 'center',
                            color: isActive(item.path) ? 'white' : 'rgba(255, 255, 255, 0.95)',
                            filter: isActive(item.path) ? 'none' : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))',
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                      </ListItemButton>
                    </Tooltip>
                  ) : (
                    <ListItemButton
                      onClick={() => {
                        navigate(item.path);
                        // Close sidebar on mobile after navigation
                        if (isMobile) {
                          setCollapsed(true);
                        }
                      }}
                      selected={isActive(item.path)}
                      sx={{
                        borderRadius: 1,
                        mx: 1,
                        minHeight: 40,
                        color: 'rgba(255, 255, 255, 0.9)',
                        '&.Mui-selected': {
                          background: 'rgba(76, 175, 80, 0.3)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(76, 175, 80, 0.5)',
                          color: 'white',
                          '&:hover': {
                            background: 'rgba(76, 175, 80, 0.4)',
                          },
                          '& .MuiListItemIcon-root': {
                            color: 'white',
                          },
                        },
                        '&:hover': {
                          background: isActive(item.path) 
                            ? 'rgba(76, 175, 80, 0.4)'
                            : 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(10px)',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 40,
                          color: isActive(item.path) ? 'white' : 'inherit',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: isActive(item.path) ? 600 : 400,
                        }}
                      />
                    </ListItemButton>
                  )}
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </Box>
    </Drawer>
  );
};

export default Sidebar;
