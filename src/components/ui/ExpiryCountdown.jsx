// =============================================================================
// WARRANTYDECK — EXPIRY COUNTDOWN
// src/components/ui/ExpiryCountdown.jsx
// =============================================================================

import Badge from './Badge'

function calculateDaysLeft(expiresOn) {
  if (!expiresOn) return null
  const today = new Date()
  const expiry = new Date(expiresOn)
  const diffMs = expiry.getTime() - today.setHours(0, 0, 0, 0)
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export default function ExpiryCountdown({ expiresOn }) {
  const daysLeft = calculateDaysLeft(expiresOn)

  if (daysLeft === null) return null

  let label = 'Active'
  let tone = 'success'

  if (daysLeft <= 0) {
    label = 'Expired'
    tone = 'danger'
  } else if (daysLeft <= 30) {
    label = `${daysLeft} days`
    tone = 'warning'
  } else {
    label = `${daysLeft} days`
    tone = 'success'
  }

  return <Badge label={label} tone={tone} />
}
