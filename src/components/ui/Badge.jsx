// =============================================================================
// WARRANTYDECK — BADGE
// src/components/ui/Badge.jsx
// =============================================================================

export default function Badge({ label, tone = 'neutral', style = {} }) {
  const tones = {
    neutral: {
      backgroundColor: 'var(--color-accent-subtle)',
      color: 'var(--color-text-primary)',
    },
    success: {
      backgroundColor: 'var(--color-success-bg)',
      color: 'var(--color-success)',
    },
    warning: {
      backgroundColor: 'var(--color-warning-bg)',
      color: 'var(--color-warning)',
    },
    danger: {
      backgroundColor: 'var(--color-danger-bg)',
      color: 'var(--color-danger)',
    },
    info: {
      backgroundColor: 'var(--color-info-bg)',
      color: 'var(--color-info)',
    },
  }

  const toneStyle = tones[tone] || tones.neutral

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px var(--space-2)',
        borderRadius: 'var(--radius-full)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        letterSpacing: 'var(--tracking-wide)',
        textTransform: 'uppercase',
        ...toneStyle,
        ...style,
      }}
    >
      {label}
    </span>
  )
}
