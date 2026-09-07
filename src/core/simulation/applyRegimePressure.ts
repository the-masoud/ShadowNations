import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { OperationResult } from "../model/operationResult.js";
import type { RegimePressureAppliedEvent } from "../model/gameEvent.js";
import { getNationById } from "../model/worldState.js";
import { getNationInfluence } from "../model/nationInfluence.js";
import { getDiplomaticRelationship } from "../model/diplomaticRelationship.js";
import { getNationRegimePressure } from "../model/nationRegimePressure.js";
import { getNationStrategicStats } from "../model/nationStrategicStats.js";
import { setNationRegimePressure } from "./setNationRegimePressure.js";
import { setNationStrategicStat } from "./setNationStrategicStat.js";
import { spendActionPoints } from "./spendActionPoints.js";
import { validateGameState } from "./validateGameState.js";
import { InvalidPhaseError } from "./resolveTurn.js";
import { SelfTargetPoliticalOperationError, InsufficientPoliticalInfluenceError } from "./politicalOperationErrors.js";
import { FriendlyDiplomaticRelationshipError, MaximumNationRegimePressureError } from "./regimePressureErrors.js";

export { FriendlyDiplomaticRelationshipError, MaximumNationRegimePressureError } from "./regimePressureErrors.js";

export const APPLY_REGIME_PRESSURE_AP_COST = 3;
export const REGIME_PRESSURE_MINIMUM_INFLUENCE = 40;
export const REGIME_PRESSURE_GAIN = 20;
export const REGIME_PRESSURE_STABILITY_DAMAGE = 5;

export function applyRegimePressure(
  state: Readonly<GameState>,
  actorNationId: NationId,
  targetNationId: NationId,
): OperationResult<RegimePressureAppliedEvent> {
  getNationById(state.world, actorNationId);
  getNationById(state.world, targetNationId);

  if (actorNationId === targetNationId) {
    throw new SelfTargetPoliticalOperationError(actorNationId);
  }

  const actorInfluence = getNationInfluence(state.world, actorNationId, targetNationId);
  const diplomaticRelationship = getDiplomaticRelationship(state.world, actorNationId, targetNationId);
  const pressureEntry = getNationRegimePressure(state.world, actorNationId, targetNationId);
  const targetStats = getNationStrategicStats(state.world, targetNationId);

  validateGameState(state);

  if (state.phase !== "planning") {
    throw new InvalidPhaseError("planning", state.phase);
  }

  if (actorInfluence.value < REGIME_PRESSURE_MINIMUM_INFLUENCE) {
    throw new InsufficientPoliticalInfluenceError(
      actorNationId,
      targetNationId,
      REGIME_PRESSURE_MINIMUM_INFLUENCE,
      actorInfluence.value,
    );
  }

  if (diplomaticRelationship.status === "friendly") {
    throw new FriendlyDiplomaticRelationshipError(actorNationId, targetNationId);
  }

  if (pressureEntry.value >= 100) {
    throw new MaximumNationRegimePressureError(actorNationId, targetNationId);
  }

  const spentState = spendActionPoints(
    state,
    actorNationId,
    APPLY_REGIME_PRESSURE_AP_COST,
  );

  const newPressure = Math.min(
    pressureEntry.value + REGIME_PRESSURE_GAIN,
    100,
  );

  const newStability = Math.max(
    targetStats.stability - REGIME_PRESSURE_STABILITY_DAMAGE,
    0,
  );

  const afterPressure = setNationRegimePressure(
    spentState,
    actorNationId,
    targetNationId,
    newPressure,
  );

  const resultingState = setNationStrategicStat(
    afterPressure,
    targetNationId,
    "stability",
    newStability,
  );

  return {
    state: resultingState,
    event: {
      type: "regime-pressure-applied",
      turn: state.turn,
      actorNationId,
      targetNationId,
      previousPressure: pressureEntry.value,
      newPressure,
      previousStability: targetStats.stability,
      newStability,
      actionPointCost: APPLY_REGIME_PRESSURE_AP_COST,
    },
  };
}
