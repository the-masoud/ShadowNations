import type { GameState } from "../model/gameState.js";
import type { WorldState } from "../model/worldState.js";
import { validateGameState } from "./validateGameState.js";
import { getCityById } from "../model/city.js";
import { getCitySecurity } from "../model/citySecurity.js";
import type { CityId } from "../model/city.js";

export class InvalidCitySecurityValueError extends Error {
  constructor(cityId: CityId, value: number) {
    super(`Invalid city security value for city "${cityId}": expected integer 0..100, got ${value}`);
    this.name = "InvalidCitySecurityValueError";
  }
}

export function setCitySecurity(
  state: Readonly<GameState>,
  cityId: CityId,
  value: number,
): GameState {
  validateGameState(state);

  getCityById(cityId);

  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new InvalidCitySecurityValueError(cityId, value);
  }

  const currentSecurity = getCitySecurity(state.world, cityId);

  if (currentSecurity.value === value) {
    return state;
  }

  const newCitySecurity = state.world.citySecurity.map((s) =>
    s.cityId === cityId ? { cityId: s.cityId, value } : s
  );

  const newWorld: WorldState = {
    ...state.world,
    citySecurity: newCitySecurity,
  };

  const newState: GameState = {
    ...state,
    world: newWorld,
  };

  validateGameState(newState);

  return newState;
}