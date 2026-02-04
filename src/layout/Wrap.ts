/**
 * Wrap for @stagecraft/carota
 *
 * A stateful transformer function that accepts words and emits lines.
 * Handles word wrapping, line breaking, and block-level codes.
 */

import type { CarotaNode, Word, CodeObject, BlockCode, PartialFormatting } from '../types';
import { createLine } from './Line';

/**
 * Emit function type for the wrapper
 */
type WrapEmit = (line: CarotaNode | number) => boolean | void;

/**
 * Block consumer function type
 */
type BlockConsumer = (inputWord: Word) => CarotaNode | undefined;

/**
 * Terminator check function type
 */
type TerminatorCheck = (code: CodeObject) => boolean;

/**
 * Create a word wrapper.
 *
 * A stateful transformer function that accepts words and emits lines.
 * If the first word is too wide, it will overhang; if width is zero or negative,
 * there will be one word on each line.
 *
 * The y-coordinate is the top of the first line, not the baseline.
 *
 * @param left - Left x-coordinate
 * @param top - Top y-coordinate
 * @param width - Available width for text
 * @param ordinal - Starting character ordinal
 * @param parent - Parent node (frame)
 * @param includeTerminator - Optional function to check if terminator should be included
 * @param initialAscent - Optional initial ascent for first line
 * @param initialDescent - Optional initial descent for first line
 * @returns A function that accepts (emit, word) and returns quit status
 */
export function createWrapper(
  left: number,
  top: number,
  width: number,
  ordinal: number,
  parent: CarotaNode,
  includeTerminator?: TerminatorCheck,
  initialAscent?: number,
  initialDescent?: number
): (emit: WrapEmit, word: Word) => boolean {
  // State
  const lineBuffer: Word[] = [];
  let lineWidth = 0;
  let maxAscent = initialAscent || 0;
  let maxDescent = initialDescent || 0;
  let quit = false;
  let lastNewLineHeight = 0;
  let y = top;
  let currentOrdinal = ordinal;

  // Block-level code consumer
  let consumer: BlockConsumer | null = null;

  /**
   * Store a word in the current line buffer
   */
  function store(word: Word, emit: WrapEmit): void {
    lineBuffer.push(word);
    lineWidth += word.width;
    maxAscent = Math.max(maxAscent, word.ascent);
    maxDescent = Math.max(maxDescent, word.descent);

    if (word.isNewLine()) {
      send(emit);
      lastNewLineHeight = word.ascent + word.descent;
    }
  }

  /**
   * Send the current line buffer as a line
   */
  function send(emit: WrapEmit): void {
    if (quit || lineBuffer.length === 0) {
      return;
    }

    const line = createLine(
      parent,
      left,
      width,
      y + maxAscent,
      maxAscent,
      maxDescent,
      lineBuffer,
      currentOrdinal
    );

    currentOrdinal += line.length;
    const result = emit(line);
    if (result === true) {
      quit = true;
    }

    y += maxAscent + maxDescent;

    // Clear buffer
    lineBuffer.length = 0;
    lineWidth = 0;
    maxAscent = 0;
    maxDescent = 0;
  }

  /**
   * Process a word
   */
  return function processWord(emit: WrapEmit, inputWord: Word): boolean {
    if (consumer) {
      // Processing block-level code
      lastNewLineHeight = 0;
      const node = consumer(inputWord);

      if (node) {
        consumer = null;
        currentOrdinal += node.length;
        y += node.bounds().h;
        Object.defineProperty(node, 'block', { value: true });
        emit(node);
      }
    } else {
      const code = inputWord.code() as BlockCode | undefined;

      if (code && code.block) {
        // Start block-level code
        if (lineBuffer.length) {
          send(emit);
        } else {
          y += lastNewLineHeight;
        }

        const blockHandler = code.block?.(
          left,
          y,
          width,
          currentOrdinal,
          parent,
          inputWord.codeFormatting() || {}
        );

        if (blockHandler) {
          consumer = blockHandler;
        }
        lastNewLineHeight = 0;
      } else if ((code && code.eof) || inputWord.eof) {
        // End of frame marker
        if (!code || (includeTerminator && includeTerminator(code as unknown as CodeObject))) {
          store(inputWord, emit);
        }

        if (!lineBuffer.length) {
          emit(y + lastNewLineHeight - top);
        } else {
          send(emit);
          emit(y - top);
        }
        quit = true;
      } else {
        // Normal word
        lastNewLineHeight = 0;

        if (!lineBuffer.length) {
          // First word on line - always store
          store(inputWord, emit);
        } else {
          // Check if word fits
          if (lineWidth + inputWord.text.width > width) {
            // Word doesn't fit - send current line first
            send(emit);
          }
          store(inputWord, emit);
        }
      }
    }

    return quit;
  };
}

// Default export for compatibility
export default createWrapper;
