// src/contexts/RoleContext.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Role, User } from '@/types/linuri'
import { supabase } from '@/lib/supabase'

interface RoleContextType {
  user: User | null
  role: Role | null
  loading: boolean
}

const RoleContext = createContext<RoleContextType>({
  user: null,
  role: null,
  loading: true,
})

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (data) {
          setUser(data)
          setRole(data.role)
        }
      }

      setLoading(false)
    }

    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getUser()
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <RoleContext.Provider value={{ user, role, loading }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}