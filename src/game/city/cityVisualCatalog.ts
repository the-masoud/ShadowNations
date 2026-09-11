import type { CityId } from "../../core/model/city.js";

export interface CityVisualEntry {
  readonly cityId: CityId;
  readonly mapAsset: string;
  readonly hasMap: boolean;
}

const CATALOG: ReadonlyMap<CityId, CityVisualEntry> = new Map([
  ["dravik", { cityId: "dravik", mapAsset: "/assets/cities/dravik/city-map.png", hasMap: true }],
  ["kragen", { cityId: "kragen", mapAsset: "/assets/cities/kragen/city-map.png", hasMap: true }],
  ["raskov", { cityId: "raskov", mapAsset: "/assets/cities/raskov/city-map.png", hasMap: true }],
]);

export function getCityVisualEntry(cityId: CityId): CityVisualEntry | undefined {
  return CATALOG.get(cityId);
}

export function hasCityMap(cityId: CityId): boolean {
  return CATALOG.has(cityId) && CATALOG.get(cityId)!.hasMap;
}
