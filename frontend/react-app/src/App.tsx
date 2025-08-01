import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { Box, Card, CardContent, Typography, Grid } from '@mui/material'
import CssBaseline from '@mui/material/CssBaseline'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { store } from './store/index'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import CampaignList from './pages/campaigns/CampaignList'
import BillingDashboard from './pages/billing/BillingDashboard'
import VoterDataOptimized from './pages/voter-data/VoterDataOptimized'
import TerritoryManager from './pages/territories/TerritoryManager'
import UserManagement from './pages/admin/UserManagement'
import CanvassSessionDashboard from './pages/canvassing/CanvassSessionDashboard'
import PlanManager from './pages/redistricting/PlanManager'
import IntegrationsDashboard from './pages/integrations/IntegrationsDashboard'
import PredictiveModeling from './pages/analytics/PredictiveModeling'

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Create modern CRM theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#0070f3', // Modern blue
      dark: '#0051cc',
      light: '#4d94ff',
    },
    secondary: {
      main: '#7c3aed', // Purple accent
      dark: '#5b21b6',
      light: '#a855f7',
    },
    background: {
      default: '#fafbfc', // Light gray background
      paper: '#ffffff',
    },
    text: {
      primary: '#1a202c',
      secondary: '#4a5568',
    },
    grey: {
      50: '#f7fafc',
      100: '#edf2f7',
      200: '#e2e8f0',
      300: '#cbd5e0',
      400: '#a0aec0',
      500: '#718096',
      600: '#4a5568',
      700: '#2d3748',
      800: '#1a202c',
      900: '#171923',
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      color: '#1a202c',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      color: '#1a202c',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#1a202c',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#1a202c',
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#1a202c',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#1a202c',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#4a5568',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#4a5568',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0, 0, 0, 0.05), 0px 1px 2px rgba(0, 0, 0, 0.1)',
    '0px 1px 3px rgba(0, 0, 0, 0.05), 0px 4px 6px rgba(0, 0, 0, 0.1)',
    '0px 4px 6px rgba(0, 0, 0, 0.05), 0px 10px 15px rgba(0, 0, 0, 0.1)',
    '0px 10px 15px rgba(0, 0, 0, 0.05), 0px 20px 25px rgba(0, 0, 0, 0.1)',
    '0px 25px 50px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px rgba(0, 0, 0, 0.25)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '10px 20px',
          fontWeight: 600,
          fontSize: '0.875rem',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #0070f3 0%, #4d94ff 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0051cc 0%, #3d7aff 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05), 0px 1px 2px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.05), 0px 10px 15px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: '#e2e8f0',
            },
            '&:hover fieldset': {
              borderColor: '#cbd5e0',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0070f3',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1a202c',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05), 0px 1px 2px rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid #e2e8f0',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1a202c',
          color: '#ffffff',
          borderRight: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 112, 243, 0.2)',
            '&:hover': {
              backgroundColor: 'rgba(0, 112, 243, 0.3)',
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: 'inherit',
          minWidth: 40,
        },
      },
    },
  },
})

const SimpleDashboard = () => (
  <Box 
    sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 3,
    }}
  >
    <Card sx={{ maxWidth: 800, width: '100%' }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
            CampaignManager
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            Political Campaign Management System
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome to the VEP Django System frontend. All components are working with modern CRM styling!
          </Typography>
        </Box>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {[
            { name: 'Login', path: '/login', icon: '🔐', color: '#0070f3' },
            { name: 'Dashboard', path: '/dashboard', icon: '📊', color: '#7c3aed' },
            { name: 'Campaigns', path: '/campaigns', icon: '🏛️', color: '#059669' },
            { name: 'Voter Data', path: '/voter-data', icon: '👥', color: '#dc2626' },
            { name: 'Billing', path: '/billing', icon: '💳', color: '#ea580c' },
            { name: 'Territories', path: '/territories', icon: '🗺️', color: '#0891b2' },
            { name: 'Canvassing', path: '/canvassing', icon: '🚪', color: '#7c2d12' },
            { name: 'Redistricting', path: '/redistricting', icon: '🏗️', color: '#a21caf' },
            { name: 'Admin', path: '/admin', icon: '⚙️', color: '#374151' },
            { name: 'Integrations', path: '/integrations', icon: '🔗', color: '#1f2937' },
            { name: 'Analytics', path: '/analytics', icon: '📈', color: '#6366f1' },
          ].map((item) => (
            <Grid item xs={6} sm={4} md={3} key={item.name}>
              <Card
                component="a"
                href={item.path}
                sx={{
                  textDecoration: 'none',
                  display: 'block',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {item.icon}
                  </Typography>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 600,
                      color: item.color,
                    }}
                  >
                    {item.name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  </Box>
)

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/campaigns" element={<CampaignList />} />
              <Route path="/voter-data" element={<VoterDataOptimized />} />
              <Route path="/billing" element={<BillingDashboard />} />
              <Route path="/territories" element={<TerritoryManager />} />
              <Route path="/canvassing" element={<CanvassSessionDashboard />} />
              <Route path="/redistricting" element={<PlanManager />} />
              <Route path="/admin" element={<UserManagement />} />
              <Route path="/integrations" element={<IntegrationsDashboard />} />
              <Route path="/analytics" element={<PredictiveModeling />} />
              <Route path="/" element={<SimpleDashboard />} />
            </Routes>
          </Router>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  )
}

export default App
