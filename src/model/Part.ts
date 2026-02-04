/**
 * Part for @stagecraft/carota
 *
 * A Part is a section of a word with its own run, because a Word can span the
 * boundaries between runs, so it may have several parts in its text or space arrays.
 */

import type { Run, Part as PartType, InlineCode, BlockCode, CodeHandler, TextMeasurement, PartialFormatting } from '../types';
import { measure as measureText, draw as drawText, nbsp } from '../render/Text';

/**
 * Default inline code handler for unknown code objects
 * Displays as a gray box with "?"
 */
const defaultInline: InlineCode = {
  measure(formatting: PartialFormatting): TextMeasurement {
    const m = measureText('?', formatting);
    return {
      width: m.width + 4,
      ascent: m.width + 2,
      descent: m.width + 2,
    };
  },

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    ascent: number,
    descent: number
  ): void {
    ctx.fillStyle = 'silver';
    ctx.fillRect(x, y - ascent, width, ascent + descent);
    ctx.strokeRect(x, y - ascent, width, ascent + descent);
    ctx.fillStyle = 'black';
    ctx.fillText('?', x + 2, y);
  },
};

/**
 * Internal Part implementation interface
 */
interface PartImpl extends PartType {
  run: Run;
  isNewLine: boolean;
  width: number;
  ascent: number;
  descent: number;
  code?: InlineCode | BlockCode;
}

/**
 * Part prototype with methods
 */
const partPrototype = {
  /**
   * Draw this part on a canvas context
   *
   * @param ctx - Canvas 2D rendering context
   * @param x - X coordinate
   * @param y - Y coordinate (baseline)
   */
  draw(this: PartImpl, ctx: CanvasRenderingContext2D, x: number, y: number): void {
    if (typeof this.run.text === 'string') {
      // Draw text
      drawText(ctx, this.run.text, this.run, x, y, this.width, this.ascent, this.descent);
    } else if (this.code && this.code.draw) {
      // Draw code object
      ctx.save();
      this.code.draw(ctx, x, y, this.width, this.ascent, this.descent, this.run);
      ctx.restore();
    }
  },
};

/**
 * Create a Part from a run.
 *
 * A Part represents a measured section of a word with formatting information.
 *
 * @param run - The run containing text and formatting
 * @param codes - Code handler function for special inline elements
 * @returns A Part object
 */
export function createPart(run: Run, codes: CodeHandler): PartType {
  let m: TextMeasurement;
  let isNewLine = false;
  let code: InlineCode | BlockCode | undefined;

  if (typeof run.text === 'string') {
    // String text - check for newline
    isNewLine = run.text.length === 1 && run.text[0] === '\n';
    // Measure text (use nbsp for newlines to get proper height)
    m = measureText(isNewLine ? nbsp : run.text, run);
  } else if (Array.isArray(run.text)) {
    // Array of text content - shouldn't happen in parts but handle it
    m = { width: 0, ascent: 0, descent: 0 };
  } else {
    // Code object - use code handler
    code = codes(run.text) || defaultInline;
    m = code.measure
      ? code.measure(run)
      : {
          width: 0,
          ascent: 0,
          descent: 0,
        };
  }

  const part = Object.create(partPrototype, {
    run: { value: run },
    isNewLine: { value: isNewLine },
    width: { value: isNewLine ? 0 : m.width },
    ascent: { value: m.ascent },
    descent: { value: m.descent },
  }) as PartImpl;

  // Add code if present
  if (code) {
    Object.defineProperty(part, 'code', { value: code });
  }

  return part;
}

// Default export for compatibility
export default createPart;
