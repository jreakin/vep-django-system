import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Provider, useSelector } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { store } from './store/index'
import type { RootState } from './store'
import { useAuthInitialization } from './hooks/useAuth'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Login from './pages/auth/Login'
import CampaignList from './pages/campaigns/CampaignList'
import VoterData from './pages/voter-data/VoterData'
import BillingDashboard from './pages/billing/BillingDashboard'
import PaymentMethods from './pages/billing/PaymentMethods'
import InvoiceDetail from './pages/billing/InvoiceDetail'
import WalkListManager from './pages/canvassing/WalkListManager'
import CanvassSessionDashboard from './pages/canvassing/CanvassSessionDashboard'
import QuestionnaireBuilder from './pages/canvassing/QuestionnaireBuilder'
import './index.css'

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

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// App content with auth initialization
const AppContent = () => {
  useAuthInitialization()
  
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/campaigns" element={<CampaignList />} />
                <Route path="/voter-data" element={<VoterData />} />
                <Route path="/billing" element={<BillingDashboard />} />
                <Route path="/billing/payment-methods" element={<PaymentMethods />} />
                <Route path="/billing/invoices/:id" element={<InvoiceDetail />} />
                <Route path="/canvassing" element={<WalkListManager />} />
                <Route path="/canvassing/sessions" element={<CanvassSessionDashboard />} />
                <Route path="/canvassing/questionnaires" element={<QuestionnaireBuilder />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppContent />
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  )
}

export default App
