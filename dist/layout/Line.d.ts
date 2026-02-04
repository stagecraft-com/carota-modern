import { CarotaNode, Word } from '../types';

/**
 * Create a Line from words
 *
 * @param doc - The parent frame
 * @param left - Left position
 * @param width - Total width available
 * @param baseline - Baseline y-coordinate
 * @param ascent - Maximum ascent of words
 * @param descent - Maximum descent of words
 * @param words - Array of words in this line
 * @param ordinal - Starting ordinal (character index)
 * @returns A Line object
 */
export declare function createLine(doc: CarotaNode, left: number, width: number, baseline: number, ascent: number, descent: number, words: Word[], ordinal: number): CarotaNode;
export default createLine;
//# sourceMappingURL=Line.d.ts.map