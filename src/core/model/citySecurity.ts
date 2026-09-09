import type { CityId } from "./city.js";
import { CANONICAL_CITIES, getCityById } from "./city.js";
import type { WorldState } from "./worldState.js";

export interface CitySecurity {
  readonly cityId: CityId;
  readonly value: number;
}

export function createInitialCitySecurity(): readonly CitySecurity[] {
  return CANONICAL_CITIES.map((city) => ({
    cityId: city.id,
    value: city.baseSecurity,
  }));
}

export class MissingCitySecurityError extends Error {
  constructor(cityId: CityId) {
    super(`Missing city security for city: "${cityId}"`);
    this.name = "MissingCitySecurityError";
  }
}

export class CitySecurityValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CitySecurityValidationError";
  }
}

export function getCitySecurity(
  world: Readonly<WorldState>,
  cityId: CityId,
): CitySecurity {
  getCityById(cityId);
  const security = world.citySecurity.find((s) => s.cityId === cityId);
  if (!security) {
    throw new MissingCitySecurityError(cityId);
  }
  return security;
}

function isInteger(value: number): boolean {
  return Number.isInteger(value);
}

export function validateCitySecurity(
  world: Readonly<WorldState>,
): void {
  const seenCityIds = new Set<string>();

  for (const security of world.citySecurity) {
    try {
      getCityById(security.cityId);
    } catch {
      throw new CitySecurityValidationError(
        `City security references unknown city: "${security.cityId}"`,
      );
    }

    if (seenCityIds.has(security.cityId)) {
      throw new CitySecurityValidationError(
        `Duplicate city security: "${security.cityId}"`,
      );
    }
    seenCityIds.add(security.cityId);

    if (!isInteger(security.value) || security.value < 0 || security.value > 100) {
      throw new CitySecurityValidationError(
        `Invalid city security for "${security.cityId}": expected integer 0..100, got ${security.value}`,
      );
    }
  }

  for (const city of CANONICAL_CITIES) {
    if (!seenCityIds.has(city.id)) {
      throw new CitySecurityValidationError(
        `Missing city security for city: "${city.id}"`,
      );
    }
  }
}