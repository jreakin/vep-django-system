# visionOS Spatial Dashboard Widgets

This implementation adds spatial widget capabilities to the Political Campaign Management dashboard for Apple Vision Pro users.

## Features

### 1. Automatic visionOS Detection
- Detects when the application is running on Safari in visionOS
- Only shows spatial features when appropriate platform is detected

### 2. Spatial Widgets for Key Metrics
The following dashboard metrics have been enhanced with spatial capabilities:

- **Funds Raised** - Shows campaign funding metrics
- **Voter Contacts** - Displays total registered voters contacted  
- **Charts Created** - Number of analytics charts generated
- **Notifications** - Unread notification count

### 3. Level of Detail (LoD) Support
Widgets adapt their display based on user distance:

- **FAR**: Shows only icon and number for quick glance
- **MEDIUM**: Displays icon, title, and value
- **CLOSE**: Full detailed view with subtitle and spatial controls

### 4. Pop-out Functionality
- Pop-out icon (📤) visible only on visionOS
- Users can "drag" widgets into their spatial environment
- Widgets remain persistent and update in real-time
- Visual feedback during pop-out process

### 5. Spatial Environment Management
- Automatic spatial session initialization on visionOS
- Status indicator showing spatial environment state
- Badge counter for active spatial widgets
- User notifications for spatial actions

## Implementation

### Core Files
- `src/utils/visionOS.ts` - visionOS detection and spatial API utilities
- `src/components/SpatialMetricWidget.tsx` - Individual spatial widget component
- `src/components/SpatialWidgetManager.tsx` - Spatial environment manager
- `src/pages/Dashboard.tsx` - Updated dashboard with spatial capabilities

### API Integration
The implementation uses Web APIs that would be available in visionOS Safari:
- `window.spatial.requestSession()` - Initialize spatial environment
- `window.spatial.createWidget()` - Create persistent spatial widgets
- `window.levelOfDetail` - Track user distance for adaptive UI

### Browser Compatibility
- Full functionality on Apple Vision Pro with Safari
- Graceful degradation on other platforms
- No impact on existing non-visionOS users

## Testing

To test spatial features:
1. Open dashboard in Safari on Apple Vision Pro
2. Look for pop-out icons on metric cards
3. Tap pop-out icon to move widget to spatial environment
4. Move closer/farther to see level-of-detail changes
5. Check spatial indicator in bottom-right corner

## Future Enhancements

- Additional metrics with spatial support
- Custom spatial layouts and arrangements
- Multi-user spatial collaboration
- Gesture-based widget manipulation
- Voice commands for spatial widgets