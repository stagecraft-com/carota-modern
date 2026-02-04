import { EventEmitter } from '../types';

/**
 * Creates a simple event emitter with subscribe and fire capabilities.
 *
 * @example
 * const onChange = createEvent<[string]>();
 * onChange((value) => console.log('Changed:', value));
 * onChange.fire('newValue');
 *
 * @returns An event emitter function with a fire method
 */
export declare function createEvent<T extends unknown[] = unknown[]>(): EventEmitter<T>;
/**
 * Creates an object with methods from the prototype chain.
 * This is a typed wrapper around Object.create for inheritance.
 *
 * @param prototype - The prototype object to inherit from
 * @param methods - Additional methods to add to the created object
 * @returns A new object with the prototype and methods
 */
export declare function derive<P extends object, M extends object>(prototype: P, methods: M): P & M;
//# sourceMappingURL=Util.d.ts.map