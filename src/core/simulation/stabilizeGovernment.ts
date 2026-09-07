import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { OperationResult } from "../model/operationResult.js";
import type { GovernmentStabilizedEvent } from "../model/gameEvent.js";
import { getNationById } from "../model/worldState.js";
import { getNationInfluence } from "../model/nationInfluence.js";
import { getDiplomaticRelationship } from "../model/diplomaticRelationship.js";
import { getNationStrategicStats } from "../model/nationStrategicStats.js";
import { setNationStrategicStat } from "./setNationStrategicStat.js";
import { spendActionPoints } from "./spendActionPoints.js";
import { validateGameState } from "./validateGameState.js";
import { InvalidPhaseError } from "./resolveTurn.js";
import {
  SelfTargetPoliticalOperationError,
  InsufficientPoliticalInfluenceError,
  HostileDiplomaticRelationshipError,
  MaximumNationStabilityError,
} from "./politicalOperationErrors.js";

export {
  SelfTargetPoliticalOperationError,
  InsufficientPoliticalInfluenceError,
  HostileDiplomaticRelationshipError,
  MaximumNationStabilityError,
} from "./politicalOperationErrors.js";

export const STABILIZE_GOVERNMENT_AP_COST = 2;
export const STABILIZE_GOVERNMENT_MINIMUM_INFLUENCE = 40;
export const GOVERNMENT_STABILITY_GAIN = 5;

export function stabilizeGovernment(
  state: Readonly<GameState>,
  actorNationId: NationId,
  targetNationId: NationId,
): OperationResult<GovernmentStabilizedEvent> {
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

  const currentRelationship = getDiplomaticRelationship(
    state.world,
    actorNationId,
    targetNationId,
  );

  const currentStats = getNationStrategicStats(state.world, targetNationId);

  validateGameState(state);

  if (state.phase !== "planning") {
    throw new InvalidPhaseError("planning", state.phase);
  }

  if (currentInfluence.value < STABILIZE_GOVERNMENT_MINIMUM_INFLUENCE) {
    throw new InsufficientPoliticalInfluenceError(
      actorNationId,
      targetNationId,
      STABILIZE_GOVERNMENT_MINIMUM_INFLUENCE,
      currentInfluence.value,
    );
  }

  if (currentRelationship.status === "hostile") {
    throw new HostileDiplomaticRelationshipError(actorNationId, targetNationId);
  }

  if (currentStats.stability >= 100) {
    throw new MaximumNationStabilityError(targetNationId);
  }

  const spentState = spendActionPoints(
    state,
    actorNationId,
    STABILIZE_GOVERNMENT_AP_COST,
  );

  const newStability = Math.min(
    currentStats.stability + GOVERNMENT_STABILITY_GAIN,
    100,
  );

  const resultingState = setNationStrategicStat(
    spentState,
    targetNationId,
    "stability",
    newStability,
  );

  return {
    state: resultingState,
    event: {
      type: "government-stabilized",
      turn: state.turn,
      actorNationId,
      targetNationId,
      previousStability: currentStats.stability,
      newStability,
      actionPointCost: STABILIZE_GOVERNMENT_AP_COST,
    },
  };
}
