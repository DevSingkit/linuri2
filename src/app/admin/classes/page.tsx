"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout";
import { supabase } from "@/lib/supabase";
import { CreateClassModal } from "@/components/CreateClassModal";

interface ClassRow {
  id: string;
  name: string;
  section: string;
  join_code: string;
  teacher_id: string;
  created_at: string;
  users: { name: string } | null;
}

export default function AdminClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) {
          router.replace("/login");
          return;
        }
        const { data: cd, error: ce } = await supabase
          .from("classes")
          .select("*, users(name)")
          .order("created_at", { ascending: false });
        if (ce) throw ce;
        setClasses((cd as unknown as ClassRow[]) ?? []);
        const { data: ed, error: ee } = await supabase
          .from("enrollments")
          .select("class_id");
        if (ee) throw ee;
        const m: Record<string, number> = {};
        (ed ?? []).forEach((e: { class_id: string }) => {
          m[e.class_id] = (m[e.class_id] ?? 0) + 1;
        });
        setCounts(m);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function reload() {
    const { data } = await supabase
      .from("classes")
      .select("*, users(name)")
      .order("created_at", { ascending: false });
    setClasses((data as unknown as ClassRow[]) ?? []);
    setShowModal(false);
  }

  const filtered = classes.filter(
    (c) =>
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.users?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      c.join_code.toLowerCase().includes(search.toLowerCase()),
  );

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  if (loading)
    return (
      <AppLayout title="Classes">
        <div style={S.center}>
          <div style={S.spin} />
          <p style={S.muted}>Loading…</p>
        </div>
      </AppLayout>
    );
  if (error)
    return (
      <AppLayout title="Classes">
        <div style={S.center}>
          <div style={S.errCard}>
            <p style={{ color: "#8b1a1a", fontWeight: 600 }}>{error}</p>
          </div>
        </div>
      </AppLayout>
    );

  return (
    <AppLayout title="Classes">
      <style>{`
        @keyframes pg-fade { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);} }
        @keyframes spin    { to{transform:rotate(360deg);} }
        .pg { animation: pg-fade 0.22s ease both; }
        .search-box { width:100%; border:1.5px solid rgba(26,122,64,0.15); border-radius:10px; padding:0.7rem 0.9rem 0.7rem 2.6rem; font-size:0.95rem; font-family:inherit; outline:none; color:#1a1f16; background:#fff; transition:border-color 0.15s,box-shadow 0.15s; box-sizing:border-box; }
        .search-box:focus { border-color:#1a7a40; box-shadow:0 0 0 3px rgba(26,122,64,0.1); }
        .search-box::placeholder { color:#9ca3af; }
        .cls-card { background:#fff; border:1.5px solid rgba(26,122,64,0.13); border-radius:14px; padding:1.35rem 1.5rem; display:flex; flex-direction:column; gap:0.9rem; transition:transform 0.15s,box-shadow 0.15s; }
        .cls-card:hover { transform:translateY(-2px); box-shadow:0 6px 24px rgba(13,61,32,0.09); }
        .copy-btn { font-size:0.75rem; font-weight:700; padding:0.25rem 0.7rem; border:1.5px solid rgba(26,122,64,0.18); border-radius:6px; cursor:pointer; background:#fff; color:#0d3d20; font-family:inherit; transition:all 0.14s; }
        .copy-btn:hover { background:#eaf6ef; }
        .copy-btn.done { background:#0d3d20 !important; color:#ffd166 !important; border-color:#0d3d20 !important; }
      `}</style>

      <div className="pg">
        {/* Header */}
        <div style={S.topRow}>
          <div>
            <div style={S.crumb}>Admin · Class Management</div>
            <h1 style={S.h1}>All Classes</h1>
            <p style={S.muted}>
              {classes.length} class{classes.length !== 1 ? "es" : ""} across
              all teachers
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button style={S.addBtn} onClick={() => setShowModal(true)}>
              + Create Class
            </button>
            <button style={S.printBtn} onClick={() => window.print()}>
              🖨️ Print
            </button>
          </div>
        </div>

        {/* Search */}
        <div
          style={{
            position: "relative",
            marginBottom: "1.5rem",
            maxWidth: "480px",
          }}
        >
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
            placeholder="Search section, teacher, or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <p style={{ ...S.muted, marginBottom: "1rem" }}>
          Showing{" "}
          <strong style={{ color: "#0d3d20" }}>{filtered.length}</strong> of{" "}
          {classes.length} classes
        </p>

        {filtered.length === 0 ? (
          <div style={S.empty}>
            <span style={{ fontSize: "2.5rem" }}>🏫</span>
            <p style={{ fontWeight: 600, color: "#0d3d20" }}>
              No classes found
            </p>
            <p style={S.muted}>Try a different search.</p>
          </div>
        ) : (
          <div style={S.grid}>
            {filtered.map((c) => {
              const n = counts[c.id] ?? 0;
              return (
                <div key={c.id} className="cls-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Lora', serif",
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        color: "#0d3d20",
                        lineHeight: 1.25,
                      }}
                    >
                      {c.name} — {c.section}
                    </div>
                    <span style={S.badge}>
                      {n} student{n !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div style={S.cardField}>
                    <span style={S.cardLabel}>Teacher</span>
                    <span style={S.cardValue}>{c.users?.name ?? "—"}</span>
                  </div>

                  <div style={S.cardField}>
                    <span style={S.cardLabel}>Join Code</span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginTop: "0.25rem",
                      }}
                    >
                      <span style={S.code}>{c.join_code}</span>
                      <button
                        className={`copy-btn${copied === c.join_code ? " done" : ""}`}
                        onClick={() => copyCode(c.join_code)}
                      >
                        {copied === c.join_code ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "0.76rem",
                      color: "#9ca3af",
                      borderTop: "1px solid rgba(26,122,64,0.08)",
                      paddingTop: "0.65rem",
                    }}
                  >
                    Created{" "}
                    {new Date(c.created_at).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <CreateClassModal
          onClose={() => setShowModal(false)}
          onCreated={reload}
        />
      )}
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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1rem",
  },
  badge: {
    background: "#eaf6ef",
    color: "#0d3d20",
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "0.22rem 0.65rem",
    borderRadius: "20px",
    border: "1px solid rgba(26,122,64,0.18)",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  cardField: { display: "flex", flexDirection: "column", gap: "0.15rem" },
  cardLabel: {
    fontSize: "0.65rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#6b7280",
  },
  cardValue: { fontSize: "0.9rem", color: "#1a1f16", fontWeight: 500 },
  code: {
    fontFamily: "monospace",
    letterSpacing: "0.14em",
    fontSize: "0.9rem",
    color: "#0d3d20",
    fontWeight: 700,
    background: "#eaf6ef",
    padding: "0.25rem 0.65rem",
    borderRadius: "6px",
  },
  empty: {
    background: "#fff",
    border: "1.5px solid rgba(26,122,64,0.13)",
    borderRadius: "14px",
    padding: "3rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.75rem",
    color: "#6b7280",
    textAlign: "center",
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
  addBtn: {
    background: "#0d3d20",
    color: "#ffd166",
    border: "none",
    borderRadius: "10px",
    padding: "0.65rem 1.35rem",
    fontWeight: 700,
    fontSize: "0.875rem",
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
};
