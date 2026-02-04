import { Character, WordCoords, CodeHandler } from '../types';

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
export declare function splitCharacters(characters: Iterable<Character>, codes: CodeHandler): Generator<WordCoords>;
export default splitCharacters;
//# sourceMappingURL=Split.d.ts.map