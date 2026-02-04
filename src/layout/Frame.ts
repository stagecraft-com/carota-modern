/**
 * Frame for @stagecraft/carota
 *
 * A Frame is a layout container that holds lines of text.
 * It manages word wrapping and provides the main layout structure.
 */

import type { CarotaNode, Word, Bounds, CodeObject } from '../types';
import { createRect, type Rect } from '../render/Rect';
import { deriveNode } from '../util/Node';
import { createWrapper } from './Wrap';
import { setFrameFactory } from '../codes/Codes';

// =============================================================================
// Frame Interface
// =============================================================================

/**
 * Internal Frame implementation
 */
interface FrameInternal extends CarotaNode {
  lines: CarotaNode[];
  _parent: CarotaNode;
  _bounds?: Rect;
  _actualWidth?: number;
  height?: number;
}

// =============================================================================
// Frame Prototype
// =============================================================================

const framePrototype = deriveNode({
  type: 'frame' as const,

  bounds(this: FrameInternal): Rect {
    if (!this._bounds) {
      let left = 0;
      let top = 0;
      let right = 0;
      let bottom = 0;

      if (this.lines.length) {
        const first = this.lines[0].bounds();
        left = first.l;
        top = first.t;

        for (const line of this.lines) {
          const b = line.bounds();
          right = Math.max(right, b.l + b.w);
          bottom = Math.max(bottom, b.t + b.h);
        }
      }

      this._bounds = createRect(left, top, right - left, this.height || bottom - top);
    }

    return this._bounds;
  },

  actualWidth(this: FrameInternal): number {
    if (this._actualWidth === undefined) {
      let result = 0;

      for (const line of this.lines) {
        const lineActualWidth = (line as { actualWidth?: number }).actualWidth;
        if (typeof lineActualWidth === 'number') {
          result = Math.max(result, lineActualWidth);
        }
      }

      this._actualWidth = result;
    }

    return this._actualWidth;
  },

  children(this: FrameInternal): CarotaNode[] {
    return this.lines;
  },

  parent(this: FrameInternal): CarotaNode | null {
    return this._parent;
  },

  draw(this: FrameInternal, ctx: CanvasRenderingContext2D, viewPort?: Bounds): void {
    const top = viewPort ? viewPort.t : 0;
    const bottom = viewPort ? viewPort.t + viewPort.h : Number.MAX_VALUE;

    for (const line of this.lines) {
      const b = line.bounds();

      // Skip lines above viewport
      if (b.t + b.h < top) {
        continue;
      }

      // Stop if we're below viewport
      if (b.t > bottom) {
        break;
      }

      line.draw(ctx, viewPort);
    }
  },
});

// =============================================================================
// Frame Factory
// =============================================================================

/**
 * Terminator check function type
 */
type TerminatorCheck = (code: CodeObject) => boolean;

/**
 * Create a frame factory function.
 *
 * This returns a function that processes words and emits a complete frame
 * when finished.
 *
 * @param left - Left x-coordinate
 * @param top - Top y-coordinate
 * @param width - Available width for text
 * @param ordinal - Starting character ordinal
 * @param parent - Parent node
 * @param includeTerminator - Optional function to check if terminator should be included
 * @param initialAscent - Optional initial ascent for first line
 * @param initialDescent - Optional initial descent for first line
 * @returns A function that accepts (emit, word) and returns true when frame is complete
 */
export function createFrame(
  left: number,
  top: number,
  width: number,
  ordinal: number,
  parent: CarotaNode,
  includeTerminator?: TerminatorCheck,
  initialAscent?: number,
  initialDescent?: number
): (emit: (frame: CarotaNode) => void, word: Word) => boolean {
  const lines: CarotaNode[] = [];

  // Create the frame object
  const frame = Object.create(framePrototype, {
    lines: { value: lines },
    _parent: { value: parent },
    ordinal: { value: ordinal },
  }) as FrameInternal;

  // Create the wrapper
  const wrapper = createWrapper(
    left,
    top,
    width,
    ordinal,
    frame,
    includeTerminator,
    initialAscent,
    initialDescent
  );

  let length = 0;
  let height = 0;

  /**
   * Process a word
   */
  return function processWord(emit: (frame: CarotaNode) => void, word: Word): boolean {
    const done = wrapper(
      (line) => {
        if (typeof line === 'number') {
          // Height value
          height = line;
        } else {
          // Line object
          length = line.ordinal + line.length - ordinal;
          lines.push(line);
        }
      },
      word
    );

    if (done) {
      Object.defineProperty(frame, 'length', { value: length });
      Object.defineProperty(frame, 'height', { value: height });
      emit(frame);
      return true;
    }

    return false;
  };
}

// =============================================================================
// Register Frame Factory with Codes
// =============================================================================

// Register the frame factory with the codes module to avoid circular imports
setFrameFactory(createFrame);

// Default export for compatibility
export default createFrame;
