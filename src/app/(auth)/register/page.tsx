"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get("code") ?? "";

  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [joinCode, setJoinCode] = useState(code);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !identifier.trim() || !password || !joinCode.trim()) {
      setError("All fields are required.");
      return;
    }

    const isLRN = /^\d{12}$/.test(identifier.trim());
    const email = isLRN
      ? `${identifier.trim()}@student.umcls.edu`
      : identifier.trim();
    const lrn = isLRN ? identifier.trim() : null;

    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/create-student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email,
        lrn,
        password,
        joinCode: joinCode.trim().toUpperCase(),
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      setError(result.error ?? "Registration failed.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  if (success)
    return (
      <div style={s.page}>
        <div style={s.card}>
          <span style={{ fontSize: "2.5rem" }}>🎉</span>
          <h2 style={s.h2}>Account created!</h2>
          <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
            Redirecting you to login…
          </p>
        </div>
      </div>
    );

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.h1}>Create Student Account</h1>
        <p
          style={{
            color: "#6b7280",
            fontSize: "0.88rem",
            margin: "0.25rem 0 1.5rem",
          }}
        >
          Register using your LRN or email address
        </p>

        {error && <div style={s.errBox}>{error}</div>}

        {[
          {
            label: "Full Name",
            value: name,
            setter: setName,
            type: "text",
            placeholder: "Your full name",
          },
          {
            label: "LRN or Email",
            value: identifier,
            setter: setIdentifier,
            type: "text",
            placeholder: "12-digit LRN or email address",
          },
          {
            label: "Password",
            value: password,
            setter: setPassword,
            type: "password",
            placeholder: "Choose a password",
          },
          {
            label: "Class Join Code",
            value: joinCode,
            setter: setJoinCode,
            type: "text",
            placeholder: "e.g. ABC1234",
          },
        ].map(({ label, value, setter, type, placeholder }) => (
          <div key={label} style={s.field}>
            <label style={s.label}>{label}</label>
            <input
              type={type}
              value={value}
              placeholder={placeholder}
              onChange={(e) =>
                setter(
                  type === "text" && label === "Class Join Code"
                    ? e.target.value.toUpperCase()
                    : e.target.value,
                )
              }
              style={s.input}
            />
          </div>
        ))}

        <button
          onClick={handleRegister}
          disabled={loading}
          style={{ ...s.btnPrimary, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Creating account…" : "Create Account"}
        </button>

        <p style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "1rem" }}>
          Already have an account?{" "}
          <span
            style={{ color: "#1a7a40", cursor: "pointer", fontWeight: 600 }}
            onClick={() => router.push("/login")}
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#fafaf7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  },
  card: {
    background: "#fff",
    border: "1.5px solid rgba(26,122,64,0.13)",
    borderRadius: "20px",
    padding: "2.5rem 2rem",
    maxWidth: "420px",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 8px 40px rgba(13,61,32,0.10)",
  },
  h1: {
    fontFamily: "'Lora', serif",
    fontSize: "1.6rem",
    fontWeight: 700,
    color: "#0d3d20",
    margin: 0,
  },
  h2: {
    fontFamily: "'Lora', serif",
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#0d3d20",
    margin: 0,
  },
  errBox: {
    background: "#fff0f0",
    border: "1.5px solid rgba(155,28,28,0.18)",
    borderRadius: "10px",
    padding: "0.75rem 1rem",
    color: "#8b1a1a",
    fontSize: "0.88rem",
    width: "100%",
    marginBottom: "0.75rem",
  },
  field: { width: "100%", marginBottom: "1rem" },
  label: {
    display: "block",
    fontSize: "0.73rem",
    fontWeight: 700,
    color: "#0d3d20",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: "0.4rem",
  },
  input: {
    width: "100%",
    padding: "0.7rem 0.9rem",
    border: "1.5px solid rgba(26,122,64,0.2)",
    borderRadius: "8px",
    fontSize: "0.95rem",
    color: "#1a1f16",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
    outline: "none",
  },
  btnPrimary: {
    background: "#0d3d20",
    color: "#ffd166",
    border: "none",
    borderRadius: "10px",
    padding: "0.8rem",
    fontWeight: 700,
    fontSize: "0.97rem",
    cursor: "pointer",
    width: "100%",
    fontFamily: "inherit",
    marginTop: "0.5rem",
  },
};
