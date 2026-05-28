// =============================================================================
// WARRANTYDECK — RECEIPT CARD
// src/components/receipt/ReceiptCard.jsx
// =============================================================================

import Badge from '../ui/Badge'
import Button from '../ui/Button'

export default function ReceiptCard({ receipt, onOpen }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-strong)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-receipt)',
        padding: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        minHeight: 'var(--receipt-card-min-h)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              letterSpacing: 'var(--tracking-widest)',
              textTransform: 'uppercase',
              color: 'var(--color-text-tertiary)',
            }}
          >
            Receipt
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-lg)',
              marginTop: 'var(--space-1)',
            }}
          >
            {receipt.storeName}
          </div>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-tertiary)',
            textAlign: 'right',
          }}
        >
          {receipt.purchaseDate}
        </div>
      </div>

      <div style={{ borderTop: '1px dashed var(--color-border-dashed)' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Total
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-lg)',
            fontWeight: 600,
          }}
        >
          ${Number.isFinite(receipt.totalAmount) ? receipt.totalAmount.toFixed(2) : '0.00'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {receipt.hasWarranty && <Badge label="Warranty" tone="success" />}
        {receipt.returnDays > 0 && (
          <Badge label={`Return ${receipt.returnDays}d`} tone="warning" />
        )}
        <Badge label={receipt.category} tone="neutral" />
      </div>

      <div style={{ marginTop: 'auto' }}>
        <Button size="sm" variant="outline" onClick={() => onOpen?.(receipt.id)}>
          View receipt
        </Button>
      </div>
    </div>
  )
}
