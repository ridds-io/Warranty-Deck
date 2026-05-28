// =============================================================================
// WARRANTYDECK — AUTH CONTEXT
// src/context/AuthContext.jsx
//
// Manages authentication state for the entire app.
//
// What this file provides to the rest of the app:
//   - user          → the current Supabase auth user (or null if logged out)
//   - profile       → the user_profiles row (name, theme, phone, etc.)
//   - loading       → true while we're checking if a session exists on startup
//   - signInWithGoogle() → triggers Google OAuth flow
//   - signOut()          → logs out and clears state
//   - refreshProfile()   → re-fetches profile from DB (call after profile edits)
//
// Usage in any component:
//   import { useAuth } from '../context/AuthContext'
//   const { user, profile, signOut } = useAuth()
// =============================================================================

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  supabase,
  signInWithGoogle  as supabaseSignIn,
  signOut           as supabaseSignOut,
  upsertUserProfile,
  fetchUserProfile,
} from '../lib/supabase'

// -----------------------------------------------------------------------------
// 1. CREATE THE CONTEXT
//
// createContext() makes an empty context object.
// The value passed here (null) is only used if a component tries to read the
// context WITHOUT being wrapped in AuthProvider — which should never happen,
// but we'll catch it with a guard in useAuth().
// -----------------------------------------------------------------------------

const AuthContext = createContext(null)

// =============================================================================
// 2. AUTH PROVIDER COMPONENT
//
// This wraps the entire app (in App.jsx) and makes auth state available
// to every child component via the context.
// =============================================================================

export function AuthProvider({ children }) {

  // ---------------------------------------------------------------------------
  // STATE
  //
  // user    — the Supabase auth user object. Contains: id, email, user_metadata
  //           (which has their Google name and avatar). null when logged out.
  //
  // profile — our own user_profiles table row. Contains: first_name, last_name,
  //           theme, phone_number, etc. Separate from `user` because we store
  //           extra info Supabase auth doesn't know about.
  //
  // loading — true during the initial session check on app startup.
  //           We show a loading screen while this is true so components don't
  //           flash "logged out" state before the session is confirmed.
  // ---------------------------------------------------------------------------

  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)  // start true — assume loading

  // ---------------------------------------------------------------------------
  // FETCH AND SYNC PROFILE
  //
  // After confirming a user is logged in, we fetch their profile from
  // user_profiles. If it doesn't exist yet (first login), we create it
  // using data from their Google account (name, avatar).
  //
  // useCallback memoises this function so it doesn't get recreated on every
  // render — important because it's called inside a useEffect.
  // ---------------------------------------------------------------------------

  const syncProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setProfile(null)
      return
    }

    // Try to fetch existing profile
    const { data: existingProfile, error } = await fetchUserProfile()

    if (existingProfile) {
      // Profile exists — just load it into state
      setProfile(existingProfile)
    } else {
      // No profile yet (first Google login) — create one from Google data.
      // Google puts the user's name in user_metadata (set up in Supabase
      // Google OAuth provider settings).
      const googleMeta = authUser.user_metadata || {}

      const newProfileData = {
        first_name:  googleMeta.given_name  || googleMeta.full_name?.split(' ')[0] || '',
        last_name:   googleMeta.family_name || googleMeta.full_name?.split(' ').slice(1).join(' ') || '',
        avatar_url:  googleMeta.avatar_url  || googleMeta.picture || '',
        theme:       'light',  // default theme on first login
      }

      const { data: newProfile, error: upsertError } = await upsertUserProfile(
        authUser.id,
        newProfileData
      )

      if (upsertError) {
        console.error('[WarrantyDeck] Failed to create user profile:', upsertError.message)
      } else {
        setProfile(newProfile)
      }
    }
  }, [])

  // ---------------------------------------------------------------------------
  // INITIAL SESSION CHECK + AUTH STATE LISTENER
  //
  // useEffect with [] runs once when the component first mounts.
  //
  // Two things happen here:
  //
  // 1. getSession() — checks localStorage for an existing session.
  //    This is what keeps users logged in after a page refresh.
  //    If a session exists, we restore it immediately without any redirects.
  //
  // 2. onAuthStateChange() — subscribes to Supabase auth events.
  //    This fires whenever the auth state changes: login, logout,
  //    token refresh, OAuth redirect return. It's the single source of
  //    truth for auth state after initial load.
  //
  //    Events we care about:
  //    - SIGNED_IN    → user just logged in (or OAuth redirect returned)
  //    - SIGNED_OUT   → user logged out
  //    - TOKEN_REFRESHED → session silently refreshed (we don't need to act)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let didFinishInitialCheck = false

    // Safety net: if getSession never resolves, don't block the app forever.
    const fallbackTimer = setTimeout(() => {
      if (!didFinishInitialCheck) {
        console.error('[WarrantyDeck] Auth session check timed out. Showing app anyway.')
        setLoading(false)
      }
    }, 5000)

    // Step 1: Check for existing session immediately
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        const authUser = session?.user ?? null
        setUser(authUser)

        // If there's a logged-in user, fetch their profile
        if (authUser) {
          await syncProfile(authUser)
        }

        // Done checking — hide the loading screen
        didFinishInitialCheck = true
        setLoading(false)
      })
      .catch((error) => {
        console.error('[WarrantyDeck] Failed to get session:', error)
        didFinishInitialCheck = true
        setLoading(false)
      })

    // Step 2: Listen for future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const authUser = session?.user ?? null

        if (event === 'SIGNED_IN') {
          setUser(authUser)
          await syncProfile(authUser)
        }

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
        }

        // For any event, make sure loading is false
        // (handles edge case where redirect takes longer than getSession)
        setLoading(false)
      }
    )

    // Cleanup: unsubscribe when AuthProvider unmounts.
    // Without this, old listeners pile up and cause memory leaks.
    return () => {
      clearTimeout(fallbackTimer)
      subscription.unsubscribe()
    }

  }, [syncProfile]) // syncProfile in deps array because ESLint requires it
                    // useCallback above ensures it doesn't cause infinite loops

  // ---------------------------------------------------------------------------
  // PUBLIC ACTIONS
  //
  // These are what components call when the user clicks "Sign in" or "Log out".
  // We wrap the supabase helpers here so components don't import from lib/
  // directly — all auth actions go through context.
  // ---------------------------------------------------------------------------

  /**
   * Trigger Google OAuth login.
   * Redirects the page — no return value needed.
   */
  const handleSignIn = useCallback(async () => {
    await supabaseSignIn()
    // Page will redirect to Google — code after this won't run
  }, [])

  /**
   * Log out the current user.
   * Clears state immediately so the UI updates before the redirect.
   */
  const handleSignOut = useCallback(async () => {
    // Clear state first for instant UI feedback
    setUser(null)
    setProfile(null)

    // Then tell Supabase to invalidate the session
    await supabaseSignOut()
  }, [])

  /**
   * Re-fetch the user's profile from the database.
   * Call this after the user edits their profile in Settings,
   * or after updating their theme preference — so the app reflects
   * the latest data without a full page reload.
   */
  const refreshProfile = useCallback(async () => {
    if (!user) return
    const { data } = await fetchUserProfile()
    if (data) setProfile(data)
  }, [user])

  // ---------------------------------------------------------------------------
  // CONTEXT VALUE
  //
  // Everything listed here is what components can access via useAuth().
  // Keep this list intentional — don't expose internal setters like setUser
  // directly, or components could corrupt the auth state.
  // ---------------------------------------------------------------------------

  const contextValue = {
    user,              // Supabase auth user (id, email, user_metadata)
    profile,           // user_profiles row (first_name, theme, etc.)
    loading,           // true while checking initial session
    isAuthenticated: !!user,  // boolean shorthand — avoids null checks everywhere
    signIn:  handleSignIn,
    signOut: handleSignOut,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// =============================================================================
// 3. useAuth HOOK
//
// This is what components actually import and call.
// The guard ensures it's only used inside AuthProvider — if someone
// accidentally uses useAuth() outside the provider tree, they get a clear
// error message instead of a confusing "cannot read property of null."
// =============================================================================

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === null) {
    throw new Error(
      '[WarrantyDeck] useAuth() must be used inside <AuthProvider>.\n' +
      'Make sure AuthProvider wraps your app in App.jsx.'
    )
  }

  return context
}
