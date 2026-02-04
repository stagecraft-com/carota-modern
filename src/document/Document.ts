/**
 * Document for @stagecraft/carota
 *
 * The main document model for the Carota rich text editor.
 * Manages text content, layout, selection, and undo/redo.
 *
 * Phase 2: Now supports headless rendering with render() method
 * and modern event system with on()/off() pattern.
 */

import type {
  Run,
  CarotaNode,
  Word,
  CodeHandler,
  CodeObject,
  BlockCode,
  EventEmitter,
  MergedFormatting,
  Selection,
  Bounds,
  RenderOptions,
  DocumentOptions,
  Document as PublicDocument,
} from '../types';
import { deriveNode } from '../util/Node';
import { createEvent } from '../util/Util';
import { EventManager } from '../util/EventManager';
import { createRect, type Rect } from '../render/Rect';
import { consolidateRuns } from '../model/Run';
import { iterateCharacters } from '../model/Characters';
import { splitCharacters } from '../layout/Split';
import { createWord } from '../model/Word';
import { createFrame } from '../layout/Frame';
import { createRange, type DocumentForRange, Range } from './Range';
import handleCode, { editFilter } from '../codes/Codes';

// =============================================================================
// Types
// =============================================================================

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

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a word is a "breaker" (newline or block code)
 */
function isBreaker(word: Word): boolean {
  if (word.isNewLine()) {
    return true;
  }
  const code = word.code();
  return !!(code && (code.block || code.eof));
}

/**
 * Create an edit command for undo/redo
 */
function makeEditCommand(
  doc: DocumentImpl,
  start: number,
  count: number,
  words: Word[]
): EditCommand {
  const selStart = doc.selection.start;
  const selEnd = doc.selection.end;

  return function (log: TransactionLog): void {
    doc._wordOrdinals = [];
    const oldWords = doc.words.splice(start, count, ...words);
    log(makeEditCommand(doc, start, words.length, oldWords));
    doc._nextSelection = { start: selStart, end: selEnd };
  };
}

/**
 * Create a transaction log function with a mutable length property
 */
function createTransactionLog(commands: EditCommand[]): TransactionLog {
  // We need a callable with a writable length property.
  // Function.length is read-only, so we create a wrapper object.
  const log: TransactionLog = ((command: EditCommand): void => {
    commands.push(command);
    log.length = commands.length;
  }) as TransactionLog;

  // Override the read-only length property by creating a new property
  Object.defineProperty(log, 'length', {
    value: 0,
    writable: true,
    enumerable: true,
    configurable: true,
  });

  return log;
}

/**
 * Create a transaction wrapper
 */
function makeTransaction(perform: (log: TransactionLog) => void): EditCommand {
  const commands: EditCommand[] = [];
  const log = createTransactionLog(commands);

  perform(log);

  return function (outerLog: TransactionLog): void {
    outerLog(
      makeTransaction(function (innerLog: TransactionLog): void {
        while (commands.length) {
          const cmd = commands.pop();
          if (cmd) cmd(innerLog);
        }
      })
    );
  };
}

// =============================================================================
// Document Implementation
// =============================================================================

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

  // Modern event system
  _events: EventManager<DocumentEventsMap>;

  // Legacy events (for backward compatibility)
  selectionChanged: EventEmitter<[() => MergedFormatting, boolean?]>;
  contentChanged: EventEmitter<[]>;

  // Methods defined in prototype
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
  runs(emit: (run: Run) => void, range: { start: number; end: number }): void;
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

  // Modern event methods
  on<K extends keyof DocumentEventsMap>(
    event: K,
    handler: (...args: DocumentEventsMap[K]) => void
  ): void;
  off<K extends keyof DocumentEventsMap>(
    event: K,
    handler: (...args: DocumentEventsMap[K]) => void
  ): void;
  emitChange(): void;

  // Rendering
  render(options: RenderOptions): void;

  // Property getters (Phase 2)
  getWidth(): number;
  setWidth(value: number): void;
  getHeight(): number;

  // Formatting
  getFormatting(): MergedFormatting;
  setFormatting(formatting: Partial<Run>): void;

  // Plain text
  plainText(): string;
}

/**
 * Document prototype
 */
const documentPrototype = deriveNode({
  type: 'document' as const,

  /**
   * Load content from an array of runs
   */
  load(this: DocumentImpl, runs: Run[], takeFocus?: boolean): void {
    this._undoStack = [];
    this._redoStack = [];
    this._wordOrdinals = [];

    // Convert runs to words using character iteration and splitting
    const chars = iterateCharacters(runs);
    const wordCoords = splitCharacters(chars, this.codes);

    this.words = [];
    for (const coords of wordCoords) {
      // createWord handles null coords (EOF marker) properly
      this.words.push(createWord(coords, this.codes));
    }

    this.layout();
    this.emitChange();
    this.select(0, 0, takeFocus);
  },

  /**
   * Perform document layout
   */
  layout(this: DocumentImpl): void {
    this.frame = null;

    try {
      // Create frame from words
      const frameFactory = createFrame(0, 0, this._width, 0, this as CarotaNode);

      // Process all words through the frame
      for (const word of this.words) {
        if (frameFactory((frame) => {
          this.frame = frame;
        }, word)) {
          break;
        }
      }
    } catch (x) {
      console.error(x);
    }

    if (!this.frame) {
      console.error('[Document.layout] BUG: frame is null - rolling back');
      console.error('[Document.layout] words count:', this.words.length);
      this.performUndo();
    } else if (this._nextSelection) {
      const next = this._nextSelection;
      delete this._nextSelection;
      this.select(next.start, next.end);
    }
  },

  /**
   * Create a range within this document
   */
  range(this: DocumentImpl, start: number, end: number): Range {
    return createRange(this, start, end);
  },

  /**
   * Get a range covering the entire document
   */
  documentRange(this: DocumentImpl): Range {
    return this.range(0, this.frame!.length - 1);
  },

  /**
   * Get the currently selected range
   */
  selectedRange(this: DocumentImpl): Range {
    return this.range(this.selection.start, this.selection.end);
  },

  /**
   * Save the document as an array of runs
   */
  save(this: DocumentImpl): Run[] {
    return this.documentRange().save();
  },

  /**
   * Get a range covering the paragraph(s) containing the given range
   */
  paragraphRange(this: DocumentImpl, start: number, end: number): Range {
    // Find the character after the nearest breaker before start
    const startInfo = this.wordContainingOrdinal(start);
    let paragraphStart = 0;

    if (startInfo && !isBreaker(startInfo.word)) {
      for (let i = startInfo.index; i > 0; i--) {
        if (isBreaker(this.words[i - 1])) {
          paragraphStart = this.wordOrdinal(i);
          break;
        }
      }
    }

    // Find the nearest breaker after end
    const endInfo = this.wordContainingOrdinal(end);
    let paragraphEnd = this.frame!.length - 1;

    if (endInfo && !isBreaker(endInfo.word)) {
      for (let i = endInfo.index; i < this.words.length; i++) {
        if (isBreaker(this.words[i])) {
          paragraphEnd = this.wordOrdinal(i);
          break;
        }
      }
    }

    return this.range(paragraphStart, paragraphEnd);
  },

  /**
   * Insert text at the current selection
   */
  insert(this: DocumentImpl, text: Run[] | string, takeFocus?: boolean): void {
    const change = this.selectedRange().setText(text);
    this.select(this.selection.end + change, undefined, takeFocus);
  },

  /**
   * Modify the formatting that will be applied to the next insert
   */
  modifyInsertFormatting(this: DocumentImpl, attribute: string, value: unknown): void {
    this.nextInsertFormatting[attribute] = value;
    this.notifySelectionChanged();
  },

  /**
   * Apply stored insert formatting to text
   */
  applyInsertFormatting(this: DocumentImpl, text: Run[]): void {
    const formatting = this.nextInsertFormatting;
    const properties = Object.keys(formatting);

    if (properties.length) {
      text.forEach((run) => {
        properties.forEach((property) => {
          (run as unknown as Record<string, unknown>)[property] = formatting[property];
        });
      });
    }
  },

  /**
   * Get the ordinal (character index) at the start of a word
   */
  wordOrdinal(this: DocumentImpl, index: number): number {
    if (index < this.words.length) {
      const cached = this._wordOrdinals.length;

      if (cached < index + 1) {
        let o = cached > 0 ? this._wordOrdinals[cached - 1] : 0;

        for (let n = cached; n <= index; n++) {
          this._wordOrdinals[n] = o;
          o += this.words[n].length;
        }
      }

      return this._wordOrdinals[index];
    }

    return 0;
  },

  /**
   * Find the word containing a given ordinal
   */
  wordContainingOrdinal(this: DocumentImpl, ordinal: number): WordInfo | undefined {
    let pos = 0;

    for (let i = 0; i < this.words.length; i++) {
      const word = this.words[i];

      if (ordinal >= pos && ordinal < pos + word.length) {
        return {
          word,
          ordinal: pos,
          index: i,
          offset: ordinal - pos,
        };
      }

      pos += word.length;
    }

    return undefined;
  },

  /**
   * Iterate over runs within a range
   */
  runs(this: DocumentImpl, emit: (run: Run) => void, range: { start: number; end: number }): void {
    const startDetails = this.wordContainingOrdinal(Math.max(0, range.start));
    const endDetails = this.wordContainingOrdinal(
      Math.min(range.end, this.frame!.length - 1)
    );

    if (!startDetails || !endDetails) return;

    if (startDetails.index === endDetails.index) {
      startDetails.word.runs(emit, {
        start: startDetails.offset,
        end: endDetails.offset,
      });
    } else {
      startDetails.word.runs(emit, { start: startDetails.offset });

      for (let n = startDetails.index + 1; n < endDetails.index; n++) {
        this.words[n].runs(emit);
      }

      endDetails.word.runs(emit, { end: endDetails.offset });
    }
  },

  /**
   * Replace words with new content from runs
   */
  spliceWordsWithRuns(this: DocumentImpl, wordIndex: number, count: number, runs: Run[]): void {
    // Convert runs to words
    const chars = iterateCharacters(runs);
    const wordCoords = splitCharacters(chars, this.codes);

    const newWords: Word[] = [];
    for (const coords of wordCoords) {
      // IMPORTANT: Filter out null coords (EOF markers) - they should NOT be
      // spliced into the middle of a document. The original Carota uses .truthy()
      // to filter these out. EOF markers are only valid at document end.
      if (coords) {
        newWords.push(createWord(coords, this.codes));
      }
    }

    // Check if we need to run edit filters
    let runFilters = false;

    if ('_filtersRunning' in this) {
      this._filtersRunning!++;
    } else {
      for (let n = 0; n < count; n++) {
        if (this.words[wordIndex + n].code()) {
          runFilters = true;
          break;
        }
      }

      if (!runFilters) {
        runFilters = newWords.some((word) => !!word.code());
      }
    }

    this.transaction((log) => {
      makeEditCommand(this, wordIndex, count, newWords)(log);

      if (runFilters) {
        this._filtersRunning = 0;

        try {
          for (;;) {
            const spliceCount = this._filtersRunning;
            let changed = false;

            for (const filter of this.editFilters) {
              filter(this);
              if (spliceCount !== this._filtersRunning) {
                changed = true;
                break;
              }
            }

            if (!changed) break;
          }
        } finally {
          delete this._filtersRunning;
        }
      }
    });
  },

  /**
   * Splice content at a character range
   */
  splice(this: DocumentImpl, start: number, end: number, text: Run[] | string): number {
    // Normalize text to array of runs
    let textRuns: Run[];

    if (typeof text === 'string') {
      const sample = Math.max(0, start - 1);
      let sampleRun: Run | undefined;

      this.runs(
        (run) => {
          if (!sampleRun) sampleRun = run;
        },
        { start: sample, end: sample + 1 }
      );

      textRuns = sampleRun
        ? [Object.create(sampleRun, { text: { value: text } })]
        : [{ text }];
    } else if (!Array.isArray(text)) {
      textRuns = [{ text: text as unknown as string }];
    } else {
      textRuns = text;
    }

    this.applyInsertFormatting(textRuns);

    const startWord = this.wordContainingOrdinal(start);
    const endWord = this.wordContainingOrdinal(end);

    if (!startWord || !endWord) return 0;

    // Get prefix (content before start within the word)
    let prefix: Run[] = [];

    if (start === startWord.ordinal) {
      // At word boundary - check if we need previous word's content
      if (startWord.index > 0 && !isBreaker(this.words[startWord.index - 1])) {
        startWord.index--;
        const previousWord = this.words[startWord.index];
        previousWord.runs((run) => prefix.push(run));
      }
    } else {
      // Within word - get content before start
      startWord.word.runs((run) => prefix.push(run), { end: startWord.offset });
    }

    // Get suffix (content after end within the word)
    let suffix: Run[] = [];

    if (end === endWord.ordinal) {
      // At word boundary
      if (end === this.frame!.length - 1 || isBreaker(endWord.word)) {
        // At end of doc or at a breaker - no suffix needed, decrement index
        suffix = [];
        endWord.index--;
      } else {
        // Include the word at the boundary in suffix
        endWord.word.runs((run) => suffix.push(run));
      }
    } else {
      // Within word - get content after end
      endWord.word.runs((run) => suffix.push(run), { start: endWord.offset });
    }

    const oldLength = this.frame!.length;

    // Combine prefix + text + suffix and consolidate
    const combined = [...prefix, ...textRuns, ...suffix];
    const consolidated = [...consolidateRuns(combined)];

    this.spliceWordsWithRuns(
      startWord.index,
      endWord.index - startWord.index + 1,
      consolidated
    );

    return this.frame ? this.frame.length - oldLength : 0;
  },

  /**
   * Register an edit filter
   */
  registerEditFilter(this: DocumentImpl, filter: EditFilter): void {
    this.editFilters.push(filter);
  },

  /**
   * Get/set document width (legacy method, kept for backward compatibility)
   * @deprecated Use the width property getter/setter instead
   */
  width(this: DocumentImpl, width?: number): number | void {
    if (width === undefined) {
      return this._width;
    }
    this._width = width;
    this.layout();
  },

  /**
   * Get document width
   */
  getWidth(this: DocumentImpl): number {
    return this._width;
  },

  /**
   * Set document width
   */
  setWidth(this: DocumentImpl, value: number): void {
    if (value !== this._width) {
      this._width = value;
      this.layout();
    }
  },

  /**
   * Get document height (calculated from content)
   */
  getHeight(this: DocumentImpl): number {
    return this.frame?.bounds().h ?? 0;
  },

  /**
   * Get document children (the frame)
   */
  children(this: DocumentImpl): CarotaNode[] {
    return this.frame ? [this.frame] : [];
  },

  /**
   * Toggle caret visibility (for blinking)
   */
  toggleCaret(this: DocumentImpl): boolean {
    const old = this.caretVisible;

    if (this.selection.start === this.selection.end) {
      if (this.selectionJustChanged) {
        this.selectionJustChanged = false;
      } else {
        this.caretVisible = !this.caretVisible;
      }
    }

    return this.caretVisible !== old;
  },

  /**
   * Get the caret coordinates for a given ordinal
   */
  getCaretCoords(this: DocumentImpl, ordinal: number): Rect | undefined {
    const node = this.byOrdinal(ordinal) as CarotaNode & { block?: boolean; newLine?: boolean };

    if (node) {
      let b: Rect;

      if (node.block && ordinal > 0) {
        const nodeBefore = this.byOrdinal(ordinal - 1) as CarotaNode & { newLine?: boolean };

        if (nodeBefore.newLine) {
          const newLineBounds = nodeBefore.bounds();
          const lineBounds = nodeBefore.parent()?.parent()?.bounds();

          if (lineBounds) {
            b = createRect(lineBounds.l, lineBounds.b, 1, newLineBounds.h);
          } else {
            b = createRect(newLineBounds.l, newLineBounds.t, 1, newLineBounds.h);
          }
        } else {
          const beforeBounds = nodeBefore.bounds();
          b = createRect(beforeBounds.r, beforeBounds.t, 1, beforeBounds.h);
        }
      } else {
        const bounds = node.bounds();
        if (bounds.h) {
          b = createRect(bounds.l, bounds.t, 1, bounds.h);
        } else {
          b = createRect(bounds.l, bounds.t, bounds.w, 1);
        }
      }

      return b;
    }

    return undefined;
  },

  /**
   * Find a node by coordinate
   */
  byCoordinate(this: DocumentImpl, x: number, y: number): CarotaNode {
    if (!this.frame) return this;

    let ordinal = this.frame.byCoordinate(x, y).ordinal;
    let caret = this.getCaretCoords(ordinal);

    while (caret && caret.b <= y && ordinal < this.frame.length - 1) {
      ordinal++;
      caret = this.getCaretCoords(ordinal);
    }

    while (caret && caret.t >= y && ordinal > 0) {
      ordinal--;
      caret = this.getCaretCoords(ordinal);
    }

    return this.byOrdinal(ordinal);
  },

  /**
   * Draw the selection highlight
   */
  drawSelection(this: DocumentImpl, ctx: CanvasRenderingContext2D, hasFocus: boolean): void {
    if (this.selection.end === this.selection.start) {
      // Caret
      if (this.selectionJustChanged || (hasFocus && this.caretVisible)) {
        const caret = this.getCaretCoords(this.selection.start);

        if (caret) {
          ctx.save();
          ctx.fillStyle = 'black';
          caret.fill(ctx);
          ctx.restore();
        }
      }
    } else {
      // Selection range
      ctx.save();
      ctx.fillStyle = hasFocus ? 'rgba(0, 100, 200, 0.3)' : 'rgba(160, 160, 160, 0.3)';

      this.selectedRange().parts((part) => {
        // Use .call() to preserve 'this' binding when calling bounds method
        const partBounds = part.bounds as (minimal?: boolean) => Rect;
        partBounds.call(part, true).fill(ctx);
      });

      ctx.restore();
    }
  },

  /**
   * Fire the selectionChanged event (both legacy and modern)
   */
  notifySelectionChanged(this: DocumentImpl, takeFocus?: boolean): void {
    let cachedFormatting: MergedFormatting | null = null;

    const getFormatting = (): MergedFormatting => {
      if (!cachedFormatting) {
        cachedFormatting = this.selectedRange().getFormatting();
      }
      return cachedFormatting;
    };

    // Fire legacy event
    this.selectionChanged.fire(getFormatting, takeFocus);

    // Fire modern event
    this._events.emit('selectionChange', getFormatting());
  },

  /**
   * Emit content change event (both legacy and modern)
   */
  emitChange(this: DocumentImpl): void {
    // Fire legacy event
    this.contentChanged.fire();
    // Fire modern event
    this._events.emit('change');
  },

  /**
   * Set the selection
   */
  select(this: DocumentImpl, ordinal: number, ordinalEnd?: number, takeFocus?: boolean): void {
    if (!this.frame) {
      // Something has gone wrong - transaction will rollback
      return;
    }

    this.selection.start = Math.max(0, ordinal);
    this.selection.end = Math.min(
      typeof ordinalEnd === 'number' ? ordinalEnd : this.selection.start,
      this.frame.length - 1
    );

    this.selectionJustChanged = true;
    this.caretVisible = true;
    this.nextInsertFormatting = {};

    this.notifySelectionChanged(takeFocus);
  },

  /**
   * Perform undo or redo
   */
  performUndo(this: DocumentImpl, redo?: boolean): void {
    const fromStack = redo ? this._redoStack : this._undoStack;
    const toStack = redo ? this._undoStack : this._redoStack;
    const oldCommand = fromStack.pop();

    if (oldCommand) {
      oldCommand((newCommand) => {
        toStack.push(newCommand);
      });
      this.layout();
      this.emitChange();
    }
  },

  /**
   * Check if undo/redo is available
   */
  canUndo(this: DocumentImpl, redo?: boolean): boolean {
    return redo ? !!this._redoStack.length : !!this._undoStack.length;
  },

  /**
   * Convenience method for undo (calls performUndo)
   */
  undo(this: DocumentImpl): void {
    this.performUndo(false);
  },

  /**
   * Convenience method for redo (calls performUndo(true))
   */
  redo(this: DocumentImpl): void {
    this.performUndo(true);
  },

  /**
   * Check if redo is available (convenience method)
   */
  canRedo(this: DocumentImpl): boolean {
    return this.canUndo(true);
  },

  /**
   * Execute a transaction (for undo support)
   */
  transaction(this: DocumentImpl, perform: (log: TransactionLog) => void): void {
    if (this._currentTransaction) {
      perform(this._currentTransaction);
    } else {
      // Limit undo stack
      while (this._undoStack.length > 50) {
        this._undoStack.shift();
      }

      this._redoStack.length = 0;
      let changed = false;

      this._undoStack.push(
        makeTransaction((log) => {
          this._currentTransaction = log;

          try {
            perform(log);
          } finally {
            changed = log.length > 0;
            this._currentTransaction = undefined;
          }
        })
      );

      if (changed) {
        this.layout();
        this.emitChange();
      }
    }
  },

  // ==========================================================================
  // Modern Event System (Phase 2)
  // ==========================================================================

  /**
   * Subscribe to a document event
   *
   * @param event - Event name ('change' or 'selectionChange')
   * @param handler - Event handler function
   *
   * @example
   * // React useEffect pattern
   * useEffect(() => {
   *   const handler = () => console.log('changed');
   *   doc.on('change', handler);
   *   return () => doc.off('change', handler);
   * }, [doc]);
   */
  on<K extends keyof DocumentEventsMap>(
    this: DocumentImpl,
    event: K,
    handler: (...args: DocumentEventsMap[K]) => void
  ): void {
    this._events.on(event, handler);
  },

  /**
   * Unsubscribe from a document event
   *
   * @param event - Event name
   * @param handler - The same handler function that was passed to on()
   */
  off<K extends keyof DocumentEventsMap>(
    this: DocumentImpl,
    event: K,
    handler: (...args: DocumentEventsMap[K]) => void
  ): void {
    this._events.off(event, handler);
  },

  // ==========================================================================
  // Render Method (Phase 2)
  // ==========================================================================

  /**
   * Render the document to a canvas.
   *
   * This method allows headless rendering without DOM attachment.
   * Ideal for Three.js texture rendering or server-side rendering.
   *
   * @param options - Render options
   * @param options.canvas - Target canvas (HTMLCanvasElement or OffscreenCanvas)
   * @param options.dpr - Device pixel ratio (default 1)
   *
   * @example
   * const doc = createDocument({ width: 500 });
   * doc.load([{ text: 'Hello', bold: true }]);
   *
   * const canvas = document.createElement('canvas');
   * doc.render({ canvas, dpr: window.devicePixelRatio });
   *
   * // For Three.js texture
   * const texture = new THREE.CanvasTexture(canvas);
   */
  render(this: DocumentImpl, options: RenderOptions): void {
    const { canvas, dpr = 1 } = options;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;

    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }

    // Calculate dimensions
    const docHeight = this.getHeight();
    const docWidth = this._width;

    // Set canvas size with DPI scaling
    canvas.width = docWidth * dpr;
    canvas.height = docHeight * dpr;

    // Scale context for DPI
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, docWidth, docHeight);

    // Draw content
    const viewPort = createRect(0, 0, docWidth, docHeight);
    this.draw(ctx, viewPort);

    // Reset scale (for subsequent operations)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  },

  // ==========================================================================
  // Formatting Methods (Phase 2)
  // ==========================================================================

  /**
   * Get formatting at current selection
   */
  getFormatting(this: DocumentImpl): MergedFormatting {
    return this.selectedRange().getFormatting();
  },

  /**
   * Apply formatting to current selection
   */
  setFormatting(this: DocumentImpl, formatting: Partial<Run>): void {
    const range = this.selectedRange();
    Object.entries(formatting).forEach(([key, value]) => {
      if (key !== 'text') {
        range.setFormatting(key, value);
      }
    });
  },

  /**
   * Get plain text content
   */
  plainText(this: DocumentImpl): string {
    return this.documentRange().plainText();
  },
});

// =============================================================================
// Factory Function
// =============================================================================

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
export function createDocument(options?: DocumentOptions): PublicDocument {
  const doc = Object.create(documentPrototype) as DocumentImpl;

  doc._width = options?.width ?? 0;
  doc.selection = { start: 0, end: 0 };
  doc.caretVisible = true;
  doc.selectionJustChanged = false;
  doc.words = [];
  doc.frame = null;
  doc._undoStack = [];
  doc._redoStack = [];
  doc._wordOrdinals = [];
  doc.nextInsertFormatting = {};

  // Custom code handler (user can override)
  doc.customCodes = () => undefined;

  // Main code handler
  doc.codes = (code: CodeObject, data?: unknown) => {
    const instance = handleCode(code, data, doc.codes);
    return instance || doc.customCodes(code, data, doc.codes);
  };

  // Modern event system (Phase 2)
  doc._events = new EventManager<DocumentEventsMap>();

  // Legacy events (for backward compatibility)
  doc.selectionChanged = createEvent<[() => MergedFormatting, boolean?]>();
  doc.contentChanged = createEvent<[]>();

  // Edit filters (for list balancing, etc.)
  doc.editFilters = [editFilter as unknown as EditFilter];

  // Load empty document
  doc.load([]);

  // Define width and height as properties using Object.defineProperty
  Object.defineProperty(doc, 'width', {
    get() {
      return this._width;
    },
    set(value: number) {
      if (value !== this._width) {
        this._width = value;
        this.layout();
      }
    },
    enumerable: true,
    configurable: true,
  });

  Object.defineProperty(doc, 'height', {
    get() {
      return this.frame?.bounds().h ?? 0;
    },
    enumerable: true,
    configurable: true,
  });

  // Cast to PublicDocument since Object.defineProperty adds width/height at runtime
  // and prototype has undo/redo/canRedo methods
  return doc as unknown as PublicDocument;
}

// Export types
export type { DocumentImpl as Document };
export type { DocumentEventsMap as DocumentEvents };
// DocumentEventType already exported at line 82

// Default export
export default createDocument;
