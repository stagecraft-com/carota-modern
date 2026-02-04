/**
 * Codes for @stagecraft/carota
 *
 * The codes module provides handlers for special inline and block elements.
 * These include numbered lists, list terminators, and other code objects.
 */

import type {
  CarotaNode,
  CodeObject,
  InlineCode,
  BlockCode,
  CodeHandler,
  PartialFormatting,
  TextMeasurement,
  Word,
  Run,
} from '../types';
import { measure as measureText, draw as drawText } from '../render/Text';
import { createRect, type Rect } from '../render/Rect';
import { deriveNode, createGenericNode, type GenericNode } from '../util/Node';
import { derive } from '../util/Util';

// Forward declaration for frame import (avoid circular dependency)
// Frame will be imported lazily when needed
let createFrameFunction: FrameFactory | null = null;

type FrameFactory = (
  left: number,
  top: number,
  width: number,
  ordinal: number,
  parent: CarotaNode,
  isTerminator?: (code: CodeObject) => boolean,
  initialAscent?: number
) => (emit: (frame: CarotaNode) => void, word: Word) => void;

/**
 * Set the frame factory function (called from Frame.ts to avoid circular imports)
 */
export function setFrameFactory(factory: FrameFactory): void {
  createFrameFunction = factory;
}

// =============================================================================
// Inline Node
// =============================================================================

/**
 * Inline node prototype for positioned inline elements
 */
interface InlineNodeInternal extends CarotaNode {
  inline: InlineCode;
  _parent: CarotaNode;
  formatting: PartialFormatting;
  measured: TextMeasurement;
  left: number;
  baseline: number;
  _bounds?: Rect;
  block?: boolean;
}

const inlineNodePrototype = deriveNode({
  parent(this: InlineNodeInternal): CarotaNode | null {
    return this._parent;
  },

  draw(this: InlineNodeInternal, ctx: CanvasRenderingContext2D): void {
    this.inline.draw(
      ctx,
      this.left,
      this.baseline,
      this.measured.width,
      this.measured.ascent,
      this.measured.descent,
      this.formatting
    );
  },

  position(this: InlineNodeInternal, left: number, baseline: number, bounds?: Rect): void {
    this.left = left;
    this.baseline = baseline;
    if (bounds) {
      this._bounds = bounds;
    }
  },

  bounds(this: InlineNodeInternal): Rect {
    return (
      this._bounds ||
      createRect(
        this.left,
        this.baseline - this.measured.ascent,
        this.measured.width,
        this.measured.ascent + this.measured.descent
      )
    );
  },

  byCoordinate(this: InlineNodeInternal, x: number): CarotaNode {
    if (x <= this.bounds().center().x) {
      return this;
    }
    return this.next() || this;
  },
});

/**
 * Create an inline node for a code element
 */
function createInlineNode(
  inline: InlineCode,
  parent: CarotaNode,
  ordinal: number,
  length: number,
  formatting: PartialFormatting
): InlineNodeInternal {
  if (!inline.draw || !inline.measure) {
    throw new Error('Inline code must have draw and measure methods');
  }

  return Object.create(inlineNodePrototype, {
    inline: { value: inline },
    _parent: { value: parent },
    ordinal: { value: ordinal },
    length: { value: length },
    formatting: { value: formatting },
    measured: { value: inline.measure(formatting) },
    left: { value: 0, writable: true },
    baseline: { value: 0, writable: true },
  }) as InlineNodeInternal;
}

// =============================================================================
// Code Handlers
// =============================================================================

/**
 * Registry of code handlers
 */
const codes: Record<string, (obj: CodeObject, data?: unknown, allCodes?: CodeHandler) => InlineCode | BlockCode | undefined> = {};

/**
 * Numbered list marker code
 */
codes.number = function (obj: CodeObject, number?: unknown): InlineCode {
  const num = typeof number === 'number' ? number : 0;
  const formattedNumber = num + 1 + '.';

  return {
    measure(formatting: PartialFormatting): TextMeasurement {
      return measureText(formattedNumber, formatting);
    },

    draw(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      ascent: number,
      descent: number,
      formatting: PartialFormatting
    ): void {
      drawText(ctx, formattedNumber, formatting, x, y, width, ascent, descent);
    },
  };
};

/**
 * List terminator code (used for listNext and listEnd)
 */
function listTerminator(obj: CodeObject): BlockCode {
  return derive(obj as object, {
    eof: true,
    measure(): TextMeasurement {
      return { width: 18, ascent: 0, descent: 0 };
    },
    draw(): void {
      // Empty draw - terminators don't render visually
    },
  }) as unknown as BlockCode;
}

codes.listNext = listTerminator;
codes.listEnd = listTerminator;

/**
 * List start code - creates a block-level list structure
 */
codes.listStart = function (
  obj: CodeObject,
  _data?: unknown,
  allCodes?: CodeHandler
): BlockCode {
  return derive(obj as object, {
    block(
      left: number,
      top: number,
      width: number,
      ordinal: number,
      parent: CarotaNode,
      formatting: PartialFormatting
    ): ((inputWord: Word) => CarotaNode | undefined) | undefined {
      if (!createFrameFunction) {
        console.warn('Frame factory not initialized');
        return undefined;
      }

      const list = createGenericNode('list', parent, left, top);
      let itemNode: GenericNode | null = null;
      let itemFrame: ((emit: (frame: CarotaNode) => void, word: Word) => void) | null = null;
      let itemMarker: InlineNodeInternal | null = null;
      let currentOrdinal = ordinal;
      let currentTop = top;

      const indent = 50;
      const spacing = 10;

      const startItem = (code: CodeObject, itemFormatting: PartialFormatting): void => {
        itemNode = createGenericNode('item', list);

        const markerCode = (code as { marker?: CodeObject }).marker || { $: 'number' };
        const marker = allCodes?.(markerCode, list.children().length) as InlineCode;

        if (marker) {
          itemMarker = createInlineNode(marker, itemNode, currentOrdinal, 1, itemFormatting);
          (itemMarker as { block: boolean }).block = true;
        }

        itemFrame = createFrameFunction!(
          left + indent,
          currentTop,
          width - indent,
          currentOrdinal + 1,
          itemNode,
          (terminatorCode: CodeObject) => terminatorCode.$ === 'listEnd',
          itemMarker?.measured.ascent
        );
      };

      startItem(obj, formatting);

      return function handleWord(inputWord: Word): CarotaNode | undefined {
        if (itemFrame && itemNode && itemMarker) {
          itemFrame((finishedFrame: CarotaNode) => {
            currentOrdinal = finishedFrame.ordinal + finishedFrame.length;
            const frameBounds = finishedFrame.bounds();

            // Get first line and position marker
            const firstLine = finishedFrame.first() as { baseline?: number } | undefined;
            const markerLeft = left + indent - spacing - itemMarker!.measured.width;
            const markerBounds = createRect(left, currentTop, indent, frameBounds.h);

            if (firstLine && 'baseline' in firstLine && firstLine.baseline !== undefined) {
              (itemMarker as InlineNodeInternal).left = markerLeft;
              (itemMarker as InlineNodeInternal).baseline = firstLine.baseline;
              (itemMarker as InlineNodeInternal)._bounds = markerBounds;
            } else {
              (itemMarker as InlineNodeInternal).left = markerLeft;
              (itemMarker as InlineNodeInternal).baseline = currentTop + itemMarker!.measured.ascent;
              (itemMarker as InlineNodeInternal)._bounds = markerBounds;
            }

            currentTop = frameBounds.t + frameBounds.h;

            itemNode!._children.push(itemMarker as unknown as CarotaNode);
            itemNode!._children.push(finishedFrame);
            itemNode!.finalize();

            list._children.push(itemNode as CarotaNode);
            itemNode = null;
            itemFrame = null;
            itemMarker = null;
          }, inputWord);
        } else {
          currentOrdinal++;
        }

        if (!itemFrame) {
          const code = inputWord.code();
          if (code) {
            const codeType = (code as { $?: string }).$;
            if (codeType === 'listEnd') {
              list.finalize();
              return list;
            }
            if (codeType === 'listNext') {
              startItem(code as unknown as CodeObject, inputWord.codeFormatting() || {});
            }
          }
        }

        return undefined;
      };
    },
  }) as unknown as BlockCode;
};

// =============================================================================
// Main Code Handler
// =============================================================================

/**
 * Main code handler function
 *
 * @param obj - The code object to handle
 * @param number - Optional data (e.g., list item number)
 * @param allCodes - Reference to the full codes handler for nested codes
 * @returns The code handler result, or undefined if no handler
 */
export function handleCode(
  obj: CodeObject,
  number?: unknown,
  allCodes?: CodeHandler
): InlineCode | BlockCode | undefined {
  const impl = codes[obj.$];
  return impl ? impl(obj, number, allCodes) : undefined;
}

// =============================================================================
// Edit Filter
// =============================================================================

/**
 * Document interface for edit filter
 */
interface DocumentWithWords {
  words: Word[];
  spliceWordsWithRuns(index: number, count: number, runs: Run[]): void;
}

/**
 * Balance list codes in a document
 *
 * This ensures that listStart/listNext/listEnd codes are properly balanced.
 * If a listNext appears without a preceding listStart, it becomes a listStart.
 * If there are unbalanced listStarts, listEnd codes are added.
 */
export function editFilter(doc: DocumentWithWords): void {
  let balance = 0;

  const words = doc.words;
  let modified = false;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const code = word.code();

    if (code) {
      const codeType = (code as { $?: string; marker?: unknown }).$;

      switch (codeType) {
        case 'listStart':
          balance++;
          break;

        case 'listNext':
          if (balance === 0) {
            // Convert to listStart
            const formatting = word.codeFormatting() || {};
            doc.spliceWordsWithRuns(i, 1, [
              derive(formatting as object, {
                text: {
                  $: 'listStart',
                  marker: (code as { marker?: unknown }).marker,
                },
              }) as Run,
            ]);
            modified = true;
            break;
          }
          break;

        case 'listEnd':
          if (balance === 0) {
            // Remove orphan listEnd
            doc.spliceWordsWithRuns(i, 1, []);
            i--; // Adjust index since we removed an item
          }
          balance--;
          break;
      }

      if (modified) {
        break; // Restart the loop after modification
      }
    }
  }

  // If we made a modification, we need to re-run the filter
  if (modified) {
    editFilter(doc);
    return;
  }

  // Add missing listEnd codes
  if (balance > 0) {
    const ending: Run[] = [];
    while (balance > 0) {
      balance--;
      ending.push({ text: { $: 'listEnd' } as unknown as string });
    }
    doc.spliceWordsWithRuns(doc.words.length - 1, 0, ending);
  }
}

// Default export
export default handleCode;
