import { useEffect, useState } from 'react'
import FriendsPanel from './components/FriendsPanel.jsx'
import AddExpenseForm from './components/AddExpenseForm.jsx'
import ExpenseList from './components/ExpenseList.jsx'
import BalanceSummary from './components/BalanceSummary.jsx'
import PaymentsCard from './components/PaymentsCard.jsx'
import TripPage from './components/TripPage.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'
import { api } from './api.js'

const ACTIVE_TRIP_KEY = 'splitbasic-active-trip'

export default function App() {
  const [trips, setTrips] = useState([])
  const [activeTripId, setActiveTripId] = useState(null)
  const [friends, setFriends] = useState([])
  const [expenses, setExpenses] = useState([])
  const [payments, setPayments] = useState([])
  const [logs, setLogs] = useState([])
  const [view, setView] = useState('dashboard') // 'dashboard' | 'trip'
  const [loading, setLoading] = useState(true)
  const [tripLoading, setTripLoading] = useState(false)
  const [error, setError] = useState(null)
  const [creatingTrip, setCreatingTrip] = useState(false)
  const [newTripName, setNewTripName] = useState('')
  const [tripToDelete, setTripToDelete] = useState(null)

  // Load trips once on mount.
  useEffect(() => {
    api
      .listTrips()
      .then((list) => {
        setTrips(list)
        const saved = Number(localStorage.getItem(ACTIVE_TRIP_KEY))
        const remembered = list.some((t) => t.id === saved) ? saved : list[0]?.id
        setActiveTripId(remembered ?? null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // Refresh the activity log after any mutation so the Trip page stays current.
  const refreshLogs = async () => {
    if (!activeTripId) return
    try {
      const logList = await api.listLogs(activeTripId)
      setLogs(logList)
    } catch {
      // Non-critical; the next trip load will refresh it.
    }
  }

  // Load friends + expenses whenever the active trip changes.
  useEffect(() => {
    if (!activeTripId) {
      setFriends([])
      setExpenses([])
      setPayments([])
      setLogs([])
      setTripLoading(false)
      return
    }
    setView('dashboard')
    let cancelled = false
    setError(null)
    // Clear previous trip's data so we never show old data under a new trip name.
    setFriends([])
    setExpenses([])
    setPayments([])
    setLogs([])
    setTripLoading(true)
    Promise.all([
      api.listFriends(activeTripId),
      api.listExpenses(activeTripId),
      api.listPayments(activeTripId),
      api.listLogs(activeTripId),
    ])
      .then(([friendList, expenseList, paymentList, logList]) => {
        if (cancelled) return
        setFriends(friendList)
        setExpenses(expenseList)
        setPayments(paymentList)
        setLogs(logList)
        setTripLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e.message)
        setTripLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeTripId])

  // Remember the last active trip across reloads.
  useEffect(() => {
    if (activeTripId) localStorage.setItem(ACTIVE_TRIP_KEY, String(activeTripId))
  }, [activeTripId])

  // ---------- actions ----------

  const createTrip = async (e) => {
    e?.preventDefault()
    const name = newTripName.trim()
    if (!name) return
    try {
      const trip = await api.createTrip(name)
      setTrips((prev) => [...prev, trip])
      setActiveTripId(trip.id)
      setNewTripName('')
      setCreatingTrip(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const deleteTrip = async (tripId) => {
    try {
      await api.deleteTrip(tripId)
      const remaining = trips.filter((t) => t.id !== tripId)
      setTrips(remaining)
      if (tripId === activeTripId) {
        setActiveTripId(remaining[0]?.id ?? null)
        localStorage.removeItem(ACTIVE_TRIP_KEY)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const addFriend = async (name) => {
    try {
      const friend = await api.createFriend(activeTripId, name)
      setFriends((prev) => [...prev, friend])
      refreshLogs()
    } catch (err) {
      setError(err.message)
    }
  }

  const removeFriend = async (friendId) => {
    try {
      await api.deleteFriend(friendId)
      setFriends((prev) => prev.filter((f) => f.id !== friendId))
      setExpenses((prev) =>
        prev
          .filter((e) => e.paidBy !== friendId)
          .map((e) => ({
            ...e,
            participants: e.participants.filter((p) => p !== friendId),
          })),
      )
      setPayments((prev) =>
        prev.filter((p) => p.fromId !== friendId && p.toId !== friendId),
      )
      refreshLogs()
    } catch (err) {
      setError(err.message)
    }
  }

  const addExpense = async (expense) => {
    try {
      const created = await api.createExpense(activeTripId, expense)
      setExpenses((prev) => [created, ...prev])
      refreshLogs()
    } catch (err) {
      setError(err.message)
    }
  }

  const deleteExpense = async (expenseId) => {
    try {
      await api.deleteExpense(expenseId)
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId))
      refreshLogs()
    } catch (err) {
      setError(err.message)
    }
  }

  const addPayment = async (payment) => {
    try {
      const created = await api.createPayment(activeTripId, payment)
      setPayments((prev) => [created, ...prev])
      refreshLogs()
    } catch (err) {
      setError(err.message)
    }
  }

  const deletePayment = async (paymentId) => {
    try {
      await api.deletePayment(paymentId)
      setPayments((prev) => prev.filter((p) => p.id !== paymentId))
      refreshLogs()
    } catch (err) {
      setError(err.message)
    }
  }

  // ---------- render ----------

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <img className="brand-logo" src="/logo.png" alt="SplitBasic logo" />
            <span className="brand-name">Split<span className="brand-accent">Basic</span></span>
          </div>

          {trips.length > 0 && (
            <div className="trip-bar">
              <select
                className="trip-select"
                value={activeTripId ?? ''}
                onChange={(e) => setActiveTripId(Number(e.target.value))}
                aria-label="Active trip"
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setCreatingTrip((v) => !v)}
              >
                + New trip
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setView((v) => (v === 'trip' ? 'dashboard' : 'trip'))}
                title="View trip activity log"
              >
                {view === 'trip' ? 'Dashboard' : 'Activity'}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setTripToDelete(activeTripId)}
                title="Delete this trip"
              >
                Delete
              </button>
            </div>
          )}

          {creatingTrip && (
            <form className="new-trip-form" onSubmit={createTrip}>
              <input
                className="text-input"
                type="text"
                placeholder="Trip name, e.g. Beach Weekend"
                value={newTripName}
                maxLength={40}
                autoFocus
                onChange={(e) => setNewTripName(e.target.value)}
              />
              <button className="btn btn-primary" type="submit" disabled={!newTripName.trim()}>
                Create
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  setCreatingTrip(false)
                  setNewTripName('')
                }}
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </header>

      <main className="content">
        {error && (
          <div className="error-banner" role="alert">
            {error}
            <button className="icon-btn" onClick={() => setError(null)} aria-label="Dismiss">
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <p className="page-hint">Loading…</p>
        ) : tripLoading ? (
          <p className="page-hint">Loading trip…</p>
        ) : view === 'trip' && activeTripId ? (
          <TripPage
            trip={trips.find((t) => t.id === activeTripId)}
            logs={logs}
            onBack={() => setView('dashboard')}
          />
        ) : trips.length === 0 ? (
          <section className="card hero-card">
            <h2>Welcome to SplitBasic</h2>
            <p>
              Create a trip, like <em>Beach Weekend</em> or <em>Roommates</em>, then add friends
              and expenses. Each trip keeps its own balances.
            </p>
            <form className="inline-form" onSubmit={createTrip}>
              <input
                className="text-input"
                type="text"
                placeholder="Trip name, e.g. Beach Weekend"
                value={newTripName}
                maxLength={40}
                autoFocus
                onChange={(e) => setNewTripName(e.target.value)}
              />
              <button className="btn btn-primary" type="submit" disabled={!newTripName.trim()}>
                Create trip
              </button>
            </form>
          </section>
        ) : (
          <>
          <div className="dashboard-header">
            <h1>{trips.find((t) => t.id === activeTripId)?.name ?? ''}</h1>
          </div>
          <div className="layout">
            <div className="col-left">
              <FriendsPanel friends={friends} onAdd={addFriend} onRemove={removeFriend} />
              <BalanceSummary
                expenses={expenses}
                payments={payments}
                friends={friends}
                onAddPayment={addPayment}
              />
            </div>
            <div className="col-right">
              <AddExpenseForm friends={friends} onAdd={addExpense} />
              <ExpenseList
                expenses={expenses}
                friends={friends}
                onDelete={deleteExpense}
              />
              <PaymentsCard
                payments={payments}
                friends={friends}
                onAdd={addPayment}
                onDelete={deletePayment}
              />
            </div>
          </div>
          </>
        )}
      </main>

      <ConfirmDialog
        open={!!tripToDelete}
        title="Delete trip?"
        message={`"${trips.find((t) => t.id === tripToDelete)?.name ?? ''}" and all of its friends, expenses, payments, and activity will be permanently removed.`}
        confirmLabel="Delete trip"
        onConfirm={() => {
          deleteTrip(tripToDelete)
          setTripToDelete(null)
        }}
        onCancel={() => setTripToDelete(null)}
      />
    </div>
  )
}
