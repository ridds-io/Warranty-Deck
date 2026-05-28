// =============================================================================
// WARRANTYDECK — WARRANTY CARD
// src/components/warranty/WarrantyCard.jsx
// =============================================================================

import WarrantyBadge from './WarrantyBadge'
import ExpiryCountdown from '../ui/ExpiryCountdown'
import Button from '../ui/Button'

export default function WarrantyCard({ warranty, onOpen }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-strong)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-lg)',
            }}
          >
            {warranty.title}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-tertiary)',
            }}
          >
            {warranty.provider}
          </div>
        </div>
        <WarrantyBadge status={warranty.status} />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <span>Expires</span>
        <span>{warranty.expiresOn}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ExpiryCountdown expiresOn={warranty.expiresOn} />
        <Button size="sm" variant="outline" onClick={() => onOpen?.(warranty.id)}>
          View warranty
        </Button>
      </div>
    </div>
  )
}
