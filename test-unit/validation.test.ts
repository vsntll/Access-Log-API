import { describe, it, expect } from 'vitest';
import { createEventSchema, listEventsQuerySchema } from '../src/validation/events';
import { createDoorSchema } from '../src/validation/doors';

describe('createEventSchema', () => {
  it('accepts a minimal valid event', () => {
    const result = createEventSchema.safeParse({
      subject_id: 'user-1',
      door_id: '3',
      event_type: 'badge_in',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.door_id).toBe(3);
    }
  });

  it('rejects a missing subject_id', () => {
    const result = createEventSchema.safeParse({
      door_id: 1,
      event_type: 'badge_in',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-numeric door_id', () => {
    const result = createEventSchema.safeParse({
      subject_id: 'user-1',
      door_id: 'front-door',
      event_type: 'badge_in',
    });
    expect(result.success).toBe(false);
  });
});

describe('listEventsQuerySchema', () => {
  it('defaults limit and offset', () => {
    const result = listEventsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(0);
    }
  });

  it('rejects a limit above the max', () => {
    const result = listEventsQuerySchema.safeParse({ limit: '500' });
    expect(result.success).toBe(false);
  });
});

describe('createDoorSchema', () => {
  it('accepts a door with only a name', () => {
    const result = createDoorSchema.safeParse({ name: 'Front Entrance' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty name', () => {
    const result = createDoorSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});
