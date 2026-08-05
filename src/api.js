// Minimal JSON client for the backend API.

async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const data = await res.json()
      if (data?.error) message = data.error
    } catch {
      // non-JSON error body; keep the generic message
    }
    throw new Error(message)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  // trips
  listTrips: () => request('/trips'),
  createTrip: (name) => request('/trips', { method: 'POST', body: { name } }),
  deleteTrip: (id) => request(`/trips/${id}`, { method: 'DELETE' }),

  // friends
  listFriends: (tripId) => request(`/trips/${tripId}/friends`),
  createFriend: (tripId, name) =>
    request(`/trips/${tripId}/friends`, { method: 'POST', body: { name } }),
  deleteFriend: (id) => request(`/friends/${id}`, { method: 'DELETE' }),

  // expenses
  listExpenses: (tripId) => request(`/trips/${tripId}/expenses`),
  createExpense: (tripId, expense) =>
    request(`/trips/${tripId}/expenses`, { method: 'POST', body: expense }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),

  // payments
  listPayments: (tripId) => request(`/trips/${tripId}/payments`),
  createPayment: (tripId, payment) =>
    request(`/trips/${tripId}/payments`, { method: 'POST', body: payment }),
  deletePayment: (id) => request(`/payments/${id}`, { method: 'DELETE' }),

  // activity log
  listLogs: (tripId) => request(`/trips/${tripId}/logs`),

  // shared note
  getNote: (tripId) => request(`/trips/${tripId}/note`),
  saveNote: (tripId, content) =>
    request(`/trips/${tripId}/note`, { method: 'PUT', body: { content } }),
}
