/**
 * Text measurement and rendering utilities for @stagecraft/carota
 *
 * Provides functions for measuring text dimensions and rendering text to canvas.
 * Text measurement uses DOM-based measurement for accuracy.
 */

import type { Run, TextMeasurement, PartialFormatting, TextScript } from '../types';
import { defaultFormatting } from '../model/Run';

// =============================================================================
// Constants
// =============================================================================

/**
 * Non-breaking space character
 */
export const nbsp = String.fromCharCode(160);

/**
 * Character used to represent enter/newline visually
 */
export const enter = nbsp; // String.fromCharCode(9166);

// =============================================================================
// Font String Generation
// =============================================================================

/**
 * Generate a CSS/Canvas font string from run formatting
 *
 * @param run - The run with formatting (or undefined for defaults)
 * @returns CSS font string like "italic bold 12pt Arial"
 */
export function getFontString(run?: PartialFormatting): string {
  let size = (run && run.size) || defaultFormatting.size;

  // Reduce size for super/subscript
  if (run) {
    switch (run.script) {
      case 'super':
      case 'sub':
        size *= 0.8;
        break;
    }
  }

  return (
    (run && run.italic ? 'italic ' : '') +
    (run && run.bold ? 'bold ' : '') +
    ' ' +
    size +
    'pt ' +
    ((run && run.font) || defaultFormatting.font)
  );
}

// =============================================================================
// Canvas Context Styling
// =============================================================================

/**
 * Apply run styling to a canvas context
 *
 * @param ctx - Canvas 2D rendering context
 * @param run - The run with formatting (or undefined for defaults)
 */
export function applyRunStyle(ctx: CanvasRenderingContext2D, run?: PartialFormatting): void {
  ctx.fillStyle = (run && run.color) || defaultFormatting.color;
  ctx.font = getFontString(run);
}

/**
 * Prepare a canvas context for text rendering
 *
 * @param ctx - Canvas 2D rendering context
 */
export function prepareContext(ctx: CanvasRenderingContext2D): void {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// =============================================================================
// CSS Style Generation
// =============================================================================

/**
 * Generate a CSS style attribute value from run formatting
 *
 * @param run - The run with formatting (or undefined for defaults)
 * @returns CSS style string
 */
export function getRunStyle(run?: PartialFormatting): string {
  const parts = [
    'font: ',
    getFontString(run),
    '; color: ',
    (run && run.color) || defaultFormatting.color,
  ];

  if (run) {
    switch (run.script) {
      case 'super':
        parts.push('; vertical-align: super');
        break;
      case 'sub':
        parts.push('; vertical-align: sub');
        break;
    }
  }

  return parts.join('');
}

// =============================================================================
// Text Measurement
// =============================================================================

/**
 * Measure text dimensions using DOM-based measurement.
 *
 * Returns width, height, ascent, descent in pixels for the specified text and font.
 * The ascent and descent are measured from the baseline.
 *
 * Note: This creates and removes DOM elements for each measurement.
 * For performance, use createCachedMeasureText() instead.
 *
 * @param text - The text to measure
 * @param style - CSS style string (from getRunStyle)
 * @returns Measurement result with width, ascent, descent, height
 */
export function measureText(text: string, style: string): TextMeasurement {
  // Check if we're in a browser environment
  if (typeof document === 'undefined') {
    console.error('[measureText] ERROR: document is undefined - not in browser environment');
    return { width: 0, height: 0, ascent: 0, descent: 0 };
  }

  if (!document.body) {
    console.error('[measureText] ERROR: document.body is null - DOM not ready');
    return { width: 0, height: 0, ascent: 0, descent: 0 };
  }

  const span = document.createElement('span');
  const block = document.createElement('div');
  const div = document.createElement('div');

  block.style.display = 'inline-block';
  block.style.width = '1px';
  block.style.height = '0';

  div.style.visibility = 'hidden';
  div.style.position = 'absolute';
  div.style.top = '0';
  div.style.left = '0';
  div.style.width = '500px';
  div.style.height = '200px';

  div.appendChild(span);
  div.appendChild(block);
  document.body.appendChild(div);

  let result: TextMeasurement;

  try {
    span.setAttribute('style', style);
    span.innerHTML = '';
    span.appendChild(document.createTextNode(text.replace(/\s/g, nbsp)));

    block.style.verticalAlign = 'baseline';
    const ascent = block.offsetTop - span.offsetTop;

    block.style.verticalAlign = 'bottom';
    const height = block.offsetTop - span.offsetTop;

    result = {
      ascent,
      descent: height - ascent,
      height,
      width: span.offsetWidth,
    };
  } finally {
    if (div.parentNode) {
      div.parentNode.removeChild(div);
    }
  }

  return result;
}

/**
 * Create a memoized text measurement function.
 *
 * This caches every result for every unique combination of (text, style).
 * The cache may grow without limit if the text varies a lot, but during
 * normal interactive editing the growth rate will be slow.
 *
 * @returns A memoized measureText function
 */
export function createCachedMeasureText(): (text: string, style: string) => TextMeasurement {
  const cache: Record<string, TextMeasurement> = {};

  return function cachedMeasure(text: string, style: string): TextMeasurement {
    const key = style + '<>!&%' + text;
    let result = cache[key];
    if (!result) {
      cache[key] = result = measureText(text, style);
    }
    return result;
  };
}

/**
 * Global cached measurement function
 */
export const cachedMeasureText = createCachedMeasureText();

/**
 * High-level text measurement using formatting
 *
 * @param str - The text to measure
 * @param formatting - Run formatting
 * @returns Measurement result
 */
export function measure(str: string, formatting?: PartialFormatting): TextMeasurement {
  return cachedMeasureText(str, getRunStyle(formatting));
}

// =============================================================================
// Text Drawing
// =============================================================================

/**
 * Draw text to a canvas context
 *
 * @param ctx - Canvas 2D rendering context
 * @param str - The text to draw
 * @param formatting - Run formatting
 * @param left - X coordinate
 * @param baseline - Y coordinate (baseline position)
 * @param width - Width of the text (for underline/strikeout)
 * @param ascent - Ascent of the text
 * @param descent - Descent of the text
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  str: string,
  formatting: PartialFormatting,
  left: number,
  baseline: number,
  width: number,
  ascent: number,
  descent: number
): void {
  prepareContext(ctx);
  applyRunStyle(ctx, formatting);

  let adjustedBaseline = baseline;

  // Adjust baseline for super/subscript
  switch (formatting.script) {
    case 'super':
      adjustedBaseline -= ascent * (1 / 3);
      break;
    case 'sub':
      adjustedBaseline += descent / 2;
      break;
  }

  // Draw text (use enter symbol for newlines)
  ctx.fillText(str === '\n' ? enter : str, left, adjustedBaseline);

  // Draw underline
  if (formatting.underline) {
    ctx.fillRect(left, 1 + adjustedBaseline, width, 1);
  }

  // Draw strikeout
  if (formatting.strikeout) {
    ctx.fillRect(left, 1 + adjustedBaseline - ascent / 2, width, 1);
  }
}

// Legacy export name for compatibility
export { drawText as draw };
