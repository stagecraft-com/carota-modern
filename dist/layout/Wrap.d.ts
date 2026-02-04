import { CarotaNode, Word, CodeObject } from '../types';

/**
 * Emit function type for the wrapper
 */
type WrapEmit = (line: CarotaNode | number) => boolean | void;
/**
 * Terminator check function type
 */
type TerminatorCheck = (code: CodeObject) => boolean;
/**
 * Create a word wrapper.
 *
 * A stateful transformer function that accepts words and emits lines.
 * If the first word is too wide, it will overhang; if width is zero or negative,
 * there will be one word on each line.
 *
 * The y-coordinate is the top of the first line, not the baseline.
 *
 * @param left - Left x-coordinate
 * @param top - Top y-coordinate
 * @param width - Available width for text
 * @param ordinal - Starting character ordinal
 * @param parent - Parent node (frame)
 * @param includeTerminator - Optional function to check if terminator should be included
 * @param initialAscent - Optional initial ascent for first line
 * @param initialDescent - Optional initial descent for first line
 * @returns A function that accepts (emit, word) and returns quit status
 */
export declare function createWrapper(left: number, top: number, width: number, ordinal: number, parent: CarotaNode, includeTerminator?: TerminatorCheck, initialAscent?: number, initialDescent?: number): (emit: WrapEmit, word: Word) => boolean;
export default createWrapper;
//# sourceMappingURL=Wrap.d.ts.map