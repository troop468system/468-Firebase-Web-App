import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Organization from './pages/Organization';
import Registration from './pages/Registration';
import Training from './pages/Training';
import MedicalForm from './pages/MedicalForm';
import MeritBadges from './pages/MeritBadges';
import SMC from './pages/SMC';
import BOR from './pages/BOR';
import NHPA from './pages/NHPA';
import PSVA from './pages/PSVA';
import Reimbursement from './pages/Reimbursement';
import Users from './pages/Users';
import ContactList from './pages/ContactList';
import NotificationCenter from './pages/NotificationCenter';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import SignUp from './pages/SignUp';
import authService from './services/authService';

// Sidebar context for managing collapse state
const SidebarContext = createContext();
export const useSidebar = () => useContext(SidebarContext);

// Auth context for managing authentication state
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Theme context for managing theme state
const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

const createAppTheme = (mode) => createTheme({
  palette: {
    mode: mode,
    primary: {
      main: mode === 'light' ? '#6BA6CD' : '#90CAF9',  // Lighter blue for dark mode
      light: mode === 'light' ? '#B3D4F1' : '#BBDEFB',
      dark: mode === 'light' ? '#4A7FA8' : '#42A5F5',
      contrastText: '#fff',
    },
    secondary: {
      main: '#81C784',  // Soft green from Vice Committee Chair
      light: '#C8E6C9',
      dark: '#66BB6A',
      contrastText: '#fff',
    },
    error: {
      main: '#EF9A9A',  // Soft coral/pink from Committee Chair
      light: '#FFCDD2',
      dark: '#E57373',
    },
    warning: {
      main: '#FFF176',  // Soft yellow from committee positions
      light: '#FFF9C4',
      dark: '#FFD54F',
    },
    success: {
      main: '#81C784',  // Same as secondary
      light: '#C8E6C9',
      dark: '#66BB6A',
    },
    // Dynamic background and text based on mode
    ...(mode === 'light'
      ? {
          background: {
            default: '#FAFAFA',
            paper: '#FFFFFF',
          },
          text: {
            primary: '#37474F',
            secondary: '#78909C',
          },
        }
      : {
          background: {
            default: '#121212',
            paper: '#1E1E1E',
          },
          text: {
            primary: '#FFFFFF',
            secondary: '#B0B0B0',
          },
        }),
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 500,
      fontSize: '2rem',
      color: '#37474F',
    },
    h2: {
      fontWeight: 500,
      fontSize: '1.75rem',
      color: '#37474F',
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.5rem',
      color: '#37474F',
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.25rem',
      color: '#37474F',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.125rem',
      color: '#37474F',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
      color: '#37474F',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 5, // Subtle rounded corners
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 5,
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
          border: '2px solid rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 5,
          padding: '10px 20px',
          fontWeight: 500,
          textTransform: 'none',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #6BA6CD 0%, #5B9BD5 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5B9BD5 0%, #4A7FA8 100%)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 5,
          fontWeight: 500,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 5,
            '& fieldset': {
              borderColor: 'rgba(0,0,0,0.1)',
              borderWidth: '2px',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0,0,0,0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6BA6CD',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 5,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0,0,0,0.1)',
            borderWidth: '2px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0,0,0,0.2)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#6BA6CD',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 5,
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #6BA6CD 0%, #5B9BD5 100%)',
          boxShadow: '0 2px 16px rgba(107,166,205,0.2)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          borderRight: '2px solid rgba(0,0,0,0.06)',
          boxShadow: '2px 0 16px rgba(0,0,0,0.04)',
          backgroundColor: '#FAFAFA',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 5,
          margin: '4px 12px',
          transition: 'all 0.2s ease-in-out',
          '&.Mui-selected': {
            background: 'linear-gradient(135deg, #6BA6CD 0%, #5B9BD5 100%)',
            color: '#fff',
            boxShadow: '0 3px 12px rgba(107,166,205,0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5B9BD5 0%, #4A7FA8 100%)',
            },
            '& .MuiListItemIcon-root': {
              color: '#fff',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(107,166,205,0.08)',
            transform: 'translateX(4px)',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 5,
          backgroundColor: 'rgba(107,166,205,0.1)',
        },
        bar: {
          borderRadius: 5,
          background: 'linear-gradient(135deg, #6BA6CD 0%, #5B9BD5 100%)',
        },
      },
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return currentUser ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return currentUser ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [themeMode, setThemeMode] = useState(() => {
    // Get theme from localStorage or default to 'light'
    return localStorage.getItem('themeMode') || 'light';
  });

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = await authService.initialize();
        setCurrentUser(user);
        
        if (user) {
          const profile = authService.getCurrentUserProfile();
          setCurrentUserProfile(profile);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setAuthLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  const themeValue = {
    mode: themeMode,
    toggleTheme,
  };

  const authValue = {
    currentUser,
    currentUserProfile,
    loading: authLoading,
    refreshAuth: async () => {
      try {
        console.log('Refreshing auth context...');
        const user = authService.getCurrentUser();
        const profile = authService.getCurrentUserProfile();
        
        console.log('Auth refresh - User:', user?.email);
        console.log('Auth refresh - Profile:', profile);
        
        setCurrentUser(user);
        setCurrentUserProfile(profile);
        
        console.log('Auth context updated successfully');
      } catch (error) {
        console.error('Auth refresh error:', error);
      }
    },
    signOut: async () => {
      await authService.signOut();
      setCurrentUser(null);
      setCurrentUserProfile(null);
    }
  };

  return (
    <ThemeProvider theme={createAppTheme(themeMode)}>
      <CssBaseline />
      <Router>
        <ThemeContext.Provider value={themeValue}>
          <AuthContext.Provider value={authValue}>
            <SidebarContext.Provider value={{ sidebarCollapsed, setSidebarCollapsed }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />
              <Route path="/reset-password" element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              } />
              <Route path="/account-setup" element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              } />
              <Route path="/signup" element={<SignUp />} />
              
              {/* Protected Routes */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <Box sx={{ display: 'flex' }}>
                    <Header />
                    <Sidebar />
                    <Box
                      component="main"
                      sx={{
                        flexGrow: 1,
                        p: { xs: 1, sm: 2, md: 3 }, // Responsive padding
                        mt: 8, // Account for fixed header height
                        ml: 0, // Sidebar handles its own spacing
                        transition: 'margin-left 0.3s ease',
                        width: { xs: '100%', md: 'auto' }, // Full width on mobile
                        minHeight: 'calc(100vh - 64px)', // Ensure full height
                      }}
                    >
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/calendar" element={<Calendar />} />
                        <Route path="/organization" element={<Organization />} />
                        <Route path="/organization/:tab" element={<Organization />} />
                        <Route path="/registration" element={<Registration />} />
                        <Route path="/training" element={<Training />} />
                        <Route path="/medical-form" element={<MedicalForm />} />
                        <Route path="/merit-badges" element={<MeritBadges />} />
                        <Route path="/smc" element={<SMC />} />
                        <Route path="/bor" element={<BOR />} />
                        <Route path="/nhpa" element={<NHPA />} />
                        <Route path="/psva" element={<PSVA />} />
                        <Route path="/reimbursement" element={<Reimbursement />} />
                        <Route path="/users" element={<Users />} />
                        <Route path="/users/:tab" element={<Users />} />
                        <Route path="/contact-directory" element={<ContactList />} />
                        <Route path="/notifications" element={<NotificationCenter />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/profile" element={<Profile />} />
                      </Routes>
                    </Box>
                  </Box>
                </ProtectedRoute>
              } />
            </Routes>
          </SidebarContext.Provider>
        </AuthContext.Provider>
        </ThemeContext.Provider>
      </Router>
    </ThemeProvider>
  );
}

export default App;