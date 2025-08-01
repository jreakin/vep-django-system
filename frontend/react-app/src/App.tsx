import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store/index'
import Login from './pages/auth/Login'

const SimpleDashboard = () => (
  <div style={{ padding: '20px', background: '#f0fff0' }}>
    <h1>Dashboard</h1>
    <p>This would be the dashboard</p>
  </div>
)

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<SimpleDashboard />} />
        </Routes>
      </Router>
    </Provider>
  )
}

export default App
