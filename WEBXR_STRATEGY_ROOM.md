# WebXR Strategy Room Implementation

## Overview
This implementation provides a WebXR collaborative strategy room for visionOS and other WebXR-enabled devices. The system allows multiple users to interact in a 3D virtual environment for campaign strategy sessions.

## Key Features

### 1. WebXR Integration
- **Component**: `src/pages/StrategyRoom.tsx`
- **Dependencies**: 
  - `@react-three/fiber` - Three.js React renderer
  - `@react-three/xr` - WebXR React components
  - `@react-three/drei` - Useful Three.js utilities
  - `three` - 3D graphics library

### 2. Real-time Collaboration
- **Backend Consumer**: `dashboards/consumers.py` - `StrategyRoomConsumer`
- **WebSocket Route**: `/ws/strategy-room/`
- **Features**:
  - User presence notifications
  - Real-time position sharing
  - Object interaction broadcasting
  - USDZ model loading synchronization

### 3. User Interface
- **Navigation**: Added "Strategy Room" menu item in Layout component
- **Route**: `/strategy-room` added to React Router
- **Fallback**: Informative message for non-WebXR browsers

## WebSocket Message Types

### Incoming Messages (Client → Server)
```json
{
  "type": "user_position",
  "position": { "x": 0, "y": 1.6, "z": 0 },
  "rotation": { "x": 0, "y": 0, "z": 0 }
}

{
  "type": "object_interaction",
  "object_id": "campaign_data_1",
  "interaction_type": "select",
  "object_data": { "color": "#ff0000" }
}

{
  "type": "load_usdz_model",
  "model_url": "/media/campaign_models/district_map.usdz",
  "position": { "x": 0, "y": 0, "z": -2 }
}
```

### Outgoing Messages (Server → Client)
```json
{
  "type": "user_joined",
  "user_id": 123,
  "username": "campaign_manager"
}

{
  "type": "user_left",
  "user_id": 123,
  "username": "campaign_manager"
}

{
  "type": "user_position",
  "user_id": 123,
  "username": "campaign_manager",
  "position": { "x": 0, "y": 1.6, "z": 0 },
  "rotation": { "x": 0, "y": 0, "z": 0 }
}
```

## WebXR Support Detection

The component automatically detects WebXR support:
```typescript
if ('xr' in navigator) {
  const isSupported = await navigator.xr?.isSessionSupported('immersive-vr')
  setIsWebXRSupported(isSupported || false)
}
```

## visionOS Specific Features

### Safari WebXR Support
- The implementation is designed to work with Safari on visionOS
- Uses standard WebXR APIs that are supported on Apple Vision Pro
- Provides appropriate fallbacks for unsupported browsers

### USDZ Model Support
- Ready to load .usdz models generated from campaign data
- Collaborative loading and positioning of 3D models
- Real-time synchronization of model interactions

## File Structure
```
├── frontend/react-app/src/
│   ├── pages/StrategyRoom.tsx          # Main WebXR component
│   ├── components/Layout.tsx           # Updated navigation
│   └── App.tsx                         # Added route
├── dashboards/consumers.py             # WebSocket consumer
└── CampaignManager/asgi.py            # WebSocket routing
```

## Future Enhancements

1. **Avatar System**: Add 3D avatars representing users
2. **Hand Tracking**: Integrate hand tracking for natural interactions
3. **Voice Chat**: Add spatial audio for voice communication
4. **Persistent Scenes**: Save and restore strategy room configurations
5. **Analytics**: Track user interactions and session data

## Testing

The implementation includes:
- WebXR support detection
- WebSocket connection status
- Real-time collaboration messaging
- Fallback UI for non-WebXR browsers

## Deployment Notes

1. Requires HTTPS for WebXR functionality
2. Redis backend needed for Django Channels
3. WebSocket support in production server (Daphne/Uvicorn)
4. CORS headers properly configured for frontend-backend communication

## Browser Compatibility

- **Primary Target**: Safari on visionOS (Apple Vision Pro)
- **Secondary**: Chrome/Edge on Meta Quest devices
- **Fallback**: Mouse/touch controls on standard browsers