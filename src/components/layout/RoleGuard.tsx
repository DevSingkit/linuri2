// src/components/layout/RoleGuard.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Role = 'admin' | 'teacher' | 'student'

interface Props {
  allow: Role[]
  children: React.ReactNode
}

export default function RoleGuard({ allow, children }: Props) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace('/login')
        return
      }
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!data || !allow.includes(data.role as Role)) {
        router.replace('/unauthorized')
        return
      }
      setChecking(false)
    })
  }, [])

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#faf6ee',
        fontFamily: 'sans-serif',
        color: '#6b6b6b',
        fontSize: '0.9rem'
      }}>
        Checking access…
      </div>
    )
  }

  return <>{children}</>
}