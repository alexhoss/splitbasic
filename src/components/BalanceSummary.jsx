import { useState } from 'react'
import Avatar from './Avatar.jsx'
import PaymentForm from './PaymentForm.jsx'
import { computeBalances, settleBalances, formatMoney } from '../lib/balance.js'

export default function BalanceSummary({ expenses, payments, friends, onAddPayment }) {
  const [draft, setDraft] = useState(null) // transfer being recorded, or null
  const byId = new Map(friends.map((f) => [f.id, f]))
  const balances = computeBalances(expenses, payments)
  const transfers = settleBalances(balances)

  // Everyone in the trip appears in the list; settled friends are marked.
  const rows = friends
    .map((friend) => ({ friend, amount: balances.get(friend.id) ?? 0 }))
    .sort((a, b) => {
      const aSettled = Math.abs(a.amount) <= 0.004
      const bSettled = Math.abs(b.amount) <= 0.004
      if (aSettled !== bSettled) return aSettled ? 1 : -1 // unsettled first
      if (aSettled) return a.friend.name.localeCompare(b.friend.name)
      return b.amount - a.amount
    })

  return (
    <section className="card balance-card">
      <header className="card-header"><h2>Balances</h2></header>

      {friends.length === 0 ? (
        <p className="empty-hint">Add some friends to see their balances.</p>
      ) : (
        <ul className="balance-list">
          {rows.map(({ friend, amount }) => {
            const settled = Math.abs(amount) <= 0.004
            return (
              <li key={friend.id} className="balance-row">
                <Avatar
                  name={friend.name}
                  index={friends.findIndex((f) => f.id === friend.id)}
                  size="sm"
                />
                <span className="balance-name">{friend.name}</span>
                <span
                  className={`balance-amount ${settled ? 'settled' : amount > 0 ? 'positive' : 'negative'}`}
                >
                  {settled ? 'settled up' : amount > 0 ? `gets ${formatMoney(amount)}` : `owes ${formatMoney(amount)}`}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {transfers.length > 0 && (
        <div className="settlement">
          <h3 className="settlement-title">To settle up</h3>
          <ul className="transfer-list">
            {transfers.map((t, i) => {
              const from = byId.get(t.fromId)
              const to = byId.get(t.toId)
              if (!from || !to) return null
              return (
                <li key={i} className="transfer-row">
                  <span className="transfer-names">
                    <strong>{from.name}</strong> pays <strong>{to.name}</strong>
                  </span>
                  <span className="transfer-right">
                    <span className="transfer-amount">{formatMoney(t.amount)}</span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setDraft(t)}
                    >
                      Record
                    </button>
                  </span>
                </li>
              )
            })}
          </ul>

          {draft && (
            <div className="card-inline-form">
              <PaymentForm
                key={`${draft.fromId}-${draft.toId}`}
                friends={friends}
                defaults={{
                  fromId: draft.fromId,
                  toId: draft.toId,
                  amount: draft.amount.toFixed(2),
                }}
                submitLabel="Mark as paid"
                onSave={(payment) => {
                  onAddPayment(payment)
                  setDraft(null)
                }}
                onCancel={() => setDraft(null)}
              />
            </div>
          )}
        </div>
      )}
    </section>
  )
}
