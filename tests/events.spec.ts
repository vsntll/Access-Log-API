import { test, expect } from '@playwright/test';
import { getAccessToken } from './auth-token';

test('GET /events returns an array without auth', async ({ request }) => {
  const response = await request.get('/events');
  expect(response.status()).toBe(200);
  expect(Array.isArray(await response.json())).toBe(true);
});

test('POST /events without a token is rejected', async ({ request }) => {
  const response = await request.post('/events', {
    data: {
      subject_id: 'user-1',
      door_id: 'door-1',
      event_type: 'badge_in',
    },
  });
  expect(response.status()).toBe(401);
});

test('POST /events with a valid token creates an event', async ({ request }) => {
  const token = await getAccessToken();
  test.skip(!token, 'AUTH0_CLIENT_ID/SECRET not configured');

  const response = await request.post('/events', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      subject_id: 'user-1',
      door_id: 'door-1',
      event_type: 'badge_in',
    },
  });
  expect(response.status()).toBe(201);

  const body = await response.json();
  expect(body).toMatchObject({
    subject_id: 'user-1',
    door_id: 'door-1',
    event_type: 'badge_in',
  });
});
