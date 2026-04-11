// Admin Layout
import { RoleGuard } from '@/components/layout'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allow={['admin']}>{children}</RoleGuard>
}