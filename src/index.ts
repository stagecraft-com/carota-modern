/**
 * @stagecraft/carota
 *
 * Modern TypeScript + ESM canvas-based rich text editor.
 * Originally based on Carota by Daniel Earwicker.
 *
 * Phase 2: Added headless Document API with render() method
 * and modern event system (on/off pattern).
 */

// =============================================================================
// Type Exports
// =============================================================================

export type {
  // Core content types
  Run,
  CodeObject,
  TextContent,
  TextAlign,
  TextScript,

  // Formatting types
  PartialFormatting,
  MergedFormatting,
  DefaultFormatting,
  FormattingKey,

  // Measurement types
  TextMeasurement,
  Bounds,
  Point,

  // Node types
  NodeType,
  CarotaNode,
  Selection,

  // Word/Part types
  Part,
  Section,
  Word,
  Character,
  WordCoords,

  // Code types
  InlineCode,
  BlockCode,
  CodeHandler,

  // Document/Editor types
  DocumentOptions,
  EditorOptions,
  RenderOptions,
  EventEmitter,

  // Phase 2 API types
  DocumentEvents,
  DocumentEventType,
  Document,
  Editor,
  Range,
} from './types';

// Re-export MULTIPLE_VALUES symbol
export { MULTIPLE_VALUES } from './types';

// =============================================================================
// Document
// =============================================================================

export { createDocument } from './document/Document';

// Re-export Document events types from Document module
export type { DocumentEvents as DocEvents, DocumentEventType as DocEventType } from './document/Document';

export { createRange } from './document/Range';

// =============================================================================
// Editor
// =============================================================================

export { createEditor } from './editor/Editor';

// Re-export Editor type from Editor module
export type { Editor as EditorInstance } from './editor/Editor';

// =============================================================================
// Utilities
// =============================================================================

// EventManager (Phase 2)
export { EventManager } from './util/EventManager';

// Rect
export { createRect, rect } from './render/Rect';
export type { Rect } from './render/Rect';

// HTML Parser
export { parseHtml, parse } from './html/Html';
export type { ClassFormatting } from './html/Html';

// =============================================================================
// Run Utilities
// =============================================================================

export {
  // Constants
  formattingKeys,
  defaultFormatting,

  // Comparison
  sameFormatting,

  // Manipulation
  cloneRun,
  mergeFormatting,
  formatRuns,
  consolidateRuns,

  // Text utilities
  getPlainText,
  getTextLength,
  getTextChar,
  getSubText,
  getPieceLength,
  getPiecePlainText,
  pieceCharacters,
  isCodeObject,
} from './model/Run';

// =============================================================================
// Text Utilities
// =============================================================================

export {
  // Measurement
  measureText,
  measure,
  createCachedMeasureText,
  cachedMeasureText,

  // Rendering
  drawText,
  draw,

  // Styling
  getFontString,
  applyRunStyle,
  prepareContext,
  getRunStyle,

  // Constants
  nbsp,
  enter,
} from './render/Text';

// =============================================================================
// Event Utilities
// =============================================================================

export { createEvent } from './util/Util';

// =============================================================================
// Code Handling
// =============================================================================

export { handleCode, editFilter } from './codes/Codes';
