import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  username: string
  avatar_url?: string
  is_admin: boolean
}

interface User {
  id: string
  email?: string
  profile?: Profile
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError) throw authError
        
        if (!authUser) {
          setUser(null)
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (profileError) throw profileError

        setUser({
          id: authUser.id,
          email: authUser.email,
          profile: profile as Profile
        })

      } catch (e) {
        setError(e as Error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getCurrentUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setUser({
          id: session.user.id,
          email: session.user.email,
          profile: profile as Profile
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading, error }
}
