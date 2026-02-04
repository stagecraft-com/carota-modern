/**
 * @stagecraft/carota
 *
 * Modern TypeScript + ESM canvas-based rich text editor.
 * Originally based on Carota by Daniel Earwicker.
 *
 * Phase 2: Added headless Document API with render() method
 * and modern event system (on/off pattern).
 */
export type { Run, CodeObject, TextContent, TextAlign, TextScript, PartialFormatting, MergedFormatting, DefaultFormatting, FormattingKey, TextMeasurement, Bounds, Point, NodeType, CarotaNode, Selection, Part, Section, Word, Character, WordCoords, InlineCode, BlockCode, CodeHandler, DocumentOptions, EditorOptions, RenderOptions, EventEmitter, DocumentEvents, DocumentEventType, Document, Editor, Range, } from './types';
export { MULTIPLE_VALUES } from './types';
export { createDocument } from './document/Document';
export type { DocumentEvents as DocEvents, DocumentEventType as DocEventType } from './document/Document';
export { createRange } from './document/Range';
export { createEditor } from './editor/Editor';
export type { Editor as EditorInstance } from './editor/Editor';
export { EventManager } from './util/EventManager';
export { createRect, rect } from './render/Rect';
export type { Rect } from './render/Rect';
export { parseHtml, parse } from './html/Html';
export type { ClassFormatting } from './html/Html';
export { formattingKeys, defaultFormatting, sameFormatting, cloneRun, mergeFormatting, formatRuns, consolidateRuns, getPlainText, getTextLength, getTextChar, getSubText, getPieceLength, getPiecePlainText, pieceCharacters, isCodeObject, } from './model/Run';
export { measureText, measure, createCachedMeasureText, cachedMeasureText, drawText, draw, getFontString, applyRunStyle, prepareContext, getRunStyle, nbsp, enter, } from './render/Text';
export { createEvent } from './util/Util';
export { handleCode, editFilter } from './codes/Codes';
//# sourceMappingURL=index.d.ts.map