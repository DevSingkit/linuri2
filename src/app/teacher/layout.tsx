// /teacher/layout.tsx
import { RoleGuard } from '@/components/layout'

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allow={['teacher']}>{children}</RoleGuard>
}