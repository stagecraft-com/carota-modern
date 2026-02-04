import { Run, TextContent, CodeObject, DefaultFormatting, FormattingKey, PartialFormatting, MergedFormatting, MULTIPLE_VALUES } from '../types';

/**
 * Keys that define text formatting
 */
export declare const formattingKeys: FormattingKey[];
/**
 * Default formatting values used when formatting is not specified
 */
export declare const defaultFormatting: DefaultFormatting;
export { MULTIPLE_VALUES };
/**
 * Check if two runs have the same formatting (ignoring text content)
 */
export declare function sameFormatting(run1: Run, run2: Run): boolean;
/**
 * Clone a run, keeping only non-default formatting values
 */
export declare function cloneRun(run: Run): Run;
/**
 * Merge formatting from multiple runs.
 * If values differ, the result will be MULTIPLE_VALUES.
 */
export declare function mergeFormatting(...runs: Run[]): MergedFormatting;
/**
 * Apply a formatting template to runs.
 * Skips MULTIPLE_VALUES in the template.
 */
export declare function formatRuns(runs: Run | Run[], template: PartialFormatting): void;
/**
 * Consolidate adjacent runs with the same formatting into single runs.
 * This is a generator function that yields consolidated runs.
 *
 * @param runs - Iterable of runs to consolidate
 * @yields Consolidated runs with adjacent same-formatted text merged
 */
export declare function consolidateRuns(runs: Iterable<Run>): Generator<Run>;
/**
 * Get plain text from a run (converts code objects to '_')
 */
export declare function getPlainText(run: Run): string;
/**
 * Get the length of a piece (string or code object)
 */
export declare function getPieceLength(piece: string | CodeObject): number;
/**
 * Get plain text from a piece (string or code object)
 */
export declare function getPiecePlainText(piece: string | CodeObject): string;
/**
 * Get the total length of text content
 */
export declare function getTextLength(text: TextContent): number;
/**
 * Get a substring of text content, emitting pieces via callback
 */
export declare function getSubText(emit: (piece: string | CodeObject) => void, text: TextContent, start: number, count: number): void;
/**
 * Get a single character from text content at the given offset
 */
export declare function getTextChar(text: TextContent, offset: number): string | CodeObject;
/**
 * Iterate over each character in a piece
 */
export declare function pieceCharacters(each: (char: string | CodeObject) => void, piece: string | CodeObject): void;
/**
 * Check if a value is a CodeObject
 */
export declare function isCodeObject(value: unknown): value is CodeObject;
//# sourceMappingURL=Run.d.ts.map