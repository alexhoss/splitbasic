import express from 'express'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import db from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 3000)
const app = express()

app.use(express.json())

// ---------- helpers ----------

const friendStmt = db.prepare('SELECT id, name FROM friends WHERE id = ?')
const friendNameStmt = db.prepare('SELECT name FROM friends WHERE id = ?')
const participantsStmt = db.prepare(
  'SELECT friend_id FROM expense_participants WHERE expense_id = ? ORDER BY friend_id',
)
const insertLogStmt = db.prepare(
  'INSERT INTO trip_logs (trip_id, action, detail) VALUES (?, ?, ?)',
)

function log(tripId, action, detail) {
  insertLogStmt.run(tripId, action, detail)
}

function friendName(id) {
  return friendNameStmt.get(id)?.name ?? 'Someone'
}

function tripToJson(row) {
  return { id: row.id, name: row.name, createdAt: row.created_at }
}

function friendToJson(row) {
  return { id: row.id, name: row.name }
}

function expenseToJson(row) {
  return {
    id: row.id,
    description: row.description,
    amount: row.amount,
    paidBy: row.paid_by,
    participants: participantsStmt.all(row.id).map((r) => r.friend_id),
    date: row.created_at,
  }
}

function paymentToJson(row) {
  return {
    id: row.id,
    fromId: row.from_id,
    toId: row.to_id,
    amount: row.amount,
    note: row.note,
    date: row.created_at,
  }
}

// ---------- trips ----------

app.get('/api/trips', (_req, res) => {
  const trips = db
    .prepare('SELECT * FROM trips ORDER BY created_at ASC')
    .all()
    .map(tripToJson)
  res.json(trips)
})

app.post('/api/trips', (req, res) => {
  const name = String(req.body?.name ?? '').trim()
  if (!name) return res.status(400).json({ error: 'Trip name is required' })
  if (name.length > 60) return res.status(400).json({ error: 'Trip name is too long' })
  const result = db.prepare('INSERT INTO trips (name) VALUES (?)').run(name)
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(tripToJson(trip))
})

app.delete('/api/trips/:id', (req, res) => {
  const id = Number(req.params.id)
  const info = db.prepare('DELETE FROM trips WHERE id = ?').run(id)
  if (!info.changes) return res.status(404).json({ error: 'Trip not found' })
  res.status(204).end()
})

// ---------- friends ----------

app.get('/api/trips/:tripId/friends', (req, res) => {
  const friends = db
    .prepare('SELECT * FROM friends WHERE trip_id = ? ORDER BY id ASC')
    .all(Number(req.params.tripId))
    .map(friendToJson)
  res.json(friends)
})

app.post('/api/trips/:tripId/friends', (req, res) => {
  const tripId = Number(req.params.tripId)
  const name = String(req.body?.name ?? '').trim()
  if (!name) return res.status(400).json({ error: 'Friend name is required' })
  if (name.length > 60) return res.status(400).json({ error: 'Friend name is too long' })
  if (!db.prepare('SELECT 1 FROM trips WHERE id = ?').get(tripId)) {
    return res.status(404).json({ error: 'Trip not found' })
  }
  const result = db
    .prepare('INSERT INTO friends (trip_id, name) VALUES (?, ?)')
    .run(tripId, name)
  log(tripId, 'friend_added', `${name} joined the trip`)
  res.status(201).json(friendToJson(friendStmt.get(result.lastInsertRowid)))
})

app.delete('/api/friends/:id', (req, res) => {
  const id = Number(req.params.id)
  const row = db.prepare('SELECT id, name, trip_id FROM friends WHERE id = ?').get(id)
  if (!row) return res.status(404).json({ error: 'Friend not found' })
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM expenses WHERE paid_by = ?').run(id)
    db.prepare('DELETE FROM expense_participants WHERE friend_id = ?').run(id)
    db.prepare('DELETE FROM payments WHERE from_id = ? OR to_id = ?').run(id, id)
    db.prepare('DELETE FROM friends WHERE id = ?').run(id)
    log(row.trip_id, 'friend_removed', `${row.name} left the trip`)
  })
  tx()
  res.status(204).end()
})

// ---------- expenses ----------

app.get('/api/trips/:tripId/expenses', (req, res) => {
  const expenses = db
    .prepare('SELECT * FROM expenses WHERE trip_id = ? ORDER BY created_at DESC, id DESC')
    .all(Number(req.params.tripId))
    .map(expenseToJson)
  res.json(expenses)
})

app.post('/api/trips/:tripId/expenses', (req, res) => {
  const tripId = Number(req.params.tripId)
  const { description, amount, paidBy, participants } = req.body ?? {}

  const desc = String(description ?? '').trim()
  const value = Number(amount)
  const payerId = Number(paidBy)
  const ids = Array.isArray(participants)
    ? [...new Set(participants.map(Number))].filter(Number.isFinite)
    : []

  if (!desc || !Number.isFinite(value) || value <= 0 || !Number.isFinite(payerId)) {
    return res.status(400).json({ error: 'Invalid expense details' })
  }
  if (desc.length > 100) return res.status(400).json({ error: 'Description is too long' })
  if (value > 1e9) return res.status(400).json({ error: 'Amount is too large' })
  if (!ids.length) {
    return res.status(400).json({ error: 'At least one participant is required' })
  }

  const payer = db.prepare('SELECT 1 FROM friends WHERE id = ? AND trip_id = ?').get(payerId, tripId)
  if (!payer) return res.status(400).json({ error: 'Payer is not in this trip' })

  const validIds = ids.filter((id) =>
    db.prepare('SELECT 1 FROM friends WHERE id = ? AND trip_id = ?').get(id, tripId),
  )
  if (!validIds.length) return res.status(400).json({ error: 'No valid participants' })

  const insertExpense = db.prepare(
    'INSERT INTO expenses (trip_id, description, amount, paid_by) VALUES (?, ?, ?, ?)',
  )
  const insertParticipant = db.prepare(
    'INSERT INTO expense_participants (expense_id, friend_id) VALUES (?, ?)',
  )

  const tx = db.transaction(() => {
    const result = insertExpense.run(tripId, desc, Math.round(value * 100) / 100, payerId)
    for (const id of validIds) insertParticipant.run(result.lastInsertRowid, id)
    return result.lastInsertRowid
  })

  const expenseId = tx()
  const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(expenseId)
  log(
    tripId,
    'expense_added',
    `${friendName(payerId)} added ${desc} ($${row.amount.toFixed(2)})`,
  )
  res.status(201).json(expenseToJson(row))
})

app.delete('/api/expenses/:id', (req, res) => {
  const id = Number(req.params.id)
  const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id)
  if (!row) return res.status(404).json({ error: 'Expense not found' })
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(id)
    log(
      row.trip_id,
      'expense_removed',
      `${friendName(row.paid_by)} removed ${row.description} ($${row.amount.toFixed(2)})`,
    )
  })
  tx()
  res.status(204).end()
})

// ---------- payments ----------

app.get('/api/trips/:tripId/payments', (req, res) => {
  const payments = db
    .prepare('SELECT * FROM payments WHERE trip_id = ? ORDER BY created_at DESC, id DESC')
    .all(Number(req.params.tripId))
    .map(paymentToJson)
  res.json(payments)
})

app.post('/api/trips/:tripId/payments', (req, res) => {
  const tripId = Number(req.params.tripId)
  const { fromId, toId, amount, note } = req.body ?? {}
  const from = Number(fromId)
  const to = Number(toId)
  const value = Number(amount)
  const memo = String(note ?? '').trim()

  if (!Number.isFinite(from) || !Number.isFinite(to) || !Number.isFinite(value) || value <= 0) {
    return res.status(400).json({ error: 'Invalid payment details' })
  }
  if (from === to) {
    return res.status(400).json({ error: 'Sender and receiver must be different' })
  }
  if (memo.length > 60) {
    return res.status(400).json({ error: 'Note is too long' })
  }

  const inTrip = db.prepare('SELECT 1 FROM friends WHERE id = ? AND trip_id = ?')
  if (!inTrip.get(from, tripId) || !inTrip.get(to, tripId)) {
    return res.status(400).json({ error: 'Both people must be in this trip' })
  }

  const result = db
    .prepare(
      'INSERT INTO payments (trip_id, from_id, to_id, amount, note) VALUES (?, ?, ?, ?, ?)',
    )
    .run(tripId, from, to, Math.round(value * 100) / 100, memo)
  const row = db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid)
  const noteSuffix = memo ? ` (${memo})` : ''
  log(
    tripId,
    'payment_added',
    `${friendName(from)} paid ${friendName(to)} $${row.amount.toFixed(2)}${noteSuffix}`,
  )
  res.status(201).json(paymentToJson(row))
})

app.delete('/api/payments/:id', (req, res) => {
  const id = Number(req.params.id)
  const row = db.prepare('SELECT * FROM payments WHERE id = ?').get(id)
  if (!row) return res.status(404).json({ error: 'Payment not found' })
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM payments WHERE id = ?').run(id)
    const noteSuffix = row.note ? ` (${row.note})` : ''
    log(
      row.trip_id,
      'payment_removed',
      `${friendName(row.from_id)} paid ${friendName(row.to_id)} $${row.amount.toFixed(2)}${noteSuffix}`,
    )
  })
  tx()
  res.status(204).end()
})

// ---------- trip note (shared sticky note) ----------

app.get('/api/trips/:tripId/note', (req, res) => {
  const row = db
    .prepare('SELECT content FROM trip_notes WHERE trip_id = ?')
    .get(Number(req.params.tripId))
  res.json({ content: row?.content ?? '' })
})

app.put('/api/trips/:tripId/note', (req, res) => {
  const tripId = Number(req.params.tripId)
  const content = String(req.body?.content ?? '')
  if (content.length > 2000) {
    return res.status(400).json({ error: 'Note is too long' })
  }
  db.prepare(
    `INSERT INTO trip_notes (trip_id, content, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(trip_id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`,
  ).run(tripId, content)
  res.json({ content })
})

// ---------- trip logs ----------

app.get('/api/trips/:tripId/logs', (req, res) => {
  const logs = db
    .prepare('SELECT * FROM trip_logs WHERE trip_id = ? ORDER BY created_at DESC, id DESC')
    .all(Number(req.params.tripId))
    .map((row) => ({
      id: row.id,
      action: row.action,
      detail: row.detail,
      date: row.created_at,
    }))
  res.json(logs)
})

// ---------- not found ----------

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// ---------- static frontend (production) ----------

const distDir = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distDir, 'index.html'))
    }
    next()
  })
}

// ---------- errors ----------

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Something went wrong' })
})

const server = app.listen(PORT, () => {
  console.log(`SplitBasic server listening on http://localhost:${PORT}`)
})

// Graceful shutdown: close the database cleanly on SIGTERM / SIGINT.
function shutdown(signal) {
  console.log(`\nReceived ${signal}, shutting down gracefully…`)
  server.close(() => {
    db.close()
    console.log('Server and database closed.')
    process.exit(0)
  })
  // Force exit after 10s if graceful shutdown hangs.
  setTimeout(() => {
    console.error('Forced shutdown after timeout.')
    process.exit(1)
  }, 10_000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
