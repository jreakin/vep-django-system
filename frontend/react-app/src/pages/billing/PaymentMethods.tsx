import React, { useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material'
import {
  CreditCard,
  Delete,
  Add,
  Star,
  StarBorder
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import {
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  type PaymentMethod
} from '../../services/billing'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_fake_key')

const AddPaymentMethodForm: React.FC<{ onSuccess: () => void; onCancel: () => void }> = ({
  onSuccess,
  onCancel
}) => {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setError(null)

    const cardElement = elements.getElement(CardElement)

    if (!cardElement) {
      setError('Card element not found')
      setLoading(false)
      return
    }

    try {
      const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (methodError) {
        setError(methodError.message || 'Failed to create payment method')
        setLoading(false)
        return
      }

      await addPaymentMethod(paymentMethod.id)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add payment method')
      setLoading(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  }

  return (
    <Box>
      <form onSubmit={handleSubmit}>
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Card Information
          </Typography>
          <Card variant="outlined" sx={{ p: 2 }}>
            <CardElement options={cardElementOptions} />
          </Card>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box display="flex" gap={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!stripe || loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Adding...' : 'Add Payment Method'}
          </Button>
        </Box>
      </form>
    </Box>
  )
}

const PaymentMethods: React.FC = () => {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: paymentMethods = [], isLoading, error } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: getPaymentMethods,
  })

  const deleteMutation = useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    },
  })

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    },
  })

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSetDefault = async (id: string) => {
    setDefaultMutation.mutate(id)
  }

  const handleAddSuccess = () => {
    setAddDialogOpen(false)
    queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
  }

  const getBrandIcon = (brand: string) => {
    // You could replace this with actual card brand icons
    return <CreditCard />
  }

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Failed to load payment methods. Please try again later.
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          Payment Methods
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAddDialogOpen(true)}
        >
          Add Payment Method
        </Button>
      </Box>

      {paymentMethods.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <CreditCard sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Payment Methods
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Add a payment method to start making payments
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddDialogOpen(true)}
            >
              Add Your First Payment Method
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {paymentMethods.map((method) => (
            <Grid item xs={12} sm={6} key={method.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center">
                      {getBrandIcon(method.brand)}
                      <Box ml={2}>
                        <Typography variant="h6">
                          •••• •••• •••• {method.last4}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {method.brand.toUpperCase()} • Expires {method.exp_month}/{method.exp_year}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      {method.is_default ? (
                        <Chip
                          icon={<Star />}
                          label="Default"
                          color="primary"
                          size="small"
                        />
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() => handleSetDefault(method.id)}
                          title="Set as default"
                        >
                          <StarBorder />
                        </IconButton>
                      )}
                    </Box>
                  </Box>

                  <Box display="flex" justifyContent="flex-end" gap={1}>
                    {!method.is_default && (
                      <Button
                        size="small"
                        onClick={() => handleSetDefault(method.id)}
                        disabled={setDefaultMutation.isPending}
                      >
                        Set Default
                      </Button>
                    )}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(method.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Payment Method Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Payment Method</DialogTitle>
        <DialogContent>
          <Elements stripe={stripePromise}>
            <AddPaymentMethodForm
              onSuccess={handleAddSuccess}
              onCancel={() => setAddDialogOpen(false)}
            />
          </Elements>
        </DialogContent>
      </Dialog>
    </Container>
  )
}

export default PaymentMethods