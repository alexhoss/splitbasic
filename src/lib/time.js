// Server stores UTC datetimes; treat as UTC and show local time.
// Accepts both "YYYY-MM-DD HH:MM:SS" (SQLite default) and ISO-8601.
export function formatDateTime(ts, { withYear = true } = {}) {
  if (!ts) return ''

  const fmt = (d) =>
    d.toLocaleString([], {
      year: withYear ? 'numeric' : undefined,
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })

  // Normalise: convert space-separated to ISO, append Z if no timezone.
  const normalised = ts.trim().replace(' ', 'T')
  const d = /[Zz+-]/.test(normalised) ? new Date(normalised) : new Date(normalised + 'Z')
  if (!isNaN(d.getTime())) return fmt(d)

  // Last resort: try the raw string.
  const fallback = new Date(ts)
  return isNaN(fallback.getTime()) ? ts : fmt(fallback)
}
