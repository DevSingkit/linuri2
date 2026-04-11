'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function DashboardGate() {
  const router = useRouter()

  useEffect(() => {
    async function redirect() {
      try {
        // First try to refresh the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          await supabase.auth.signOut()
          router.replace('/login')
          return
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          await supabase.auth.signOut()
          router.replace('/login')
          return
        }

        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!data) {
          router.replace('/login')
          return
        }

        const dest: Record<string, string> = {
          teacher: '/teacher',
          student: '/student',
          admin:   '/admin',
        }
        router.replace(dest[data.role] ?? '/login')
      } catch {
        await supabase.auth.signOut()
        router.replace('/login')
      }
    }

    redirect()
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#faf6ee',
      fontFamily: 'sans-serif',
      color: '#6b6b6b',
      fontSize: '0.9rem',
    }}>
      Loading…
    </div>
  )
}