"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout";
import {
  supabase,
  getClassesByTeacher,
  createClass,
  getStudentsByClass,
} from "@/lib/supabase";
import type { Class } from "@/types/linuri";

interface ClassWithCount extends Class {
  studentCount: number;
}

function generateJoinCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function TeacherClassesPage() {
  const router = useRouter();

  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
          router.replace("/login");
          return;
        }
        setTeacherId(user.id);
        await fetchClasses(user.id);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load classes.",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function fetchClasses(tid: string) {
    const { data, error: fetchError } = await getClassesByTeacher(tid);
    if (fetchError) throw fetchError;
    const classList = data ?? [];
    const withCounts: ClassWithCount[] = await Promise.all(
      classList.map(async (cls) => {
        const { data: enrollData } = await getStudentsByClass(cls.id);
        return { ...cls, studentCount: enrollData?.length ?? 0 };
      }),
    );
    setClasses(withCounts);
  }

  async function handleCreate() {
    if (!name.trim() || !section.trim()) {
      setFormError("Class name and section are required.");
      return;
    }
    if (!teacherId) return;
    setSubmitting(true);
    setFormError(null);
    setSuccessMsg(null);
    try {
      const joinCode = generateJoinCode();
      const { error: createError } = await createClass({
        teacher_id: teacherId,
        name: name.trim(),
        section: section.trim(),
        join_code: joinCode,
      });
      if (createError) throw createError;
      setSuccessMsg(
        `Class "${name.trim()} — ${section.trim()}" created! Join code: ${joinCode}`,
      );
      setName("");
      setSection("");
      await fetchClasses(teacherId);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create class.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading)
    return (
      <AppLayout title="My Classes">
        <style>{`@keyframes cl-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={s.center}>
          <div style={s.spinner} />
          <p style={s.muted}>Loading classes…</p>
        </div>
      </AppLayout>
    );

  if (error)
    return (
      <AppLayout title="My Classes">
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
    <AppLayout title="My Classes">
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
      `}</style>

      <div style={s.page}>
        {/* ── Header ── */}
        <div style={s.topRow}>
          <div>
            <div style={s.breadcrumb}>Teacher · Classes</div>
            <h1 style={s.heading}>My Classes</h1>
            <p style={s.muted}>Create and manage your class sections</p>
          </div>
          <button
            className="cl-back"
            style={s.btnOutline}
            onClick={() => router.push("/teacher")}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* ── Create form ── */}
        <div style={s.formCard}>
          <h2 style={s.formTitle}>Create a New Class</h2>
          <p style={{ ...s.muted, marginTop: "0.25rem" }}>
            A unique join code will be generated automatically for students to
            enrol.
          </p>

          <div style={s.formRow}>
            <div style={s.fieldGroup}>
              <label style={s.label}>Class Name</label>
              <input
                className="cl-input"
                style={s.input}
                type="text"
                placeholder="e.g. Grade 6"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                disabled={submitting}
              />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Section</label>
              <input
                className="cl-input"
                style={s.input}
                type="text"
                placeholder="e.g. Sampaguita"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                disabled={submitting}
              />
            </div>
            <button
              className="cl-primary"
              style={{
                ...s.btnPrimary,
                alignSelf: "flex-end",
                opacity: submitting ? 0.7 : 1,
                transition: "background 0.15s",
              }}
              onClick={handleCreate}
              disabled={submitting}
            >
              {submitting ? "Creating…" : "✚ Create Class"}
            </button>
          </div>

          {formError && <div style={s.errorMsg}>⚠️ {formError}</div>}
          {successMsg && (
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
                  Class created!
                </div>
                <div
                  style={{
                    fontSize: "0.88rem",
                    color: "#1a7a40",
                    marginTop: "0.15rem",
                  }}
                >
                  {successMsg}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Class list ── */}
        <section style={s.section}>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>Existing Classes</h2>
            <span style={s.countBadge}>{classes.length}</span>
          </div>

          {classes.length === 0 ? (
            <div style={s.empty}>
              <span style={{ fontSize: "2.5rem" }}>🏫</span>
              <p style={{ margin: 0, fontWeight: 600, color: "#0d3d20" }}>
                No classes yet.
              </p>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>
                Create one above to get started.
              </p>
            </div>
          ) : (
            <div className="cl-content" style={s.classGrid}>
              {classes.map((cls) => (
                <div key={cls.id} className="cl-card" style={s.classCard}>
                  <div style={s.classCardTop}>
                    <div style={s.classIconWrap}>🏫</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={s.classCardName}>
                        {cls.name} — {cls.section}
                      </div>
                      <div style={s.classCardSub}>
                        Created{" "}
                        {new Date(cls.created_at).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <span style={s.studentBadge}>
                      👤 {cls.studentCount}{" "}
                      {cls.studentCount === 1 ? "student" : "students"}
                    </span>
                  </div>

                  <div
                    style={{
                      ...s.codeRow,
                      cursor: "pointer",
                      userSelect: "none" as const,
                    }}
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/${cls.join_code}`,
                      );
                      setCopied(cls.id);
                      setTimeout(() => setCopied(null), 2000);
                    }}
                    title="Click to copy invite link"
                  >
                    <span style={s.codeLabel}>Join Code</span>
                    <span style={s.codeValue}>{cls.join_code}</span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "0.75rem",
                        color: copied === cls.id ? "#1a7a40" : "#6b7280",
                        fontWeight: 600,
                      }}
                    >
                      {copied === cls.id ? "✓ Copied!" : "Copy link"}
                    </span>
                  </div>

                  <div style={s.cardActions}>
                    <button
                      className="cl-small"
                      style={{ ...s.btnSmall, flex: 1 }}
                      onClick={() =>
                        router.push(`/teacher/lessons/new?class_id=${cls.id}`)
                      }
                    >
                      ✚ New Lesson
                    </button>
                    <button
                      style={{
                        ...s.btnSmall,
                        flex: 1,
                        background: "#eaf6ef",
                        color: "#0d3d20",
                      }}
                      onClick={() => router.push(`/teacher/classes/${cls.id}`)}
                    >
                      👥 View Students
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
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
    marginBottom: "2.5rem",
    boxShadow: "0 2px 12px rgba(13,61,32,0.05)",
  },
  formTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "1.35rem",
    color: "#0d3d20",
    margin: "0 0 0.25rem",
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
    minWidth: "200px",
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
  cardActions: {
    display: "flex",
    gap: "0.5rem",
    width: "100%",
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
  classGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1rem",
  },
  classCard: {
    background: "#fff",
    border: "1.5px solid rgba(26,122,64,0.13)",
    borderRadius: "18px",
    padding: "1.35rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.9rem",
    cursor: "default",
  },
  classCardTop: { display: "flex", alignItems: "flex-start", gap: "0.75rem" },
  classIconWrap: { fontSize: "1.5rem", flexShrink: 0 },
  classCardName: {
    fontWeight: 700,
    fontSize: "0.97rem",
    color: "#0d3d20",
    lineHeight: 1.3,
  },
  classCardSub: { fontSize: "0.82rem", color: "#6b7280", marginTop: "0.2rem" },
  studentBadge: {
    background: "#eaf6ef",
    color: "#0d5c28",
    fontSize: "0.75rem",
    fontWeight: 700,
    padding: "5px 11px",
    borderRadius: "20px",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
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
  btnSmall: {
    background: "#f0a500",
    color: "#0d3d20",
    border: "none",
    borderRadius: "9px",
    padding: "0.55rem 1.1rem",
    fontWeight: 700,
    fontSize: "0.88rem",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "background 0.15s",
    alignSelf: "flex-start" as const,
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
