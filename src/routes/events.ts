import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/auth';

export const eventsRouter = Router();

eventsRouter.get('/', async (_req: Request, res: Response) => {
  const result = await pool.query(
    'SELECT id, subject_id, door_id, event_type, occurred_at FROM access_events ORDER BY occurred_at DESC'
  );
  res.json(result.rows);
});

eventsRouter.get('/:id', async (req: Request, res: Response) => {
  const result = await pool.query(
    'SELECT id, subject_id, door_id, event_type, occurred_at FROM access_events WHERE id = $1',
    [req.params.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'event not found' });
  }
  res.json(result.rows[0]);
});

eventsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  const { subject_id, door_id, event_type, occurred_at } = req.body ?? {};
  if (!subject_id || !door_id || !event_type) {
    return res
      .status(400)
      .json({ error: 'subject_id, door_id and event_type are required' });
  }

  const result = await pool.query(
    `INSERT INTO access_events (subject_id, door_id, event_type, occurred_at)
     VALUES ($1, $2, $3, COALESCE($4, now()))
     RETURNING id, subject_id, door_id, event_type, occurred_at`,
    [subject_id, door_id, event_type, occurred_at ?? null]
  );
  res.status(201).json(result.rows[0]);
});

eventsRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const result = await pool.query(
    'DELETE FROM access_events WHERE id = $1 RETURNING id',
    [req.params.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'event not found' });
  }
  res.status(204).send();
});
