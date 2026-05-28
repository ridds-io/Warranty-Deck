// =============================================================================
// WARRANTYDECK — SETTINGS
// src/pages/Settings.jsx
// =============================================================================

import { useState } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Settings() {
  const { profile } = useAuth()
  const { theme, setTheme } = useTheme()
  const [expiryAlerts, setExpiryAlerts] = useState(true)
  const [returnAlerts, setReturnAlerts] = useState(false)

  return (
    <PageWrapper title="Settings">
      <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
        <section
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>
            Profile
          </h2>
          <div
            style={{
              marginTop: 'var(--space-4)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-4)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <div>
              <div style={{ color: 'var(--color-text-tertiary)' }}>First name</div>
              <div>{profile?.first_name || '-'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-tertiary)' }}>Last name</div>
              <div>{profile?.last_name || '-'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-tertiary)' }}>Email</div>
              <div>{profile?.email || 'Connected via Google'}</div>
            </div>
          </div>
        </section>

        <section
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>
            Theme
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Button
              size="sm"
              variant={theme === 'light' ? 'primary' : 'outline'}
              onClick={() => setTheme('light')}
            >
              Light
            </Button>
            <Button
              size="sm"
              variant={theme === 'dark' ? 'primary' : 'outline'}
              onClick={() => setTheme('dark')}
            >
              Dark
            </Button>
          </div>
        </section>

        <section
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>
            Notifications
          </h2>
          <div
            style={{
              marginTop: 'var(--space-4)',
              display: 'grid',
              gap: 'var(--space-3)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <input
                type="checkbox"
                checked={expiryAlerts}
                onChange={e => setExpiryAlerts(e.target.checked)}
              />
              Warranty expiry alerts
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <input
                type="checkbox"
                checked={returnAlerts}
                onChange={e => setReturnAlerts(e.target.checked)}
              />
              Return deadline reminders
            </label>
          </div>
        </section>
      </div>
    </PageWrapper>
  )
}
