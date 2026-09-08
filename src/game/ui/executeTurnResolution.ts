import type { GameState } from "../../core/model/gameState.js";
import type { TurnResult } from "../../core/model/turnResult.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import { resolveTurn } from "../../core/simulation/resolveTurn.js";

export function executeTurnResolution(
  state: Readonly<GameState>,
): {
  readonly state: GameState;
  readonly result: TurnResult;
} {
  validateGameState(state);
  return resolveTurn(state, []);
}
