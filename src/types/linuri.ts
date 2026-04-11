// src/types/linuri.ts
export type Role = 'admin' | 'teacher' | 'student'

export type Subject = 'English' | 'Mathematics' | 'Science'

export type Difficulty = 'Basic' | 'Standard' | 'Advanced'

export type MasteryLevel = 'Needs Help' | 'Developing' | 'Mastered'


export interface User {
  id: string
  name: string
  email: string
  role: Role
  created_at: string
}

export interface Class {
  id: string
  teacher_id: string
  name: string
  section: string
  join_code: string
  created_at: string
}

export interface Enrollment {
  student_id: string
  class_id: string
  enrolled_at: string
}

export interface Lesson {
  id: string
  created_by: string
  class_id: string
  title: string
  subject: Subject
  skill_name: string
  lesson_text: string
  difficulty_level: Difficulty
  is_published: boolean
  created_at: string
}

export interface Question {
  id: string
  lesson_id: string
  difficulty: Difficulty
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  hint: string
  is_approved: boolean
  created_at: string
}

export interface QuizAttempt {
  id: string
  student_id: string
  lesson_id: string
  question_id: string
  selected_answer: string
  is_correct: boolean
  difficulty_attempted: Difficulty
  attempted_at: string
}

export interface MasteryRecord {
  id: string
  student_id: string
  class_id: string        
  lesson_id: string
  skill_name: string
  subject: Subject
  difficulty_level: Difficulty
  mastery_level: MasteryLevel
  correct_count: number
  total_questions: number
  regression_count: number
  recorded_at: string
  updated_at: string
}

export interface LessonPayload {
  subject: Subject
  skillName: string
  lessonText: string
  classId: string
}
