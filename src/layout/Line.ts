/**
 * Line for @stagecraft/carota
 *
 * A Line contains an array of PositionedWord objects that are all on the same
 * physical line in the wrapped text.
 */

import type { CarotaNode, Word, TextAlign, Bounds } from '../types';
import { createRect, type Rect } from '../render/Rect';
import { deriveNode } from '../util/Node';
import { createPositionedWord } from './PositionedWord';

// =============================================================================
// Line Interface
// =============================================================================

/**
 * Internal Line implementation
 */
interface LineInternal extends CarotaNode {
  doc: CarotaNode; // parent frame
  left: number;
  width: number;
  baseline: number;
  ascent: number;
  descent: number;
  align: TextAlign;
  positionedWords: CarotaNode[];
  actualWidth: number;
}

// =============================================================================
// Line Prototype
// =============================================================================

const linePrototype = deriveNode({
  type: 'line' as const,

  /**
   * Get the bounding rectangle for this line
   *
   * @param minimal - If true, use actual word boundaries instead of full width
   */
  bounds(this: LineInternal, minimal?: boolean): Rect {
    if (minimal) {
      const firstWord = this.first()?.bounds();
      const lastWord = this.last()?.bounds();

      if (firstWord && lastWord) {
        return createRect(
          firstWord.l,
          this.baseline - this.ascent,
          lastWord.l + lastWord.w - firstWord.l,
          this.ascent + this.descent
        );
      }
    }

    return createRect(
      this.left,
      this.baseline - this.ascent,
      this.width,
      this.ascent + this.descent
    );
  },

  parent(this: LineInternal): CarotaNode | null {
    return this.doc;
  },

  children(this: LineInternal): CarotaNode[] {
    return this.positionedWords;
  },
});

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a Line from words
 *
 * @param doc - The parent frame
 * @param left - Left position
 * @param width - Total width available
 * @param baseline - Baseline y-coordinate
 * @param ascent - Maximum ascent of words
 * @param descent - Maximum descent of words
 * @param words - Array of words in this line
 * @param ordinal - Starting ordinal (character index)
 * @returns A Line object
 */
export function createLine(
  doc: CarotaNode,
  left: number,
  width: number,
  baseline: number,
  ascent: number,
  descent: number,
  words: Word[],
  ordinal: number
): CarotaNode {
  // Get alignment from first word
  const align = words[0]?.align() || 'left';

  // Create the line object
  const line = Object.create(linePrototype, {
    doc: { value: doc },
    left: { value: left },
    width: { value: width },
    baseline: { value: baseline },
    ascent: { value: ascent },
    descent: { value: descent },
    ordinal: { value: ordinal },
    align: { value: align },
  }) as LineInternal;

  // Calculate actual width (sum of word widths, minus trailing space of last word)
  let actualWidth = 0;
  for (const word of words) {
    actualWidth += word.width;
  }
  actualWidth -= words[words.length - 1].space.width;

  // Calculate positioning based on alignment
  let x = 0;
  let spacing = 0;

  if (actualWidth < width) {
    switch (align) {
      case 'right':
        x = width - actualWidth;
        break;
      case 'center':
        x = (width - actualWidth) / 2;
        break;
      case 'justify':
        // Add spacing between words for justified text
        // (but not if last word is a newline)
        if (words.length > 1 && !words[words.length - 1].isNewLine()) {
          spacing = (width - actualWidth) / (words.length - 1);
        }
        break;
    }
  }

  // Create positioned words
  let currentOrdinal = ordinal;
  const positionedWords: CarotaNode[] = words.map((word) => {
    const wordLeft = x;
    x += word.width + spacing;

    const wordOrdinal = currentOrdinal;
    currentOrdinal += word.text.length + word.space.length;

    return createPositionedWord(word, line, wordLeft, wordOrdinal, word.width + spacing);
  });

  Object.defineProperty(line, 'positionedWords', { value: positionedWords });
  Object.defineProperty(line, 'actualWidth', { value: actualWidth });
  Object.defineProperty(line, 'length', { value: currentOrdinal - ordinal });

  return line;
}

// Default export for compatibility
export default createLine;
