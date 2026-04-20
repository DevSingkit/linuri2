import { redirect } from "next/navigation";

export default async function ShortJoinRedirect({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  redirect(`/auth/join/${code.toUpperCase()}`);
}