import React, { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  Snackbar,
  Fab,
  Badge,
} from '@mui/material';
import { ViewInAr as SpatialIcon } from '@mui/icons-material';
import {
  isVisionOS,
  hasSpatialAPIs,
  requestSpatialSession,
  type SpatialWidgetConfig,
} from '../utils/visionOS';

interface SpatialWidgetManagerProps {
  children: React.ReactNode;
  spatialWidgets: SpatialWidgetConfig[];
}

export const SpatialWidgetManager: React.FC<SpatialWidgetManagerProps> = ({
  children,
  spatialWidgets, // Used for counting available spatial widgets
}) => {
  const [spatialSession, setSpatialSession] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [poppedWidgets, setPoppedWidgets] = useState<Set<string>>(new Set());
  const showVisionOSFeatures = isVisionOS();
  const spatialReady = hasSpatialAPIs();

  // Provide setPoppedWidgets to potential child components via callback
  const handleWidgetPoppedOut = (widgetId: string) => {
    setPoppedWidgets(prev => new Set([...prev, widgetId]));
    console.log(`Widget ${widgetId} added to spatial environment`);
  };

  const childWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { onWidgetPoppedOut: handleWidgetPoppedOut });
    }
    return child;
  });
  useEffect(() => {
    // Auto-request spatial session if on visionOS
    if (showVisionOSFeatures && spatialReady) {
      initializeSpatialSession();
    }
  }, [showVisionOSFeatures, spatialReady]);

  const initializeSpatialSession = async () => {
    try {
      const success = await requestSpatialSession();
      setSpatialSession(success);
      if (success) {
        setNotification('Spatial environment ready! You can now pop out widgets.');
      } else {
        setNotification('Unable to initialize spatial environment.');
      }
    } catch (error) {
      console.error('Failed to initialize spatial session:', error);
      setNotification('Failed to initialize spatial environment.');
    }
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  const poppedCount = poppedWidgets.size;
  const availableWidgets = spatialWidgets.length;

  console.log('SpatialWidgetManager ready with', availableWidgets, 'widgets and', poppedCount, 'popped widgets');

  if (!showVisionOSFeatures) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {children}
      
      {/* Spatial Status Indicator */}
      {spatialReady && (
        <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
          <Badge 
            badgeContent={poppedCount} 
            color="primary"
            invisible={poppedCount === 0}
          >
            <Fab
              size="medium"
              color={spatialSession ? 'primary' : 'default'}
              sx={{ 
                opacity: 0.8,
                '&:hover': { opacity: 1 }
              }}
              onClick={initializeSpatialSession}
              title={spatialSession ? 'Spatial environment active' : 'Initialize spatial environment'}
            >
              <SpatialIcon />
            </Fab>
          </Badge>
        </Box>
      )}

      {/* Spatial Environment Alert */}
      {showVisionOSFeatures && !spatialReady && (
        <Alert 
          severity="info" 
          sx={{ mb: 2 }}
          onClose={() => {/* Keep alert visible */}}
        >
          visionOS detected! Spatial APIs are not available in this environment. 
          Spatial widgets will work when running in Safari on Apple Vision Pro.
        </Alert>
      )}

      {/* Success/Error Notifications */}
      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity="success"
          sx={{ width: '100%' }}
        >
          {notification}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SpatialWidgetManager;