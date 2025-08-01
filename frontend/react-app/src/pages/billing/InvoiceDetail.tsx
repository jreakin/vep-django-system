import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material'
import {
  ArrowBack,
  Receipt,
  Download,
  CreditCard,
  CheckCircle,
  Warning,
  Schedule,
  Cancel
} from '@mui/icons-material'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { getInvoice, type Invoice } from '../../services/billing'
import StripePaymentForm from '../../components/billing/StripePaymentForm'

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id!),
    enabled: !!id,
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle color="success" />
      case 'pending':
        return <Schedule color="warning" />
      case 'overdue':
        return <Warning color="error" />
      case 'cancelled':
        return <Cancel color="disabled" />
      default:
        return <Receipt />
    }
  }

  const getStatusColor = (status: string): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case 'paid':
        return 'success'
      case 'pending':
        return 'warning'
      case 'overdue':
        return 'error'
      case 'cancelled':
        return 'default'
      default:
        return 'default'
    }
  }

  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false)
    window.location.reload()
  }

  const calculateSubtotal = (invoice: Invoice) => {
    return invoice.line_items.reduce((sum, item) => sum + item.total, 0)
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/billing/invoices/${invoice.id}/pdf/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
      
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice_${invoice.invoice_number}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download invoice:', error)
      // Fallback to print
      window.print()
    }
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error || !invoice) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Failed to load invoice. Please try again later.
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Box display="flex" alignItems="center">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/billing')}
            sx={{ mr: 2 }}
          >
            Back to Billing
          </Button>
          <Typography variant="h4">
            Invoice {invoice.invoice_number}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleDownload}
          >
            Download PDF
          </Button>
          {(invoice.status === 'pending' || invoice.status === 'overdue') && (
            <Button
              variant="contained"
              startIcon={<CreditCard />}
              onClick={() => setPaymentDialogOpen(true)}
              color={invoice.status === 'overdue' ? 'error' : 'primary'}
            >
              Pay Now
            </Button>
          )}
        </Box>
      </Box>

      {/* Status Alert */}
      {invoice.status === 'overdue' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          This invoice is overdue. Please pay immediately to avoid service interruption.
        </Alert>
      )}

      {invoice.status === 'paid' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          This invoice has been paid in full.
        </Alert>
      )}

      {/* Invoice Card */}
      <Card>
        <CardContent>
          {/* Invoice Header */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" mb={2}>
                {getStatusIcon(invoice.status)}
                <Chip 
                  label={invoice.status.toUpperCase()} 
                  color={getStatusColor(invoice.status)}
                  sx={{ ml: 1 }}
                />
              </Box>
              <Typography variant="h5" gutterBottom>
                Invoice #{invoice.invoice_number}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created: {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Due Date: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box textAlign={{ xs: 'left', md: 'right' }}>
                <Typography variant="h6" gutterBottom>
                  Bill To:
                </Typography>
                <Typography variant="body1">
                  {invoice.user.email}
                </Typography>
                {invoice.user.organization && (
                  <Typography variant="body2" color="text.secondary">
                    {invoice.user.organization}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Line Items */}
          <Typography variant="h6" gutterBottom>
            Invoice Details
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.line_items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">${item.unit_price.toFixed(2)}</TableCell>
                    <TableCell align="right">${item.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Totals */}
          <Box mt={3}>
            <Grid container>
              <Grid item xs={12} md={6} />
              <Grid item xs={12} md={6}>
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body1">Subtotal:</Typography>
                    <Typography variant="body1">
                      ${calculateSubtotal(invoice).toFixed(2)}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box display="flex" justifyContent="space-between" mt={2}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" color="primary">
                      ${invoice.amount.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Pay Invoice {invoice.invoice_number}
        </DialogTitle>
        <DialogContent>
          <StripePaymentForm
            invoice={invoice}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setPaymentDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Container>
  )
}

export default InvoiceDetail