import React, { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  Paper,
  Stack,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Map as MapIcon,
  Navigation,
  MyLocation,
} from '@mui/icons-material';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Territory {
  id: string;
  name: string;
  territory_type: string;
  boundary: any; // GeoJSON geometry
  center_point: [number, number];
  status: string;
  assigned_to?: string;
  voter_count?: number;
  area_sq_meters?: number;
}

interface VoterLocation {
  id: string;
  name: string;
  address: string;
  location: [number, number];
  party_affiliation?: string;
  contact_history?: number;
}

interface TerritoryMapProps {
  territories: Territory[];
  voters: VoterLocation[];
  selectedTerritory?: string;
  onTerritorySelect: (territoryId: string) => void;
  onTerritoryCreate: (boundary: any) => void;
  onTerritoryEdit: (territoryId: string, boundary: any) => void;
  onTerritoryDelete: (territoryId: string) => void;
  mode: 'view' | 'edit' | 'create';
  onModeChange: (mode: 'view' | 'edit' | 'create') => void;
}

// Drawing component to handle territory creation/editing
const DrawingLayer: React.FC<{
  mode: string;
  onDrawCreated: (layer: any) => void;
  onDrawEdited: (layers: any) => void;
  onDrawDeleted: (layers: any) => void;
}> = ({ mode, onDrawCreated, onDrawEdited, onDrawDeleted }) => {
  const map = useMap();
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());

  useEffect(() => {
    const drawnItems = drawnItemsRef.current;
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polygon: mode === 'create' || mode === 'edit' ? {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: '<strong>Error:</strong> Shape edges cannot cross!'
          },
          shapeOptions: {
            color: '#2196F3',
            fillOpacity: 0.2
          }
        } : false,
        rectangle: mode === 'create' || mode === 'edit' ? {
          shapeOptions: {
            color: '#2196F3',
            fillOpacity: 0.2
          }
        } : false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: mode === 'edit'
      }
    });

    if (mode === 'create' || mode === 'edit') {
      map.addControl(drawControl);
    }

    const onDrawCreated = (e: any) => {
      const { layer } = e;
      drawnItems.addLayer(layer);
      onDrawCreated(layer);
    };

    const onDrawEdited = (e: any) => {
      onDrawEdited(e.layers);
    };

    const onDrawDeleted = (e: any) => {
      onDrawDeleted(e.layers);
    };

    map.on(L.Draw.Event.CREATED, onDrawCreated);
    map.on(L.Draw.Event.EDITED, onDrawEdited);
    map.on(L.Draw.Event.DELETED, onDrawDeleted);

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
      map.off(L.Draw.Event.CREATED, onDrawCreated);
      map.off(L.Draw.Event.EDITED, onDrawEdited);
      map.off(L.Draw.Event.DELETED, onDrawDeleted);
    };
  }, [map, mode, onDrawCreated, onDrawEdited, onDrawDeleted]);

  return null;
};

// Location tracking component
const LocationTracker: React.FC<{
  onLocationFound: (location: [number, number]) => void;
  tracking: boolean;
}> = ({ onLocationFound, tracking }) => {
  const map = useMap();

  useEffect(() => {
    if (tracking) {
      map.locate({ watch: true, enableHighAccuracy: true });
      
      const onLocationFound = (e: L.LocationEvent) => {
        const { lat, lng } = e.latlng;
        onLocationFound([lat, lng]);
      };

      map.on('locationfound', onLocationFound);

      return () => {
        map.stopLocate();
        map.off('locationfound', onLocationFound);
      };
    }
  }, [map, tracking, onLocationFound]);

  return null;
};

const TerritoryMap: React.FC<TerritoryMapProps> = ({
  territories,
  voters,
  selectedTerritory,
  onTerritorySelect,
  onTerritoryCreate,
  onTerritoryEdit,
  onTerritoryDelete,
  mode,
  onModeChange,
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.8283, -98.5795]); // Center of US
  const [mapZoom, setMapZoom] = useState(4);
  const [showVoters, setShowVoters] = useState(true);
  const [territoryLayers, setTerritoryLayers] = useState<{ [key: string]: boolean }>({});
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationTracking, setLocationTracking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize territory layer visibility
  useEffect(() => {
    const layers: { [key: string]: boolean } = {};
    territories.forEach(territory => {
      layers[territory.id] = true;
    });
    setTerritoryLayers(layers);
  }, [territories]);

  const getMarkerColor = (partyAffiliation?: string) => {
    switch (partyAffiliation?.toLowerCase()) {
      case 'democratic':
      case 'democrat':
        return '#2196F3';
      case 'republican':
        return '#F44336';
      case 'independent':
        return '#9C27B0';
      default:
        return '#757575';
    }
  };

  const createVoterIcon = (color: string) => {
    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
      className: 'voter-marker',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  };

  const getTerritoryStyle = (territory: Territory) => {
    const isSelected = territory.id === selectedTerritory;
    const baseStyle = {
      fillColor: territory.territory_type === 'precinct' ? '#4CAF50' :
                 territory.territory_type === 'district' ? '#2196F3' :
                 territory.territory_type === 'custom' ? '#FF9800' :
                 territory.territory_type === 'walklist' ? '#9C27B0' : '#757575',
      weight: isSelected ? 3 : 2,
      opacity: 1,
      color: isSelected ? '#000' : '#fff',
      dashArray: territory.status === 'inactive' ? '5, 5' : undefined,
      fillOpacity: isSelected ? 0.4 : 0.2,
    };
    return baseStyle;
  };

  const onEachTerritory = (territory: Territory, layer: L.Layer) => {
    layer.on('click', () => {
      onTerritorySelect(territory.id);
    });

    // Add popup with territory info
    const popup = L.popup({
      maxWidth: 300,
    }).setContent(`
      <div>
        <h3>${territory.name}</h3>
        <p><strong>Type:</strong> ${territory.territory_type}</p>
        <p><strong>Status:</strong> ${territory.status}</p>
        ${territory.voter_count ? `<p><strong>Voters:</strong> ${territory.voter_count}</p>` : ''}
        ${territory.area_sq_meters ? `<p><strong>Area:</strong> ${(territory.area_sq_meters / 1000000).toFixed(2)} km²</p>` : ''}
        ${territory.assigned_to ? `<p><strong>Assigned to:</strong> ${territory.assigned_to}</p>` : ''}
      </div>
    `);

    layer.bindPopup(popup);
  };

  const handleDrawCreated = (layer: any) => {
    const geoJSON = layer.toGeoJSON();
    onTerritoryCreate(geoJSON.geometry);
  };

  const handleDrawEdited = (layers: any) => {
    layers.eachLayer((layer: any) => {
      const geoJSON = layer.toGeoJSON();
      // Need to determine which territory was edited
      if (selectedTerritory) {
        onTerritoryEdit(selectedTerritory, geoJSON.geometry);
      }
    });
  };

  const handleDrawDeleted = (layers: any) => {
    if (selectedTerritory) {
      onTerritoryDelete(selectedTerritory);
    }
  };

  const toggleTerritoryLayer = (territoryId: string) => {
    setTerritoryLayers(prev => ({
      ...prev,
      [territoryId]: !prev[territoryId]
    }));
  };

  const sidebar = (
    <Box sx={{ width: 300, p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Territory Controls
      </Typography>
      
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Button
          variant={mode === 'view' ? 'contained' : 'outlined'}
          onClick={() => onModeChange('view')}
          startIcon={<Visibility />}
        >
          View Mode
        </Button>
        <Button
          variant={mode === 'create' ? 'contained' : 'outlined'}
          onClick={() => onModeChange('create')}
          startIcon={<Add />}
        >
          Create Territory
        </Button>
        <Button
          variant={mode === 'edit' ? 'contained' : 'outlined'}
          onClick={() => onModeChange('edit')}
          startIcon={<Edit />}
          disabled={!selectedTerritory}
        >
          Edit Territory
        </Button>
      </Stack>

      <FormControlLabel
        control={
          <Switch
            checked={showVoters}
            onChange={(e) => setShowVoters(e.target.checked)}
          />
        }
        label="Show Voters"
      />

      <FormControlLabel
        control={
          <Switch
            checked={locationTracking}
            onChange={(e) => setLocationTracking(e.target.checked)}
          />
        }
        label="Track Location"
      />

      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
        Territory Layers
      </Typography>
      
      <List dense>
        {territories.map((territory) => (
          <ListItem key={territory.id}>
            <ListItemText
              primary={territory.name}
              secondary={
                <Stack direction="row" spacing={1}>
                  <Chip
                    label={territory.territory_type}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={territory.status}
                    size="small"
                    color={territory.status === 'active' ? 'success' : 'default'}
                  />
                </Stack>
              }
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={territoryLayers[territory.id] || false}
                onChange={() => toggleTerritoryLayer(territory.id)}
              />
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ height: '100%', position: 'relative' }}>
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 1000,
          p: 1,
        }}
      >
        <Stack direction="row" spacing={1}>
          <Tooltip title="Territory Controls">
            <IconButton
              onClick={() => setSidebarOpen(!sidebarOpen)}
              color={sidebarOpen ? 'primary' : 'default'}
            >
              <MapIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Center on Location">
            <IconButton
              onClick={() => {
                if (userLocation) {
                  setMapCenter(userLocation);
                  setMapZoom(15);
                }
              }}
              disabled={!userLocation}
            >
              <MyLocation />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <DrawingLayer
          mode={mode}
          onDrawCreated={handleDrawCreated}
          onDrawEdited={handleDrawEdited}
          onDrawDeleted={handleDrawDeleted}
        />

        <LocationTracker
          tracking={locationTracking}
          onLocationFound={setUserLocation}
        />

        {/* Render territories */}
        {territories
          .filter(territory => territoryLayers[territory.id])
          .map((territory) => (
            <GeoJSON
              key={territory.id}
              data={territory.boundary}
              style={() => getTerritoryStyle(territory)}
              onEachFeature={(feature, layer) => onEachTerritory(territory, layer)}
            />
          ))}

        {/* Render voters */}
        {showVoters && voters.map((voter) => (
          <Marker
            key={voter.id}
            position={voter.location}
            icon={createVoterIcon(getMarkerColor(voter.party_affiliation))}
          >
            <Popup>
              <div>
                <Typography variant="subtitle2">{voter.name}</Typography>
                <Typography variant="body2">{voter.address}</Typography>
                {voter.party_affiliation && (
                  <Typography variant="body2">
                    <strong>Party:</strong> {voter.party_affiliation}
                  </Typography>
                )}
                {voter.contact_history !== undefined && (
                  <Typography variant="body2">
                    <strong>Contacts:</strong> {voter.contact_history}
                  </Typography>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={L.divIcon({
              html: `<div style="background-color: #FF5722; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.5);"></div>`,
              className: 'user-location-marker',
              iconSize: [22, 22],
              iconAnchor: [11, 11],
            })}
          >
            <Popup>
              <Typography variant="body2">Your Location</Typography>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <Drawer
        anchor="left"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        variant="persistent"
        sx={{
          '& .MuiDrawer-paper': {
            position: 'relative',
            height: '100%',
          },
        }}
      >
        {sidebar}
      </Drawer>
    </Box>
  );
};

export default TerritoryMap;