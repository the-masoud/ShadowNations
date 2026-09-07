import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { IntelligenceVisibility } from "../model/intelligenceVisibility.js";
import type { IntelligenceState } from "../model/intelligenceState.js";
import type { NationIntelligenceVisibility } from "../model/intelligenceVisibility.js";
import {
  VALID_VISIBILITY_VALUES,
} from "../model/intelligenceVisibility.js";
import { getNationById } from "../model/worldState.js";
import { validateGameState } from "./validateGameState.js";

export class MissingIntelligenceVisibilityPairError extends Error {
  constructor(observerNationId: NationId, targetNationId: NationId) {
    super(
      `Missing visibility entry for observer "${observerNationId}" / target "${targetNationId}"`,
    );
    this.name = "MissingIntelligenceVisibilityPairError";
  }
}

export class InvalidVisibilityValueError extends Error {
  constructor(visibility: string) {
    super(
      `Invalid intelligence visibility: expected "unknown", "limited", or "known", got "${visibility}"`,
    );
    this.name = "InvalidVisibilityValueError";
  }
}

export class SelfVisibilityInvariantError extends Error {
  constructor(nationId: NationId) {
    super(
      `Self-visibility invariant violated for nation "${nationId}": must be "known"`,
    );
    this.name = "SelfVisibilityInvariantError";
  }
}

export function setNationVisibility(
  state: Readonly<GameState>,
  observerNationId: NationId,
  targetNationId: NationId,
  visibility: IntelligenceVisibility,
): GameState {
  getNationById(state.world, observerNationId);
  getNationById(state.world, targetNationId);

  const existing = state.intelligence.nationVisibility.find(
    (e) =>
      e.observerNationId === observerNationId &&
      e.targetNationId === targetNationId,
  );
  if (!existing) {
    throw new MissingIntelligenceVisibilityPairError(
      observerNationId,
      targetNationId,
    );
  }

  if (!(VALID_VISIBILITY_VALUES as readonly string[]).includes(visibility)) {
    throw new InvalidVisibilityValueError(visibility);
  }

  validateGameState(state);

  if (observerNationId === targetNationId && visibility !== "known") {
    throw new SelfVisibilityInvariantError(observerNationId);
  }

  if (existing.visibility === visibility) {
    return state;
  }

  const newVisibility: NationIntelligenceVisibility = {
    ...existing,
    visibility,
  };

  const newIntelligence: IntelligenceState = {
    ...state.intelligence,
    nationVisibility: state.intelligence.nationVisibility.map((e) =>
      e === existing ? newVisibility : e,
    ),
  };

  return {
    ...state,
    intelligence: newIntelligence,
  };
}
