/**
 * HTML parser for @stagecraft/carota
 *
 * Converts HTML content to an array of runs for pasting.
 */

import type { Run, TextAlign, PartialFormatting } from '../types';
import { consolidateRuns } from '../model/Run';

// =============================================================================
// Types
// =============================================================================

/**
 * Class definitions for formatting
 */
export type ClassFormatting = Record<string, PartialFormatting>;

/**
 * Handler function for extracting formatting from a node
 */
type FormatHandler = (node: Element, formatting: PartialFormatting) => void;

// =============================================================================
// Handler Helpers
// =============================================================================

/**
 * Create a handler that sets a flag when a tag is found
 */
function tag(name: string, formattingProperty: keyof PartialFormatting): FormatHandler {
  return function (node: Element, formatting: PartialFormatting): void {
    if (node.nodeName === name) {
      (formatting as Record<string, unknown>)[formattingProperty] = true;
    }
  };
}

/**
 * Create a handler that extracts a value from attributes or style
 */
function value<T>(
  type: 'attributes' | 'style',
  styleProperty: string,
  formattingProperty: keyof PartialFormatting,
  transformValue?: (val: string) => T
): FormatHandler {
  return function (node: Element, formatting: PartialFormatting): void {
    let val: string | null = null;

    if (type === 'attributes') {
      const attr = node.attributes?.getNamedItem(styleProperty);
      if (attr) {
        val = attr.value;
      }
    } else if (type === 'style') {
      const elem = node as HTMLElement;
      if (elem.style) {
        val = elem.style.getPropertyValue(styleProperty) || (elem.style as unknown as Record<string, string>)[styleProperty];
      }
    }

    if (val) {
      (formatting as Record<string, unknown>)[formattingProperty] = transformValue
        ? transformValue(val)
        : val;
    }
  };
}

/**
 * Create a handler that extracts an attribute value
 */
function attrValue<T>(
  attrProperty: string,
  formattingProperty: keyof PartialFormatting,
  transformValue?: (val: string) => T
): FormatHandler {
  return value('attributes', attrProperty, formattingProperty, transformValue);
}

/**
 * Create a handler that extracts a style value
 */
function styleValue<T>(
  styleProperty: string,
  formattingProperty: keyof PartialFormatting,
  transformValue?: (val: string) => T
): FormatHandler {
  return value('style', styleProperty, formattingProperty, transformValue);
}

/**
 * Create a handler that sets a flag when a style property has a specific value
 */
function styleFlag(
  styleProperty: string,
  styleVal: string,
  formattingProperty: keyof PartialFormatting
): FormatHandler {
  return function (node: Element, formatting: PartialFormatting): void {
    const elem = node as HTMLElement;
    if (elem.style) {
      const propValue = elem.style.getPropertyValue(styleProperty) || (elem.style as unknown as Record<string, string>)[styleProperty];
      if (propValue === styleVal) {
        (formatting as Record<string, unknown>)[formattingProperty] = true;
      }
    }
  };
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Obsolete font sizes (for <font size="N">)
 */
const obsoleteFontSizes = [6, 7, 9, 10, 12, 16, 20, 30];

/**
 * Valid alignment values
 */
const aligns: Record<string, boolean> = {
  left: true,
  center: true,
  right: true,
  justify: true,
};

/**
 * Check if a value is a valid alignment
 */
function checkAlign(value: string): TextAlign {
  return aligns[value] ? (value as TextAlign) : 'left';
}

/**
 * Extract font name from a CSS font-family value
 */
function fontName(name: string): string {
  const s = name.split(/\s*,\s*/g);
  if (s.length === 0) {
    return name;
  }

  let result = s[0];

  // Check for quoted font names
  let raw = result.match(/^"(.*)"$/);
  if (raw) {
    return raw[1].trim();
  }

  raw = result.match(/^'(.*)'$/);
  if (raw) {
    return raw[1].trim();
  }

  return result;
}

/**
 * Heading sizes
 */
const headings: Record<string, number> = {
  H1: 30,
  H2: 20,
  H3: 16,
  H4: 14,
  H5: 12,
};

// =============================================================================
// Format Handlers
// =============================================================================

const handlers: FormatHandler[] = [
  // Tag-based formatting
  tag('B', 'bold'),
  tag('STRONG', 'bold'),
  tag('I', 'italic'),
  tag('EM', 'italic'),
  tag('U', 'underline'),
  tag('S', 'strikeout'),
  tag('STRIKE', 'strikeout'),
  tag('DEL', 'strikeout'),

  // Style-based formatting
  styleFlag('fontWeight', 'bold', 'bold'),
  styleFlag('fontStyle', 'italic', 'italic'),
  styleFlag('textDecoration', 'underline', 'underline'),
  styleFlag('textDecoration', 'line-through', 'strikeout'),

  styleValue('color', 'color'),
  styleValue('fontFamily', 'font', fontName),
  styleValue('fontSize', 'size', (size: string) => {
    const m = size.match(/^([\d.]+)pt$/);
    return m ? parseFloat(m[1]) : 10;
  }),
  styleValue('textAlign', 'align', checkAlign),

  // Special tags
  (node: Element, formatting: PartialFormatting) => {
    if (node.nodeName === 'SUB') {
      formatting.script = 'sub';
    }
  },
  (node: Element, formatting: PartialFormatting) => {
    if (node.nodeName === 'SUPER' || node.nodeName === 'SUP') {
      formatting.script = 'super';
    }
  },
  (node: Element, formatting: PartialFormatting) => {
    if (node.nodeName === 'CODE') {
      formatting.font = 'monospace';
    }
  },
  (node: Element, formatting: PartialFormatting) => {
    const size = headings[node.nodeName];
    if (size) {
      formatting.size = size;
    }
  },

  // Attribute-based formatting (legacy)
  attrValue('color', 'color'),
  attrValue('face', 'font', fontName),
  attrValue('align', 'align', checkAlign),
  attrValue('size', 'size', (size: string) => {
    const idx = parseInt(size, 10);
    return obsoleteFontSizes[idx] || 10;
  }),
];

/**
 * Tags that cause newlines
 */
const newLineTagNames = ['BR', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'DIV'];
const isNewLine: Record<string, boolean> = {};
newLineTagNames.forEach((name) => {
  isNewLine[name] = true;
});

// =============================================================================
// Parser
// =============================================================================

/**
 * Parse HTML content into an array of runs.
 *
 * @param html - HTML string or DOM element to parse
 * @param classes - Optional class definitions for formatting
 * @returns Array of runs
 */
export function parseHtml(html: string | Element, classes: ClassFormatting = {}): Run[] {
  // Convert string to DOM element
  let root: Element;
  if (typeof html === 'string') {
    root = document.createElement('div');
    root.innerHTML = html;
  } else {
    root = html;
  }

  const accumulated: Run[] = [];
  let inSpace = true;

  /**
   * Emit a run to the accumulator
   */
  function emit(text: string, formatting: PartialFormatting): void {
    if (text) {
      accumulated.push(
        Object.create(formatting, {
          text: { value: text },
        }) as Run
      );
    }
  }

  /**
   * Handle whitespace normalization
   */
  function dealWithSpaces(text: string, formatting: PartialFormatting): void {
    // Normalize newlines and following whitespace to spaces
    text = text.replace(/\n+\s*/g, ' ');

    const fullLength = text.length;
    text = text.replace(/^\s+/, '');

    if (inSpace) {
      inSpace = false;
    } else if (fullLength !== text.length) {
      // Add back a single space if there was leading whitespace
      text = ' ' + text;
    }

    const trimmedLength = text.length;
    text = text.replace(/\s+$/, '');

    if (trimmedLength !== text.length) {
      // There was trailing whitespace
      inSpace = true;
      text += ' ';
    }

    emit(text, formatting);
  }

  /**
   * Recursively process DOM nodes
   */
  function recurse(node: Node, formatting: PartialFormatting): void {
    if (node.nodeType === 3) {
      // Text node
      dealWithSpaces(node.nodeValue || '', formatting);
    } else if (node.nodeType === 1) {
      // Element node
      const element = node as Element;
      formatting = Object.create(formatting) as PartialFormatting;

      // Apply class-based formatting
      const classAttr = element.getAttribute('class');
      if (classAttr) {
        classAttr.split(' ').forEach((cls) => {
          const classFormatting = classes[cls];
          if (classFormatting) {
            Object.keys(classFormatting).forEach((key) => {
              (formatting as Record<string, unknown>)[key] =
                classFormatting[key as keyof PartialFormatting];
            });
          }
        });
      }

      // Apply handlers
      handlers.forEach((handler) => {
        handler(element, formatting);
      });

      // Process children
      for (let n = 0; n < element.childNodes.length; n++) {
        recurse(element.childNodes[n], formatting);
      }

      // Add newline for block elements
      if (isNewLine[element.nodeName]) {
        emit('\n', formatting);
        inSpace = true;
      }
    }
  }

  recurse(root, {});

  // Consolidate adjacent runs with same formatting
  return [...consolidateRuns(accumulated)];
}

// Legacy export name
export { parseHtml as parse };

// Default export
export default parseHtml;
