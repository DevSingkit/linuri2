"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout";
import { supabase, getClassesByTeacher } from "@/lib/supabase";
import type { Subject, MasteryLevel } from "@/types/linuri";

interface MasteryRow {
  student_id: string;
  class_id: string;
  skill_name: string;
  subject: Subject;
  mastery_level: MasteryLevel;
  difficulty_level: string;
  regression_count: number;
  updated_at: string;
  users: { name: string } | null;
}

interface ClassOption {
  id: string;
  name: string;
  section: string;
}
type MasteryFilter = "All" | MasteryLevel;

export default function TeacherReportsPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [mastery, setMastery] = useState<MasteryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>("All");
  const [search, setSearch] = useState("");

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

        const { data: classData, error: classError } =
          await getClassesByTeacher(user.id);
        if (classError) throw classError;
        const classList = (classData ?? []) as ClassOption[];
        setClasses(classList);

        if (classList.length === 0) {
          setLoading(false);
          return;
        }

        const classIds = classList.map((c) => c.id);
        const { data, error: mError } = await supabase
          .from("mastery_history")
          .select("*, users!mastery_history_student_id_fkey(name)")
          .in("class_id", classIds)
          .order("updated_at", { ascending: false });
        if (mError) throw mError;
        setMastery((data as unknown as MasteryRow[]) ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const base =
    selectedClass === "all"
      ? mastery
      : mastery.filter((m) => m.class_id === selectedClass);

  const filtered = base.filter((m) => {
    const matchMastery =
      masteryFilter === "All" || m.mastery_level === masteryFilter;
    const matchSearch =
      search === "" ||
      (m.users?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      m.skill_name.toLowerCase().includes(search.toLowerCase());
    return matchMastery && matchSearch;
  });

  const total = mastery.length;
  const mastered = mastery.filter((m) => m.mastery_level === "Mastered").length;
  const developing = mastery.filter(
    (m) => m.mastery_level === "Developing",
  ).length;
  const needsHelp = mastery.filter(
    (m) => m.mastery_level === "Needs Help",
  ).length;

  const masteryMeta: Record<
    string,
    { bg: string; color: string; border: string; icon: string }
  > = {
    Mastered: {
      bg: "#eaf6ef",
      color: "#0d5c28",
      border: "rgba(26,122,64,0.18)",
      icon: "⭐",
    },
    Developing: {
      bg: "#fffbf0",
      color: "#7a5500",
      border: "rgba(200,130,0,0.18)",
      icon: "📈",
    },
    "Needs Help": {
      bg: "#fff0f0",
      color: "#8b1a1a",
      border: "rgba(155,28,28,0.14)",
      icon: "🆘",
    },
  };

  const subjectMeta: Record<string, { icon: string }> = {
    English: { icon: "📖" },
    Mathematics: { icon: "🔢" },
    Science: { icon: "🔬" },
  };

  if (loading)
    return (
      <AppLayout title="Reports">
        <style>{`@keyframes rp-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={s.center}>
          <div style={s.spinner} />
          <p style={s.muted}>Loading report…</p>
        </div>
      </AppLayout>
    );

  if (error)
    return (
      <AppLayout title="Reports">
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
    <AppLayout title="Reports">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');
        @keyframes rp-spin { to { transform: rotate(360deg); } }
        @keyframes rp-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .rp-tr:hover td { background: #f0f9f4 !important; }
        .rp-tab:hover:not(.rp-tab-on) { background: #eaf6ef !important; color: #0d3d20 !important; }
        .rp-print:hover { background: #1a7a40 !important; transform: translateY(-1px); }
        .rp-content { animation: rp-fade 0.25s ease both; }
        .rp-select:focus { border-color: #1a7a40 !important; box-shadow: 0 0 0 3px rgba(26,122,64,0.12); }
        .rp-search:focus { border-color: #1a7a40 !important; box-shadow: 0 0 0 3px rgba(26,122,64,0.12); }
        .rp-subcard { transition: box-shadow 0.18s, transform 0.18s; }
        .rp-subcard:hover { box-shadow: 0 6px 20px rgba(13,61,32,0.10); transform: translateY(-2px); }
      `}</style>

      <div style={s.page}>
        {/* ── Header ── */}
        <div style={s.topRow}>
          <div>
            <div style={s.breadcrumb}>Teacher · Reports</div>
            <h1 style={s.heading}>Reports</h1>
            <p style={s.muted}>Student mastery records across your classes</p>
          </div>
          <button
            className="rp-print"
            style={s.btnPrint}
            onClick={() => window.print()}
          >
            🖨️ Print / Save PDF
          </button>
        </div>

        {/* ── Summary bar ── */}
        {total > 0 && (
          <div style={s.summaryCard}>
            <div style={s.barLabel}>
              <span
                style={{
                  fontWeight: 600,
                  color: "#0d3d20",
                  fontSize: "0.95rem",
                }}
              >
                Overall Mastery
              </span>
              <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                {total} records
              </span>
            </div>
            <div style={s.bar}>
              {mastered > 0 && (
                <div
                  style={{
                    ...s.barSeg,
                    width: `${Math.round((mastered / total) * 100)}%`,
                    background: "linear-gradient(90deg,#1a7a40,#0d5c28)",
                  }}
                >
                  {Math.round((mastered / total) * 100)}%
                </div>
              )}
              {developing > 0 && (
                <div
                  style={{
                    ...s.barSeg,
                    width: `${Math.round((developing / total) * 100)}%`,
                    background: "linear-gradient(90deg,#d4a017,#b07800)",
                  }}
                >
                  {Math.round((developing / total) * 100)}%
                </div>
              )}
              {needsHelp > 0 && (
                <div
                  style={{
                    ...s.barSeg,
                    width: `${Math.round((needsHelp / total) * 100)}%`,
                    background: "linear-gradient(90deg,#c0392b,#8b1a1a)",
                  }}
                >
                  {Math.round((needsHelp / total) * 100)}%
                </div>
              )}
            </div>
            <div style={s.barLegend}>
              <span style={s.legendItem}>
                <span style={{ ...s.dot, background: "#1a7a40" }} />
                Mastered ({mastered})
              </span>
              <span style={s.legendItem}>
                <span style={{ ...s.dot, background: "#d4a017" }} />
                Developing ({developing})
              </span>
              <span style={s.legendItem}>
                <span style={{ ...s.dot, background: "#c0392b" }} />
                Needs Help ({needsHelp})
              </span>
            </div>
          </div>
        )}

        {/* ── Per-subject cards ── */}
        <div style={s.subjectGrid}>
          {(["English", "Mathematics", "Science"] as Subject[]).map((sub) => {
            const rows = mastery.filter((m) => m.subject === sub);
            return (
              <div key={sub} className="rp-subcard" style={s.subjectCard}>
                <div style={s.subjectHead}>
                  <span style={s.subjectIcon}>{subjectMeta[sub]?.icon}</span>
                  <span style={s.subjectName}>{sub}</span>
                </div>
                <div
                  style={{
                    height: "5px",
                    borderRadius: "99px",
                    background: "#e5e7eb",
                    overflow: "hidden",
                    margin: "0.4rem 0 0.6rem",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${rows.length ? Math.round((rows.filter((m) => m.mastery_level === "Mastered").length / rows.length) * 100) : 0}%`,
                      background: "#1a7a40",
                      borderRadius: "99px",
                    }}
                  />
                </div>
                <div style={s.subjectRow}>
                  <span style={{ color: "#0d5c28", fontWeight: 500 }}>
                    ⭐ Mastered
                  </span>
                  <strong style={{ color: "#0d5c28" }}>
                    {rows.filter((m) => m.mastery_level === "Mastered").length}
                  </strong>
                </div>
                <div style={s.subjectRow}>
                  <span style={{ color: "#7a5500", fontWeight: 500 }}>
                    📈 Developing
                  </span>
                  <strong style={{ color: "#7a5500" }}>
                    {
                      rows.filter((m) => m.mastery_level === "Developing")
                        .length
                    }
                  </strong>
                </div>
                <div style={s.subjectRow}>
                  <span style={{ color: "#8b1a1a", fontWeight: 500 }}>
                    🆘 Needs Help
                  </span>
                  <strong style={{ color: "#8b1a1a" }}>
                    {
                      rows.filter((m) => m.mastery_level === "Needs Help")
                        .length
                    }
                  </strong>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Filters ── */}
        <div style={s.filterRow}>
          <div style={s.filterGroup}>
            <span style={s.filterLabel}>Class</span>
            <select
              className="rp-select"
              style={s.select}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="all">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.section}
                </option>
              ))}
            </select>
          </div>
          <div style={s.filterGroup}>
            <span style={s.filterLabel}>Mastery</span>
            <div style={s.filterBtns}>
              {(
                [
                  "All",
                  "Mastered",
                  "Developing",
                  "Needs Help",
                ] as MasteryFilter[]
              ).map((f) => (
                <button
                  key={f}
                  className={`rp-tab${masteryFilter === f ? " rp-tab-on" : ""}`}
                  style={{
                    ...s.fBtn,
                    ...(masteryFilter === f ? s.fBtnActive : {}),
                  }}
                  onClick={() => setMasteryFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <input
            className="rp-search"
            style={{ ...s.search, marginLeft: "auto" }}
            type="text"
            placeholder="Search student or skill…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <p style={{ ...s.muted, marginBottom: "0.75rem" }}>
          Showing <strong>{filtered.length}</strong> of {total} record
          {total !== 1 ? "s" : ""}
        </p>

        {mastery.length === 0 ? (
          <div style={s.empty}>
            <span style={{ fontSize: "2.5rem" }}>📭</span>
            <p style={{ margin: 0, fontWeight: 600, color: "#0d3d20" }}>
              No quiz data yet.
            </p>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>
              Students need to complete quizzes first.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            <span style={{ fontSize: "2.5rem" }}>🔍</span>
            <p style={{ margin: 0, fontWeight: 600, color: "#0d3d20" }}>
              No records match your filters.
            </p>
          </div>
        ) : (
          <div className="rp-content" style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {[
                    "Student",
                    "Skill",
                    "Subject",
                    "Difficulty",
                    "Mastery",
                    "Regressions",
                    "Updated",
                  ].map((h) => (
                    <th key={h} style={s.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => {
                  const mm =
                    masteryMeta[m.mastery_level] ?? masteryMeta["Needs Help"];
                  return (
                    <tr
                      key={i}
                      className="rp-tr"
                      style={i % 2 === 0 ? s.trEven : s.trOdd}
                    >
                      <td style={{ ...s.td, fontWeight: 600 }}>
                        {m.users?.name ?? "—"}
                      </td>
                      <td style={s.td}>{m.skill_name}</td>
                      <td style={s.td}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            fontSize: "0.88rem",
                          }}
                        >
                          {subjectMeta[m.subject]?.icon} {m.subject}
                        </span>
                      </td>
                      <td style={s.td}>{m.difficulty_level}</td>
                      <td style={s.td}>
                        <span
                          style={{
                            ...s.pill,
                            background: mm.bg,
                            color: mm.color,
                            border: `1px solid ${mm.border}`,
                          }}
                        >
                          {mm.icon} {m.mastery_level}
                        </span>
                      </td>
                      <td style={{ ...s.td, textAlign: "center" as const }}>
                        <span
                          style={{
                            fontWeight: m.regression_count >= 2 ? 700 : 400,
                            color:
                              m.regression_count >= 2 ? "#8b1a1a" : "#6b7280",
                            background:
                              m.regression_count >= 2
                                ? "#fff0f0"
                                : "transparent",
                            padding: m.regression_count >= 2 ? "2px 10px" : "0",
                            borderRadius: "5px",
                            fontSize: "0.9rem",
                          }}
                        >
                          {m.regression_count}
                          {m.regression_count >= 2 ? " ⚠️" : ""}
                        </span>
                      </td>
                      <td
                        style={{
                          ...s.td,
                          fontSize: "0.88rem",
                          color: "#6b7280",
                        }}
                      >
                        {new Date(m.updated_at).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: "2.5rem",
    maxWidth: "1100px",
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
  btnPrint: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "#0d3d20",
    color: "#ffd166",
    border: "none",
    borderRadius: "9px",
    padding: "0.75rem 1.5rem",
    fontWeight: 700,
    fontSize: "0.95rem",
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 2px 8px rgba(13,61,32,0.18)",
    transition: "background 0.15s, transform 0.15s",
  },
  summaryCard: {
    background: "#fff",
    border: "1.5px solid rgba(26,122,64,0.13)",
    borderRadius: "18px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
    boxShadow: "0 2px 10px rgba(13,61,32,0.04)",
  },
  barLabel: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.75rem",
  },
  bar: {
    height: "32px",
    borderRadius: "10px",
    background: "#e5e7eb",
    display: "flex",
    overflow: "hidden",
    marginBottom: "0.75rem",
  },
  barSeg: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#fff",
    minWidth: "36px",
  },
  barLegend: {
    display: "flex",
    gap: "1.25rem",
    fontSize: "0.88rem",
    flexWrap: "wrap" as const,
    fontWeight: 500,
    color: "#1a1f16",
  },
  legendItem: { display: "flex", alignItems: "center", gap: "0.4rem" },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    flexShrink: 0,
    display: "inline-block",
  },
  subjectGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
    gap: "1rem",
    marginBottom: "1.75rem",
  },
  subjectCard: {
    background: "#fff",
    border: "1.5px solid rgba(26,122,64,0.13)",
    borderRadius: "18px",
    padding: "1.35rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    cursor: "default",
  },
  subjectHead: { display: "flex", alignItems: "center", gap: "0.5rem" },
  subjectIcon: { fontSize: "1.3rem" },
  subjectName: { fontWeight: 700, fontSize: "1rem", color: "#0d3d20" },
  subjectRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.88rem",
    alignItems: "center",
  },
  filterRow: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap" as const,
    alignItems: "flex-end",
    marginBottom: "1rem",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.4rem",
  },
  filterLabel: {
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#6b7280",
  },
  filterBtns: { display: "flex", gap: "0.35rem", flexWrap: "wrap" as const },
  fBtn: {
    background: "#fff",
    border: "1.5px solid rgba(26,122,64,0.15)",
    borderRadius: "8px",
    padding: "0.5rem 1rem",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    color: "#6b7280",
    fontFamily: "inherit",
    transition: "background 0.15s, color 0.15s",
  },
  fBtnActive: {
    background: "#0d3d20",
    color: "#ffd166",
    borderColor: "#0d3d20",
  },
  select: {
    border: "1.5px solid rgba(26,122,64,0.2)",
    borderRadius: "9px",
    padding: "0.6rem 1rem",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    outline: "none",
    color: "#1a1f16",
    background: "#fdfaf5",
    cursor: "pointer",
    transition: "border-color 0.15s",
  },
  search: {
    border: "1.5px solid rgba(26,122,64,0.2)",
    borderRadius: "9px",
    padding: "0.6rem 1rem",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    outline: "none",
    minWidth: "220px",
    color: "#1a1f16",
    background: "#fdfaf5",
    transition: "border-color 0.15s",
  },
  tableWrap: {
    borderRadius: "16px",
    overflow: "hidden",
    border: "1.5px solid rgba(26,122,64,0.13)",
    boxShadow: "0 2px 12px rgba(13,61,32,0.05)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "0.95rem",
  },
  th: {
    textAlign: "left" as const,
    padding: "0.85rem 1.1rem",
    background: "#0d3d20",
    color: "#ffd166",
    fontSize: "0.7rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    fontWeight: 700,
  },
  trEven: { background: "#fff" },
  trOdd: { background: "#fdfaf5" },
  td: {
    padding: "0.85rem 1.1rem",
    borderBottom: "1px solid rgba(26,122,64,0.08)",
    color: "#1a1f16",
    verticalAlign: "middle" as const,
  },
  pill: {
    fontSize: "0.78rem",
    fontWeight: 700,
    padding: "0.28rem 0.7rem",
    borderRadius: "6px",
    display: "inline-block",
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
    animation: "rp-spin 0.8s linear infinite",
  },
};
