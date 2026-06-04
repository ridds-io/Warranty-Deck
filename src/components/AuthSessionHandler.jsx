// Runs when the URL contains OAuth/magic-link tokens, completes sign-in,
// then navigates to /dashboard once AuthContext has the session (no full reload).

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
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
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [processing, setProcessing] = useState(hasPendingAuthCallback)
  const [awaitingDashboard, setAwaitingDashboard] = useState(false)

  useEffect(() => {
    if (!hasPendingAuthCallback()) return

    let cancelled = false
    setProcessing(true)

    completeAuthFromUrl()
      .then(({ session, error }) => {
        if (cancelled) return

        clearAuthParamsFromUrl()

        if (session) {
          setAwaitingDashboard(true)
          return
        }

        const message = error?.message || 'Sign-in link expired or is invalid. Please try again.'
        navigate(`/?auth_error=${encodeURIComponent(message)}`, { replace: true })
        setProcessing(false)
      })
      .catch((err) => {
        if (cancelled) return
        const message = err?.message || 'Sign-in failed. Please try again.'
        navigate(`/?auth_error=${encodeURIComponent(message)}`, { replace: true })
        setProcessing(false)
      })

    return () => {
      cancelled = true
    }
  }, [navigate])

  // Wait until AuthContext has the user before going to /dashboard.
  useEffect(() => {
    if (!awaitingDashboard || !isAuthenticated) return
    navigate('/dashboard', { replace: true })
    setAwaitingDashboard(false)
    setProcessing(false)
  }, [awaitingDashboard, isAuthenticated, navigate])

  // Session never reached context (e.g. storage blocked).
  useEffect(() => {
    if (!awaitingDashboard || isAuthenticated) return

    const timeout = setTimeout(() => {
      navigate(
        `/?auth_error=${encodeURIComponent('Could not establish a session. Please try signing in again.')}`,
        { replace: true }
      )
      setAwaitingDashboard(false)
      setProcessing(false)
    }, 4000)

    return () => clearTimeout(timeout)
  }, [awaitingDashboard, isAuthenticated, navigate])

  if (processing) return <AuthLoadingScreen />
  return children
}
