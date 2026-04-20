"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Role = "admin" | "teacher" | "student";

interface Props {
  allow: Role[];
  children: React.ReactNode;
}

export default function RoleGuard({ allow, children }: Props) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!data || !allow.includes(data.role as Role)) {
        router.replace("/unauthorized");
        return;
      }
      setOk(true);
    }
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ok)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fdfaf5",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: "#6b7280",
          fontSize: "0.9rem",
          gap: "0.75rem",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            border: "3px solid #eaf6ef",
            borderTop: "3px solid #1a7a40",
            borderRadius: "50%",
            animation: "rg-spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes rg-spin { to { transform: rotate(360deg); } }`}</style>
        Checking access…
      </div>
    );

  return <>{children}</>;
}
