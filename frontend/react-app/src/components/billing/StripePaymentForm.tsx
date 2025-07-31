import React, { useState } from 'react'
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { createPayment, type Invoice } from '../../services/billing'

// Initialize Stripe (you would get this key from environment variables)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_fake_key')

interface StripePaymentFormProps {
  invoice: Invoice
  onSuccess: () => void
  onCancel: () => void
}

const PaymentForm: React.FC<StripePaymentFormProps> = ({ invoice, onSuccess, onCancel }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentSucceeded, setPaymentSucceeded] = useState(false)

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
      // Create payment method
      const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (methodError) {
        setError(methodError.message || 'Failed to create payment method')
        setLoading(false)
        return
      }

      // Create payment through our API
      const paymentResult = await createPayment({
        invoice_id: invoice.id,
        payment_method_id: paymentMethod.id,
        amount: invoice.amount
      })

      if (paymentResult.requires_action) {
        // Handle 3D Secure authentication
        const { error: confirmError } = await stripe.confirmCardPayment(
          paymentResult.client_secret
        )

        if (confirmError) {
          setError(confirmError.message || 'Payment confirmation failed')
          setLoading(false)
          return
        }
      }

      setPaymentSucceeded(true)
      setTimeout(() => {
        onSuccess()
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
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

  if (paymentSucceeded) {
    return (
      <Box textAlign="center" py={4}>
        <Alert severity="success" sx={{ mb: 2 }}>
          Payment successful! Invoice has been paid.
        </Alert>
        <Typography variant="body1">
          You will be redirected shortly...
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Invoice Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Invoice #: {invoice.invoice_number}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Due Date: {new Date(invoice.due_date).toLocaleDateString()}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" color="primary">
            Amount to Pay: ${invoice.amount.toFixed(2)}
          </Typography>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Payment Information
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
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!stripe || loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Processing...' : `Pay $${invoice.amount.toFixed(2)}`}
          </Button>
        </Box>
      </form>
    </Box>
  )
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  )
}

export default StripePaymentForm