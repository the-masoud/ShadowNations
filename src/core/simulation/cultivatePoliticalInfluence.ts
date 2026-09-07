import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { OperationResult } from "../model/operationResult.js";
import type { PoliticalInfluenceCultivatedEvent } from "../model/gameEvent.js";
import { getNationById } from "../model/worldState.js";
import { getNationInfluence } from "../model/nationInfluence.js";
import { setNationInfluence } from "./setNationInfluence.js";
import { spendActionPoints } from "./spendActionPoints.js";
import { validateGameState } from "./validateGameState.js";
import { InvalidPhaseError } from "./resolveTurn.js";
import { SelfTargetPoliticalOperationError, MaximumPoliticalInfluenceError } from "./politicalOperationErrors.js";

export { SelfTargetPoliticalOperationError, MaximumPoliticalInfluenceError } from "./politicalOperationErrors.js";

export const CULTIVATE_POLITICAL_INFLUENCE_AP_COST = 2;
export const POLITICAL_INFLUENCE_GAIN = 10;

export function cultivatePoliticalInfluence(
  state: Readonly<GameState>,
  actorNationId: NationId,
  targetNationId: NationId,
): OperationResult<PoliticalInfluenceCultivatedEvent> {
  getNationById(state.world, actorNationId);
  getNationById(state.world, targetNationId);

  if (actorNationId === targetNationId) {
    throw new SelfTargetPoliticalOperationError(actorNationId);
  }

  const currentInfluence = getNationInfluence(
    state.world,
    actorNationId,
    targetNationId,
  );

  validateGameState(state);

  if (state.phase !== "planning") {
    throw new InvalidPhaseError("planning", state.phase);
  }

  if (currentInfluence.value >= 100) {
    throw new MaximumPoliticalInfluenceError(actorNationId, targetNationId);
  }

  const spentState = spendActionPoints(
    state,
    actorNationId,
    CULTIVATE_POLITICAL_INFLUENCE_AP_COST,
  );

  const newInfluence = Math.min(
    currentInfluence.value + POLITICAL_INFLUENCE_GAIN,
    100,
  );

  const resultingState = setNationInfluence(
    spentState,
    actorNationId,
    targetNationId,
    newInfluence,
  );

  return {
    state: resultingState,
    event: {
      type: "political-influence-cultivated",
      turn: state.turn,
      actorNationId,
      targetNationId,
      previousInfluence: currentInfluence.value,
      newInfluence,
      actionPointCost: CULTIVATE_POLITICAL_INFLUENCE_AP_COST,
    },
  };
}
