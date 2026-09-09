import type { GameState } from "../../core/model/gameState.js";
import type { CityId, CityRole } from "../../core/model/city.js";
import type { RegionId } from "../../core/model/region.js";
import type { NationId } from "../../core/model/nation.js";
import type { IntelligenceVisibility } from "../../core/model/intelligenceVisibility.js";
import { CANONICAL_CITIES } from "../../core/model/city.js";
import { getRegionOwnership } from "../../core/model/regionOwnership.js";
import { getCitySecurity } from "../../core/model/citySecurity.js";
import { getRegionById } from "../../core/model/strategicMap.js";
import {
  getStrategicMapRegionLayout,
  getStrategicMapNationColor,
} from "./strategicMapPresentation.js";
import { getPlayerNationVisibility } from "../../core/model/intelligenceVisibility.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";

export type CityMapRoleShape = "star" | "diamond" | "hexagon";

export type CityMapSecurityBand =
  | "BREACHED"
  | "COMPROMISED"
  | "GUARDED"
  | "HARDENED";

export interface CityMapNode {
  readonly cityId: CityId;
  readonly cityName: string;
  readonly cityRole: CityRole;
  readonly regionId: RegionId;
  readonly regionCode: string;
  readonly x: number;
  readonly y: number;
  readonly ownerNationId: NationId;
  readonly ownerColor: number;
  readonly roleShape: CityMapRoleShape;
  readonly isOwnCity: boolean;
  readonly visibility: IntelligenceVisibility;
  readonly securityBand: CityMapSecurityBand | null;
  readonly securitySegments: 0 | 1 | 2 | 3 | 4;
}

const ROLE_SHAPE_MAP: ReadonlyMap<CityRole, CityMapRoleShape> = new Map([
  ["capital", "star"],
  ["media-hub", "diamond"],
  ["security-hub", "hexagon"],
]);

export function getSecurityBand(value: number): CityMapSecurityBand {
  if (value <= 25) return "BREACHED";
  if (value <= 50) return "COMPROMISED";
  if (value <= 75) return "GUARDED";
  return "HARDENED";
}

function bandToSegments(band: CityMapSecurityBand): 1 | 2 | 3 | 4 {
  switch (band) {
    case "BREACHED":
      return 1;
    case "COMPROMISED":
      return 2;
    case "GUARDED":
      return 3;
    case "HARDENED":
      return 4;
  }
}

export function createCityMapPresentationModel(
  state: Readonly<GameState>,
): readonly CityMapNode[] {
  validateGameState(state);

  const playerNationId = state.playerNationId;

  return CANONICAL_CITIES.map((city) => {
    const layout = getStrategicMapRegionLayout(city.regionId);
    const ownership = getRegionOwnership(state.world, city.regionId);
    const ownerColor = getStrategicMapNationColor(ownership.ownerNationId);
    const region = getRegionById(state.world.map, city.regionId);
    const visibility = getPlayerNationVisibility(state, ownership.ownerNationId);
    const isOwnCity = ownership.ownerNationId === playerNationId;

    let securityBand: CityMapSecurityBand | null = null;
    let securitySegments: 0 | 1 | 2 | 3 | 4 = 0;

    if (isOwnCity || visibility === "limited" || visibility === "known") {
      const security = getCitySecurity(state.world, city.id);
      const band = getSecurityBand(security.value);
      securityBand = band;
      securitySegments = bandToSegments(band);
    }

    return {
      cityId: city.id,
      cityName: city.name,
      cityRole: city.role,
      regionId: city.regionId,
      regionCode: region.code,
      x: layout.x,
      y: layout.y,
      ownerNationId: ownership.ownerNationId,
      ownerColor,
      roleShape: ROLE_SHAPE_MAP.get(city.role)!,
      isOwnCity,
      visibility,
      securityBand,
      securitySegments,
    };
  });
}
