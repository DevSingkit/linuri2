// src/app/student/quiz
"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout";
import { supabase, upsertMastery } from "@/lib/supabase";
import { classify } from "@/lib/classifier";
import { next } from "@/lib/adaptiveRouter";
import type { Subject } from "@/types/linuri";

type Difficulty = "Basic" | "Standard" | "Advanced";
type MasteryLevel = "Needs Help" | "Developing" | "Mastered";

interface Question {
  id: string;
  lesson_id: string;
  difficulty: Difficulty;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  hint: string;
}

type AnswerMap = Record<string, string>;
type ResultMap = Record<string, boolean>;
type TimeMap = Record<string, number>;

const TIMER_SECONDS = 60;
const OPTIONS = ["A", "B", "C", "D"] as const;

const DIFF_STYLE: Record<
  Difficulty,
  { bg: string; color: string; border: string; emoji: string; label: string }
> = {
  Basic: {
    bg: "#eaf6ef",
    color: "#0d3d20",
    border: "rgba(26,122,64,0.25)",
    emoji: "🌱",
    label: "Basic",
  },
  Standard: {
    bg: "#fffbf0",
    color: "#7a5500",
    border: "rgba(200,130,0,0.25)",
    emoji: "⚡",
    label: "Standard",
  },
  Advanced: {
    bg: "#fff0f0",
    color: "#8b1a1a",
    border: "rgba(155,28,28,0.2)",
    emoji: "🔥",
    label: "Advanced",
  },
};


const OPTION_COLORS = ["#eef4ff", "#fff0f5", "#f0faf5", "#fffbf0"];
const OPTION_BORDERS = [
  "rgba(26,82,118,0.2)",
  "rgba(155,28,90,0.2)",
  "rgba(13,92,40,0.2)",
  "rgba(200,130,0,0.2)",
];
const OPTION_TEXT = ["#1a3a6b", "#6b0d3a", "#0d3d20", "#6b4400"];

const s = {
  center: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem 1rem",
    gap: "1rem",
  },
  spinner: {
    width: 36,
    height: 36,
    border: "4px solid rgba(26,122,64,0.15)",
    borderTopColor: "#1a7a40",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  muted: { color: "#6b7280", fontSize: "0.9rem", fontWeight: 600 },
  empty: {
    textAlign: "center" as const,
    padding: "3rem 1rem",
    color: "#6b7280",
    fontSize: "0.95rem",
    fontWeight: 600,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
function QuizInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lesson_id") ?? "";
  const difficulty = (searchParams.get("difficulty") ?? "Standard") as Difficulty;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [results, setResults] = useState<ResultMap>({});
  const [questionTimes, setQuestionTimes] = useState<TimeMap>({});
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // FIX 1: initialize to null instead of calling Date.now() during render
  const questionStartRef = useRef<number | null>(null);
  const userId = useRef<string>("");
  

// then change lessonRef type:
  const lessonRef = useRef<{
    skill_name: string;
    subject: Subject;   // ✅ was string
    difficulty_level: string;
    class_id: string;
  } | null>(null);

  // ── Load questions ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!lessonId) {
      setLoading(false);
      return;
    }
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // FIX 3: router is now stable via useCallback pattern and included correctly
      if (!user) {
        router.replace("/login");
        return;
      }
      userId.current = user.id;

      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("lesson_id", lessonId)
        .eq("is_approved", true)
        .eq("difficulty", difficulty)
        .order("created_at");

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const { data: lessonData } = await supabase
        .from("lessons")
        .select("skill_name, subject, difficulty_level, class_id")
        .eq("id", lessonId)
        .single();
      lessonRef.current = lessonData;

      setQuestions(data ?? []);
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);
  // router.replace is stable and safe to omit; adding it causes unnecessary re-runs

  const recordTime = useCallback((questionId: string) => {
    const start = questionStartRef.current ?? Date.now();
    const elapsed = Math.round((Date.now() - start) / 1000);
    setQuestionTimes((prev) => ({ ...prev, [questionId]: elapsed }));
  }, []);

  // FIX 2 + FIX 4: handleTimeUp declared with useCallback BEFORE the timer
  // useEffect so it can be listed as a dependency without hoisting issues
  const handleTimeUp = useCallback(() => {
    setQuestions((qs) => {
      setCurrent((c) => {
        const q = qs[c];
        if (!q) return c;
        setAnswers((prev) => {
          if (prev[q.id] !== undefined) return prev;
          recordTime(q.id);
          setResults((r) => ({ ...r, [q.id]: false }));
          setShowHint(true);
          return { ...prev, [q.id]: "" };
        });
        return c;
      });
      return qs;
    });
  }, [recordTime]);

  // ── Per-question timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || questions.length === 0) return;
    setTimeLeft(TIMER_SECONDS);
    setShowHint(false);
    // FIX 1: set the start time inside the effect, not at render time
    questionStartRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleTimeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
    // FIX 4: handleTimeUp is now stable via useCallback, safe to include
  }, [current, loading, questions.length, handleTimeUp]);

  const handleSelect = useCallback(
    (option: string) => {
      setQuestions((qs) => {
        setCurrent((c) => {
          const q = qs[c];
          if (!q) return c;
          setAnswers((prev) => {
            if (prev[q.id] !== undefined) return prev;
            clearInterval(timerRef.current!);
            recordTime(q.id);
            const correct = q.correct_answer === option;
            setResults((r) => ({ ...r, [q.id]: correct }));
            if (!correct) setShowHint(true);
            return { ...prev, [q.id]: option };
          });
          return c;
        });
        return qs;
      });
    },
    [recordTime],
  );

  // ── Classifier features ───────────────────────────────────────────────────
  const computeFeatures = useCallback(
    async (correctCount: number, timesMap: TimeMap) => {
      const total = questions.length;
      const accuracy = total > 0 ? (correctCount / total) * 100 : 0;
      const timeValues = Object.values(timesMap);
      const avgTime =
        timeValues.length > 0
          ? timeValues.reduce((a, b) => a + b, 0) / timeValues.length
          : TIMER_SECONDS;

      const { data: history } = await supabase
        .from("mastery_history")
        .select("correct_count, total_questions, recorded_at")
        .eq("student_id", userId.current)
        .eq("lesson_id", lessonId)
        .order("recorded_at", { ascending: false })
        .limit(5);

      // Compute trend for the classifier's score_trend field
      let trend: "improving" | "stable" | "declining" = "stable";
      if (history && history.length >= 2) {
        const rates = history.map(
          (h: { correct_count: number; total_questions: number }) =>
            h.correct_count / h.total_questions,
        );
        const recent = rates[0];
        const older = rates[rates.length - 1];
        if (recent - older > 0.1) trend = "improving";
        else if (older - recent > 0.1) trend = "declining";
      }

      const attempts = (history?.length ?? 0) + 1;
      return { accuracy, attempts, avgTime, trend };
    },
    [lessonId, questions.length],
  );

  // ── Submit + persist everything the DB expects ────────────────────────────
  const submitQuiz = useCallback(async () => {
    setSubmitting(true);

    // Snapshot state via functional updaters to avoid stale closure issues
    let snapshotResults: ResultMap = {};
    let snapshotAnswers: AnswerMap = {};
    let snapshotTimes: TimeMap = {};
    let snapshotQuestions: Question[] = [];

    // Read current state values synchronously via refs would be cleaner,
    // but since we already have them from outer scope this is safe at submit time
    snapshotResults = results;
    snapshotAnswers = answers;
    snapshotTimes = questionTimes;
    snapshotQuestions = questions;

    const correctCount = Object.values(snapshotResults).filter(Boolean).length;

    // Insert one row per question into quiz_attempts
    const rows = snapshotQuestions.map((q) => ({
      student_id: userId.current,
      lesson_id: q.lesson_id,
      question_id: q.id,
      selected_answer: snapshotAnswers[q.id] || "A",
      is_correct: snapshotResults[q.id] ?? false,
      difficulty_attempted: q.difficulty,
      time_spent_seconds: snapshotTimes[q.id] ?? TIMER_SECONDS,
    }));

    const { error: attemptErr } = await supabase
      .from("quiz_attempts")
      .insert(rows);
    if (attemptErr) {
      setError(attemptErr.message);
      setSubmitting(false);
      return;
    }

    // Run the rule-based classifier with all four features
    const features = await computeFeatures(correctCount, snapshotTimes);
    const masteryLevel: MasteryLevel = classify({
      accuracy: features.accuracy, // 0–100 accuracy rate
      attempts: features.attempts, // total past attempts + this one
      avgTime: features.avgTime, // average seconds per question
      trend: features.trend, // improving | stable | declining
    });

      const { difficulty: nextDifficulty, incrementRegression } = next(masteryLevel, difficulty);

const { data: existing } = await supabase
  .from("mastery_history")
  .select("regression_count")
  .eq("student_id", userId.current)
  .eq("lesson_id", lessonId)
  .order("recorded_at", { ascending: false })
  .limit(1)
  .single();

const regressionCount = incrementRegression
  ? (existing?.regression_count ?? 0) + 1
  : (existing?.regression_count ?? 0);

const { error: masteryErr } = await upsertMastery({
  student_id: userId.current,
  lesson_id: lessonId,
  class_id: lessonRef.current?.class_id ?? null,
  mastery_level: masteryLevel,
  correct_count: correctCount,
  total_questions: snapshotQuestions.length,
  skill_name: lessonRef.current?.skill_name ?? null,
  subject: (lessonRef.current?.subject ?? null) as Subject | null,  // ✅
  difficulty_level: difficulty,
  avg_time_per_question: features.avgTime,
  score_trend: features.trend,
  regression_count: regressionCount,
  updated_at: new Date().toISOString(),
});

    if (masteryErr) {
      setError(masteryErr.message);
      setSubmitting(false);
      return;
    }

    // FIX 3: router is used here inside a callback, not inside a useEffect
    // so it does not need to be a dependency of any effect
    router.push(
      `/student/quiz/result?lesson_id=${lessonId}` +
        `&correct=${correctCount}&total=${snapshotQuestions.length}` +
        `&difficulty=${difficulty}` +
        `&skill=${encodeURIComponent(lessonRef.current?.skill_name ?? "")}` +
        `&subject=${encodeURIComponent(lessonRef.current?.subject ?? "")}` +
        `&class_id=${lessonRef.current?.class_id ?? ""}` +
        `&mastery=${encodeURIComponent(masteryLevel)}` +
        `&next_difficulty=${nextDifficulty}`,
    );
  }, [
    answers,
    computeFeatures,
    difficulty,
    lessonId,
    questionTimes,
    questions,
    results,
    router,
  ]);

  const handleNext = useCallback(async () => {
    if (current < questions.length - 1) setCurrent((c) => c + 1);
    else await submitQuiz();
  }, [current, questions.length, submitQuiz]);

  // ── Derived render values ─────────────────────────────────────────────────
  const q = questions[current];
  const answered = q ? answers[q.id] !== undefined : false;
  const isLast = current === questions.length - 1;
  const timerPct = (timeLeft / TIMER_SECONDS) * 100;
  const timerColor =
    timeLeft <= 10 ? "#c0392b" : timeLeft <= 20 ? "#f0a500" : "#1a7a40";
  const diffStyle = q ? DIFF_STYLE[q.difficulty] : DIFF_STYLE.Standard;
  const progress =
    questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0;

  // ── Early returns ─────────────────────────────────────────────────────────
  if (loading)
    return (
      <AppLayout title="Quiz">
        <div style={s.center}>
          <div style={s.spinner} />
          <p style={s.muted}>Loading your questions…</p>
        </div>
      </AppLayout>
    );

  if (!lessonId || questions.length === 0)
    return (
      <AppLayout title="Quiz">
        <div style={s.empty}>
          📭 No approved questions found for this lesson.
        </div>
      </AppLayout>
    );

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito:wght@700;800;900&display=swap');
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn   { 0% { transform: scale(0.92); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes correct { 0%,100% { transform: scale(1); } 40% { transform: scale(1.04); } }
        @keyframes shake   { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-5px); } 40%,80% { transform: translateX(5px); } }

        :root {
          --green: #1a7a40; --green-dark: #0d3d20; --green-light: #eaf6ef;
          --gold: #f0a500; --gold-lt: #ffd166; --gold-bg: #fffbf0;
          --white: #ffffff; --text: #1a1f16; --muted: #6b7280;
          --border: rgba(26,122,64,0.13);
          --font: 'Plus Jakarta Sans', sans-serif;
          --fun: 'Nunito', sans-serif;
        }
        .quiz-wrap { max-width: 580px; margin: 0 auto; padding: 1rem 1rem 3rem; }
        .quiz-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; gap: 0.75rem; }
        .quiz-q-counter { font-family: var(--fun); font-size: 0.85rem; font-weight: 800; color: #6b7280; white-space: nowrap; }
        .quiz-diff-badge { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.28rem 0.75rem; border-radius: 20px; white-space: nowrap; }
        .quiz-prog-bg { height: 10px; background: rgba(26,122,64,0.1); border-radius: 6px; margin-bottom: 1.25rem; overflow: hidden; }
        .quiz-prog-fill { height: 100%; border-radius: 6px; background: linear-gradient(90deg, #1a7a40, #2ea86b); transition: width 0.35s ease; }
        .quiz-card { background: #fff; border: 2px solid rgba(26,122,64,0.13); border-radius: 24px; padding: 1.75rem 1.5rem; box-shadow: 0 4px 24px rgba(13,61,32,0.07); animation: popIn 0.3s ease both; }
        .quiz-timer-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.35rem; }
        .quiz-timer-bar-bg { flex: 1; height: 10px; background: rgba(26,122,64,0.1); border-radius: 6px; overflow: hidden; }
        .quiz-timer-fill { height: 100%; border-radius: 6px; transition: width 1s linear, background 0.3s; }
        .quiz-timer-num { font-family: 'Courier New', monospace; font-size: 1rem; font-weight: 900; min-width: 36px; text-align: right; }
        .quiz-q-text { font-family: var(--fun); font-size: clamp(1rem, 3vw, 1.15rem); font-weight: 800; color: #1a1f16; line-height: 1.55; margin-bottom: 1.35rem; }
        .quiz-options { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.25rem; }
        .quiz-opt { display: flex; align-items: flex-start; gap: 0.85rem; padding: 0.9rem 1rem; border-radius: 14px; font-family: var(--fun); font-size: 0.95rem; font-weight: 700; text-align: left; width: 100%; cursor: pointer; border: 2px solid transparent; transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s; line-height: 1.4; }
        .quiz-opt:not(:disabled):hover { transform: translateX(4px); box-shadow: 0 4px 14px rgba(0,0,0,0.08); }
        .quiz-opt:disabled { cursor: default; }
        .quiz-opt-letter { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.82rem; font-weight: 900; flex-shrink: 0; margin-top: 1px; }
        .quiz-opt-correct { animation: correct 0.4s ease; }
        .quiz-opt-wrong   { animation: shake 0.4s ease; }
        .quiz-hint { background: #fffbf0; border: 2px solid rgba(240,165,0,0.3); border-radius: 14px; padding: 0.9rem 1rem; display: flex; gap: 0.75rem; align-items: flex-start; margin-bottom: 1.25rem; animation: fadeUp 0.25s ease; }
        .quiz-hint-icon { font-size: 1.3rem; flex-shrink: 0; }
        .quiz-hint-text { font-size: 0.88rem; color: #6b4400; line-height: 1.55; font-weight: 600; }
        .quiz-next { width: 100%; padding: 0.95rem; background: linear-gradient(135deg, #0d3d20, #1a7a40); color: #fff; border: none; border-radius: 14px; font-family: var(--fun); font-size: 1rem; font-weight: 900; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; animation: fadeUp 0.25s ease; box-shadow: 0 4px 14px rgba(13,61,32,0.25); }
        .quiz-next:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(13,61,32,0.3); }
        .quiz-next:active { transform: translateY(0); }
        .quiz-next:disabled { opacity: 0.65; cursor: not-allowed; box-shadow: none; }
      `}</style>

      <AppLayout title="Quiz">
        <div className="quiz-wrap">
          {error && (
            <div
              style={{
                background: "#fff0f0",
                border: "1.5px solid rgba(139,26,26,0.2)",
                borderRadius: "12px",
                padding: "0.75rem 1rem",
                fontSize: "0.85rem",
                color: "#8b1a1a",
                marginBottom: "1.25rem",
                fontWeight: 600,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <div className="quiz-topbar">
            <span className="quiz-q-counter">
              Question {current + 1} / {questions.length}
            </span>
            <span
              className="quiz-diff-badge"
              style={{
                background: diffStyle.bg,
                color: diffStyle.color,
                border: `1.5px solid ${diffStyle.border}`,
              }}
            >
              {diffStyle.emoji} {diffStyle.label}
            </span>
          </div>

          <div className="quiz-prog-bg">
            <div className="quiz-prog-fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="quiz-card" key={current}>
            <div className="quiz-timer-row">
              <div className="quiz-timer-bar-bg">
                <div
                  className="quiz-timer-fill"
                  style={{ width: `${timerPct}%`, background: timerColor }}
                />
              </div>
              <span className="quiz-timer-num" style={{ color: timerColor }}>
                {timeLeft <= 10 ? "⏰" : ""}
                {timeLeft}s
              </span>
            </div>

            <p className="quiz-q-text">{q?.question_text}</p>

            <div className="quiz-options">
              {OPTIONS.map((opt, idx) => {
                const val = q?.[
                  `option_${opt.toLowerCase()}` as keyof Question
                ] as string;
                const selected = answers[q?.id ?? ""] === opt;
                const correct = q?.correct_answer === opt;
                const revealed = answered;

                let bg = OPTION_COLORS[idx];
                let border = OPTION_BORDERS[idx];
                let color = OPTION_TEXT[idx];
                let letterBg = "rgba(0,0,0,0.07)";
                let extraClass = "";

                if (revealed) {
                  if (correct) {
                    bg = "#eaf6ef";
                    border = "#1a7a40";
                    color = "#0d3d20";
                    letterBg = "#1a7a40";
                    extraClass = "quiz-opt-correct";
                  } else if (selected && !correct) {
                    bg = "#fff0f0";
                    border = "#c0392b";
                    color = "#7a0d0d";
                    letterBg = "#c0392b";
                    extraClass = "quiz-opt-wrong";
                  } else {
                    bg = "#f5f5f5";
                    border = "rgba(0,0,0,0.08)";
                    color = "#9ca3af";
                    letterBg = "rgba(0,0,0,0.05)";
                  }
                }

                return (
                  <button
                    key={opt}
                    className={`quiz-opt ${extraClass}`}
                    onClick={() => handleSelect(opt)}
                    disabled={answered}
                    style={{ background: bg, borderColor: border, color }}
                  >
                    <span
                      className="quiz-opt-letter"
                      style={{
                        background: letterBg,
                        color:
                          revealed && correct
                            ? "#fff"
                            : revealed && selected && !correct
                              ? "#fff"
                              : "inherit",
                      }}
                    >
                      {revealed && correct
                        ? "✓"
                        : revealed && selected && !correct
                          ? "✗"
                          : opt}
                    </span>
                    {val}
                  </button>
                );
              })}
            </div>

            {showHint && q?.hint && (
              <div className="quiz-hint">
                <span className="quiz-hint-icon">💡</span>
                <span className="quiz-hint-text">{q.hint}</span>
              </div>
            )}

            {answered && (
              <button
                className="quiz-next"
                onClick={handleNext}
                disabled={submitting}
              >
                {submitting
                  ? "⏳ Saving…"
                  : isLast
                    ? "🎉 Submit Quiz"
                    : "Next Question →"}
              </button>
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <AppLayout title="Quiz">
          <div
            style={{
              color: "#6b7280",
              fontSize: "0.9rem",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            Loading…
          </div>
        </AppLayout>
      }
    >
      <QuizInner />
    </Suspense>
  );
}
