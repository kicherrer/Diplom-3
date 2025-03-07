import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useUser() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Получаем текущего пользователя
    const getCurrentUser = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (!mounted) return
        
        if (authError) {
          console.error('Auth error:', authError)
          setUser(null)
          return
        }

        if (!authUser) {
          setUser(null)
          return
        }

        // Получаем профиль пользователя
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (!mounted) return

        if (profileError) {
          console.error('Profile error:', profileError)
          setUser(null)
          return
        }

        setUser({ ...authUser, profile })
      } catch (error) {
        if (!mounted) return
        console.error('Error in getCurrentUser:', error)
        setUser(null)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getCurrentUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (mounted) {
          setUser({ ...session.user, profile })
        }
      } else {
        if (mounted) {
          setUser(null)
        }
      }
      if (mounted) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}
