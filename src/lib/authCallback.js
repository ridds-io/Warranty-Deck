// Helpers for OAuth / magic-link return URLs (hash tokens or PKCE ?code=).

import { supabase } from './supabase'

export function hasPendingAuthCallback() {
  const hash = window.location.hash
  const search = window.location.search
  return (
    hash.includes('access_token') ||
    hash.includes('type=magiclink') ||
    search.includes('code=')
  )
}

export function clearAuthParamsFromUrl() {
  window.history.replaceState(null, '', window.location.pathname)
}

/**
 * Finish sign-in from the current URL. Google OAuth uses ?code= (PKCE);
 * magic links use #access_token= in the hash.
 */
export async function completeAuthFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return { session: null, error }
    return { session: data.session, error: null }
  }

  // Implicit / magic-link: allow the client to parse the hash, then read session.
  const { data: { session }, error } = await supabase.auth.getSession()
  if (session) return { session, error: null }

  if (!hasPendingAuthCallback()) {
    return { session: null, error: error ?? null }
  }

  return waitForAuthSession(8000)
}

function waitForAuthSession(timeoutMs) {
  return new Promise((resolve) => {
    let settled = false

    const finish = (session, error = null) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      subscription.unsubscribe()
      resolve({ session, error })
    }

    const timer = setTimeout(async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      finish(session ?? null, error ?? null)
    }, timeoutMs)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        finish(session)
      }
    })
  })
}
