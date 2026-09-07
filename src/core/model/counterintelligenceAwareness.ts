import type { NationId } from "./nation.js";
import type { GameState } from "./gameState.js";
import { getNationById } from "./worldState.js";

export type CounterintelligenceAwarenessLevel =
  | "unaware"
  | "suspected"
  | "identified";

export const VALID_COUNTERINTELLIGENCE_AWARENESS_LEVELS: readonly CounterintelligenceAwarenessLevel[] = [
  "unaware",
  "suspected",
  "identified",
];

export const COUNTERINTELLIGENCE_AWARENESS_LEVEL_ORDER: readonly CounterintelligenceAwarenessLevel[] = [
  "unaware",
  "suspected",
  "identified",
];

export function getNextCounterintelligenceAwarenessLevel(
  level: CounterintelligenceAwarenessLevel,
): CounterintelligenceAwarenessLevel {
  const idx = COUNTERINTELLIGENCE_AWARENESS_LEVEL_ORDER.indexOf(level);
  if (idx < COUNTERINTELLIGENCE_AWARENESS_LEVEL_ORDER.length - 1) {
    return COUNTERINTELLIGENCE_AWARENESS_LEVEL_ORDER[idx + 1];
  }
  return level;
}

export interface CounterintelligenceAwareness {
  readonly defenderNationId: NationId;
  readonly intruderNationId: NationId;
  readonly level: CounterintelligenceAwarenessLevel;
}

export class SelfCounterintelligenceError extends Error {
  constructor(nationId: NationId) {
    super(
      `Self-counterintelligence pair not allowed for nation: "${nationId}"`,
    );
    this.name = "SelfCounterintelligenceError";
  }
}

export class MissingCounterintelligenceAwarenessError extends Error {
  constructor(defenderNationId: NationId, intruderNationId: NationId) {
    super(
      `Missing counterintelligence awareness for defender "${defenderNationId}" / intruder "${intruderNationId}"`,
    );
    this.name = "MissingCounterintelligenceAwarenessError";
  }
}

export function getCounterintelligenceAwareness(
  state: Readonly<GameState>,
  defenderNationId: NationId,
  intruderNationId: NationId,
): CounterintelligenceAwareness {
  getNationById(state.world, defenderNationId);
  getNationById(state.world, intruderNationId);

  if (defenderNationId === intruderNationId) {
    throw new SelfCounterintelligenceError(defenderNationId);
  }

  const entry = state.intelligence.counterintelligenceAwareness.find(
    (e) =>
      e.defenderNationId === defenderNationId &&
      e.intruderNationId === intruderNationId,
  );

  if (!entry) {
    throw new MissingCounterintelligenceAwarenessError(
      defenderNationId,
      intruderNationId,
    );
  }

  return entry;
}
