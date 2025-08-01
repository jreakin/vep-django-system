import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { store } from './store/index'
import Login from './pages/auth/Login'
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

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
  },
})

const SimpleDashboard = () => (
  <div style={{ padding: '20px', background: '#f0fff0' }}>
    <h1>Campaign Manager Dashboard</h1>
    <p>Welcome to the VEP Django System frontend. All components are now working!</p>
    <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxWidth: '600px' }}>
      <a href="/login" style={{ color: '#1976d2', textDecoration: 'none', padding: '10px', border: '1px solid #1976d2', borderRadius: '4px', textAlign: 'center' }}>Login</a>
      <a href="/campaigns" style={{ color: '#1976d2', textDecoration: 'none', padding: '10px', border: '1px solid #1976d2', borderRadius: '4px', textAlign: 'center' }}>Campaigns</a>
      <a href="/voter-data" style={{ color: '#1976d2', textDecoration: 'none', padding: '10px', border: '1px solid #1976d2', borderRadius: '4px', textAlign: 'center' }}>Voter Data</a>
      <a href="/billing" style={{ color: '#1976d2', textDecoration: 'none', padding: '10px', border: '1px solid #1976d2', borderRadius: '4px', textAlign: 'center' }}>Billing</a>
      <a href="/territories" style={{ color: '#1976d2', textDecoration: 'none', padding: '10px', border: '1px solid #1976d2', borderRadius: '4px', textAlign: 'center' }}>Territories</a>
      <a href="/canvassing" style={{ color: '#1976d2', textDecoration: 'none', padding: '10px', border: '1px solid #1976d2', borderRadius: '4px', textAlign: 'center' }}>Canvassing</a>
      <a href="/redistricting" style={{ color: '#1976d2', textDecoration: 'none', padding: '10px', border: '1px solid #1976d2', borderRadius: '4px', textAlign: 'center' }}>Redistricting</a>
      <a href="/admin" style={{ color: '#1976d2', textDecoration: 'none', padding: '10px', border: '1px solid #1976d2', borderRadius: '4px', textAlign: 'center' }}>Admin</a>
      <a href="/integrations" style={{ color: '#1976d2', textDecoration: 'none', padding: '10px', border: '1px solid #1976d2', borderRadius: '4px', textAlign: 'center' }}>Integrations</a>
      <a href="/analytics" style={{ color: '#1976d2', textDecoration: 'none', padding: '10px', border: '1px solid #1976d2', borderRadius: '4px', textAlign: 'center' }}>Analytics</a>
    </div>
  </div>
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
