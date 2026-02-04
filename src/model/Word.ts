/**
 * Word for @stagecraft/carota
 *
 * A Word represents a word of text plus trailing space.
 * Words are the basic units of layout.
 */

import type {
  Run,
  Word as WordType,
  Section,
  Part as PartType,
  WordCoords,
  CodeHandler,
  BlockCode,
  TextAlign,
} from '../types';
import { createPart } from './Part';
import { getPieceLength, getPiecePlainText } from './Run';

/**
 * Word prototype with methods
 */
const wordPrototype = {
  /**
   * Check if this word is a newline
   */
  isNewLine(this: WordImpl): boolean {
    return this.text.parts.length === 1 && this.text.parts[0].isNewLine;
  },

  /**
   * Get the code object if this word is a code (block element)
   */
  code(this: WordImpl): BlockCode | undefined {
    if (this.text.parts.length === 1 && this.text.parts[0].code) {
      return this.text.parts[0].code as BlockCode;
    }
    return undefined;
  },

  /**
   * Get the formatting of a code word
   */
  codeFormatting(this: WordImpl): Run | undefined {
    if (this.text.parts.length === 1) {
      return this.text.parts[0].run;
    }
    return undefined;
  },

  /**
   * Draw the word on a canvas
   */
  draw(this: WordImpl, ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Combine text and space parts and draw each
    const allParts = [...this.text.parts, ...this.space.parts];
    let xPos = x;
    for (const part of allParts) {
      part.draw(ctx, xPos, y);
      xPos += part.width;
    }
  },

  /**
   * Get plain text of the word (including trailing space)
   */
  plainText(this: WordImpl): string {
    return this.text.plainText + this.space.plainText;
  },

  /**
   * Get the alignment of the word (from first part)
   */
  align(this: WordImpl): TextAlign {
    const first = this.text.parts[0];
    return first ? first.run.align || 'left' : 'left';
  },

  /**
   * Iterate over runs within a range of the word
   */
  runs(
    this: WordImpl,
    emit: (run: Run) => void,
    range?: { start?: number; end?: number }
  ): void {
    let start = range?.start ?? 0;
    let end = range?.end ?? Number.MAX_VALUE;

    const sections = [this.text, this.space];

    for (const section of sections) {
      for (const part of section.parts) {
        if (start >= end || end <= 0) {
          return;
        }

        const run = part.run;
        const runText = run.text;

        if (typeof runText === 'string') {
          if (start <= 0 && end >= runText.length) {
            // Entire run is in range
            emit(run);
          } else if (start < runText.length) {
            // Partial run
            const pieceRun = Object.create(run) as Run;
            const firstChar = Math.max(0, start);
            pieceRun.text = runText.substr(firstChar, Math.min(runText.length, end - firstChar));
            emit(pieceRun);
          }
          start -= runText.length;
          end -= runText.length;
        } else {
          // Code object (counts as 1 character)
          if (start <= 0 && end >= 1) {
            emit(run);
          }
          start--;
          end--;
        }
      }
    }
  },
};

/**
 * Internal Word implementation
 */
interface WordImpl extends WordType {
  text: Section;
  space: Section;
  ascent: number;
  descent: number;
  width: number;
  length: number;
  eof?: boolean;
}

/**
 * Create a section from a run emitter function
 */
function createSection(runEmitter: (emit: (run: Run) => void) => void, codes: CodeHandler): Section {
  // Collect parts
  const parts: PartType[] = [];
  runEmitter((run) => {
    parts.push(createPart(run, codes));
  });

  // Calculate section metrics
  let ascent = 0;
  let descent = 0;
  let width = 0;
  let length = 0;
  let plainText = '';

  for (const p of parts) {
    ascent = Math.max(ascent, p.ascent);
    descent = Math.max(descent, p.descent);
    width += p.width;
    const runText = p.run.text;
    if (Array.isArray(runText)) {
      for (const piece of runText) {
        length += getPieceLength(piece);
        plainText += getPiecePlainText(piece);
      }
    } else {
      length += getPieceLength(runText);
      plainText += getPiecePlainText(runText);
    }
  }

  return { parts, ascent, descent, width, length, plainText };
}

/**
 * Create a Word from word coordinates
 *
 * @param coords - Word coordinates (from splitCharacters), or null for end-of-document marker
 * @param codes - Code handler function
 * @returns A Word object
 */
export function createWord(coords: WordCoords | null, codes: CodeHandler): WordType {
  let textEmitter: (emit: (run: Run) => void) => void;
  let spaceEmitter: (emit: (run: Run) => void) => void;

  if (!coords) {
    // Special end-of-document marker, mostly like a newline with no formatting
    textEmitter = (emit) => emit({ text: '\n' });
    spaceEmitter = () => {};
  } else {
    // Normal word - cut runs from coordinates
    textEmitter = coords.text.cut(coords.spaces);
    spaceEmitter = coords.spaces.cut(coords.end);
  }

  const text = createSection(textEmitter, codes);
  const space = createSection(spaceEmitter, codes);

  const word = Object.create(wordPrototype, {
    text: { value: text },
    space: { value: space },
    ascent: { value: Math.max(text.ascent, space.ascent) },
    descent: { value: Math.max(text.descent, space.descent) },
    width: { value: text.width + space.width, configurable: true },
    length: { value: text.length + space.length },
  }) as WordImpl;

  // Mark end-of-document
  if (!coords) {
    Object.defineProperty(word, 'eof', { value: true });
  }

  return word;
}

// Default export for compatibility
export default createWord;
