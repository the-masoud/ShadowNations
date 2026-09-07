import type { NationId } from "./nation.js";

export type IntelligenceNetworkLevel =
  | "none"
  | "foothold"
  | "established"
  | "deep";

export interface IntelligenceNetwork {
  readonly observerNationId: NationId;
  readonly targetNationId: NationId;
  readonly level: IntelligenceNetworkLevel;
}

export const VALID_NETWORK_LEVELS: readonly IntelligenceNetworkLevel[] = [
  "none",
  "foothold",
  "established",
  "deep",
];

export const NETWORK_LEVEL_ORDER: readonly IntelligenceNetworkLevel[] = [
  "none",
  "foothold",
  "established",
  "deep",
];

export function getNextIntelligenceNetworkLevel(
  level: IntelligenceNetworkLevel,
): IntelligenceNetworkLevel {
  const idx = NETWORK_LEVEL_ORDER.indexOf(level);
  if (idx < NETWORK_LEVEL_ORDER.length - 1) {
    return NETWORK_LEVEL_ORDER[idx + 1];
  }
  return level;
}
