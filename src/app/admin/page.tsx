"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout";
import { supabase } from "@/lib/supabase";

interface TeacherRow {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface ClassRow {
  id: string;
  section_name: string;
  join_code: string;
  teacher_id: string;
  users: { name: string } | null;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) {
          router.replace("/login");
          return;
        }

        const { data: teacherData, error: teacherError } = await supabase
          .from("users")
          .select("*")
          .eq("role", "teacher")
          .order("created_at", { ascending: false });

        if (teacherError) throw teacherError;
        setTeachers((teacherData as TeacherRow[]) ?? []);

        const { data: cd, error: ce } = await supabase
          .from("classes")
          .select("*, users(name)")
          .order("created_at", { ascending: false });

        if (ce) throw ce;
        setClasses((cd as unknown as ClassRow[]) ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading)
    return (
      <AppLayout title="Admin Dashboard">
        <div style={S.center}>
          <div style={S.spin} />
          <p style={S.muted}>Loading…</p>
        </div>
      </AppLayout>
    );

  if (error)
    return (
      <AppLayout title="Admin Dashboard">
        <div style={S.center}>
          <div style={S.errCard}>
            <span style={{ fontSize: "2rem" }}>⚠️</span>
            <p style={{ color: "#8b1a1a", fontWeight: 600, margin: 0 }}>
              {error}
            </p>
          </div>
        </div>
      </AppLayout>
    );

  return (
    <AppLayout title="Admin Dashboard">
      <style>{`
        @keyframes pg-fade { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);} }
        @keyframes spin { to{transform:rotate(360deg);} }
        .pg { animation: pg-fade 0.22s ease both; }
        .adm-tr:hover td { background:#f0f9f4 !important; }
        .stat-c { transition:box-shadow 0.18s,transform 0.18s; }
        .stat-c:hover { box-shadow:0 8px 24px rgba(13,61,32,0.10); transform:translateY(-2px); }
        .action-btn:hover { background:#f0f9f4 !important; }
        .action-btn-danger:hover { background:#ffe5e5 !important; }
        .add-btn:hover { background:#1f6b38; }
        .secondary-btn:hover { background:#f0f9f4; }
      `}</style>

      <div className="pg">
        {/* Header */}
        <div style={S.topRow}>
          <div>
            <div style={S.crumb}>Administrator · School Overview</div>
            <h1 style={S.h1}>Admin Dashboard</h1>
            <p style={S.muted}>
              United Methodist Cooperative Learning System, Inc. — Caloocan City
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div
            className="stat-c"
            style={{
              ...S.statCard,
              background: "#eaf6ef",
              border: "1.5px solid rgba(26,122,64,0.18)",
            }}
          >
            <div
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#6b7280",
                marginBottom: "0.5rem",
              }}
            >
              Total Teachers
            </div>
            <span
              style={{
                fontSize: "2.5rem",
                fontWeight: 800,
                color: "#0d3d20",
                lineHeight: 1,
              }}
            >
              {teachers.length}
            </span>
          </div>
          <div
            className="stat-c"
            style={{
              ...S.statCard,
              background: "#eaf6ef",
              border: "1.5px solid rgba(26,122,64,0.18)",
            }}
          >
            <div
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#6b7280",
                marginBottom: "0.5rem",
              }}
            >
              Total Sections
            </div>
            <span
              style={{
                fontSize: "2.5rem",
                fontWeight: 800,
                color: "#0d3d20",
                lineHeight: 1,
              }}
            >
              {classes.length}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            marginBottom: "2rem",
            flexWrap: "wrap",
          }}
        >
          <button
            className="add-btn"
            style={S.addBtn}
            onClick={() => router.push("/admin/teacher/new")}
          >
            + Add New Teacher
          </button>
          <button
            className="secondary-btn"
            style={S.secondaryBtn}
            onClick={() => router.push("/admin/reports")}
          >
            View System-Wide Progress
          </button>
        </div>

        {/* Teacher List Table */}
        <div style={S.section}>
          <div style={S.secHead}>
            <h2 style={S.h2}>Teacher List</h2>
            <span style={S.badge}>{teachers.length} total</span>
          </div>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {[
                    "Teacher Name",
                    "Email",
                    "Section",
                    "Subjects",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th key={h} style={S.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teachers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        ...S.td,
                        textAlign: "center",
                        padding: "3rem",
                        color: "#6b7280",
                      }}
                    >
                      No teachers yet. Click &quot;Add New Teacher&quot; to get
                      started.
                    </td>
                  </tr>
                ) : (
                  teachers.map((t, i) => (
                    <tr
                      key={t.id}
                      className="adm-tr"
                      style={i % 2 === 0 ? S.trEven : S.trOdd}
                    >
                      <td style={{ ...S.td, fontWeight: 600 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.6rem",
                          }}
                        >
                          <div
                            style={{
                              ...S.av,
                              background: "#fffbf0",
                              color: "#7a5500",
                            }}
                          >
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          {t.name}
                        </div>
                      </td>
                      <td
                        style={{
                          ...S.td,
                          color: "#6b7280",
                          fontSize: "0.85rem",
                        }}
                      >
                        {t.email}
                      </td>
                      <td style={{ ...S.td, color: "#6b7280" }}>—</td>
                      <td style={{ ...S.td, color: "#6b7280" }}>—</td>
                      <td style={S.td}>
                        <span
                          style={{
                            ...S.pill,
                            background: "#eaf6ef",
                            color: "#0d5c28",
                            border: "1px solid rgba(26,122,64,0.18)",
                          }}
                        >
                          Active
                        </span>
                      </td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            className="action-btn"
                            style={S.actionBtn}
                            onClick={() =>
                              router.push(`/admin/teacher/${t.id}`)
                            }
                          >
                            Edit
                          </button>
                          <button
                            className="action-btn action-btn-danger"
                            style={{
                              ...S.actionBtn,
                              background: "#fff0f0",
                              color: "#8b1a1a",
                              borderColor: "rgba(155,28,28,0.18)",
                            }}
                          >
                            Deactivate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

const S: Record<string, React.CSSProperties> = {
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "1rem",
    marginBottom: "2rem",
  },
  crumb: {
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#1a7a40",
    marginBottom: "0.3rem",
  },
  h1: {
    fontFamily: "'Lora', serif",
    fontSize: "clamp(1.6rem, 4vw, 2rem)",
    fontWeight: 700,
    color: "#0d3d20",
    margin: "0 0 0.2rem",
  },
  h2: {
    fontFamily: "'Lora', serif",
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#0d3d20",
    margin: 0,
  },
  muted: { color: "#6b7280", fontSize: "0.9rem" },
  statCard: {
    borderRadius: "14px",
    padding: "1.5rem 1.25rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "default",
  },
  section: { marginBottom: "2rem" },
  secHead: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "1.25rem",
  },
  badge: {
    background: "#eaf6ef",
    color: "#0d5c28",
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: "20px",
  },
  tableWrap: {
    borderRadius: "14px",
    overflow: "hidden",
    border: "1.5px solid rgba(26,122,64,0.13)",
    boxShadow: "0 2px 12px rgba(13,61,32,0.05)",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.9rem",
    minWidth: "720px",
  },
  th: {
    textAlign: "left",
    padding: "0.75rem 1rem",
    background: "#0d3d20",
    color: "#ffd166",
    fontSize: "0.65rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    fontWeight: 700,
  },
  trEven: { background: "#fff" },
  trOdd: { background: "#fdfaf5" },
  td: {
    padding: "0.82rem 1rem",
    borderBottom: "1px solid rgba(26,122,64,0.07)",
    color: "#1a1f16",
    verticalAlign: "middle",
  },
  av: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "0.8rem",
    flexShrink: 0,
  },
  pill: {
    fontSize: "0.73rem",
    fontWeight: 700,
    padding: "0.25rem 0.65rem",
    borderRadius: "6px",
    display: "inline-block",
  },
  addBtn: {
    background: "#0d3d20",
    color: "#ffd166",
    border: "none",
    borderRadius: "10px",
    padding: "0.7rem 1.5rem",
    fontWeight: 700,
    fontSize: "0.9rem",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s",
  },
  secondaryBtn: {
    background: "#fff",
    color: "#0d3d20",
    border: "1.5px solid rgba(26,122,64,0.2)",
    borderRadius: "10px",
    padding: "0.7rem 1.5rem",
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s",
  },
  actionBtn: {
    background: "#fff",
    border: "1px solid rgba(26,122,64,0.15)",
    borderRadius: "6px",
    padding: "0.4rem 0.75rem",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s",
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: "1rem",
  },
  errCard: {
    background: "#fff0f0",
    border: "1.5px solid rgba(155,28,28,0.18)",
    borderRadius: "14px",
    padding: "2.5rem 3rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.75rem",
  },
  spin: {
    width: "38px",
    height: "38px",
    border: "4px solid #eaf6ef",
    borderTop: "4px solid #1a7a40",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};
