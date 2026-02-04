/**
 * Split for @stagecraft/carota
 *
 * Creates word coordinate objects from character streams.
 * Converts a stream of Characters into WordCoords representing:
 * - text: the word itself
 * - spaces: any trailing whitespace
 * - end: the subsequent word, or end of document
 */

import type { Character, WordCoords, CodeHandler, BlockCode } from '../types';

/**
 * Split characters into word coordinates.
 *
 * This generator function consumes Characters and produces "word coordinate"
 * objects, which are triplets of Characters representing the first characters of:
 *
 * - text: the word itself
 * - spaces: any trailing whitespace
 * - end: the subsequent word, or end of document
 *
 * Newline characters are NOT whitespace. They are always emitted as separate
 * single-character words.
 *
 * If text.equals(spaces) then the "word" only contains whitespace and so must
 * represent spaces at the start of a line. So even in this case, whitespace is
 * always treated as "trailing after" a word - even if that word happens to be
 * zero characters long!
 *
 * @param characters - Iterable of Character objects
 * @param codes - Code handler function for detecting block codes
 * @yields WordCoords objects for each word
 */
export function* splitCharacters(
  characters: Iterable<Character>,
  codes: CodeHandler
): Generator<WordCoords> {
  let word: Character | null = null;
  let trailingSpaces: Character | null = null;
  let newLine = true;

  for (const inputChar of characters) {
    let endOfWord = false;

    if (inputChar.char === null) {
      // End of document
      endOfWord = true;
    } else {
      // Check for newline state
      if (newLine) {
        endOfWord = true;
        newLine = false;
      }

      if (typeof inputChar.char === 'string') {
        switch (inputChar.char) {
          case ' ':
            // Start tracking trailing spaces
            if (!trailingSpaces) {
              trailingSpaces = inputChar;
            }
            break;

          case '\n':
            // Newlines end words and start new "lines"
            endOfWord = true;
            newLine = true;
            break;

          default:
            // Non-space character after spaces ends the word
            if (trailingSpaces) {
              endOfWord = true;
            }
        }
      } else {
        // Code object - check if it's a block or eof code
        const code = codes(inputChar.char) as BlockCode | undefined;
        if (code && (code.block || code.eof)) {
          endOfWord = true;
          newLine = true;
        }
      }
    }

    if (endOfWord) {
      // Emit the current word if we have one
      if (word && !word.equals(inputChar)) {
        yield {
          text: word,
          spaces: trailingSpaces || inputChar,
          end: inputChar,
        };
        trailingSpaces = null;
      }

      // Start new word at current character
      word = inputChar;
    }
  }

  // Yield null for the EOF marker if we have one
  // This is necessary to trigger the frame completion in the wrapper
  // createWord(null) creates an EOF word with eof: true
  if (word && word.char === null) {
    yield null as unknown as WordCoords;
  }
}

// Default export for compatibility
export default splitCharacters;
