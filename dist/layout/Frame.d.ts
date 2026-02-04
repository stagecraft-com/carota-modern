import { CarotaNode, Word, CodeObject } from '../types';

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
export declare function createFrame(left: number, top: number, width: number, ordinal: number, parent: CarotaNode, includeTerminator?: TerminatorCheck, initialAscent?: number, initialDescent?: number): (emit: (frame: CarotaNode) => void, word: Word) => boolean;
export default createFrame;
//# sourceMappingURL=Frame.d.ts.map