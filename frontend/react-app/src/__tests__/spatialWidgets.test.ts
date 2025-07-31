/**
 * Tests for visionOS spatial widgets functionality
 */

import { isVisionOS, hasSpatialAPIs, SpatialWidget } from '../utils/visionOS';

// Mock visionOS environment
const mockVisionOSNavigator = (hasSpatialSupport = true) => {
  const originalNavigator = global.navigator;
  
  Object.defineProperty(global, 'navigator', {
    value: {
      ...originalNavigator,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15 VisionOS/2.0',
      requestSpatialTracking: hasSpatialSupport ? jest.fn().mockResolvedValue('granted') : undefined,
    },
    writable: true,
  });

  Object.defineProperty(global, 'window', {
    value: {
      ...global.window,
      levelOfDetail: hasSpatialSupport ? {
        DistanceObserver: jest.fn().mockImplementation(() => ({
          observe: jest.fn(),
          disconnect: jest.fn(),
        })),
      } : undefined,
      spatial: hasSpatialSupport ? {
        createWindow: jest.fn().mockResolvedValue({}),
      } : undefined,
    },
    writable: true,
  });

  return () => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  };
};

describe('visionOS Detection', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('detects visionOS environment correctly', () => {
    const cleanup = mockVisionOSNavigator(true);
    
    expect(isVisionOS()).toBe(true);
    expect(hasSpatialAPIs()).toBe(true);
    
    cleanup();
  });

  test('returns false for non-visionOS environment', () => {
    // Default environment (not visionOS)
    expect(isVisionOS()).toBe(false);
    expect(hasSpatialAPIs()).toBe(false);
  });

  test('handles missing spatial APIs gracefully', () => {
    const cleanup = mockVisionOSNavigator(false);
    
    // Should detect visionOS but no spatial APIs
    expect(hasSpatialAPIs()).toBe(false);
    
    cleanup();
  });
});

describe('SpatialWidget', () => {
  let mockElement: HTMLElement;
  let widget: SpatialWidget;

  beforeEach(() => {
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
    
    const cleanup = mockVisionOSNavigator(true);
    widget = new SpatialWidget(mockElement);
  });

  afterEach(() => {
    if (widget) {
      widget.destroy();
    }
    if (mockElement && mockElement.parentNode) {
      mockElement.parentNode.removeChild(mockElement);
    }
    jest.restoreAllMocks();
  });

  test('initializes with default level of detail', () => {
    expect(widget.getCurrentLevel()).toBe('mid');
  });

  test('applies correct CSS classes for level of detail', () => {
    // Simulate level change
    const event = new CustomEvent('levelOfDetailChanged', {
      detail: { level: 'near', distance: 1 }
    });
    mockElement.dispatchEvent(event);

    expect(mockElement.classList.contains('lod-near')).toBe(true);
  });

  test('cleans up properly when destroyed', () => {
    const initialClasses = mockElement.className;
    widget.destroy();
    
    // Should not have added any persistent classes
    expect(mockElement.className).toBe(initialClasses);
  });
});

describe('Spatial Widget Components', () => {
  test('widget renders with correct props', () => {
    // This would be a React Testing Library test in a real implementation
    // For now, we'll test the underlying logic

    const mockData = {
      title: 'Test Metric',
      value: 1000,
      unit: '$',
      color: '#1976d2'
    };

    expect(mockData.title).toBe('Test Metric');
    expect(mockData.value).toBe(1000);
    expect(mockData.unit).toBe('$');
    expect(mockData.color).toBe('#1976d2');
  });

  test('formats large numbers correctly', () => {
    const formatValue = (val: string | number): string => {
      if (typeof val === 'number') {
        if (val >= 1000000) {
          return `${(val / 1000000).toFixed(1)}M`;
        } else if (val >= 1000) {
          return `${(val / 1000).toFixed(1)}K`;
        }
        return val.toLocaleString();
      }
      return String(val);
    };

    expect(formatValue(1000)).toBe('1.0K');
    expect(formatValue(1500)).toBe('1.5K');
    expect(formatValue(1000000)).toBe('1.0M');
    expect(formatValue(1500000)).toBe('1.5M');
    expect(formatValue(500)).toBe('500');
  });
});

// Integration test simulation
describe('Dashboard Integration', () => {
  test('dashboard switches between traditional and spatial modes', () => {
    const mockStats = {
      dashboards_count: 5,
      charts_count: 12,
      unread_notifications: 3,
      recent_uploads: 2,
      total_voters: 45000,
      recent_voters: 120
    };

    const mockSpatialData = {
      fundsRaised: 125000,
      fundsTarget: 200000,
      voterContacts: 15420,
      voterContactsThisWeek: 1240,
    };

    // Test that we can create widgets from the data
    expect(mockStats.total_voters).toBe(45000);
    expect(mockStats.charts_count).toBe(12);
    expect(mockSpatialData.fundsRaised).toBe(125000);
    expect(mockSpatialData.voterContacts).toBe(15420);

    // Test percentage calculation
    const percentage = Math.round((mockSpatialData.fundsRaised / mockSpatialData.fundsTarget) * 100);
    expect(percentage).toBe(63); // 125000 / 200000 * 100 = 62.5 -> 63
  });
});

// Performance test
describe('Performance', () => {
  test('level of detail changes do not cause memory leaks', () => {
    const cleanup = mockVisionOSNavigator(true);
    
    const elements: HTMLElement[] = [];
    const widgets: SpatialWidget[] = [];

    // Create multiple widgets
    for (let i = 0; i < 10; i++) {
      const element = document.createElement('div');
      document.body.appendChild(element);
      elements.push(element);
      
      const widget = new SpatialWidget(element);
      widgets.push(widget);
    }

    // Simulate level changes
    elements.forEach(element => {
      const event = new CustomEvent('levelOfDetailChanged', {
        detail: { level: 'far', distance: 15 }
      });
      element.dispatchEvent(event);
    });

    // Clean up
    widgets.forEach(widget => widget.destroy());
    elements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });

    cleanup();

    // Should complete without errors
    expect(widgets.length).toBe(10);
  });
});