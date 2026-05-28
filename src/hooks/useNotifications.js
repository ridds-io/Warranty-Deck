// =============================================================================
// WARRANTYDECK — useNotifications
// src/hooks/useNotifications.js
// =============================================================================

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function mapNotification(row) {
  return {
    id: row.id,
    title: row.title || 'Alert',
    message: row.message || row.body || 'New notification',
    read: Boolean(row.read || row.is_read),
  }
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (user?.id) {
      query = query.eq('user_id', user.id)
    }

    const { data, error: queryError } = await query

    if (queryError) {
      setError(queryError)
      setNotifications([])
    } else {
      setNotifications((data || []).map(mapNotification))
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return { notifications, loading, error, refresh: fetchNotifications }
}
