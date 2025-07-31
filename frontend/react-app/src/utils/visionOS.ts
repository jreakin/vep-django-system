/**
 * Utility functions for visionOS detection and spatial APIs
 */

// Check if running on visionOS Safari
export const isVisionOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for visionOS in user agent
  const userAgent = navigator.userAgent.toLowerCase();
  const isVision = userAgent.includes('visionos') || userAgent.includes('vision pro');
  
  // Check for Safari on visionOS
  const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
  
  // Additional check for spatial web APIs (when available)
  const hasSpatialAPIs = 'requestSpatialTracking' in navigator || 
                         'levelOfDetail' in window ||
                         'spatialTrackingCapabilities' in navigator;
  
  return isVision && isSafari && hasSpatialAPIs;
};

// Check if spatial web APIs are available
export const hasSpatialAPIs = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return 'requestSpatialTracking' in navigator || 
         'levelOfDetail' in window ||
         'spatialTrackingCapabilities' in navigator;
};

// Level of Detail API wrapper
export interface LevelOfDetailConfig {
  near: number;  // Distance in meters for detailed view
  mid: number;   // Distance in meters for medium detail
  far: number;   // Distance in meters for minimal view
}

export class SpatialWidget {
  private element: HTMLElement;
  private config: LevelOfDetailConfig;
  private currentLevel: 'near' | 'mid' | 'far' = 'mid';
  private observer: any = null;

  constructor(element: HTMLElement, config: LevelOfDetailConfig = { near: 1, mid: 3, far: 10 }) {
    this.element = element;
    this.config = config;
    this.initializeLevelOfDetail();
  }

  private initializeLevelOfDetail() {
    if (!isVisionOS() || !('levelOfDetail' in window)) {
      return;
    }

    try {
      // @ts-ignore - visionOS specific API
      this.observer = new window.levelOfDetail.DistanceObserver({
        target: this.element,
        thresholds: [this.config.near, this.config.mid, this.config.far]
      });

      // @ts-ignore
      this.observer.observe((distance: number) => {
        const newLevel = this.getDetailLevel(distance);
        if (newLevel !== this.currentLevel) {
          this.currentLevel = newLevel;
          this.updateDetailLevel(newLevel);
        }
      });
    } catch (error) {
      console.warn('Failed to initialize level of detail:', error);
    }
  }

  private getDetailLevel(distance: number): 'near' | 'mid' | 'far' {
    if (distance <= this.config.near) return 'near';
    if (distance <= this.config.mid) return 'mid';
    return 'far';
  }

  private updateDetailLevel(level: 'near' | 'mid' | 'far') {
    // Remove existing level classes
    this.element.classList.remove('lod-near', 'lod-mid', 'lod-far');
    
    // Add new level class
    this.element.classList.add(`lod-${level}`);
    
    // Dispatch custom event for React components to handle
    const event = new CustomEvent('levelOfDetailChanged', {
      detail: { level, distance: this.getCurrentDistance() }
    });
    this.element.dispatchEvent(event);
  }

  private getCurrentDistance(): number {
    // Fallback distance calculation
    return this.currentLevel === 'near' ? 1 : this.currentLevel === 'mid' ? 3 : 10;
  }

  public getCurrentLevel(): 'near' | 'mid' | 'far' {
    return this.currentLevel;
  }

  public destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Request spatial tracking permissions
export const requestSpatialTracking = async (): Promise<boolean> => {
  if (!isVisionOS() || !('requestSpatialTracking' in navigator)) {
    return false;
  }

  try {
    // @ts-ignore - visionOS specific API
    const permission = await navigator.requestSpatialTracking();
    return permission === 'granted';
  } catch (error) {
    console.warn('Failed to request spatial tracking:', error);
    return false;
  }
};

// Make element spatial (draggable out of window)
export const makeSpatial = async (element: HTMLElement, options: {
  title?: string;
  initialPosition?: { x: number; y: number; z: number };
  size?: { width: number; height: number };
}): Promise<boolean> => {
  if (!isVisionOS()) {
    return false;
  }

  try {
    // Request spatial tracking first
    const hasPermission = await requestSpatialTracking();
    if (!hasPermission) {
      return false;
    }

    // @ts-ignore - visionOS specific API
    if ('makeSpatial' in element) {
      // @ts-ignore
      await element.makeSpatial({
        title: options.title || 'Spatial Widget',
        position: options.initialPosition || { x: 0, y: 0, z: -2 },
        size: options.size || { width: 400, height: 300 }
      });
      return true;
    }

    // Fallback using newer API
    // @ts-ignore
    if ('spatial' in window && 'createWindow' in window.spatial) {
      // @ts-ignore
      const spatialWindow = await window.spatial.createWindow({
        content: element,
        title: options.title || 'Spatial Widget',
        position: options.initialPosition || { x: 0, y: 0, z: -2 },
        size: options.size || { width: 400, height: 300 }
      });
      
      return spatialWindow !== null;
    }

    return false;
  } catch (error) {
    console.warn('Failed to make element spatial:', error);
    return false;
  }
};

// Check if element is currently spatial
export const isSpatial = (element: HTMLElement): boolean => {
  if (!isVisionOS()) return false;
  
  // @ts-ignore
  return element.spatial?.isActive === true || 
         element.classList.contains('spatial-active');
};

// Remove element from spatial mode
export const removeSpatial = (element: HTMLElement): boolean => {
  if (!isVisionOS() || !isSpatial(element)) {
    return false;
  }

  try {
    // @ts-ignore
    if (element.spatial?.remove) {
      // @ts-ignore
      element.spatial.remove();
      return true;
    }

    // Fallback
    element.classList.remove('spatial-active');
    return true;
  } catch (error) {
    console.warn('Failed to remove spatial mode:', error);
    return false;
  }
};