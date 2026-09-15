import { test, expect } from '@playwright/test';

test('GET /events returns a paginated list without auth', async ({ request }) => {
  const response = await request.get('/events');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body.items)).toBe(true);
  expect(body.limit).toBe(50);
  expect(body.offset).toBe(0);
});

test('GET /events rejects an out-of-range limit', async ({ request }) => {
  const response = await request.get('/events?limit=1000');
  expect(response.status()).toBe(400);
});

test('GET /events/:id returns 404 for an unknown event', async ({ request }) => {
  const response = await request.get('/events/999999');
  expect(response.status()).toBe(404);
});

test('GET /events/:id returns 400 for a non-numeric id', async ({ request }) => {
  const response = await request.get('/events/not-a-number');
  expect(response.status()).toBe(400);
});

test('POST /events without a token is rejected', async ({ request }) => {
  const response = await request.post('/events', {
    data: { subject_id: 'user-1', door_id: 1, event_type: 'badge_in' },
  });
  expect(response.status()).toBe(401);
});

test('DELETE /events/:id without a token is rejected', async ({ request }) => {
  const response = await request.delete('/events/1');
  expect(response.status()).toBe(401);
});
