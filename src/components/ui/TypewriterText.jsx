// =============================================================================
// WARRANTYDECK — TYPEWRITER TEXT
// src/components/ui/TypewriterText.jsx
// =============================================================================

import { useEffect, useState } from 'react'

export default function TypewriterText({
  text,
  speed = 80,
  startDelay = 0,
}) {
  const [visibleText, setVisibleText] = useState('')
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    let index = 0
    let typingTimer
    let blinkTimer

    const startTyping = () => {
      typingTimer = setInterval(() => {
        index += 1
        setVisibleText(text.slice(0, index))
        if (index >= text.length) {
          clearInterval(typingTimer)
        }
      }, speed)

      blinkTimer = setInterval(() => {
        setShowCursor(prev => !prev)
      }, 530)
    }

    const delayTimer = setTimeout(startTyping, startDelay)

    return () => {
      clearTimeout(delayTimer)
      clearInterval(typingTimer)
      clearInterval(blinkTimer)
    }
  }, [text, speed, startDelay])

  return (
    <span style={{ fontFamily: 'var(--font-display)' }}>
      {visibleText}
      <span style={{ marginLeft: '2px', opacity: showCursor ? 1 : 0 }}>|</span>
    </span>
  )
}
