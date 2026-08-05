import { formatDateTime } from '../lib/time.js'

const ACTION_META = {
  friend_added: { label: 'Friend added', tone: 'friend' },
  friend_removed: { label: 'Friend removed', tone: 'friend' },
  expense_added: { label: 'Expense added', tone: 'expense' },
  expense_removed: { label: 'Expense removed', tone: 'expense' },
  payment_added: { label: 'Payment', tone: 'payment' },
  payment_removed: { label: 'Payment removed', tone: 'payment' },
}

export default function TripPage({ trip, logs, onBack }) {
  return (
    <div className="trip-page">
      <section className="card trip-page-header">
        <div className="trip-page-title">
          <h1>{trip?.name ?? 'Trip'}</h1>
          <p>Activity log. Everything that's happened in this trip.</p>
        </div>
        <button className="btn btn-ghost" onClick={onBack}>
          &larr; Back to dashboard
        </button>
      </section>

      <section className="card">
        <header className="card-header">
          <h2>Activity</h2>
          <span className="count-badge">{logs.length}</span>
        </header>

        {logs.length === 0 ? (
          <p className="empty-hint">
            Nothing here yet. Add friends, expenses, or record a payment and
            it'll show up in this log.
          </p>
        ) : (
          <ul className="log-list">
            {logs.map((entry) => {
              const meta = ACTION_META[entry.action] ?? {
                label: entry.action,
                tone: 'other',
              }
              return (
                <li key={entry.id} className="log-row">
                  <span className={`log-tag log-tag-${meta.tone}`}>{meta.label}</span>
                  <div className="log-main">
                    <span className="log-detail">{entry.detail}</span>
                    <span className="log-time">{formatDateTime(entry.date, { withYear: false })}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
