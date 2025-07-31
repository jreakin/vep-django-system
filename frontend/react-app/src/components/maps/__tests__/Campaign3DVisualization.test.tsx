import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import Campaign3DVisualization from '../Campaign3DVisualization';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the <model> element support check
Object.defineProperty(global.navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15',
  configurable: true,
});

// Mock document.createElement to simulate <model> element support
const originalCreateElement = document.createElement;
beforeEach(() => {
  document.createElement = vi.fn((tagName: string) => {
    if (tagName === 'model') {
      const element = originalCreateElement.call(document, 'div');
      // Simulate model element properties
      Object.defineProperty(element, 'src', {
        get: () => element.getAttribute('src'),
        set: (value: string) => element.setAttribute('src', value),
      });
      return element;
    }
    return originalCreateElement.call(document, tagName);
  });
});

afterEach(() => {
  document.createElement = originalCreateElement;
  vi.clearAllMocks();
});

describe('Campaign3DVisualization', () => {
  const defaultProps = {
    campaignId: 'test-campaign-123',
    onToggle2D: vi.fn(),
  };

  it('renders without crashing', () => {
    render(<Campaign3DVisualization {...defaultProps} />);
    expect(screen.getByText('3D Campaign Visualization')).toBeInTheDocument();
  });

  it('shows fallback mode for unsupported browsers', () => {
    // Mock unsupported browser
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      configurable: true,
    });

    render(<Campaign3DVisualization {...defaultProps} />);
    
    expect(screen.getByText(/3D model viewing requires Safari on visionOS/)).toBeInTheDocument();
  });

  it('allows changing data type', () => {
    render(<Campaign3DVisualization {...defaultProps} />);
    
    const dataTypeSelect = screen.getByLabelText('Data Type');
    fireEvent.mouseDown(dataTypeSelect);
    
    expect(screen.getByText('Geographic Data')).toBeInTheDocument();
    expect(screen.getByText('Demographics')).toBeInTheDocument();
    expect(screen.getByText('Turnout Prediction')).toBeInTheDocument();
  });

  it('generates 3D model when button is clicked', async () => {
    const mockBlobData = new Uint8Array([1, 2, 3, 4]);
    const mockBlob = new Blob([mockBlobData], { type: 'model/vnd.usdz+zip' });
    
    mockedAxios.post.mockResolvedValueOnce({
      data: mockBlob,
    });

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');

    render(<Campaign3DVisualization {...defaultProps} />);
    
    const generateButton = screen.getByText('Generate 3D Model');
    fireEvent.click(generateButton);

    expect(screen.getByText('Generating...')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/analytics/3d-model/generate/',
        {
          campaign_id: 'test-campaign-123',
          data_type: 'geographic',
          zip_codes: [],
        },
        expect.objectContaining({
          responseType: 'blob',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  it('handles API errors gracefully', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: {
          error: 'Failed to generate model',
        },
      },
    });

    render(<Campaign3DVisualization {...defaultProps} />);
    
    const generateButton = screen.getByText('Generate 3D Model');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to generate model')).toBeInTheDocument();
    });
  });

  it('renders 2D fallback when model element is not supported', () => {
    render(<Campaign3DVisualization {...defaultProps} show2DFallback={true} />);
    
    expect(screen.getByText('2D Visualization Mode')).toBeInTheDocument();
  });

  it('shows download button after model is generated', async () => {
    const mockBlobData = new Uint8Array([1, 2, 3, 4]);
    const mockBlob = new Blob([mockBlobData], { type: 'model/vnd.usdz+zip' });
    
    mockedAxios.post.mockResolvedValueOnce({
      data: mockBlob,
    });

    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');

    render(<Campaign3DVisualization {...defaultProps} />);
    
    const generateButton = screen.getByText('Generate 3D Model');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Download')).toBeInTheDocument();
    });
  });

  it('calls onToggle2D when toggle button is clicked', () => {
    const mockToggle = vi.fn();
    render(<Campaign3DVisualization {...defaultProps} onToggle2D={mockToggle} />);
    
    // Find the toggle button (Map icon)
    const toggleButton = screen.getByRole('button', { name: /Switch to 2D Map/i });
    fireEvent.click(toggleButton);
    
    expect(mockToggle).toHaveBeenCalled();
  });
});