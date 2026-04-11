// API Route: Generate-Questions
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Subject, Difficulty } from '@/types/linuri'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const DIFFICULTIES: Difficulty[] = ['Basic', 'Standard', 'Advanced']

function buildPrompt(
  subject: Subject,
  skillName: string,
  lessonText: string,
  difficulty: Difficulty
): string {
  const levelGuide: Record<Difficulty, string> = {
    Basic:    'straightforward recall and simple understanding. Questions should be direct and easy.',
    Standard: 'application of concepts. Questions should require some thinking.',
    Advanced: 'analysis and deeper understanding. Questions should be challenging.',
  }
  return `
You are a Grade 6 ${subject} teacher in the Philippines creating a quiz.
Lesson Skill: ${skillName}
Difficulty: ${difficulty} — ${levelGuide[difficulty]}
Lesson Content:
"""
${lessonText}
"""
Generate exactly 5 multiple-choice questions at the ${difficulty} difficulty level based ONLY on the lesson content above.
Rules:
- Each question must have exactly 4 answer choices
- Only one answer is correct
- Questions must be appropriate for Grade 6 students
- Do not add explanations or extra text
- Base every question strictly on the provided lesson content
- Write a short hint in simple, friendly language a 12-year-old can understand (2-3 sentences max)
- Start the hint with "Think about..." or "Remember that..." or "Look back at the part where..."
Respond in this exact JSON format and nothing else:
[
  {
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
`.trim()
}

export async function POST(req: Request) {
  try {
    const { subject, skillName, lessonText } = await req.json()

    if (!subject || !skillName || !lessonText) {
      return Response.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
    const allQuestions = []

    for (const difficulty of DIFFICULTIES) {
      const prompt = buildPrompt(subject, skillName, lessonText, difficulty)
      const result = await model.generateContent(prompt)
      const text   = result.response.text()

      // Strip markdown code fences if present
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)

      if (!Array.isArray(parsed)) {
        throw new Error(`Gemini returned invalid format for ${difficulty}`)
      }

      const questions = parsed.map((q: {
        question_text: string
        option_a: string
        option_b: string
        option_c: string
        option_d: string
        correct_answer: string
        hint: string
      }) => ({
        difficulty,
        question_text:  q.question_text,
        option_a:       q.option_a,
        option_b:       q.option_b,
        option_c:       q.option_c,
        option_d:       q.option_d,
        correct_answer: q.correct_answer,
        hint:           q.hint,
      }))

      allQuestions.push(...questions)
    }

    return Response.json({ questions: allQuestions })
  } catch (err) {
    console.error('Gemini error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Question generation failed.' },
      { status: 500 }
    )
  }
}