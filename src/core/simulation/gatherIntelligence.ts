import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { AgentId } from "../model/intelligenceAgent.js";
import type { IntelligenceVisibility } from "../model/intelligenceVisibility.js";
import { getNationById } from "../model/worldState.js";
import { getIntelligenceAgent } from "../model/intelligenceAgent.js";
import { getNationVisibility } from "../model/intelligenceVisibility.js";
import { getIntelligenceNetwork } from "../model/intelligenceState.js";
import { setNationVisibility } from "./setNationVisibility.js";
import { spendActionPoints } from "./spendActionPoints.js";
import { validateGameState } from "./validateGameState.js";
import { InvalidPhaseError } from "./resolveTurn.js";
import {
  SelfTargetEspionageOperationError,
  AgentOwnershipError,
  InsufficientIntelligenceNetworkError,
} from "./intelligenceErrors.js";

export { SelfTargetEspionageOperationError, AgentOwnershipError, InsufficientIntelligenceNetworkError } from "./intelligenceErrors.js";

export const GATHER_INTELLIGENCE_AP_COST = 1;

export class IntelligenceAlreadyKnownError extends Error {
  constructor(observerNationId: NationId, targetNationId: NationId) {
    super(
      `Intelligence already known for observer "${observerNationId}" / target "${targetNationId}"`,
    );
    this.name = "IntelligenceAlreadyKnownError";
  }
}

export function gatherIntelligence(
  state: Readonly<GameState>,
  actorNationId: NationId,
  targetNationId: NationId,
  agentId: AgentId,
): GameState {
  getNationById(state.world, actorNationId);
  getNationById(state.world, targetNationId);

  if (actorNationId === targetNationId) {
    throw new SelfTargetEspionageOperationError(actorNationId, targetNationId);
  }

  const agent = getIntelligenceAgent(state, agentId);
  if (agent.ownerNationId !== actorNationId) {
    throw new AgentOwnershipError(agentId, actorNationId);
  }

  const currentVisibility = getNationVisibility(
    state,
    actorNationId,
    targetNationId,
  );
  const network = getIntelligenceNetwork(state, actorNationId, targetNationId);

  validateGameState(state);

  if (state.phase !== "planning") {
    throw new InvalidPhaseError("planning", state.phase);
  }

  let newVisibility: IntelligenceVisibility;

  if (currentVisibility === "known") {
    throw new IntelligenceAlreadyKnownError(actorNationId, targetNationId);
  }

  if (currentVisibility === "unknown") {
    if (
      network.level !== "foothold" &&
      network.level !== "established" &&
      network.level !== "deep"
    ) {
      throw new InsufficientIntelligenceNetworkError(
        actorNationId,
        targetNationId,
        "foothold, established, or deep",
      );
    }
    newVisibility = "limited";
  } else {
    if (network.level !== "established" && network.level !== "deep") {
      throw new InsufficientIntelligenceNetworkError(
        actorNationId,
        targetNationId,
        "established or deep",
      );
    }
    newVisibility = "known";
  }

  const spentState = spendActionPoints(
    state,
    actorNationId,
    GATHER_INTELLIGENCE_AP_COST,
  );

  return setNationVisibility(
    spentState,
    actorNationId,
    targetNationId,
    newVisibility,
  );
}
