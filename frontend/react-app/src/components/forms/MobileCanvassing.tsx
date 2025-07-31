import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  Alert,
  CircularProgress,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Divider,
} from '@mui/material';
import {
  LocationOn,
  Navigation,
  CheckCircle,
  Cancel,
  Warning,
  Phone,
  Email,
  Home,
  Person,
  Map,
  Save,
  Send,
  MyLocation,
  GPS_Fixed,
  GPS_Not_Fixed,
} from '@mui/icons-material';

interface Voter {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  party_affiliation?: string;
  location: [number, number];
  contact_history: ContactAttempt[];
}

interface ContactAttempt {
  id: string;
  date: string;
  type: 'door_knock' | 'phone_call' | 'text_message' | 'email';
  status: 'successful' | 'no_answer' | 'refused' | 'wrong_address';
  notes?: string;
  volunteer: string;
}

interface WalkList {
  id: string;
  name: string;
  voters: Voter[];
  require_gps_verification: boolean;
  max_distance_meters: number;
  questionnaire?: FormTemplate;
}

interface FormTemplate {
  id: string;
  name: string;
  fields: FormField[];
}

interface FormField {
  id: string;
  field_name: string;
  field_type: string;
  label: string;
  options: Array<{ label: string; value: string }>;
  is_required: boolean;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface MobileCanvassingProps {
  walkList: WalkList;
  onComplete: (responses: CanvassResponse[]) => void;
  onSave: (responses: CanvassResponse[]) => void;
}

interface CanvassResponse {
  voter_id: string;
  contact_attempted: boolean;
  contact_made: boolean;
  responses: Record<string, any>;
  notes: string;
  submission_location?: LocationData;
  is_location_verified: boolean;
  distance_to_target_meters?: number;
}

const MobileCanvassing: React.FC<MobileCanvassingProps> = ({
  walkList,
  onComplete,
  onSave,
}) => {
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0);
  const [responses, setResponses] = useState<CanvassResponse[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'inactive' | 'searching' | 'active' | 'error'>('inactive');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [contactAttempted, setContactAttempted] = useState(false);
  const [contactMade, setContactMade] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const currentVoter = walkList.voters[currentVoterIndex];
  const totalVoters = walkList.voters.length;
  const progress = ((currentVoterIndex + 1) / totalVoters) * 100;

  // GPS tracking functions
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this device');
      setGpsStatus('error');
      return;
    }

    setGpsStatus('searching');
    setLocationError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // 1 minute
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };
        setCurrentLocation(locationData);
        setGpsStatus('active');
        setLocationError(null);
      },
      (error) => {
        setLocationError(getLocationErrorMessage(error));
        setGpsStatus('error');
      },
      options
    );
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGpsStatus('inactive');
  };

  const getLocationErrorMessage = (error: GeolocationPositionError): string => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location access denied. Please enable location permissions.';
      case error.POSITION_UNAVAILABLE:
        return 'Location information unavailable.';
      case error.TIMEOUT:
        return 'Location request timed out.';
      default:
        return 'An unknown error occurred while retrieving location.';
    }
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const isLocationVerified = (): boolean => {
    if (!walkList.require_gps_verification || !currentLocation || !currentVoter) {
      return !walkList.require_gps_verification; // If GPS not required, consider it verified
    }

    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      currentVoter.location[0],
      currentVoter.location[1]
    );

    return distance <= walkList.max_distance_meters;
  };

  const getDistanceToTarget = (): number | null => {
    if (!currentLocation || !currentVoter) return null;

    return calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      currentVoter.location[0],
      currentVoter.location[1]
    );
  };

  // Session management
  const startSession = () => {
    setSessionStarted(true);
    if (walkList.require_gps_verification) {
      startLocationTracking();
    }
  };

  const endSession = () => {
    stopLocationTracking();
    setSessionStarted(false);
    onComplete(responses);
  };

  // Form handling
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const saveCurrentResponse = () => {
    const response: CanvassResponse = {
      voter_id: currentVoter.id,
      contact_attempted: contactAttempted,
      contact_made: contactMade,
      responses: formData,
      notes,
      submission_location: currentLocation || undefined,
      is_location_verified: isLocationVerified(),
      distance_to_target_meters: getDistanceToTarget() || undefined,
    };

    setResponses(prev => {
      const newResponses = [...prev];
      newResponses[currentVoterIndex] = response;
      return newResponses;
    });

    // Reset form for next voter
    setFormData({});
    setContactAttempted(false);
    setContactMade(false);
    setNotes('');
  };

  const nextVoter = () => {
    saveCurrentResponse();
    if (currentVoterIndex < totalVoters - 1) {
      setCurrentVoterIndex(prev => prev + 1);
    } else {
      endSession();
    }
  };

  const previousVoter = () => {
    if (currentVoterIndex > 0) {
      saveCurrentResponse();
      setCurrentVoterIndex(prev => prev - 1);
      
      // Load previous response if exists
      const prevResponse = responses[currentVoterIndex - 1];
      if (prevResponse) {
        setFormData(prevResponse.responses);
        setContactAttempted(prevResponse.contact_attempted);
        setContactMade(prevResponse.contact_made);
        setNotes(prevResponse.notes);
      }
    }
  };

  const skipVoter = () => {
    saveCurrentResponse();
    nextVoter();
  };

  // Auto-save functionality
  useEffect(() => {
    if (responses.length > 0) {
      onSave(responses);
    }
  }, [responses, onSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, []);

  const renderLocationStatus = () => {
    const distance = getDistanceToTarget();
    const verified = isLocationVerified();

    return (
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            {gpsStatus === 'searching' && <CircularProgress size={20} />}
            {gpsStatus === 'active' && <GPS_Fixed color="success" />}
            {gpsStatus === 'error' && <GPS_Not_Fixed color="error" />}
            {gpsStatus === 'inactive' && <MyLocation color="disabled" />}
            
            <Typography variant="body2">
              GPS Status: {gpsStatus.charAt(0).toUpperCase() + gpsStatus.slice(1)}
            </Typography>
          </Stack>

          {walkList.require_gps_verification && (
            <Chip
              icon={verified ? <CheckCircle /> : <Warning />}
              label={verified ? 'Location Verified' : 'Not Verified'}
              color={verified ? 'success' : 'warning'}
              size="small"
            />
          )}
        </Stack>

        {locationError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {locationError}
          </Alert>
        )}

        {distance !== null && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Distance to target: {distance.toFixed(0)}m
            {walkList.require_gps_verification && (
              <span> (Max: {walkList.max_distance_meters}m)</span>
            )}
          </Typography>
        )}
      </Paper>
    );
  };

  const renderVoterInfo = () => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <Person />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">{currentVoter.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              <Home sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
              {currentVoter.address}
            </Typography>
            {currentVoter.party_affiliation && (
              <Chip
                label={currentVoter.party_affiliation}
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </Box>
          <Stack spacing={1}>
            {currentVoter.phone && (
              <IconButton
                size="small"
                href={`tel:${currentVoter.phone}`}
                color="primary"
              >
                <Phone />
              </IconButton>
            )}
            {currentVoter.email && (
              <IconButton
                size="small"
                href={`mailto:${currentVoter.email}`}
                color="primary"
              >
                <Email />
              </IconButton>
            )}
          </Stack>
        </Stack>

        {currentVoter.contact_history.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Previous Contacts:
            </Typography>
            <List dense>
              {currentVoter.contact_history.slice(-3).map((contact) => (
                <ListItem key={contact.id}>
                  <ListItemText
                    primary={`${contact.type.replace('_', ' ')} - ${contact.status}`}
                    secondary={new Date(contact.date).toLocaleDateString()}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderContactForm = () => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Contact Information
        </Typography>

        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={contactAttempted}
                onChange={(e) => setContactAttempted(e.target.checked)}
              />
            }
            label="Contact Attempted"
          />
        </FormControl>

        {contactAttempted && (
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={contactMade}
                  onChange={(e) => setContactMade(e.target.checked)}
                />
              }
              label="Contact Made"
            />
          </FormControl>
        )}

        <TextField
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          rows={3}
          fullWidth
          placeholder="Add any notes about this contact..."
        />
      </CardContent>
    </Card>
  );

  const renderQuestionnaire = () => {
    if (!walkList.questionnaire || !contactMade) return null;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {walkList.questionnaire.name}
          </Typography>

          {walkList.questionnaire.fields.map((field) => {
            const value = formData[field.field_name] || '';

            switch (field.field_type) {
              case 'text':
              case 'textarea':
                return (
                  <TextField
                    key={field.id}
                    label={field.label}
                    value={value}
                    onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                    fullWidth
                    multiline={field.field_type === 'textarea'}
                    rows={field.field_type === 'textarea' ? 3 : 1}
                    required={field.is_required}
                    sx={{ mb: 2 }}
                  />
                );

              case 'select':
                return (
                  <FormControl key={field.id} fullWidth sx={{ mb: 2 }}>
                    <TextField
                      select
                      label={field.label}
                      value={value}
                      onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                      required={field.is_required}
                      SelectProps={{ native: true }}
                    >
                      <option value="">Select an option</option>
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </TextField>
                  </FormControl>
                );

              case 'radio':
                return (
                  <FormControl key={field.id} component="fieldset" sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {field.label} {field.is_required && '*'}
                    </Typography>
                    <RadioGroup
                      value={value}
                      onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                    >
                      {field.options.map((option) => (
                        <FormControlLabel
                          key={option.value}
                          value={option.value}
                          control={<Radio />}
                          label={option.label}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                );

              default:
                return null;
            }
          })}
        </CardContent>
      </Card>
    );
  };

  const canProceedToNext = (): boolean => {
    if (walkList.require_gps_verification && !isLocationVerified()) {
      return false;
    }
    return contactAttempted;
  };

  if (!sessionStarted) {
    return (
      <Box sx={{ p: 2 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              {walkList.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {totalVoters} voters to contact
            </Typography>
            
            {walkList.require_gps_verification && (
              <Alert severity="info" sx={{ mb: 2 }}>
                This walk list requires GPS verification. You must be within{' '}
                {walkList.max_distance_meters}m of each voter's address.
              </Alert>
            )}

            <Button
              variant="contained"
              size="large"
              onClick={startSession}
              startIcon={<Navigation />}
            >
              Start Canvassing
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 10 }}> {/* Bottom padding for FAB */}
      {/* Progress indicator */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6">
            Voter {currentVoterIndex + 1} of {totalVoters}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {Math.round(progress)}% Complete
          </Typography>
        </Stack>
        <LinearProgress variant="determinate" value={progress} />
      </Box>

      {renderLocationStatus()}
      {renderVoterInfo()}
      {renderContactForm()}
      {renderQuestionnaire()}

      {/* Navigation buttons */}
      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          onClick={previousVoter}
          disabled={currentVoterIndex === 0}
        >
          Previous
        </Button>
        
        <Button
          variant="outlined"
          onClick={skipVoter}
        >
          Skip
        </Button>
        
        <Button
          variant="contained"
          onClick={nextVoter}
          disabled={!canProceedToNext()}
          sx={{ flexGrow: 1 }}
        >
          {currentVoterIndex === totalVoters - 1 ? 'Finish' : 'Next'}
        </Button>
      </Stack>

      {/* Location verification warning */}
      {walkList.require_gps_verification && !isLocationVerified() && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          You must be within {walkList.max_distance_meters}m of the voter's address to proceed.
          Current distance: {getDistanceToTarget()?.toFixed(0)}m
        </Alert>
      )}

      {/* Floating action button for map */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setShowLocationDialog(true)}
      >
        <Map />
      </Fab>

      {/* Location/Map Dialog */}
      <Dialog
        open={showLocationDialog}
        onClose={() => setShowLocationDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Location & Map</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body2">
              Target Address: {currentVoter.address}
            </Typography>
            
            {currentLocation && (
              <Typography variant="body2">
                Your Location: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                <br />
                Accuracy: ±{currentLocation.accuracy.toFixed(0)}m
              </Typography>
            )}
            
            {getDistanceToTarget() && (
              <Typography variant="body2">
                Distance to Target: {getDistanceToTarget()?.toFixed(0)}m
              </Typography>
            )}
            
            {/* Map component would go here */}
            <Box
              sx={{
                height: 300,
                bgcolor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Interactive map would be displayed here
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLocationDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MobileCanvassing;