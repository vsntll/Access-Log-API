import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS access_events (
      id SERIAL PRIMARY KEY,
      subject_id TEXT NOT NULL,
      door_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}
