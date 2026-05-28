// =============================================================================
// WARRANTYDECK — CHAT INPUT
// src/components/chat/ChatInput.jsx
// =============================================================================

import { useState } from 'react'
import Button from '../ui/Button'

export default function ChatInput({ onSend }) {
  const [value, setValue] = useState('')

  const handleSend = () => {
    if (!value.trim()) return
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
      }}
    >
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Ask about a receipt or warranty"
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
      <Button size="sm" onClick={handleSend}>Send</Button>
    </div>
  )
}
