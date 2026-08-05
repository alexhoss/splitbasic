import { useState } from 'react'

export default function PaymentForm({
  friends,
  defaults = {},
  onSave,
  onCancel,
  submitLabel = 'Record payment',
  compact = false,
}) {
  const [fromId, setFromId] = useState(defaults.fromId ?? friends[0]?.id ?? '')
  const [toId, setToId] = useState(defaults.toId ?? friends[1]?.id ?? friends[0]?.id ?? '')

  // If the sender changes to equal the receiver, move the receiver to
  // the first other person so the form stays immediately valid.
  const changeFrom = (id) => {
    setFromId(id)
    setToId((prevTo) => (id === prevTo ? (friends.find((f) => f.id !== id)?.id ?? prevTo) : prevTo))
  }
  const [amount, setAmount] = useState(defaults.amount ?? '')
  const [note, setNote] = useState('')

  const valid =
    fromId && toId && fromId !== toId && parseFloat(amount) > 0

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    onSave({
      fromId,
      toId,
      amount: Math.round(parseFloat(amount) * 100) / 100,
      note: note.trim(),
    })
  }

  return (
    <form className={`payment-form ${compact ? 'payment-form-compact' : ''}`} onSubmit={submit}>
      <div className="payment-fields">
        <label className="field">
          <span>Who paid?</span>
          <select
            className="select-input"
            value={fromId}
            onChange={(e) => changeFrom(e.target.value)}
          >
            {friends.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Paid to</span>
          <select
            className="select-input"
            value={toId}
            onChange={(e) => setToId(e.target.value)}
          >
            {friends.map((f) => (
              <option key={f.id} value={f.id} disabled={f.id === fromId}>
                {f.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Amount</span>
          <div className="amount-wrap">
            <span className="currency-symbol">$</span>
            <input
              className="text-input amount-input"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </label>

        <label className="field payment-note-field">
          <span>Note (optional)</span>
          <input
            className="text-input"
            type="text"
            placeholder="e.g. cash, e-transfer"
            value={note}
            maxLength={60}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </div>

      <div className="form-footer">
        {valid && (
          <p className="share-preview">
            {`${note.trim() ? note.trim() + ' · ' : ''}${fromName(fromId, friends)} → ${fromName(toId, friends)}`}
          </p>
        )}
        <div className="form-actions">
          {onCancel && (
            <button className="btn btn-ghost" type="button" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button className="btn btn-primary" type="submit" disabled={!valid}>
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  )
}

function fromName(id, friends) {
  return friends.find((f) => f.id === id)?.name ?? ''
}
