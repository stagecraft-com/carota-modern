import { CarotaNode, CodeObject, InlineCode, BlockCode, CodeHandler, Word, Run } from '../types';

type FrameFactory = (left: number, top: number, width: number, ordinal: number, parent: CarotaNode, isTerminator?: (code: CodeObject) => boolean, initialAscent?: number) => (emit: (frame: CarotaNode) => void, word: Word) => void;
/**
 * Set the frame factory function (called from Frame.ts to avoid circular imports)
 */
export declare function setFrameFactory(factory: FrameFactory): void;
/**
 * Main code handler function
 *
 * @param obj - The code object to handle
 * @param number - Optional data (e.g., list item number)
 * @param allCodes - Reference to the full codes handler for nested codes
 * @returns The code handler result, or undefined if no handler
 */
export declare function handleCode(obj: CodeObject, number?: unknown, allCodes?: CodeHandler): InlineCode | BlockCode | undefined;
/**
 * Document interface for edit filter
 */
interface DocumentWithWords {
    words: Word[];
    spliceWordsWithRuns(index: number, count: number, runs: Run[]): void;
}
/**
 * Balance list codes in a document
 *
 * This ensures that listStart/listNext/listEnd codes are properly balanced.
 * If a listNext appears without a preceding listStart, it becomes a listStart.
 * If there are unbalanced listStarts, listEnd codes are added.
 */
export declare function editFilter(doc: DocumentWithWords): void;
export default handleCode;
//# sourceMappingURL=Codes.d.ts.map