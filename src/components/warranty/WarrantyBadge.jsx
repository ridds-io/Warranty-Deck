// =============================================================================
// WARRANTYDECK — WARRANTY BADGE
// src/components/warranty/WarrantyBadge.jsx
// =============================================================================

import Badge from '../ui/Badge'

export default function WarrantyBadge({ status }) {
  const map = {
    active: { label: 'Active', tone: 'success' },
    expiring: { label: 'Expiring', tone: 'warning' },
    expired: { label: 'Expired', tone: 'danger' },
  }

  const config = map[status] || map.active

  return <Badge label={config.label} tone={config.tone} />
}
