import { Run, PartialFormatting } from '../types';

/**
 * Class definitions for formatting
 */
export type ClassFormatting = Record<string, PartialFormatting>;
/**
 * Parse HTML content into an array of runs.
 *
 * @param html - HTML string or DOM element to parse
 * @param classes - Optional class definitions for formatting
 * @returns Array of runs
 */
export declare function parseHtml(html: string | Element, classes?: ClassFormatting): Run[];
export { parseHtml as parse };
export default parseHtml;
//# sourceMappingURL=Html.d.ts.map