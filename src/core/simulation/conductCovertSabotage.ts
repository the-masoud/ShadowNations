import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { AgentId } from "../model/intelligenceAgent.js";
import type { OperationResult } from "../model/operationResult.js";
import type { CovertSabotageConductedEvent } from "../model/gameEvent.js";
import type { CovertSabotageObjective } from "../model/covertSabotage.js";
import { getNationById } from "../model/worldState.js";
import { getIntelligenceAgent } from "../model/intelligenceAgent.js";
import { getIntelligenceNetwork } from "../model/intelligenceState.js";
import { getNationStrategicStats } from "../model/nationStrategicStats.js";
import { setNationStrategicStat } from "./setNationStrategicStat.js";
import { spendActionPoints } from "./spendActionPoints.js";
import { validateGameState } from "./validateGameState.js";
import { InvalidPhaseError } from "./resolveTurn.js";
import {
  SelfTargetEspionageOperationError,
  AgentOwnershipError,
  InsufficientIntelligenceNetworkError,
} from "./intelligenceErrors.js";
import {
  InvalidCovertSabotageObjectiveError,
  MinimumCovertSabotageTargetStatError,
} from "./covertSabotageErrors.js";

export {
  InvalidCovertSabotageObjectiveError,
  MinimumCovertSabotageTargetStatError,
} from "./covertSabotageErrors.js";

export const COVERT_SABOTAGE_AP_COST = 2;
export const COVERT_SABOTAGE_STAT_DAMAGE = 10;

const VALID_OBJECTIVES: readonly CovertSabotageObjective[] = [
  "internal-security",
  "public-support",
];

function isValidObjective(objective: string): objective is CovertSabotageObjective {
  return (VALID_OBJECTIVES as readonly string[]).includes(objective);
}

export function conductCovertSabotage(
  state: Readonly<GameState>,
  actorNationId: NationId,
  targetNationId: NationId,
  agentId: AgentId,
  objective: CovertSabotageObjective,
): OperationResult<CovertSabotageConductedEvent> {
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

  const currentStats = getNationStrategicStats(state.world, targetNationId);

  if (!isValidObjective(objective)) {
    throw new InvalidCovertSabotageObjectiveError(objective);
  }

  validateGameState(state);

  if (state.phase !== "planning") {
    throw new InvalidPhaseError("planning", state.phase);
  }

  if (network.level !== "established" && network.level !== "deep") {
    throw new InsufficientIntelligenceNetworkError(
      actorNationId,
      targetNationId,
      "established",
    );
  }

  const selectedStatKey =
    objective === "internal-security" ? "internalSecurity" : "publicSupport";

  const currentValue = currentStats[selectedStatKey];

  if (currentValue <= 0) {
    throw new MinimumCovertSabotageTargetStatError(targetNationId, objective);
  }

  const spentState = spendActionPoints(
    state,
    actorNationId,
    COVERT_SABOTAGE_AP_COST,
  );

  const newValue = Math.max(currentValue - COVERT_SABOTAGE_STAT_DAMAGE, 0);

  const resultingState = setNationStrategicStat(
    spentState,
    targetNationId,
    selectedStatKey,
    newValue,
  );

  return {
    state: resultingState,
    event: {
      type: "covert-sabotage-conducted",
      turn: state.turn,
      actorNationId,
      targetNationId,
      agentId,
      objective,
      previousValue: currentValue,
      newValue,
      actionPointCost: COVERT_SABOTAGE_AP_COST,
    },
  };
}
