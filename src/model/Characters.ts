/**
 * Character iteration for @stagecraft/carota
 *
 * Provides utilities for iterating over characters in a run array.
 * Each Character object represents a position within the runs.
 */

import type { Run, Character as CharacterType, CodeObject } from '../types';
import { getTextLength, getTextChar, getSubText } from './Run';

/**
 * Check that two characters are from the same run array
 */
function compatible(a: CharacterImpl, b: CharacterImpl): void {
  if (a._runs !== b._runs) {
    throw new Error('Characters for different documents');
  }
}

/**
 * Character prototype with methods
 */
const characterPrototype = {
  /**
   * Check if this character equals another
   */
  equals(this: CharacterImpl, other: CharacterType): boolean {
    compatible(this, other as CharacterImpl);
    return this._run === other._run && this._offset === other._offset;
  },

  /**
   * Create a function that cuts runs between this character and another.
   * The returned function calls eachRun for each piece of run in the range.
   */
  cut(this: CharacterImpl, upTo: CharacterType): (eachRun: (run: Run) => void) => void {
    compatible(this, upTo as CharacterImpl);
    const self = this;

    return function cutRuns(eachRun: (run: Run) => void): void {
      for (let runIndex = self._run; runIndex <= upTo._run; runIndex++) {
        const run = self._runs[runIndex];
        if (run) {
          const start = runIndex === self._run ? self._offset : 0;
          const stop = runIndex === upTo._run ? upTo._offset : getTextLength(run.text);

          if (start < stop) {
            getSubText(
              (piece) => {
                const pieceRun = Object.create(run) as Run;
                pieceRun.text = piece;
                eachRun(pieceRun);
              },
              run.text,
              start,
              stop - start
            );
          }
        }
      }
    };
  },
};

/**
 * Internal character implementation interface
 */
interface CharacterImpl extends CharacterType {
  _runs: Run[];
  _run: number;
  _offset: number;
  char: string | CodeObject | null;
}

/**
 * Create a character object representing a position in the runs
 *
 * @param runArray - The array of runs
 * @param run - The run index
 * @param offset - The character offset within the run
 * @returns A Character object
 */
function createCharacter(runArray: Run[], run: number, offset: number): CharacterType {
  const char =
    run >= runArray.length ? null : getTextChar(runArray[run].text, offset);

  return Object.create(characterPrototype, {
    _runs: { value: runArray },
    _run: { value: run },
    _offset: { value: offset },
    char: { value: char },
  }) as CharacterType;
}

/**
 * Find the first non-empty run starting from index n
 */
function firstNonEmpty(runArray: Run[], n: number): CharacterType {
  for (let i = n; i < runArray.length; i++) {
    if (getTextLength(runArray[i].text) !== 0) {
      return createCharacter(runArray, i, 0);
    }
  }
  // Return end-of-document character
  return createCharacter(runArray, runArray.length, 0);
}

/**
 * Iterate over all characters in a run array.
 * This is a generator function that yields Character objects.
 *
 * @param runArray - The array of runs to iterate over
 * @yields Character objects for each character position
 */
export function* iterateCharacters(runArray: Run[]): Generator<CharacterType> {
  let c = firstNonEmpty(runArray, 0);

  while (c.char !== null) {
    yield c;

    // Move to next character
    const impl = c as CharacterImpl;
    if (impl._offset + 1 < getTextLength(runArray[impl._run].text)) {
      // Next character in same run
      c = createCharacter(runArray, impl._run, impl._offset + 1);
    } else {
      // Move to first character of next non-empty run
      c = firstNonEmpty(runArray, impl._run + 1);
    }
  }

  // Yield the end-of-document marker
  yield c;
}

/**
 * Create a character object at a specific position
 */
export { createCharacter };

// Default export for compatibility with original API
export default iterateCharacters;
