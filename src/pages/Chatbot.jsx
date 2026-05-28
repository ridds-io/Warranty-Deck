// =============================================================================
// WARRANTYDECK — CHATBOT
// src/pages/Chatbot.jsx
// =============================================================================

import { useState } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import ChatWindow from '../components/chat/ChatWindow'
import ChatInput from '../components/chat/ChatInput'

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Ask me about your receipts or warranties.',
      timestamp: '09:00',
    },
  ])

  const handleSend = (text) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages(prev => [
      ...prev,
      { role: 'user', content: text, timestamp: time },
      {
        role: 'assistant',
        content: 'I can summarize coverage, return windows, and claim steps once OCR and Groq are connected.',
        timestamp: time,
      },
    ])
  }

  return (
    <PageWrapper title="AI Assistant">
      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <ChatWindow messages={messages} />
        <ChatInput onSend={handleSend} />
      </div>
    </PageWrapper>
  )
}
