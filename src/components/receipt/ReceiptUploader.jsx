// =============================================================================
// WARRANTYDECK — RECEIPT UPLOADER
// src/components/receipt/ReceiptUploader.jsx
// =============================================================================

export default function ReceiptUploader({ onUpload }) {
  return (
    <div
      style={{
        border: '1px dashed var(--color-border-dashed)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-6)',
        backgroundColor: 'var(--color-bg-surface)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--space-2)',
        }}
      >
        Drop a receipt image or PDF
      </div>
      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={e => onUpload?.(e.target.files?.[0] || null)}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}
      />
    </div>
  )
}
