// Server stores UTC "YYYY-MM-DD HH:MM:SS"; treat as UTC and show local time.
export function formatDateTime(ts, { withYear = true } = {}) {
  const d = new Date(ts.replace(' ', 'T') + 'Z')
  return d.toLocaleString([], {
    year: withYear ? 'numeric' : undefined,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
