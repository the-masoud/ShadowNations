import type { NationId } from "./nation.js";
import type { GameState } from "./gameState.js";
import { getNationById } from "./worldState.js";

export type IntelligenceVisibility = "unknown" | "limited" | "known";

export interface NationIntelligenceVisibility {
  readonly observerNationId: NationId;
  readonly targetNationId: NationId;
  readonly visibility: IntelligenceVisibility;
}

export const VALID_VISIBILITY_VALUES: readonly IntelligenceVisibility[] = [
  "unknown",
  "limited",
  "known",
];

export class MissingIntelligenceVisibilityError extends Error {
  constructor(observerNationId: NationId, targetNationId: NationId) {
    super(
      `Missing visibility entry for observer "${observerNationId}" / target "${targetNationId}"`,
    );
    this.name = "MissingIntelligenceVisibilityError";
  }
}

export function getNationVisibility(
  state: Readonly<GameState>,
  observerNationId: NationId,
  targetNationId: NationId,
): IntelligenceVisibility {
  getNationById(state.world, observerNationId);
  getNationById(state.world, targetNationId);

  const entry = state.intelligence.nationVisibility.find(
    (e) =>
      e.observerNationId === observerNationId &&
      e.targetNationId === targetNationId,
  );
  if (!entry) {
    throw new MissingIntelligenceVisibilityError(
      observerNationId,
      targetNationId,
    );
  }
  return entry.visibility;
}

export function getPlayerNationVisibility(
  state: Readonly<GameState>,
  targetNationId: NationId,
): IntelligenceVisibility {
  return getNationVisibility(state, state.playerNationId, targetNationId);
}
