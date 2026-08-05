# SplitBasic

A small Splitwise-style expense splitter: create **trips**, add friends and
expenses, and see who owes whom with automatic balance simplification.

- **Frontend:** React + Vite
- **Backend:** Node + Express (REST API)
- **Storage:** SQLite via `better-sqlite3` (single file, no external DB service)

## Run with Docker Compose (recommended)

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
