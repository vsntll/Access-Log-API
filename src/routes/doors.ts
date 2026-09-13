import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { requireScope } from '../middleware/auth';
import { validate } from '../validation/validate';
import { createDoorSchema, doorIdParamSchema } from '../validation/doors';

export const doorsRouter = Router();

doorsRouter.get('/', async (_req: Request, res: Response) => {
  const result = await pool.query(
    'SELECT id, name, location, created_at FROM doors ORDER BY name'
  );
  res.json(result.rows);
});

doorsRouter.get(
  '/:id',
  validate(doorIdParamSchema, 'params'),
  async (req: Request, res: Response) => {
    const { id } = (req as any).validParams;
    const result = await pool.query(
      'SELECT id, name, location, created_at FROM doors WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'door not found' });
    }
    res.json(result.rows[0]);
  }
);

doorsRouter.post(
  '/',
  ...requireScope('write:doors'),
  validate(createDoorSchema, 'body'),
  async (req: Request, res: Response) => {
    const { name, location } = (req as any).validBody;
    try {
      const result = await pool.query(
        `INSERT INTO doors (name, location) VALUES ($1, $2)
         RETURNING id, name, location, created_at`,
        [name, location ?? null]
      );
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'a door with this name already exists' });
      }
      throw err;
    }
  }
);

doorsRouter.delete(
  '/:id',
  ...requireScope('write:doors'),
  validate(doorIdParamSchema, 'params'),
  async (req: Request, res: Response) => {
    const { id } = (req as any).validParams;
    const result = await pool.query('DELETE FROM doors WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'door not found' });
    }
    res.status(204).send();
  }
);
