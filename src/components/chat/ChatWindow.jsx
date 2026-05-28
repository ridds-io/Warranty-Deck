// =============================================================================
// WARRANTYDECK — CHAT WINDOW
// src/components/chat/ChatWindow.jsx
// =============================================================================

import ChatMessage from './ChatMessage'

export default function ChatWindow({ messages = [] }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        padding: 'var(--space-6)',
        backgroundColor: 'var(--color-bg-base)',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-md)',
        minHeight: '360px',
      }}
    >
      {messages.map((message, index) => (
        <ChatMessage key={index} {...message} />
      ))}
    </div>
  )
}
