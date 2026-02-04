/**
 * Core types for @stagecraft/carota
 *
 * This file contains all the TypeScript interfaces and types used throughout
 * the Carota rich text editor library.
 */
/**
 * A code object represents a special inline element (list marker, etc.)
 * The $ property identifies the type of code.
 */
export interface CodeObject {
    $: string;
    [key: string]: unknown;
}
/**
 * Text content can be a string, code object, or array of both
 */
export type TextContent = string | CodeObject | (string | CodeObject)[];
/**
 * Text alignment options
 */
export type TextAlign = 'left' | 'center' | 'right' | 'justify';
/**
 * Text script options (normal, superscript, subscript)
 */
export type TextScript = 'normal' | 'super' | 'sub';
/**
 * A Run is a segment of text with consistent formatting.
 * This is the fundamental unit of the document model.
 */
export interface Run {
    text: TextContent;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikeout?: boolean;
    color?: string;
    font?: string;
    size?: number;
    align?: TextAlign;
    script?: TextScript;
}
/**
 * Default formatting values used when formatting is not specified
 */
export interface DefaultFormatting {
    size: number;
    font: string;
    color: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikeout: boolean;
    align: TextAlign;
    script: TextScript;
}
/**
 * Formatting that can be partially specified (for applying to selections)
 */
export type PartialFormatting = Partial<Omit<Run, 'text'>>;
/**
 * Special value indicating multiple different values in selection
 */
export declare const MULTIPLE_VALUES: unique symbol;
/**
 * A formatting value that can either be a specific value or indicate multiple values
 */
export type FormattingValue<T> = T | typeof MULTIPLE_VALUES;
/**
 * Merged formatting from multiple runs (used for selection formatting display)
 */
export interface MergedFormatting {
    bold?: FormattingValue<boolean>;
    italic?: FormattingValue<boolean>;
    underline?: FormattingValue<boolean>;
    strikeout?: FormattingValue<boolean>;
    color?: FormattingValue<string>;
    font?: FormattingValue<string>;
    size?: FormattingValue<number>;
    align?: FormattingValue<TextAlign>;
    script?: FormattingValue<TextScript>;
}
/**
 * Text measurement result from canvas measurement
 */
export interface TextMeasurement {
    width: number;
    ascent: number;
    descent: number;
    height?: number;
}
/**
 * Rectangle bounds (left, top, width, height, right, bottom)
 */
export interface Bounds {
    l: number;
    t: number;
    w: number;
    h: number;
    r: number;
    b: number;
    center?(): Point;
}
/**
 * Point in 2D space
 */
export interface Point {
    x: number;
    y: number;
}
/**
 * Node types in the document tree
 */
export type NodeType = 'document' | 'frame' | 'line' | 'word' | 'character' | 'list' | 'item';
/**
 * Base node interface - all document elements implement this
 */
export interface CarotaNode {
    readonly type: NodeType;
    readonly ordinal: number;
    readonly length: number;
    parent(): CarotaNode | null;
    children(): CarotaNode[];
    first(): CarotaNode | undefined;
    last(): CarotaNode | undefined;
    next(): CarotaNode | null;
    previous(): CarotaNode | null;
    bounds(): Bounds;
    byOrdinal(index: number): CarotaNode;
    byCoordinate(x: number, y: number): CarotaNode;
    draw(ctx: CanvasRenderingContext2D, viewPort?: Bounds): void;
}
/**
 * Selection range within document
 */
export interface Selection {
    start: number;
    end: number;
}
/**
 * Inline element handler returned by code processors
 */
export interface InlineCode {
    measure(formatting: PartialFormatting): TextMeasurement;
    draw(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, ascent: number, descent: number, formatting: PartialFormatting): void;
}
/**
 * Block element handler returned by code processors
 */
export interface BlockCode extends InlineCode {
    eof?: boolean;
    block?: (left: number, top: number, width: number, ordinal: number, parent: CarotaNode, formatting: PartialFormatting) => ((word: Word) => CarotaNode | undefined) | undefined;
}
/**
 * Code handler function type - processes code objects into renderable elements
 */
export type CodeHandler = (code: CodeObject, data?: unknown, allCodes?: CodeHandler) => InlineCode | BlockCode | undefined;
/**
 * A Part is a section of a word with its own run (formatting)
 */
export interface Part {
    readonly run: Run;
    readonly isNewLine: boolean;
    readonly width: number;
    readonly ascent: number;
    readonly descent: number;
    readonly code?: InlineCode | BlockCode;
    draw(ctx: CanvasRenderingContext2D, x: number, y: number): void;
}
/**
 * Section of a word (text or space)
 */
export interface Section {
    parts: Part[];
    ascent: number;
    descent: number;
    width: number;
    length: number;
    plainText: string;
}
/**
 * A Word represents a word of text plus trailing space
 */
export interface Word {
    readonly text: Section;
    readonly space: Section;
    readonly ascent: number;
    readonly descent: number;
    readonly width: number;
    readonly length: number;
    readonly eof?: boolean;
    isNewLine(): boolean;
    code(): BlockCode | undefined;
    codeFormatting(): Run | undefined;
    align(): TextAlign;
    plainText(): string;
    draw(ctx: CanvasRenderingContext2D, x: number, y: number): void;
    runs(emit: (run: Run) => void, range?: {
        start?: number;
        end?: number;
    }): void;
}
/**
 * Character coordinate in document - represents a position within the run array
 */
export interface Character {
    readonly char: string | CodeObject | null;
    readonly _runs: Run[];
    readonly _run: number;
    readonly _offset: number;
    equals(other: Character): boolean;
    cut(upTo: Character): (emit: (run: Run) => void) => void;
}
/**
 * Word coordinates from split operation
 */
export interface WordCoords {
    text: Character;
    spaces: Character;
    end: Character;
}
/**
 * Document options for creation
 */
export interface DocumentOptions {
    width?: number;
}
/**
 * Render options for canvas rendering
 */
export interface RenderOptions {
    canvas: HTMLCanvasElement | OffscreenCanvas;
    dpr?: number;
}
/**
 * Event handler for content changes
 */
export type ContentChangedHandler = () => void;
/**
 * Event handler for selection changes
 */
export type SelectionChangedHandler = (getFormatting: () => MergedFormatting, takeFocus?: boolean) => void;
/**
 * Event subscription interface - call to subscribe, call .fire() to emit
 */
export interface EventEmitter<T extends unknown[] = unknown[]> {
    (handler: (...args: T) => void): void;
    fire(...args: T): void;
}
/**
 * Editor options extending document options
 */
export interface EditorOptions extends DocumentOptions {
    element: HTMLElement;
    verticalAlign?: 'top' | 'middle' | 'bottom';
}
/**
 * Key handler return type - true if handled
 */
export type KeyHandlerResult = boolean;
/**
 * Formatting keys - the properties that define text formatting
 */
export type FormattingKey = 'bold' | 'italic' | 'underline' | 'strikeout' | 'color' | 'font' | 'size' | 'align' | 'script';
/**
 * Document event types for the modern event system.
 * Maps event names to their handler argument types.
 */
export type DocumentEvents = {
    /** Fired when content changes */
    change: [];
    /** Fired when selection changes, with merged formatting at selection */
    selectionChange: [MergedFormatting];
};
/**
 * Document event type names
 */
export type DocumentEventType = keyof DocumentEvents;
/**
 * Range interface for document ranges
 */
export interface Range {
    /** Start ordinal of the range */
    readonly start: number;
    /** End ordinal of the range */
    readonly end: number;
    /** Get formatting at this range */
    getFormatting(): MergedFormatting;
    /** Set a formatting attribute on this range */
    setFormatting(attribute: string, value: unknown): void;
    /** Clear (delete) the content in this range */
    clear(): number;
    /** Set text content for this range */
    setText(text: Run[] | string): number;
    /** Get plain text content */
    plainText(): string;
    /** Save the range as runs */
    save(): Run[];
    /** Iterate over parts in this range */
    parts(emit: (part: CarotaNode) => void): void;
}
/**
 * Document interface - the public API for a Carota document.
 *
 * Documents are headless - they can render to any canvas without
 * requiring DOM attachment.
 */
export interface Document {
    /**
     * Load content from an array of runs.
     * Clears undo history.
     */
    load(runs: Run[]): void;
    /**
     * Save content as array of runs.
     */
    save(): Run[];
    /**
     * Insert text or runs at current selection.
     * Replaces selection if not collapsed.
     */
    insert(text: Run[] | string): void;
    /**
     * Get plain text content.
     */
    plainText(): string;
    /**
     * Document width in pixels.
     * Setting triggers re-layout.
     */
    width: number;
    /**
     * Document height in pixels (calculated, read-only).
     */
    readonly height: number;
    /**
     * Set selection range.
     * @param start - Start ordinal
     * @param end - End ordinal (defaults to start for cursor)
     */
    select(start: number, end?: number): void;
    /**
     * Current selection state.
     */
    readonly selection: Selection;
    /**
     * Get a Range object for the current selection.
     */
    selectedRange(): Range;
    /**
     * Create a Range for arbitrary positions.
     */
    range(start: number, end: number): Range;
    /**
     * Get formatting at current selection.
     * Returns merged formatting if selection spans multiple runs.
     */
    getFormatting(): MergedFormatting;
    /**
     * Apply formatting to current selection.
     */
    setFormatting(formatting: Partial<Run>): void;
    /**
     * Render document to canvas.
     * @param options.canvas - Target canvas (HTMLCanvasElement or OffscreenCanvas)
     * @param options.dpr - Device pixel ratio (default 1)
     */
    render(options: RenderOptions): void;
    /**
     * Draw the document to a canvas context.
     * Lower-level than render() - does not handle DPI or canvas sizing.
     */
    draw(ctx: CanvasRenderingContext2D, viewPort?: Bounds): void;
    /**
     * Subscribe to document events.
     * @param event - Event name ('change' or 'selectionChange')
     * @param handler - Event handler function
     */
    on<K extends keyof DocumentEvents>(event: K, handler: (...args: DocumentEvents[K]) => void): void;
    /**
     * Unsubscribe from document events.
     */
    off<K extends keyof DocumentEvents>(event: K, handler: (...args: DocumentEvents[K]) => void): void;
    /**
     * Undo last change.
     */
    undo(): void;
    /**
     * Redo last undone change.
     */
    redo(): void;
    /**
     * Check if undo is available.
     */
    canUndo(): boolean;
    /**
     * Check if redo is available.
     */
    canRedo(): boolean;
    /** The frame node containing all content */
    readonly frame: CarotaNode | null;
    /** Legacy event for selection changes (use on('selectionChange') instead) */
    selectionChanged: EventEmitter<[() => MergedFormatting, boolean?]>;
    /** Legacy event for content changes (use on('change') instead) */
    contentChanged: EventEmitter<[]>;
}
/**
 * Editor interface - extends Document with DOM-specific functionality.
 *
 * Editors are attached to DOM elements and handle user interaction.
 */
export interface Editor extends Document {
    /**
     * Send a key event to the editor.
     * @param key - Key code
     * @param selecting - Shift key pressed
     * @param ctrlKey - Ctrl/Cmd key pressed
     * @returns true if handled
     */
    sendKey(key: number, selecting: boolean, ctrlKey: boolean): boolean;
    /**
     * Set vertical alignment of content.
     */
    setVerticalAlignment(alignment: 'top' | 'middle' | 'bottom'): void;
    /**
     * Focus the editor.
     */
    focus(): void;
    /**
     * Remove focus from editor.
     */
    blur(): void;
    /**
     * Check if editor has focus.
     */
    hasFocus(): boolean;
}
//# sourceMappingURL=types.d.ts.map