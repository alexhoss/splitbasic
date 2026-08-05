import { useState } from 'react'
import Avatar from './Avatar.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'

export default function FriendsPanel({ friends, onAdd, onRemove }) {
  const [name, setName] = useState('')
  const [toRemove, setToRemove] = useState(null)

  const submit = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName('')
  }

  return (
    <section className="card friends-card">
      <header className="card-header">
        <h2>Friends</h2>
        <span className="count-badge">{friends.length}</span>
      </header>

      <form className="inline-form" onSubmit={submit}>
        <input
          className="text-input"
          type="text"
          placeholder="Add a friend…"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          aria-label="New friend name"
        />
        <button className="btn btn-primary" type="submit" disabled={!name.trim()}>
          Add
        </button>
      </form>

      {friends.length === 0 ? (
        <p className="empty-hint">No friends yet. Add a couple to get started.</p>
      ) : (
        <ul className="friend-list">
          {friends.map((friend, i) => (
            <li key={friend.id} className="friend-row">
              <Avatar name={friend.name} index={i} size="sm" />
              <span className="friend-name">{friend.name}</span>
              <button
                className="icon-btn"
                title={`Remove ${friend.name}`}
                aria-label={`Remove ${friend.name}`}
                onClick={() => setToRemove(friend)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!toRemove}
        title="Remove friend?"
        message={`"${toRemove?.name}" will be removed from this trip, along with any expenses and payments involving them.`}
        confirmLabel="Remove"
        onConfirm={() => {
          onRemove(toRemove.id)
          setToRemove(null)
        }}
        onCancel={() => setToRemove(null)}
      />
    </section>
  )
}
