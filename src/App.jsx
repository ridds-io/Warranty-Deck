// =============================================================================
// WARRANTYDECK — APP ROOT
// src/App.jsx
//
// The top-level component. Every user session flows through here.
//
// Responsibilities:
//   1. Wrap the app in AuthProvider (auth state) and ThemeProvider (theme state)
//   2. Define all routes (URL → Page component mapping)
//   3. Protect authenticated routes — redirect to landing if not logged in
//   4. Apply the active theme to the <html> element so CSS variables work
//   5. Show a loading screen while the initial session check runs
//
// Route map:
//   /                  → Landing       (public)
//   /dashboard         → Dashboard     (protected)
//   /vault             → Vault         (protected)
//   /memorabilia       → Memorabilia   (protected)
//   /reimbursement     → Reimbursement (protected)
//   /receipt/:id       → ReceiptDetail (protected)
//   /warranty/:id      → WarrantyDetail(protected)
//   /analytics         → Analytics     (protected)
//   /chat              → Chatbot       (protected)
//   /settings          → Settings      (protected)
//   *                  → 404 redirect  (catches anything else)
// =============================================================================

import { useEffect }                          from 'react'
import { BrowserRouter, Routes, Route,
         Navigate, useLocation }              from 'react-router-dom'

import { AuthProvider, useAuth }              from './context/AuthContext'
import { ThemeProvider, useTheme }            from './context/ThemeContext'

// Pages — loaded normally for now.
// Later we can switch to React.lazy() for code splitting if the bundle
// gets large, but for now keep it simple.
import Landing             from './pages/Landing'
import AuthCallback        from './pages/AuthCallback'
import DashboardPreview    from './pages/DashboardPreview'
import AuthSessionHandler  from './components/AuthSessionHandler'

import { lazy, Suspense } from 'react'

const Dashboard    = lazy(() => import('./pages/Dashboard'))
const Vault        = lazy(() => import('./pages/Vault'))
const Memorabilia  = lazy(() => import('./pages/Memorabilia'))
const Reimbursement= lazy(() => import('./pages/Reimbursement'))
const ReceiptDetail= lazy(() => import('./pages/ReceiptDetail'))
const WarrantyDetail=lazy(() => import('./pages/WarrantyDetail'))
const Analytics    = lazy(() => import('./pages/Analytics'))
const Chatbot      = lazy(() => import('./pages/Chatbot'))
const Settings     = lazy(() => import('./pages/Settings'))

// Global styles — order matters here.
// tokens.css first (defines variables),
// themes.css second (overrides for dark mode),
// animations.css third (keyframes that reference token variables)
import './styles/tokens.css'
import './styles/themes.css'
import './styles/animations.css'
import './styles/global.css'

// =============================================================================
// THEME SYNCHRONISER
//
// A small component that lives inside ThemeProvider and watches for theme
// changes. When the theme changes, it updates the data-theme attribute on
// the <html> element — which is what triggers the CSS variable overrides
// in themes.css.
//
// Why a separate component instead of doing this in ThemeProvider?
// ThemeProvider lives in its own file (context/ThemeContext.jsx) and
// shouldn't need to know about the DOM. This component bridges the gap —
// it's React-aware and DOM-aware.
// =============================================================================

function ThemeSynchroniser() {
  const { theme } = useTheme()

  useEffect(() => {
    const root = document.documentElement  // the <html> element

    // Add transition class BEFORE changing theme for smooth colour transition
    // (see themes.css .theme-transitioning for what this does)
    root.classList.add('theme-transitioning')

    // Apply the theme attribute — CSS variables switch instantly from here
    root.setAttribute('data-theme', theme)

    // Remove transition class after the animation completes (300ms)
    const timer = setTimeout(() => {
      root.classList.remove('theme-transitioning')
    }, 300)

    // Cleanup: cancel the timer if theme changes again before 300ms
    return () => clearTimeout(timer)
  }, [theme])

  // This component renders nothing — it's purely a side-effect runner
  return null
}

// =============================================================================
// SCROLL TO TOP
//
// When the user navigates between pages (e.g. Vault → ReceiptDetail),
// the scroll position stays where it was on the previous page.
// This component watches for route changes and scrolls to the top.
// =============================================================================

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

// =============================================================================
// PROTECTED ROUTE
//
// Wraps any route that requires authentication.
//
// How it works:
//   - If still loading (checking session): show the loading screen
//   - If not authenticated: redirect to landing page
//   - If authenticated: render the requested page
//
// Usage in the route tree:
//   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
// =============================================================================

function SignInRequired() {
  return (
    <div style={{
      minHeight:       '100vh',
      backgroundColor: 'var(--color-bg-base)',
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      justifyContent:  'center',
      gap:             'var(--space-6)',
      padding:         'var(--space-8)',
      textAlign:       'center',
    }}>
      <div style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      'var(--text-xs)',
        letterSpacing: 'var(--tracking-widest)',
        color:         'var(--color-text-tertiary)',
        textTransform: 'uppercase',
      }}>
        WarrantyDeck
      </div>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize:   'var(--text-2xl)',
        margin:     0,
      }}>
        Sign in to open the dashboard
      </h1>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize:   'var(--text-sm)',
        color:      'var(--color-text-secondary)',
        maxWidth:   '360px',
        margin:     0,
      }}>
        This page is only available after Google or email sign-in. Your session may have expired.
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <a
          href="/"
          style={{
            fontFamily:      'var(--font-mono)',
            fontSize:        'var(--text-sm)',
            padding:         'var(--space-3) var(--space-6)',
            backgroundColor: 'var(--color-accent)',
            color:           'var(--color-text-inverse)',
            borderRadius:    'var(--radius-md)',
            textDecoration:  'none',
          }}
        >
          Go to sign in
        </a>
        <a
          href="/preview/dashboard"
          style={{
            fontFamily:     'var(--font-mono)',
            fontSize:       'var(--text-sm)',
            padding:        'var(--space-3) var(--space-6)',
            color:          'var(--color-text-primary)',
            border:         '1px solid var(--color-border-strong)',
            borderRadius:   'var(--radius-md)',
            textDecoration: 'none',
          }}
        >
          Preview dashboard UI
        </a>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <AppLoadingScreen />
  }

  if (!isAuthenticated) {
    return <SignInRequired />
  }

  return children
}

// =============================================================================
// PUBLIC ROUTE
//
// Wraps the landing page. If the user is already logged in and visits /,
// redirect them straight to the dashboard — no need to see the landing page.
// =============================================================================

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <AppLoadingScreen />

  // Already logged in — go to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// =============================================================================
// APP LOADING SCREEN
//
// Shown while getSession() is running on startup (~100-300ms).
// Keeps the design language — warm paper background, monospace brand name.
// No spinner — just a clean, still frame. Feels intentional, not broken.
// =============================================================================

function AppLoadingScreen() {
  return (
    <div style={{
      minHeight:       '100vh',
      backgroundColor: 'var(--color-bg-base)',
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      justifyContent:  'center',
      gap:             'var(--space-4)',
    }}>
      {/* Brand name in mono — same as the navbar */}
      <span style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      'var(--text-xl)',
        fontWeight:    '500',
        color:         'var(--color-text-primary)',
        letterSpacing: 'var(--tracking-wider)',
      }}>
        WARRANTYDECK
      </span>

      {/* Subtle loading indicator — a thin animated line, not a spinner */}
      <div style={{
        width:          '120px',
        height:         '1px',
        background:     `linear-gradient(90deg, var(--color-border-soft) 25%, var(--color-text-primary) 50%, var(--color-border-soft) 75%)`,
        backgroundSize: '200% 100%',
        borderRadius:   '1px',
        animation:      'shimmer 1.2s ease-in-out infinite',
      }} />
    </div>
  )
}

// =============================================================================
// ROUTE TREE
//
// Defined separately so it's easy to read and add routes without
// touching the provider nesting.
//
// Pattern for each route:
//   Public pages  → wrapped in <PublicRoute>  (redirects to /dashboard if logged in)
//   Private pages → wrapped in <ProtectedRoute> (redirects to / if logged out)
// =============================================================================

function AppRoutes() {
  return (
    <>
      {/* Runs on every navigation — no render output */}
      <ScrollToTop />
      <ThemeSynchroniser />

      <AuthSessionHandler>
      <Routes>

        {/* ── PUBLIC ──────────────────────────────────────────────────────── */}

        <Route
          path="/"
          element={
            <PublicRoute>
              <Landing />
            </PublicRoute>
          }
        />

        {/* OAuth / magic-link return — must match getAuthRedirectUrl() in supabase.js */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* UI preview — no auth, sample data (for design review / debugging deploy) */}
        <Route path="/preview/dashboard" element={<DashboardPreview />} />

        {/* ── PROTECTED ───────────────────────────────────────────────────── */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vault"
          element={
            <ProtectedRoute>
              <Vault />
            </ProtectedRoute>
          }
        />

        <Route
          path="/memorabilia"
          element={
            <ProtectedRoute>
              <Memorabilia />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reimbursement"
          element={
            <ProtectedRoute>
              <Reimbursement />
            </ProtectedRoute>
          }
        />

        {/* Dynamic routes — :id is the receipt/warranty UUID from Supabase */}
        <Route
          path="/receipt/:id"
          element={
            <ProtectedRoute>
              <ReceiptDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/warranty/:id"
          element={
            <ProtectedRoute>
              <WarrantyDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chatbot />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* ── CATCH-ALL ───────────────────────────────────────────────────── */}

        {/* Any unrecognised URL redirects to the landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
      </AuthSessionHandler>
    </>
  )
}

// =============================================================================
// ROOT APP COMPONENT
//
// Provider nesting order matters:
//   BrowserRouter  — must be outermost (routing context)
//     ThemeProvider  — theme state (ThemeSynchroniser needs to be inside this)
//       AuthProvider   — auth state (may depend on routing for redirects)
//         AppRoutes    — the actual pages
//
// If you ever add more global providers (e.g. a toast/notification provider),
// add them here in the nesting — not scattered around the app.
// =============================================================================

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Suspense fallback={<AppLoadingScreen />}>
            <AppRoutes />
          </Suspense> 
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
