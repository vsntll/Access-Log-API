import { test, expect } from '@playwright/test';
import { getAccessToken } from './auth-token';

test.describe('authenticated event flows', () => {
  let eventsToken: string | null;
  let door: { id: number } | null = null;

  test.beforeAll(async ({ request }) => {
    eventsToken = await getAccessToken('write:events');
    const doorsToken = await getAccessToken('write:doors');
    if (!doorsToken) return;

    const created = await request.post('/doors', {
      headers: { Authorization: `Bearer ${doorsToken}` },
      data: { name: `Fixture Door ${Date.now()}` },
    });
    if (created.ok()) {
      door = await created.json();
    }
  });

  test('creates an event with a valid token', async ({ request }) => {
    test.skip(!eventsToken || !door, 'AUTH0 client not configured with write:events/write:doors');

    const response = await request.post('/events', {
      headers: { Authorization: `Bearer ${eventsToken}` },
      data: { subject_id: 'user-1', door_id: door!.id, event_type: 'badge_in' },
    });
    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toMatchObject({
      subject_id: 'user-1',
      door_id: door!.id,
      event_type: 'badge_in',
    });
  });

  test('rejects a door_id that does not exist', async ({ request }) => {
    test.skip(!eventsToken, 'AUTH0 client not configured with write:events');

    const response = await request.post('/events', {
      headers: { Authorization: `Bearer ${eventsToken}` },
      data: { subject_id: 'user-1', door_id: 999999, event_type: 'badge_in' },
    });
    expect(response.status()).toBe(400);
  });

  test('rejects a missing event_type', async ({ request }) => {
    test.skip(!eventsToken || !door, 'AUTH0 client not configured with write:events/write:doors');

    const response = await request.post('/events', {
      headers: { Authorization: `Bearer ${eventsToken}` },
      data: { subject_id: 'user-1', door_id: door!.id },
    });
    expect(response.status()).toBe(400);
  });

  test('filters events by door_id and deletes them', async ({ request }) => {
    test.skip(!eventsToken || !door, 'AUTH0 client not configured with write:events/write:doors');

    const subject = `filter-subject-${Date.now()}`;
    const created = await request.post('/events', {
      headers: { Authorization: `Bearer ${eventsToken}` },
      data: { subject_id: subject, door_id: door!.id, event_type: 'badge_out' },
    });
    expect(created.status()).toBe(201);
    const event = await created.json();

    const filtered = await request.get(`/events?door_id=${door!.id}&subject_id=${subject}`);
    expect(filtered.status()).toBe(200);
    const body = await filtered.json();
    expect(body.items.length).toBeGreaterThanOrEqual(1);
    expect(body.items.every((e: any) => e.door_id === door!.id && e.subject_id === subject)).toBe(true);

    const deleted = await request.delete(`/events/${event.id}`, {
      headers: { Authorization: `Bearer ${eventsToken}` },
    });
    expect(deleted.status()).toBe(204);

    const afterDelete = await request.get(`/events/${event.id}`);
    expect(afterDelete.status()).toBe(404);
  });
});
