import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { AgentId } from "../model/intelligenceAgent.js";
import type { CityId } from "../model/city.js";

import type { OperationResult } from "../model/operationResult.js";
import type { CityBlackOperationConductedEvent } from "../model/gameEvent.js";
import { getNationById } from "../model/worldState.js";
import { getIntelligenceAgent } from "../model/intelligenceAgent.js";
import { getNationVisibility } from "../model/intelligenceVisibility.js";
import { getIntelligenceNetwork } from "../model/intelligenceState.js";
import { getCityById, getCityOwnerNationId } from "../model/city.js";
import { getCitySecurity } from "../model/citySecurity.js";
import { getNationStrategicStats } from "../model/nationStrategicStats.js";
import { setCitySecurity } from "./setCitySecurity.js";
import { setNationStrategicStat } from "./setNationStrategicStat.js";
import { spendActionPoints } from "./spendActionPoints.js";
import { validateGameState } from "./validateGameState.js";
import { InvalidPhaseError } from "./resolveTurn.js";
import {
  AgentOwnershipError,
  InsufficientIntelligenceNetworkError,
} from "./intelligenceErrors.js";
import { SelfTargetCityOperationError } from "./cityOperationErrors.js";
import { InsufficientCityVisibilityError } from "./cityOperationErrors.js";
import { CitySecurityTooHighError } from "./cityOperationErrors.js";
import { getStrategicStatForCityRole } from "./cityOperationSupport.js";

export const CITY_BLACK_OPERATION_AP_COST = 3;
export const CITY_BLACK_OPERATION_MAXIMUM_SECURITY = 25;
export const CITY_BLACK_OPERATION_STAT_DAMAGE = 15;
export const CITY_BLACK_OPERATION_POST_SECURITY_BONUS = 40;

export function conductCityBlackOperation(
  state: Readonly<GameState>,
  actorNationId: NationId,
  cityId: CityId,
  agentId: AgentId,
): OperationResult<CityBlackOperationConductedEvent> {
  getNationById(state.world, actorNationId);

  const city = getCityById(cityId);
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
  const strategicStat = getStrategicStatForCityRole(city.role);
  const stats = getNationStrategicStats(state.world, targetNationId);
  const previousValue = stats[strategicStat];

  validateGameState(state);

  if (state.phase !== "planning") {
    throw new InvalidPhaseError("planning", state.phase);
  }

  if (visibility !== "known") {
    throw new InsufficientCityVisibilityError(
      actorNationId,
      targetNationId,
      cityId,
      "known",
    );
  }

  if (network.level !== "deep") {
    throw new InsufficientIntelligenceNetworkError(
      actorNationId,
      targetNationId,
      "deep",
    );
  }

  if (currentSecurity.value > CITY_BLACK_OPERATION_MAXIMUM_SECURITY) {
    throw new CitySecurityTooHighError(
      cityId,
      CITY_BLACK_OPERATION_MAXIMUM_SECURITY,
      currentSecurity.value,
    );
  }

  const spentState = spendActionPoints(state, actorNationId, CITY_BLACK_OPERATION_AP_COST);
  const newStatValue = Math.max(previousValue - CITY_BLACK_OPERATION_STAT_DAMAGE, 0);
  const statState = setNationStrategicStat(
    spentState,
    targetNationId,
    strategicStat,
    newStatValue,
  );
  const newSecurity = Math.min(city.baseSecurity + CITY_BLACK_OPERATION_POST_SECURITY_BONUS, 100);
  const resultingState = setCitySecurity(statState, cityId, newSecurity);

  return {
    state: resultingState,
    event: {
      type: "city-black-operation-conducted",
      turn: state.turn,
      actorNationId,
      targetNationId,
      cityId,
      agentId,
      strategicStat,
      previousValue,
      newValue: newStatValue,
      previousSecurity: currentSecurity.value,
      newSecurity,
      actionPointCost: CITY_BLACK_OPERATION_AP_COST,
    },
  };
}