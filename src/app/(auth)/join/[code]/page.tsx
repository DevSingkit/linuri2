"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function JoinPage() {
  const router = useRouter();
  const params = useParams();
  const code = (params.code as string).toUpperCase();

  const [classInfo, setClassInfo] = useState<{
    id: string;
    name: string;
    section: string;
  } | null>(null);
  const [classError, setClassError] = useState(false);
  const [checkingCode, setCheckingCode] = useState(true);

  const [fullName, setFullName] = useState("");
  const [lrn, setLrn] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Validate the join code on mount
  useEffect(() => {
    async function checkCode() {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, section")
        .eq("join_code", code)
        .single();

      if (error || !data) {
        setClassError(true);
      } else {
        setClassInfo(data);
      }
      setCheckingCode(false);
    }
    checkCode();
  }, [code]);

  const handleJoin = async () => {
    setError("");

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!/^\d{12}$/.test(lrn.trim())) {
      setError("LRN must be exactly 12 digits.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!classInfo) {
      setError("Invalid join code.");
      return;
    }

    setLoading(true);

    // Check LRN is not already taken
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("lrn", lrn.trim())
      .single();

    if (existing) {
      setError("This LRN is already registered. Please log in instead.");
      setLoading(false);
      return;
    }

    const syntheticEmail = `${lrn.trim()}@linuri.internal`;

    // Create Supabase Auth account
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: syntheticEmail,
      password,
      options: {
        data: { name: fullName.trim(), role: "student", lrn: lrn.trim() },
      },
    });

    if (signUpError || !authData.user) {
      setError(
        signUpError?.message ?? "Registration failed. Please try again.",
      );
      setLoading(false);
      return;
    }

    // Update public.users row with LRN (trigger creates the row, we patch lrn + name)
    const { error: updateError } = await supabase
      .from("users")
      .update({ lrn: lrn.trim(), name: fullName.trim() })
      .eq("id", authData.user.id);

    if (updateError) {
      setError(
        "Account created but profile update failed. Contact your teacher.",
      );
      setLoading(false);
      return;
    }

    // Enroll in class
    const { error: enrollError } = await supabase
      .from("enrollments")
      .insert({ student_id: authData.user.id, class_id: classInfo.id });

    if (enrollError) {
      setError("Account created but enrollment failed. Contact your teacher.");
      setLoading(false);
      return;
    }

    router.replace("/student");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --green: #1a7a40; --green-dark: #0d3d20; --green-mid: #1f6b38;
          --green-light: #eaf6ef; --gold-lt: #ffd166; --gold-bg: #fffbf0;
          --cream: #fdfaf5; --white: #ffffff; --text: #1a1f16;
          --muted: #6b7280; --border: rgba(26,122,64,0.13);
          --font: 'Plus Jakarta Sans', sans-serif;
        }
        .join-page {
          min-height: 100vh; background: var(--cream);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          font-family: var(--font); padding: 2rem 1.25rem;
          position: relative; overflow: hidden;
        }
        .join-page::before {
          content: ''; position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(26,122,64,0.05) 1px, transparent 1px);
          background-size: 28px 28px; pointer-events: none;
        }
        .join-card {
          background: var(--white); border: 1.5px solid var(--border);
          border-radius: 22px; padding: 2.5rem 2.25rem 2rem;
          width: 100%; max-width: 440px; position: relative; z-index: 1;
          box-shadow: 0 4px 32px rgba(13,61,32,0.07), 0 1px 4px rgba(13,61,32,0.04);
        }
        .join-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 1.75rem; }
        .join-mark {
          width: 40px; height: 40px; background: var(--green-dark);
          border-radius: 11px; display: flex; align-items: center;
          justify-content: center; font-size: 1rem; font-weight: 800;
          color: var(--gold-lt); flex-shrink: 0;
        }
        .join-mark-name { font-size: 1.2rem; font-weight: 800; color: var(--green-dark); }
        .join-mark-badge {
          margin-left: auto; background: var(--green-light); color: var(--green-dark);
          font-size: 0.68rem; font-weight: 700; padding: 3px 9px;
          border-radius: 20px; border: 1px solid rgba(26,122,64,0.15);
        }
        .join-class-strip {
          background: var(--green-light); border: 1px solid rgba(26,122,64,0.2);
          border-radius: 10px; padding: 0.75rem 1rem; margin-bottom: 1.5rem;
          font-size: 0.85rem; color: var(--green-dark);
        }
        .join-class-strip strong { font-weight: 700; }
        .join-class-label {
          font-size: 0.65rem; font-weight: 700; letter-spacing: 0.09em;
          text-transform: uppercase; color: var(--green); margin-bottom: 3px;
        }
        .join-title { font-size: 1.5rem; font-weight: 800; color: var(--green-dark); letter-spacing: -0.02em; margin-bottom: 0.3rem; }
        .join-sub { font-size: 0.875rem; color: var(--muted); margin-bottom: 1.5rem; line-height: 1.5; }
        .join-error {
          display: flex; align-items: flex-start; gap: 8px;
          background: #fff0f0; border: 1px solid rgba(139,26,26,0.16);
          border-radius: 10px; padding: 0.7rem 1rem;
          font-size: 0.83rem; color: #8b1a1a; margin-bottom: 1.25rem; line-height: 1.5;
        }
        .join-field { margin-bottom: 1rem; }
        .join-label {
          display: block; font-size: 0.775rem; font-weight: 700;
          color: var(--text); margin-bottom: 0.4rem;
          letter-spacing: 0.015em; text-transform: uppercase;
        }
        .join-label-hint { font-weight: 400; color: var(--muted); text-transform: none; }
        .join-input {
          width: 100%; padding: 0.7rem 0.95rem;
          border: 1.5px solid var(--border); border-radius: 10px;
          font-size: 0.9rem; font-family: var(--font); color: var(--text);
          background: var(--cream); outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .join-input:focus {
          border-color: var(--green); background: var(--white);
          box-shadow: 0 0 0 3px rgba(26,122,64,0.09);
        }
        .join-input::placeholder { color: #b0b8b0; }
        .join-input-mono { font-family: 'Courier New', monospace; letter-spacing: 0.1em; }
        .join-btn {
          width: 100%; padding: 0.78rem;
          background: var(--green-dark); color: #fff; border: none;
          border-radius: 10px; font-size: 0.93rem; font-weight: 700;
          font-family: var(--font); cursor: pointer; margin-top: 0.25rem;
          transition: background 0.15s, transform 0.1s;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .join-btn:hover:not(:disabled) { background: var(--green-mid); transform: translateY(-1px); }
        .join-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .join-spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
          border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .join-login-link {
          text-align: center; margin-top: 1.25rem;
          font-size: 0.84rem; color: var(--muted);
        }
        .join-login-link a { color: var(--green); font-weight: 700; text-decoration: none; }
        .join-login-link a:hover { text-decoration: underline; }
        .join-school {
          text-align: center; margin-top: 1.5rem;
          font-size: 0.7rem; color: var(--muted); line-height: 1.7;
          position: relative; z-index: 1;
        }
        .join-invalid {
          background: var(--white); border: 1.5px solid rgba(155,28,28,0.18);
          border-radius: 22px; padding: 3rem 2rem; text-align: center;
          max-width: 400px; width: 100%; position: relative; z-index: 1;
          box-shadow: 0 4px 32px rgba(13,61,32,0.07);
        }
      `}</style>

      <div className="join-page">
        {checkingCode ? (
          <div
            style={{
              zIndex: 1,
              position: "relative",
              color: "#6b7280",
              fontFamily: "var(--font)",
            }}
          >
            Checking join code…
          </div>
        ) : classError ? (
          <div className="join-invalid">
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔗</div>
            <h2
              style={{
                color: "#8b1a1a",
                fontWeight: 800,
                marginBottom: "0.5rem",
              }}
            >
              Invalid Join Link
            </h2>
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.9rem",
                lineHeight: 1.6,
                marginBottom: "1.5rem",
              }}
            >
              This join link is invalid or has expired. Ask your teacher for a
              new one.
            </p>
            <link
              href="/login"
              style={{
                color: "#1a7a40",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              ← Back to login
            </link>
          </div>
        ) : (
          <div className="join-card">
            <div className="join-logo">
              <div className="join-mark">U</div>
              <span className="join-mark-name">UMCLS</span>
            </div>

            <div className="join-class-strip">
              <div className="join-class-label">Joining class</div>
              <strong>{classInfo?.name}</strong> — {classInfo?.section}
            </div>

            <h1 className="join-title">Create your account</h1>
            <p className="join-sub">
              Fill in your details to join your class. Use your LRN to log in
              next time.
            </p>

            {error && (
              <div className="join-error">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <div className="join-field">
              <label className="join-label">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Maria Santos"
                className="join-input"
                autoComplete="name"
              />
            </div>

            <div className="join-field">
              <label className="join-label">
                LRN{" "}
                <span className="join-label-hint">
                  — 12-digit Learner Reference Number
                </span>
              </label>
              <input
                type="text"
                value={lrn}
                onChange={(e) =>
                  setLrn(e.target.value.replace(/\D/g, "").slice(0, 12))
                }
                placeholder="123456789012"
                className="join-input join-input-mono"
                inputMode="numeric"
                maxLength={12}
              />
            </div>

            <div className="join-field">
              <label className="join-label">
                Password{" "}
                <span className="join-label-hint">— at least 6 characters</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="join-input"
                autoComplete="new-password"
              />
            </div>

            <div className="join-field" style={{ marginBottom: "1.25rem" }}>
              <label className="join-label">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="join-input"
                autoComplete="new-password"
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={loading}
              className="join-btn"
            >
              {loading ? (
                <>
                  <div className="join-spinner" /> Creating account…
                </>
              ) : (
                <>Join Class →</>
              )}
            </button>

            <div className="join-login-link">
              Already have an account? <link href="/login">Sign in</link>
            </div>
          </div>
        )}

        <p className="join-school">
          United Methodist Cooperative Learning System, Inc.
          <br />
          Caloocan City · Adaptive Learning Platform
        </p>
      </div>
    </>
  );
}
