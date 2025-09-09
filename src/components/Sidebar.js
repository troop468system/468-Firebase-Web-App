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
          borderRight: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
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
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.paper',
              '&:hover': {
                backgroundColor: 'action.hover',
              }
            }}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
      )}

      <Box sx={{ overflow: 'auto', pt: 1 }}>
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
                    color: 'text.secondary',
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
                        selected={isActive(item.path)}
                        sx={{
                          borderRadius: 1,
                          mx: 0.5,
                          minHeight: 48,
                          justifyContent: 'center',
                          '&.Mui-selected': {
                            backgroundColor: (theme) => theme.palette.primary.main,
                            color: 'white',
                            '&:hover': {
                              backgroundColor: (theme) => theme.palette.primary.dark,
                            },
                            '& .MuiListItemIcon-root': {
                              color: 'white',
                            },
                          },
                          '&:hover': {
                            backgroundColor: (theme) => 
                              isActive(item.path) 
                                ? theme.palette.primary.dark 
                                : theme.palette.action.hover,
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            justifyContent: 'center',
                            color: isActive(item.path) ? 'white' : 'inherit',
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
                        '&.Mui-selected': {
                          backgroundColor: (theme) => theme.palette.primary.main,
                          color: 'white',
                          '&:hover': {
                            backgroundColor: (theme) => theme.palette.primary.dark,
                          },
                          '& .MuiListItemIcon-root': {
                            color: 'white',
                          },
                        },
                        '&:hover': {
                          backgroundColor: (theme) => 
                            isActive(item.path) 
                              ? theme.palette.primary.dark 
                              : theme.palette.action.hover,
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
