/**
 * Test setup for @stagecraft/carota
 *
 * Configures jsdom environment for testing text measurement
 * and canvas operations.
 */

import { vi } from 'vitest';

// Mock OffscreenCanvas if not available
if (typeof OffscreenCanvas === 'undefined') {
  (global as any).OffscreenCanvas = class MockOffscreenCanvas {
    width: number;
    height: number;

    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
    }

    getContext(type: string) {
      if (type === '2d') {
        return {
          scale: vi.fn(),
          clearRect: vi.fn(),
          fillRect: vi.fn(),
          fillText: vi.fn(),
          strokeRect: vi.fn(),
          measureText: (text: string) => ({ width: text.length * 8 }),
          setTransform: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
          translate: vi.fn(),
          font: '',
          fillStyle: '',
          strokeStyle: '',
          textBaseline: '',
          textAlign: '',
        };
      }
      return null;
    }
  };
}

// Mock canvas context for text measurement in jsdom
// jsdom's canvas doesn't implement measureText properly
const originalCreateElement = document.createElement.bind(document);
document.createElement = function (tagName: string) {
  const element = originalCreateElement(tagName);

  if (tagName.toLowerCase() === 'canvas') {
    const canvas = element as HTMLCanvasElement;
    const originalGetContext = canvas.getContext.bind(canvas);

    (canvas as any).getContext = function (type: string) {
      const ctx = originalGetContext(type);

      if (ctx && type === '2d') {
        // Ensure measureText returns reasonable values
        const originalMeasureText = ctx.measureText?.bind(ctx);
        ctx.measureText = function (text: string) {
          if (originalMeasureText) {
            try {
              const result = originalMeasureText(text);
              // If result has width, use it
              if (result && typeof result.width === 'number') {
                return result;
              }
            } catch {
              // Fall through to mock
            }
          }
          // Mock measurement: assume ~8px per character
          return {
            width: text.length * 8,
            actualBoundingBoxAscent: 10,
            actualBoundingBoxDescent: 3,
            fontBoundingBoxAscent: 12,
            fontBoundingBoxDescent: 4,
          };
        };
      }

      return ctx;
    };
  }

  return element;
};

// Mock window.devicePixelRatio
if (typeof window !== 'undefined' && !window.devicePixelRatio) {
  Object.defineProperty(window, 'devicePixelRatio', {
    value: 1,
    writable: true,
  });
}

// Suppress console.error for "invalid state" messages in tests
// These are expected when documents can't fully initialize without proper text measurement
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const message = args[0];
  if (typeof message === 'string' && message.includes('invalid state')) {
    // Suppress expected warnings in tests
    return;
  }
  originalConsoleError(...args);
};
