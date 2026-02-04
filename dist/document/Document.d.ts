import { Run, CarotaNode, Word, CodeHandler, EventEmitter, MergedFormatting, Selection, RenderOptions, DocumentOptions, Document as PublicDocument } from '../types';
import { EventManager } from '../util/EventManager';
import { Rect } from '../render/Rect';
import { DocumentForRange, Range } from './Range';

/**
 * Edit command for undo/redo
 */
type EditCommand = (log: TransactionLog) => void;
/**
 * Transaction log function
 */
interface TransactionLog {
    (command: EditCommand): void;
    length: number;
}
/**
 * Edit filter function
 */
type EditFilter = (doc: DocumentImpl | DocumentWithWords) => void;
/**
 * Word info from wordContainingOrdinal
 */
interface WordInfo {
    word: Word;
    ordinal: number;
    index: number;
    offset: number;
}
/**
 * Document event types for the modern event system
 */
export type DocumentEventsMap = {
    /** Fired when content changes */
    change: [];
    /** Fired when selection changes, with merged formatting at selection */
    selectionChange: [MergedFormatting];
};
/**
 * Document event type names
 */
export type DocumentEventType = keyof DocumentEventsMap;
/**
 * Document with words interface (for edit filters)
 */
interface DocumentWithWords {
    words: Word[];
    _wordOrdinals: number[];
    selection: Selection;
    spliceWordsWithRuns(wordIndex: number, count: number, runs: Run[]): void;
}
/**
 * Internal document interface
 */
interface DocumentImpl extends CarotaNode, DocumentForRange {
    _width: number;
    selection: Selection;
    caretVisible: boolean;
    selectionJustChanged: boolean;
    words: Word[];
    frame: CarotaNode | null;
    _undoStack: EditCommand[];
    _redoStack: EditCommand[];
    _wordOrdinals: number[];
    _nextSelection?: Selection;
    _currentTransaction?: TransactionLog;
    _filtersRunning?: number;
    nextInsertFormatting: Record<string, unknown>;
    editFilters: EditFilter[];
    customCodes: CodeHandler;
    codes: CodeHandler;
    _events: EventManager<DocumentEventsMap>;
    selectionChanged: EventEmitter<[() => MergedFormatting, boolean?]>;
    contentChanged: EventEmitter<[]>;
    load(runs: Run[], takeFocus?: boolean): void;
    layout(): void;
    range(start: number, end: number): Range;
    documentRange(): Range;
    selectedRange(): Range;
    save(): Run[];
    paragraphRange(start: number, end: number): Range;
    insert(text: Run[] | string, takeFocus?: boolean): void;
    modifyInsertFormatting(attribute: string, value: unknown): void;
    applyInsertFormatting(text: Run[]): void;
    wordOrdinal(index: number): number;
    wordContainingOrdinal(ordinal: number): WordInfo | undefined;
    runs(emit: (run: Run) => void, range: {
        start: number;
        end: number;
    }): void;
    spliceWordsWithRuns(wordIndex: number, count: number, runs: Run[]): void;
    splice(start: number, end: number, text: Run[] | string): number;
    registerEditFilter(filter: EditFilter): void;
    width(width?: number): number | void;
    toggleCaret(): boolean;
    getCaretCoords(ordinal: number): Rect | undefined;
    drawSelection(ctx: CanvasRenderingContext2D, hasFocus: boolean): void;
    notifySelectionChanged(takeFocus?: boolean): void;
    select(ordinal: number, ordinalEnd?: number, takeFocus?: boolean): void;
    performUndo(redo?: boolean): void;
    canUndo(redo?: boolean): boolean;
    transaction(perform: (log: TransactionLog) => void): void;
    on<K extends keyof DocumentEventsMap>(event: K, handler: (...args: DocumentEventsMap[K]) => void): void;
    off<K extends keyof DocumentEventsMap>(event: K, handler: (...args: DocumentEventsMap[K]) => void): void;
    emitChange(): void;
    render(options: RenderOptions): void;
    getWidth(): number;
    setWidth(value: number): void;
    getHeight(): number;
    getFormatting(): MergedFormatting;
    setFormatting(formatting: Partial<Run>): void;
    plainText(): string;
}
/**
 * Create a new Document
 *
 * @param options - Optional document configuration
 * @param options.width - Initial document width (default 0)
 * @returns A new Document instance
 *
 * @example
 * // Create headless document
 * const doc = createDocument({ width: 500 });
 * doc.load([{ text: 'Hello World' }]);
 *
 * // Render to canvas
 * const canvas = document.createElement('canvas');
 * doc.render({ canvas, dpr: 2 });
 *
 * // Subscribe to changes
 * doc.on('change', () => {
 *   doc.render({ canvas, dpr: 2 });
 * });
 */
export declare function createDocument(options?: DocumentOptions): PublicDocument;
export type { DocumentImpl as Document };
export type { DocumentEventsMap as DocumentEvents };
export default createDocument;
//# sourceMappingURL=Document.d.ts.map