import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { OperationResult } from "../model/operationResult.js";
import type { CounterintelligenceSweepEvent } from "../model/gameEvent.js";
import { getNationById } from "../model/worldState.js";
import { getCounterintelligenceAwareness, getNextCounterintelligenceAwarenessLevel } from "../model/counterintelligenceAwareness.js";
import { getIntelligenceNetwork } from "../model/intelligenceState.js";
import { setCounterintelligenceAwareness } from "./setCounterintelligenceAwareness.js";
import { spendActionPoints } from "./spendActionPoints.js";
import { validateGameState } from "./validateGameState.js";
import { InvalidPhaseError } from "./resolveTurn.js";

export const COUNTERINTELLIGENCE_SWEEP_AP_COST = 2;

export class SelfCounterintelligenceSweepError extends Error {
  constructor(nationId: NationId) {
    super(
      `Self-counterintelligence sweep not allowed for nation: "${nationId}"`,
    );
    this.name = "SelfCounterintelligenceSweepError";
  }
}

export function runCounterintelligenceSweep(
  state: Readonly<GameState>,
  defenderNationId: NationId,
  intruderNationId: NationId,
): OperationResult<CounterintelligenceSweepEvent> {
  getNationById(state.world, defenderNationId);
  getNationById(state.world, intruderNationId);

  if (defenderNationId === intruderNationId) {
    throw new SelfCounterintelligenceSweepError(defenderNationId);
  }

  const awareness = getCounterintelligenceAwareness(
    state,
    defenderNationId,
    intruderNationId,
  );

  validateGameState(state);

  if (state.phase !== "planning") {
    throw new InvalidPhaseError("planning", state.phase);
  }

  const spentState = spendActionPoints(
    state,
    defenderNationId,
    COUNTERINTELLIGENCE_SWEEP_AP_COST,
  );

  let foreignPresence = false;

  try {
    const network = getIntelligenceNetwork(spentState, intruderNationId, defenderNationId);
    if (network.level !== "none") {
      foreignPresence = true;
    }
  } catch {
    // network not found or self-pair — check assets instead
  }

  if (!foreignPresence) {
    const hasAssetPresence = spentState.intelligence.assets.some(
      (a) =>
        a.ownerNationId === intruderNationId &&
        a.targetNationId === defenderNationId,
    );
    if (hasAssetPresence) {
      foreignPresence = true;
    }
  }

  const previousAwareness = awareness.level;
  let newAwareness = previousAwareness;

  if (foreignPresence) {
    newAwareness = getNextCounterintelligenceAwarenessLevel(awareness.level);
    const resultingState = setCounterintelligenceAwareness(
      spentState,
      defenderNationId,
      intruderNationId,
      newAwareness,
    );

    return {
      state: resultingState,
      event: {
        type: "counterintelligence-sweep",
        turn: state.turn,
        defenderNationId,
        intruderNationId,
        foreignPresenceDetected: true,
        previousAwareness,
        newAwareness,
        actionPointCost: COUNTERINTELLIGENCE_SWEEP_AP_COST,
      },
    };
  }

  return {
    state: spentState,
    event: {
      type: "counterintelligence-sweep",
      turn: state.turn,
      defenderNationId,
      intruderNationId,
      foreignPresenceDetected: false,
      previousAwareness,
      newAwareness,
      actionPointCost: COUNTERINTELLIGENCE_SWEEP_AP_COST,
    },
  };
}
