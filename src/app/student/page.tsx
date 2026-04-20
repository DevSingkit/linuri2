"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout";
import { supabase, getMasteryByStudent } from "@/lib/supabase";
import type { MasteryRecord } from "@/types/linuri";

interface EnrolledClass {
  class_id: string;
  classes: { name: string; section: string } | null;
  userData?: { name: string } | null;
}

interface LessonRow {
  id: string;
  title: string;
  subject: string;
  skill_name: string;
  difficulty_level: string;
  file_url?: string;
  classes: { name: string; section: string } | null;
}

const SUBJECT_STYLE: Record<
  string,
  { bg: string; color: string; emoji: string }
> = {
  English: { bg: "#eef4ff", color: "#1a56b0", emoji: "📖" },
  Mathematics: { bg: "#fff0f5", color: "#9b1a5a", emoji: "🔢" },
  Science: { bg: "#eaf6ef", color: "#0d3d20", emoji: "🔬" },
};
const DIFF_STYLE: Record<string, { bg: string; color: string; emoji: string }> =
  {
    Advanced: { bg: "#fff0f0", color: "#8b1a1a", emoji: "🔥" },
    Standard: { bg: "#fffbf0", color: "#7a5500", emoji: "⚡" },
    Basic: { bg: "#eaf6ef", color: "#0d3d20", emoji: "🌱" },
  };
const MASTERY_STYLE: Record<
  string,
  { bg: string; color: string; border: string; emoji: string }
> = {
  Mastered: {
    bg: "#eaf6ef",
    color: "#0d3d20",
    border: "rgba(26,122,64,0.25)",
    emoji: "⭐",
  },
  Developing: {
    bg: "#fffbf0",
    color: "#7a5500",
    border: "rgba(200,130,0,0.25)",
    emoji: "📈",
  },
  "Needs Help": {
    bg: "#fff0f0",
    color: "#8b1a1a",
    border: "rgba(155,28,28,0.2)",
    emoji: "💪",
  },
};

export default function StudentDashboardPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [classes, setClasses] = useState<EnrolledClass[]>([]);
  const [mastery, setMastery] = useState<MasteryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const { data: userData } = await supabase
          .from("users")
          .select("name")
          .eq("id", user.id)
          .single();
        setName(userData?.name ?? "");

        const { data: enrollData } = await supabase
          .from("enrollments")
          .select("class_id, classes(name, section, join_code)")
          .eq("student_id", user.id);
        setClasses((enrollData as unknown as EnrolledClass[]) ?? []);

        const classIds = ((enrollData as unknown as EnrolledClass[]) ?? []).map(
          (e) => e.class_id,
        );
        let lessonRows: LessonRow[] = [];
        if (classIds.length > 0) {
          const { data: lessonData } = await supabase
            .from("lessons")
            .select(
              "id, title, subject, skill_name, difficulty_level, file_url, classes(name, section)",
            )
            .in("class_id", classIds)
            .eq("is_published", true)
            .order("created_at", { ascending: false })
            .limit(6);
          lessonRows = (lessonData as unknown as LessonRow[]) ?? [];
        }
        setLessons(lessonRows);

        const { data: masteryData } = await getMasteryByStudent(user.id);
        setMastery(masteryData ?? []);
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
      <AppLayout title="Dashboard">
        <div style={s.center}>
          <div style={s.spinner} />
          <p style={s.muted}>Loading your adventure…</p>
        </div>
      </AppLayout>
    );

  if (error)
    return (
      <AppLayout title="Dashboard">
        <div style={s.center}>
          <p style={{ color: "#8b1a1a" }}>{error}</p>
        </div>
      </AppLayout>
    );

  const mastered = mastery.filter((m) => m.mastery_level === "Mastered").length;
  const developing = mastery.filter(
    (m) => m.mastery_level === "Developing",
  ).length;
  const needsHelp = mastery.filter(
    (m) => m.mastery_level === "Needs Help",
  ).length;

  const timeOfDay = new Date().getHours();
  const greeting =
    timeOfDay < 12
      ? "Good morning"
      : timeOfDay < 17
        ? "Good afternoon"
        : "Good evening";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700&family=Nunito:wght@700;800;900&display=swap');
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes bounce  { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes wiggle  { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(-8deg); } 75% { transform: rotate(8deg); } }

        :root {
          --green: #1a7a40; --green-dark: #0d3d20; --green-light: #eaf6ef;
          --gold: #f0a500; --gold-lt: #ffd166; --gold-bg: #fffbf0;
          --cream: #fdfaf5; --white: #ffffff; --text: #1a1f16;
          --muted: #6b7280; --border: rgba(26,122,64,0.13);
          --font: 'Plus Jakarta Sans', sans-serif;
          --fun: 'Nunito', sans-serif;
        }

        /* Hero banner */
        .sd-hero {
          background: linear-gradient(135deg, #0d3d20 0%, #1a7a40 60%, #2ea86b 100%);
          border-radius: 24px;
          padding: 2rem 1.75rem;
          margin-bottom: 1.75rem;
          position: relative;
          overflow: hidden;
          animation: fadeUp 0.4s ease both;
        }
        .sd-hero::before {
          content: '';
          position: absolute;
          width: 260px; height: 260px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,209,102,0.13) 0%, transparent 70%);
          top: -80px; right: -60px;
          pointer-events: none;
        }
        .sd-hero::after {
          content: '';
          position: absolute;
          width: 120px; height: 120px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%);
          bottom: -30px; left: 20%;
          pointer-events: none;
        }
        .sd-hero-greeting {
          font-family: var(--fun);
          font-size: clamp(1.55rem, 5vw, 2.1rem);
          font-weight: 900;
          color: #fff;
          line-height: 1.15;
          margin: 0 0 0.35rem;
        }
        .sd-hero-sub {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.65);
          margin: 0 0 1.35rem;
        }
        .sd-hero-emoji {
          font-size: 3rem;
          position: absolute;
          right: 1.5rem;
          top: 1.25rem;
          animation: bounce 2.5s ease-in-out infinite;
          line-height: 1;
        }

        /* Stat cards */
        .sd-stat-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.75rem;
          animation: fadeUp 0.4s ease 0.05s both;
        }
        @media (min-width: 500px) {
          .sd-stat-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .sd-stat-card {
          border-radius: 18px;
          padding: 1.1rem 0.75rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.15rem;
          transition: transform 0.18s, box-shadow 0.18s;
          cursor: default;
        }
        .sd-stat-card:hover { transform: translateY(-4px) scale(1.03); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
        .sd-stat-emoji { font-size: 1.6rem; line-height: 1; margin-bottom: 0.2rem; }
        .sd-stat-num   { font-family: var(--fun); font-size: 2rem; font-weight: 900; line-height: 1; }
        .sd-stat-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #6b7280; text-align: center; }

        /* Quick action buttons */
        .sd-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 2rem;
          animation: fadeUp 0.4s ease 0.1s both;
        }
        .sd-btn-primary {
          flex: 1 1 auto;
          min-width: 140px;
          background: linear-gradient(135deg, #0d3d20, #1a7a40);
          color: #fff;
          border: none;
          border-radius: 14px;
          padding: 0.9rem 1.5rem;
          font-family: var(--fun);
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 14px rgba(13,61,32,0.25);
          text-align: center;
        }
        .sd-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(13,61,32,0.3); }
        .sd-btn-primary:active { transform: translateY(0); }
        .sd-btn-outline {
          flex: 1 1 auto;
          min-width: 140px;
          background: #fff;
          color: var(--green-dark);
          border: 2px solid rgba(26,122,64,0.25);
          border-radius: 14px;
          padding: 0.9rem 1.5rem;
          font-family: var(--fun);
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, transform 0.15s;
          text-align: center;
        }
        .sd-btn-outline:hover { background: var(--green-light); border-color: var(--green); transform: translateY(-2px); }

        /* Section titles */
        .sd-section { margin-bottom: 2.25rem; animation: fadeUp 0.4s ease 0.15s both; }
        .sd-section-head {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1rem;
        }
        .sd-section-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem;
          flex-shrink: 0;
        }
        .sd-section-title {
          font-family: var(--fun);
          font-size: 1.3rem;
          font-weight: 900;
          color: #0d3d20;
          margin: 0;
        }

        /* Lesson cards */
        .sd-lesson-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.85rem;
        }
        @media (min-width: 480px) {
          .sd-lesson-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 760px) {
          .sd-lesson-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .sd-lesson-card {
          background: #fff;
          border: 2px solid rgba(26,122,64,0.12);
          border-radius: 20px;
          padding: 1.1rem 1.15rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
        }
        .sd-lesson-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 28px rgba(13,61,32,0.1);
          border-color: rgba(26,122,64,0.3);
        }
        .sd-lesson-title {
          font-family: var(--fun);
          font-weight: 800;
          font-size: 1rem;
          color: #0d3d20;
          line-height: 1.3;
        }
        .sd-pill {
          font-size: 0.68rem;
          font-weight: 700;
          padding: 0.22rem 0.65rem;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
        }
        .sd-btn-start {
          background: linear-gradient(135deg, #0d3d20, #1a7a40);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 0.65rem 1rem;
          font-family: var(--fun);
          font-size: 0.88rem;
          font-weight: 800;
          cursor: pointer;
          margin-top: 0.25rem;
          transition: transform 0.15s, box-shadow 0.15s;
          width: 100%;
        }
        .sd-btn-start:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(13,61,32,0.25); }
        .sd-btn-start:active { transform: translateY(0); }

        /* Class cards */
        .sd-class-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }
        @media (min-width: 480px) {
          .sd-class-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .sd-class-card {
          background: #fff;
          border: 2px solid rgba(26,122,64,0.12);
          border-radius: 18px;
          padding: 1rem 1.15rem;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          transition: transform 0.15s;
        }
        .sd-class-card:hover { transform: translateY(-2px); }
        .sd-class-name {
          font-family: var(--fun);
          font-weight: 800;
          font-size: 0.97rem;
          color: #0d3d20;
        }
        .sd-class-code {
          font-size: 0.75rem;
          color: #6b7280;
          font-family: monospace;
          letter-spacing: 0.08em;
          background: #fdfaf5;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          align-self: flex-start;
        }

        /* Table */
        .sd-table-wrap { border-radius: 18px; overflow: hidden; border: 2px solid rgba(26,122,64,0.12); }
        .sd-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .sd-th { text-align: left; padding: 0.7rem 1rem; background: #0d3d20; color: #ffd166; font-size: 0.62rem; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700; font-family: var(--fun); }
        .sd-tr-even { background: #fff; }
        .sd-tr-odd  { background: #fdfaf5; }
        .sd-tr:hover td { background: #f0f9f4; }
        .sd-td { padding: 0.72rem 1rem; border-bottom: 1px solid rgba(26,122,64,0.07); color: #1a1f16; vertical-align: middle; }

        /* See-all / empty */
        .sd-see-all {
          background: none; border: none; color: var(--green);
          font-family: var(--fun); font-weight: 800; font-size: 0.9rem;
          cursor: pointer; padding: 0; margin-top: 0.85rem; display: block;
        }
        .sd-see-all:hover { text-decoration: underline; }
        .sd-empty {
          background: #fff; border: 2px dashed rgba(26,122,64,0.2);
          border-radius: 18px; padding: 2rem 1.5rem;
          text-align: center; color: #6b7280;
          font-size: 0.9rem; font-family: var(--fun); font-weight: 700;
        }

        @keyframes sp-spin { to { transform: rotate(360deg); } }
      `}</style>

      <AppLayout title="Dashboard">
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "1rem 1rem 3rem",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {/* Hero Banner */}
          <div className="sd-hero">
            <div className="sd-hero-emoji">🎒</div>
            <p className="sd-hero-greeting">
              {greeting},<br />
              {name || "Learner"}! 👋
            </p>
            <p className="sd-hero-sub">Ready to level up your skills today?</p>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <button
                className="sd-btn-primary"
                onClick={() => router.push("/student/quiz")}
                style={{
                  background: "#f0a500",
                  color: "#0d3d20",
                  flex: "0 0 auto",
                  minWidth: "unset",
                  padding: "0.75rem 1.4rem",
                  fontSize: "0.92rem",
                }}
              >
                🎯 Start a Quiz
              </button>
              <button
                className="sd-btn-outline"
                onClick={() => router.push("/student/progress")}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.25)",
                  flex: "0 0 auto",
                  minWidth: "unset",
                  padding: "0.75rem 1.4rem",
                  fontSize: "0.92rem",
                }}
              >
                📊 My Progress
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="sd-stat-grid">
            {[
              {
                num: mastery.length,
                label: "Skills Tracked",
                emoji: "🧠",
                bg: "#fdfaf5",
                color: "#0d3d20",
                border: "2px solid rgba(26,122,64,0.13)",
              },
              {
                num: mastered,
                label: "Mastered",
                emoji: "⭐",
                bg: "#eaf6ef",
                color: "#0d5c28",
                border: "2px solid rgba(26,122,64,0.22)",
              },
              {
                num: developing,
                label: "Developing",
                emoji: "📈",
                bg: "#fffbf0",
                color: "#7a5500",
                border: "2px solid rgba(200,130,0,0.20)",
              },
              {
                num: needsHelp,
                label: "Needs Help",
                emoji: "💪",
                bg: "#fff0f0",
                color: "#8b1a1a",
                border: "2px solid rgba(155,28,28,0.18)",
              },
            ].map(({ num, label, emoji, bg, color, border }) => (
              <div
                key={label}
                className="sd-stat-card"
                style={{ background: bg, border }}
              >
                <span className="sd-stat-emoji">{emoji}</span>
                <span className="sd-stat-num" style={{ color }}>
                  {num}
                </span>
                <span className="sd-stat-label">{label}</span>
              </div>
            ))}
          </div>

          {/* Available Lessons */}
          <section className="sd-section">
            <div className="sd-section-head">
              <div
                className="sd-section-icon"
                style={{ background: "#eaf6ef" }}
              >
                📚
              </div>
              <h2 className="sd-section-title">Available Lessons</h2>
            </div>
            {lessons.length === 0 ? (
              <div className="sd-empty">
                📭 No lessons published yet. Check back soon!
              </div>
            ) : (
              <div className="sd-lesson-grid">
                {lessons.map((lesson) => {
                  const sub = SUBJECT_STYLE[lesson.subject] ?? {
                    bg: "#f5f5f5",
                    color: "#333",
                    emoji: "📄",
                  };
                  const diff = DIFF_STYLE[lesson.difficulty_level] ?? {
                    bg: "#f5f5f5",
                    color: "#333",
                    emoji: "",
                  };
                  return (
                    <div key={lesson.id} className="sd-lesson-card">
                      <div
                        style={{
                          display: "flex",
                          gap: "0.4rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          className="sd-pill"
                          style={{ background: sub.bg, color: sub.color }}
                        >
                          {sub.emoji} {lesson.subject}
                        </span>
                        <span
                          className="sd-pill"
                          style={{ background: diff.bg, color: diff.color }}
                        >
                          {diff.emoji} {lesson.difficulty_level}
                        </span>
                      </div>
                      <span className="sd-lesson-title">{lesson.title}</span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#6b7280",
                          fontWeight: 600,
                        }}
                      >
                        🎯 {lesson.skill_name}
                      </span>
                      {lesson.file_url && (
                        <a
                          href={lesson.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: "0.75rem",
                            color: "#1a7a40",
                            fontWeight: 700,
                            textDecoration: "none",
                            background: "#eaf6ef",
                            padding: "0.25rem 0.65rem",
                            borderRadius: "8px",
                            alignSelf: "flex-start",
                          }}
                        >
                          📎 Download file
                        </a>
                      )}
                      <button
                        className="sd-btn-start"
                        onClick={() =>
                          router.push(`/student/quiz?lesson_id=${lesson.id}`)
                        }
                      >
                        Start Quiz →
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {lessons.length >= 6 && (
              <button
                className="sd-see-all"
                onClick={() => router.push("/student/lessons")}
              >
                See all lessons →
              </button>
            )}
          </section>

          {/* My Classes */}
          <section className="sd-section">
            <div className="sd-section-head">
              <div
                className="sd-section-icon"
                style={{ background: "#fffbf0" }}
              >
                🏫
              </div>
              <h2 className="sd-section-title">My Classes</h2>
            </div>
            {classes.length === 0 ? (
              <div className="sd-empty">
                🏫 Not enrolled in any class yet. Ask your teacher for a join
                code!
              </div>
            ) : (
              <div className="sd-class-grid">
                {classes.map((c, i) => (
                  <div key={i} className="sd-class-card">
                    <span className="sd-class-name">
                      {c.classes?.name ?? "—"} · {c.classes?.section ?? ""}
                    </span>
                    <span className="sd-class-code">
                      Teacher: {c.userData?.name ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Skills */}
          <section className="sd-section">
            <div className="sd-section-head">
              <div
                className="sd-section-icon"
                style={{ background: "#edf2ff" }}
              >
                🏆
              </div>
              <h2 className="sd-section-title">Recent Skills</h2>
            </div>
            {mastery.length === 0 ? (
              <div className="sd-empty">
                📝 No quiz attempts yet. Start your first quiz to see progress
                here!
              </div>
            ) : (
              <div className="sd-table-wrap">
                <table className="sd-table">
                  <thead>
                    <tr>
                      {["Skill", "Subject", "Difficulty", "Mastery"].map(
                        (h) => (
                          <th key={h} className="sd-th">
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {mastery.slice(0, 5).map((m, i) => {
                      const ms = MASTERY_STYLE[m.mastery_level] ?? {
                        bg: "#f5f5f5",
                        color: "#333",
                        border: "#ccc",
                        emoji: "",
                      };
                      return (
                        <tr
                          key={i}
                          className={`sd-tr ${i % 2 === 0 ? "sd-tr-even" : "sd-tr-odd"}`}
                        >
                          <td
                            className="sd-td"
                            style={{ fontWeight: 600, color: "#0d3d20" }}
                          >
                            {m.skill_name}
                          </td>
                          <td className="sd-td">{m.subject}</td>
                          <td className="sd-td">{m.difficulty_level}</td>
                          <td className="sd-td">
                            <span
                              className="sd-pill"
                              style={{
                                background: ms.bg,
                                color: ms.color,
                                border: `1px solid ${ms.border}`,
                                fontWeight: 700,
                              }}
                            >
                              {ms.emoji} {m.mastery_level}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {mastery.length > 5 && (
              <button
                className="sd-see-all"
                onClick={() => router.push("/student/progress")}
              >
                See all {mastery.length} skills →
              </button>
            )}
          </section>
        </div>
      </AppLayout>
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  muted: {
    color: "#6b7280",
    fontSize: "0.9rem",
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
  },
  empty: {
    background: "#fff",
    border: "2px dashed rgba(26,122,64,0.2)",
    borderRadius: "18px",
    padding: "2.5rem",
    textAlign: "center",
    fontSize: "1rem",
    color: "#6b7280",
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: "1rem",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #eaf6ef",
    borderTop: "4px solid #1a7a40",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};
