/**
 * PositionedWord for @stagecraft/carota
 *
 * A PositionedWord is a Word placed at a specific position within a Line.
 * It handles rendering and provides character-level access.
 */

import type {
  CarotaNode,
  Word,
  Part as PartType,
  Run,
  CodeHandler,
  BlockCode,
  Bounds,
} from '../types';
import { createRect, type Rect } from '../render/Rect';
import { deriveNode, parentOfType } from '../util/Node';
import { createPart } from '../model/Part';
import { pieceCharacters } from '../model/Run';
import { measure, enter } from '../render/Text';

// =============================================================================
// Line Interface (for type safety without circular import)
// =============================================================================

interface LineInternal {
  left: number;
  baseline: number;
  ascent: number;
  descent: number;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate the width of a newline character
 */
function newLineWidth(run?: Run): number {
  return measure(enter, run).width;
}

// =============================================================================
// PositionedChar
// =============================================================================

interface PositionedCharInternal extends CarotaNode {
  left: number;
  part: PartType;
  word: PositionedWordInternal;
  width?: number;
  newLine?: boolean;
}

/**
 * Positioned character prototype
 */
const positionedCharPrototype = deriveNode({
  type: 'character' as const,

  bounds(this: PositionedCharInternal): Rect {
    const wb = this.word.bounds();
    const width = this.word.word.isNewLine()
      ? newLineWidth(this.word.word.codeFormatting())
      : this.width || this.part.width;
    return createRect(wb.l + this.left, wb.t, width, wb.h);
  },

  parent(this: PositionedCharInternal): CarotaNode | null {
    return this.word;
  },

  byOrdinal(this: PositionedCharInternal): CarotaNode {
    return this;
  },

  byCoordinate(this: PositionedCharInternal, x: number): CarotaNode {
    if (x <= this.bounds().center().x) {
      return this;
    }
    return this.next() || this;
  },
});

// =============================================================================
// PositionedWord
// =============================================================================

interface PositionedWordInternal extends CarotaNode {
  word: Word;
  line: LineInternal;
  left: number;
  width: number;
  _characters?: PositionedCharInternal[];
  parts(eachPart: (part: PartType) => boolean | void): void;
  realiseCharacters(): void;
}

/**
 * Positioned word prototype
 */
const positionedWordPrototype = deriveNode({
  type: 'word' as const,

  draw(this: PositionedWordInternal, ctx: CanvasRenderingContext2D): void {
    this.word.draw(ctx, this.line.left + this.left, this.line.baseline);
  },

  bounds(this: PositionedWordInternal): Rect {
    return createRect(
      this.line.left + this.left,
      this.line.baseline - this.line.ascent,
      this.word.isNewLine() ? newLineWidth(this.word.codeFormatting()) : this.width,
      this.line.ascent + this.line.descent
    );
  },

  parts(this: PositionedWordInternal, eachPart: (part: PartType) => boolean | void): void {
    // Iterate over text parts, then space parts
    for (const part of this.word.text.parts) {
      if (eachPart(part) === true) return;
    }
    for (const part of this.word.space.parts) {
      if (eachPart(part) === true) return;
    }
  },

  realiseCharacters(this: PositionedWordInternal): void {
    if (this._characters) return;

    const cache: PositionedCharInternal[] = [];
    let x = 0;
    let ordinal = this.ordinal;

    // Get codes from document
    const docNode = parentOfType(this, 'document');
    const codes: CodeHandler = docNode
      ? (docNode as { codes?: CodeHandler }).codes || (() => undefined)
      : () => undefined;

    // Create positioned characters for each character in the word
    this.parts((wordPart: PartType) => {
      const runText = wordPart.run.text;
      const processChar = (char: string | import('../types').CodeObject) => {
        const charRun = Object.create(wordPart.run) as Run;
        charRun.text = char;
        const p = createPart(charRun, codes);

        const posChar = Object.create(positionedCharPrototype, {
          left: { value: x },
          part: { value: p },
          word: { value: this },
          ordinal: { value: ordinal },
          length: { value: 1 },
        }) as PositionedCharInternal;

        cache.push(posChar);
        x += p.width;
        ordinal++;
      };

      if (Array.isArray(runText)) {
        for (const piece of runText) {
          pieceCharacters(processChar, piece);
        }
      } else {
        pieceCharacters(processChar, runText);
      }
    });

    // Last character is artificially widened to match the length of the word
    // (taking into account align === 'justify')
    const lastChar = cache[cache.length - 1];
    if (lastChar) {
      Object.defineProperty(lastChar, 'width', {
        value: this.width - lastChar.left,
      });

      // Mark as newline if appropriate
      const code = this.word.code();
      if (this.word.isNewLine() || (code && (code as BlockCode).eof)) {
        Object.defineProperty(lastChar, 'newLine', { value: true });
      }
    }

    this._characters = cache;
  },

  children(this: PositionedWordInternal): CarotaNode[] {
    this.realiseCharacters();
    return this._characters || [];
  },

  parent(this: PositionedWordInternal): CarotaNode | null {
    return this.line as unknown as CarotaNode;
  },
});

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a positioned word
 *
 * @param word - The Word to position
 * @param line - The containing Line
 * @param left - Left position within the line
 * @param ordinal - Character ordinal
 * @param width - Width (may differ from word.width for justified text)
 * @returns A PositionedWord
 */
export function createPositionedWord(
  word: Word,
  line: CarotaNode,
  left: number,
  ordinal: number,
  width: number
): CarotaNode {
  return Object.create(positionedWordPrototype, {
    word: { value: word },
    line: { value: line },
    left: { value: left },
    width: { value: width },
    ordinal: { value: ordinal },
    length: { value: word.text.length + word.space.length },
  }) as CarotaNode;
}

// Default export for compatibility
export default createPositionedWord;
