import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { ProxyConflictId, ProxyConflictIntensity } from "../model/proxyConflict.js";
import type { OperationResult } from "../model/operationResult.js";
import type { ProxyConflictEscalatedEvent } from "../model/gameEvent.js";
import { getNationById } from "../model/worldState.js";
import { getNationStrategicStats } from "../model/nationStrategicStats.js";
import { setNationStrategicStat } from "./setNationStrategicStat.js";
import { setProxyConflictIntensity } from "./setProxyConflictIntensity.js";
import { spendActionPoints } from "./spendActionPoints.js";
import { validateGameState } from "./validateGameState.js";
import { InvalidPhaseError } from "./resolveTurn.js";
import {
  UnknownProxyConflictError,
  ProxyConflictParticipationError,
  MaximumProxyConflictIntensityError,
} from "./proxyConflictErrors.js";

export {
  UnknownProxyConflictError,
  ProxyConflictParticipationError,
  MaximumProxyConflictIntensityError,
} from "./proxyConflictErrors.js";

export const ESCALATE_PROXY_CONFLICT_AP_COST = 2;
export const ESCALATION_STABILITY_DAMAGE = 5;

function getNextIntensity(current: ProxyConflictIntensity): ProxyConflictIntensity {
  if (current === "low") return "medium";
  if (current === "medium") return "high";
  return current;
}

export function escalateProxyConflict(
  state: Readonly<GameState>,
  actorNationId: NationId,
  conflictId: ProxyConflictId,
): OperationResult<ProxyConflictEscalatedEvent> {
  getNationById(state.world, actorNationId);

  const conflict = state.world.proxyConflicts.find((c) => c.id === conflictId);
  if (!conflict) {
    throw new UnknownProxyConflictError(conflictId);
  }

  if (actorNationId !== conflict.nationAId && actorNationId !== conflict.nationBId) {
    throw new ProxyConflictParticipationError(actorNationId, conflictId);
  }

  const hostStats = getNationStrategicStats(state.world, conflict.hostNationId);

  validateGameState(state);

  if (state.phase !== "planning") {
    throw new InvalidPhaseError("planning", state.phase);
  }

  if (conflict.intensity === "high") {
    throw new MaximumProxyConflictIntensityError(conflictId);
  }

  const spentState = spendActionPoints(
    state,
    actorNationId,
    ESCALATE_PROXY_CONFLICT_AP_COST,
  );

  const newIntensity = getNextIntensity(conflict.intensity);

  const afterIntensity = setProxyConflictIntensity(spentState, conflictId, newIntensity);

  const newHostStability = Math.max(
    hostStats.stability - ESCALATION_STABILITY_DAMAGE,
    0,
  );

  const resultingState = setNationStrategicStat(
    afterIntensity,
    conflict.hostNationId,
    "stability",
    newHostStability,
  );

  return {
    state: resultingState,
    event: {
      type: "proxy-conflict-escalated",
      turn: state.turn,
      actorNationId,
      conflictId,
      hostNationId: conflict.hostNationId,
      previousIntensity: conflict.intensity,
      newIntensity,
      previousHostStability: hostStats.stability,
      newHostStability,
      actionPointCost: ESCALATE_PROXY_CONFLICT_AP_COST,
    },
  };
}
