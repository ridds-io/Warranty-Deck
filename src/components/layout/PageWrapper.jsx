// =============================================================================
// WARRANTYDECK — PAGE WRAPPER
// src/components/layout/PageWrapper.jsx
//
// The shell that every authenticated page renders inside.
// Composes Sidebar + Navbar + scrollable content area.
//
// Usage in any page:
//   import PageWrapper from '../components/layout/PageWrapper'
//
//   export default function Vault() {
//     return (
//       <PageWrapper title="Vault">
//         <YourPageContent />
//       </PageWrapper>
//     )
//   }
//
// Props:
//   title     {string}    — shown in Navbar, used for browser tab title too
//   children  {ReactNode} — the page content
//   noPadding {boolean}   — disable default content padding (for full-bleed pages)
// =============================================================================

import { useEffect }  from 'react'
import Sidebar        from './Sidebar'
import Navbar         from './Navbar'

export default function PageWrapper({ title, children, noPadding = false }) {

  // Update the browser tab title whenever the page changes
  useEffect(() => {
    document.title = title
      ? `${title} — WarrantyDeck`
      : 'WarrantyDeck'
  }, [title])

  return (
    <div style={{
      display:   'flex',
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg-base)',
    }}>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      {/* Sidebar is sticky and handles its own collapsed state internally */}
      <Sidebar />

      {/* ── MAIN AREA (Navbar + Content) ─────────────────────────────────── */}
      <div style={{
        flex:           1,
        display:        'flex',
        flexDirection:  'column',
        minWidth:       0, // prevents flex children from overflowing
        minHeight:      '100vh',
      }}>

        {/* Navbar — sticky at top of this column */}
        <Navbar title={title} />

        {/* ── CONTENT AREA ──────────────────────────────────────────────── */}
        {/*
          This is where <children> renders.
          Default padding gives breathing room.
          noPadding=true is for pages that want full-bleed content
          (e.g. a full-width analytics dashboard or map view).
        */}
        <main
          style={{
            flex:       1,
            padding:    noPadding ? 0 : 'var(--space-8)',
            // Fade in when the page mounts — consistent entrance for all pages
            animation:  'fadeInUp 0.3s ease forwards',
          }}
        >
          {children}
        </main>

      </div>
    </div>
  )
}
