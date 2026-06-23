// =============================================================================
// WARRANTYDECK — CHAT INPUT
// src/components/chat/ChatInput.jsx
// =============================================================================

import { useState } from 'react'
import Button from '../ui/Button'

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('')

  const handleSend = () => {
    if (disabled || !value.trim()) return
    onSend?.(value.trim())
    setValue('')
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-3)',
        alignItems: 'center',
        padding: 'var(--space-4)',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--color-bg-surface)',
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={disabled ? "AI is typing..." : "Ask about a receipt or warranty"}
        disabled={disabled}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          backgroundColor: 'transparent',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-primary)',
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSend()
        }}
      />
      <Button size="sm" onClick={handleSend} disabled={disabled}>Send</Button>
    </div>
  )
}

