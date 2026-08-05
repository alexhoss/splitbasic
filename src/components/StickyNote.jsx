import { useEffect, useRef, useState } from 'react'

export default function StickyNote({ note, onSave }) {
  const [value, setValue] = useState(note)
  const [status, setStatus] = useState('') // '' | 'saving' | 'saved'
  const timerRef = useRef(null)

  // Keep in sync when the trip (or loaded note) changes.
  useEffect(() => {
    setValue(note)
  }, [note])

  // Debounced autosave after the user stops typing.
  useEffect(() => {
    if (value === note) return
    setStatus('saving')
    const t = setTimeout(async () => {
      try {
        await onSave(value)
        setStatus('saved')
        timerRef.current = setTimeout(() => setStatus(''), 2500)
      } catch {
        setStatus('')
      }
    }, 600)
    return () => {
      clearTimeout(t)
      clearTimeout(timerRef.current)
    }
  }, [value, note, onSave])

  return (
    <section className="card sticky-note">
      <header className="card-header">
        <h2>Sticky note</h2>
        {status === 'saving' && <span className="note-status">Saving...</span>}
        {status === 'saved' && <span className="note-status saved">Saved</span>}
      </header>
      <textarea
        className="sticky-note-input"
        value={value}
        maxLength={2000}
        rows={4}
        placeholder="Shared notes for this trip, e.g. I paid the deposit, remember to book the cottage..."
        aria-label="Trip sticky note"
        onChange={(e) => setValue(e.target.value)}
      />
    </section>
  )
}
