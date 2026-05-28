// =============================================================================
// WARRANTYDECK — NAVBAR
// src/components/layout/Navbar.jsx
//
// The top bar present on every authenticated page.
//
// Contents (left → right):
//   - Page title       (changes per page — passed as prop)
//   - Search bar       (global search across receipts + warranties)
//   - Notification bell (expiry alerts badge)
//   - User avatar      (links to settings)
//
// The Navbar does NOT contain the brand name — that lives in the Sidebar.
// This keeps the navbar clean and focused on the current page context.
// =============================================================================

import { useState, useRef, useEffect }  from 'react'
import { useNavigate }                  from 'react-router-dom'
import { useAuth }                      from '../../context/AuthContext'

// =============================================================================
// NOTIFICATION BELL
// Shows a red dot badge when there are unread alerts.
// Clicking opens a dropdown of recent notifications.
// Full notification data will come from useNotifications hook (Phase 7).
// For now, accepts `count` and `items` as props.
// =============================================================================

function NotificationBell({ count = 0, items = [] }) {
  const [open, setOpen]       = useState(false)
  const dropdownRef           = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Notifications"
        style={{
          position:       'relative',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          width:          '36px',
          height:         '36px',
          background:     open ? 'var(--color-bg-elevated)' : 'transparent',
          border:         '1px solid',
          borderColor:    open ? 'var(--color-border-strong)' : 'transparent',
          borderRadius:   'var(--radius-md)',
          cursor:         'pointer',
          fontFamily:     'var(--font-mono)',
          fontSize:       'var(--text-base)',
          color:          'var(--color-text-secondary)',
          transition:     'var(--transition-base)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)'
          e.currentTarget.style.borderColor      = 'var(--color-border-strong)'
          e.currentTarget.style.color            = 'var(--color-text-primary)'
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.borderColor      = 'transparent'
            e.currentTarget.style.color            = 'var(--color-text-secondary)'
          }
        }}
      >
        ◷

        {/* Unread badge — only shows when count > 0 */}
        {count > 0 && (
          <span style={{
            position:        'absolute',
            top:             '6px',
            right:           '6px',
            width:           '8px',
            height:          '8px',
            backgroundColor: 'var(--color-danger)',
            borderRadius:    'var(--radius-full)',
            border:          '1px solid var(--color-bg-surface)',
          }} />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position:        'absolute',
          top:             'calc(100% + var(--space-2))',
          right:           0,
          width:           '300px',
          backgroundColor: 'var(--color-bg-surface)',
          border:          '1px solid var(--color-border-strong)',
          borderRadius:    'var(--radius-lg)',
          boxShadow:       'var(--shadow-lg)',
          zIndex:          'var(--z-dropdown)',
          overflow:        'hidden',
          animation:       'fadeInDown 0.15s ease forwards',
        }}>
          {/* Dropdown header */}
          <div style={{
            padding:         'var(--space-3) var(--space-4)',
            borderBottom:    '1px solid var(--color-border-soft)',
            display:         'flex',
            justifyContent:  'space-between',
            alignItems:      'center',
          }}>
            <span style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      'var(--text-xs)',
              fontWeight:    '500',
              color:         'var(--color-text-primary)',
              letterSpacing: 'var(--tracking-wider)',
              textTransform: 'uppercase',
            }}>
              Alerts
            </span>
            {count > 0 && (
              <span style={{
                fontFamily:      'var(--font-mono)',
                fontSize:        'var(--text-xs)',
                backgroundColor: 'var(--color-danger-bg)',
                color:           'var(--color-danger)',
                padding:         '2px var(--space-2)',
                borderRadius:    'var(--radius-full)',
              }}>
                {count} new
              </span>
            )}
          </div>

          {/* Notification items */}
          {items.length === 0 ? (
            <div style={{
              padding:    'var(--space-8) var(--space-4)',
              textAlign:  'center',
              fontFamily: 'var(--font-mono)',
              fontSize:   'var(--text-xs)',
              color:      'var(--color-text-tertiary)',
              letterSpacing: 'var(--tracking-wide)',
            }}>
              No alerts right now
            </div>
          ) : (
            items.map((item, i) => (
              <div
                key={i}
                style={{
                  padding:      'var(--space-3) var(--space-4)',
                  borderBottom: i < items.length - 1 ? '1px solid var(--color-border-soft)' : 'none',
                  cursor:       'pointer',
                  transition:   'var(--transition-base)',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize:   'var(--text-xs)',
                  fontWeight: '500',
                  color:      'var(--color-text-primary)',
                  marginBottom: 'var(--space-1)',
                }}>
                  {item.title}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize:   'var(--text-xs)',
                  color:      'var(--color-text-tertiary)',
                }}>
                  {item.message}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// SEARCH BAR
// Global search input. On submit, navigates to /vault?search=query
// so Vault page can pick up the query from URL params and filter results.
// =============================================================================

function SearchBar() {
  const [query,   setQuery]   = useState('')
  const [focused, setFocused] = useState(false)
  const navigate              = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    navigate(`/vault?search=${encodeURIComponent(query.trim())}`)
    setQuery('')
  }

  return (
    <form onSubmit={handleSubmit} style={{ flex: 1, maxWidth: '400px' }}>
      <div style={{
        display:         'flex',
        alignItems:      'center',
        gap:             'var(--space-2)',
        padding:         'var(--space-2) var(--space-4)',
        backgroundColor: focused ? 'var(--color-bg-inset)' : 'var(--color-bg-elevated)',
        border:          '1px solid',
        borderColor:     focused ? 'var(--color-border-focus)' : 'var(--color-border-soft)',
        borderRadius:    'var(--radius-md)',
        boxShadow:       focused ? 'var(--shadow-focus)' : 'none',
        transition:      'var(--transition-base)',
      }}>
        {/* Search icon */}
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize:   'var(--text-sm)',
          color:      focused ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)',
          flexShrink: 0,
          transition: 'color var(--duration-fast) var(--ease-out)',
        }}>
          ⊙
        </span>

        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search receipts, warranties, stores..."
          style={{
            flex:            1,
            background:      'none',
            border:          'none',
            outline:         'none',
            fontFamily:      'var(--font-mono)',
            fontSize:        'var(--text-sm)',
            color:           'var(--color-text-primary)',
            letterSpacing:   'var(--tracking-normal)',
          }}
        />

        {/* Clear button — only shows when there's a query */}
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            style={{
              background:  'none',
              border:      'none',
              cursor:      'pointer',
              fontFamily:  'var(--font-mono)',
              fontSize:    'var(--text-xs)',
              color:       'var(--color-text-tertiary)',
              flexShrink:  0,
              padding:     '0',
              lineHeight:  1,
            }}
          >
            ✕
          </button>
        )}
      </div>
    </form>
  )
}

// =============================================================================
// MAIN NAVBAR COMPONENT
// =============================================================================

export default function Navbar({ title }) {
  const navigate                   = useNavigate()
  const { profile }                = useAuth()

  // Placeholder notifications — replaced with real data in Phase 7
  // when useNotifications hook is wired up
  const notifications = []
  const unreadCount   = 0

  return (
    <header style={{
      height:          'var(--navbar-height, 60px)',
      backgroundColor: 'var(--color-bg-surface)',
      borderBottom:    '1px solid var(--color-border-soft)',
      display:         'flex',
      alignItems:      'center',
      gap:             'var(--space-6)',
      padding:         '0 var(--space-6)',
      position:        'sticky',
      top:             0,
      zIndex:          'var(--z-sticky)',
      flexShrink:      0,
    }}>

      {/* Page title — set by each page via PageWrapper */}
      <h1 style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      'var(--text-sm)',
        fontWeight:    '500',
        color:         'var(--color-text-primary)',
        letterSpacing: 'var(--tracking-wider)',
        textTransform: 'uppercase',
        margin:        0,
        whiteSpace:    'nowrap',
        minWidth:      '120px',
      }}>
        {title || 'WarrantyDeck'}
      </h1>

      {/* Separator */}
      <div style={{
        width:           '1px',
        height:          '20px',
        backgroundColor: 'var(--color-border-soft)',
        flexShrink:      0,
      }} />

      {/* Search bar — takes remaining space */}
      <SearchBar />

      {/* Right side controls */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        'var(--space-3)',
        marginLeft: 'auto',
        flexShrink: 0,
      }}>
        {/* Notification bell */}
        <NotificationBell count={unreadCount} items={notifications} />

        {/* Avatar — links to settings */}
        <button
          onClick={() => navigate('/settings')}
          title="Settings & profile"
          style={{
            width:           '32px',
            height:          '32px',
            borderRadius:    'var(--radius-full)',
            overflow:        'hidden',
            border:          '1px solid var(--color-border-strong)',
            cursor:          'pointer',
            flexShrink:      0,
            backgroundColor: 'var(--color-bg-elevated)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            padding:         0,
            transition:      'var(--transition-base)',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border-strong)'}
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.first_name || 'User'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize:   'var(--text-xs)',
              fontWeight: '600',
              color:      'var(--color-text-secondary)',
            }}>
              {profile?.first_name?.[0]?.toUpperCase() || '?'}
            </span>
          )}
        </button>
      </div>

    </header>
  )
}
