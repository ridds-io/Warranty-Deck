// =============================================================================
// WARRANTYDECK — SIDEBAR
// src/components/layout/Sidebar.jsx
//
// The left navigation panel. Present on every authenticated page.
//
// Structure:
//   - Brand mark (top)
//   - Primary nav  (Dashboard, Vault, Analytics)
//   - Folders nav  (Memorabilia, Reimbursement) — with folder icon feel
//   - Bottom nav   (Chatbot, Settings)
//   - User profile strip (bottom — avatar, name, sign out)
//
// Active state: driven by react-router's useLocation().
// The current URL path determines which link is highlighted.
//
// Collapsed state: on smaller screens the sidebar collapses to icon-only.
// A toggle button controls this. State lives here, not in parent,
// because no other component needs to know if the sidebar is collapsed.
// =============================================================================

import { useState }                        from 'react'
import { useNavigate, useLocation }        from 'react-router-dom'
import { useAuth }                         from '../../context/AuthContext'

// =============================================================================
// NAV ITEM DEFINITIONS
// Defined here so adding a new page = adding one object, nothing else.
// =============================================================================

const PRIMARY_NAV = [
  { path: '/dashboard',  label: 'Dashboard',  icon: '◈' },
  { path: '/vault',      label: 'Vault',       icon: '▦' },
  { path: '/analytics',  label: 'Analytics',   icon: '◷' },
]

const FOLDER_NAV = [
  { path: '/memorabilia',   label: 'Memorabilia',   icon: '♡' },
  { path: '/reimbursement', label: 'Reimbursement',  icon: '↑' },
]

const BOTTOM_NAV = [
  { path: '/chat',     label: 'AI Assistant', icon: '◎' },
  { path: '/settings', label: 'Settings',     icon: '⊙' },
]

// =============================================================================
// NAV LINK — individual sidebar button
// =============================================================================

function NavLink({ path, label, icon, isActive, isCollapsed, onClick }) {
  const [hovered, setHovered] = useState(false)

  const highlighted = isActive || hovered

  return (
    <button
      onClick={() => onClick(path)}
      title={isCollapsed ? label : undefined} // tooltip when collapsed
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            'var(--space-3)',
        width:          '100%',
        padding:        isCollapsed
          ? 'var(--space-3) 0'
          : 'var(--space-3) var(--space-4)',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        background:     isActive
          ? 'var(--color-bg-elevated)'
          : hovered
            ? 'var(--color-bg-surface)'
            : 'transparent',
        border:         isActive
          ? '1px solid var(--color-border-strong)'
          : '1px solid transparent',
        borderRadius:   'var(--radius-md)',
        cursor:         'pointer',
        transition:     'var(--transition-base)',
        // Left accent bar on active item
        boxShadow:      isActive
          ? 'inset 3px 0 0 var(--color-accent)'
          : 'none',
      }}
    >
      {/* Icon */}
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize:   'var(--text-base)',
        color:      highlighted
          ? 'var(--color-text-primary)'
          : 'var(--color-text-tertiary)',
        transition: 'color var(--duration-fast) var(--ease-out)',
        lineHeight: 1,
        flexShrink: 0,
      }}>
        {icon}
      </span>

      {/* Label — hidden when collapsed */}
      {!isCollapsed && (
        <span style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      'var(--text-sm)',
          fontWeight:    isActive ? '500' : '400',
          color:         highlighted
            ? 'var(--color-text-primary)'
            : 'var(--color-text-secondary)',
          letterSpacing: 'var(--tracking-wide)',
          transition:    'color var(--duration-fast) var(--ease-out)',
          whiteSpace:    'nowrap',
          overflow:      'hidden',
        }}>
          {label}
        </span>
      )}
    </button>
  )
}

// =============================================================================
// SECTION LABEL — small uppercase divider between nav groups
// =============================================================================

function SectionLabel({ label, isCollapsed }) {
  if (isCollapsed) {
    // When collapsed, replace label with a thin divider line
    return (
      <div style={{
        height:          '1px',
        backgroundColor: 'var(--color-border-soft)',
        margin:          'var(--space-3) var(--space-3)',
      }} />
    )
  }

  return (
    <div style={{
      fontFamily:    'var(--font-mono)',
      fontSize:      'var(--text-xs)',
      color:         'var(--color-text-tertiary)',
      letterSpacing: 'var(--tracking-widest)',
      textTransform: 'uppercase',
      padding:       `var(--space-2) var(--space-4)`,
      marginTop:     'var(--space-2)',
    }}>
      {label}
    </div>
  )
}

// =============================================================================
// MAIN SIDEBAR COMPONENT
// =============================================================================

export default function Sidebar() {
  const navigate           = useNavigate()
  const { pathname }       = useLocation()
  const { profile, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  // Determine active path — exact match, or prefix for nested routes
  // e.g. /receipt/some-uuid should keep /vault highlighted
  const isActive = (path) => {
    if (path === '/vault' && pathname.startsWith('/receipt'))    return true
    if (path === '/vault' && pathname.startsWith('/warranty'))   return true
    return pathname === path
  }

  const handleNav = (path) => navigate(path)

  // Sidebar width — wider when expanded, icon-only when collapsed
  const sidebarWidth = collapsed ? '64px' : 'var(--sidebar-width, 240px)'

  return (
    <aside style={{
      width:           sidebarWidth,
      minHeight:       '100vh',
      backgroundColor: 'var(--color-bg-surface)',
      borderRight:     '1px solid var(--color-border-soft)',
      display:         'flex',
      flexDirection:   'column',
      transition:      `width var(--duration-normal) var(--ease-out)`,
      overflow:        'hidden',
      flexShrink:      0,
      position:        'sticky',
      top:             0,
      // Sidebar sits below navbar height
      height:          '100vh',
    }}>

      {/* ── BRAND + COLLAPSE TOGGLE ───────────────────────────────────── */}
      <div style={{
        height:         'var(--navbar-height, 60px)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding:        collapsed ? '0' : '0 var(--space-4) 0 var(--space-5)',
        borderBottom:   '1px solid var(--color-border-soft)',
        flexShrink:     0,
      }}>
        {/* Brand — hidden when collapsed */}
        {!collapsed && (
          <span style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      'var(--text-xs)',
            fontWeight:    '600',
            letterSpacing: 'var(--tracking-widest)',
            color:         'var(--color-text-primary)',
            textTransform: 'uppercase',
          }}>
            WD
          </span>
        )}

        {/* Collapse toggle button */}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            width:           '28px',
            height:          '28px',
            background:      'transparent',
            border:          '1px solid var(--color-border-soft)',
            borderRadius:    'var(--radius-sm)',
            cursor:          'pointer',
            color:           'var(--color-text-tertiary)',
            fontFamily:      'var(--font-mono)',
            fontSize:        'var(--text-xs)',
            transition:      'var(--transition-base)',
            flexShrink:      0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor       = 'var(--color-border-strong)'
            e.currentTarget.style.color             = 'var(--color-text-primary)'
            e.currentTarget.style.backgroundColor   = 'var(--color-bg-elevated)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor       = 'var(--color-border-soft)'
            e.currentTarget.style.color             = 'var(--color-text-tertiary)'
            e.currentTarget.style.backgroundColor   = 'transparent'
          }}
        >
          {/* Arrow flips direction based on collapsed state */}
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* ── PRIMARY NAV ───────────────────────────────────────────────── */}
      <div style={{
        padding:  `var(--space-4) ${collapsed ? 'var(--space-2)' : 'var(--space-3)'}`,
        display:  'flex',
        flexDirection: 'column',
        gap:      'var(--space-1)',
      }}>
        {PRIMARY_NAV.map(item => (
          <NavLink
            key={item.path}
            {...item}
            isActive={isActive(item.path)}
            isCollapsed={collapsed}
            onClick={handleNav}
          />
        ))}
      </div>

      {/* ── FOLDERS ───────────────────────────────────────────────────── */}
      <div style={{
        padding:  `0 ${collapsed ? 'var(--space-2)' : 'var(--space-3)'}`,
        display:  'flex',
        flexDirection: 'column',
        gap:      'var(--space-1)',
      }}>
        <SectionLabel label="Folders" isCollapsed={collapsed} />
        {FOLDER_NAV.map(item => (
          <NavLink
            key={item.path}
            {...item}
            isActive={isActive(item.path)}
            isCollapsed={collapsed}
            onClick={handleNav}
          />
        ))}
      </div>

      {/* Spacer — pushes bottom nav to the bottom */}
      <div style={{ flex: 1 }} />

      {/* ── BOTTOM NAV ────────────────────────────────────────────────── */}
      <div style={{
        padding:  `0 ${collapsed ? 'var(--space-2)' : 'var(--space-3)'}`,
        display:  'flex',
        flexDirection: 'column',
        gap:      'var(--space-1)',
        paddingBottom: 'var(--space-2)',
      }}>
        {BOTTOM_NAV.map(item => (
          <NavLink
            key={item.path}
            {...item}
            isActive={isActive(item.path)}
            isCollapsed={collapsed}
            onClick={handleNav}
          />
        ))}
      </div>

      {/* ── USER PROFILE STRIP ────────────────────────────────────────── */}
      <div style={{
        borderTop:  '1px solid var(--color-border-soft)',
        padding:    `var(--space-3) ${collapsed ? 'var(--space-2)' : 'var(--space-4)'}`,
        display:    'flex',
        alignItems: 'center',
        gap:        'var(--space-3)',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        {/* Avatar — Google profile picture or initials fallback */}
        <div style={{
          width:          '32px',
          height:         '32px',
          borderRadius:   'var(--radius-full)',
          overflow:       'hidden',
          flexShrink:     0,
          backgroundColor:'var(--color-bg-elevated)',
          border:         '1px solid var(--color-border-strong)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          cursor:         'pointer',
        }}
          onClick={() => handleNav('/settings')}
          title="Go to settings"
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.first_name || 'User'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            // Initials fallback
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize:   'var(--text-xs)',
              fontWeight: '600',
              color:      'var(--color-text-secondary)',
            }}>
              {profile?.first_name?.[0]?.toUpperCase() || '?'}
            </span>
          )}
        </div>

        {/* Name + sign out — hidden when collapsed */}
        {!collapsed && (
          <div style={{
            flex:     1,
            overflow: 'hidden',
            minWidth: 0,
          }}>
            <div style={{
              fontFamily:   'var(--font-mono)',
              fontSize:     'var(--text-xs)',
              fontWeight:   '500',
              color:        'var(--color-text-primary)',
              whiteSpace:   'nowrap',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
            }}>
              {profile?.first_name
                ? `${profile.first_name} ${profile.last_name || ''}`.trim()
                : 'Loading...'}
            </div>

            {/* Sign out */}
            <button
              onClick={signOut}
              style={{
                background:    'none',
                border:        'none',
                padding:       0,
                fontFamily:    'var(--font-mono)',
                fontSize:      'var(--text-xs)',
                color:         'var(--color-text-tertiary)',
                cursor:        'pointer',
                letterSpacing: 'var(--tracking-wide)',
                transition:    'color var(--duration-fast) var(--ease-out)',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-tertiary)'}
            >
              sign out →
            </button>
          </div>
        )}
      </div>

    </aside>
  )
}
