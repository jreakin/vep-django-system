import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  Code,
  Visibility,
  Settings,
  Phone,
} from '@mui/icons-material';
import {
  FundsRaisedWidget,
  VoterContactsWidget,
  TotalVotersWidget,
  ChartsCreatedWidget,
} from '../components/spatial/SpatialWidgets';
import '../components/spatial/SpatialWidgets.css';

const SpatialDemo: React.FC = () => {
  const [simulateVisionOS, setSimulateVisionOS] = useState(false);
  const [mockLevelOfDetail, setMockLevelOfDetail] = useState<'near' | 'mid' | 'far'>('mid');

  // Mock data for demo
  const mockStats = {
    fundsRaised: 125000,
    fundsTarget: 200000,
    voterContacts: 15420,
    voterContactsThisWeek: 1240,
    totalVoters: 45000,
    registeredVoters: 43500,
    likelyVoters: 32000,
    chartsCount: 12,
    chartsThisMonth: 8,
  };

  const handleRefresh = async () => {
    console.log('Refreshing data...');
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  // Override visionOS detection for demo
  React.useEffect(() => {
    if (simulateVisionOS) {
      // @ts-ignore
      window.isVisionOSDemo = true;
      
      // Mock visionOS APIs
      // @ts-ignore
      window.navigator.requestSpatialTracking = () => Promise.resolve('granted');
      // @ts-ignore
      window.spatial = {
        createWindow: (options: any) => {
          console.log('Creating spatial window:', options);
          return Promise.resolve({ id: Math.random().toString() });
        }
      };
    } else {
      // @ts-ignore
      delete window.isVisionOSDemo;
    }
  }, [simulateVisionOS]);

  // Simulate level of detail changes
  const simulateLevelChange = (level: 'near' | 'mid' | 'far') => {
    setMockLevelOfDetail(level);
    
    // Apply CSS classes to all widgets
    const widgets = document.querySelectorAll('.spatial-metric-widget');
    widgets.forEach(widget => {
      widget.classList.remove('lod-near', 'lod-mid', 'lod-far');
      widget.classList.add(`lod-${level}`);
      
      // Dispatch event
      const event = new CustomEvent('levelOfDetailChanged', {
        detail: { level, distance: level === 'near' ? 1 : level === 'mid' ? 3 : 10 }
      });
      widget.dispatchEvent(event);
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Code />
          Spatial Widgets Demo
          <Chip label="Development Mode" size="small" color="primary" />
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Interactive demonstration of visionOS spatial dashboard widgets with level of detail simulation.
        </Typography>
      </Box>

      {/* Controls */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings />
          Demo Controls
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={simulateVisionOS}
                onChange={(e) => setSimulateVisionOS(e.target.checked)}
              />
            }
            label="Simulate visionOS Environment"
          />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Level of Detail Simulation:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {(['far', 'mid', 'near'] as const).map((level) => (
                <Button
                  key={level}
                  variant={mockLevelOfDetail === level ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => simulateLevelChange(level)}
                  sx={{ textTransform: 'capitalize' }}
                >
                  {level} ({level === 'far' ? '10m+' : level === 'mid' ? '3-10m' : '<3m'})
                </Button>
              ))}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Status */}
      <Alert 
        severity={simulateVisionOS ? 'success' : 'info'} 
        sx={{ mb: 4 }}
        icon={simulateVisionOS ? <Visibility /> : <Phone />}
      >
        <Typography variant="body2">
          <strong>Current Mode:</strong> {simulateVisionOS ? 'visionOS Simulation' : 'Standard Web Browser'}
          {simulateVisionOS && (
            <>
              <br />
              <strong>Level of Detail:</strong> {mockLevelOfDetail} 
              ({mockLevelOfDetail === 'far' ? 'Minimal view (far away)' : 
                mockLevelOfDetail === 'mid' ? 'Standard view (medium distance)' : 
                'Detailed view (close up)'})
            </>
          )}
        </Typography>
      </Alert>

      {/* Feature Explanation */}
      <Paper elevation={1} sx={{ p: 3, mb: 4, backgroundColor: 'rgba(25, 118, 210, 0.05)' }}>
        <Typography variant="h6" gutterBottom>
          How Spatial Widgets Work
        </Typography>
        <Typography variant="body2" paragraph>
          On visionOS, these widgets can be "pulled out" of the browser window and placed in your physical environment. 
          They automatically adjust their content based on your distance:
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • <strong>Far (10m+):</strong> Shows only the key metric number for quick glancing
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • <strong>Medium (3-10m):</strong> Shows icon, title, and value for standard viewing
          </Typography>
          <Typography variant="body2">
            • <strong>Near (&lt;3m):</strong> Shows full details with additional data and controls
          </Typography>
        </Box>
      </Paper>

      {/* Spatial Widgets Grid */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Campaign Dashboard Widgets
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} lg={3}>
          <FundsRaisedWidget
            value={mockStats.fundsRaised}
            target={mockStats.fundsTarget}
            onRefresh={handleRefresh}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <VoterContactsWidget
            value={mockStats.voterContacts}
            thisWeek={mockStats.voterContactsThisWeek}
            onRefresh={handleRefresh}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <TotalVotersWidget
            value={mockStats.totalVoters}
            registered={mockStats.registeredVoters}
            likely={mockStats.likelyVoters}
            onRefresh={handleRefresh}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <ChartsCreatedWidget
            value={mockStats.chartsCount}
            thisMonth={mockStats.chartsThisMonth}
            onRefresh={handleRefresh}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Technical Details */}
      <Paper elevation={1} sx={{ p: 3, backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
        <Typography variant="h6" gutterBottom>
          Technical Implementation
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This demo showcases the spatial widget system built for visionOS Safari. In a real visionOS environment, 
          the widgets would use the native spatial web APIs to be placed in 3D space and automatically adjust their 
          detail level based on the user's physical distance from the widget.
        </Typography>
      </Paper>
    </Box>
  );
};

export default SpatialDemo;