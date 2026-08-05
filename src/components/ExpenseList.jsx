import { useState } from 'react'
import Avatar from './Avatar.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import {
  CartIcon,
  BusIcon,
  ReceiptIcon,
  DropletIcon,
  UtensilsIcon,
  HomeIcon,
  TicketIcon,
  CrossIcon,
  ShoppingBagIcon,
  BoneIcon,
} from './icons.jsx'
import { formatMoney } from '../lib/balance.js'
import { formatDateTime } from '../lib/time.js'
import { categoryFor } from '../lib/categories.js'

const CATEGORY_ICONS = {
  groceries: CartIcon,
  utilities: DropletIcon,
  transport: BusIcon,
  dining: UtensilsIcon,
  housing: HomeIcon,
  entertainment: TicketIcon,
  health: CrossIcon,
  shopping: ShoppingBagIcon,
  pets: BoneIcon,
}

function joinNames(names) {
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`
}

export default function ExpenseList({ expenses, friends, onDelete }) {
  const [toDelete, setToDelete] = useState(null)
  const byId = new Map(friends.map((f) => [f.id, f]))
  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <section className="card">
      <header className="card-header">
        <h2>Expenses</h2>
        <span className="count-badge">{expenses.length}</span>
      </header>

      {expenses.length === 0 ? (
        <p className="empty-hint">Nothing logged yet. Add your first expense above!</p>
      ) : (
        <>
          <ul className="expense-list">
            {expenses.map((exp) => {
              const payer = byId.get(exp.paidBy)
              const people = exp.participants
                .map((id) => byId.get(id)?.name)
                .filter(Boolean)
              const category = categoryFor(exp.description)
              const CategoryIcon = category ? CATEGORY_ICONS[category] : ReceiptIcon
              const splitText =
                friends.length > 0 && people.length === friends.length
                  ? 'everyone'
                  : joinNames(people)
              return (
                <li key={exp.id} className="expense-row">
                  <span
                    className={`expense-icon ${category ? `expense-icon-${category}` : ''}`}
                    title={category ?? 'expense'}
                  >
                    <CategoryIcon size={15} />
                  </span>
                  <div className="expense-main">
                    <span className="expense-description">{exp.description}</span>
                    <span className="expense-meta">
                      {payer?.name ?? 'Someone'} paid · split between {splitText}
                    </span>
                    <span className="expense-time">{formatDateTime(exp.date)}</span>
                  </div>
                  <span className="expense-amount">{formatMoney(exp.amount)}</span>
                  <button
                    className="icon-btn"
                    title="Delete expense"
                    aria-label={`Delete ${exp.description}`}
                    onClick={() => setToDelete(exp)}
                  >
                    ✕
                  </button>
                </li>
              )
            })}
          </ul>
          <footer className="expense-total">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </footer>
        </>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete expense?"
        message={`"${toDelete?.description}" will be removed from everyone's balances.`}
        confirmLabel="Delete expense"
        onConfirm={() => {
          onDelete(toDelete.id)
          setToDelete(null)
        }}
        onCancel={() => setToDelete(null)}
      />
    </section>
  )
}
