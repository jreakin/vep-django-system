import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import type { RootState } from '../../store'
import { loginStart, loginSuccess, loginFailure } from '../../store/authSlice'
import authService from '../../services/auth'

const Login: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [pin, setPin] = useState('')
  const [step, setStep] = useState<'phone' | 'pin'>('phone')
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading, error } = useSelector((state: RootState) => state.auth)

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(loginStart())
    
    try {
      await authService.sendPin({ phone: phoneNumber })
      setStep('pin')
    } catch (error: any) {
      dispatch(loginFailure(error.response?.data?.message || 'Failed to send PIN'))
    }
  }

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(loginStart())
    
    try {
      const response = await authService.verifyPin({ phone: phoneNumber, pin })
      dispatch(loginSuccess(response))
      navigate('/dashboard')
    } catch (error: any) {
      dispatch(loginFailure(error.response?.data?.message || 'Invalid PIN'))
    }
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Card sx={{ mt: 8, width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography component="h1" variant="h4" align="center" gutterBottom>
              CampaignManager
            </Typography>
            <Typography variant="h6" align="center" color="text.secondary" gutterBottom>
              {step === 'phone' ? 'Enter your phone number' : 'Enter verification PIN'}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {step === 'phone' ? (
              <Box component="form" onSubmit={handlePhoneSubmit} sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="phoneNumber"
                  label="Phone Number"
                  name="phoneNumber"
                  autoComplete="tel"
                  autoFocus
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending PIN...' : 'Send PIN'}
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handlePinSubmit} sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="pin"
                  label="Verification PIN"
                  name="pin"
                  autoComplete="one-time-code"
                  autoFocus
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="123456"
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Verifying...' : 'Verify PIN'}
                </Button>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => setStep('phone')}
                  disabled={isLoading}
                >
                  Back to phone number
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

export default Login