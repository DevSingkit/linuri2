'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function DashboardGate() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      console.log('DASHBOARD USER:', user)        // ← add
      if (!user) { router.replace('/login'); return }
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      console.log('DASHBOARD PROFILE:', data)     // ← add
      if (!data) { router.replace('/login'); return }
      const dest: Record<string, string> = {
        teacher: '/teacher',
        student: '/student',
        admin:   '/admin',
      }
      router.replace(dest[data.role] ?? '/login')
    })
  }, [])
  
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