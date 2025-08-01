import React, { useState } from 'react'
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox
} from '@mui/material'
import { Download } from '@mui/icons-material'
import { format } from 'date-fns'
import { exportBillingData } from '../../services/billing'

interface BillingExportProps {
  open: boolean
  onClose: () => void
}

type ExportFormat = 'csv' | 'pdf' | 'excel'
type ExportType = 'invoices' | 'payments' | 'usage_reports' | 'billing_summary'

interface ExportOptions {
  format: ExportFormat
  type: ExportType
  start_date: string
  end_date: string
  include_line_items: boolean
  include_payment_details: boolean
  filter_status?: string
}

const BillingExport: React.FC<BillingExportProps> = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    type: 'invoices',
    start_date: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    include_line_items: true,
    include_payment_details: true
  })

  const handleExport = async () => {
    setLoading(true)
    setError(null)

    try {
      const blob = await exportBillingData(options)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `billing_${options.type}_${options.start_date}_${options.end_date}.${options.format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof ExportOptions, value: any) => {
    setOptions(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Billing Data</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Export Type</InputLabel>
            <Select
              value={options.type}
              onChange={(e) => handleChange('type', e.target.value)}
              label="Export Type"
            >
              <MenuItem value="invoices">Invoices</MenuItem>
              <MenuItem value="payments">Payments</MenuItem>
              <MenuItem value="usage_reports">Usage Reports</MenuItem>
              <MenuItem value="billing_summary">Billing Summary</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Format</InputLabel>
            <Select
              value={options.format}
              onChange={(e) => handleChange('format', e.target.value as ExportFormat)}
              label="Format"
            >
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="excel">Excel</MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              label="Start Date"
              type="date"
              value={options.start_date}
              onChange={(e) => handleChange('start_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="End Date"
              type="date"
              value={options.end_date}
              onChange={(e) => handleChange('end_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>

          {options.type === 'invoices' && (
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Status Filter (Optional)</InputLabel>
              <Select
                value={options.filter_status || ''}
                onChange={(e) => handleChange('filter_status', e.target.value)}
                label="Status Filter (Optional)"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          )}

          <Typography variant="subtitle2" gutterBottom>
            Additional Options
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={options.include_line_items}
                onChange={(e) => handleChange('include_line_items', e.target.checked)}
              />
            }
            label="Include Line Items"
            sx={{ display: 'block', mb: 1 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={options.include_payment_details}
                onChange={(e) => handleChange('include_payment_details', e.target.checked)}
              />
            }
            label="Include Payment Details"
            sx={{ display: 'block', mb: 2 }}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Download />}
        >
          {loading ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BillingExport