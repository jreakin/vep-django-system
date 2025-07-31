import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
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
  Chip,
  TextField,
  InputAdornment,
  Stack,
  CircularProgress,
  Alert,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import voterDataService, { type VoterRecord } from '../../services/voterData'
import FileUpload from '../../components/FileUpload'

const VoterData: React.FC = () => {
  const [voters, setVoters] = useState<VoterRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [partyFilter, setPartyFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [totalCount, setTotalCount] = useState(0)
  const [showUpload, setShowUpload] = useState(false)

  const fetchVoters = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        search: searchTerm || undefined,
        state: stateFilter || undefined,
        party_affiliation: partyFilter || undefined,
        registration_status: statusFilter || undefined,
        page: page + 1,  // API is 1-indexed
        page_size: rowsPerPage,
      }
      
      const result = await voterDataService.getVoters(params)
      setVoters(result.results)
      setTotalCount(result.count)
    } catch (err: any) {
      console.error('Failed to fetch voters:', err)
      setError(err.response?.data?.error || 'Failed to load voter data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVoters()
  }, [searchTerm, stateFilter, partyFilter, statusFilter, page, rowsPerPage])

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleRefresh = () => {
    fetchVoters()
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'default'
      case 'pending':
        return 'warning'
      default:
        return 'default'
    }
  }

  if (loading && voters.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading voter data...
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Voter Data Management
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage voter databases, upload new data, and analyze voter engagement patterns.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Action Buttons */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setShowUpload(!showUpload)}
          sx={{ borderRadius: 2 }}
        >
          Upload CSV Data
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          sx={{ borderRadius: 2 }}
        >
          Export Data
        </Button>
        <Button
          variant="outlined"
          startIcon={<AnalyticsIcon />}
          sx={{ borderRadius: 2 }}
        >
          Analytics
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
          sx={{ borderRadius: 2 }}
        >
          Refresh
        </Button>
      </Stack>

      {/* File Upload Component */}
      {showUpload && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upload Voter Data
            </Typography>
            <FileUpload 
              onUploadComplete={() => {
                setShowUpload(false)
                handleRefresh()
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              placeholder="Search voters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>State</InputLabel>
              <Select
                value={stateFilter}
                label="State"
                onChange={(e) => setStateFilter(e.target.value)}
              >
                <MenuItem value="">All States</MenuItem>
                <MenuItem value="CA">California</MenuItem>
                <MenuItem value="TX">Texas</MenuItem>
                <MenuItem value="FL">Florida</MenuItem>
                <MenuItem value="NY">New York</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Party</InputLabel>
              <Select
                value={partyFilter}
                label="Party"
                onChange={(e) => setPartyFilter(e.target.value)}
              >
                <MenuItem value="">All Parties</MenuItem>
                <MenuItem value="Democratic">Democratic</MenuItem>
                <MenuItem value="Republican">Republican</MenuItem>
                <MenuItem value="Independent">Independent</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* Voter Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>State</TableCell>
                <TableCell>Party</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Registration Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Loading...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : voters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No voter records found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                voters.map((voter) => (
                  <TableRow key={voter.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {voter.name || `${voter.first_name} ${voter.last_name}`.trim()}
                      </Typography>
                    </TableCell>
                    <TableCell>{voter.phone}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {voter.address ? `${voter.address}, ${voter.city}` : 'Not provided'}
                      </Typography>
                    </TableCell>
                    <TableCell>{voter.state}</TableCell>
                    <TableCell>{voter.party_affiliation}</TableCell>
                    <TableCell>
                      <Chip
                        label={voter.voter_registration_status || 'Unknown'}
                        color={getStatusColor(voter.voter_registration_status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {voter.voter_registration_date 
                        ? new Date(voter.voter_registration_date).toLocaleDateString()
                        : 'Not available'
                      }
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>
    </Box>
  )
}

export default VoterData