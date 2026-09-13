import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { requireScope } from '../middleware/auth';
import { validate } from '../validation/validate';
import { createEventSchema, eventIdParamSchema, listEventsQuerySchema } from '../validation/events';

export const eventsRouter = Router();

eventsRouter.get(
  '/',
  validate(listEventsQuerySchema, 'query'),
  async (req: Request, res: Response) => {
    const { door_id, subject_id, from, to, limit, offset } = (req as any).validQuery;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (door_id !== undefined) {
      params.push(door_id);
      conditions.push(`door_id = $${params.length}`);
    }
    if (subject_id !== undefined) {
      params.push(subject_id);
      conditions.push(`subject_id = $${params.length}`);
    }
    if (from !== undefined) {
      params.push(from);
      conditions.push(`occurred_at >= $${params.length}`);
    }
    if (to !== undefined) {
      params.push(to);
      conditions.push(`occurred_at <= $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const result = await pool.query(
      `SELECT id, subject_id, door_id, event_type, occurred_at FROM access_events
       ${where}
       ORDER BY occurred_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ items: result.rows, limit, offset });
  }
);

eventsRouter.get(
  '/:id',
  validate(eventIdParamSchema, 'params'),
  async (req: Request, res: Response) => {
    const { id } = (req as any).validParams;
    const result = await pool.query(
      'SELECT id, subject_id, door_id, event_type, occurred_at FROM access_events WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'event not found' });
    }
    res.json(result.rows[0]);
  }
);

eventsRouter.post(
  '/',
  ...requireScope('write:events'),
  validate(createEventSchema, 'body'),
  async (req: Request, res: Response) => {
    const { subject_id, door_id, event_type, occurred_at } = (req as any).validBody;
    try {
      const result = await pool.query(
        `INSERT INTO access_events (subject_id, door_id, event_type, occurred_at)
         VALUES ($1, $2, $3, COALESCE($4, now()))
         RETURNING id, subject_id, door_id, event_type, occurred_at`,
        [subject_id, door_id, event_type, occurred_at ?? null]
      );
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      if (err.code === '23503') {
        return res.status(400).json({ error: `door_id ${door_id} does not exist` });
      }
      throw err;
    }
  }
);

eventsRouter.delete(
  '/:id',
  ...requireScope('write:events'),
  validate(eventIdParamSchema, 'params'),
  async (req: Request, res: Response) => {
    const { id } = (req as any).validParams;
    const result = await pool.query(
      'DELETE FROM access_events WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'event not found' });
    }
    res.status(204).send();
  }
);
