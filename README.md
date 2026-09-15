# Access Log API

Small REST service for logging physical access events (badge swipes, door
opens, etc). Built with Node.js, TypeScript, Express and PostgreSQL,
containerized with Docker, and secured with Auth0 (OAuth2 / OIDC).

## Stack

- Node.js + TypeScript + Express
- PostgreSQL (via `pg`, parameterized queries, no ORM)
- Auth0 (`express-oauth2-jwt-bearer`) — scope-based, open for `GET`
- Zod for request validation
- `express-rate-limit` + Pino structured logging
- Docker + Docker Compose
- Playwright for end-to-end API tests, Vitest for unit tests
- GitHub Actions CI

## Data model

- **doors**: `id`, `name` (unique), `location`, `created_at`
- **access_events**: `id`, `subject_id`, `door_id` (FK → `doors.id`), `event_type`, `occurred_at`

## API

| Method | Path          | Auth required     |
| ------ | ------------- | ------------------ |
| GET    | `/health`     | no                  |
| GET    | `/events`     | no                  |
| GET    | `/events/:id` | no                  |
| POST   | `/events`     | `write:events` scope |
| DELETE | `/events/:id` | `write:events` scope |
| GET    | `/doors`      | no                  |
| GET    | `/doors/:id`  | no                  |
| POST   | `/doors`      | `write:doors` scope  |
| DELETE | `/doors/:id`  | `write:doors` scope  |

`GET /events` supports query params `door_id`, `subject_id`, `from`, `to`
(ISO 8601), `limit` (default 50, max 200) and `offset`, and returns
`{ items, limit, offset }`.

All request bodies and query params are validated with Zod; invalid input
returns `400` with a `details` array. A door that doesn't exist returns
`400` on `POST /events`. Missing/invalid tokens return `401`; a valid
token without the required scope returns `403`.

## Setup

### 1. Configure environment

```bash
cp .env.example .env
```

Fill in `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` from your Auth0 API settings
(Auth0 Dashboard → Applications → APIs).

### 2. Enable scopes in Auth0 (RBAC)

This API checks for `write:events` and `write:doors` scopes on write
routes, so the API and the client calling it both need to know about them:

1. **Applications → APIs → your API → Permissions** — add two permissions:
   `write:events` and `write:doors` (any description).
2. **Applications → APIs → your API → Settings** — turn on **Enable RBAC**
   and **Add Permissions in the Access Token**.
3. **Applications → Applications → Create Application → Machine to Machine**,
   authorize it for your API, and grant it the `write:events` and
   `write:doors` permissions. Copy its **Client ID** / **Client Secret**
   into `AUTH0_CLIENT_ID` / `AUTH0_CLIENT_SECRET` in `.env` — these are
   only used by the Playwright tests to request tokens.

Skipping this step is fine to run the API itself; the Playwright tests
that need a token will just skip (see Testing below).

### 3. Run with Docker Compose (recommended)

```bash
docker compose up --build
```

This starts Postgres and the API together. The API creates the `doors`
and `access_events` tables on boot and listens on `http://localhost:3000`.

```bash
curl http://localhost:3000/health
```

### 4. Run locally without Docker

```bash
npm install
npm run dev
```

Requires a local Postgres reachable at `DATABASE_URL`.

## Testing

### Unit tests (Vitest)

Route logic and validation schemas tested in isolation, with the database
and Auth0 middleware mocked — no running server or network access needed:

```bash
npm run test:unit
```

### End-to-end tests (Playwright)

Exercise the running API over HTTP (start it first, via Docker Compose or
`npm run dev`):

```bash
npx playwright install --with-deps chromium   # first run only
npm run test:e2e
```

Covers, among other things:

- `GET /health`, `GET /events`, `GET /doors` work without a token
- Pagination/filtering on `GET /events` (`door_id`, `subject_id`, limits)
- `404` for unknown ids, `400` for invalid bodies/params, `409` for a
  duplicate door name
- `401` without a token, `403` with a token missing the required scope
- Full create → read → delete flows for both `doors` and `events` using
  real Auth0 client-credentials tokens

Tests that need a token skip automatically (with a reason) if
`AUTH0_CLIENT_ID`/`AUTH0_CLIENT_SECRET` aren't set, or if the client
doesn't have the relevant scope — see step 2 above to enable them.

### CI

`.github/workflows/ci.yml` runs on every push/PR: build, unit tests, boots
the API against a Postgres service container, then runs the Playwright
suite. Add `AUTH0_DOMAIN` / `AUTH0_AUDIENCE` / `AUTH0_CLIENT_ID` /
`AUTH0_CLIENT_SECRET` as repository secrets to also exercise the
token-authenticated tests in CI; otherwise they skip there too.

## Project layout

```
src/
  app.ts               # Express app: middleware, routes, error handling
  index.ts             # bootstrap: initDb() then app.listen()
  db.ts                # pg pool + CREATE TABLE IF NOT EXISTS
  logger.ts            # Pino logger
  middleware/
    auth.ts             # Auth0 JWT bearer + scope-checking middleware
    rateLimit.ts         # express-rate-limit config
  routes/
    events.ts            # GET/POST/DELETE /events handlers
    doors.ts              # GET/POST/DELETE /doors handlers
  validation/
    events.ts             # Zod schemas for events
    doors.ts               # Zod schemas for doors
    validate.ts             # generic Zod validation middleware
tests/                  # Playwright end-to-end tests
test-unit/              # Vitest unit tests
.github/workflows/ci.yml
```
