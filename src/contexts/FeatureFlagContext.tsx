// src/contexts/FeatureFlagContext.tsx
'use client'

import { createContext, useContext } from 'react'
import type { FeatureFlags } from '@/types/features'

const defaultFlags: FeatureFlags = {
  // ── ACTIVE ──────────────────────────────
  enableAIGeneration: true,
  enableAdaptiveQuiz: true,
  enableMasteryClassifier: true,
  enableProgressReports: true,
  enableRegressionAlerts: true,

  // ── FUTURE (set to false, do not delete) ─
  enableGamification: false,
  enableLeaderboard: false,
  enableSocialFeatures: false,
  enableParentPortal: false,
  enableAITutor: false,
  enableRoadmap: false,
  enableCodePlayground: false,
  enableCurriculumBuilder: false,
  enableIEPManager: false,
  enableAdvancedAnalytics: false,
  enablePrerequisiteRedirect: false,
}

const FeatureFlagContext = createContext<FeatureFlags>(defaultFlags)

export function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
  return (
    <FeatureFlagContext.Provider value={defaultFlags}>
      {children}
    </FeatureFlagContext.Provider>
  )
}

export function useFeatureFlags() {
  return useContext(FeatureFlagContext)
}