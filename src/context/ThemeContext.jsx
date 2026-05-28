// =============================================================================
// WARRANTYDECK — THEME CONTEXT
// src/context/ThemeContext.jsx
//
// Manages the active theme ('light' or 'dark') across the entire app.
//
// Source of truth priority:
//   1. User's saved preference in user_profiles.theme (Supabase)
//      → loaded by AuthContext into profile.theme
//   2. localStorage fallback (so theme persists before auth loads)
//   3. Default: 'light'
//
// When the user changes theme in Settings:
//   → setTheme() is called
//   → localStorage is updated immediately (instant)
//   → Supabase is updated via the passed-in updateFn (persists across devices)
//   → ThemeSynchroniser in App.jsx applies data-theme to <html>
//
// Usage in any component:
//   import { useTheme } from '../context/ThemeContext'
//   const { theme, setTheme, isDark } = useTheme()
// =============================================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext(null)

// -----------------------------------------------------------------------------
// HELPER: read theme from localStorage safely
// localStorage can throw in some environments (private browsing, SSR tests)
// -----------------------------------------------------------------------------

function getStoredTheme() {
  try {
    return localStorage.getItem('warrantydeck_theme') || null
  } catch {
    return null
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem('warrantydeck_theme', theme)
  } catch {
    // Silently fail — localStorage unavailable
  }
}

// =============================================================================
// THEME PROVIDER
// =============================================================================

export function ThemeProvider({ children }) {

  // Initialise from localStorage first — this runs synchronously before
  // the first render, so there's no flash of the wrong theme.
  const [theme, setThemeState] = useState(() => {
    return getStoredTheme() || 'light'
  })

  // ---------------------------------------------------------------------------
  // SYNC FROM PROFILE
  //
  // When the user's profile loads from Supabase (after auth), we check if
  // their saved theme preference differs from the current one and update.
  //
  // This is called from outside — AuthContext calls it after profile loads.
  // We expose syncThemeFromProfile() so AuthContext can trigger it.
  // ---------------------------------------------------------------------------

  const syncThemeFromProfile = useCallback((profileTheme) => {
    if (profileTheme && profileTheme !== theme) {
      setThemeState(profileTheme)
      storeTheme(profileTheme)
    }
  }, [theme])

  // ---------------------------------------------------------------------------
  // SET THEME
  //
  // Called when the user clicks the toggle in Settings.
  // Updates local state and localStorage immediately.
  // The caller (Settings page) is responsible for saving to Supabase.
  // ---------------------------------------------------------------------------

  const setTheme = useCallback((newTheme) => {
    if (newTheme !== 'light' && newTheme !== 'dark') {
      console.warn(`[WarrantyDeck] Invalid theme: "${newTheme}". Must be 'light' or 'dark'.`)
      return
    }
    setThemeState(newTheme)
    storeTheme(newTheme)
  }, [])

  // Convenience toggle — flips between light and dark
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [theme, setTheme])

  // ---------------------------------------------------------------------------
  // CONTEXT VALUE
  // ---------------------------------------------------------------------------

  const contextValue = {
    theme,                        // 'light' | 'dark'
    setTheme,                     // (theme: string) => void
    toggleTheme,                  // () => void — flips current theme
    syncThemeFromProfile,         // (profileTheme: string) => void
    isDark: theme === 'dark',     // boolean shorthand
    isLight: theme === 'light',   // boolean shorthand
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

// =============================================================================
// useTheme HOOK
// =============================================================================

export function useTheme() {
  const context = useContext(ThemeContext)

  if (context === null) {
    throw new Error(
      '[WarrantyDeck] useTheme() must be used inside <ThemeProvider>.\n' +
      'Make sure ThemeProvider wraps your app in App.jsx.'
    )
  }

  return context
}
