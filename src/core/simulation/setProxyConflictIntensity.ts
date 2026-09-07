import type { GameState } from "../model/gameState.js";
import type { ProxyConflictId, ProxyConflictIntensity } from "../model/proxyConflict.js";
import { VALID_PROXY_CONFLICT_INTENSITIES } from "../model/proxyConflict.js";
import { validateGameState } from "./validateGameState.js";
import { UnknownProxyConflictError, InvalidProxyConflictIntensityError } from "./proxyConflictErrors.js";

function isValidIntensity(intensity: string): intensity is ProxyConflictIntensity {
  return (VALID_PROXY_CONFLICT_INTENSITIES as readonly string[]).includes(intensity);
}

export function setProxyConflictIntensity(
  state: Readonly<GameState>,
  conflictId: ProxyConflictId,
  intensity: ProxyConflictIntensity,
): GameState {
  const existing = state.world.proxyConflicts.find((c) => c.id === conflictId);
  if (!existing) {
    throw new UnknownProxyConflictError(conflictId);
  }

  if (!isValidIntensity(intensity)) {
    throw new InvalidProxyConflictIntensityError(intensity);
  }

  validateGameState(state);

  if (existing.intensity === intensity) {
    return state;
  }

  const updatedConflict = { ...existing, intensity };

  const newState: GameState = {
    ...state,
    world: {
      ...state.world,
      proxyConflicts: state.world.proxyConflicts.map((c) =>
        c.id === conflictId ? updatedConflict : c,
      ),
    },
  };

  validateGameState(newState);

  return newState;
}
