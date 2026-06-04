// Runs before routes when the URL contains OAuth/magic-link tokens.
// Prevents redirecting to "/" before the session is stored (which drops the hash).

import { useEffect, useState } from 'react'
import {
  hasPendingAuthCallback,
  completeAuthFromUrl,
  clearAuthParamsFromUrl,
} from '../lib/authCallback'

function AuthLoadingScreen() {
  return (
    <div style={{
      minHeight:       '100vh',
      backgroundColor: 'var(--color-bg-base)',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      fontFamily:      'var(--font-mono)',
      fontSize:        'var(--text-sm)',
      color:           'var(--color-text-secondary)',
    }}>
      Signing you in…
    </div>
  )
}

export default function AuthSessionHandler({ children }) {
  const [processing, setProcessing] = useState(hasPendingAuthCallback)

  useEffect(() => {
    if (!hasPendingAuthCallback()) return

    let cancelled = false
    setProcessing(true)

    completeAuthFromUrl()
      .then(({ session, error }) => {
        if (cancelled) return

        clearAuthParamsFromUrl()

        if (session) {
          // Full navigation so AuthProvider picks up the stored session before /dashboard renders.
          window.location.replace('/dashboard')
          return
        }

        const message = error?.message || 'Sign-in link expired or is invalid. Please try again.'
        window.location.replace(`/?auth_error=${encodeURIComponent(message)}`)
      })
      .finally(() => {
        if (!cancelled) setProcessing(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (processing) return <AuthLoadingScreen />
  return children
}
