/**
 * DOM utilities for @stagecraft/carota
 *
 * Provides helper functions for DOM manipulation and event handling.
 */

/**
 * Check if an element is attached to the document
 *
 * @param element - The element to check
 * @returns True if the element is in the DOM
 */
export function isAttached(element: Node): boolean {
  let ancestor: Node | null = element;
  while (ancestor && ancestor.parentNode) {
    ancestor = ancestor.parentNode;
  }
  return !!(ancestor && (ancestor as Document).body);
}

/**
 * Remove all children from an element
 *
 * @param element - The element to clear
 */
export function clear(element: Element): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Set the text content of an element
 *
 * @param element - The element
 * @param text - The text to set
 */
export function setText(element: Element, text: string): void {
  clear(element);
  element.appendChild(document.createTextNode(text));
}

/**
 * Event handler function type
 * Return false to prevent default behavior
 */
export type EventHandler<E extends Event = Event> = (ev: E) => boolean | void;

/**
 * Add an event listener to an element.
 * If the handler returns false, preventDefault() will be called.
 *
 * @param element - The element to attach to
 * @param name - The event name
 * @param handler - The event handler
 */
export function handleEvent<K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  name: K,
  handler: EventHandler<HTMLElementEventMap[K]>
): void {
  element.addEventListener(name, (ev) => {
    if (handler(ev) === false) {
      ev.preventDefault();
    }
  });
}

/**
 * Mouse event handler with local coordinates
 */
export type MouseEventHandler = (
  ev: MouseEvent,
  x: number,
  y: number
) => boolean | void;

/**
 * Add a mouse event listener that provides local coordinates.
 *
 * @param element - The element to attach to
 * @param name - The mouse event name
 * @param handler - The event handler (receives event and local x, y coordinates)
 */
export function handleMouseEvent(
  element: HTMLElement,
  name: 'mousedown' | 'mouseup' | 'mousemove' | 'click' | 'dblclick',
  handler: MouseEventHandler
): void {
  handleEvent(element, name, (ev: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    return handler(ev, ev.clientX - rect.left, ev.clientY - rect.top);
  });
}

/**
 * Get the computed style value of an element property
 *
 * @param element - The element
 * @param name - The CSS property name
 * @returns The computed value
 */
export function effectiveStyle(element: Element, name: string): string {
  return document.defaultView!.getComputedStyle(element).getPropertyValue(name);
}
