import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from './supabase'

/**
 * Hook to protect routes - redirects to login if not authenticated
 */
export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)

      if (!user) {
        router.push('/login')
      }
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return { user, loading }
}

/**
 * Get user ID from current session
 */
export async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

