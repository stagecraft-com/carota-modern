/**
 * Run utilities for @stagecraft/carota
 *
 * A Run is a segment of text with consistent formatting.
 * This module provides utilities for manipulating runs.
 */

import type {
  Run,
  TextContent,
  CodeObject,
  DefaultFormatting,
  FormattingKey,
  PartialFormatting,
  MergedFormatting,
} from '../types';
import { MULTIPLE_VALUES } from '../types';

// =============================================================================
// Constants
// =============================================================================

/**
 * Keys that define text formatting
 */
export const formattingKeys: FormattingKey[] = [
  'bold',
  'italic',
  'underline',
  'strikeout',
  'color',
  'font',
  'size',
  'align',
  'script',
];

/**
 * Default formatting values used when formatting is not specified
 */
export const defaultFormatting: DefaultFormatting = {
  size: 10,
  font: 'sans-serif',
  color: 'black',
  bold: false,
  italic: false,
  underline: false,
  strikeout: false,
  align: 'left',
  script: 'normal',
};

// Re-export MULTIPLE_VALUES for convenience
export { MULTIPLE_VALUES };

// =============================================================================
// Formatting Comparison & Cloning
// =============================================================================

/**
 * Check if two runs have the same formatting (ignoring text content)
 */
export function sameFormatting(run1: Run, run2: Run): boolean {
  return formattingKeys.every((key) => run1[key] === run2[key]);
}

/**
 * Clone a run, keeping only non-default formatting values
 */
export function cloneRun(run: Run): Run {
  const result: Run = { text: run.text };
  formattingKeys.forEach((key) => {
    const val = run[key];
    if (val !== undefined && val !== defaultFormatting[key]) {
      (result as unknown as Record<string, unknown>)[key] = val;
    }
  });
  return result;
}

// =============================================================================
// Formatting Merging
// =============================================================================

/**
 * Merge formatting from multiple runs.
 * If values differ, the result will be MULTIPLE_VALUES.
 */
export function mergeFormatting(...runs: Run[]): MergedFormatting {
  if (runs.length === 0) {
    return {};
  }
  if (runs.length === 1) {
    const merged: MergedFormatting = {};
    formattingKeys.forEach((key) => {
      const val = runs[0][key];
      if (val !== undefined) {
        (merged as Record<string, unknown>)[key] = val;
      }
    });
    return merged;
  }

  return runs.reduce((merged, run) => {
    const result: MergedFormatting = {};
    formattingKeys.forEach((key) => {
      const mergedVal = (merged as Record<string, unknown>)[key];
      const runVal = run[key];

      if (key in merged || runVal !== undefined) {
        if (mergedVal === runVal) {
          (result as Record<string, unknown>)[key] = mergedVal;
        } else if (mergedVal === undefined) {
          (result as Record<string, unknown>)[key] = runVal;
        } else if (runVal === undefined) {
          (result as Record<string, unknown>)[key] = mergedVal;
        } else {
          (result as Record<string, unknown>)[key] = MULTIPLE_VALUES;
        }
      }
    });
    return result;
  }, {} as MergedFormatting);
}

/**
 * Apply a formatting template to runs.
 * Skips MULTIPLE_VALUES in the template.
 */
export function formatRuns(runs: Run | Run[], template: PartialFormatting): void {
  const runArray = Array.isArray(runs) ? runs : [runs];
  runArray.forEach((run) => {
    Object.keys(template).forEach((key) => {
      const value = template[key as keyof PartialFormatting];
      if ((value as unknown) !== MULTIPLE_VALUES && value !== undefined) {
        (run as unknown as Record<string, unknown>)[key] = value;
      }
    });
  });
}

// =============================================================================
// Run Consolidation (Generator)
// =============================================================================

/**
 * Consolidate adjacent runs with the same formatting into single runs.
 * This is a generator function that yields consolidated runs.
 *
 * @param runs - Iterable of runs to consolidate
 * @yields Consolidated runs with adjacent same-formatted text merged
 */
export function* consolidateRuns(runs: Iterable<Run>): Generator<Run> {
  let current: Run | null = null;

  for (const run of runs) {
    if (
      !current ||
      !sameFormatting(current, run) ||
      typeof current.text !== 'string' ||
      typeof run.text !== 'string'
    ) {
      // Different formatting or non-string text - emit current and start new
      if (current) {
        yield current;
      }
      current = cloneRun(run);
    } else {
      // Same formatting with string text - merge
      (current as { text: string }).text += run.text as string;
    }
  }

  // Emit the last run if any
  if (current) {
    yield current;
  }
}

// =============================================================================
// Text Content Utilities
// =============================================================================

/**
 * Get plain text from a run (converts code objects to '_')
 */
export function getPlainText(run: Run): string {
  if (typeof run.text === 'string') {
    return run.text;
  }
  if (Array.isArray(run.text)) {
    return run.text.map((piece) => getPiecePlainText(piece)).join('');
  }
  // Code object
  return '_';
}

/**
 * Get the length of a piece (string or code object)
 */
export function getPieceLength(piece: string | CodeObject): number {
  if (typeof piece === 'string') {
    return piece.length;
  }
  // Code objects count as 1 character
  return 1;
}

/**
 * Get plain text from a piece (string or code object)
 */
export function getPiecePlainText(piece: string | CodeObject): string {
  if (typeof piece === 'string') {
    return piece;
  }
  // Code objects display as '_'
  return '_';
}

/**
 * Get the total length of text content
 */
export function getTextLength(text: TextContent): number {
  if (typeof text === 'string') {
    return text.length;
  }
  if (Array.isArray(text)) {
    return text.reduce((length, piece) => length + getPieceLength(piece), 0);
  }
  // Single code object
  return 1;
}

/**
 * Get a substring of text content, emitting pieces via callback
 */
export function getSubText(
  emit: (piece: string | CodeObject) => void,
  text: TextContent,
  start: number,
  count: number
): void {
  if (count === 0) {
    return;
  }

  if (typeof text === 'string') {
    emit(text.substr(start, count));
    return;
  }

  if (Array.isArray(text)) {
    let pos = 0;
    let remaining = count;

    for (const piece of text) {
      if (remaining <= 0) {
        break;
      }

      const pieceLength = getPieceLength(piece);

      if (pos + pieceLength > start) {
        if (pieceLength === 1) {
          // Code object or single character
          emit(piece);
          remaining -= 1;
        } else {
          // String piece
          const pieceStart = Math.max(0, start - pos);
          const str = (piece as string).substr(pieceStart, remaining);
          emit(str);
          remaining -= str.length;
        }
      }

      pos += pieceLength;
    }
    return;
  }

  // Single code object
  emit(text);
}

/**
 * Get a single character from text content at the given offset
 */
export function getTextChar(text: TextContent, offset: number): string | CodeObject {
  let result: string | CodeObject = '';
  getSubText(
    (c) => {
      result = c;
    },
    text,
    offset,
    1
  );
  return result;
}

/**
 * Iterate over each character in a piece
 */
export function pieceCharacters(
  each: (char: string | CodeObject) => void,
  piece: string | CodeObject
): void {
  if (typeof piece === 'string') {
    for (let c = 0; c < piece.length; c++) {
      each(piece[c]);
    }
  } else {
    // Code object is a single "character"
    each(piece);
  }
}

/**
 * Check if a value is a CodeObject
 */
export function isCodeObject(value: unknown): value is CodeObject {
  return (
    value !== null &&
    typeof value === 'object' &&
    '$' in value &&
    typeof (value as CodeObject).$ === 'string'
  );
}
