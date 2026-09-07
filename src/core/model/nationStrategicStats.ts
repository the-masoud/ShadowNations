import type { NationId } from "./nation.js";
import type { WorldState } from "./worldState.js";
import { getNationById } from "./worldState.js";

export class MissingNationStrategicStatsError extends Error {
  constructor(nationId: NationId) {
    super(`Missing strategic stats for nation: "${nationId}"`);
    this.name = "MissingNationStrategicStatsError";
  }
}

export class NationStrategicStatsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NationStrategicStatsValidationError";
  }
}

export interface NationStrategicStats {
  readonly nationId: NationId;
  readonly stability: number;
  readonly publicSupport: number;
  readonly internalSecurity: number;
}

export type NationStrategicStatKey =
  | "stability"
  | "publicSupport"
  | "internalSecurity";

export const VALID_STRATEGIC_STAT_KEYS: readonly NationStrategicStatKey[] = [
  "stability",
  "publicSupport",
  "internalSecurity",
];

export function getNationStrategicStats(
  world: Readonly<WorldState>,
  nationId: NationId,
): NationStrategicStats {
  getNationById(world, nationId);

  const entry = world.nationStrategicStats.find(
    (s) => s.nationId === nationId,
  );
  if (!entry) {
    throw new MissingNationStrategicStatsError(nationId);
  }
  return entry;
}

export function validateNationStrategicStats(
  world: Readonly<WorldState>,
): void {
  const nationIds = new Set<string>();

  for (const nation of world.nations) {
    nationIds.add(nation.id);
  }

  const seenNationIds = new Set<string>();

  for (const entry of world.nationStrategicStats) {
    if (!nationIds.has(entry.nationId)) {
      throw new NationStrategicStatsValidationError(
        `Strategic stats entry references unknown nation: "${entry.nationId}"`,
      );
    }

    if (seenNationIds.has(entry.nationId)) {
      throw new NationStrategicStatsValidationError(
        `Duplicate strategic stats entry for nation: "${entry.nationId}"`,
      );
    }
    seenNationIds.add(entry.nationId);

    for (const key of VALID_STRATEGIC_STAT_KEYS) {
      const value = entry[key];
      if (!Number.isInteger(value)) {
        throw new NationStrategicStatsValidationError(
          `Invalid ${key} for nation "${entry.nationId}": expected integer, got ${value}`,
        );
      }
      if (value < 0 || value > 100) {
        throw new NationStrategicStatsValidationError(
          `Invalid ${key} for nation "${entry.nationId}": expected 0..100, got ${value}`,
        );
      }
    }
  }

  for (const nation of world.nations) {
    if (!seenNationIds.has(nation.id)) {
      throw new NationStrategicStatsValidationError(
        `Missing strategic stats entry for nation: "${nation.id}"`,
      );
    }
  }
}

const CANONICAL_INITIAL_STATS: Record<NationId, { stability: number; publicSupport: number; internalSecurity: number }> = {
  solaris: { stability: 72, publicSupport: 68, internalSecurity: 66 },
  dravos: { stability: 78, publicSupport: 55, internalSecurity: 82 },
  norvia: { stability: 58, publicSupport: 74, internalSecurity: 52 },
  veloria: { stability: 70, publicSupport: 69, internalSecurity: 60 },
  karsen: { stability: 64, publicSupport: 57, internalSecurity: 76 },
  arkania: { stability: 61, publicSupport: 62, internalSecurity: 58 },
};

export function createInitialNationStrategicStats(
  nations: readonly { id: NationId }[],
): readonly NationStrategicStats[] {
  const stats: NationStrategicStats[] = [];
  for (const nation of nations) {
    const canonical = CANONICAL_INITIAL_STATS[nation.id as NationId];
    if (!canonical) {
      throw new Error(`Unknown canonical nation: "${nation.id}"`);
    }
    stats.push({
      nationId: nation.id,
      stability: canonical.stability,
      publicSupport: canonical.publicSupport,
      internalSecurity: canonical.internalSecurity,
    });
  }
  return stats;
}
