import type { GameState } from "../../core/model/gameState.js";
import type { CityId, CityRole } from "../../core/model/city.js";
import type { NationId } from "../../core/model/nation.js";
import type { AgentId } from "../../core/model/intelligenceAgent.js";
import type { IntelligenceVisibility } from "../../core/model/intelligenceVisibility.js";
import type { IntelligenceNetworkLevel } from "../../core/model/intelligenceNetwork.js";
import type { NationStrategicStatKey } from "../../core/model/nationStrategicStats.js";
import { getCityById, getCityOwnerNationId } from "../../core/model/city.js";
import { getCitySecurity } from "../../core/model/citySecurity.js";
import { getNationVisibility } from "../../core/model/intelligenceVisibility.js";
import { getIntelligenceNetwork } from "../../core/model/intelligenceState.js";
import { getNationStrategicStats } from "../../core/model/nationStrategicStats.js";
import { getNationById } from "../../core/model/worldState.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import { getStrategicStatForCityRole } from "../../core/simulation/cityOperationSupport.js";
import {
  INFILTRATE_CITY_AP_COST,
  INFILTRATE_CITY_SECURITY_DAMAGE,
} from "../../core/simulation/infiltrateCity.js";
import {
  URBAN_DISRUPTION_AP_COST,
  URBAN_DISRUPTION_MAXIMUM_SECURITY,
  URBAN_DISRUPTION_STAT_DAMAGE,
  URBAN_DISRUPTION_POST_SECURITY_BONUS,
} from "../../core/simulation/conductUrbanDisruption.js";
import {
  CITY_BLACK_OPERATION_AP_COST,
  CITY_BLACK_OPERATION_MAXIMUM_SECURITY,
  CITY_BLACK_OPERATION_STAT_DAMAGE,
  CITY_BLACK_OPERATION_POST_SECURITY_BONUS,
} from "../../core/simulation/conductCityBlackOperation.js";

export type CityDossierOperationKind =
  | "infiltrate-city"
  | "urban-disruption"
  | "city-black-operation";

export interface CityDossierOperationModel {
  readonly kind: CityDossierOperationKind;
  readonly label: string;
  readonly actionPointCost: number;
  readonly enabled: boolean;
  readonly disabledReason: string;
  readonly targetEffect: string;
}

export interface CityDossierAgentModel {
  readonly agentId: AgentId;
  readonly codename: string;
}

export interface CityDossierModel {
  readonly cityId: CityId;
  readonly cityName: string;
  readonly cityRole: CityRole;
  readonly regionId: string;
  readonly regionName: string;
  readonly regionCode: string;
  readonly controllerNationId: NationId;
  readonly controllerNationName: string;
  readonly controllerNationCode: string;
  readonly isOwnCity: boolean;
  readonly currentSecurity: number;
  readonly baseSecurity: number;
  readonly securityBand: string;
  readonly showCurrentSecurity: boolean;
  readonly showBaseSecurity: boolean;
  readonly showBand: boolean;
  readonly visibility: IntelligenceVisibility;
  readonly networkLevel: IntelligenceNetworkLevel;
  readonly affectedStat: NationStrategicStatKey;
  readonly affectedStatDisplayName: string;
  readonly targetNationStability: number;
  readonly targetNationPublicSupport: number;
  readonly targetNationInternalSecurity: number;
  readonly agents: readonly CityDossierAgentModel[];
  readonly operations: readonly CityDossierOperationModel[];
}

export function getSecurityBand(value: number): string {
  if (value <= 25) return "BREACHED";
  if (value <= 50) return "COMPROMISED";
  if (value <= 75) return "GUARDED";
  return "HARDENED";
}

function getStatDisplayName(stat: NationStrategicStatKey): string {
  switch (stat) {
    case "stability":
      return "STABILITY";
    case "publicSupport":
      return "PUBLIC SUPPORT";
    case "internalSecurity":
      return "INTERNAL SECURITY";
  }
}

function getBlackOperationLabel(role: CityRole): string {
  switch (role) {
    case "capital":
      return "BLACK OP \u2014 PALACE CRISIS";
    case "media-hub":
      return "BLACK OP \u2014 INFORMATION BLACKOUT";
    case "security-hub":
      return "BLACK OP \u2014 DIRECTORATE BREACH";
  }
}

function buildInfiltrateEffect(): string {
  return `CITY SECURITY -${INFILTRATE_CITY_SECURITY_DAMAGE}`;
}

function buildUrbanEffect(stat: NationStrategicStatKey): string {
  return `${getStatDisplayName(stat)} -${URBAN_DISRUPTION_STAT_DAMAGE}; SECURITY -> BASE +${URBAN_DISRUPTION_POST_SECURITY_BONUS}`;
}

function buildBlackEffect(stat: NationStrategicStatKey): string {
  return `${getStatDisplayName(stat)} -${CITY_BLACK_OPERATION_STAT_DAMAGE}; SECURITY -> BASE +${CITY_BLACK_OPERATION_POST_SECURITY_BONUS}`;
}

function buildInfiltrateDisabledReason(
  isOwnCity: boolean,
  phase: string,
  remainingAp: number,
  visibility: IntelligenceVisibility,
  networkLevel: IntelligenceNetworkLevel,
): string {
  if (isOwnCity) return "OWN CITY";
  if (phase !== "planning") return "NOT IN PLANNING PHASE";
  if (remainingAp < INFILTRATE_CITY_AP_COST) return "INSUFFICIENT AP";
  if (visibility !== "limited" && visibility !== "known") return "REQUIRES LIMITED INTEL";
  if (networkLevel !== "foothold" && networkLevel !== "established" && networkLevel !== "deep")
    return "REQUIRES FOOTHOLD NETWORK";
  return "";
}

function buildUrbanDisabledReason(
  isOwnCity: boolean,
  phase: string,
  remainingAp: number,
  visibility: IntelligenceVisibility,
  networkLevel: IntelligenceNetworkLevel,
  securityValue: number,
): string {
  if (isOwnCity) return "OWN CITY";
  if (phase !== "planning") return "NOT IN PLANNING PHASE";
  if (remainingAp < URBAN_DISRUPTION_AP_COST) return "INSUFFICIENT AP";
  if (visibility !== "known") return "REQUIRES KNOWN INTEL";
  if (networkLevel !== "established" && networkLevel !== "deep") return "REQUIRES ESTABLISHED NETWORK";
  if (securityValue > URBAN_DISRUPTION_MAXIMUM_SECURITY) return "CITY SECURITY ABOVE 50";
  return "";
}

function buildBlackDisabledReason(
  isOwnCity: boolean,
  phase: string,
  remainingAp: number,
  visibility: IntelligenceVisibility,
  networkLevel: IntelligenceNetworkLevel,
  securityValue: number,
): string {
  if (isOwnCity) return "OWN CITY";
  if (phase !== "planning") return "NOT IN PLANNING PHASE";
  if (remainingAp < CITY_BLACK_OPERATION_AP_COST) return "INSUFFICIENT AP";
  if (visibility !== "known") return "REQUIRES KNOWN INTEL";
  if (networkLevel !== "deep") return "REQUIRES DEEP NETWORK";
  if (securityValue > CITY_BLACK_OPERATION_MAXIMUM_SECURITY) return "CITY SECURITY ABOVE 25";
  return "";
}

export function createCityDossierModel(
  state: Readonly<GameState>,
  cityId: CityId,
): CityDossierModel {
  validateGameState(state);

  const city = getCityById(cityId);
  const controllerNationId = getCityOwnerNationId(state.world, cityId);
  const isOwnCity = controllerNationId === state.playerNationId;
  const controllerNation = getNationById(state.world, controllerNationId);

  const citySecurity = getCitySecurity(state.world, cityId);
  const currentSecurity = citySecurity.value;
  const baseSecurity = city.baseSecurity;

  const visibility = isOwnCity
    ? "known"
    : getNationVisibility(state, state.playerNationId, controllerNationId);

  const networkLevel = isOwnCity
    ? "none"
    : getIntelligenceNetwork(state, state.playerNationId, controllerNationId).level;

  const affectedStat = getStrategicStatForCityRole(city.role);

  let showCurrentSecurity = false;
  let showBaseSecurity = false;
  let showBand = false;

  if (isOwnCity) {
    showCurrentSecurity = true;
    showBaseSecurity = true;
    showBand = true;
  } else if (visibility === "known") {
    showCurrentSecurity = true;
    showBaseSecurity = true;
    showBand = true;
  } else if (visibility === "limited") {
    showBand = true;
  }

  const displaySecurity = showCurrentSecurity ? currentSecurity : currentSecurity;
  const securityBand = showBand ? getSecurityBand(displaySecurity) : "";

  const targetStats = getNationStrategicStats(state.world, controllerNationId);

  const playerAgents = state.intelligence.agents.filter(
    (a) => a.ownerNationId === state.playerNationId,
  );

  const remainingAp =
    state.planning.actionPoints.find((a) => a.nationId === state.playerNationId)
      ?.remaining ?? 0;

  const phase = state.phase;

  const infiltrateReason = buildInfiltrateDisabledReason(
    isOwnCity, phase, remainingAp, visibility, networkLevel,
  );
  const urbanReason = buildUrbanDisabledReason(
    isOwnCity, phase, remainingAp, visibility, networkLevel, currentSecurity,
  );
  const blackReason = buildBlackDisabledReason(
    isOwnCity, phase, remainingAp, visibility, networkLevel, currentSecurity,
  );

  const region = state.world.map.regions.find((r) => r.id === city.regionId)!;

  return {
    cityId: city.id,
    cityName: city.name,
    cityRole: city.role,
    regionId: region.id,
    regionName: region.name,
    regionCode: region.code,
    controllerNationId,
    controllerNationName: controllerNation.name,
    controllerNationCode: controllerNation.code,
    isOwnCity,
    currentSecurity,
    baseSecurity,
    securityBand,
    showCurrentSecurity,
    showBaseSecurity,
    showBand,
    visibility,
    networkLevel,
    affectedStat,
    affectedStatDisplayName: getStatDisplayName(affectedStat),
    targetNationStability: targetStats.stability,
    targetNationPublicSupport: targetStats.publicSupport,
    targetNationInternalSecurity: targetStats.internalSecurity,
    agents: playerAgents.map((a) => ({ agentId: a.id, codename: a.codename })),
    operations: [
      {
        kind: "infiltrate-city" as const,
        label: "INFILTRATE CITY",
        actionPointCost: INFILTRATE_CITY_AP_COST,
        enabled: infiltrateReason === "",
        disabledReason: infiltrateReason,
        targetEffect: buildInfiltrateEffect(),
      },
      {
        kind: "urban-disruption" as const,
        label: "URBAN DISRUPTION",
        actionPointCost: URBAN_DISRUPTION_AP_COST,
        enabled: urbanReason === "",
        disabledReason: urbanReason,
        targetEffect: buildUrbanEffect(affectedStat),
      },
      {
        kind: "city-black-operation" as const,
        label: getBlackOperationLabel(city.role),
        actionPointCost: CITY_BLACK_OPERATION_AP_COST,
        enabled: blackReason === "",
        disabledReason: blackReason,
        targetEffect: buildBlackEffect(affectedStat),
      },
    ],
  };
}
