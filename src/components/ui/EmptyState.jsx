// =============================================================================
// WARRANTYDECK — EMPTY STATE
// src/components/ui/EmptyState.jsx
// =============================================================================

export default function EmptyState({ message }) {
  return (
    <div
      style={{
        padding: 'var(--space-6)',
        border: '1px dashed var(--color-border-dashed)',
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-tertiary)',
      }}
    >
      {message}
    </div>
  )
}
