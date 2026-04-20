import { redirect } from "next/navigation";

export default function ShortJoinRedirect({
  params,
}: {
  params: { code: string };
}) {
  redirect(`/auth/join/${params.code.toUpperCase()}`);
}
