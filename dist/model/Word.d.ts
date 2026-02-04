import { Word as WordType, WordCoords, CodeHandler } from '../types';

/**
 * Create a Word from word coordinates
 *
 * @param coords - Word coordinates (from splitCharacters), or null for end-of-document marker
 * @param codes - Code handler function
 * @returns A Word object
 */
export declare function createWord(coords: WordCoords | null, codes: CodeHandler): WordType;
export default createWord;
//# sourceMappingURL=Word.d.ts.map