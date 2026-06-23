// =============================================================================
// WARRANTYDECK — CHATBOT
// src/pages/Chatbot.jsx
// =============================================================================

import { useState } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import ChatWindow from '../components/chat/ChatWindow'
import ChatInput from '../components/chat/ChatInput'
import { useReceipts } from '../hooks/useReceipts'
import { useWarranties } from '../hooks/useWarranties'
import { chatWithGroq } from '../lib/groq'

export default function Chatbot() {
  const { receipts } = useReceipts()
  const { warranties } = useWarranties()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Ask me about your receipts, warranties, return policies, or claim procedures.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [isThinking, setIsThinking] = useState(false)

  const handleSend = async (text) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    // Add user message
    const userMessage = { role: 'user', content: text, timestamp: time }
    setMessages(prev => [...prev, userMessage])
    setIsThinking(true)

    try {
      // Chat history minus timestamps for Groq API
      const history = [...messages, userMessage].map(({ role, content }) => ({ role, content }))
      
      const reply = await chatWithGroq(history, { receipts, warranties })
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } catch (err) {
      console.error('Chatbot error:', err)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${err.message || 'Unknown error'}. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <PageWrapper title="AI Assistant">
      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <ChatWindow messages={messages} />
        {isThinking && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-tertiary)',
              padding: '0 var(--space-4)',
              fontStyle: 'italic',
            }}
          >
            AI is thinking...
          </div>
        )}
        <ChatInput onSend={handleSend} disabled={isThinking} />
      </div>
    </PageWrapper>
  )
}

