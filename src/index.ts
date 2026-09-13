import 'dotenv/config';
import { app } from './app';
import { initDb } from './db';
import { logger } from './logger';

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

initDb()
  .then(() => {
    app.listen(port, () => {
      logger.info(`access-log-api listening on port ${port}`);
    });
  })
  .catch((err) => {
    logger.error(err, 'failed to initialize database');
    process.exit(1);
  });
