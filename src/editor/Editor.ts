/**
 * Editor for @stagecraft/carota
 *
 * Interactive rich text editor with canvas rendering.
 * Extends Document with DOM-specific functionality:
 * - Canvas setup and rendering
 * - Keyboard handling
 * - Mouse handling
 * - Clipboard operations
 * - Focus management
 *
 * Phase 2: Editor now properly extends Document via prototype chain.
 */

import type { Run, CarotaNode, MergedFormatting, Word, EditorOptions, RenderOptions, Selection, Bounds, EventEmitter } from '../types';
import { createRect, type Rect } from '../render/Rect';
import { createDocument, type Document, type DocumentEvents } from '../document/Document';
import { Range } from '../document/Range';
import {
  effectiveStyle,
  handleEvent,
  handleMouseEvent,
} from '../util/Dom';

// =============================================================================
// Global Timer
// =============================================================================

// Shared timer for all editors (for caret blinking)
if (typeof document !== 'undefined') {
  setInterval(() => {
    const editors = document.querySelectorAll('.carotaEditorCanvas');

    const ev = document.createEvent('Event');
    ev.initEvent('carotaEditorSharedTimer', true, true);

    for (let n = 0; n < editors.length; n++) {
      editors[n].dispatchEvent(ev);
    }
  }, 200);
}

// =============================================================================
// Types
// =============================================================================

/**
 * Editor interface - extends Document with DOM-specific methods
 *
 * The Editor interface represents an interactive rich text editor.
 * It includes all Document functionality plus DOM-specific features.
 */
export interface Editor {
  // ===== Editor-specific methods =====

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

  // ===== Document methods (inherited) =====

  // Content
  load(runs: Run[], takeFocus?: boolean): void;
  save(): Run[];
  insert(text: Run[] | string, takeFocus?: boolean): void;
  plainText(): string;

  // Dimensions
  width: number;
  readonly height: number;

  // Selection
  select(start: number, end?: number, takeFocus?: boolean): void;
  readonly selection: Selection;
  selectedRange(): Range;
  range(start: number, end: number): Range;

  // Formatting
  getFormatting(): MergedFormatting;
  setFormatting(formatting: Partial<Run>): void;

  // Rendering
  render(options: RenderOptions): void;
  draw(ctx: CanvasRenderingContext2D, viewPort?: Bounds): void;
  drawSelection(ctx: CanvasRenderingContext2D, hasFocus: boolean): void;

  // Events
  on<K extends keyof DocumentEvents>(event: K, handler: (...args: DocumentEvents[K]) => void): void;
  off<K extends keyof DocumentEvents>(event: K, handler: (...args: DocumentEvents[K]) => void): void;

  // Undo/Redo
  performUndo(redo?: boolean): void;
  canUndo(redo?: boolean): boolean;

  // Internal/Advanced
  readonly frame: CarotaNode | null;
  selectionChanged: EventEmitter<[() => MergedFormatting, boolean?]>;
  contentChanged: EventEmitter<[]>;
  getCaretCoords(ordinal: number): Rect | undefined;
  wordContainingOrdinal(ordinal: number): { word: Word; ordinal: number; index: number; offset: number } | undefined;
  wordOrdinal(index: number): number;
  toggleCaret(): boolean;
  byOrdinal(ordinal: number): CarotaNode;
  byCoordinate(x: number, y: number): CarotaNode;
}

/**
 * Key toggles for formatting shortcuts
 */
const toggles: Record<number, string> = {
  66: 'bold', // B
  73: 'italic', // I
  85: 'underline', // U
  83: 'strikeout', // S
};

// =============================================================================
// Editor Factory
// =============================================================================

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
export function createEditor(element: HTMLElement, options?: EditorOptions): Editor;

/**
 * Legacy signature: Create an interactive editor with just an element.
 * @deprecated Use createEditor(element, options) instead
 */
export function createEditor(element: HTMLElement): Editor;

/**
 * Implementation of createEditor
 */
export function createEditor(
  elementOrOptions: HTMLElement | EditorOptions,
  maybeOptions?: EditorOptions
): Editor {
  // Handle both old and new signatures
  let element: HTMLElement;
  let options: EditorOptions | undefined;

  if (elementOrOptions instanceof HTMLElement) {
    element = elementOrOptions;
    options = maybeOptions;
  } else {
    // Options object with element property
    options = elementOrOptions;
    element = options.element;
  }

  // Ensure the host element is a container
  if (effectiveStyle(element, 'position') !== 'absolute') {
    element.style.position = 'relative';
  }

  // Create editor HTML structure
  element.innerHTML =
    '<div class="carotaSpacer">' +
    '<canvas width="100" height="100" class="carotaEditorCanvas" style="position: absolute;"></canvas>' +
    '</div>' +
    '<div class="carotaTextArea" style="overflow: hidden; position: absolute; height: 0;">' +
    '<textarea autocorrect="off" autocapitalize="off" spellcheck="false" tabindex="0" ' +
    'style="position: absolute; padding: 0px; width: 1000px; height: 1em; ' +
    'outline: none; font-size: 4px;"></textarea>' +
    '</div>';

  // Get DOM elements
  const canvas = element.querySelector('canvas') as HTMLCanvasElement;
  const spacer = element.querySelector('.carotaSpacer') as HTMLDivElement;
  const textAreaDiv = element.querySelector('.carotaTextArea') as HTMLDivElement;
  const textArea = element.querySelector('textarea') as HTMLTextAreaElement;

  // Create the underlying document with width option
  const doc = createDocument({ width: options?.width ?? 0 }) as unknown as Editor;

  // Editor state
  let keyboardSelect = 0;
  let keyboardX: number | null = null;
  let nextKeyboardX: number | null = null;
  let selectDragStart: number | null = null;
  let focusChar: number | null = null;
  let textAreaContent = '';
  let richClipboard: Run[] | null = null;
  let plainClipboard: string | null = null;
  let verticalAlignment: 'top' | 'middle' | 'bottom' = options?.verticalAlign ?? 'top';

  // =============================================================================
  // Helper Functions
  // =============================================================================

  /**
   * Check if we've reached the end of the document
   */
  function exhausted(ordinal: number, direction: number): boolean {
    return direction < 0 ? ordinal <= 0 : ordinal >= doc.frame!.length - 1;
  }

  /**
   * Check if two caret positions are on different lines
   */
  function differentLine(caret1: Rect, caret2: Rect): boolean {
    return caret1.b <= caret2.t || caret2.b <= caret1.t;
  }

  /**
   * Move to a different line
   */
  function changeLine(ordinal: number, direction: number): number {
    const originalCaret = doc.getCaretCoords(ordinal);
    if (!originalCaret) return ordinal;

    nextKeyboardX = keyboardX !== null ? keyboardX : originalCaret.l;
    let newCaret: Rect | undefined;

    // Move to different line
    while (!exhausted(ordinal, direction)) {
      ordinal += direction;
      newCaret = doc.getCaretCoords(ordinal);
      if (newCaret && differentLine(newCaret, originalCaret)) {
        break;
      }
    }

    // Find position closest to keyboardX
    const lineCaret = newCaret || originalCaret;
    while (!exhausted(ordinal, direction)) {
      if (
        (direction > 0 && lineCaret.l >= nextKeyboardX!) ||
        (direction < 0 && lineCaret.l <= nextKeyboardX!)
      ) {
        break;
      }

      ordinal += direction;
      newCaret = doc.getCaretCoords(ordinal);
      if (newCaret && differentLine(newCaret, lineCaret)) {
        ordinal -= direction;
        break;
      }
    }

    return ordinal;
  }

  /**
   * Move to the end of the current line
   */
  function endOfLine(ordinal: number, direction: number): number {
    const originalCaret = doc.getCaretCoords(ordinal);
    if (!originalCaret) return ordinal;

    while (!exhausted(ordinal, direction)) {
      ordinal += direction;
      const newCaret = doc.getCaretCoords(ordinal);
      if (newCaret && differentLine(newCaret, originalCaret)) {
        ordinal -= direction;
        break;
      }
    }

    return ordinal;
  }

  /**
   * Get the vertical offset for alignment
   */
  function getVerticalOffset(): number {
    const docHeight = doc.frame!.bounds().h;
    if (docHeight < element.clientHeight) {
      switch (verticalAlignment) {
        case 'middle':
          return (element.clientHeight - docHeight) / 2;
        case 'bottom':
          return element.clientHeight - docHeight;
      }
    }
    return 0;
  }

  // =============================================================================
  // Paint Function
  // =============================================================================

  function paint(): void {
    const availableWidth = element.clientWidth;

    // Use the width property (Phase 2)
    if (doc.width !== availableWidth) {
      doc.width = availableWidth;
    }

    const docHeight = doc.frame!.bounds().h;
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const logicalWidth = Math.max((doc.frame as CarotaNode & { actualWidth?(): number })?.actualWidth?.() || 0, element.clientWidth);
    const logicalHeight = element.clientHeight;

    canvas.width = dpr * logicalWidth;
    canvas.height = dpr * logicalHeight;
    canvas.style.width = logicalWidth + 'px';
    canvas.style.height = logicalHeight + 'px';

    canvas.style.top = element.scrollTop + 'px';
    spacer.style.width = logicalWidth + 'px';
    spacer.style.height = Math.max(docHeight, element.clientHeight) + 'px';

    // Toggle overflow based on content size
    if (docHeight < element.clientHeight - 50 && ((doc.frame as CarotaNode & { actualWidth?(): number })?.actualWidth?.() || 0) <= availableWidth) {
      element.style.overflow = 'hidden';
    } else {
      element.style.overflow = 'auto';
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    ctx.translate(0, getVerticalOffset() - element.scrollTop);

    doc.draw(ctx, createRect(0, element.scrollTop, logicalWidth, logicalHeight));
    doc.drawSelection(ctx, selectDragStart !== null || globalThis.document.activeElement === textArea);
  }

  // =============================================================================
  // Key Handler
  // =============================================================================

  function handleKey(key: number, selecting: boolean, ctrlKey: boolean): boolean {
    let start = doc.selection.start;
    let end = doc.selection.end;
    const length = doc.frame!.length - 1;
    let handled = false;

    nextKeyboardX = null;

    if (!selecting) {
      keyboardSelect = 0;
    } else if (!keyboardSelect) {
      switch (key) {
        case 37: // left arrow
        case 38: // up
        case 36: // home
        case 33: // page up
          keyboardSelect = -1;
          break;
        case 39: // right arrow
        case 40: // down
        case 35: // end
        case 34: // page down
          keyboardSelect = 1;
          break;
      }
    }

    let ordinal = keyboardSelect === 1 ? end : start;
    let changingCaret = false;

    switch (key) {
      case 37: // left arrow
        if (!selecting && start !== end) {
          ordinal = start;
        } else if (ordinal > 0) {
          if (ctrlKey) {
            const wordInfo = doc.wordContainingOrdinal(ordinal);
            if (wordInfo) {
              if (wordInfo.ordinal === ordinal) {
                ordinal = wordInfo.index > 0 ? doc.wordOrdinal(wordInfo.index - 1) : 0;
              } else {
                ordinal = wordInfo.ordinal;
              }
            }
          } else {
            ordinal--;
          }
        }
        changingCaret = true;
        break;

      case 39: // right arrow
        if (!selecting && start !== end) {
          ordinal = end;
        } else if (ordinal < length) {
          if (ctrlKey) {
            const wordInfo = doc.wordContainingOrdinal(ordinal);
            if (wordInfo) {
              ordinal = wordInfo.ordinal + wordInfo.word.length;
            }
          } else {
            ordinal++;
          }
        }
        changingCaret = true;
        break;

      case 40: // down arrow
        ordinal = changeLine(ordinal, 1);
        changingCaret = true;
        break;

      case 38: // up arrow
        ordinal = changeLine(ordinal, -1);
        changingCaret = true;
        break;

      case 36: // home
        ordinal = endOfLine(ordinal, -1);
        changingCaret = true;
        break;

      case 35: // end
        ordinal = endOfLine(ordinal, 1);
        changingCaret = true;
        break;

      case 33: // page up
        ordinal = 0;
        changingCaret = true;
        break;

      case 34: // page down
        ordinal = length;
        changingCaret = true;
        break;

      case 8: // backspace
        if (start === end && start > 0) {
          doc.range(start - 1, start).clear();
          focusChar = start - 1;
          doc.select(focusChar, focusChar);
          handled = true;
        }
        break;

      case 46: // delete
        if (start === end && start < length) {
          doc.range(start, start + 1).clear();
          handled = true;
        }
        break;

      case 90: // Z - undo
        if (ctrlKey) {
          handled = true;
          doc.performUndo();
        }
        break;

      case 89: // Y - redo
        if (ctrlKey) {
          handled = true;
          doc.performUndo(true);
        }
        break;

      case 65: // A - select all
        if (ctrlKey) {
          handled = true;
          doc.select(0, length);
        }
        break;

      case 67: // C - copy
      case 88: // X - cut
        if (ctrlKey) {
          richClipboard = doc.selectedRange().save();
          plainClipboard = doc.selectedRange().plainText();
        }
        break;
    }

    // Handle formatting toggles
    const toggle = toggles[key];
    if (ctrlKey && toggle) {
      const selRange = doc.selectedRange();
      const currentValue = selRange.getFormatting()[toggle as keyof MergedFormatting];
      selRange.setFormatting(toggle, currentValue !== true);
      paint();
      handled = true;
    }

    // Update selection if caret changed
    if (changingCaret) {
      switch (keyboardSelect) {
        case 0:
          start = end = ordinal;
          break;
        case -1:
          start = ordinal;
          break;
        case 1:
          end = ordinal;
          break;
      }

      if (start === end) {
        keyboardSelect = 0;
      } else if (start > end) {
        keyboardSelect = -keyboardSelect;
        [start, end] = [end, start];
      }

      focusChar = ordinal;
      doc.select(start, end);
      handled = true;
    }

    keyboardX = nextKeyboardX;
    return handled;
  }

  // =============================================================================
  // Text Area Management
  // =============================================================================

  function updateTextArea(): void {
    focusChar = focusChar === null ? doc.selection.end : focusChar;
    const endChar = doc.byOrdinal(focusChar);
    focusChar = null;

    if (endChar) {
      const bounds = endChar.bounds();
      textAreaDiv.style.left = bounds.l + 'px';
      textAreaDiv.style.top = bounds.t + 'px';
      textArea.focus();

      // Scroll into view
      const scrollDownBy = Math.max(
        0,
        bounds.t + bounds.h - (element.scrollTop + element.clientHeight)
      );
      if (scrollDownBy) {
        element.scrollTop += scrollDownBy;
      }

      const scrollUpBy = Math.max(0, element.scrollTop - bounds.t);
      if (scrollUpBy) {
        element.scrollTop -= scrollUpBy;
      }

      const scrollRightBy = Math.max(
        0,
        bounds.l - (element.scrollLeft + element.clientWidth)
      );
      if (scrollRightBy) {
        element.scrollLeft += scrollRightBy;
      }

      const scrollLeftBy = Math.max(0, element.scrollLeft - bounds.l);
      if (scrollLeftBy) {
        element.scrollLeft -= scrollLeftBy;
      }
    }

    textAreaContent = doc.selectedRange().plainText();
    textArea.value = textAreaContent;
    textArea.select();

    setTimeout(() => {
      textArea.focus();
    }, 10);
  }

  // =============================================================================
  // Event Handlers
  // =============================================================================

  // Keyboard input
  handleEvent(textArea, 'keydown', (ev: KeyboardEvent) => {
    if (handleKey(ev.keyCode, ev.shiftKey, ev.ctrlKey || ev.metaKey)) {
      return false;
    }
  });

  // Text input
  handleEvent(textArea, 'input', () => {
    const newText = textArea.value;

    if (textAreaContent !== newText) {
      textAreaContent = '';
      textArea.value = '';

      // Check for rich clipboard paste
      if (newText === plainClipboard && richClipboard) {
        doc.insert(richClipboard);
      } else {
        doc.insert(newText);
      }
    }
  });

  // Scroll
  handleEvent(element, 'scroll', paint);

  // Selection changed - use legacy event for Editor (it needs the takeFocus parameter)
  doc.selectionChanged((getFormatting, takeFocus) => {
    paint();
    if (!selectDragStart && takeFocus !== false) {
      updateTextArea();
    }
  });

  // Mouse events
  function registerMouseEvent(
    name: 'mousedown' | 'mouseup' | 'mousemove' | 'dblclick',
    handler: (node: CarotaNode) => void
  ): void {
    handleMouseEvent(spacer, name, (ev, x, y) => {
      const node = doc.byCoordinate(x, y - getVerticalOffset());
      handler(node);
    });
  }

  registerMouseEvent('mousedown', (node) => {
    selectDragStart = node.ordinal;
    doc.select(node.ordinal, node.ordinal);
    keyboardX = null;
  });

  registerMouseEvent('dblclick', (node) => {
    const parent = node.parent();
    if (parent) {
      const wordParent = parent as { word?: { text: { length: number } } };
      doc.select(
        parent.ordinal,
        parent.ordinal + (wordParent.word ? wordParent.word.text.length : parent.length)
      );
    }
  });

  registerMouseEvent('mousemove', (node) => {
    if (selectDragStart !== null && node) {
      focusChar = node.ordinal;
      if (selectDragStart > node.ordinal) {
        doc.select(node.ordinal, selectDragStart);
      } else {
        doc.select(selectDragStart, node.ordinal);
      }
    }
  });

  registerMouseEvent('mouseup', () => {
    selectDragStart = null;
    keyboardX = null;
    updateTextArea();
    textArea.focus();
  });

  // =============================================================================
  // Timer for caret blinking and resize detection
  // =============================================================================

  let nextCaretToggle = new Date().getTime();
  let focused = false;
  let cachedWidth = element.clientWidth;
  let cachedHeight = element.clientHeight;

  function update(): void {
    let requirePaint = false;

    // Check focus change
    const newFocused = globalThis.document.activeElement === textArea;
    if (focused !== newFocused) {
      focused = newFocused;
      requirePaint = true;
    }

    // Caret blink
    const now = new Date().getTime();
    if (now > nextCaretToggle) {
      nextCaretToggle = now + 500;
      if (doc.toggleCaret()) {
        requirePaint = true;
      }
    }

    // Resize detection
    if (element.clientWidth !== cachedWidth || element.clientHeight !== cachedHeight) {
      requirePaint = true;
      cachedWidth = element.clientWidth;
      cachedHeight = element.clientHeight;
    }

    if (requirePaint) {
      paint();
    }
  }

  handleEvent(canvas, 'carotaEditorSharedTimer' as keyof HTMLElementEventMap, update);
  update();

  // =============================================================================
  // Editor-Specific Methods
  // =============================================================================

  // Add editor-specific methods to the document
  doc.sendKey = handleKey;

  doc.setVerticalAlignment = (va: 'top' | 'middle' | 'bottom') => {
    verticalAlignment = va;
    paint();
  };

  doc.focus = () => {
    textArea.focus();
  };

  doc.blur = () => {
    textArea.blur();
  };

  doc.hasFocus = () => {
    return globalThis.document.activeElement === textArea;
  };

  return doc;
}

// Editor interface already exported at definition (line 61)

// Default export
export default createEditor;
