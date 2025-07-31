import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material'
import {
  Receipt,
  CreditCard,
  TrendingUp,
  Warning,
  CheckCircle,
  Schedule,
  Cancel
} from '@mui/icons-material'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { getInvoices, getOverdueInvoices, getUsageMetrics, type Invoice, type UsageMetrics } from '../../services/billing'
import StripePaymentForm from '../../components/billing/StripePaymentForm'
import UsageMetrics from '../../components/billing/UsageMetrics'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`billing-tabpanel-${index}`}
      aria-labelledby={`billing-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const BillingDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)

  // Fetch data using React Query
  const { data: invoices = [], isLoading: invoicesLoading, error: invoicesError } = useQuery({
    queryKey: ['invoices'],
    queryFn: getInvoices,
  })

  const { data: overdueInvoices = [], isLoading: overdueLoading } = useQuery({
    queryKey: ['overdue-invoices'],
    queryFn: getOverdueInvoices,
  })

  const { data: usageMetrics, isLoading: usageLoading } = useQuery({
    queryKey: ['usage-metrics'],
    queryFn: () => getUsageMetrics(),
  })

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

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

  const handlePayInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setPaymentDialogOpen(true)
  }

  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false)
    setSelectedInvoice(null)
    // Refetch invoices
    window.location.reload()
  }

  if (invoicesLoading || overdueLoading || usageLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (invoicesError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Failed to load billing data. Please try again later.
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Billing Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Receipt color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Invoices
                  </Typography>
                  <Typography variant="h5">
                    {invoices.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Warning color="error" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Overdue
                  </Typography>
                  <Typography variant="h5" color="error">
                    {overdueInvoices.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    This Month
                  </Typography>
                  <Typography variant="h5">
                    ${usageMetrics?.billing_amount?.toFixed(2) || '0.00'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CreditCard color="info" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Paid Invoices
                  </Typography>
                  <Typography variant="h5">
                    {invoices.filter(inv => inv.status === 'paid').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Overdue Invoices Alert */}
      {overdueInvoices.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have {overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? 's' : ''}. 
          Please pay them to avoid service interruption.
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="All Invoices" />
            <Tab label="Usage Metrics" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getStatusIcon(invoice.status)}
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {invoice.invoice_number}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ${invoice.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={invoice.status.toUpperCase()} 
                        color={getStatusColor(invoice.status)}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {invoice.status === 'pending' || invoice.status === 'overdue' ? (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => handlePayInvoice(invoice)}
                        >
                          Pay Now
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          href={`/billing/invoices/${invoice.id}`}
                        >
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {usageMetrics && <UsageMetrics metrics={usageMetrics} />}
        </TabPanel>
      </Card>

      {/* Payment Dialog */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Pay Invoice {selectedInvoice?.invoice_number}
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <StripePaymentForm
              invoice={selectedInvoice}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setPaymentDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  )
}

export default BillingDashboard