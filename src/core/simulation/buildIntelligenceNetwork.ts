import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { AgentId } from "../model/intelligenceAgent.js";
import type { OperationResult } from "../model/operationResult.js";
import type { IntelligenceNetworkBuiltEvent } from "../model/gameEvent.js";
import { getNationById } from "../model/worldState.js";
import { getIntelligenceAgent } from "../model/intelligenceAgent.js";
import { getIntelligenceNetwork } from "../model/intelligenceState.js";
import { getNextIntelligenceNetworkLevel } from "../model/intelligenceNetwork.js";
import { setIntelligenceNetworkLevel } from "./setIntelligenceNetworkLevel.js";
import { spendActionPoints } from "./spendActionPoints.js";
import { validateGameState } from "./validateGameState.js";
import { InvalidPhaseError } from "./resolveTurn.js";
import {
  SelfTargetEspionageOperationError,
  AgentOwnershipError,
} from "./intelligenceErrors.js";

export { SelfTargetEspionageOperationError, AgentOwnershipError } from "./intelligenceErrors.js";

export const BUILD_NETWORK_AP_COST = 2;

export class MaximumIntelligenceNetworkLevelError extends Error {
  constructor(observerNationId: NationId, targetNationId: NationId) {
    super(
      `Intelligence network already at maximum level for observer "${observerNationId}" / target "${targetNationId}"`,
    );
    this.name = "MaximumIntelligenceNetworkLevelError";
  }
}

export function buildIntelligenceNetwork(
  state: Readonly<GameState>,
  actorNationId: NationId,
  targetNationId: NationId,
  agentId: AgentId,
): OperationResult<IntelligenceNetworkBuiltEvent> {
  getNationById(state.world, actorNationId);
  getNationById(state.world, targetNationId);

  if (actorNationId === targetNationId) {
    throw new SelfTargetEspionageOperationError(actorNationId, targetNationId);
  }

  const agent = getIntelligenceAgent(state, agentId);
  if (agent.ownerNationId !== actorNationId) {
    throw new AgentOwnershipError(agentId, actorNationId);
  }

  const network = getIntelligenceNetwork(state, actorNationId, targetNationId);

  validateGameState(state);

  if (state.phase !== "planning") {
    throw new InvalidPhaseError("planning", state.phase);
  }

  const previousLevel = network.level;
  const nextLevel = getNextIntelligenceNetworkLevel(network.level);
  if (nextLevel === network.level) {
    throw new MaximumIntelligenceNetworkLevelError(
      actorNationId,
      targetNationId,
    );
  }

  const spentState = spendActionPoints(state, actorNationId, BUILD_NETWORK_AP_COST);

  const resultingState = setIntelligenceNetworkLevel(
    spentState,
    actorNationId,
    targetNationId,
    nextLevel,
  );

  return {
    state: resultingState,
    event: {
      type: "intelligence-network-built",
      turn: state.turn,
      actorNationId,
      targetNationId,
      agentId,
      previousLevel,
      newLevel: nextLevel,
      actionPointCost: BUILD_NETWORK_AP_COST,
    },
  };
}
