/**
 * Node utilities for @stagecraft/carota
 *
 * Provides the base node prototype for the document tree.
 * All document elements (frames, lines, words, characters) inherit from this.
 */

import type { Bounds, CarotaNode, NodeType } from '../types';
import { createRect, type Rect } from '../render/Rect';
import { derive } from './Util';

/**
 * Internal interface for nodes with position data
 */
interface NodeInternal extends CarotaNode {
  _left: number;
  _top: number;
  block?: boolean;
}

/**
 * Base node prototype - all document tree nodes inherit from this
 */
export const nodePrototype: Omit<
  CarotaNode,
  'type' | 'ordinal' | 'length' | '_left' | '_top'
> = {
  /**
   * Get children of this node (default: empty array)
   */
  children(): CarotaNode[] {
    return [];
  },

  /**
   * Get parent of this node (default: null)
   */
  parent(): CarotaNode | null {
    return null;
  },

  /**
   * Get the first child of this node
   */
  first(): CarotaNode | undefined {
    return this.children()[0];
  },

  /**
   * Get the last child of this node
   */
  last(): CarotaNode | undefined {
    const children = this.children();
    return children[children.length - 1];
  },

  /**
   * Get the next node in document order (depth-first traversal)
   */
  next(): CarotaNode | null {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let self: CarotaNode = this;
    for (;;) {
      const parent = self.parent();
      if (!parent) {
        return null;
      }
      const siblings = parent.children();
      const nextIndex = siblings.indexOf(self) + 1;
      const next = siblings[nextIndex];
      if (next) {
        // Go to the leftmost leaf of next sibling
        let current: CarotaNode = next;
        for (;;) {
          const firstChild = current.first();
          if (!firstChild) {
            break;
          }
          current = firstChild;
        }
        return current;
      }
      // No next sibling, move up to parent
      self = parent;
    }
  },

  /**
   * Get the previous node in document order
   */
  previous(): CarotaNode | null {
    const parent = this.parent();
    if (!parent) {
      return null;
    }
    const siblings = parent.children();
    const prev = siblings[siblings.indexOf(this) - 1];
    if (prev) {
      return prev;
    }
    const prevParent = parent.previous();
    return !prevParent ? null : prevParent.last() || null;
  },

  /**
   * Find a descendant by ordinal (character index)
   */
  byOrdinal(index: number): CarotaNode {
    let found: CarotaNode | null = null;
    const children = this.children();

    for (const child of children) {
      if (index >= child.ordinal && index < child.ordinal + child.length) {
        found = child.byOrdinal(index);
        if (found) {
          break;
        }
      }
    }

    return found || this;
  },

  /**
   * Find a descendant by coordinate (x, y position)
   */
  byCoordinate(x: number, y: number): CarotaNode {
    let found: CarotaNode | undefined;

    for (const child of this.children()) {
      const b = child.bounds();
      if (b.l <= x && x < b.r && b.t <= y && y < b.b) {
        found = child.byCoordinate(x, y);
        if (found) {
          break;
        }
      }
    }

    if (!found) {
      // Fall back to the last leaf node
      found = this.last();
      while (found) {
        const next = found.last();
        if (!next) {
          break;
        }
        found = next;
      }
      // Check if next sibling is a block
      if (found) {
        const foundNext = found.next();
        if (foundNext && (foundNext as NodeInternal).block) {
          found = foundNext;
        }
      }
    }

    return found || this;
  },

  /**
   * Draw this node and its children
   */
  draw(ctx: CanvasRenderingContext2D, viewPort?: Bounds): void {
    for (const child of this.children()) {
      child.draw(ctx, viewPort);
    }
  },

  /**
   * Get the bounds of this node (bounding box of children)
   */
  bounds(): Bounds {
    const internal = this as unknown as NodeInternal;
    let l = internal._left;
    let t = internal._top;
    let r = 0;
    let b = 0;

    for (const child of this.children()) {
      const cb = child.bounds();
      l = Math.min(l, cb.l);
      t = Math.min(t, cb.t);
      r = Math.max(r, cb.l + cb.w);
      b = Math.max(b, cb.t + cb.h);
    }

    return createRect(l, t, r - l, b - t);
  },
};

/**
 * Additional method for finding parent of a specific type
 */
export function parentOfType(node: CarotaNode, type: NodeType): CarotaNode | null {
  const parent = node.parent();
  if (!parent) {
    return null;
  }
  return parent.type === type ? parent : parentOfType(parent, type);
}

/**
 * Create a derived node type with additional methods
 *
 * @param methods - Additional methods to add to the node
 * @returns A new prototype with the node prototype and additional methods
 */
export function deriveNode<M extends object>(methods: M): typeof nodePrototype & M {
  return derive(nodePrototype as typeof nodePrototype & object, methods);
}

/**
 * Internal interface for generic nodes
 */
interface GenericNodeInternal extends CarotaNode {
  _children: CarotaNode[];
  _parent: CarotaNode | null;
  _left: number;
  _top: number;
}

/**
 * Generic node prototype - for container nodes with explicit children
 */
const genericNodePrototype = deriveNode({
  children(this: GenericNodeInternal): CarotaNode[] {
    return this._children;
  },

  parent(this: GenericNodeInternal): CarotaNode | null {
    return this._parent;
  },

  /**
   * Finalize the node by computing ordinal and length from children
   */
  finalize(this: GenericNodeInternal, startDecrement?: number, lengthIncrement?: number): void {
    let start = Number.MAX_VALUE;
    let end = 0;

    for (const child of this._children) {
      start = Math.min(start, child.ordinal);
      end = Math.max(end, child.ordinal + child.length);
    }

    Object.defineProperty(this, 'ordinal', { value: start - (startDecrement || 0) });
    Object.defineProperty(this, 'length', { value: (lengthIncrement || 0) + end - start });
  },
});

/**
 * Generic node interface with finalize method
 */
export interface GenericNode extends CarotaNode {
  _children: CarotaNode[];
  _parent: CarotaNode | null;
  finalize(startDecrement?: number, lengthIncrement?: number): void;
}

/**
 * Create a generic container node
 *
 * @param type - The node type
 * @param parent - The parent node
 * @param left - Optional left position (defaults to MAX_VALUE for auto-compute)
 * @param top - Optional top position (defaults to MAX_VALUE for auto-compute)
 * @returns A new generic node
 */
export function createGenericNode(
  type: NodeType,
  parent: CarotaNode | null,
  left?: number,
  top?: number
): GenericNode {
  return Object.create(genericNodePrototype, {
    type: { value: type },
    _children: { value: [] },
    _parent: { value: parent },
    _left: { value: typeof left === 'number' ? left : Number.MAX_VALUE },
    _top: { value: typeof top === 'number' ? top : Number.MAX_VALUE },
  }) as GenericNode;
}

// Re-export for backwards compatibility
export { nodePrototype as prototype };
export { createGenericNode as generic };
