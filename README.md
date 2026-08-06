# SplitBasic

A small Splitwise-style expense splitter: create **trips**, add friends and
expenses, and see who owes whom with automatic balance simplification.

- **Frontend:** React + Vite
- **Backend:** Node + Express (REST API)
- **Storage:** SQLite via `better-sqlite3` (single file, no external DB service)

## Quick start (pull from GitHub Container Registry)

The easiest way to run SplitBasic — no build tools, no Node.js, just Docker.

Create a `docker-compose.yml` with your GitHub username swapped in:

```yaml
services:
  splitbasic:
    image: ghcr.io/your-username/splitwise-basic:latest
    ports:
      - "3000:3000"
    environment:
      PORT: 3000
      DB_PATH: /app/data/splitbasic.db
    volumes:
      - splitbasic-data:/app/data
    restart: unless-stopped

volumes:
  splitbasic-data:
```

Then:

```bash
docker compose up -d
```

Open <http://localhost:3000>. Your data is stored in the `splitbasic-data`
Docker volume and survives restarts and image updates.

To upgrade to the latest image later:

```bash
docker compose pull
docker compose up -d
```

Stop with:

```bash
docker compose down        # keeps data
docker compose down -v     # also deletes data
```

## Build from source (Docker Compose)

If you've cloned the repo and want to build the image locally:

```bash
docker compose up --build -d
```

Then open <http://localhost:3000>. The SQLite database is stored in the
`splitbasic-data` Docker volume, so your data survives rebuilds and restarts.

Stop with:

```bash
docker compose down        # keeps the data volume
docker compose down -v     # also deletes the data volume
```

## Run locally (development)

The API server (port 3000) and the Vite dev server (port 5173, which proxies
`/api` calls) run as two processes:

```bash
# Terminal 1 - API server
npm install
npm run server

# Terminal 2 - Vite dev server with hot reload
npm run dev
```

Open <http://localhost:5173>.

## Releasing (for maintainers)

Images are built and published automatically via GitHub Actions
(`.github/workflows/release.yml`).

- **Push to `master`** → image tagged `master` pushed to `ghcr.io`
- **Push a version tag** (`v1.2.3`) → image pushed with tags `latest`,
  `1.2.3`, `1.2`, `1` (semver)
- **Pull request** → image is built to validate but not pushed

To cut a release:

```bash
npm version patch   # or minor / major — bumps version in package.json
git push --tags
```

The workflow requires no secrets — `GITHUB_TOKEN` is provided automatically.
The repo must be **public** for the image to be pullable without a token.

## Configuration

| Variable  | Default                | Purpose                        |
| --------- | ---------------------- | ------------------------------ |
| `PORT`    | `3000`                 | HTTP port for the API server   |
| `DB_PATH` | `./data/splitbasic.db` | Location of the SQLite file    |

## API

| Method | Path                             | Description                          |
| ------ | -------------------------------- | ------------------------------------ |
| GET    | `/api/trips`                     | List trips                           |
| POST   | `/api/trips`                     | Create trip `{ name }`               |
| DELETE | `/api/trips/:id`                 | Delete trip (cascades its data)      |
| GET    | `/api/trips/:tripId/friends`     | List friends in a trip               |
| POST   | `/api/trips/:tripId/friends`     | Add friend `{ name }`                |
| DELETE | `/api/friends/:id`               | Remove friend (and their expenses)   |
| GET    | `/api/trips/:tripId/expenses`    | List expenses in a trip              |
| POST   | `/api/trips/:tripId/expenses`    | Add expense `{ description, amount, paidBy, participants[] }` |
| DELETE | `/api/expenses/:id`              | Remove an expense                    |
| GET    | `/api/trips/:tripId/payments`    | List recorded payments               |
| POST   | `/api/trips/:tripId/payments`    | Record a payment `{ fromId, toId, amount, note }` |
| DELETE | `/api/payments/:id`              | Remove a payment                     |
| GET    | `/api/trips/:tripId/logs`        | Activity log (adds/removals, newest first) |

## Back up your data

The SQLite database lives in the `splitbasic-data` Docker volume. To back it up:

```bash
# Copy the database file out of the running container
docker compose cp app:/app/data/splitbasic.db ./splitbasic-backup.db
```

Or, to back up the entire volume (stops the container briefly):

```bash
docker run --rm -v splitbasic-data:/data -v "$(pwd)":/backup alpine cp /data/splitbasic.db /backup/
```
