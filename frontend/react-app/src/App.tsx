import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Provider, useSelector } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { store } from './store/index'
import type { RootState } from './store'
import { useAuthInitialization } from './hooks/useAuth'
import { ThemeProvider as CustomThemeProvider } from './contexts/ThemeContext'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/Layout'
import DashboardOptimized from './pages/DashboardOptimized'
import DashboardPhase3 from './pages/DashboardPhase3'
import Login from './pages/auth/Login'
import CampaignList from './pages/campaigns/CampaignList'
import VoterDataOptimized from './pages/voter-data/VoterDataOptimized'
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
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<DashboardPhase3 />} />
                  <Route path="/dashboard" element={<DashboardPhase3 />} />
                  <Route path="/dashboard-old" element={<DashboardOptimized />} />
                  <Route path="/campaigns" element={<CampaignList />} />
                  <Route path="/voter-data" element={<VoterDataOptimized />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </AnimatePresence>
    </Router>
  )
}

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <CustomThemeProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppContent />
          </ThemeProvider>
        </CustomThemeProvider>
      </QueryClientProvider>
    </Provider>
  )
}

export default App
