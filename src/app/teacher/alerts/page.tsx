"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout";
import {
  supabase,
  getClassesByTeacher,
  getFlaggedStudents,
} from "@/lib/supabase";
import type { MasteryLevel } from "@/types/linuri";

interface AlertRow {
  student_id: string;
  skill_name: string;
  subject: string;
  mastery_level: MasteryLevel;
  difficulty_level: string;
  regression_count: number;
  updated_at: string;
  users: { name: string } | null;
}

type SeverityFilter = "All" | "Critical" | "Warning";

export default function TeacherAlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("All");
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
        const classList = classData ?? [];

        if (classList.length === 0) {
          setLoading(false);
          return;
        }

        const classIds = classList.map((c: { id: string }) => c.id);
        const { data, error: alertError } = await getFlaggedStudents(classIds);
        if (alertError) throw alertError;
        setAlerts((data as unknown as AlertRow[]) ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load alerts.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const filtered = alerts.filter((a) => {
    const matchSeverity =
      severityFilter === "All"
        ? true
        : severityFilter === "Critical"
          ? a.regression_count >= 3
          : a.regression_count === 2;
    const matchSearch =
      search === "" ||
      (a.users?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      a.skill_name.toLowerCase().includes(search.toLowerCase());
    return matchSeverity && matchSearch;
  });

  const criticalCount = alerts.filter((a) => a.regression_count >= 3).length;
  const warningCount = alerts.filter((a) => a.regression_count === 2).length;

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

  const subjectMeta: Record<string, string> = {
    English: "📖",
    Mathematics: "🔢",
    Science: "🔬",
  };

  if (loading)
    return (
      <AppLayout title="Alerts">
        <style>{`@keyframes al-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={s.center}>
          <div style={s.spinner} />
          <p style={s.muted}>Loading alerts…</p>
        </div>
      </AppLayout>
    );

  if (error)
    return (
      <AppLayout title="Alerts">
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
    <AppLayout title="Alerts">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');
        @keyframes al-spin { to { transform: rotate(360deg); } }
        @keyframes al-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .al-tr:hover td { background: #f0f9f4 !important; }
        .al-tab:hover:not(.al-on) { background: #eaf6ef !important; color: #0d3d20 !important; }
        .al-search:focus { border-color: #1a7a40 !important; box-shadow: 0 0 0 3px rgba(26,122,64,0.12); outline: none; }
        .al-content { animation: al-fade 0.25s ease both; }
        .al-chip { transition: box-shadow 0.18s, transform 0.18s; }
        .al-chip:hover { box-shadow: 0 6px 18px rgba(13,61,32,0.10); transform: translateY(-2px); }
      `}</style>

      <div style={s.page}>
        {/* ── Header ── */}
        <div style={s.topRow}>
          <div>
            <div style={s.breadcrumb}>Teacher · Alerts</div>
            <h1 style={s.heading}>Alerts</h1>
            <p style={s.muted}>
              Students flagged for repeated regression (≥2 times)
            </p>
          </div>
        </div>

        {/* ── Stat chips ── */}
        <div style={s.chips}>
          {[
            {
              label: "Critical (≥3)",
              value: criticalCount,
              icon: "🔴",
              bg: "#fff0f0",
              color: "#8b1a1a",
              border: "rgba(155,28,28,0.18)",
            },
            {
              label: "Warning (×2)",
              value: warningCount,
              icon: "🟡",
              bg: "#fffbf0",
              color: "#7a5500",
              border: "rgba(200,130,0,0.20)",
            },
            {
              label: "Total Flagged",
              value: alerts.length,
              icon: "⚠️",
              bg: "#fdfaf5",
              color: "#0d3d20",
              border: "rgba(26,122,64,0.13)",
            },
          ].map((c) => (
            <div
              key={c.label}
              className="al-chip"
              style={{
                ...s.chip,
                background: c.bg,
                border: `1.5px solid ${c.border}`,
              }}
            >
              <span style={s.chipIcon}>{c.icon}</span>
              <span style={{ ...s.chipNum, color: c.color }}>{c.value}</span>
              <span style={s.chipLabel}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* ── All-clear state ── */}
        {alerts.length === 0 ? (
          <div style={s.successBox}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🎉</div>
            <div style={s.successTitle}>No alerts right now!</div>
            <p style={s.successDesc}>
              None of your students have regressed twice or more on any skill.
              Keep it up!
            </p>
          </div>
        ) : (
          <>
            {/* ── Filters ── */}
            <div style={s.filterRow}>
              {(["All", "Critical", "Warning"] as SeverityFilter[]).map((f) => (
                <button
                  key={f}
                  className={`al-tab${severityFilter === f ? " al-on" : ""}`}
                  style={{
                    ...s.fBtn,
                    ...(severityFilter === f
                      ? f === "Critical"
                        ? s.fBtnCritical
                        : f === "Warning"
                          ? s.fBtnWarning
                          : s.fBtnActive
                      : {}),
                  }}
                  onClick={() => setSeverityFilter(f)}
                >
                  {f === "Critical" && "🔴 "}
                  {f === "Warning" && "🟡 "}
                  {f}
                  {f === "Critical" && criticalCount > 0 && (
                    <span style={s.badgeRed}>{criticalCount}</span>
                  )}
                  {f === "Warning" && warningCount > 0 && (
                    <span style={s.badgeGold}>{warningCount}</span>
                  )}
                </button>
              ))}
              <input
                className="al-search"
                style={s.search}
                type="text"
                placeholder="Search student or skill…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <p style={{ ...s.muted, marginBottom: "0.75rem" }}>
              Showing <strong>{filtered.length}</strong> of {alerts.length}{" "}
              flagged record{alerts.length !== 1 ? "s" : ""}
            </p>

            {filtered.length === 0 ? (
              <div style={s.empty}>
                <span style={{ fontSize: "2.5rem" }}>🔍</span>
                <p style={{ margin: 0, fontWeight: 600, color: "#0d3d20" }}>
                  No records match your filters.
                </p>
              </div>
            ) : (
              <div className="al-content" style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {[
                        "Severity",
                        "Student",
                        "Skill",
                        "Subject",
                        "Mastery",
                        "Difficulty",
                        "Regressions",
                        "Last Updated",
                      ].map((h) => (
                        <th key={h} style={s.th}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a, i) => {
                      const isCritical = a.regression_count >= 3;
                      const mm =
                        masteryMeta[a.mastery_level] ??
                        masteryMeta["Needs Help"];
                      return (
                        <tr
                          key={i}
                          className="al-tr"
                          style={i % 2 === 0 ? s.trEven : s.trOdd}
                        >
                          <td style={s.td}>
                            <span
                              style={
                                isCritical ? s.pillCritical : s.pillWarning
                              }
                            >
                              {isCritical ? "🔴 Critical" : "🟡 Warning"}
                            </span>
                          </td>
                          <td style={{ ...s.td, fontWeight: 600 }}>
                            <div style={s.avatarRow}>
                              <div
                                style={{
                                  ...s.avatarDot,
                                  background: isCritical
                                    ? "#fff0f0"
                                    : "#fffbf0",
                                  color: isCritical ? "#8b1a1a" : "#7a5500",
                                }}
                              >
                                {(a.users?.name ?? "?").charAt(0).toUpperCase()}
                              </div>
                              {a.users?.name ?? "—"}
                            </div>
                          </td>
                          <td style={s.td}>{a.skill_name}</td>
                          <td style={s.td}>
                            <span style={{ fontSize: "0.9rem" }}>
                              {subjectMeta[a.subject] ?? ""} {a.subject}
                            </span>
                          </td>
                          <td style={s.td}>
                            <span
                              style={{
                                ...s.pill,
                                background: mm.bg,
                                color: mm.color,
                                border: `1px solid ${mm.border}`,
                              }}
                            >
                              {mm.icon} {a.mastery_level}
                            </span>
                          </td>
                          <td style={s.td}>{a.difficulty_level}</td>
                          <td style={{ ...s.td, textAlign: "center" as const }}>
                            <span
                              style={{
                                fontWeight: 700,
                                color: isCritical ? "#8b1a1a" : "#7a5500",
                                background: isCritical ? "#fff0f0" : "#fffbf0",
                                padding: "3px 12px",
                                borderRadius: "6px",
                                fontSize: "0.9rem",
                              }}
                            >
                              {a.regression_count} {isCritical ? "🔴" : "🟡"}
                            </span>
                          </td>
                          <td
                            style={{
                              ...s.td,
                              fontSize: "0.88rem",
                              color: "#6b7280",
                            }}
                          >
                            {new Date(a.updated_at).toLocaleDateString(
                              "en-PH",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
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
  topRow: { marginBottom: "2rem" },
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
  chips: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap" as const,
    marginBottom: "2rem",
  },
  chip: {
    borderRadius: "18px",
    padding: "1.2rem 1.35rem",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "0.2rem",
    minWidth: "130px",
    cursor: "default",
  },
  chipIcon: { fontSize: "1.5rem", lineHeight: 1 },
  chipNum: {
    fontSize: "1.9rem",
    fontWeight: 800,
    lineHeight: 1,
    marginTop: "0.15rem",
  },
  chipLabel: {
    fontSize: "0.66rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#6b7280",
    marginTop: "0.15rem",
    textAlign: "center" as const,
  },
  successBox: {
    background: "#eaf6ef",
    border: "1.5px solid rgba(26,122,64,0.25)",
    borderRadius: "20px",
    padding: "3.5rem 2rem",
    textAlign: "center" as const,
    boxShadow: "0 2px 12px rgba(13,61,32,0.05)",
  },
  successTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "1.6rem",
    color: "#0d3d20",
    marginBottom: "0.5rem",
  },
  successDesc: {
    color: "#6b7280",
    fontSize: "0.97rem",
    maxWidth: "400px",
    margin: "0 auto",
  },
  filterRow: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap" as const,
    alignItems: "center",
    marginBottom: "1rem",
  },
  fBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    background: "#fff",
    border: "1.5px solid rgba(26,122,64,0.15)",
    borderRadius: "9px",
    padding: "0.5rem 1.1rem",
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
  fBtnCritical: {
    background: "#fff0f0",
    color: "#8b1a1a",
    borderColor: "rgba(155,28,28,0.35)",
    fontWeight: 700,
  },
  fBtnWarning: {
    background: "#fffbf0",
    color: "#7a5500",
    borderColor: "rgba(200,130,0,0.35)",
    fontWeight: 700,
  },
  badgeRed: {
    background: "#8b1a1a",
    color: "#fff",
    fontSize: "0.68rem",
    fontWeight: 700,
    padding: "0.1rem 0.48rem",
    borderRadius: "10px",
  },
  badgeGold: {
    background: "#d4a017",
    color: "#fff",
    fontSize: "0.68rem",
    fontWeight: 700,
    padding: "0.1rem 0.48rem",
    borderRadius: "10px",
  },
  search: {
    marginLeft: "auto",
    border: "1.5px solid rgba(26,122,64,0.2)",
    borderRadius: "9px",
    padding: "0.6rem 1.1rem",
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
  avatarRow: { display: "flex", alignItems: "center", gap: "0.6rem" },
  avatarDot: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "0.82rem",
    flexShrink: 0,
  },
  pill: {
    fontSize: "0.78rem",
    fontWeight: 700,
    padding: "0.28rem 0.7rem",
    borderRadius: "6px",
    display: "inline-block",
  },
  pillCritical: {
    fontSize: "0.78rem",
    fontWeight: 700,
    padding: "0.28rem 0.7rem",
    borderRadius: "6px",
    background: "#fff0f0",
    color: "#8b1a1a",
    border: "1px solid rgba(155,28,28,0.18)",
    display: "inline-block",
  },
  pillWarning: {
    fontSize: "0.78rem",
    fontWeight: 700,
    padding: "0.28rem 0.7rem",
    borderRadius: "6px",
    background: "#fffbf0",
    color: "#7a5500",
    border: "1px solid rgba(200,130,0,0.18)",
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
    animation: "al-spin 0.8s linear infinite",
  },
};
