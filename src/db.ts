import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS doors (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      location TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS access_events (
      id SERIAL PRIMARY KEY,
      subject_id TEXT NOT NULL,
      door_id INTEGER NOT NULL REFERENCES doors(id),
      event_type TEXT NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS access_events_door_id_idx ON access_events (door_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS access_events_subject_id_idx ON access_events (subject_id);
  `);
}
