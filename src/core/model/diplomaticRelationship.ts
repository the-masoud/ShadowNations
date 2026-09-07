import type { NationId } from "./nation.js";
import type { WorldState } from "./worldState.js";
import { getNationById } from "./worldState.js";

export type DiplomaticStatus = "friendly" | "neutral" | "hostile";

export const VALID_DIPLOMATIC_STATUSES: readonly DiplomaticStatus[] = [
  "friendly",
  "neutral",
  "hostile",
];

export interface DiplomaticRelationship {
  readonly nationAId: NationId;
  readonly nationBId: NationId;
  readonly status: DiplomaticStatus;
}

export class SelfDiplomaticRelationshipError extends Error {
  constructor(nationId: NationId) {
    super(`Self-diplomatic relationship not allowed for nation: "${nationId}"`);
    this.name = "SelfDiplomaticRelationshipError";
  }
}

export class MissingDiplomaticRelationshipError extends Error {
  constructor(nationAId: NationId, nationBId: NationId) {
    super(
      `Missing diplomatic relationship for pair: "${nationAId}" / "${nationBId}"`,
    );
    this.name = "MissingDiplomaticRelationshipError";
  }
}

export class DiplomaticRelationshipValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiplomaticRelationshipValidationError";
  }
}

export class InvalidDiplomaticStatusError extends Error {
  constructor(status: string) {
    super(
      `Invalid diplomatic status: expected "friendly", "neutral", or "hostile", got "${status}"`,
    );
    this.name = "InvalidDiplomaticStatusError";
  }
}

export function normalizeDiplomaticPair(
  world: Readonly<WorldState>,
  firstNationId: NationId,
  secondNationId: NationId,
): { nationAId: NationId; nationBId: NationId } {
  const firstIndex = world.nations.findIndex((n) => n.id === firstNationId);
  const secondIndex = world.nations.findIndex((n) => n.id === secondNationId);

  if (firstIndex === -1) {
    throw new Error(`Unknown nation: "${firstNationId}"`);
  }
  if (secondIndex === -1) {
    throw new Error(`Unknown nation: "${secondNationId}"`);
  }

  if (firstIndex <= secondIndex) {
    return { nationAId: firstNationId, nationBId: secondNationId };
  }
  return { nationAId: secondNationId, nationBId: firstNationId };
}

export function getDiplomaticRelationship(
  world: Readonly<WorldState>,
  firstNationId: NationId,
  secondNationId: NationId,
): DiplomaticRelationship {
  getNationById(world, firstNationId);
  getNationById(world, secondNationId);

  if (firstNationId === secondNationId) {
    throw new SelfDiplomaticRelationshipError(firstNationId);
  }

  const { nationAId, nationBId } = normalizeDiplomaticPair(
    world,
    firstNationId,
    secondNationId,
  );

  const entry = world.diplomaticRelationships.find(
    (e) => e.nationAId === nationAId && e.nationBId === nationBId,
  );

  if (!entry) {
    throw new MissingDiplomaticRelationshipError(nationAId, nationBId);
  }

  return entry;
}

const CANONICAL_INITIAL_DIPLOMACY: Record<string, Record<string, DiplomaticStatus>> = {
  solaris: { dravos: "hostile", norvia: "friendly", veloria: "friendly", karsen: "neutral", arkania: "neutral" },
  dravos: { norvia: "hostile", veloria: "neutral", karsen: "friendly", arkania: "friendly" },
  norvia: { veloria: "friendly", karsen: "hostile", arkania: "neutral" },
  veloria: { karsen: "neutral", arkania: "friendly" },
  karsen: { arkania: "friendly" },
};

function getCanonicalNationOrder(nations: readonly { id: NationId }[]): string[] {
  const canonical = ["solaris", "dravos", "norvia", "veloria", "karsen", "arkania"];
  return canonical.filter((id) => nations.some((n) => n.id === id));
}

export function createInitialDiplomaticRelationships(
  nations: readonly { id: NationId }[],
): readonly DiplomaticRelationship[] {
  const ordered = getCanonicalNationOrder(nations);
  if (ordered.length !== nations.length) {
    throw new Error("Non-canonical nation set provided");
  }

  const relationships: DiplomaticRelationship[] = [];

  for (let i = 0; i < ordered.length; i++) {
    for (let j = i + 1; j < ordered.length; j++) {
      const nationAId = ordered[i] as NationId;
      const nationBId = ordered[j] as NationId;

      const targets = CANONICAL_INITIAL_DIPLOMACY[nationAId];
      if (!targets) {
        throw new Error(`Unknown canonical nation: "${nationAId}"`);
      }
      const status = targets[nationBId];
      if (status === undefined) {
        throw new Error(
          `Missing canonical diplomacy status for pair "${nationAId}" / "${nationBId}"`,
        );
      }

      relationships.push({ nationAId, nationBId, status });
    }
  }

  return relationships;
}

export function validateDiplomaticRelationships(
  world: Readonly<WorldState>,
): void {
  const nationIds = new Set<string>();
  for (const nation of world.nations) {
    nationIds.add(nation.id);
  }

  const ordered = getCanonicalNationOrder(world.nations);
  const requiredPairs: Array<{ a: string; b: string }> = [];
  for (let i = 0; i < ordered.length; i++) {
    for (let j = i + 1; j < ordered.length; j++) {
      requiredPairs.push({ a: ordered[i], b: ordered[j] });
    }
  }

  const seenPairs = new Set<string>();
  const seenPairsReversed = new Set<string>();

  for (const entry of world.diplomaticRelationships) {
    if (entry.nationAId === entry.nationBId) {
      throw new DiplomaticRelationshipValidationError(
        `Self-diplomatic relationship not allowed: "${entry.nationAId}"`,
      );
    }

    if (!nationIds.has(entry.nationAId)) {
      throw new DiplomaticRelationshipValidationError(
        `Diplomatic relationship references unknown nationA: "${entry.nationAId}"`,
      );
    }

    if (!nationIds.has(entry.nationBId)) {
      throw new DiplomaticRelationshipValidationError(
        `Diplomatic relationship references unknown nationB: "${entry.nationBId}"`,
      );
    }

    const nationAIndex = world.nations.findIndex((n) => n.id === entry.nationAId);
    const nationBIndex = world.nations.findIndex((n) => n.id === entry.nationBId);
    if (nationAIndex > nationBIndex) {
      throw new DiplomaticRelationshipValidationError(
        `Non-canonical pair order: "${entry.nationAId}" / "${entry.nationBId}" (nationA must precede nationB in canonical order)`,
      );
    }

    if (!(VALID_DIPLOMATIC_STATUSES as readonly string[]).includes(entry.status)) {
      throw new DiplomaticRelationshipValidationError(
        `Invalid diplomatic status for pair "${entry.nationAId}" / "${entry.nationBId}": expected "friendly", "neutral", or "hostile", got "${entry.status}"`,
      );
    }

    const pairKey = `${entry.nationAId}|${entry.nationBId}`;
    const reverseKey = `${entry.nationBId}|${entry.nationAId}`;

    if (seenPairs.has(pairKey)) {
      throw new DiplomaticRelationshipValidationError(
        `Duplicate diplomatic relationship for pair: "${entry.nationAId}" / "${entry.nationBId}"`,
      );
    }
    seenPairs.add(pairKey);

    if (seenPairsReversed.has(reverseKey)) {
      throw new DiplomaticRelationshipValidationError(
        `Reversed duplicate diplomatic relationship for pair: "${entry.nationBId}" / "${entry.nationAId}"`,
      );
    }
    seenPairsReversed.add(reverseKey);
  }

  for (const pair of requiredPairs) {
    const pairKey = `${pair.a}|${pair.b}`;
    if (!seenPairs.has(pairKey)) {
      throw new DiplomaticRelationshipValidationError(
        `Missing diplomatic relationship for pair: "${pair.a}" / "${pair.b}"`,
      );
    }
  }
}
