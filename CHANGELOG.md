# Changelog

All notable changes to Carota Modern will be documented in this file.

## [1.0.0] - 2026-02-04

### Added
- Full TypeScript rewrite with comprehensive type definitions
- ES Modules (ESM) + CommonJS dual output format
- Modern build system using Vite
- Comprehensive test suite (46 tests)
- `parseHtml()` function for HTML import
- Text alignment support (left, center, right, justify)
- Event system with `on()`/`off()` pattern
- `createDocument()` for headless rendering
- `createEditor()` for interactive editing

### Fixed
- EOF marker not being yielded from text splitting generator
- EOF marker incorrectly spliced into middle of document during edits
- Selection highlight `this` binding lost in drawSelection
- Symbol values breaking toolbar when selecting mixed-format text

### Changed
- Converted from JavaScript to TypeScript
- Replaced `per` streaming library with native generators
- Modernized API with property accessors (`doc.width` instead of `doc.width()`)
- Improved event handling (modern on/off pattern alongside legacy callbacks)

### Removed
- Dependency on `per` streaming library
- All runtime dependencies (now zero-dependency)

## Original Carota

This project is a modernized rewrite of [Carota](https://github.com/nicoptere/carota)
by Daniel Earwicker. The original was a pioneering canvas-based rich text editor
created around 2014-2016.
