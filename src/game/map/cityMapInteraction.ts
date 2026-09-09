import type { CityId } from "../../core/model/city.js";
import type { RegionId } from "../../core/model/region.js";
import { getCityById } from "../../core/model/city.js";

export interface CityMapInteractionState {
  readonly selectedCityId: CityId;
  readonly selectedRegionId: RegionId;
  readonly hoveredCityId: CityId | null;
}

export function createInitialCityMapInteractionState(): CityMapInteractionState {
  return {
    selectedCityId: "solara",
    selectedRegionId: "sunreach",
    hoveredCityId: null,
  };
}

export function selectCityMapCity(
  _current: Readonly<CityMapInteractionState>,
  cityId: CityId,
): CityMapInteractionState {
  const city = getCityById(cityId);
  return {
    selectedCityId: city.id,
    selectedRegionId: city.regionId,
    hoveredCityId: null,
  };
}

export function hoverCityMapCity(
  current: Readonly<CityMapInteractionState>,
  cityId: CityId | null,
): CityMapInteractionState {
  if (cityId !== null) {
    getCityById(cityId);
  }
  return {
    selectedCityId: current.selectedCityId,
    selectedRegionId: current.selectedRegionId,
    hoveredCityId: cityId,
  };
}
