// =============================================================================
// WARRANTYDECK — RECEIPT SCANNER
// src/components/receipt/ReceiptScanner.jsx
// =============================================================================

import Button from '../ui/Button'

export default function ReceiptScanner({ onScan }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        padding: 'var(--space-4)',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--color-bg-surface)',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
          }}
        >
          Scan with OCR
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-tertiary)',
          }}
        >
          Extract totals, dates, and items automatically.
        </div>
      </div>
      <Button size="sm" onClick={onScan}>Start scan</Button>
    </div>
  )
}
