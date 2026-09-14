import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../src/middleware/auth', () => ({
  requireScope: () => [(_req: any, _res: any, next: any) => next()],
  checkJwt: (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../src/db', () => ({
  pool: { query: vi.fn() },
  initDb: vi.fn(),
}));

import { pool } from '../src/db';
import { app } from '../src/app';

const mockQuery = vi.mocked(pool.query);

beforeEach(() => {
  mockQuery.mockReset();
});

describe('GET /events', () => {
  it('returns paginated items with default limit/offset', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, subject_id: 's1', door_id: 1, event_type: 'badge_in', occurred_at: '2024-01-01T00:00:00.000Z' }],
    } as any);

    const res = await request(app).get('/events');

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.limit).toBe(50);
    expect(res.body.offset).toBe(0);
  });

  it('rejects an out-of-range limit', async () => {
    const res = await request(app).get('/events?limit=0');
    expect(res.status).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe('GET /events/:id', () => {
  it('returns 404 when the event does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const res = await request(app).get('/events/1');
    expect(res.status).toBe(404);
  });

  it('returns 400 for a non-numeric id', async () => {
    const res = await request(app).get('/events/not-a-number');
    expect(res.status).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe('POST /events', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/events').send({});
    expect(res.status).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('creates an event given a valid body', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, subject_id: 's1', door_id: 1, event_type: 'badge_in', occurred_at: '2024-01-01T00:00:00.000Z' }],
    } as any);

    const res = await request(app)
      .post('/events')
      .send({ subject_id: 's1', door_id: 1, event_type: 'badge_in' });

    expect(res.status).toBe(201);
    expect(res.body.subject_id).toBe('s1');
  });

  it('returns 400 when the referenced door does not exist', async () => {
    mockQuery.mockRejectedValueOnce({ code: '23503' });

    const res = await request(app)
      .post('/events')
      .send({ subject_id: 's1', door_id: 999, event_type: 'badge_in' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/does not exist/);
  });
});
