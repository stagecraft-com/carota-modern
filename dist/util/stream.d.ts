/**
 * Stream utility functions for @stagecraft/carota
 *
 * These utilities replace the `per` library patterns used throughout
 * the original Carota codebase. They provide functional stream-like
 * operations using native JavaScript generators and iterators.
 */
/**
 * Convert any iterable to an array
 */
export declare function toArray<T>(iterable: Iterable<T>): T[];
/**
 * Get the first element from an iterable
 */
export declare function first<T>(iterable: Iterable<T>): T | undefined;
/**
 * Get the last element from an iterable
 */
export declare function last<T>(iterable: Iterable<T>): T | undefined;
/**
 * Filter and map in one pass (like flatMap but yields single values or nothing)
 *
 * @param iterable - Input iterable
 * @param fn - Transform function that returns value or null/undefined to skip
 * @yields Transformed non-null values
 */
export declare function filterMap<T, U>(iterable: Iterable<T>, fn: (item: T) => U | null | undefined): Generator<U>;
/**
 * Chain multiple iterables together into one sequence
 *
 * @param iterables - Iterables to chain
 * @yields All items from all iterables in order
 */
export declare function chain<T>(...iterables: Iterable<T>[]): Generator<T>;
/**
 * Map over an iterable lazily
 *
 * @param iterable - Input iterable
 * @param fn - Transform function
 * @yields Transformed items
 */
export declare function map<T, U>(iterable: Iterable<T>, fn: (item: T) => U): Generator<U>;
/**
 * Filter an iterable lazily
 *
 * @param iterable - Input iterable
 * @param predicate - Filter function
 * @yields Items that pass the predicate
 */
export declare function filter<T>(iterable: Iterable<T>, predicate: (item: T) => boolean): Generator<T>;
/**
 * Take only the first n items from an iterable
 *
 * @param iterable - Input iterable
 * @param n - Number of items to take
 * @yields Up to n items
 */
export declare function take<T>(iterable: Iterable<T>, n: number): Generator<T>;
/**
 * Skip the first n items from an iterable
 *
 * @param iterable - Input iterable
 * @param n - Number of items to skip
 * @yields Items after skipping n
 */
export declare function skip<T>(iterable: Iterable<T>, n: number): Generator<T>;
/**
 * Take items while a predicate is true
 *
 * @param iterable - Input iterable
 * @param predicate - Condition function
 * @yields Items until predicate returns false
 */
export declare function takeWhile<T>(iterable: Iterable<T>, predicate: (item: T) => boolean): Generator<T>;
/**
 * Reduce an iterable to a single value
 *
 * @param iterable - Input iterable
 * @param reducer - Reducer function
 * @param initial - Initial accumulator value
 * @returns Final accumulated value
 */
export declare function reduce<T, U>(iterable: Iterable<T>, reducer: (acc: U, item: T) => U, initial: U): U;
/**
 * Check if any item in the iterable satisfies a predicate
 *
 * @param iterable - Input iterable
 * @param predicate - Test function
 * @returns True if any item passes
 */
export declare function some<T>(iterable: Iterable<T>, predicate: (item: T) => boolean): boolean;
/**
 * Check if all items in the iterable satisfy a predicate
 *
 * @param iterable - Input iterable
 * @param predicate - Test function
 * @returns True if all items pass
 */
export declare function every<T>(iterable: Iterable<T>, predicate: (item: T) => boolean): boolean;
/**
 * Find the first item that satisfies a predicate
 *
 * @param iterable - Input iterable
 * @param predicate - Test function
 * @returns The first matching item or undefined
 */
export declare function find<T>(iterable: Iterable<T>, predicate: (item: T) => boolean): T | undefined;
/**
 * Execute a side effect for each item
 *
 * @param iterable - Input iterable
 * @param fn - Side effect function
 */
export declare function forEach<T>(iterable: Iterable<T>, fn: (item: T) => void): void;
/**
 * Count items in an iterable
 *
 * @param iterable - Input iterable
 * @returns Number of items
 */
export declare function count<T>(iterable: Iterable<T>): number;
//# sourceMappingURL=stream.d.ts.map