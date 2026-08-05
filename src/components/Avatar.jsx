const PALETTE = [
  '#1CC29F', '#4A7DFF', '#FF8A5C', '#B66BFF',
  '#FF5C7A', '#F5B301', '#3AC1D4', '#8BC34A',
  '#FF7043', '#5C6BC0',
]

export function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export default function Avatar({ name, index = 0, size = 'md' }) {
  const sizeClass = {
    sm: 'avatar-sm',
    md: 'avatar-md',
    lg: 'avatar-lg',
  }[size] || 'avatar-md'

  return (
    <span
      className={`avatar ${sizeClass}`}
      style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
