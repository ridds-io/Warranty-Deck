// =============================================================================
// WARRANTYDECK — CATEGORY CHART
// src/components/charts/CategoryPie.jsx
// =============================================================================

export default function CategoryPie({ data = [] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-strong)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-lg)',
        }}
      >
        Spend by category
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {data.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                width: '140px',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                flex: 1,
                height: '8px',
                backgroundColor: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.round((item.value / total) * 100)}%`,
                  height: '100%',
                  backgroundColor: 'var(--color-info)',
                }}
              />
            </div>
            <div
              style={{
                width: '48px',
                textAlign: 'right',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-tertiary)',
              }}
            >
              {Math.round((item.value / total) * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
