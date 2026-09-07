import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { CounterintelligenceAwareness, CounterintelligenceAwarenessLevel } from "../model/counterintelligenceAwareness.js";
import type { IntelligenceState } from "../model/intelligenceState.js";
import { VALID_COUNTERINTELLIGENCE_AWARENESS_LEVELS } from "../model/counterintelligenceAwareness.js";
import { getNationById } from "../model/worldState.js";
import { validateGameState } from "./validateGameState.js";

export class MissingCounterintelligenceAwarenessPairError extends Error {
  constructor(defenderNationId: NationId, intruderNationId: NationId) {
    super(
      `Missing counterintelligence awareness entry for defender "${defenderNationId}" / intruder "${intruderNationId}"`,
    );
    this.name = "MissingCounterintelligenceAwarenessPairError";
  }
}

export class InvalidCounterintelligenceAwarenessLevelError extends Error {
  constructor(level: string) {
    super(
      `Invalid counterintelligence awareness level: expected "unaware", "suspected", or "identified", got "${level}"`,
    );
    this.name = "InvalidCounterintelligenceAwarenessLevelError";
  }
}

export class SelfCounterintelligencePairError extends Error {
  constructor(nationId: NationId) {
    super(
      `Self-counterintelligence pair not allowed for nation "${nationId}"`,
    );
    this.name = "SelfCounterintelligencePairError";
  }
}

export function setCounterintelligenceAwareness(
  state: Readonly<GameState>,
  defenderNationId: NationId,
  intruderNationId: NationId,
  level: CounterintelligenceAwarenessLevel,
): GameState {
  getNationById(state.world, defenderNationId);
  getNationById(state.world, intruderNationId);

  if (defenderNationId === intruderNationId) {
    throw new SelfCounterintelligencePairError(defenderNationId);
  }

  const existing = state.intelligence.counterintelligenceAwareness.find(
    (e) =>
      e.defenderNationId === defenderNationId &&
      e.intruderNationId === intruderNationId,
  );

  if (!existing) {
    throw new MissingCounterintelligenceAwarenessPairError(
      defenderNationId,
      intruderNationId,
    );
  }

  if (
    !(VALID_COUNTERINTELLIGENCE_AWARENESS_LEVELS as readonly string[]).includes(
      level,
    )
  ) {
    throw new InvalidCounterintelligenceAwarenessLevelError(level);
  }

  validateGameState(state);

  if (existing.level === level) {
    return state;
  }

  const newEntry: CounterintelligenceAwareness = {
    ...existing,
    level,
  };

  const newIntelligence: IntelligenceState = {
    ...state.intelligence,
    counterintelligenceAwareness:
      state.intelligence.counterintelligenceAwareness.map((e) =>
        e === existing ? newEntry : e,
      ),
  };

  return {
    ...state,
    intelligence: newIntelligence,
  };
}
