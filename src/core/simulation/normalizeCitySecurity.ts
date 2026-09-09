import type { GameState } from "../model/gameState.js";
import { validateGameState } from "./validateGameState.js";
import { CANONICAL_CITIES } from "../model/city.js";
import { getCitySecurity } from "../model/citySecurity.js";
import { setCitySecurity } from "./setCitySecurity.js";
import type { CitySecurityNormalizedEvent } from "../model/gameEvent.js";

export const CITY_SECURITY_NORMALIZATION_STEP = 10;

export function normalizeCitySecurity(
  state: Readonly<GameState>,
): {
  readonly state: GameState;
  readonly events: readonly CitySecurityNormalizedEvent[];
} {
  validateGameState(state);

  const events: CitySecurityNormalizedEvent[] = [];
  let currentState = state;

  for (const city of CANONICAL_CITIES) {
    const currentSecurity = getCitySecurity(currentState.world, city.id);
    const baseSecurity = city.baseSecurity;
    const currentValue = currentSecurity.value;

    let newValue: number;

    if (currentValue < baseSecurity) {
      newValue = Math.min(currentValue + CITY_SECURITY_NORMALIZATION_STEP, baseSecurity);
    } else if (currentValue > baseSecurity) {
      newValue = Math.max(currentValue - CITY_SECURITY_NORMALIZATION_STEP, baseSecurity);
    } else {
      newValue = currentValue;
    }

    if (newValue !== currentValue) {
      currentState = setCitySecurity(currentState, city.id, newValue);
      events.push({
        type: "city-security-normalized",
        turn: state.turn,
        cityId: city.id,
        previousSecurity: currentValue,
        newSecurity: newValue,
        baseSecurity,
      });
    }
  }

  if (events.length === 0) {
    return { state, events: [] };
  }

  return { state: currentState, events };
}