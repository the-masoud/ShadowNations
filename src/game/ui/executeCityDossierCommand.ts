import type { GameState } from "../../core/model/gameState.js";
import type { CityId } from "../../core/model/city.js";
import type { AgentId } from "../../core/model/intelligenceAgent.js";
import type { OperationResult } from "../../core/model/operationResult.js";
import { infiltrateCity } from "../../core/simulation/infiltrateCity.js";
import { conductUrbanDisruption } from "../../core/simulation/conductUrbanDisruption.js";
import { conductCityBlackOperation } from "../../core/simulation/conductCityBlackOperation.js";

export type CityDossierCommandKind =
  | "infiltrate-city"
  | "urban-disruption"
  | "city-black-operation";

export interface CityDossierCommand {
  readonly kind: CityDossierCommandKind;
  readonly cityId: CityId;
  readonly agentId: AgentId;
}

export function executeCityDossierCommand(
  state: Readonly<GameState>,
  command: CityDossierCommand,
): OperationResult {
  const actorNationId = state.playerNationId;

  switch (command.kind) {
    case "infiltrate-city":
      return infiltrateCity(state, actorNationId, command.cityId, command.agentId);
    case "urban-disruption":
      return conductUrbanDisruption(state, actorNationId, command.cityId, command.agentId);
    case "city-black-operation":
      return conductCityBlackOperation(state, actorNationId, command.cityId, command.agentId);
  }
}
