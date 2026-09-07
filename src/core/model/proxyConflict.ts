import type { NationId } from "./nation.js";

export type ProxyConflictId = string;

export type ProxyConflictIntensity = "low" | "medium" | "high";

export interface ProxyConflict {
  readonly id: ProxyConflictId;
  readonly hostNationId: NationId;
  readonly nationAId: NationId;
  readonly nationBId: NationId;
  readonly intensity: ProxyConflictIntensity;
}

export const VALID_PROXY_CONFLICT_INTENSITIES: readonly ProxyConflictIntensity[] = [
  "low",
  "medium",
  "high",
];

export const PROXY_CONFLICT_INTENSITY_ORDER: readonly ProxyConflictIntensity[] = [
  "low",
  "medium",
  "high",
];
