# visionOS Spatial Dashboard Widgets

This document describes the implementation of spatial dashboard widgets for visionOS in the VEP Django System.

## Overview

The spatial dashboard widgets allow users on visionOS to extract key campaign metrics from the browser window and place them in their physical environment. The widgets automatically adapt their content based on the user's distance using the Level of Detail (LoD) API.

## Features

### 1. visionOS Detection
- Automatically detects visionOS Safari environment
- Conditionally enables spatial features
- Graceful fallback for other browsers

### 2. Spatial Widget Components
- **FundsRaisedWidget**: Campaign funding metrics with progress tracking
- **VoterContactsWidget**: Contact outreach metrics with weekly breakdown
- **TotalVotersWidget**: Voter registration and turnout data
- **ChartsCreatedWidget**: Analytics usage metrics

### 3. Level of Detail System
Widgets automatically adjust based on user distance:

- **Far (10m+)**: Minimal view showing only the key metric
- **Medium (3-10m)**: Standard view with icon, title, and value
- **Near (<3m)**: Detailed view with additional data and controls

### 4. Real-time Updates
- Widgets continue to receive data updates when spatial
- Refresh functionality works in spatial mode
- Data synchronization across all instances

## Architecture

```
src/
├── utils/
│   └── visionOS.ts              # visionOS detection and spatial APIs
├── components/
│   └── spatial/
│       ├── SpatialMetricWidget.tsx    # Base spatial widget component
│       ├── SpatialWidgets.tsx         # Specific metric widgets
│       ├── SpatialWidgets.css         # Spatial-aware styling
│       └── index.ts                   # Exports
└── pages/
    ├── DashboardWithSpatial.tsx       # Enhanced dashboard
    └── SpatialDemo.tsx                # Development demo
```

## Usage

### Basic Implementation

```typescript
import { FundsRaisedWidget } from '../components/spatial/SpatialWidgets';

const MyComponent = () => {
  const handleRefresh = async () => {
    // Refresh data logic
  };

  return (
    <FundsRaisedWidget
      value={125000}
      target={200000}
      onRefresh={handleRefresh}
    />
  );
};
```

### Custom Spatial Widget

```typescript
import SpatialMetricWidget from '../components/spatial/SpatialMetricWidget';
import { AttachMoney } from '@mui/icons-material';

const CustomWidget = () => (
  <SpatialMetricWidget
    title="Custom Metric"
    value={1000}
    unit="units"
    icon={<AttachMoney fontSize="large" />}
    color="#4caf50"
    subtitle="Additional context"
    data={[
      { label: 'Category 1', value: '500' },
      { label: 'Category 2', value: '300' },
      { label: 'Category 3', value: '200' }
    ]}
    onRefresh={async () => {
      // Refresh logic
    }}
  />
);
```

### visionOS Detection

```typescript
import { isVisionOS, makeSpatial } from '../utils/visionOS';

const MyComponent = () => {
  const handleMakeSpatial = async () => {
    if (isVisionOS()) {
      const element = document.getElementById('my-widget');
      if (element) {
        await makeSpatial(element, {
          title: 'My Widget',
          initialPosition: { x: 0, y: 0, z: -2 },
          size: { width: 400, height: 300 }
        });
      }
    }
  };

  return (
    <div>
      {isVisionOS() && (
        <button onClick={handleMakeSpatial}>
          Make Spatial
        </button>
      )}
    </div>
  );
};
```

## API Reference

### visionOS Utilities

#### `isVisionOS(): boolean`
Detects if running on visionOS Safari with spatial API support.

#### `makeSpatial(element: HTMLElement, options): Promise<boolean>`
Makes an element spatial (draggable out of window).

**Options:**
- `title?: string` - Window title
- `initialPosition?: {x, y, z}` - Initial 3D position
- `size?: {width, height}` - Window size

#### `SpatialWidget` class
Manages level of detail for spatial elements.

```typescript
const widget = new SpatialWidget(element, {
  near: 1,   // Distance for detailed view
  mid: 3,    // Distance for medium view  
  far: 10    // Distance for minimal view
});
```

### Component Props

#### `SpatialMetricWidgetProps`
- `title: string` - Widget title
- `value: string | number` - Main metric value
- `unit?: string` - Unit suffix (e.g., "$", "%")
- `icon: React.ReactNode` - Icon component
- `color?: string` - Theme color
- `subtitle?: string` - Additional context
- `data?: Array<{label, value}>` - Detailed data for near view
- `onRefresh?: () => Promise<void>` - Refresh callback
- `levelOfDetailConfig?` - Custom LoD thresholds

## Styling

The spatial widgets use CSS classes for level of detail styling:

```css
.spatial-metric-widget.lod-far {
  /* Minimal view styling */
}

.spatial-metric-widget.lod-mid {
  /* Standard view styling */
}

.spatial-metric-widget.lod-near {
  /* Detailed view styling */
}

.spatial-metric-widget.spatial-active {
  /* Spatial mode styling */
}
```

## Development

### Testing
Use the spatial demo page for development and testing:
```
/dashboard/spatial-demo
```

The demo includes:
- visionOS simulation toggle
- Level of detail controls
- Interactive widgets
- Technical documentation

### Browser Compatibility
- **visionOS Safari**: Full spatial functionality
- **Other browsers**: Standard widgets without spatial features
- **Graceful degradation**: All features work as traditional widgets

## Performance Considerations

1. **Level of Detail**: Reduces rendering complexity at distance
2. **Event Cleanup**: Proper cleanup prevents memory leaks
3. **Conditional Loading**: Spatial features only load on visionOS
4. **Efficient Updates**: Minimal re-renders on distance changes

## Accessibility

- **High Contrast**: Support for high contrast mode
- **Reduced Motion**: Respects user motion preferences
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Proper ARIA labels and descriptions

## Future Enhancements

1. **Gesture Support**: Hand tracking integration
2. **Physics**: Realistic spatial physics
3. **Collaboration**: Multi-user spatial widgets
4. **Voice Control**: Voice commands for widget management
5. **Analytics**: Usage tracking for spatial interactions

## Troubleshooting

### Common Issues

**Widgets not becoming spatial:**
- Verify visionOS Safari environment
- Check spatial API permissions
- Ensure elements have proper IDs

**Level of detail not working:**
- Confirm visionOS level of detail API availability
- Check distance thresholds
- Verify event listeners are attached

**Performance issues:**
- Reduce data refresh frequency
- Optimize widget count
- Use level of detail appropriately

### Debug Mode
Enable debug logging:
```typescript
// In browser console
window.spatialDebug = true;
```

## License

This implementation is part of the VEP Django System and follows the project's licensing terms.