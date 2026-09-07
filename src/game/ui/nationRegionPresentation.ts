import type { RegionId } from "../../core/model/region.js";
import type { NationId } from "../../core/model/nation.js";
import type { GameState } from "../../core/model/gameState.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import { getRegionById } from "../../core/model/strategicMap.js";
import { getRegionOwnership } from "../../core/model/regionOwnership.js";
import { getNationById } from "../../core/model/worldState.js";
import { getNationStrategicStats } from "../../core/model/nationStrategicStats.js";
import { getNeighborRegionIds } from "../../core/model/strategicMap.js";
import { getNationOwnedRegionIds } from "../../core/model/regionOwnership.js";
import { getStrategicMapNationColor } from "../map/strategicMapPresentation.js";

export interface NationRegionPanelModel {
  readonly regionId: RegionId;
  readonly regionName: string;
  readonly regionCode: string;
  readonly ownerNationId: NationId;
  readonly ownerNationName: string;
  readonly ownerNationCode: string;
  readonly ownerColor: number;
  readonly stability: number;
  readonly publicSupport: number;
  readonly internalSecurity: number;
  readonly ownedRegionCount: number;
  readonly neighboringRegionCount: number;
}

export function createNationRegionPanelModel(
  state: Readonly<GameState>,
  regionId: RegionId,
): NationRegionPanelModel {
  validateGameState(state);

  const region = getRegionById(state.world.map, regionId);
  const ownership = getRegionOwnership(state.world, regionId);
  const ownerNation = getNationById(state.world, ownership.ownerNationId);
  const stats = getNationStrategicStats(state.world, ownerNation.id);
  const neighborRegionIds = getNeighborRegionIds(state.world.map, regionId);
  const ownedRegionIds = getNationOwnedRegionIds(
    state.world,
    ownerNation.id,
  );
  const ownerColor = getStrategicMapNationColor(ownerNation.id);

  return {
    regionId: region.id,
    regionName: region.name,
    regionCode: region.code,
    ownerNationId: ownership.ownerNationId,
    ownerNationName: ownerNation.name,
    ownerNationCode: ownerNation.code,
    ownerColor,
    stability: stats.stability,
    publicSupport: stats.publicSupport,
    internalSecurity: stats.internalSecurity,
    ownedRegionCount: ownedRegionIds.length,
    neighboringRegionCount: neighborRegionIds.length,
  };
}
