import { useFeatureFlags } from "@/contexts/FeatureFlagContext";
import type { FeatureFlags } from "@/types/features";

export function useFeatureAccess(feature: keyof FeatureFlags): boolean {
  const flags = useFeatureFlags();
  return flags[feature];
}
