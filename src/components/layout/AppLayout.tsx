"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

interface AuthUser {
  id: string;
  name: string;
  role: "admin" | "teacher" | "student";
}

export type { AuthUser };
const AuthCtx = createContext<AuthUser | null>(null);
export const useAuthUser = () => useContext(AuthCtx);

type Role = "admin" | "teacher" | "student";

const NAV: Record<Role, { label: string; href: string; icon: string }[]> = {
  teacher: [
    { label: "Dashboard", href: "/teacher", icon: "▦" },
    { label: "Lessons", href: "/teacher/lessons", icon: "📖" },
    { label: "Questions", href: "/teacher/questions", icon: "❓" },
    { label: "Classes", href: "/teacher/classes", icon: "🏫" },
    { label: "Reports", href: "/teacher/reports", icon: "📊" },
    { label: "Alerts", href: "/teacher/alerts", icon: "🔔" },
  ],
  student: [
    { label: "Dashboard", href: "/student", icon: "▦" },
    { label: "Quiz", href: "/student/quiz", icon: "✏️" },
    { label: "Progress", href: "/student/progress", icon: "📈" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: "▦" },
    { label: "Add Teacher", href: "/admin/teacher/new", icon: "➕" },
    { label: "Users", href: "/admin/users", icon: "👥" },
    { label: "Classes", href: "/admin/classes", icon: "🏫" },
    { label: "Reports", href: "/admin/reports", icon: "📊" },
  ],
};

const ROLE_META: Record<Role, { label: string; bg: string; color: string }> = {
  teacher: { label: "Teacher", bg: "rgba(240,165,0,0.22)", color: "#ffd166" },
  student: { label: "Student", bg: "rgba(26,122,64,0.30)", color: "#a8f0c6" },
  admin: { label: "Admin", bg: "rgba(139,26,26,0.30)", color: "#f9b4b4" },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface Notification {
  id: string;
  message: string;
  seen: boolean;
}
interface Props {
  title: string;
  children: React.ReactNode;
}

export default function AppLayout({ title, children }: Props) {
  const pathname = usePathname();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifs] = useState<Notification[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: authData }) => {
      const user = authData.user;
      if (!user) return;
      const { data: userData } = await supabase
        .from("users")
        .select("role, name")
        .eq("id", user.id)
        .single();
      if (userData)
        setAuthUser({
          id: user.id,
          name: userData.name,
          role: userData.role as Role,
        });
    });
  }, []);

  useEffect(() => {
    if (!authUser || authUser.role !== "teacher") return;
    const channel = supabase
      .channel(`alerts-${authUser.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mastery_history" },
        (payload: RealtimePostgresInsertPayload<{ mastery_level: string }>) => {
          if (payload.new.mastery_level === "Needs Help") {
            setNotifs((prev) => [
              {
                id: crypto.randomUUID(),
                message: "A student dropped to Needs Help",
                seen: false,
              },
              ...prev.slice(0, 9),
            ]);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUser]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node))
        setBellOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  const unseen = notifications.filter((n) => !n.seen).length;
  const markAllSeen = () => {
    setNotifs((p) => p.map((n) => ({ ...n, seen: true })));
    setBellOpen(false);
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const links = authUser ? NAV[authUser.role] : [];
  const meta = authUser ? ROLE_META[authUser.role] : null;

  return (
    <AuthCtx.Provider value={authUser}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --g-dark:   #0d3d20;
          --g-mid:    #1a7a40;
          --g-light:  #eaf6ef;
          --gold:     #f0a500;
          --gold-lt:  #ffd166;
          --cream:    #fafaf7;
          --white:    #ffffff;
          --text:     #1a1f16;
          --muted:    #6b7280;
          --border:   rgba(26,122,64,0.12);
          --red-bg:   #fff0f0;
          --red:      #8b1a1a;
          --amber-bg: #fffbf0;
          --amber:    #7a5500;
          --font:     'Inter', sans-serif;
          --serif:    'Lora', serif;
          --sb-w:     240px;
          --hdr-h:    60px;
          --radius:   14px;
        }
        html, body { font-family: var(--font); background: var(--cream); color: var(--text); }

        /* ── Shell ── */
        .ly-shell { display: flex; min-height: 100vh; }

        /* ── Sidebar ── */
        .ly-sb {
          width: var(--sb-w); background: var(--g-dark);
          display: flex; flex-direction: column; flex-shrink: 0;
          position: fixed; top: 0; left: 0; height: 100vh;
          z-index: 50;
          transform: translateX(-100%);
          transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
          will-change: transform;
        }
        .ly-sb::after {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(circle at 20% 80%, rgba(240,165,0,0.06) 0%, transparent 60%);
        }
        .ly-sb.open { transform: translateX(0); }
        @media (min-width: 900px) {
          .ly-sb { transform: translateX(0); position: sticky; top: 0; height: 100vh; }
          .ly-hamburger { display: none !important; }
          .ly-overlay   { display: none !important; }
        }

        /* Sidebar sections */
        .ly-sb-logo {
          padding: 1.5rem 1.35rem 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; gap: 10px; flex-shrink: 0;
        }
        .ly-sb-mark {
          width: 36px; height: 36px; border-radius: 10px;
          background: var(--gold); color: var(--g-dark);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--serif); font-size: 1.1rem; font-weight: 700; flex-shrink: 0;
        }
        .ly-sb-appname { font-size: 1.1rem; font-weight: 700; color: #fff; letter-spacing: 0.01em; font-family: var(--serif); }
        .ly-sb-appsub  { font-size: 0.6rem; color: rgba(255,255,255,0.3); letter-spacing: 0.07em; text-transform: uppercase; margin-top: 2px; }

        .ly-sb-user {
          padding: 1rem 1.35rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; gap: 10px; flex-shrink: 0;
        }
        .ly-sb-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(255,255,255,0.1); border: 1.5px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 700; color: #fff; flex-shrink: 0; letter-spacing: 0.03em;
        }
        .ly-sb-uname { font-size: 0.875rem; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ly-sb-badge {
          display: inline-block; font-size: 0.58rem; font-weight: 700;
          letter-spacing: 0.07em; text-transform: uppercase;
          padding: 2px 8px; border-radius: 20px; margin-top: 3px;
        }

        .ly-sb-nav { flex: 1; padding: 0.5rem 0; overflow-y: auto; }
        .ly-sb-link {
          display: flex; align-items: center; gap: 10px;
          padding: 0.7rem 1.35rem;
          font-size: 0.9rem; font-weight: 500;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          border-left: 3px solid transparent;
          transition: color 0.13s, background 0.13s, border-color 0.13s;
        }
        .ly-sb-link:hover { color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.04); }
        .ly-sb-link.active {
          color: var(--gold-lt); font-weight: 600;
          background: rgba(255,209,102,0.07);
          border-left-color: var(--gold);
        }
        .ly-sb-icon { font-size: 0.95rem; width: 20px; text-align: center; flex-shrink: 0; }

        .ly-sb-footer {
          padding: 1rem 1.35rem;
          border-top: 1px solid rgba(255,255,255,0.06); flex-shrink: 0;
        }
        .ly-signout {
          width: 100%; padding: 0.62rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 9px;
          color: rgba(255,255,255,0.4);
          font-size: 0.85rem; font-weight: 600; font-family: var(--font);
          cursor: pointer; transition: background 0.14s, color 0.14s;
          letter-spacing: 0.01em;
        }
        .ly-signout:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.75); }

        /* ── Overlay ── */
        .ly-overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(0,0,0,0.5); z-index: 49;
          backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
        }
        .ly-overlay.open { display: block; animation: ly-fade 0.2s ease; }
        @keyframes ly-fade { from { opacity: 0; } to { opacity: 1; } }

        /* ── Main column ── */
        .ly-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

        /* ── Header ── */
        .ly-header {
          height: var(--hdr-h);
          background: var(--white);
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 1.25rem; position: sticky; top: 0; z-index: 20;
          gap: 0.75rem; flex-shrink: 0;
          box-shadow: 0 1px 0 var(--border);
        }
        .ly-hdr-left  { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
        .ly-hdr-title {
          font-family: var(--serif); font-size: 1.2rem;
          color: var(--g-dark); font-weight: 600; margin: 0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ly-hdr-right { display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0; }

        .ly-hamburger {
          background: none; border: 1.5px solid var(--border); border-radius: 8px;
          width: 38px; height: 38px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--g-dark); font-size: 1.05rem; flex-shrink: 0;
          transition: background 0.14s;
        }
        .ly-hamburger:hover { background: var(--g-light); }

        .ly-bell-wrap { position: relative; }
        .ly-bell-btn {
          background: none; border: none; cursor: pointer;
          width: 38px; height: 38px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; color: var(--muted);
          transition: background 0.13s; position: relative;
        }
        .ly-bell-btn:hover { background: var(--g-light); }
        .ly-bell-btn.lit { color: var(--gold); }
        .ly-bell-badge {
          position: absolute; top: 5px; right: 5px;
          background: var(--red); color: #fff;
          font-size: 0.5rem; font-weight: 700;
          width: 14px; height: 14px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .ly-notif-drop {
          position: absolute; right: 0; top: calc(100% + 8px);
          width: min(300px, calc(100vw - 2rem));
          background: var(--white); border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: 0 8px 32px rgba(13,61,32,0.13);
          z-index: 100; overflow: hidden;
          animation: ly-fade 0.15s ease;
        }
        .ly-notif-hd {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border);
          display: flex; justify-content: space-between; align-items: center;
        }
        .ly-notif-hd-title { font-size: 0.78rem; font-weight: 700; color: var(--g-dark); }
        .ly-notif-mark { font-size: 0.72rem; color: var(--gold); background: none; border: none; cursor: pointer; font-weight: 700; font-family: var(--font); }
        .ly-notif-mark:hover { text-decoration: underline; }
        .ly-notif-empty { padding: 1.25rem 1rem; font-size: 0.85rem; color: var(--muted); text-align: center; }
        .ly-notif-item { padding: 0.7rem 1rem; font-size: 0.84rem; line-height: 1.45; border-bottom: 1px solid rgba(26,122,64,0.05); }
        .ly-notif-item.unseen { background: var(--amber-bg); color: var(--text); font-weight: 500; }
        .ly-notif-item.seen   { color: var(--muted); }

        .ly-user-pill {
          display: flex; align-items: center; gap: 7px;
          background: var(--cream); border: 1.5px solid var(--border);
          border-radius: 20px; padding: 3px 12px 3px 3px;
        }
        .ly-user-av {
          width: 32px; height: 32px; border-radius: 50%;
          background: var(--g-dark); color: var(--gold-lt);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.7rem; font-weight: 700; flex-shrink: 0;
        }
        .ly-user-name {
          font-size: 0.84rem; font-weight: 600; color: var(--text);
          max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        @media (max-width: 400px) { .ly-user-name { display: none; } }

        /* ── Content ── */
        .ly-content { flex: 1; padding: 1.25rem 1rem; }
        @media (min-width: 640px)  { .ly-content { padding: 1.75rem 1.5rem; } }
        @media (min-width: 900px)  { .ly-content { padding: 2rem 2.5rem; } }
      `}</style>

      <div className="ly-shell">
        <div
          className={`ly-overlay${sidebarOpen ? " open" : ""}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        <aside
          className={`ly-sb${sidebarOpen ? " open" : ""}`}
          aria-label="Navigation"
        >
          <div className="ly-sb-logo">
            <div className="ly-sb-mark">U</div>
            <div>
              <div className="ly-sb-appname">UMCLS</div>
              <div className="ly-sb-appsub">Adaptive Learning</div>
            </div>
          </div>

          {authUser && meta && (
            <div className="ly-sb-user">
              <div className="ly-sb-avatar">{getInitials(authUser.name)}</div>
              <div style={{ minWidth: 0 }}>
                <div className="ly-sb-uname">{authUser.name}</div>
                <span
                  className="ly-sb-badge"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {meta.label}
                </span>
              </div>
            </div>
          )}

          <nav className="ly-sb-nav">
            {links.map(({ label, href, icon }) => {
              const active =
                pathname === href ||
                (href !== "/admin" &&
                  href !== "/teacher" &&
                  href !== "/student" &&
                  pathname.startsWith(href + "/"));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`ly-sb-link${active ? " active" : ""}`}
                  onClick={closeSidebar}
                >
                  <span className="ly-sb-icon">{icon}</span>
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ly-sb-footer">
            <button onClick={handleSignOut} className="ly-signout">
              Sign out
            </button>
          </div>
        </aside>

        <div className="ly-main">
          <header className="ly-header">
            <div className="ly-hdr-left">
              <button
                className="ly-hamburger"
                onClick={() => setSidebarOpen((o) => !o)}
                aria-label="Menu"
                aria-expanded={sidebarOpen}
              >
                ☰
              </button>
              <h1 className="ly-hdr-title">{title}</h1>
            </div>
            <div className="ly-hdr-right">
              {authUser?.role === "teacher" && (
                <div className="ly-bell-wrap" ref={bellRef}>
                  <button
                    className={`ly-bell-btn${unseen > 0 ? " lit" : ""}`}
                    onClick={() => setBellOpen((o) => !o)}
                    aria-label="Notifications"
                  >
                    🔔
                    {unseen > 0 && (
                      <span className="ly-bell-badge">{unseen}</span>
                    )}
                  </button>
                  {bellOpen && (
                    <div className="ly-notif-drop">
                      <div className="ly-notif-hd">
                        <span className="ly-notif-hd-title">Alerts</span>
                        {unseen > 0 && (
                          <button
                            onClick={markAllSeen}
                            className="ly-notif-mark"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <div className="ly-notif-empty">No alerts yet</div>
                      ) : (
                        notifications.slice(0, 8).map((n) => (
                          <div
                            key={n.id}
                            className={`ly-notif-item ${n.seen ? "seen" : "unseen"}`}
                          >
                            {n.message}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
              {authUser && (
                <div className="ly-user-pill">
                  <div className="ly-user-av">{getInitials(authUser.name)}</div>
                  <span className="ly-user-name">{authUser.name}</span>
                </div>
              )}
            </div>
          </header>

          <main className="ly-content">{children}</main>
        </div>
      </div>
    </AuthCtx.Provider>
  );
}
