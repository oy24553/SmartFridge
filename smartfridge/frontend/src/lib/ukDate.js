const UK_TZ = 'Europe/London'

export function formatUKDate(isoDate) {
  if (!isoDate) return ''
  const [y, m, d] = String(isoDate).slice(0, 10).split('-').map((v) => Number(v))
  if (!y || !m || !d) return String(isoDate)
  const dd = String(d).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  return `${dd}/${mm}/${y}`
}

export function daysUntilUK(isoDate) {
  if (!isoDate) return null
  const [y, m, d] = String(isoDate).slice(0, 10).split('-').map((v) => Number(v))
  if (!y || !m || !d) return null
  const target = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.floor((target - today) / 86400000)
}

export function formatUKDateTime(isoDateTime) {
  if (!isoDateTime) return ''
  try {
    const date = new Date(isoDateTime)
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: UK_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
  } catch {
    return String(isoDateTime)
  }
}

