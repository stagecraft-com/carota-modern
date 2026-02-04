import { TextMeasurement, PartialFormatting } from '../types';

/**
 * Non-breaking space character
 */
export declare const nbsp: string;
/**
 * Character used to represent enter/newline visually
 */
export declare const enter: string;
/**
 * Generate a CSS/Canvas font string from run formatting
 *
 * @param run - The run with formatting (or undefined for defaults)
 * @returns CSS font string like "italic bold 12pt Arial"
 */
export declare function getFontString(run?: PartialFormatting): string;
/**
 * Apply run styling to a canvas context
 *
 * @param ctx - Canvas 2D rendering context
 * @param run - The run with formatting (or undefined for defaults)
 */
export declare function applyRunStyle(ctx: CanvasRenderingContext2D, run?: PartialFormatting): void;
/**
 * Prepare a canvas context for text rendering
 *
 * @param ctx - Canvas 2D rendering context
 */
export declare function prepareContext(ctx: CanvasRenderingContext2D): void;
/**
 * Generate a CSS style attribute value from run formatting
 *
 * @param run - The run with formatting (or undefined for defaults)
 * @returns CSS style string
 */
export declare function getRunStyle(run?: PartialFormatting): string;
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
export declare function measureText(text: string, style: string): TextMeasurement;
/**
 * Create a memoized text measurement function.
 *
 * This caches every result for every unique combination of (text, style).
 * The cache may grow without limit if the text varies a lot, but during
 * normal interactive editing the growth rate will be slow.
 *
 * @returns A memoized measureText function
 */
export declare function createCachedMeasureText(): (text: string, style: string) => TextMeasurement;
/**
 * Global cached measurement function
 */
export declare const cachedMeasureText: (text: string, style: string) => TextMeasurement;
/**
 * High-level text measurement using formatting
 *
 * @param str - The text to measure
 * @param formatting - Run formatting
 * @returns Measurement result
 */
export declare function measure(str: string, formatting?: PartialFormatting): TextMeasurement;
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
export declare function drawText(ctx: CanvasRenderingContext2D, str: string, formatting: PartialFormatting, left: number, baseline: number, width: number, ascent: number, descent: number): void;
export { drawText as draw };
//# sourceMappingURL=Text.d.ts.map