"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppLayout } from "@/components/layout";
import { supabase } from "@/lib/supabase";

export default function EditTeacherPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeacher() {
      const { data, error } = await supabase
        .from("users")
        .select("name, email")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Teacher not found.");
      } else {
        setName(data.name);
        setEmail(data.email);
      }
      setLoading(false);
    }
    fetchTeacher();
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const { error: updateError } = await supabase
      .from("users")
      .update({ name, email })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    if (password.trim()) {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, password }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Password reset failed.");
        setSaving(false);
        return;
      }
    }

    setSuccess("Teacher updated successfully.");
    setSaving(false);
  }

  if (loading)
    return (
      <AppLayout title="Edit Teacher">
        <p style={{ color: "#6b7280", padding: "2rem" }}>Loading...</p>
      </AppLayout>
    );

  return (
    <AppLayout title="Edit Teacher">
      <div
        style={{ maxWidth: "480px", margin: "0 auto", padding: "2rem 1rem" }}
      >
        <button
          onClick={() => router.push("/admin")}
          style={{
            background: "none",
            border: "none",
            color: "#1a7a40",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: "1.5rem",
            padding: 0,
            fontSize: "0.9rem",
          }}
        >
          ← Back to Dashboard
        </button>

        <h1
          style={{
            fontFamily: "'Lora', serif",
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "#0d3d20",
            marginBottom: "1.75rem",
          }}
        >
          Edit Teacher
        </h1>

        {error && (
          <div
            style={{
              background: "#fff0f0",
              border: "1.5px solid rgba(155,28,28,0.18)",
              borderRadius: "10px",
              padding: "0.75rem 1rem",
              color: "#8b1a1a",
              marginBottom: "1rem",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: "#eaf6ef",
              border: "1.5px solid rgba(26,122,64,0.18)",
              borderRadius: "10px",
              padding: "0.75rem 1rem",
              color: "#0d5c28",
              marginBottom: "1rem",
              fontSize: "0.9rem",
            }}
          >
            {success}
          </div>
        )}

        {[
          { label: "Full Name", value: name, setter: setName, type: "text" },
          { label: "Email", value: email, setter: setEmail, type: "email" },
          {
            label: "New Password (leave blank to keep current)",
            value: password,
            setter: setPassword,
            type: "password",
          },
        ].map(({ label, value, setter, type }) => (
          <div key={label} style={{ marginBottom: "1.25rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "#0d3d20",
                marginBottom: "0.4rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {label}
            </label>
            <input
              type={type}
              value={value}
              onChange={(e) => setter(e.target.value)}
              style={{
                width: "100%",
                padding: "0.65rem 0.9rem",
                borderRadius: "8px",
                border: "1.5px solid rgba(26,122,64,0.2)",
                fontSize: "0.95rem",
                color: "#1a1f16",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: saving ? "#6b7280" : "#0d3d20",
            color: "#ffd166",
            border: "none",
            borderRadius: "10px",
            padding: "0.75rem 2rem",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: saving ? "not-allowed" : "pointer",
            width: "100%",
            transition: "background 0.15s",
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </AppLayout>
  );
}
