// src/types/features.ts
export interface FeatureFlags {
  // ── ACTIVE ──────────────────────────────
  enableAIGeneration: boolean
  enableAdaptiveQuiz: boolean
  enableMasteryClassifier: boolean
  enableProgressReports: boolean
  enableRegressionAlerts: boolean

  // ── FUTURE (set to false, do not delete) ─
  enableGamification: boolean
  enableLeaderboard: boolean
  enableSocialFeatures: boolean
  enableParentPortal: boolean
  enableAITutor: boolean
  enableRoadmap: boolean
  enableCodePlayground: boolean
  enableCurriculumBuilder: boolean
  enableIEPManager: boolean
  enableAdvancedAnalytics: boolean
  enablePrerequisiteRedirect: boolean
}