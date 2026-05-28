// =============================================================================
// WARRANTYDECK — BUTTON
// src/components/ui/Button.jsx
// =============================================================================

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  style = {},
}) {
  const sizes = {
    sm: {
      padding: 'var(--space-2) var(--space-4)',
      fontSize: 'var(--text-xs)',
    },
    md: {
      padding: 'var(--space-3) var(--space-5)',
      fontSize: 'var(--text-sm)',
    },
    lg: {
      padding: 'var(--space-4) var(--space-6)',
      fontSize: 'var(--text-base)',
    },
  }

  const variants = {
    primary: {
      backgroundColor: 'var(--color-accent)',
      color: 'var(--color-text-inverse)',
      borderColor: 'var(--color-accent)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-primary)',
      borderColor: 'var(--color-border-strong)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
      borderColor: 'transparent',
    },
  }

  const sizeStyle = sizes[size] || sizes.md
  const variantStyle = variants[variant] || variants.primary

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...sizeStyle,
        ...variantStyle,
        border: '1px solid',
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-mono)',
        letterSpacing: 'var(--tracking-wide)',
        textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'var(--transition-base)',
        ...style,
      }}
      onMouseEnter={e => {
        if (disabled) return
        if (variant === 'primary') e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'
        if (variant === 'outline') e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)'
        if (variant === 'ghost') e.currentTarget.style.color = 'var(--color-text-primary)'
      }}
      onMouseLeave={e => {
        if (disabled) return
        e.currentTarget.style.backgroundColor = variantStyle.backgroundColor
        e.currentTarget.style.color = variantStyle.color
      }}
    >
      {children}
    </button>
  )
}
