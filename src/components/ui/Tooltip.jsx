// =============================================================================
// WARRANTYDECK — TOOLTIP
// src/components/ui/Tooltip.jsx
// =============================================================================

import { useState } from 'react'

export default function Tooltip({ children, content }) {
  const [open, setOpen] = useState(false)

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          style={{
            position: 'absolute',
            bottom: 'calc(100% + var(--space-2))',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-2) var(--space-3)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-primary)',
            whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow-sm)',
            zIndex: 'var(--z-dropdown)',
          }}
        >
          {content}
        </span>
      )}
    </span>
  )
}
