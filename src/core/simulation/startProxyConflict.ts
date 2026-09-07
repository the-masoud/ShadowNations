import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { ProxyConflictId } from "../model/proxyConflict.js";
import type { OperationResult } from "../model/operationResult.js";
import type { ProxyConflictStartedEvent } from "../model/gameEvent.js";
import { getNationById } from "../model/worldState.js";
import { getNationInfluence } from "../model/nationInfluence.js";
import { getDiplomaticRelationship } from "../model/diplomaticRelationship.js";
import { getNationStrategicStats } from "../model/nationStrategicStats.js";
import { setNationStrategicStat } from "./setNationStrategicStat.js";
import { spendActionPoints } from "./spendActionPoints.js";
import { validateGameState } from "./validateGameState.js";
import { InvalidPhaseError } from "./resolveTurn.js";
import { addProxyConflict } from "./addProxyConflict.js";
import {
  DuplicateProxyConflictIdError,
  DuplicateProxyConflictError,
  InvalidProxyConflictParticipantsError,
  InvalidProxyConflictIdError,
} from "./proxyConflictErrors.js";
import {
  InsufficientProxyConflictInfluenceError,
  NonHostileProxyConflictRivalryError,
  HostTooStableForProxyConflictError,
} from "./proxyConflictErrors.js";

export {
  DuplicateProxyConflictIdError,
  DuplicateProxyConflictError,
  InvalidProxyConflictParticipantsError,
  InvalidProxyConflictIdError,
  InsufficientProxyConflictInfluenceError,
  NonHostileProxyConflictRivalryError,
  HostTooStableForProxyConflictError,
} from "./proxyConflictErrors.js";

export const START_PROXY_CONFLICT_AP_COST = 3;
export const PROXY_CONFLICT_MINIMUM_INFLUENCE = 40;
export const PROXY_CONFLICT_MAXIMUM_HOST_STABILITY = 70;
export const PROXY_CONFLICT_STABILITY_DAMAGE = 5;

function normalizeSponsorPair(
  world: { readonly nations: readonly { readonly id: string }[] },
  nationAId: string,
  nationBId: string,
): { a: string; b: string } {
  const indexA = world.nations.findIndex((n) => n.id === nationAId);
  const indexB = world.nations.findIndex((n) => n.id === nationBId);
  if (indexA <= indexB) {
    return { a: nationAId, b: nationBId };
  }
  return { a: nationBId, b: nationAId };
}

export function startProxyConflict(
  state: Readonly<GameState>,
  actorNationId: NationId,
  rivalNationId: NationId,
  hostNationId: NationId,
  conflictId: ProxyConflictId,
): OperationResult<ProxyConflictStartedEvent> {
  getNationById(state.world, actorNationId);
  getNationById(state.world, rivalNationId);
  getNationById(state.world, hostNationId);

  if (
    actorNationId === rivalNationId ||
    actorNationId === hostNationId ||
    rivalNationId === hostNationId
  ) {
    throw new InvalidProxyConflictParticipantsError(
      `Actor, rival and host must all be distinct: actor="${actorNationId}" rival="${rivalNationId}" host="${hostNationId}"`,
    );
  }

  if (conflictId.trim().length === 0) {
    throw new InvalidProxyConflictIdError(conflictId);
  }

  if (state.world.proxyConflicts.some((c) => c.id === conflictId)) {
    throw new DuplicateProxyConflictIdError(conflictId);
  }

  const { a: normalizedA, b: normalizedB } = normalizeSponsorPair(
    state.world,
    actorNationId,
    rivalNationId,
  );

  const existingConflict = state.world.proxyConflicts.find(
    (c) =>
      c.hostNationId === hostNationId &&
      ((c.nationAId === normalizedA && c.nationBId === normalizedB) ||
        (c.nationAId === normalizedB && c.nationBId === normalizedA)),
  );
  if (existingConflict) {
    throw new DuplicateProxyConflictError(hostNationId, normalizedA, normalizedB);
  }

  const actorInfluence = getNationInfluence(state.world, actorNationId, hostNationId);

  const diplomaticRelationship = getDiplomaticRelationship(
    state.world,
    actorNationId,
    rivalNationId,
  );

  const hostStats = getNationStrategicStats(state.world, hostNationId);

  validateGameState(state);

  if (state.phase !== "planning") {
    throw new InvalidPhaseError("planning", state.phase);
  }

  if (actorInfluence.value < PROXY_CONFLICT_MINIMUM_INFLUENCE) {
    throw new InsufficientProxyConflictInfluenceError(
      actorNationId,
      hostNationId,
      PROXY_CONFLICT_MINIMUM_INFLUENCE,
      actorInfluence.value,
    );
  }

  if (diplomaticRelationship.status !== "hostile") {
    throw new NonHostileProxyConflictRivalryError(actorNationId, rivalNationId);
  }

  if (hostStats.stability > PROXY_CONFLICT_MAXIMUM_HOST_STABILITY) {
    throw new HostTooStableForProxyConflictError(hostNationId, hostStats.stability);
  }

  const spentState = spendActionPoints(
    state,
    actorNationId,
    START_PROXY_CONFLICT_AP_COST,
  );

  const newConflict = {
    id: conflictId,
    hostNationId,
    nationAId: normalizedA,
    nationBId: normalizedB,
    intensity: "low" as const,
  };

  const afterAdd = addProxyConflict(spentState, newConflict);

  const newHostStability = Math.max(
    hostStats.stability - PROXY_CONFLICT_STABILITY_DAMAGE,
    0,
  );

  const resultingState = setNationStrategicStat(
    afterAdd,
    hostNationId,
    "stability",
    newHostStability,
  );

  return {
    state: resultingState,
    event: {
      type: "proxy-conflict-started",
      turn: state.turn,
      actorNationId,
      rivalNationId,
      hostNationId,
      conflictId,
      intensity: "low",
      previousHostStability: hostStats.stability,
      newHostStability,
      actionPointCost: START_PROXY_CONFLICT_AP_COST,
    },
  };
}
