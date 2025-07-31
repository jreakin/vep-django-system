// Type definitions for HTML <model> element
// Used for 3D model visualization in visionOS Safari

declare namespace JSX {
  interface IntrinsicElements {
    model: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string;
      interactive?: string;
      autoplay?: string;
      ar?: string;
      'camera-controls'?: string;
      loading?: string;
    };
  }
}

// Extend HTMLElementTagNameMap for proper TypeScript support
declare global {
  interface HTMLElementTagNameMap {
    model: HTMLElement;
  }
}

export {};