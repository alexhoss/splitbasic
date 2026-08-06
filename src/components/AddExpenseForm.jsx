import { useEffect, useRef, useState } from 'react'
import Avatar from './Avatar.jsx'

export default function AddExpenseForm({ friends, onAdd }) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState(friends[0]?.id ?? '')
  const [participants, setParticipants] = useState(() =>
    friends.map((f) => f.id),
  )

  // Keep defaults in sync when the friend list changes, while
  // preserving any participants the user deliberately toggled off.
  const prevFriendsRef = useRef(friends)
  useEffect(() => {
    const prev = prevFriendsRef.current
    prevFriendsRef.current = friends

    // Only run when the friend array identity actually changes.
    if (prev === friends) return

    if (!friends.some((f) => f.id === paidBy)) {
      setPaidBy(friends[0]?.id ?? '')
    }
    setParticipants((prevParticipants) => {
      const kept = prevParticipants.filter((id) => friends.some((f) => f.id === id))
      const added = friends
        .filter((f) => !kept.includes(f.id))
        .map((f) => f.id)
      return [...kept, ...added]
    })
  }, [friends]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleParticipant = (id) =>
    setParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    )

  const submit = (e) => {
    e.preventDefault()
    const value = parseFloat(amount)
    if (!description.trim() || !value || value <= 0 || !paidBy || participants.length === 0) {
      return
    }
    onAdd({
      description: description.trim(),
      amount: Math.round(value * 100) / 100,
      paidBy,
      participants,
    })
    setDescription('')
    setAmount('')
    setParticipants(friends.map((f) => f.id))
  }

  if (friends.length === 0) {
    return (
      <section className="card">
        <header className="card-header"><h2>Add expense</h2></header>
        <p className="empty-hint">Add friends first. You can't split anything with nobody!</p>
      </section>
    )
  }

  const share = participants.length ? amount / participants.length : 0

  return (
    <section className="card">
      <header className="card-header"><h2>Add expense</h2></header>

      <form className="expense-form" onSubmit={submit}>
        <label className="field">
          <span>What was it?</span>
          <input
            className="text-input"
            type="text"
            placeholder="Dinner, taxi, Netflix…"
            value={description}
            maxLength={60}
            onChange={(e) => setDescription(e.target.value)}
          />
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

        <label className="field">
          <span>Paid by</span>
          <select
            className="select-input"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
          >
            {friends.map((f, i) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="field fieldset">
          <legend>Split between</legend>
          <div className="participant-grid">
            {friends.map((f, i) => {
              const checked = participants.includes(f.id)
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`participant-chip ${checked ? 'checked' : ''}`}
                  onClick={() => toggleParticipant(f.id)}
                  aria-pressed={checked}
                >
                  <Avatar name={f.name} index={i} size="sm" />
                  <span className="participant-name">{f.name}</span>
                  <span className="chip-check">{checked ? '✓' : ''}</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="form-footer">
          {participants.length > 0 && amount && (
            <p className="share-preview">Everyone pays ${(share).toFixed(2)} each</p>
          )}
          <button
            className="btn btn-primary btn-lg"
            type="submit"
            disabled={!description.trim() || !amount || !paidBy || participants.length === 0}
          >
            Add expense
          </button>
        </div>
      </form>
    </section>
  )
}
