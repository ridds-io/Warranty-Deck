// =============================================================================
// WARRANTYDECK — SPENDING CHART
// src/components/charts/SpendingChart.jsx
// =============================================================================

export default function SpendingChart({ data = [] }) {
  const max = Math.max(...data.map(item => item.value), 1)

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-strong)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-lg)',
        }}
      >
        Spending this month
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {data.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                width: '56px',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-tertiary)',
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                flex: 1,
                height: '10px',
                backgroundColor: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.round((item.value / max) * 100)}%`,
                  height: '100%',
                  backgroundColor: 'var(--color-accent)',
                }}
              />
            </div>
            <div
              style={{
                width: '72px',
                textAlign: 'right',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
              }}
            >
              ${item.value.toFixed(0)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
