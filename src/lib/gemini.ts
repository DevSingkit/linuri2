// src/lib/gemini.ts
import type { Subject, Difficulty } from '@/types/linuri'

interface GeneratedQuestion {
  difficulty: Difficulty
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  hint: string
}

function buildPrompt(
  subject: Subject,
  skillName: string,
  lessonText: string,
  difficulty: Difficulty
): string {
  const levelGuide: Record<Difficulty, string> = {
    Basic: 'straightforward recall and simple understanding of the lesson. Questions should be direct and easy.',
    Standard: 'application of concepts from the lesson. Questions should require some thinking.',
    Advanced: 'analysis and deeper understanding of the lesson. Questions should be challenging and require critical thinking.',
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
- For each question, write a short hint explaining the correct answer
  in simple, friendly language a 12-year-old can understand (2-3 sentences max).
  The hint should guide the student toward the answer without directly giving it away.
  Start the hint with "Think about..." or "Remember that..." or "Look back at the part where..."
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