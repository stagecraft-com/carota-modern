import { CarotaNode, Word } from '../types';

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
export declare function createPositionedWord(word: Word, line: CarotaNode, left: number, ordinal: number, width: number): CarotaNode;
export default createPositionedWord;
//# sourceMappingURL=PositionedWord.d.ts.map