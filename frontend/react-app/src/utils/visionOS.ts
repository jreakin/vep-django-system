/**
 * Utility functions for visionOS detection and spatial APIs
 */
import React from 'react';

// Detection for visionOS Safari
export const isVisionOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check user agent for visionOS
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('visionos') || userAgent.includes('apple vision');
};

// Check if spatial APIs are available
export const hasSpatialAPIs = (): boolean => {
  if (!isVisionOS()) return false;
  
  // Check for visionOS specific APIs
  return 'spatial' in window || 'levelOfDetail' in window;
};

// Level of detail states based on distance
export const LevelOfDetail = {
  FAR: 'far',      // Show only number/icon
  MEDIUM: 'medium', // Show basic info
  CLOSE: 'close'   // Show full details/chart
} as const;

export type LevelOfDetail = typeof LevelOfDetail[keyof typeof LevelOfDetail];

// Spatial widget configuration
export interface SpatialWidgetConfig {
  id: string;
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  canPopOut: boolean;
}

// Mock spatial APIs for development (real APIs would be available in visionOS Safari)
declare global {
  interface Window {
    spatial?: {
      requestSession: () => Promise<unknown>;
      createWidget: (element: HTMLElement, options: unknown) => Promise<unknown>;
    };
    levelOfDetail?: {
      addEventListener: (callback: (level: LevelOfDetail) => void) => void;
      getCurrentLevel: () => LevelOfDetail;
    };
  }
}

// Request spatial session for widget placement
export const requestSpatialSession = async (): Promise<boolean> => {
  if (!hasSpatialAPIs() || !window.spatial) {
    console.warn('Spatial APIs not available');
    return false;
  }
  
  try {
    await window.spatial.requestSession();
    return true;
  } catch (error) {
    console.error('Failed to request spatial session:', error);
    return false;
  }
};

// Create spatial widget from DOM element
export const createSpatialWidget = async (
  element: HTMLElement,
  config: SpatialWidgetConfig
): Promise<boolean> => {
  if (!hasSpatialAPIs() || !window.spatial) {
    console.warn('Spatial APIs not available');
    return false;
  }
  
  try {
    await window.spatial.createWidget(element, {
      id: config.id,
      title: config.title,
      persistent: true,
      updateable: true
    });
    return true;
  } catch (error) {
    console.error('Failed to create spatial widget:', error);
    return false;
  }
};

// Setup level of detail listener
export const setupLevelOfDetailListener = (
  callback: (level: LevelOfDetail) => void
): (() => void) => {
  if (!hasSpatialAPIs() || !window.levelOfDetail) {
    console.warn('Level of detail API not available');
    return () => {};
  }
  
  window.levelOfDetail.addEventListener(callback);
  
  // Return cleanup function
  return () => {
    // In real implementation, this would remove the listener
  };
};

// Get current level of detail
export const getCurrentLevelOfDetail = (): LevelOfDetail => {
  if (!hasSpatialAPIs() || !window.levelOfDetail) {
    return LevelOfDetail.CLOSE; // Default to full view when not on visionOS
  }
  
  return window.levelOfDetail.getCurrentLevel();
};