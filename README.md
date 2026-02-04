# Carota Modern

A modernized canvas-based rich text editor. TypeScript + ESM rewrite of the original [Carota](https://github.com/nicoptere/carota) library by Daniel Earwicker.

## Features

- **Canvas-based rendering** - renders directly to HTML Canvas (great for WebGL/Three.js textures)
- **Rich text formatting** - bold, italic, underline, strikethrough, colors, fonts, sizes
- **Text alignment** - left, center, right, justify
- **Full selection support** - click, double-click, drag, keyboard navigation
- **Undo/Redo** - full history support
- **HTML import** - parse HTML into formatted runs
- **Zero runtime dependencies**
- **Lightweight** - 16.5KB gzipped

## Installation

### From GitHub

```bash
npm install github:stagecraft-com/carota-modern
```

### From Source

```bash
git clone https://github.com/stagecraft-com/carota-modern.git
cd carota-modern
npm install
npm run build
```

## Usage

### Interactive Editor

```typescript
import { createEditor } from '@stagecraft/carota-modern';

const container = document.getElementById('editor');
const editor = createEditor({
  element: container,
  width: 500,
});

// Load content
editor.load([
  { text: 'Hello ', bold: true },
  { text: 'World', color: '#007bff' },
]);

// Listen for changes
editor.on('change', () => {
  const content = editor.save();
  console.log('Content changed:', content);
});
```

### Headless Document (for rendering only)

```typescript
import { createDocument } from '@stagecraft/carota-modern';

const doc = createDocument({ width: 500 });

doc.load([
  { text: 'Hello World', size: 24 },
]);

// Render to canvas
const canvas = document.createElement('canvas');
doc.render({ canvas, dpr: window.devicePixelRatio });
```

### HTML Import

```typescript
import { parseHtml } from '@stagecraft/carota-modern';

const runs = parseHtml('<b>Bold</b> and <i>italic</i> text');
editor.load(runs);
```

## Run Properties

Text is stored as an array of "runs" - objects with text and formatting:

```typescript
interface Run {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikeout?: boolean;
  color?: string;       // e.g., '#ff0000' or 'red'
  font?: string;        // e.g., 'Arial'
  size?: number;        // in points
  align?: 'left' | 'center' | 'right' | 'justify';
  script?: 'sub' | 'super';
}
```

## API Reference

### Editor

```typescript
createEditor(options: { element: HTMLElement; width: number }): Editor

editor.load(runs: Run[]): void
editor.save(): Run[]
editor.insert(text: string): void
editor.select(start: number, end?: number): void
editor.selectedRange(): Range
editor.getFormatting(): MergedFormatting
editor.setFormatting(formatting: Partial<Run>): void
editor.on(event: 'change' | 'selectionChange', handler: Function): void
editor.off(event: string, handler: Function): void
editor.undo(): void
editor.redo(): void
editor.plainText(): string
```

### Document (Headless)

```typescript
createDocument(options?: { width?: number }): Document

doc.load(runs: Run[]): void
doc.save(): Run[]
doc.render(options: { canvas: HTMLCanvasElement; dpr?: number }): void
doc.width: number  // readable and writable
doc.height: number // read-only, calculated from content
```

## Demo

A `demo.html` file is included. After cloning the repo:

```bash
npm install
npm run dev
```

Then open the URL shown in your terminal (usually `http://localhost:5173/demo.html`).

## Credits

This is a modernized rewrite of [Carota](https://github.com/nicoptere/carota) originally created by [Daniel Earwicker](https://github.com/danielearwicker).

**What's new in Carota Modern:**
- Full TypeScript rewrite with type definitions
- ES Modules (ESM) + CommonJS dual format
- Modern build tooling (Vite)
- Bug fixes for selection, text insertion, and layout
- Improved event system (on/off pattern)
- Comprehensive test suite

## License

MIT License - see [LICENSE](LICENSE) for details.

Both the original Carota and this modernized version are MIT licensed.
