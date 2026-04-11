// src/lib/gemini.ts
import type { GeneratedQuestion, Subject, Difficulty } from '@/types/linuri'

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
- Each question must have exactly 4 answer choices labeled A, B, C, D
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
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct_index": 0,
    "hint": "Think about..."
  }
]
correct_index is 0 for A, 1 for B, 2 for C, 3 for D.
`.trim()
}