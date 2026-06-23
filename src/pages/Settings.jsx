// =============================================================================
// WARRANTYDECK — SETTINGS
// src/pages/Settings.jsx
// =============================================================================

import { useState, useEffect } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useCurrency, CURRENCIES } from '../context/CurrencyContext'
import { upsertUserProfile } from '../lib/supabase'

export default function Settings() {
  const { profile, user, refreshProfile } = useAuth()
  const { theme, setTheme } = useTheme()
  const { currency, setCurrency } = useCurrency()

  const [firstName, setFirstName] = useState(profile?.first_name || '')
  const [lastName, setLastName] = useState(profile?.last_name || '')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')

  const [expiryAlerts, setExpiryAlerts] = useState(true)
  const [returnAlerts, setReturnAlerts] = useState(false)

  // Sync form state when profile loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '')
      setLastName(profile.last_name || '')
    }
  }, [profile])

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    setSaveMessage('')
    setSaveError('')

    const { error } = await upsertUserProfile(user.id, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
    })

    if (error) {
      setSaveError(error.message || 'Failed to save profile.')
    } else {
      setSaveMessage('Profile saved successfully.')
      await refreshProfile()
    }
    setSaving(false)
    setTimeout(() => { setSaveMessage(''); setSaveError('') }, 3000)
  }

  const inputStyle = {
    width: '100%',
    padding: 'var(--space-3)',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--text-sm)',
    backgroundColor: 'var(--color-bg-inset)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const sectionStyle = {
    backgroundColor: 'var(--color-bg-surface)',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-6)',
  }

  const labelStyle = {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--tracking-wide)',
    marginBottom: 'var(--space-2)',
    display: 'block',
  }

  return (
    <PageWrapper title="Settings">
      <div style={{ display: 'grid', gap: 'var(--space-6)' }}>

        {/* ── PROFILE ───────────────────────────────────────────────── */}
        <section style={sectionStyle}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>
            Profile
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <div>
              <label style={labelStyle}>First name</label>
              <input
                style={inputStyle}
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div>
              <label style={labelStyle}>Last name</label>
              <input
                style={inputStyle}
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={labelStyle}>Email</label>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-tertiary)',
              }}
            >
              {user?.email || 'Connected via Google'}
            </div>
          </div>

          {saveMessage && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-success)', marginBottom: 'var(--space-3)' }}>
              {saveMessage}
            </div>
          )}
          {saveError && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>
              {saveError}
            </div>
          )}

          <Button onClick={handleSaveProfile} disabled={saving} size="sm">
            {saving ? 'Saving...' : 'Save profile'}
          </Button>
        </section>

        {/* ── THEME ─────────────────────────────────────────────────── */}
        <section style={sectionStyle}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>
            Theme
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button
              size="sm"
              variant={theme === 'light' ? 'primary' : 'outline'}
              onClick={() => setTheme('light')}
            >
              ☀ Light — Paper
            </Button>
            <Button
              size="sm"
              variant={theme === 'dark' ? 'primary' : 'outline'}
              onClick={() => setTheme('dark')}
            >
              ● Dark — Carbon Copy
            </Button>
          </div>
        </section>

        {/* ── CURRENCY ──────────────────────────────────────────────── */}
        <section style={sectionStyle}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>
            Currency
          </h2>
          <label style={labelStyle}>Display currency</label>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            style={{
              ...inputStyle,
              width: 'auto',
              minWidth: '260px',
              cursor: 'pointer',
            }}
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <div style={{ marginTop: 'var(--space-2)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
            All receipt amounts will be displayed in the selected currency. Exchange rates are not applied — this is a display preference only.
          </div>
        </section>

        {/* ── NOTIFICATIONS ─────────────────────────────────────────── */}
        <section style={sectionStyle}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>
            Notifications
          </h2>
          <div
            style={{
              display: 'grid',
              gap: 'var(--space-3)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={expiryAlerts}
                onChange={e => setExpiryAlerts(e.target.checked)}
              />
              Warranty expiry alerts
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
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
