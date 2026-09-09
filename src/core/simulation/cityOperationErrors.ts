import type { NationId } from "../model/nation.js";
import type { CityId } from "../model/city.js";

export class SelfTargetCityOperationError extends Error {
  constructor(actorNationId: NationId, cityId: CityId) {
    super(`Self-target city operation not allowed: actor "${actorNationId}" / city "${cityId}"`);
    this.name = "SelfTargetCityOperationError";
  }
}

export class InsufficientCityVisibilityError extends Error {
  constructor(
    observerNationId: NationId,
    targetNationId: NationId,
    cityId: CityId,
    required: string,
  ) {
    super(
      `Insufficient city visibility for observer "${observerNationId}" / target "${targetNationId}" / city "${cityId}": required ${required}`,
    );
    this.name = "InsufficientCityVisibilityError";
  }
}

export class CitySecurityTooHighError extends Error {
  constructor(
    cityId: CityId,
    requiredMaximum: number,
    actual: number,
  ) {
    super(
      `City security too high for city "${cityId}": required <= ${requiredMaximum}, got ${actual}`,
    );
    this.name = "CitySecurityTooHighError";
  }
}