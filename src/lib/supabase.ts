// src/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'
import type {
  User, Class, Enrollment, Lesson,
  Question, QuizAttempt, MasteryRecord
} from '@/types/linuri'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// ── AUTH ────────────────────────────────────────────────────────────
export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getSession() {
  return supabase.auth.getSession()
}

// ── USERS ───────────────────────────────────────────────────────────
export async function getUserById(id: string) {
  return supabase.from('users').select('*').eq('id', id).single<User>()
}

export async function getAllTeachers() {
  return supabase.from('users').select('*').eq('role', 'teacher')
}

// ── CLASSES ─────────────────────────────────────────────────────────
export async function getClassesByTeacher(teacherId: string) {
  return supabase.from('classes').select('*').eq('teacher_id', teacherId)
}

export async function getClassByJoinCode(code: string) {
  return supabase.from('classes').select('*').eq('join_code', code).single<Class>()
}

export async function createClass(data: Omit<Class, 'id' | 'created_at'>) {
  return supabase.from('classes').insert(data).select().single<Class>()
}

// ── ENROLLMENTS ─────────────────────────────────────────────────────
export async function enrollStudent(studentId: string, classId: string) {
  return supabase.from('enrollments').insert({
    student_id: studentId,
    class_id: classId,
    enrolled_at: new Date().toISOString(),
  })
}

export async function getStudentsByClass(classId: string) {
  return supabase
    .from('enrollments')
    .select('users(*)')
    .eq('class_id', classId)
}

// ── LESSONS ─────────────────────────────────────────────────────────
export async function createLesson(data: Omit<Lesson, 'id' | 'created_at'>) {
  return supabase.from('lessons').insert(data).select().single<Lesson>()
}

export async function getLessonsByClass(classId: string) {
  return supabase.from('lessons').select('*').eq('class_id', classId)
}

// ── QUESTIONS ───────────────────────────────────────────────────────
export async function saveQuestions(questions: Omit<Question, 'id' | 'created_at'>[]) {
  return supabase.from('questions').insert(questions).select()
}

export async function getQuestionsByLesson(lessonId: string) {
  return supabase.from('questions').select('*').eq('lesson_id', lessonId)
}

export async function approveQuestion(questionId: string) {
  return supabase
    .from('questions')
    .update({ is_approved: true })
    .eq('id', questionId)
}

export async function deleteQuestion(questionId: string) {
  return supabase.from('questions').delete().eq('id', questionId)
}

export async function getApprovedQuestions(lessonId: string, difficulty: string) {
  return supabase
    .from('questions')
    .select('*')
    .eq('lesson_id', lessonId)
    .eq('difficulty', difficulty)
    .eq('is_approved', true)
}

// ── QUIZ ATTEMPTS ───────────────────────────────────────────────────
export async function saveQuizAttempt(data: Omit<QuizAttempt, 'id'>) {
  return supabase.from('quiz_attempts').insert(data).select().single<QuizAttempt>()
}

export async function getAttemptsByStudent(studentId: string) {
  return supabase
    .from('quiz_attempts')
    .select('*')
    .eq('student_id', studentId)
    .order('attempted_at', { ascending: false })
}

// ── MASTERY HISTORY ─────────────────────────────────────────────────
export async function getMasteryByStudent(studentId: string) {
  return supabase
    .from('mastery_history')
    .select('*')
    .eq('student_id', studentId)
}

export async function upsertMastery(data: Omit<MasteryRecord, 'id'>) {
  return supabase
    .from('mastery_history')
    .upsert(data, { onConflict: 'student_id,lesson_id,skill_name' })
    .select()
}

export async function getFlaggedStudents(classIds: string[]) {
  return supabase
    .from('mastery_history')
    .select('*, users(name)')
    .in('class_id', classIds)
    .gte('regression_count', 2)
    .order('regression_count', { ascending: false })
}