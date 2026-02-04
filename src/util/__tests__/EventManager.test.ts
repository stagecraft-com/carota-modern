/**
 * Unit tests for EventManager
 *
 * Tests the type-safe event system with on/off/emit pattern.
 */

import { describe, it, expect, vi } from 'vitest';
import { EventManager } from '../EventManager';

// Test event types - use type alias instead of interface for Record constraint
type TestEvents = {
  simple: [];
  withArg: [value: string];
  withMultipleArgs: [a: number, b: string];
}

describe('EventManager', () => {
  describe('on()', () => {
    it('subscribes to events', () => {
      const events = new EventManager<TestEvents>();
      const handler = vi.fn();

      events.on('simple', handler);
      events.emit('simple');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('allows multiple handlers for same event', () => {
      const events = new EventManager<TestEvents>();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      events.on('simple', handler1);
      events.on('simple', handler2);
      events.emit('simple');

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('allows same handler to be added multiple times', () => {
      const events = new EventManager<TestEvents>();
      const handler = vi.fn();

      events.on('simple', handler);
      events.on('simple', handler); // Set prevents duplicates
      events.emit('simple');

      // Due to Set, handler is only called once
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('off()', () => {
    it('unsubscribes from events', () => {
      const events = new EventManager<TestEvents>();
      const handler = vi.fn();

      events.on('simple', handler);
      events.off('simple', handler);
      events.emit('simple');

      expect(handler).not.toHaveBeenCalled();
    });

    it('only removes the specified handler', () => {
      const events = new EventManager<TestEvents>();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      events.on('simple', handler1);
      events.on('simple', handler2);
      events.off('simple', handler1);
      events.emit('simple');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('handles removing non-existent handler gracefully', () => {
      const events = new EventManager<TestEvents>();
      const handler = vi.fn();

      // Should not throw
      events.off('simple', handler);

      expect(handler).not.toHaveBeenCalled();
    });

    it('handles removing from non-existent event gracefully', () => {
      const events = new EventManager<TestEvents>();
      const handler = vi.fn();

      // Should not throw
      expect(() => events.off('simple', handler)).not.toThrow();
    });
  });

  describe('emit()', () => {
    it('passes arguments to handlers', () => {
      const events = new EventManager<TestEvents>();
      const handler = vi.fn();

      events.on('withArg', handler);
      events.emit('withArg', 'test-value');

      expect(handler).toHaveBeenCalledWith('test-value');
    });

    it('passes multiple arguments correctly', () => {
      const events = new EventManager<TestEvents>();
      const handler = vi.fn();

      events.on('withMultipleArgs', handler);
      events.emit('withMultipleArgs', 42, 'hello');

      expect(handler).toHaveBeenCalledWith(42, 'hello');
    });

    it('does nothing when no handlers exist', () => {
      const events = new EventManager<TestEvents>();

      // Should not throw
      expect(() => events.emit('simple')).not.toThrow();
    });

    it('calls handlers in registration order', () => {
      const events = new EventManager<TestEvents>();
      const order: number[] = [];

      events.on('simple', () => order.push(1));
      events.on('simple', () => order.push(2));
      events.on('simple', () => order.push(3));
      events.emit('simple');

      expect(order).toEqual([1, 2, 3]);
    });
  });

  describe('hasListeners()', () => {
    it('returns false when no listeners', () => {
      const events = new EventManager<TestEvents>();

      expect(events.hasListeners()).toBe(false);
      expect(events.hasListeners('simple')).toBe(false);
    });

    it('returns true when listeners exist', () => {
      const events = new EventManager<TestEvents>();
      events.on('simple', () => {});

      expect(events.hasListeners()).toBe(true);
      expect(events.hasListeners('simple')).toBe(true);
    });

    it('returns false for events without listeners', () => {
      const events = new EventManager<TestEvents>();
      events.on('simple', () => {});

      expect(events.hasListeners('withArg')).toBe(false);
    });
  });

  describe('removeAllListeners()', () => {
    it('removes all listeners for specific event', () => {
      const events = new EventManager<TestEvents>();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      events.on('simple', handler1);
      events.on('withArg', handler2);
      events.removeAllListeners('simple');
      events.emit('simple');
      events.emit('withArg', 'test');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('removes all listeners when no event specified', () => {
      const events = new EventManager<TestEvents>();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      events.on('simple', handler1);
      events.on('withArg', handler2);
      events.removeAllListeners();
      events.emit('simple');
      events.emit('withArg', 'test');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('listenerCount()', () => {
    it('returns 0 for events with no listeners', () => {
      const events = new EventManager<TestEvents>();

      expect(events.listenerCount('simple')).toBe(0);
    });

    it('returns correct count for events with listeners', () => {
      const events = new EventManager<TestEvents>();

      events.on('simple', () => {});
      events.on('simple', () => {});
      events.on('simple', () => {});

      expect(events.listenerCount('simple')).toBe(3);
    });

    it('updates count when listeners are removed', () => {
      const events = new EventManager<TestEvents>();
      const handler = () => {};

      events.on('simple', handler);
      expect(events.listenerCount('simple')).toBe(1);

      events.off('simple', handler);
      expect(events.listenerCount('simple')).toBe(0);
    });
  });

  describe('React useEffect pattern', () => {
    it('works with cleanup pattern', () => {
      const events = new EventManager<TestEvents>();
      const handler = vi.fn();

      // Simulate useEffect
      const cleanup = () => events.off('simple', handler);
      events.on('simple', handler);

      // First emit should work
      events.emit('simple');
      expect(handler).toHaveBeenCalledTimes(1);

      // Cleanup
      cleanup();

      // After cleanup, handler should not be called
      events.emit('simple');
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
