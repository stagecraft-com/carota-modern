/**
 * Utility functions for @stagecraft/carota
 *
 * Provides event emitter and prototype inheritance utilities.
 */

import type { EventEmitter } from '../types';

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
export function createEvent<T extends unknown[] = unknown[]>(): EventEmitter<T> {
  const handlers: Array<(...args: T) => void> = [];

  const subscribe = (handler: (...args: T) => void): void => {
    handlers.push(handler);
  };

  subscribe.fire = (...args: T): void => {
    handlers.forEach((handler) => handler(...args));
  };

  return subscribe as EventEmitter<T>;
}

/**
 * Creates an object with methods from the prototype chain.
 * This is a typed wrapper around Object.create for inheritance.
 *
 * @param prototype - The prototype object to inherit from
 * @param methods - Additional methods to add to the created object
 * @returns A new object with the prototype and methods
 */
export function derive<P extends object, M extends object>(
  prototype: P,
  methods: M
): P & M {
  const properties: PropertyDescriptorMap = {};
  (Object.keys(methods) as Array<keyof M>).forEach((name) => {
    properties[name as string] = { value: methods[name] };
  });
  return Object.create(prototype, properties) as P & M;
}
