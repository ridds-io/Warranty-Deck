// =============================================================================
// WARRANTYDECK — RECEIPT SUMMARY
// src/components/receipt/ReceiptSummary.jsx
// =============================================================================

export default function ReceiptSummary({ summary, benefits = [] }) {
  return (
    <section
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-strong)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          letterSpacing: 'var(--tracking-widest)',
          textTransform: 'uppercase',
          color: 'var(--color-text-tertiary)',
          marginBottom: 'var(--space-2)',
        }}
      >
        AI Summary
      </div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-base)',
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--space-4)',
        }}
      >
        {summary}
      </div>
      {benefits.length > 0 && (
        <ul
          style={{
            listStyle: 'disc',
            paddingLeft: 'var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {benefits.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
