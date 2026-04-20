import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Subject } from "@/types/linuri";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function buildPrompt(
  subject: Subject,
  skillName: string,
  lessonText: string,
): string {
  return `
You are a Grade 6 ${subject} teacher in the Philippines creating a quiz.
Lesson Skill: ${skillName}
Lesson Content:
"""
${lessonText}
"""

Generate exactly 15 multiple-choice questions based ONLY on the lesson content above:
- 5 Basic questions — simple recall (facts, definitions, or directly stated ideas)
- 5 Standard questions — understanding and simple application (use the idea in a familiar situation)
- 5 Advanced questions — deeper thinking (compare, explain why, or choose the best answer using clues)

Rules:
- Each question must have exactly 4 answer choices, only one correct
- Use clear, simple language appropriate for Grade 6 filipino students (around age 11–12)
- Base every question strictly on the provided lesson content
- Avoid tricky wording, double negatives, or confusing sentences
- Write a short hint in simple friendly language a 12-year-old filipino can understand (2-3 sentences)
- Make the hints that is related to the answer while not giving the answer. also Use friendly and simple language a 12-year-old can understand. Hints should point students to the relevant idea or strategy (not just repeat the question).
- Do not add explanations or extra text outside the JSON

Respond in this exact JSON format and nothing else:
[
  {
    "difficulty": "Basic",
    "question_text": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_answer": "A",
    "hint": "Think about..."
  }
]

correct_answer must be exactly one of: "A", "B", "C", or "D".
difficulty must be exactly one of: "Basic", "Standard", "Advanced".
Return all 15 questions in a single array.
`.trim();
}

export async function POST(req: Request) {
  try {
    const { subject, skillName, lessonText } = await req.json();
    if (!subject || !skillName || !lessonText) {
      return Response.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const prompt = buildPrompt(subject, skillName, lessonText);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("Gemini returned no JSON array.");
    const clean = match[0];
    const parsed = JSON.parse(clean);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Gemini returned invalid format.");
    }

    const questions = parsed.map(
      (q: {
        difficulty: string;
        question_text: string;
        option_a: string;
        option_b: string;
        option_c: string;
        option_d: string;
        correct_answer: string;
        hint: string;
      }) => ({
        difficulty: q.difficulty,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        hint: q.hint,
      }),
    );

    return Response.json({ questions });
  } catch (err) {
    console.error("Gemini error:", err);
    return Response.json(
      {
        error:
          err instanceof Error ? err.message : "Question generation failed.",
      },
      { status: 500 },
    );
  }
}
