// src/lib/adaptiveRouter.ts
import type { Difficulty, MasteryLevel } from '@/types/linuri'

const ORDER: Difficulty[] = ['Basic', 'Standard', 'Advanced']

interface AdaptiveResult {
  difficulty: Difficulty
  incrementRegression: boolean
  message: string
}

/**
 * Decides the student's next difficulty level based on mastery classification.
 *
 * Mastered   → move up one level (stay at Advanced if already there)
 * Developing → stay at the same level
 * Needs Help → move down one level (stay at Basic if already there)
 */
export function next(level: MasteryLevel, current: Difficulty): AdaptiveResult {
  const idx = ORDER.indexOf(current)

  if (level === 'Mastered') {
    const next = ORDER[Math.min(idx + 1, ORDER.length - 1)]
    return {
      difficulty: next,
      incrementRegression: false,
      message: next === current
        ? 'Excellent! You have mastered the Advanced level.'
        : `Great job! Moving up to ${next} level.`,
    }
  }

  if (level === 'Developing') {
    return {
      difficulty: current,
      incrementRegression: false,
      message: `Keep going! Let's practice ${current} level again to build confidence.`,
    }
  }

  // Needs Help → step down
  const prev = ORDER[Math.max(idx - 1, 0)]
  return {
    difficulty: prev,
    incrementRegression: true,
    message: prev === current
      ? `Let's review the Basic level carefully before moving on.`
      : `No worries! Let's go back to ${prev} level and strengthen your foundation.`,
  }
}