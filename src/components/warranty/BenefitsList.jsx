// =============================================================================
// WARRANTYDECK — BENEFITS LIST
// src/components/warranty/BenefitsList.jsx
// =============================================================================

export default function BenefitsList({ items = [] }) {
  if (items.length === 0) {
    return (
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-tertiary)',
        }}
      >
        No benefits listed.
      </div>
    )
  }

  return (
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
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
}
