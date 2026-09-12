import 'dotenv/config';
import express from 'express';
import { initDb } from './db';
import { eventsRouter } from './routes/events';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/events', eventsRouter);

app.use(
  (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err.name === 'UnauthorizedError' || err.status === 401) {
      return res.status(401).json({ error: 'invalid or missing token' });
    }
    console.error(err);
    res.status(500).json({ error: 'internal server error' });
  }
);

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`access-log-api listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('failed to initialize database', err);
    process.exit(1);
  });
