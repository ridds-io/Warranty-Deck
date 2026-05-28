// =============================================================================
// WARRANTYDECK — CHAT MESSAGE
// src/components/chat/ChatMessage.jsx
// =============================================================================

export default function ChatMessage({ role, content, timestamp }) {
  const isUser = role === 'user'

  return (
    <div
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '70%',
        backgroundColor: isUser ? 'var(--color-bg-elevated)' : 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-3) var(--space-4)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--space-2)',
        }}
      >
        {content}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-tertiary)',
          textAlign: 'right',
        }}
      >
        {timestamp}
      </div>
    </div>
  )
}
