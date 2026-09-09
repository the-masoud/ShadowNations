import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { AgentId } from "../model/intelligenceAgent.js";
import type { CityId } from "../model/city.js";
import type { OperationResult } from "../model/operationResult.js";
import type { CityInfiltratedEvent } from "../model/gameEvent.js";
import { getNationById } from "../model/worldState.js";
import { getIntelligenceAgent } from "../model/intelligenceAgent.js";
import { getNationVisibility } from "../model/intelligenceVisibility.js";
import { getIntelligenceNetwork } from "../model/intelligenceState.js";
import { getCityById, getCityOwnerNationId } from "../model/city.js";
import { getCitySecurity } from "../model/citySecurity.js";
import { setCitySecurity } from "./setCitySecurity.js";
import { spendActionPoints } from "./spendActionPoints.js";
import { validateGameState } from "./validateGameState.js";
import { InvalidPhaseError } from "./resolveTurn.js";
import {
  AgentOwnershipError,
  InsufficientIntelligenceNetworkError,
} from "./intelligenceErrors.js";
import { SelfTargetCityOperationError } from "./cityOperationErrors.js";
import { InsufficientCityVisibilityError } from "./cityOperationErrors.js";

export const INFILTRATE_CITY_AP_COST = 2;
export const INFILTRATE_CITY_SECURITY_DAMAGE = 25;

export function infiltrateCity(
  state: Readonly<GameState>,
  actorNationId: NationId,
  cityId: CityId,
  agentId: AgentId,
): OperationResult<CityInfiltratedEvent> {
  getNationById(state.world, actorNationId);

  getCityById(cityId);
  const targetNationId = getCityOwnerNationId(state.world, cityId);

  if (actorNationId === targetNationId) {
    throw new SelfTargetCityOperationError(actorNationId, cityId);
  }

  const agent = getIntelligenceAgent(state, agentId);
  if (agent.ownerNationId !== actorNationId) {
    throw new AgentOwnershipError(agentId, actorNationId);
  }

  const visibility = getNationVisibility(state, actorNationId, targetNationId);
  const network = getIntelligenceNetwork(state, actorNationId, targetNationId);
  const currentSecurity = getCitySecurity(state.world, cityId);
  const previousSecurity = currentSecurity.value;

  validateGameState(state);

  if (state.phase !== "planning") {
    throw new InvalidPhaseError("planning", state.phase);
  }

  if (visibility !== "limited" && visibility !== "known") {
    throw new InsufficientCityVisibilityError(
      actorNationId,
      targetNationId,
      cityId,
      "limited or known",
    );
  }

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

  const spentState = spendActionPoints(state, actorNationId, INFILTRATE_CITY_AP_COST);
  const newSecurity = Math.max(previousSecurity - INFILTRATE_CITY_SECURITY_DAMAGE, 0);
  const resultingState = setCitySecurity(spentState, cityId, newSecurity);

  return {
    state: resultingState,
    event: {
      type: "city-infiltrated",
      turn: state.turn,
      actorNationId,
      targetNationId,
      cityId,
      agentId,
      previousSecurity,
      newSecurity,
      actionPointCost: INFILTRATE_CITY_AP_COST,
    },
  };
}