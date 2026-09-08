import type { RegionId } from "./region.js";
import type { NationId } from "./nation.js";
import type { WorldState } from "./worldState.js";
import type { StrategicMap } from "./strategicMap.js";
import { getRegionOwnership } from "./regionOwnership.js";

export type CityId = string;

export type CityRole =
  | "capital"
  | "media-hub"
  | "security-hub";

export interface City {
  readonly id: CityId;
  readonly name: string;
  readonly regionId: RegionId;
  readonly role: CityRole;
  readonly baseSecurity: number;
}

export const VALID_CITY_ROLES: readonly CityRole[] = [
  "capital",
  "media-hub",
  "security-hub",
] as const;

export const CANONICAL_CITIES: readonly City[] = [
  { id: "solara", name: "Solara", regionId: "sunreach", role: "capital", baseSecurity: 65 },
  { id: "aurelis", name: "Aurelis", regionId: "auric-basin", role: "media-hub", baseSecurity: 55 },
  { id: "helion", name: "Helion", regionId: "helion-coast", role: "security-hub", baseSecurity: 75 },
  { id: "dravik", name: "Dravik", regionId: "ironvale", role: "capital", baseSecurity: 80 },
  { id: "kragen", name: "Kragen", regionId: "blackridge", role: "security-hub", baseSecurity: 90 },
  { id: "raskov", name: "Raskov", regionId: "varkesh", role: "media-hub", baseSecurity: 70 },
  { id: "norhaven", name: "Norhaven", regionId: "northwatch", role: "capital", baseSecurity: 50 },
  { id: "eirholm", name: "Eirholm", regionId: "frostmere", role: "media-hub", baseSecurity: 40 },
  { id: "argentis", name: "Argentis", regionId: "silverplain", role: "media-hub", baseSecurity: 50 },
  { id: "velyra", name: "Velyra", regionId: "velis", role: "capital", baseSecurity: 60 },
  { id: "meridia", name: "Meridia", regionId: "meridian", role: "media-hub", baseSecurity: 65 },
  { id: "cerulea", name: "Cerulea", regionId: "blueharbor", role: "security-hub", baseSecurity: 70 },
  { id: "kharos", name: "Kharos", regionId: "karsk", role: "capital", baseSecurity: 75 },
  { id: "sirok", name: "Sirok", regionId: "red-steppe", role: "security-hub", baseSecurity: 85 },
  { id: "skarhold", name: "Skarhold", regionId: "stonegate", role: "security-hub", baseSecurity: 60 },
  { id: "arkalis", name: "Arkalis", regionId: "arka", role: "capital", baseSecurity: 60 },
  { id: "vespera", name: "Vespera", regionId: "duskfall", role: "security-hub", baseSecurity: 70 },
  { id: "dawnspire", name: "Dawnspire", regionId: "eastern-reach", role: "media-hub", baseSecurity: 50 },
] as const;

export class UnknownCityError extends Error {
  constructor(cityId: CityId) {
    super(`Unknown city: "${cityId}"`);
    this.name = "UnknownCityError";
  }
}

export class MissingCityForRegionError extends Error {
  constructor(regionId: RegionId) {
    super(`Missing city for region: "${regionId}"`);
    this.name = "MissingCityForRegionError";
  }
}

export class CityCatalogValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CityCatalogValidationError";
  }
}

export function getCityById(cityId: CityId): City {
  const city = CANONICAL_CITIES.find((c) => c.id === cityId);
  if (!city) {
    throw new UnknownCityError(cityId);
  }
  return city;
}

export function getCityByRegionId(regionId: RegionId): City {
  const cities = CANONICAL_CITIES.filter((c) => c.regionId === regionId);
  if (cities.length !== 1) {
    throw new MissingCityForRegionError(regionId);
  }
  return cities[0];
}

export function getCityOwnerNationId(
  world: Readonly<WorldState>,
  cityId: CityId,
): NationId {
  const city = getCityById(cityId);
  const ownership = getRegionOwnership(world, city.regionId);
  return ownership.ownerNationId;
}

function isInteger(value: number): boolean {
  return Number.isInteger(value);
}

export function validateCityCatalog(
  cities: readonly City[],
  map: Readonly<StrategicMap>,
): void {
  const cityIds = new Set<string>();
  const regionIds = new Set<string>();
  const mapRegionIds = new Set(map.regions.map((r) => r.id));

  for (const city of cities) {
    if (city.id === "") {
      throw new CityCatalogValidationError("Empty city ID");
    }
    if (city.name === "") {
      throw new CityCatalogValidationError(`Empty city name for id "${city.id}"`);
    }
    if (cityIds.has(city.id)) {
      throw new CityCatalogValidationError(`Duplicate city ID: "${city.id}"`);
    }
    cityIds.add(city.id);

    if (!VALID_CITY_ROLES.includes(city.role)) {
      throw new CityCatalogValidationError(`Invalid city role: "${city.role}" for city "${city.id}"`);
    }

    if (!isInteger(city.baseSecurity) || city.baseSecurity < 0 || city.baseSecurity > 100) {
      throw new CityCatalogValidationError(
        `Invalid base security for city "${city.id}": expected integer 0..100, got ${city.baseSecurity}`,
      );
    }

    if (!mapRegionIds.has(city.regionId)) {
      throw new CityCatalogValidationError(`City "${city.id}" references unknown region: "${city.regionId}"`);
    }

    if (regionIds.has(city.regionId)) {
      throw new CityCatalogValidationError(`Duplicate city for region: "${city.regionId}"`);
    }
    regionIds.add(city.regionId);
  }

  for (const region of map.regions) {
    if (!regionIds.has(region.id)) {
      throw new CityCatalogValidationError(`Missing city for map region: "${region.id}"`);
    }
  }
}