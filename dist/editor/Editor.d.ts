import { Run, CarotaNode, MergedFormatting, Word, EditorOptions, RenderOptions, Selection, Bounds, EventEmitter } from '../types';
import { Rect } from '../render/Rect';
import { DocumentEvents } from '../document/Document';
import { Range } from '../document/Range';

/**
 * Editor interface - extends Document with DOM-specific methods
 *
 * The Editor interface represents an interactive rich text editor.
 * It includes all Document functionality plus DOM-specific features.
 */
export interface Editor {
    /**
     * Send a key event to the editor
     * @param key - Key code
     * @param selecting - Shift key pressed
     * @param ctrlKey - Ctrl/Cmd key pressed
     * @returns true if the key was handled
     */
    sendKey(key: number, selecting: boolean, ctrlKey: boolean): boolean;
    /**
     * Set the vertical alignment of content within the editor
     */
    setVerticalAlignment(alignment: 'top' | 'middle' | 'bottom'): void;
    /**
     * Focus the editor
     */
    focus(): void;
    /**
     * Remove focus from the editor
     */
    blur(): void;
    /**
     * Check if the editor has focus
     */
    hasFocus(): boolean;
    load(runs: Run[], takeFocus?: boolean): void;
    save(): Run[];
    insert(text: Run[] | string, takeFocus?: boolean): void;
    plainText(): string;
    width: number;
    readonly height: number;
    select(start: number, end?: number, takeFocus?: boolean): void;
    readonly selection: Selection;
    selectedRange(): Range;
    range(start: number, end: number): Range;
    getFormatting(): MergedFormatting;
    setFormatting(formatting: Partial<Run>): void;
    render(options: RenderOptions): void;
    draw(ctx: CanvasRenderingContext2D, viewPort?: Bounds): void;
    drawSelection(ctx: CanvasRenderingContext2D, hasFocus: boolean): void;
    on<K extends keyof DocumentEvents>(event: K, handler: (...args: DocumentEvents[K]) => void): void;
    off<K extends keyof DocumentEvents>(event: K, handler: (...args: DocumentEvents[K]) => void): void;
    performUndo(redo?: boolean): void;
    canUndo(redo?: boolean): boolean;
    readonly frame: CarotaNode | null;
    selectionChanged: EventEmitter<[() => MergedFormatting, boolean?]>;
    contentChanged: EventEmitter<[]>;
    getCaretCoords(ordinal: number): Rect | undefined;
    wordContainingOrdinal(ordinal: number): {
        word: Word;
        ordinal: number;
        index: number;
        offset: number;
    } | undefined;
    wordOrdinal(index: number): number;
    toggleCaret(): boolean;
    byOrdinal(ordinal: number): CarotaNode;
    byCoordinate(x: number, y: number): CarotaNode;
}
/**
 * Create an interactive editor.
 *
 * The Editor extends Document with DOM-specific functionality.
 * All Document methods are available on the Editor.
 *
 * @param element - The container element for the editor
 * @param options - Optional editor configuration
 * @returns An Editor instance (extends Document)
 *
 * @example
 * const editor = createEditor(document.getElementById('editor'), { width: 500 });
 * editor.load([{ text: 'Hello World' }]);
 *
 * // Document methods work
 * editor.on('change', () => console.log('Changed'));
 * editor.save(); // Returns runs
 *
 * // Editor methods work
 * editor.focus();
 * editor.setVerticalAlignment('middle');
 */
export declare function createEditor(element: HTMLElement, options?: EditorOptions): Editor;
/**
 * Legacy signature: Create an interactive editor with just an element.
 * @deprecated Use createEditor(element, options) instead
 */
export declare function createEditor(element: HTMLElement): Editor;
export default createEditor;
//# sourceMappingURL=Editor.d.ts.map