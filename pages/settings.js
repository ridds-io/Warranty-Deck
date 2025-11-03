import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    days_before_expiry: 30
  })
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      loadSettings()
    }
  }, [user, authLoading])

  const loadSettings = async () => {
    try {
      const userId = user.id

      // Load user data
      const { data: userDataResult, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error loading user:', userError)
      } else {
        setUserData(userDataResult)
      }

      // Load notification preferences
      const { data: prefsData, error: prefsError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (prefsError && prefsError.code !== 'PGRST116') {
        console.error('Error loading preferences:', prefsError)
      } else if (prefsData) {
        setPreferences({
          email_enabled: prefsData.email_enabled ?? true,
          sms_enabled: prefsData.sms_enabled ?? false,
          push_enabled: prefsData.push_enabled ?? true,
          days_before_expiry: prefsData.days_before_expiry ?? 30
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePreferenceChange = (key, value) => {
    setPreferences({
      ...preferences,
      [key]: value
    })
  }

  const handleSavePreferences = async () => {
    if (!user) return

    setSaving(true)
    setSuccess(false)

    try {
      const userId = user.id

      // Upsert notification preferences
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          email_enabled: preferences.email_enabled,
          sms_enabled: preferences.sms_enabled,
          push_enabled: preferences.push_enabled,
          days_before_expiry: preferences.days_before_expiry,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Failed to save preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/dashboard" className="text-xl font-bold text-blue-600">
              Warranty Deck
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">Dashboard</Link>
              <Link href="/upload" className="text-gray-700 hover:text-gray-900">Upload</Link>
              <Link href="/receipts" className="text-gray-700 hover:text-gray-900">Receipts</Link>
              <Link href="/warranties" className="text-gray-700 hover:text-gray-900">Warranties</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and preferences</p>
        </div>

        {success && (
          <div className="mb-4 p-4 rounded-lg bg-green-50 text-green-800">
            Preferences saved successfully!
          </div>
        )}

        {/* Notification Preferences */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
          <p className="text-sm text-gray-600 mb-6">Choose how you want to be notified about warranty expirations</p>

          <div className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive warranty alerts via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.email_enabled}
                  onChange={(e) => handlePreferenceChange('email_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* SMS Notifications */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-sm text-gray-600">Receive urgent alerts via SMS</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.sms_enabled}
                  onChange={(e) => handlePreferenceChange('sms_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-gray-600">See updates in your notification center</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.push_enabled}
                  onChange={(e) => handlePreferenceChange('push_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Days Before Expiry */}
            <div className="p-4 border rounded-lg">
              <label className="block font-medium mb-2">Days Before Expiry to Notify</label>
              <input
                type="number"
                min="1"
                max="90"
                value={preferences.days_before_expiry}
                onChange={(e) => handlePreferenceChange('days_before_expiry', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-600 mt-1">Get notified this many days before warranty expires</p>
            </div>
          </div>

          <button
            onClick={handleSavePreferences}
            disabled={saving}
            className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-600">Email</p>
              <p className="font-semibold">{user?.email || 'N/A'}</p>
            </div>
            {userData && (
              <>
                <div>
                  <p className="text-gray-600">Name</p>
                  <p className="font-semibold">{userData.first_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Phone</p>
                  <p className="font-semibold">{userData.phone || 'N/A'}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Logout */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

