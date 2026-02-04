/**
 * Range for @stagecraft/carota
 *
 * A Range represents a selection within a document.
 * It provides methods for manipulating and querying text within the selection.
 */

import type { Run, CarotaNode, MergedFormatting, PartialFormatting } from '../types';
import {
  consolidateRuns,
  getPlainText,
  mergeFormatting,
  formatRuns,
  defaultFormatting,
} from '../model/Run';

// =============================================================================
// Document Interface (to avoid circular imports)
// =============================================================================

/**
 * Document interface required by Range
 */
export interface DocumentForRange {
  children(): CarotaNode[];
  splice(start: number, end: number, text: Run[] | string): number;
  runs(emit: (run: Run) => void, range: { start: number; end: number }): void;
  paragraphRange(start: number, end: number): Range;
  modifyInsertFormatting(attribute: string, value: unknown): void;
}

// =============================================================================
// Range Class
// =============================================================================

/**
 * A Range represents a selection within a document.
 */
export class Range {
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
  constructor(doc: DocumentForRange, start: number, end: number) {
    this.doc = doc;
    this.start = start;
    this.end = end;

    // Ensure start <= end
    if (start > end) {
      this.start = end;
      this.end = start;
    }
  }

  /**
   * Iterate over document parts (nodes) within this range
   *
   * @param emit - Callback function for each part
   * @param list - Optional list of nodes to search (defaults to document children)
   */
  parts(emit: (item: CarotaNode) => void, list?: CarotaNode[]): void {
    const searchList = list || this.doc.children();

    for (const item of searchList) {
      // Skip items entirely before the range
      if (item.ordinal + item.length <= this.start) {
        continue;
      }

      // Stop if we're past the range
      if (item.ordinal >= this.end) {
        break;
      }

      // Check if item is entirely within range
      if (item.ordinal >= this.start && item.ordinal + item.length <= this.end) {
        emit(item);
      } else {
        // Recurse into children
        this.parts(emit, item.children());
      }
    }
  }

  /**
   * Clear the range (delete its content)
   *
   * @returns Change in document length
   */
  clear(): number {
    return this.setText([]);
  }

  /**
   * Set the text content of this range
   *
   * @param text - The new text (runs array or string)
   * @returns Change in document length
   */
  setText(text: Run[] | string): number {
    return this.doc.splice(this.start, this.end, text);
  }

  /**
   * Iterate over runs within this range
   *
   * @param emit - Callback function for each run
   */
  runs(emit: (run: Run) => void): void {
    this.doc.runs(emit, { start: this.start, end: this.end });
  }

  /**
   * Get the plain text content of this range
   *
   * @returns Plain text string
   */
  plainText(): string {
    const texts: string[] = [];
    this.runs((run) => texts.push(getPlainText(run)));
    return texts.join('');
  }

  /**
   * Save the runs in this range (consolidated)
   *
   * @returns Array of consolidated runs
   */
  save(): Run[] {
    const runs: Run[] = [];
    this.runs((run) => runs.push(run));
    return [...consolidateRuns(runs)];
  }

  /**
   * Get the merged formatting for this range
   *
   * For collapsed selections (start === end), this returns the formatting
   * of the character before the cursor (since that's where inserted text
   * picks up formatting).
   *
   * @returns Merged formatting object
   */
  getFormatting(): MergedFormatting {
    let start = this.start;
    let end = this.end;

    if (start === end) {
      // Collapsed selection - take formatting of character before
      let pos = start;
      if (pos > 0) {
        pos--;
      }
      start = pos;
      end = pos + 1;
    }

    // Collect runs and merge formatting
    const runs: Run[] = [];
    this.doc.runs((run) => runs.push(run), { start, end });

    if (runs.length === 0) {
      return defaultFormatting;
    }

    return mergeFormatting(...runs);
  }

  /**
   * Set a formatting attribute on this range
   *
   * For alignment, the range is expanded to surrounding paragraphs.
   * For collapsed selections, the formatting is stored for the next insert.
   *
   * @param attribute - The formatting attribute name
   * @param value - The value to set
   */
  setFormatting(attribute: string, value: unknown): void {
    let range: Range = this;

    // Special case: expand to paragraph for alignment
    if (attribute === 'align') {
      range = this.doc.paragraphRange(this.start, this.end);
    }

    if (range.start === range.end) {
      // Collapsed selection - store for next insert
      this.doc.modifyInsertFormatting(attribute, value);
    } else {
      // Apply to existing text
      const saved = range.save();
      const template: PartialFormatting = {};
      (template as Record<string, unknown>)[attribute] = value;
      formatRuns(saved, template);
      range.setText(saved);
    }
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a new Range
 *
 * @param doc - The document
 * @param start - Start ordinal
 * @param end - End ordinal
 * @returns A new Range instance
 */
export function createRange(doc: DocumentForRange, start: number, end: number): Range {
  return new Range(doc, start, end);
}

// Default export for compatibility
export default createRange;
