import { Run, CarotaNode, MergedFormatting } from '../types';

/**
 * Document interface required by Range
 */
export interface DocumentForRange {
    children(): CarotaNode[];
    splice(start: number, end: number, text: Run[] | string): number;
    runs(emit: (run: Run) => void, range: {
        start: number;
        end: number;
    }): void;
    paragraphRange(start: number, end: number): Range;
    modifyInsertFormatting(attribute: string, value: unknown): void;
}
/**
 * A Range represents a selection within a document.
 */
export declare class Range {
    doc: DocumentForRange;
    start: number;
    end: number;
    /**
     * Create a new Range
     *
     * @param doc - The document this range belongs to
     * @param start - Start ordinal (character index)
     * @param end - End ordinal (character index)
     */
    constructor(doc: DocumentForRange, start: number, end: number);
    /**
     * Iterate over document parts (nodes) within this range
     *
     * @param emit - Callback function for each part
     * @param list - Optional list of nodes to search (defaults to document children)
     */
    parts(emit: (item: CarotaNode) => void, list?: CarotaNode[]): void;
    /**
     * Clear the range (delete its content)
     *
     * @returns Change in document length
     */
    clear(): number;
    /**
     * Set the text content of this range
     *
     * @param text - The new text (runs array or string)
     * @returns Change in document length
     */
    setText(text: Run[] | string): number;
    /**
     * Iterate over runs within this range
     *
     * @param emit - Callback function for each run
     */
    runs(emit: (run: Run) => void): void;
    /**
     * Get the plain text content of this range
     *
     * @returns Plain text string
     */
    plainText(): string;
    /**
     * Save the runs in this range (consolidated)
     *
     * @returns Array of consolidated runs
     */
    save(): Run[];
    /**
     * Get the merged formatting for this range
     *
     * For collapsed selections (start === end), this returns the formatting
     * of the character before the cursor (since that's where inserted text
     * picks up formatting).
     *
     * @returns Merged formatting object
     */
    getFormatting(): MergedFormatting;
    /**
     * Set a formatting attribute on this range
     *
     * For alignment, the range is expanded to surrounding paragraphs.
     * For collapsed selections, the formatting is stored for the next insert.
     *
     * @param attribute - The formatting attribute name
     * @param value - The value to set
     */
    setFormatting(attribute: string, value: unknown): void;
}
/**
 * Create a new Range
 *
 * @param doc - The document
 * @param start - Start ordinal
 * @param end - End ordinal
 * @returns A new Range instance
 */
export declare function createRange(doc: DocumentForRange, start: number, end: number): Range;
export default createRange;
//# sourceMappingURL=Range.d.ts.map