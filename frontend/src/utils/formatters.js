export function fmtHours(h) {
  if (h === null || h === undefined) return '—'
  const hours = Math.floor(h)
  const mins = Math.round((h - hours) * 60)
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export function fmtMiles(m) {
  if (m === null || m === undefined) return '—'
  return `${Number(m).toLocaleString('en-US', { maximumFractionDigits: 0 })} mi`
}

export function fmtDuration(hours) {
  if (!hours) return '—'
  const d = Math.floor(hours / 24)
  const h = Math.floor(hours % 24)
  const m = Math.round((hours - Math.floor(hours)) * 60)
  const parts = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  return parts.join(' ') || '0m'
}

export function stopTypeColor(type) {
  const colors = {
    rest: 'bg-[#fbe1d1] text-[#5d2a1a]',
    break: 'bg-[#f2f2f3] text-[#17191c]',
    fuel: 'bg-[#ffeedd] text-[#b45309]',
    pickup: 'bg-[#17191c] text-white',
    dropoff: 'bg-[#17191c] text-white',
    restart: 'bg-[#5d2a1a] text-[#fbe1d1]',
  }
  return colors[type] || 'bg-[#f2f2f3] text-[#17191c]'
}

export function statusColor(status) {
  const colors = {
    driving: '#22c55e',         // green
    sleeper_berth: '#3b82f6',   // blue
    off_duty: '#94a3b8',        // gray
    on_duty_not_driving: '#f97316', // orange
  }
  return colors[status] || '#94a3b8'
}
