import { RoleGuard } from "@/components/layout";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard allow={["student"]}>{children}</RoleGuard>;
}
