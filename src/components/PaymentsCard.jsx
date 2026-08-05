import { useState } from 'react'
import ConfirmDialog from './ConfirmDialog.jsx'
import PaymentForm from './PaymentForm.jsx'
import { formatMoney } from '../lib/balance.js'
import { formatDateTime } from '../lib/time.js'

export default function PaymentsCard({ payments, friends, onAdd, onDelete }) {
  const [showForm, setShowForm] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const byId = new Map(friends.map((f) => [f.id, f]))

  const save = (payment) => {
    onAdd(payment)
    setShowForm(false)
  }

  return (
    <section className="card">
      <header className="card-header">
        <h2>Payments</h2>
        {friends.length > 1 && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowForm((v) => !v)}
            aria-expanded={showForm}
          >
            {showForm ? 'Cancel' : '+ Record payment'}
          </button>
        )}
      </header>

      {showForm && (
        <div className="card-inline-form">
          <PaymentForm
            friends={friends}
            onSave={save}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {payments.length === 0 ? (
        <p className="empty-hint">
          No payments yet. Record when someone actually sends money, like
          'cash' or 'e-transfer'.
        </p>
      ) : (
        <ul className="payment-list">
          {payments.map((p) => {
            const from = byId.get(p.fromId)
            const to = byId.get(p.toId)
            if (!from || !to) return null
            return (
              <li key={p.id} className="payment-row">
                <div className="payment-main">
                  <div className="payment-line">
                    <span className="payment-names">
                      <strong>{from.name}</strong> → <strong>{to.name}</strong>
                    </span>
                  </div>
                  {p.note && <span className="payment-note">{p.note}</span>}
                  <span className="payment-time">{formatDateTime(p.date)}</span>
                </div>
                <span className="payment-amount">{formatMoney(p.amount)}</span>
                <button
                  className="icon-btn"
                  title="Delete payment"
                  aria-label="Delete payment"
                  onClick={() => setToDelete(p)}
                >
                  ✕
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete payment?"
        message="This payment will be removed from the balances."
        confirmLabel="Delete payment"
        onConfirm={() => {
          onDelete(toDelete.id)
          setToDelete(null)
        }}
        onCancel={() => setToDelete(null)}
      />
    </section>
  )
}
