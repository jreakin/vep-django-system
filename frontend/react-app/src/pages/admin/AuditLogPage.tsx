import React from 'react'
import { Box, Typography, Paper } from '@mui/material'
import AuditLogViewer from '../../components/admin/AuditLogViewer'

const AuditLogPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        System Audit Logs
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Monitor all system activities, user actions, and data changes across the platform.
      </Typography>
      
      <Paper elevation={1} sx={{ p: 2 }}>
        <AuditLogViewer />
      </Paper>
    </Box>
  )
}

export default AuditLogPage