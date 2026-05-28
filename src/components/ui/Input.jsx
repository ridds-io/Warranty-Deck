// =============================================================================
// WARRANTYDECK — INPUT
// src/components/ui/Input.jsx
// =============================================================================

export default function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  style = {},
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: 'var(--space-3) var(--space-4)',
        backgroundColor: 'var(--color-bg-inset)',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-primary)',
        outline: 'none',
        transition: 'var(--transition-base)',
        ...style,
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = 'var(--color-border-focus)'
        e.currentTarget.style.boxShadow = 'var(--shadow-focus)'
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = 'var(--color-border-soft)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    />
  )
}
