import express from 'express';
import pinoHttp from 'pino-http';
import { logger } from './logger';
import { apiRateLimit } from './middleware/rateLimit';
import { eventsRouter } from './routes/events';
import { doorsRouter } from './routes/doors';

export const app = express();
app.use(pinoHttp({ logger }));
app.use(apiRateLimit);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/events', eventsRouter);
app.use('/doors', doorsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'not found' });
});

app.use(
  (err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err.name === 'UnauthorizedError' || err.status === 401) {
      return res.status(401).json({ error: 'invalid or missing token' });
    }
    if (err.name === 'InsufficientScopeError' || err.status === 403) {
      return res.status(403).json({ error: 'insufficient scope' });
    }
    req.log.error(err);
    res.status(500).json({ error: 'internal server error' });
  }
);
