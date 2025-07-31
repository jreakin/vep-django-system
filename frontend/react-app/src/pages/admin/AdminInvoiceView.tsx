import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Pagination,
  Grid,
  InputAdornment,
  Tooltip
} from '@mui/material'
import {
  Search,
  FilterList,
  Download,
  Visibility,
  Send,
  Refresh,
  ClearAll
} from '@mui/icons-material'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getAdminInvoices, 
  sendInvoiceReminder,
  type AdminInvoice 
} from '../../services/billing'
import BillingExport from '../../components/billing/BillingExport'

interface InvoiceFilters {
  search: string
  status: string
  date_from: string
  date_to: string
  user_id: string
  min_amount: string
  max_amount: string
}

const AdminInvoiceView: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<AdminInvoice | null>(null)
  
  const [filters, setFilters] = useState<InvoiceFilters>({
    search: '',
    status: '',
    date_from: '',
    date_to: '',
    user_id: '',
    min_amount: '',
    max_amount: ''
  })

  // Fetch invoices with filters
  const { data: invoiceData, isLoading, error } = useQuery({
    queryKey: ['admin-invoices', page, pageSize, filters],
    queryFn: () => getAdminInvoices({
      page,
      page_size: pageSize,
      ...filters
    }),
  })

  // Send reminder mutation
  const reminderMutation = useMutation({
    mutationFn: sendInvoiceReminder,
    onSuccess: () => {
      setReminderDialogOpen(false)
      setSelectedInvoice(null)
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] })
    },
  })

  const invoices = invoiceData?.results || []
  const totalPages = Math.ceil((invoiceData?.count || 0) / pageSize)

  // Stats calculations
  const stats = useMemo(() => {
    if (!invoices.length) return null
    
    return {
      total_amount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
      paid_amount: invoices.filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.amount, 0),
      overdue_count: invoices.filter(inv => inv.status === 'overdue').length,
      pending_count: invoices.filter(inv => inv.status === 'pending').length
    }
  }, [invoices])

  const handleFilterChange = (field: keyof InvoiceFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setPage(1) // Reset to first page when filters change
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      date_from: '',
      date_to: '',
      user_id: '',
      min_amount: '',
      max_amount: ''
    })
    setPage(1)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return '✅'
      case 'pending':
        return '⏳'
      case 'overdue':
        return '❗'
      case 'cancelled':
        return '❌'
      default:
        return '📄'
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

  const handleSendReminder = (invoice: AdminInvoice) => {
    setSelectedInvoice(invoice)
    setReminderDialogOpen(true)
  }

  const confirmSendReminder = () => {
    if (selectedInvoice) {
      reminderMutation.mutate(selectedInvoice.id)
    }
  }

  if (isLoading && !invoices.length) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Failed to load invoices. Please try again later.
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          Invoice Management
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => setExportDialogOpen(true)}
          >
            Export Data
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-invoices'] })}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Amount
                </Typography>
                <Typography variant="h5">
                  ${stats.total_amount.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Paid Amount
                </Typography>
                <Typography variant="h5" color="success.main">
                  ${stats.paid_amount.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Overdue Invoices
                </Typography>
                <Typography variant="h5" color="error.main">
                  {stats.overdue_count}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending Invoices
                </Typography>
                <Typography variant="h5" color="warning.main">
                  {stats.pending_count}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" display="flex" alignItems="center">
              <FilterList sx={{ mr: 1 }} />
              Filters
            </Typography>
            <Button
              size="small"
              startIcon={<ClearAll />}
              onClick={clearFilters}
            >
              Clear All
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Invoice number, user email..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={1.5}>
              <TextField
                fullWidth
                label="Min Amount"
                type="number"
                value={filters.min_amount}
                onChange={(e) => handleFilterChange('min_amount', e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            
            <Grid item xs={12} md={1.5}>
              <TextField
                fullWidth
                label="Max Amount"
                type="number"
                value={filters.max_amount}
                onChange={(e) => handleFilterChange('max_amount', e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {invoice.invoice_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {invoice.user.email}
                        </Typography>
                        {invoice.user.organization && (
                          <Typography variant="caption" color="text.secondary">
                            {invoice.user.organization}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        ${invoice.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<span>{getStatusIcon(invoice.status)}</span>}
                        label={invoice.status.toUpperCase()}
                        color={getStatusColor(invoice.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/billing/invoices/${invoice.id}`)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                          <Tooltip title="Send Reminder">
                            <IconButton
                              size="small"
                              onClick={() => handleSendReminder(invoice)}
                              disabled={reminderMutation.isPending}
                            >
                              <Send />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <BillingExport
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
      />

      {/* Send Reminder Dialog */}
      <Dialog
        open={reminderDialogOpen}
        onClose={() => setReminderDialogOpen(false)}
      >
        <DialogTitle>Send Payment Reminder</DialogTitle>
        <DialogContent>
          <Typography>
            Send a payment reminder email for invoice{' '}
            <strong>{selectedInvoice?.invoice_number}</strong> to{' '}
            <strong>{selectedInvoice?.user.email}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReminderDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={confirmSendReminder}
            variant="contained"
            disabled={reminderMutation.isPending}
          >
            {reminderMutation.isPending ? 'Sending...' : 'Send Reminder'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default AdminInvoiceView