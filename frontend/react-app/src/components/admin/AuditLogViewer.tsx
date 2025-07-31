import React, { useState, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Pagination,
  Grid,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material'
import {
  Search,
  FilterList,
  Download,
  Visibility,
  ExpandMore,
  Refresh,
  Security,
  Person,
  Edit,
  Delete,
  Add,
  Login,
  Logout,
  Settings,
  Warning,
  Info
} from '@mui/icons-material'
import { format, parseISO } from 'date-fns'

interface AuditLogEntry {
  id: string
  timestamp: string
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
  action: string
  resource_type: string
  resource_id: string | null
  ip_address: string
  user_agent: string
  changes: Record<string, any>
  metadata: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
  session_id: string
}

interface AuditLogFilters {
  search: string
  user_id: string
  action: string
  resource_type: string
  severity: string
  date_from: string
  date_to: string
  ip_address: string
}

interface AuditLogViewerProps {
  logs: AuditLogEntry[]
  totalCount: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onFiltersChange: (filters: AuditLogFilters) => void
  onExport: (format: 'csv' | 'json') => void
  isLoading?: boolean
}

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  logs,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onFiltersChange,
  onExport,
  isLoading = false
}) => {
  const [filters, setFilters] = useState<AuditLogFilters>({
    search: '',
    user_id: '',
    action: '',
    resource_type: '',
    severity: '',
    date_from: '',
    date_to: '',
    ip_address: ''
  })

  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  const totalPages = Math.ceil(totalCount / pageSize)

  const handleFilterChange = (field: keyof AuditLogFilters, value: string) => {
    const newFilters = { ...filters, [field]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters: AuditLogFilters = {
      search: '',
      user_id: '',
      action: '',
      resource_type: '',
      severity: '',
      date_from: '',
      date_to: '',
      ip_address: ''
    }
    setFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'add':
        return <Add color="success" fontSize="small" />
      case 'update':
      case 'edit':
      case 'modify':
        return <Edit color="primary" fontSize="small" />
      case 'delete':
      case 'remove':
        return <Delete color="error" fontSize="small" />
      case 'login':
        return <Login color="info" fontSize="small" />
      case 'logout':
        return <Logout color="info" fontSize="small" />
      case 'view':
      case 'access':
        return <Visibility color="default" fontSize="small" />
      case 'permission':
      case 'role':
        return <Security color="warning" fontSize="small" />
      default:
        return <Settings color="default" fontSize="small" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error'
      case 'high':
        return 'warning'
      case 'medium':
        return 'info'
      case 'low':
        return 'default'
      default:
        return 'default'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <Warning />
      default:
        return <Info />
    }
  }

  const formatChanges = (changes: Record<string, any>) => {
    if (!changes || Object.keys(changes).length === 0) {
      return 'No changes recorded'
    }

    return Object.entries(changes).map(([field, change]) => {
      if (typeof change === 'object' && change.old !== undefined && change.new !== undefined) {
        return `${field}: ${JSON.stringify(change.old)} → ${JSON.stringify(change.new)}`
      }
      return `${field}: ${JSON.stringify(change)}`
    }).join(', ')
  }

  const handleViewDetails = (log: AuditLogEntry) => {
    setSelectedLog(log)
    setDetailDialogOpen(true)
  }

  const uniqueUsers = useMemo(() => {
    const users = logs.map(log => log.user)
    const uniqueUserMap = new Map()
    users.forEach(user => {
      if (!uniqueUserMap.has(user.id)) {
        uniqueUserMap.set(user.id, user)
      }
    })
    return Array.from(uniqueUserMap.values())
  }, [logs])

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(logs.map(log => log.action)))
  }, [logs])

  const uniqueResourceTypes = useMemo(() => {
    return Array.from(new Set(logs.map(log => log.resource_type)))
  }, [logs])

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Audit Log Viewer
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => setExportDialogOpen(true)}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
            Filters
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="User, action, resource..."
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
                <InputLabel>User</InputLabel>
                <Select
                  value={filters.user_id}
                  onChange={(e) => handleFilterChange('user_id', e.target.value)}
                  label="User"
                >
                  <MenuItem value="">All Users</MenuItem>
                  {uniqueUsers.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Action</InputLabel>
                <Select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  label="Action"
                >
                  <MenuItem value="">All Actions</MenuItem>
                  {uniqueActions.map((action) => (
                    <MenuItem key={action} value={action}>
                      {action}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Resource Type</InputLabel>
                <Select
                  value={filters.resource_type}
                  onChange={(e) => handleFilterChange('resource_type', e.target.value)}
                  label="Resource Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  {uniqueResourceTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={1.5}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={filters.severity}
                  onChange={(e) => handleFilterChange('severity', e.target.value)}
                  label="Severity"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={1.5}>
              <Button
                variant="outlined"
                onClick={clearFilters}
                sx={{ height: '56px' }}
              >
                Clear All
              </Button>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box display="flex" gap={2}>
                <TextField
                  label="From Date"
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="To Date"
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Changes</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No audit logs found matching the current filters
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Typography variant="body2">
                          {format(parseISO(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {log.user.first_name} {log.user.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.user.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {getActionIcon(log.action)}
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {log.action}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.resource_type}
                        </Typography>
                        {log.resource_id && (
                          <Typography variant="caption" color="text.secondary">
                            ID: {log.resource_id}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getSeverityIcon(log.severity)}
                          label={log.severity.toUpperCase()}
                          color={getSeverityColor(log.severity) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                          {formatChanges(log.changes).substring(0, 100)}
                          {formatChanges(log.changes).length > 100 && '...'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(log)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3} mb={2}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => onPageChange(page)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Audit Log Details
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Timestamp"
                        secondary={format(parseISO(selectedLog.timestamp), 'PPpp')}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="User"
                        secondary={`${selectedLog.user.first_name} ${selectedLog.user.last_name} (${selectedLog.user.email})`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Action"
                        secondary={selectedLog.action}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Resource"
                        secondary={`${selectedLog.resource_type}${selectedLog.resource_id ? ` (ID: ${selectedLog.resource_id})` : ''}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Severity"
                        secondary={
                          <Chip
                            label={selectedLog.severity.toUpperCase()}
                            color={getSeverityColor(selectedLog.severity) as any}
                            size="small"
                          />
                        }
                      />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Technical Details
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="IP Address"
                        secondary={selectedLog.ip_address}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Session ID"
                        secondary={selectedLog.session_id}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="User Agent"
                        secondary={
                          <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
                            {selectedLog.user_agent}
                          </Typography>
                        }
                      />
                    </ListItem>
                  </List>
                </Grid>

                {Object.keys(selectedLog.changes).length > 0 && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Changes Made
                    </Typography>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography>View Changes</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                          {JSON.stringify(selectedLog.changes, null, 2)}
                        </pre>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                )}

                {Object.keys(selectedLog.metadata).length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Additional Metadata
                    </Typography>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography>View Metadata</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                          {JSON.stringify(selectedLog.metadata, null, 2)}
                        </pre>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Audit Logs</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Export audit logs with current filters applied
          </Typography>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            Exported data will include all visible columns and detailed information for compliance purposes.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => { onExport('csv'); setExportDialogOpen(false) }}>
            Export CSV
          </Button>
          <Button onClick={() => { onExport('json'); setExportDialogOpen(false) }} variant="contained">
            Export JSON
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AuditLogViewer