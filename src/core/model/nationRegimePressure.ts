import type { NationId } from "./nation.js";
import type { WorldState } from "./worldState.js";
import { getNationById } from "./worldState.js";

export interface NationRegimePressure {
  readonly sourceNationId: NationId;
  readonly targetNationId: NationId;
  readonly value: number;
}

export class SelfNationRegimePressureError extends Error {
  constructor(nationId: NationId) {
    super(`Self-regime-pressure not allowed for nation: "${nationId}"`);
    this.name = "SelfNationRegimePressureError";
  }
}

export class MissingNationRegimePressureError extends Error {
  constructor(sourceNationId: NationId, targetNationId: NationId) {
    super(
      `Missing regime pressure entry for source "${sourceNationId}" / target "${targetNationId}"`,
    );
    this.name = "MissingNationRegimePressureError";
  }
}

export class NationRegimePressureValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NationRegimePressureValidationError";
  }
}

export class InvalidNationRegimePressureValueError extends Error {
  constructor(sourceNationId: NationId, targetNationId: NationId, value: number) {
    super(
      `Invalid regime pressure value for pair "${sourceNationId}" -> "${targetNationId}": expected integer 0..100, got ${value}`,
    );
    this.name = "InvalidNationRegimePressureValueError";
  }
}

export function getNationRegimePressure(
  world: Readonly<WorldState>,
  sourceNationId: NationId,
  targetNationId: NationId,
): NationRegimePressure {
  getNationById(world, sourceNationId);
  getNationById(world, targetNationId);

  if (sourceNationId === targetNationId) {
    throw new SelfNationRegimePressureError(sourceNationId);
  }

  const entry = world.nationRegimePressure.find(
    (e) =>
      e.sourceNationId === sourceNationId &&
      e.targetNationId === targetNationId,
  );

  if (!entry) {
    throw new MissingNationRegimePressureError(sourceNationId, targetNationId);
  }

  return entry;
}

export function validateNationRegimePressure(
  world: Readonly<WorldState>,
): void {
  const nationIds = new Set<string>();
  for (const nation of world.nations) {
    nationIds.add(nation.id);
  }

  const requiredPairs: Array<{ source: string; target: string }> = [];
  for (const s of world.nations) {
    for (const t of world.nations) {
      if (s.id !== t.id) {
        requiredPairs.push({ source: s.id, target: t.id });
      }
    }
  }

  const seenPairs = new Set<string>();

  for (const entry of world.nationRegimePressure) {
    if (entry.sourceNationId === entry.targetNationId) {
      throw new NationRegimePressureValidationError(
        `Self-regime-pressure pair not allowed: "${entry.sourceNationId}"`,
      );
    }

    if (!nationIds.has(entry.sourceNationId)) {
      throw new NationRegimePressureValidationError(
        `Regime pressure entry references unknown source nation: "${entry.sourceNationId}"`,
      );
    }

    if (!nationIds.has(entry.targetNationId)) {
      throw new NationRegimePressureValidationError(
        `Regime pressure entry references unknown target nation: "${entry.targetNationId}"`,
      );
    }

    const pairKey = `${entry.sourceNationId}|${entry.targetNationId}`;
    if (seenPairs.has(pairKey)) {
      throw new NationRegimePressureValidationError(
        `Duplicate regime pressure entry for pair: "${entry.sourceNationId}" -> "${entry.targetNationId}"`,
      );
    }
    seenPairs.add(pairKey);

    if (!Number.isInteger(entry.value)) {
      throw new NationRegimePressureValidationError(
        `Invalid regime pressure value for pair "${entry.sourceNationId}" -> "${entry.targetNationId}": expected integer, got ${entry.value}`,
      );
    }

    if (entry.value < 0 || entry.value > 100) {
      throw new NationRegimePressureValidationError(
        `Invalid regime pressure value for pair "${entry.sourceNationId}" -> "${entry.targetNationId}": expected 0..100, got ${entry.value}`,
      );
    }
  }

  for (const pair of requiredPairs) {
    const pairKey = `${pair.source}|${pair.target}`;
    if (!seenPairs.has(pairKey)) {
      throw new NationRegimePressureValidationError(
        `Missing regime pressure entry for pair: "${pair.source}" -> "${pair.target}"`,
      );
    }
  }
}

export function createInitialNationRegimePressure(
  nations: readonly { id: NationId }[],
): readonly NationRegimePressure[] {
  const canonical = ["solaris", "dravos", "norvia", "veloria", "karsen", "arkania"];
  const ordered = canonical.filter((id) => nations.some((n) => n.id === id));
  if (ordered.length !== nations.length) {
    throw new NationRegimePressureValidationError(
      "Non-canonical nation set provided to createInitialNationRegimePressure",
    );
  }

  const entries: NationRegimePressure[] = [];
  for (const source of ordered) {
    for (const target of ordered) {
      if (source === target) continue;
      entries.push({
        sourceNationId: source as NationId,
        targetNationId: target as NationId,
        value: 0,
      });
    }
  }
  return entries;
}
