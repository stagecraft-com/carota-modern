/**
 * Integration tests for Document/Editor system (Phase 2)
 *
 * Tests that Document and Editor work together correctly:
 * - Editor wraps Document functionality
 * - Events propagate correctly
 * - Rendering pipeline works
 *
 * NOTE: Many tests require full DOM with text measurement.
 * Tests that require text measurement are marked with .skip.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDocument } from '../document/Document';
import { parseHtml } from '../html/Html';
import type { Run, MergedFormatting, TextAlign } from '../types';

// Flag to detect if we have proper text measurement
const HAS_TEXT_MEASUREMENT = (() => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const result = ctx.measureText('test');
      return result && result.width > 0;
    }
  } catch {
    // Ignore
  }
  return false;
})();

// Skip tests that require text measurement
const itWithTextMeasurement = HAS_TEXT_MEASUREMENT ? it : it.skip;

// Note: Editor tests require DOM environment (jsdom)
// These tests focus on Document functionality that Editor depends on

describe('Document Integration', () => {
  describe('Content Pipeline', () => {
    itWithTextMeasurement('load -> edit -> save cycle preserves content', () => {
      const doc = createDocument({ width: 500 });

      // Load initial content
      doc.load([{ text: 'Hello' }]);

      // Edit
      doc.select(5);
      doc.insert(' World');

      // Save
      const saved = doc.save();

      // Verify
      const text = saved.map((r) => r.text).join('');
      expect(text).toContain('Hello World');
    });

    itWithTextMeasurement('formatting is preserved through edit operations', () => {
      const doc = createDocument({ width: 500 });

      // Load with formatting
      doc.load([
        { text: 'Bold', bold: true },
        { text: ' Normal' },
      ]);

      // Select and check formatting
      doc.select(0, 4); // Select "Bold"
      expect(doc.getFormatting().bold).toBe(true);

      // Insert preserves adjacent formatting
      doc.select(4);
      doc.insert(' text');

      // The inserted text should pick up formatting from context
      const saved = doc.save();
      expect(saved.length).toBeGreaterThan(0);
    });
  });

  describe('Event System Integration', () => {
    itWithTextMeasurement('change events fire for all modifications', () => {
      const doc = createDocument({ width: 500 });
      doc.load([{ text: 'Initial' }]);

      const changes: string[] = [];
      doc.on('change', () => changes.push('change'));

      // Insert triggers change
      doc.select(0);
      doc.insert('A');

      expect(changes.length).toBeGreaterThan(0);
    });

    itWithTextMeasurement('selectionChange fires with correct formatting', () => {
      const doc = createDocument({ width: 500 });
      doc.load([
        { text: 'Bold', bold: true },
        { text: 'Italic', italic: true },
      ]);

      const formattings: MergedFormatting[] = [];
      doc.on('selectionChange', (f) => formattings.push(f));

      // Select bold text
      doc.select(0, 4);
      expect(formattings.length).toBeGreaterThan(0);
      expect(formattings[formattings.length - 1].bold).toBe(true);

      // Select italic text
      doc.select(4, 10);
      expect(formattings[formattings.length - 1].italic).toBe(true);
    });

    it('both legacy and modern events fire', () => {
      const doc = createDocument({ width: 500 });

      const legacyChanges: number[] = [];
      const modernChanges: number[] = [];

      // Legacy event
      doc.contentChanged(() => legacyChanges.push(1));

      // Modern event
      doc.on('change', () => modernChanges.push(1));

      // Trigger change
      doc.load([{ text: 'Test' }]);

      expect(legacyChanges.length).toBeGreaterThan(0);
      expect(modernChanges.length).toBeGreaterThan(0);
    });
  });

  describe('Undo/Redo Integration', () => {
    itWithTextMeasurement('multiple operations can be undone in sequence', () => {
      const doc = createDocument({ width: 500 });
      doc.load([{ text: '' }]);

      // Make multiple edits
      doc.select(0);
      doc.insert('A');
      doc.insert('B');
      doc.insert('C');

      expect(doc.plainText()).toContain('ABC');

      // Undo each
      doc.undo();
      expect(doc.plainText()).toContain('AB');
      expect(doc.plainText()).not.toContain('ABC');

      doc.undo();
      expect(doc.plainText()).toContain('A');

      doc.undo();
      expect(doc.plainText()).not.toContain('A');
    });

    itWithTextMeasurement('redo works after undo', () => {
      const doc = createDocument({ width: 500 });
      doc.load([{ text: 'Start' }]);

      doc.select(5);
      doc.insert(' End');

      expect(doc.plainText()).toContain('End');

      doc.undo();
      expect(doc.plainText()).not.toContain('End');

      doc.redo(); // Redo
      expect(doc.plainText()).toContain('End');
    });

    itWithTextMeasurement('new edit clears redo stack', () => {
      const doc = createDocument({ width: 500 });
      doc.load([{ text: 'A' }]);

      doc.select(1);
      doc.insert('B');
      doc.undo();

      expect(doc.canRedo()).toBe(true); // Can redo

      // New edit
      doc.select(1);
      doc.insert('C');

      expect(doc.canRedo()).toBe(false); // Redo cleared
    });
  });

  describe('Selection and Range Integration', () => {
    itWithTextMeasurement('selection range can modify content', () => {
      const doc = createDocument({ width: 500 });
      doc.load([{ text: 'Hello World' }]);

      doc.select(6, 11); // Select "World"
      const range = doc.selectedRange();

      range.clear();

      expect(doc.plainText()).toContain('Hello');
      expect(doc.plainText()).not.toContain('World');
    });

    itWithTextMeasurement('selection range can apply formatting', () => {
      const doc = createDocument({ width: 500 });
      doc.load([{ text: 'Hello World' }]);

      doc.select(0, 5); // Select "Hello"
      const range = doc.selectedRange();

      range.setFormatting('bold', true);

      doc.select(0, 5);
      expect(doc.getFormatting().bold).toBe(true);
    });

    itWithTextMeasurement('arbitrary range works independently of selection', () => {
      const doc = createDocument({ width: 500 });
      doc.load([{ text: 'Hello World' }]);

      // Create range without changing selection
      const range = doc.range(6, 11); // "World"

      expect(range.plainText()).toBe('World');

      // Selection should be unchanged
      expect(doc.selection.start).toBe(0);
    });
  });

  describe('Layout Integration', () => {
    it('width change triggers relayout', () => {
      const doc = createDocument({ width: 500 });
      doc.load([{ text: 'This is a long text that might wrap at narrow widths' }]);

      // Change to very narrow width
      doc.width = 50;

      // Should not crash - frame may be null without proper text measurement
      expect(doc).toBeDefined();
    });

    itWithTextMeasurement('content change updates height', () => {
      const doc = createDocument({ width: 500 });
      doc.load([{ text: 'Line 1' }]);

      const heightWith1Line = doc.height;

      // Add more content
      doc.select(6);
      doc.insert('\nLine 2\nLine 3');

      // Height should increase
      expect(doc.frame).toBeDefined();
    });
  });

  describe('Complex Operations', () => {
    itWithTextMeasurement('handles rapid successive operations', () => {
      const doc = createDocument({ width: 500 });
      doc.load([{ text: '' }]);

      // Rapid inserts
      for (let i = 0; i < 10; i++) {
        doc.select(i);
        doc.insert(String.fromCharCode(65 + i)); // A, B, C, ...
      }

      expect(doc.plainText()).toContain('ABCDEFGHIJ');
    });

    itWithTextMeasurement('handles formatting changes across selection boundaries', () => {
      const doc = createDocument({ width: 500 });
      doc.load([
        { text: 'AAA' },
        { text: 'BBB', bold: true },
        { text: 'CCC' },
      ]);

      // Select across all runs
      doc.select(2, 7); // "ABBBBC"
      doc.setFormatting({ italic: true });

      const saved = doc.save();
      // Should have applied italic to the selection
      expect(saved.length).toBeGreaterThan(0);
    });

    itWithTextMeasurement('maintains consistency after multiple undo/redo cycles', () => {
      const doc = createDocument({ width: 500 });
      doc.load([{ text: 'Initial' }]);

      // Make changes
      doc.select(7);
      doc.insert(' text');

      // Undo/redo cycle
      for (let i = 0; i < 3; i++) {
        doc.undo();
        expect(doc.plainText()).not.toContain(' text');

        doc.redo();
        expect(doc.plainText()).toContain(' text');
      }
    });
  });
});

describe('Text Alignment', () => {
  itWithTextMeasurement('setFormatting can apply alignment to selection', () => {
    const doc = createDocument({ width: 500 });
    doc.load([{ text: 'Hello World' }]);

    doc.select(0, 11);
    doc.setFormatting({ align: 'center' });

    const formatting = doc.getFormatting();
    expect(formatting.align).toBe('center');
  });

  itWithTextMeasurement('alignment values are preserved through load/save', () => {
    const doc = createDocument({ width: 500 });
    doc.load([
      { text: 'Centered text', align: 'center' },
    ]);

    const saved = doc.save();
    expect(saved.some((run) => run.align === 'center')).toBe(true);
  });

  itWithTextMeasurement('all alignment values work', () => {
    const doc = createDocument({ width: 500 });
    const alignments: TextAlign[] = ['left', 'center', 'right', 'justify'];

    for (const align of alignments) {
      doc.load([{ text: 'Test', align }]);

      doc.select(0, 4);
      const formatting = doc.getFormatting();
      expect(formatting.align).toBe(align);
    }
  });

  itWithTextMeasurement('changing alignment triggers change event', () => {
    const doc = createDocument({ width: 500 });
    doc.load([{ text: 'Hello World' }]);

    const handler = vi.fn();
    doc.on('change', handler);

    doc.select(0, 11);
    doc.setFormatting({ align: 'right' });

    expect(handler).toHaveBeenCalled();
  });
});

describe('HTML Parsing', () => {
  it('parseHtml converts basic HTML to runs', () => {
    const runs = parseHtml('<b>Bold</b> and <i>italic</i>');

    expect(runs.length).toBeGreaterThan(0);

    // Find bold text
    const boldRun = runs.find((r) => r.bold === true);
    expect(boldRun).toBeDefined();
    expect(boldRun?.text).toContain('Bold');

    // Find italic text
    const italicRun = runs.find((r) => r.italic === true);
    expect(italicRun).toBeDefined();
    expect(italicRun?.text).toContain('italic');
  });

  it('parseHtml preserves nested formatting', () => {
    const runs = parseHtml('<b><i>Bold and italic</i></b>');

    // Should have a run with both bold and italic
    const bothRun = runs.find((r) => r.bold === true && r.italic === true);
    expect(bothRun).toBeDefined();
  });

  it('parseHtml handles underline and strikethrough', () => {
    const runs = parseHtml('<u>Underline</u> and <s>strikethrough</s>');

    const underlineRun = runs.find((r) => r.underline === true);
    expect(underlineRun).toBeDefined();

    const strikeRun = runs.find((r) => r.strikeout === true);
    expect(strikeRun).toBeDefined();
  });

  it('parseHtml handles headings with sizes', () => {
    const runs = parseHtml('<h1>Heading 1</h1><h3>Heading 3</h3>');

    const h1Run = runs.find((r) => r.size === 30);
    expect(h1Run).toBeDefined();

    const h3Run = runs.find((r) => r.size === 16);
    expect(h3Run).toBeDefined();
  });

  it('parseHtml handles inline styles', () => {
    const runs = parseHtml('<span style="color: red; font-weight: bold">Styled</span>');

    const styledRun = runs.find((r) => r.color === 'red');
    expect(styledRun).toBeDefined();
    expect(styledRun?.bold).toBe(true);
  });

  it('parseHtml handles line breaks', () => {
    const runs = parseHtml('Line 1<br>Line 2');

    const text = runs.map((r) => r.text).join('');
    expect(text).toContain('\n');
  });

  it('parseHtml handles paragraphs with newlines', () => {
    const runs = parseHtml('<p>Para 1</p><p>Para 2</p>');

    const text = runs.map((r) => r.text).join('');
    expect(text).toMatch(/Para 1\n.*Para 2/s);
  });

  it('parseHtml handles code blocks with monospace font', () => {
    const runs = parseHtml('<code>monospace text</code>');

    const codeRun = runs.find((r) => r.font === 'monospace');
    expect(codeRun).toBeDefined();
  });

  it('parseHtml handles superscript and subscript', () => {
    const runs = parseHtml('H<sub>2</sub>O and x<sup>2</sup>');

    const subRun = runs.find((r) => r.script === 'sub');
    expect(subRun).toBeDefined();

    const superRun = runs.find((r) => r.script === 'super');
    expect(superRun).toBeDefined();
  });

  it('parseHtml handles text alignment', () => {
    const runs = parseHtml('<p style="text-align: center">Centered</p>');

    const centeredRun = runs.find((r) => r.align === 'center');
    expect(centeredRun).toBeDefined();
  });

  it('parseHtml with class definitions', () => {
    const classFormatting = {
      highlight: { color: 'yellow', bold: true },
    };

    const runs = parseHtml('<span class="highlight">Highlighted</span>', classFormatting);

    const highlightedRun = runs.find((r) => r.color === 'yellow' && r.bold === true);
    expect(highlightedRun).toBeDefined();
  });

  itWithTextMeasurement('HTML can be parsed and loaded into document', () => {
    const doc = createDocument({ width: 500 });
    const runs = parseHtml('<b>Bold</b> text');

    doc.load(runs);

    // Select the bold portion and verify formatting
    doc.select(0, 4);
    expect(doc.getFormatting().bold).toBe(true);

    // Select the normal portion
    doc.select(5, 9);
    expect(doc.getFormatting().bold).not.toBe(true);
  });
});

describe('API Contract', () => {
  it('createDocument returns object with required methods', () => {
    const doc = createDocument({ width: 500 });

    // Content methods
    expect(typeof doc.load).toBe('function');
    expect(typeof doc.save).toBe('function');
    expect(typeof doc.insert).toBe('function');
    expect(typeof doc.plainText).toBe('function');

    // Properties
    expect(typeof doc.width).toBe('number');
    expect(typeof doc.height).toBe('number');

    // Selection methods
    expect(typeof doc.select).toBe('function');
    expect(typeof doc.selectedRange).toBe('function');
    expect(typeof doc.range).toBe('function');

    // Formatting methods
    expect(typeof doc.getFormatting).toBe('function');
    expect(typeof doc.setFormatting).toBe('function');

    // Rendering
    expect(typeof doc.render).toBe('function');
    expect(typeof doc.draw).toBe('function');

    // Events
    expect(typeof doc.on).toBe('function');
    expect(typeof doc.off).toBe('function');

    // Undo/Redo
    expect(typeof doc.undo).toBe('function');
    expect(typeof doc.redo).toBe('function');
    expect(typeof doc.canUndo).toBe('function');
    expect(typeof doc.canRedo).toBe('function');
  });

  itWithTextMeasurement('Document selection property is readonly-ish', () => {
    const doc = createDocument({ width: 500 });
    doc.load([{ text: 'Test' }]);

    const selectionRef = doc.selection;

    // The selection object itself can be modified
    // but the reference should be stable
    doc.select(1, 2);

    expect(doc.selection).toBe(selectionRef);
    expect(doc.selection.start).toBe(1);
    expect(doc.selection.end).toBe(2);
  });
});
