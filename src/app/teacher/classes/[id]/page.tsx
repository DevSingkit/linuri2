"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/layout";

interface Student {
  id: string;
  name: string;
  email: string;
  lrn: string | null;
}

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [className, setClassName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [addName, setAddName] = useState("");
  const [addIdentifier, setAddIdentifier] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const [editing, setEditing] = useState<Student | null>(null);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("enrollments")
      .select("users(id, name, email, lrn)")
      .eq("class_id", id);
    if (err) throw new Error(err.message);
    return (data ?? [])
      .map((e: unknown) => (e as { users: Student }).users)
      .filter(Boolean) as Student[];
  }, [id]);

  const refreshStudents = useCallback(async () => {
    try {
      const data = await fetchStudents();
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load students.");
    }
  }, [fetchStudents]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const { data: cls } = await supabase
        .from("classes")
        .select("name, section, join_code")
        .eq("id", id)
        .single();
      const data = await fetchStudents();
      if (cancelled) return;
      if (cls) {
        setClassName(`${cls.name} — ${cls.section}`);
        setJoinCode(cls.join_code);
      }
      setStudents(data);
      setLoading(false);
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [id, fetchStudents]);

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/${joinCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAddStudent() {
    if (!addName.trim() || !addIdentifier.trim() || !addPassword) {
      setAddError("All fields are required.");
      return;
    }
    const isLRN = /^\d{12}$/.test(addIdentifier.trim());
    const email = isLRN
      ? `${addIdentifier.trim()}@student.umcls.edu`
      : addIdentifier.trim();
    const lrn = isLRN ? addIdentifier.trim() : null;

    setAdding(true);
    setAddError(null);
    setAddSuccess(null);

    const res = await fetch("/api/admin/create-student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: addName.trim(),
        email,
        lrn,
        password: addPassword,
        joinCode,
      }),
    });
    const result = await res.json();
    if (!res.ok) {
      setAddError(result.error ?? "Failed.");
      setAdding(false);
      return;
    }

    setAddSuccess(`${addName.trim()} added successfully.`);
    setAddName("");
    setAddIdentifier("");
    setAddPassword("");
    await refreshStudents();
    setAdding(false);
  }

  async function handleEditSave() {
    if (!editing) return;
    setEditSaving(true);
    setEditError(null);

    const { error: nameErr } = await supabase
      .from("users")
      .update({ name: editName })
      .eq("id", editing.id);
    if (nameErr) {
      setEditError(nameErr.message);
      setEditSaving(false);
      return;
    }

    if (editPassword.trim()) {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editing.id, password: editPassword }),
      });
      const result = await res.json();
      if (!res.ok) {
        setEditError(result.error ?? "Password update failed.");
        setEditSaving(false);
        return;
      }
    }

    setEditing(null);
    setEditPassword("");
    await refreshStudents();
    setEditSaving(false);
  }

  async function handleDelete(studentId: string) {
    if (!confirm("Remove this student from the class?")) return;
    await supabase
      .from("enrollments")
      .delete()
      .eq("student_id", studentId)
      .eq("class_id", id);
    await refreshStudents();
  }

  if (loading)
    return (
      <AppLayout title="Class Detail">
        <style>{`@keyframes cl-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={s.center}>
          <div style={s.spinner} />
          <p style={s.muted}>Loading…</p>
        </div>
      </AppLayout>
    );

  if (error)
    return (
      <AppLayout title="Class Detail">
        <div style={s.center}>
          <div style={s.errorCard}>
            <span style={{ fontSize: "2rem" }}>⚠️</span>
            <p style={{ color: "#8b1a1a", fontWeight: 600, margin: 0 }}>
              {error}
            </p>
          </div>
        </div>
      </AppLayout>
    );

  return (
    <AppLayout title={className || "Class Detail"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');
        @keyframes cl-spin  { to { transform: rotate(360deg); } }
        @keyframes cl-fade  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cl-slide { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .cl-card { transition: box-shadow 0.18s, transform 0.18s; }
        .cl-card:hover { box-shadow: 0 8px 28px rgba(13,61,32,0.11); transform: translateY(-2px); }
        .cl-back:hover { background: #eaf6ef !important; }
        .cl-primary:hover { background: #1a7a40 !important; }
        .cl-small:hover { background: #e09b00 !important; }
        .cl-input:focus { border-color: #1a7a40 !important; box-shadow: 0 0 0 3px rgba(26,122,64,0.12); outline: none; }
        .cl-content { animation: cl-fade 0.25s ease both; }
        .cl-success { animation: cl-slide 0.3s ease both; }
        .cl-code:hover { background: #eaf6ef !important; border-color: rgba(26,122,64,0.25) !important; }
        .cl-action:hover { background: #eaf6ef !important; }
        .cl-action-danger:hover { background: #ffe0e0 !important; }
      `}</style>

      <div style={s.page}>
        {/* ── Header ── */}
        <div style={s.topRow}>
          <div>
            <div style={s.breadcrumb}>Teacher · Classes · Detail</div>
            <h1 style={s.heading}>{className}</h1>
            <p style={s.muted}>Manage students and share the invite link</p>
          </div>
          <button
            className="cl-back"
            style={s.btnOutline}
            onClick={() => router.push("/teacher/classes")}
          >
            ← Back to Classes
          </button>
        </div>

        {/* ── Invite Link ── */}
        <div style={s.formCard}>
          <h2 style={s.formTitle}>Student Invite Link</h2>
          <p style={{ ...s.muted, marginTop: "0.25rem" }}>
            Share this link with students to let them register and join this
            class automatically.
          </p>
          <div style={s.inviteRow}>
            <div
              className="cl-code"
              style={s.codeRow}
              onClick={copyLink}
              title="Click to copy invite link"
            >
              <span style={s.codeLabel}>Join Code</span>
              <span style={s.codeValue}>{joinCode}</span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "0.75rem",
                  color: copied ? "#1a7a40" : "#6b7280",
                  fontWeight: 600,
                }}
              >
                {copied ? "✓ Copied!" : "Copy link"}
              </span>
            </div>
            <div style={s.inviteUrl}>
              {`${typeof window !== "undefined" ? window.location.origin : ""}/${joinCode}`}
            </div>
          </div>
        </div>

        {/* ── Add Student ── */}
        <div style={s.formCard}>
          <h2 style={s.formTitle}>Add Student Manually</h2>
          <p style={{ ...s.muted, marginTop: "0.25rem" }}>
            Create a student account and enrol them directly into this class.
          </p>

          {addError && <div style={s.errorMsg}>⚠️ {addError}</div>}
          {addSuccess && (
            <div className="cl-success" style={s.successBox}>
              <span style={s.successIcon}>✅</span>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#0d5c28",
                    fontSize: "0.95rem",
                  }}
                >
                  Student added!
                </div>
                <div
                  style={{
                    fontSize: "0.88rem",
                    color: "#1a7a40",
                    marginTop: "0.15rem",
                  }}
                >
                  {addSuccess}
                </div>
              </div>
            </div>
          )}

          <div style={s.formRow}>
            {[
              {
                label: "Full Name",
                value: addName,
                setter: setAddName,
                type: "text",
                ph: "Student name",
              },
              {
                label: "LRN or Email",
                value: addIdentifier,
                setter: setAddIdentifier,
                type: "text",
                ph: "12-digit LRN or email",
              },
              {
                label: "Password",
                value: addPassword,
                setter: setAddPassword,
                type: "password",
                ph: "Initial password",
              },
            ].map(({ label, value, setter, type, ph }) => (
              <div key={label} style={s.fieldGroup}>
                <label style={s.label}>{label}</label>
                <input
                  className="cl-input"
                  style={s.input}
                  type={type}
                  placeholder={ph}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  disabled={adding}
                />
              </div>
            ))}
            <button
              className="cl-primary"
              style={{
                ...s.btnPrimary,
                alignSelf: "flex-end",
                opacity: adding ? 0.7 : 1,
                transition: "background 0.15s",
              }}
              onClick={handleAddStudent}
              disabled={adding}
            >
              {adding ? "Adding…" : "✚ Add"}
            </button>
          </div>
        </div>

        {/* ── Student List ── */}
        <section style={s.section}>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>Students</h2>
            <span style={s.countBadge}>{students.length}</span>
          </div>

          {students.length === 0 ? (
            <div style={s.empty}>
              <span style={{ fontSize: "2.5rem" }}>👤</span>
              <p style={{ margin: 0, fontWeight: 600, color: "#0d3d20" }}>
                No students yet.
              </p>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>
                Add one above or share the invite link.
              </p>
            </div>
          ) : (
            <div className="cl-content" style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {["Name", "Email / LRN", "Actions"].map((h) => (
                      <th key={h} style={s.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((st, i) => (
                    <tr
                      key={st.id}
                      style={{ background: i % 2 === 0 ? "#fff" : "#fdfaf5" }}
                    >
                      <td style={{ ...s.td, fontWeight: 700 }}>{st.name}</td>
                      <td
                        style={{
                          ...s.td,
                          color: "#6b7280",
                          fontSize: "0.85rem",
                        }}
                      >
                        <div>{st.email}</div>
                        {st.lrn && (
                          <div
                            style={{
                              fontFamily: "monospace",
                              color: "#0d3d20",
                              marginTop: "2px",
                            }}
                          >
                            {st.lrn}
                          </div>
                        )}
                      </td>
                      <td style={s.td}>
                        <div style={s.cardActions}>
                          <button
                            className="cl-action"
                            style={s.actionBtn}
                            onClick={() => {
                              setEditing(st);
                              setEditName(st.name);
                              setEditPassword("");
                              setEditError(null);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="cl-action-danger"
                            style={{
                              ...s.actionBtn,
                              background: "#fff0f0",
                              color: "#8b1a1a",
                              borderColor: "rgba(155,28,28,0.18)",
                            }}
                            onClick={() => handleDelete(st.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ── Edit Modal ── */}
      {editing && (
        <div
          style={s.overlay}
          onClick={(e) => e.target === e.currentTarget && setEditing(null)}
        >
          <div style={s.modal}>
            <h2 style={s.formTitle}>Edit Student</h2>
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.88rem",
                margin: "0.1rem 0 1.25rem",
              }}
            >
              {editing.email}
            </p>
            {editError && <div style={s.errorMsg}>⚠️ {editError}</div>}
            <div style={s.fieldGroup}>
              <label style={s.label}>Full Name</label>
              <input
                className="cl-input"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={s.input}
              />
            </div>
            <div
              style={{
                ...s.fieldGroup,
                marginTop: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <label style={s.label}>
                New Password{" "}
                <span
                  style={{
                    textTransform: "none",
                    fontWeight: 400,
                    color: "#6b7280",
                  }}
                >
                  (leave blank to keep)
                </span>
              </label>
              <input
                className="cl-input"
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                style={s.input}
              />
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                className="cl-back"
                style={s.btnOutline}
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                className="cl-primary"
                style={{
                  ...s.btnPrimary,
                  flex: 1,
                  opacity: editSaving ? 0.7 : 1,
                  transition: "background 0.15s",
                }}
                onClick={handleEditSave}
                disabled={editSaving}
              >
                {editSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: "2.5rem",
    maxWidth: "960px",
    margin: "0 auto",
    fontFamily: "'Inter', sans-serif",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "1rem",
    marginBottom: "2rem",
  },
  breadcrumb: {
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#1a7a40",
    marginBottom: "0.35rem",
  },
  heading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "2.1rem",
    color: "#0d3d20",
    margin: "0 0 0.25rem",
  },
  muted: { color: "#6b7280", fontSize: "0.95rem", margin: 0 },
  btnOutline: {
    background: "#fff",
    color: "#0d3d20",
    border: "1.5px solid rgba(26,122,64,0.35)",
    borderRadius: "9px",
    padding: "0.7rem 1.4rem",
    fontWeight: 600,
    fontSize: "0.95rem",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "background 0.15s",
  },
  formCard: {
    background: "#fff",
    border: "1.5px solid rgba(26,122,64,0.13)",
    borderRadius: "20px",
    padding: "2rem",
    marginBottom: "2rem",
    boxShadow: "0 2px 12px rgba(13,61,32,0.05)",
  },
  formTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "1.35rem",
    color: "#0d3d20",
    margin: "0 0 0.25rem",
  },
  inviteRow: {
    marginTop: "1.25rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
  },
  codeRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    background: "#fdfaf5",
    borderRadius: "10px",
    padding: "0.75rem 1rem",
    border: "1px solid rgba(26,122,64,0.10)",
    transition: "background 0.15s, border-color 0.15s",
    cursor: "pointer",
    userSelect: "none" as const,
  },
  codeLabel: {
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "#6b7280",
  },
  codeValue: {
    background: "#0d3d20",
    color: "#ffd166",
    fontFamily: "monospace",
    fontSize: "0.97rem",
    fontWeight: 700,
    padding: "0.25rem 0.9rem",
    borderRadius: "6px",
    letterSpacing: "0.14em",
    marginLeft: "auto",
  },
  inviteUrl: {
    fontSize: "0.82rem",
    color: "#6b7280",
    paddingLeft: "0.25rem",
  },
  formRow: {
    display: "flex",
    gap: "1rem",
    alignItems: "flex-start",
    marginTop: "1.25rem",
    flexWrap: "wrap" as const,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.45rem",
    flex: 1,
    minWidth: "160px",
  },
  label: {
    fontSize: "0.73rem",
    fontWeight: 700,
    color: "#0d3d20",
    letterSpacing: "0.07em",
    textTransform: "uppercase" as const,
  },
  input: {
    border: "1.5px solid rgba(26,122,64,0.2)",
    borderRadius: "10px",
    padding: "0.8rem 1.1rem",
    fontSize: "0.97rem",
    fontFamily: "inherit",
    color: "#1a1f16",
    background: "#fdfaf5",
    transition: "border-color 0.15s, box-shadow 0.15s",
    width: "100%",
    boxSizing: "border-box" as const,
    outline: "none",
  },
  btnPrimary: {
    background: "#0d3d20",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "0.8rem 1.6rem",
    fontWeight: 700,
    fontSize: "0.97rem",
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap" as const,
  },
  errorMsg: {
    color: "#8b1a1a",
    fontSize: "0.9rem",
    marginTop: "0.75rem",
    background: "#fff0f0",
    border: "1px solid rgba(155,28,28,0.18)",
    borderRadius: "8px",
    padding: "0.7rem 1.1rem",
  },
  successBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
    background: "#eaf6ef",
    border: "1.5px solid rgba(26,122,64,0.25)",
    borderRadius: "12px",
    padding: "1.1rem 1.35rem",
    marginTop: "1rem",
  },
  successIcon: { fontSize: "1.3rem", flexShrink: 0 },
  section: { marginBottom: "2rem" },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "1.25rem",
  },
  sectionTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "1.35rem",
    color: "#0d3d20",
    margin: 0,
  },
  countBadge: {
    background: "#eaf6ef",
    color: "#0d5c28",
    fontSize: "0.75rem",
    fontWeight: 700,
    padding: "4px 12px",
    borderRadius: "20px",
  },
  tableWrap: {
    borderRadius: "18px",
    overflow: "hidden",
    border: "1.5px solid rgba(26,122,64,0.13)",
    overflowX: "auto" as const,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "0.9rem",
    fontFamily: "'Inter', sans-serif",
  },
  th: {
    textAlign: "left" as const,
    padding: "0.75rem 1rem",
    background: "#0d3d20",
    color: "#ffd166",
    fontSize: "0.65rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    fontWeight: 700,
  },
  td: {
    padding: "0.82rem 1rem",
    borderBottom: "1px solid rgba(26,122,64,0.07)",
    color: "#1a1f16",
    verticalAlign: "middle" as const,
  },
  cardActions: {
    display: "flex",
    gap: "0.5rem",
  },
  actionBtn: {
    background: "#fff",
    border: "1px solid rgba(26,122,64,0.15)",
    borderRadius: "9px",
    padding: "0.4rem 0.85rem",
    fontSize: "0.82rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "background 0.15s",
    color: "#0d3d20",
  },
  empty: {
    background: "#fff",
    border: "1.5px solid rgba(26,122,64,0.13)",
    borderRadius: "18px",
    padding: "3rem 2rem",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "0.75rem",
    textAlign: "center" as const,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "1rem",
  },
  modal: {
    background: "#fff",
    borderRadius: "20px",
    padding: "2rem",
    width: "100%",
    maxWidth: "440px",
    boxShadow: "0 8px 40px rgba(13,61,32,0.15)",
    display: "flex",
    flexDirection: "column" as const,
  },
  center: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: "1rem",
  },
  errorCard: {
    background: "#fff0f0",
    border: "1.5px solid rgba(155,28,28,0.18)",
    borderRadius: "18px",
    padding: "2.5rem 3rem",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "0.75rem",
  },
  spinner: {
    width: "42px",
    height: "42px",
    border: "4px solid #eaf6ef",
    borderTop: "4px solid #1a7a40",
    borderRadius: "50%",
    animation: "cl-spin 0.8s linear infinite",
  },
};
