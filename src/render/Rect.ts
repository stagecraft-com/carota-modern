/**
 * Rectangle utility for @stagecraft/carota
 *
 * Provides a rectangle factory with bounds and geometry methods.
 */

import type { Bounds, Point } from '../types';

/**
 * Rectangle interface extending Bounds with utility methods
 */
export interface Rect extends Bounds {
  /**
   * Check if point (x, y) is contained within this rectangle
   */
  contains(x: number, y: number): boolean;

  /**
   * Stroke the rectangle outline on a canvas context
   */
  stroke(ctx: CanvasRenderingContext2D): void;

  /**
   * Fill the rectangle on a canvas context
   */
  fill(ctx: CanvasRenderingContext2D): void;

  /**
   * Create a new rectangle offset by (x, y)
   */
  offset(x: number, y: number): Rect;

  /**
   * Check if this rectangle equals another bounds object
   */
  equals(other: Bounds): boolean;

  /**
   * Get the center point of this rectangle
   */
  center(): Point;
}

/**
 * Prototype object containing all Rect methods
 */
const rectPrototype: Omit<Rect, 'l' | 't' | 'w' | 'h' | 'r' | 'b'> = {
  contains(this: Rect, x: number, y: number): boolean {
    return x >= this.l && x < this.l + this.w && y >= this.t && y < this.t + this.h;
  },

  stroke(this: Rect, ctx: CanvasRenderingContext2D): void {
    ctx.strokeRect(this.l, this.t, this.w, this.h);
  },

  fill(this: Rect, ctx: CanvasRenderingContext2D): void {
    ctx.fillRect(this.l, this.t, this.w, this.h);
  },

  offset(this: Rect, x: number, y: number): Rect {
    return createRect(this.l + x, this.t + y, this.w, this.h);
  },

  equals(this: Rect, other: Bounds): boolean {
    return (
      this.l === other.l && this.t === other.t && this.w === other.w && this.h === other.h
    );
  },

  center(this: Rect): Point {
    return { x: this.l + this.w / 2, y: this.t + this.h / 2 };
  },
};

/**
 * Create a new rectangle with the given dimensions.
 *
 * @param l - Left coordinate
 * @param t - Top coordinate
 * @param w - Width
 * @param h - Height
 * @returns A new Rect object
 */
export function createRect(l: number, t: number, w: number, h: number): Rect {
  return Object.create(rectPrototype, {
    l: { value: l },
    t: { value: t },
    w: { value: w },
    h: { value: h },
    r: { value: l + w },
    b: { value: t + h },
  }) as Rect;
}

// Export createRect as 'rect' for compatibility
export { createRect as rect };
