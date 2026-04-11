//  src/contexts/NotificationContext.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { MasteryRecord } from '@/types/linuri'

interface Notification {
  id: string
  studentName: string
  skillName: string
  regressionCount: number
  seenAt: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAllRead: () => void
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAllRead: () => {},
})

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Listen for real-time regression flags from mastery_history
    const channel = supabase
      .channel('regression-alerts')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mastery_history',
          filter: 'regression_count=gte.2',
        },
        async (payload) => {
          const record = payload.new as MasteryRecord

          // Fetch student name
          const { data: userData } = await supabase
            .from('users')
            .select('name')
            .eq('id', record.student_id)
            .single()

          const newNotif: Notification = {
            id: record.id,
            studentName: userData?.name ?? 'A student',
            skillName: record.skill_name,
            regressionCount: record.regression_count,
            seenAt: new Date().toISOString(),
          }

          setNotifications((prev) => [newNotif, ...prev])
          setUnreadCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const markAllRead = () => setUnreadCount(0)

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}