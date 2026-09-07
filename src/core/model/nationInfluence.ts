import type { NationId } from "./nation.js";
import type { WorldState } from "./worldState.js";
import { getNationById } from "./worldState.js";

export interface NationInfluence {
  readonly influencerNationId: NationId;
  readonly targetNationId: NationId;
  readonly value: number;
}

export class SelfNationInfluenceError extends Error {
  constructor(nationId: NationId) {
    super(`Self-influence not allowed for nation: "${nationId}"`);
    this.name = "SelfNationInfluenceError";
  }
}

export class MissingNationInfluenceError extends Error {
  constructor(influencerNationId: NationId, targetNationId: NationId) {
    super(
      `Missing influence entry for influencer "${influencerNationId}" / target "${targetNationId}"`,
    );
    this.name = "MissingNationInfluenceError";
  }
}

export class NationInfluenceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NationInfluenceValidationError";
  }
}

export function getNationInfluence(
  world: Readonly<WorldState>,
  influencerNationId: NationId,
  targetNationId: NationId,
): NationInfluence {
  getNationById(world, influencerNationId);
  getNationById(world, targetNationId);

  if (influencerNationId === targetNationId) {
    throw new SelfNationInfluenceError(influencerNationId);
  }

  const entry = world.nationInfluence.find(
    (e) =>
      e.influencerNationId === influencerNationId &&
      e.targetNationId === targetNationId,
  );

  if (!entry) {
    throw new MissingNationInfluenceError(influencerNationId, targetNationId);
  }

  return entry;
}

export function validateNationInfluence(world: Readonly<WorldState>): void {
  const nationIds = new Set<string>();
  for (const nation of world.nations) {
    nationIds.add(nation.id);
  }

  const requiredPairs: Array<{ influencer: string; target: string }> = [];
  for (const d of world.nations) {
    for (const t of world.nations) {
      if (d.id !== t.id) {
        requiredPairs.push({ influencer: d.id, target: t.id });
      }
    }
  }

  const seenPairs = new Set<string>();

  for (const entry of world.nationInfluence) {
    if (entry.influencerNationId === entry.targetNationId) {
      throw new NationInfluenceValidationError(
        `Self-influence pair not allowed: "${entry.influencerNationId}"`,
      );
    }

    if (!nationIds.has(entry.influencerNationId)) {
      throw new NationInfluenceValidationError(
        `Influence entry references unknown influencer nation: "${entry.influencerNationId}"`,
      );
    }

    if (!nationIds.has(entry.targetNationId)) {
      throw new NationInfluenceValidationError(
        `Influence entry references unknown target nation: "${entry.targetNationId}"`,
      );
    }

    const pairKey = `${entry.influencerNationId}|${entry.targetNationId}`;
    if (seenPairs.has(pairKey)) {
      throw new NationInfluenceValidationError(
        `Duplicate influence entry for pair: "${entry.influencerNationId}" -> "${entry.targetNationId}"`,
      );
    }
    seenPairs.add(pairKey);

    if (!Number.isInteger(entry.value)) {
      throw new NationInfluenceValidationError(
        `Invalid influence value for pair "${entry.influencerNationId}" -> "${entry.targetNationId}": expected integer, got ${entry.value}`,
      );
    }

    if (entry.value < 0 || entry.value > 100) {
      throw new NationInfluenceValidationError(
        `Invalid influence value for pair "${entry.influencerNationId}" -> "${entry.targetNationId}": expected 0..100, got ${entry.value}`,
      );
    }
  }

  for (const pair of requiredPairs) {
    const pairKey = `${pair.influencer}|${pair.target}`;
    if (!seenPairs.has(pairKey)) {
      throw new NationInfluenceValidationError(
        `Missing influence entry for pair: "${pair.influencer}" -> "${pair.target}"`,
      );
    }
  }
}

const CANONICAL_INITIAL_INFLUENCE: Record<string, Record<string, number>> = {
  solaris: { dravos: 18, norvia: 42, veloria: 50, karsen: 24, arkania: 28 },
  dravos: { solaris: 22, norvia: 26, veloria: 20, karsen: 46, arkania: 38 },
  norvia: { solaris: 40, dravos: 16, veloria: 44, karsen: 18, arkania: 25 },
  veloria: { solaris: 48, dravos: 24, norvia: 46, karsen: 32, arkania: 34 },
  karsen: { solaris: 20, dravos: 44, norvia: 21, veloria: 30, arkania: 41 },
  arkania: { solaris: 26, dravos: 36, norvia: 28, veloria: 33, karsen: 39 },
};

export function createInitialNationInfluence(
  nations: readonly { id: NationId }[],
): readonly NationInfluence[] {
  const entries: NationInfluence[] = [];
  for (const influencer of nations) {
    const targets = CANONICAL_INITIAL_INFLUENCE[influencer.id];
    if (!targets) {
      throw new Error(`Unknown canonical nation: "${influencer.id}"`);
    }
    for (const target of nations) {
      if (influencer.id === target.id) continue;
      const value = targets[target.id];
      if (value === undefined) {
        throw new Error(
          `Unknown canonical target: "${target.id}" for influencer "${influencer.id}"`,
        );
      }
      entries.push({
        influencerNationId: influencer.id,
        targetNationId: target.id,
        value,
      });
    }
  }
  return entries;
}
