import { test, expect } from '@playwright/test';
import { getAccessToken, tokenScopes } from './auth-token';

test('GET /doors returns an array without auth', async ({ request }) => {
  const response = await request.get('/doors');
  expect(response.status()).toBe(200);
  expect(Array.isArray(await response.json())).toBe(true);
});

test('GET /doors/:id returns 404 for an unknown door', async ({ request }) => {
  const response = await request.get('/doors/999999');
  expect(response.status()).toBe(404);
});

test('POST /doors without a token is rejected', async ({ request }) => {
  const response = await request.post('/doors', { data: { name: 'Front Entrance' } });
  expect(response.status()).toBe(401);
});

test.describe('with a write:doors token', () => {
  let token: string | null;

  test.beforeAll(async () => {
    token = await getAccessToken('write:doors');
  });

  test('creates, conflicts and deletes a door', async ({ request }) => {
    test.skip(!token, 'AUTH0 client is not configured or lacks the write:doors permission');

    const name = `Test Door ${Date.now()}`;

    const created = await request.post('/doors', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name, location: 'Building A' },
    });
    expect(created.status()).toBe(201);
    const door = await created.json();
    expect(door).toMatchObject({ name, location: 'Building A' });

    const conflict = await request.post('/doors', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name },
    });
    expect(conflict.status()).toBe(409);

    const invalid = await request.post('/doors', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: '' },
    });
    expect(invalid.status()).toBe(400);

    const deleted = await request.delete(`/doors/${door.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(deleted.status()).toBe(204);

    const afterDelete = await request.get(`/doors/${door.id}`);
    expect(afterDelete.status()).toBe(404);
  });
});

test('POST /doors with a token missing write:doors is forbidden', async ({ request }) => {
  const token = await getAccessToken('write:events');
  test.skip(!token, 'AUTH0 client is not configured with a narrowable write:events scope');
  test.skip(
    !!token && tokenScopes(token).includes('write:doors'),
    'this Auth0 tenant does not down-scope client-credentials tokens to the requested scope, ' +
      'so a write:events-only token cannot be obtained from this client'
  );

  const response = await request.post('/doors', {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: `Should Not Be Created ${Date.now()}` },
  });
  expect(response.status()).toBe(403);
});
