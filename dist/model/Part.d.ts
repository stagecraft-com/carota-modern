import { Run, Part as PartType, CodeHandler } from '../types';

/**
 * Create a Part from a run.
 *
 * A Part represents a measured section of a word with formatting information.
 *
 * @param run - The run containing text and formatting
 * @param codes - Code handler function for special inline elements
 * @returns A Part object
 */
export declare function createPart(run: Run, codes: CodeHandler): PartType;
export default createPart;
//# sourceMappingURL=Part.d.ts.map