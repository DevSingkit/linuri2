// src/types/classifier.ts
import type { MasteryLevel, Difficulty } from '@/types/linuri'

export interface PerformanceFeatures {
  accuracyRate: number
  attempts: number
  avgTimePerQuestion: number
  scoreTrend: number
}

export interface ClassifierInput extends PerformanceFeatures {}

export interface ClassifierOutput {
  masteryLevel: MasteryLevel
  confidence: 'rule-based'
}

export interface AdaptiveRouterResult {
  nextSkill: string
  nextDifficulty: Difficulty
  message: string
}

interface Features {
  accuracy: number    // 0–100, percentage of correct answers
  attempts: number    // total attempts on this skill+difficulty
  avgTime: number     // average seconds per question
  trend: 'improving' | 'stable' | 'declining'
}

/**
 * Rule-based Decision Tree classifier.
 * Returns a mastery level based on the four performance features.
 *
 * Thresholds are based on Bloom's 80% mastery criterion.
 * Replace with a trained sklearn model via Python API once real data is collected.
 */
export function classify(f: Features): MasteryLevel {
  if (f.accuracy < 50) return 'Needs Help'
  if (f.accuracy < 65 && f.trend === 'declining') return 'Needs Help'

  if (f.accuracy >= 80 && f.trend !== 'declining') return 'Mastered'
  if (f.accuracy >= 75 && f.attempts >= 3 && f.trend === 'improving') return 'Mastered'

  return 'Developing'
}