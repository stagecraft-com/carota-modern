/**
 * EventManager for @stagecraft/carota
 *
 * Type-safe event management with on/off/emit pattern.
 * Compatible with React's useEffect cleanup pattern.
 */

/**
 * Event handler function type
 */
type EventHandler<T extends unknown[] = unknown[]> = (...args: T) => void;

/**
 * EventManager provides a type-safe event system with on/off/emit pattern.
 *
 * @example
 * // Define event types
 * interface MyEvents {
 *   change: [];
 *   select: [id: string];
 * }
 *
 * // Create manager
 * const events = new EventManager<MyEvents>();
 *
 * // Subscribe
 * const handler = (id: string) => console.log('Selected:', id);
 * events.on('select', handler);
 *
 * // Emit
 * events.emit('select', 'item-1');
 *
 * // Unsubscribe (works with React useEffect cleanup)
 * events.off('select', handler);
 */
export class EventManager<TEvents extends Record<string, unknown[]>> {
  private handlers: Map<keyof TEvents, Set<EventHandler<unknown[]>>> = new Map();

  /**
   * Subscribe to an event
   *
   * @param event - The event name
   * @param handler - The handler function
   */
  on<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as EventHandler<unknown[]>);
  }

  /**
   * Unsubscribe from an event
   *
   * @param event - The event name
   * @param handler - The handler function to remove
   */
  off<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.delete(handler as EventHandler<unknown[]>);
    }
  }

  /**
   * Emit an event to all subscribers
   *
   * @param event - The event name
   * @param args - Arguments to pass to handlers
   */
  emit<K extends keyof TEvents>(event: K, ...args: TEvents[K]): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      for (const handler of eventHandlers) {
        (handler as EventHandler<TEvents[K]>)(...args);
      }
    }
  }

  /**
   * Check if an event has any subscribers
   *
   * @param event - The event name (optional, checks all events if not provided)
   * @returns True if the event has subscribers
   */
  hasListeners(event?: keyof TEvents): boolean {
    if (event !== undefined) {
      const eventHandlers = this.handlers.get(event);
      return eventHandlers ? eventHandlers.size > 0 : false;
    }
    for (const handlers of this.handlers.values()) {
      if (handlers.size > 0) return true;
    }
    return false;
  }

  /**
   * Remove all listeners for an event or all events
   *
   * @param event - The event name (optional, removes all if not provided)
   */
  removeAllListeners(event?: keyof TEvents): void {
    if (event !== undefined) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   *
   * @param event - The event name
   * @returns The number of listeners
   */
  listenerCount(event: keyof TEvents): number {
    const eventHandlers = this.handlers.get(event);
    return eventHandlers ? eventHandlers.size : 0;
  }
}

// Default export for convenience
export default EventManager;
