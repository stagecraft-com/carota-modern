import { Bounds, Point } from '../types';

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
 * Create a new rectangle with the given dimensions.
 *
 * @param l - Left coordinate
 * @param t - Top coordinate
 * @param w - Width
 * @param h - Height
 * @returns A new Rect object
 */
export declare function createRect(l: number, t: number, w: number, h: number): Rect;
export { createRect as rect };
//# sourceMappingURL=Rect.d.ts.map