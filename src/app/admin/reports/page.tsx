"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout";
import { supabase } from "@/lib/supabase";
import type { MasteryLevel, Subject } from "@/types/linuri";

interface MasteryRow {
  student_id: string;
  skill_name: string;
  subject: Subject;
  mastery_level: MasteryLevel;
  difficulty_level: string;
  regression_count: number;
  updated_at: string;
  users: { name: string } | null;
}
type SF = "All" | Subject;
type MF = "All" | MasteryLevel;

const MS = {
  Mastered: { bg: "#eaf6ef", color: "#0d3d20", border: "rgba(26,122,64,0.18)" },
  Developing: {
    bg: "#fffbf0",
    color: "#7a5500",
    border: "rgba(200,130,0,0.18)",
  },
  "Needs Help": {
    bg: "#fff0f0",
    color: "#8b1a1a",
    border: "rgba(155,28,28,0.14)",
  },
};

export default function AdminReportsPage() {
  const router = useRouter();
  const [mastery, setMastery] = useState<MasteryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sf, setSf] = useState<SF>("All");
  const [mf, setMf] = useState<MF>("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) {
          router.replace("/login");
          return;
        }
        const { data, error: e } = await supabase
          .from("mastery_history")
          .select("*, users(name)")
          .order("updated_at", { ascending: false });
        if (e) throw e;
        setMastery((data as unknown as MasteryRow[]) ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const filtered = mastery.filter(
    (m) =>
      (sf === "All" || m.subject === sf) &&
      (mf === "All" || m.mastery_level === mf) &&
      (search === "" ||
        (m.users?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        m.skill_name.toLowerCase().includes(search.toLowerCase())),
  );

  const total = mastery.length;
  const mastered = mastery.filter((m) => m.mastery_level === "Mastered").length;
  const develop = mastery.filter(
    (m) => m.mastery_level === "Developing",
  ).length;
  const needs = mastery.filter((m) => m.mastery_level === "Needs Help").length;
  const flagged = mastery.filter((m) => m.regression_count >= 2).length;

  if (loading)
    return (
      <AppLayout title="Reports">
        <div style={S.center}>
          <div style={S.spin} />
          <p style={S.muted}>Loading…</p>
        </div>
      </AppLayout>
    );
  if (error)
    return (
      <AppLayout title="Reports">
        <div style={S.center}>
          <div style={S.errCard}>
            <p style={{ color: "#8b1a1a", fontWeight: 600 }}>{error}</p>
          </div>
        </div>
      </AppLayout>
    );

  return (
    <AppLayout title="Reports">
      <style>{`
        @keyframes pg-fade { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);} }
        @keyframes spin    { to{transform:rotate(360deg);} }
        .pg { animation: pg-fade 0.22s ease both; }
        .fbtn { background:#fff; border:1.5px solid rgba(26,122,64,0.15); border-radius:8px; padding:0.48rem 0.9rem; font-size:0.875rem; font-weight:600; cursor:pointer; color:#6b7280; font-family:inherit; transition:all 0.14s; white-space:nowrap; }
        .fbtn:hover { border-color:#1a7a40; color:#0d3d20; background:#eaf6ef; }
        .fbtn.on { background:#0d3d20 !important; color:#ffd166 !important; border-color:#0d3d20 !important; }
        .search-box { width:100%; border:1.5px solid rgba(26,122,64,0.15); border-radius:10px; padding:0.7rem 0.9rem 0.7rem 2.6rem; font-size:0.95rem; font-family:inherit; outline:none; color:#1a1f16; background:#fff; transition:border-color 0.15s,box-shadow 0.15s; box-sizing:border-box; }
        .search-box:focus { border-color:#1a7a40; box-shadow:0 0 0 3px rgba(26,122,64,0.1); }
        .search-box::placeholder { color:#9ca3af; }
        .rpt-tr:hover td { background:#f0f9f4 !important; }
        @media(max-width:640px) { .rpt-tbl { display:none; } .rpt-cards { display:flex; flex-direction:column; gap:0.75rem; } }
        @media(min-width:641px) { .rpt-tbl { display:block; } .rpt-cards { display:none; } }
      `}</style>

      <div className="pg">
        {/* Header */}
        <div style={S.topRow}>
          <div>
            <div style={S.crumb}>Admin · Reports</div>
            <h1 style={S.h1}>School-wide Report</h1>
            <p style={S.muted}>
              Mastery records across all students, subjects, and classes
            </p>
          </div>
          <button style={S.printBtn} onClick={() => window.print()}>
            🖨️ Print / PDF
          </button>
        </div>

        {/* Summary bar */}
        {total > 0 && (
          <div style={S.summaryCard}>
            <div style={S.bar}>
              {mastered > 0 && (
                <div
                  style={{
                    ...S.barSeg,
                    width: `${Math.round((mastered / total) * 100)}%`,
                    background: "linear-gradient(90deg,#1a7a40,#0d5c28)",
                  }}
                >
                  {Math.round((mastered / total) * 100)}%
                </div>
              )}
              {develop > 0 && (
                <div
                  style={{
                    ...S.barSeg,
                    width: `${Math.round((develop / total) * 100)}%`,
                    background: "linear-gradient(90deg,#d4a017,#b07800)",
                  }}
                >
                  {Math.round((develop / total) * 100)}%
                </div>
              )}
              {needs > 0 && (
                <div
                  style={{
                    ...S.barSeg,
                    width: `${Math.round((needs / total) * 100)}%`,
                    background: "linear-gradient(90deg,#c0392b,#8b1a1a)",
                  }}
                >
                  {Math.round((needs / total) * 100)}%
                </div>
              )}
            </div>
            <div style={S.barLegend}>
              <span
                style={{
                  color: "#1a7a40",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                }}
              >
                ● Mastered ({mastered})
              </span>
              <span
                style={{
                  color: "#d4a017",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                }}
              >
                ● Developing ({develop})
              </span>
              <span
                style={{
                  color: "#c0392b",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                }}
              >
                ● Needs Help ({needs})
              </span>
              {flagged > 0 && (
                <span
                  style={{
                    color: "#8b1a1a",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                  }}
                >
                  ⚠ {flagged} flagged
                </span>
              )}
            </div>
          </div>
        )}

        {/* Subject cards */}
        <div style={S.subGrid}>
          {(["English", "Mathematics", "Science"] as Subject[]).map((sub) => {
            const rows = mastery.filter((m) => m.subject === sub);
            const m2 = rows.filter(
              (m) => m.mastery_level === "Mastered",
            ).length;
            const d2 = rows.filter(
              (m) => m.mastery_level === "Developing",
            ).length;
            const n2 = rows.filter(
              (m) => m.mastery_level === "Needs Help",
            ).length;
            const t2 = rows.length || 1;
            const icons: Record<string, string> = {
              English: "📖",
              Mathematics: "🔢",
              Science: "🔬",
            };
            return (
              <div key={sub} style={S.subCard}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "1.15rem" }}>{icons[sub]}</span>
                  <span
                    style={{
                      fontFamily: "'Lora',serif",
                      fontWeight: 700,
                      color: "#0d3d20",
                      fontSize: "0.95rem",
                    }}
                  >
                    {sub}
                  </span>
                </div>
                <div
                  style={{
                    height: "5px",
                    borderRadius: "99px",
                    background: "#e5e7eb",
                    overflow: "hidden",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.round((m2 / t2) * 100)}%`,
                      background: "#1a7a40",
                      borderRadius: "99px",
                    }}
                  />
                </div>
                {[
                  ["⭐ Mastered", m2, "#0d5c28"],
                  ["📈 Developing", d2, "#7a5500"],
                  ["🆘 Needs Help", n2, "#8b1a1a"],
                ].map(([label, val, clr]) => (
                  <div
                    key={label as string}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.82rem",
                      marginBottom: "0.2rem",
                    }}
                  >
                    <span style={{ color: clr as string, fontWeight: 500 }}>
                      {label as string}
                    </span>
                    <strong style={{ color: clr as string }}>
                      {val as number}
                    </strong>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div style={S.filterWrap}>
          <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
            <span
              style={{
                position: "absolute",
                left: "0.85rem",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "1rem",
                pointerEvents: "none",
              }}
            >
              🔍
            </span>
            <input
              className="search-box"
              type="text"
              placeholder="Search student or skill…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={S.filterGroups}>
            <div style={S.filterGroup}>
              <span style={S.filterLabel}>Subject</span>
              <div
                style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}
              >
                {(["All", "English", "Mathematics", "Science"] as SF[]).map(
                  (f) => (
                    <button
                      key={f}
                      className={`fbtn${sf === f ? " on" : ""}`}
                      onClick={() => setSf(f)}
                    >
                      {f}
                    </button>
                  ),
                )}
              </div>
            </div>
            <div style={S.filterGroup}>
              <span style={S.filterLabel}>Mastery</span>
              <div
                style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}
              >
                {(["All", "Mastered", "Developing", "Needs Help"] as MF[]).map(
                  (f) => (
                    <button
                      key={f}
                      className={`fbtn${mf === f ? " on" : ""}`}
                      onClick={() => setMf(f)}
                    >
                      {f}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        <p style={{ ...S.muted, marginBottom: "1rem" }}>
          Showing{" "}
          <strong style={{ color: "#0d3d20" }}>{filtered.length}</strong> of{" "}
          {total} records
        </p>

        {filtered.length === 0 ? (
          <div style={S.empty}>
            <span style={{ fontSize: "2rem" }}>📭</span>
            <p style={{ fontWeight: 600, color: "#0d3d20" }}>
              No records match
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="rpt-tbl" style={S.tableWrap}>
              <table style={S.table}>
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
                      <th key={h} style={S.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => {
                    const ms = MS[m.mastery_level];
                    return (
                      <tr
                        key={i}
                        className="rpt-tr"
                        style={i % 2 === 0 ? S.trEven : S.trOdd}
                      >
                        <td style={{ ...S.td, fontWeight: 600 }}>
                          {m.users?.name ?? "—"}
                        </td>
                        <td style={S.td}>{m.skill_name}</td>
                        <td style={S.td}>{m.subject}</td>
                        <td style={S.td}>{m.difficulty_level}</td>
                        <td style={S.td}>
                          <span
                            style={{
                              ...S.pill,
                              background: ms.bg,
                              color: ms.color,
                              border: `1px solid ${ms.border}`,
                            }}
                          >
                            {m.mastery_level}
                          </span>
                        </td>
                        <td
                          style={{
                            ...S.td,
                            textAlign: "center",
                            color:
                              m.regression_count >= 2 ? "#8b1a1a" : "#6b7280",
                            fontWeight: m.regression_count >= 2 ? 700 : 400,
                          }}
                        >
                          {m.regression_count}
                          {m.regression_count >= 2 ? " ⚠" : ""}
                        </td>
                        <td
                          style={{
                            ...S.td,
                            fontSize: "0.82rem",
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

            {/* Mobile cards */}
            <div className="rpt-cards">
              {filtered.map((m, i) => {
                const ms = MS[m.mastery_level];
                return (
                  <div key={i} style={S.rCard}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "0.5rem",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#0d3d20",
                            fontSize: "0.95rem",
                          }}
                        >
                          {m.users?.name ?? "—"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.82rem",
                            color: "#6b7280",
                            marginTop: "2px",
                          }}
                        >
                          {m.skill_name}
                        </div>
                      </div>
                      <span
                        style={{
                          ...S.pill,
                          background: ms.bg,
                          color: ms.color,
                          border: `1px solid ${ms.border}`,
                          flexShrink: 0,
                        }}
                      >
                        {m.mastery_level}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                        fontSize: "0.8rem",
                        color: "#6b7280",
                        marginTop: "0.25rem",
                      }}
                    >
                      <span>{m.subject}</span>
                      <span>·</span>
                      <span>{m.difficulty_level}</span>
                      {m.regression_count >= 2 && (
                        <span style={{ color: "#8b1a1a", fontWeight: 700 }}>
                          ⚠ {m.regression_count} regressions
                        </span>
                      )}
                      <span style={{ marginLeft: "auto" }}>
                        {new Date(m.updated_at).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
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
    marginBottom: "1.75rem",
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
  muted: { color: "#6b7280", fontSize: "0.9rem" },
  printBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    background: "#0d3d20",
    color: "#ffd166",
    border: "none",
    borderRadius: "10px",
    padding: "0.65rem 1.35rem",
    fontWeight: 700,
    fontSize: "0.875rem",
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 2px 8px rgba(13,61,32,0.18)",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  summaryCard: {
    background: "#fff",
    border: "1.5px solid rgba(26,122,64,0.13)",
    borderRadius: "14px",
    padding: "1.35rem 1.5rem",
    marginBottom: "1.25rem",
  },
  bar: {
    height: "28px",
    borderRadius: "8px",
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
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "#fff",
    minWidth: "28px",
  },
  barLegend: { display: "flex", gap: "1.25rem", flexWrap: "wrap" },
  subGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  subCard: {
    background: "#fff",
    border: "1.5px solid rgba(26,122,64,0.13)",
    borderRadius: "14px",
    padding: "1.1rem 1.25rem",
  },
  filterWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    marginBottom: "1.1rem",
  },
  filterGroups: { display: "flex", gap: "1rem", flexWrap: "wrap" },
  filterGroup: { display: "flex", flexDirection: "column", gap: "0.35rem" },
  filterLabel: {
    fontSize: "0.65rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#6b7280",
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
    minWidth: "640px",
  },
  th: {
    textAlign: "left",
    padding: "0.8rem 1rem",
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
  pill: {
    fontSize: "0.73rem",
    fontWeight: 700,
    padding: "0.25rem 0.65rem",
    borderRadius: "20px",
    whiteSpace: "nowrap",
  },
  rCard: {
    background: "#fff",
    border: "1.5px solid rgba(26,122,64,0.13)",
    borderRadius: "14px",
    padding: "1rem 1.1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  empty: {
    background: "#fff",
    border: "1.5px solid rgba(26,122,64,0.13)",
    borderRadius: "14px",
    padding: "2.5rem",
    color: "#6b7280",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.75rem",
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
    padding: "2rem",
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
