import React from 'react'
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
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material'

interface Voter {
  id: number
  first_name: string
  last_name: string
  phone_number: string
  state: string
  county: string
  registration_status: 'active' | 'inactive' | 'pending'
  last_contact: string | null
}

const VoterData: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('')

  // Mock data - in real app this would come from API
  const voters: Voter[] = [
    {
      id: 1,
      first_name: 'John',
      last_name: 'Smith',
      phone_number: '+1234567890',
      state: 'CA',
      county: 'Los Angeles',
      registration_status: 'active',
      last_contact: '2024-01-15',
    },
    {
      id: 2,
      first_name: 'Jane',
      last_name: 'Doe',
      phone_number: '+1987654321',
      state: 'CA',
      county: 'Orange',
      registration_status: 'active',
      last_contact: null,
    },
    {
      id: 3,
      first_name: 'Bob',
      last_name: 'Johnson',
      phone_number: '+1555123456',
      state: 'TX',
      county: 'Harris',
      registration_status: 'pending',
      last_contact: '2024-01-10',
    },
  ]

  const getStatusColor = (status: Voter['registration_status']) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'error'
      case 'pending':
        return 'warning'
      default:
        return 'default'
    }
  }

  const filteredVoters = voters.filter(
    (voter) =>
      voter.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.phone_number.includes(searchTerm)
  )

  const stats = [
    { label: 'Total Voters', value: '156,789', color: '#1976d2' },
    { label: 'Active Registrations', value: '142,456', color: '#2e7d32' },
    { label: 'Pending Reviews', value: '8,234', color: '#ed6c02' },
    { label: 'Data Quality Score', value: '94.2%', color: '#9c27b0' },
  ]

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Voter Data Management
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage voter databases, upload new data, and analyze voter engagement patterns.
      </Typography>

      {/* Statistics */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
          gap: 2,
          mb: 4,
        }}
      >
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: stat.color, fontWeight: 'bold' }}>
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stat.label}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Action Buttons */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
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
          View Analytics
        </Button>
      </Stack>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search voters by name or phone number..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      {/* Voter Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Contact</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVoters.map((voter) => (
              <TableRow key={voter.id}>
                <TableCell>
                  {voter.first_name} {voter.last_name}
                </TableCell>
                <TableCell>{voter.phone_number}</TableCell>
                <TableCell>
                  {voter.county}, {voter.state}
                </TableCell>
                <TableCell>
                  <Chip
                    label={voter.registration_status.toUpperCase()}
                    color={getStatusColor(voter.registration_status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {voter.last_contact
                    ? new Date(voter.last_contact).toLocaleDateString()
                    : 'Never'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default VoterData