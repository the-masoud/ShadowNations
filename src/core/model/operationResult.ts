import type { GameState } from "./gameState.js";
import type { GameEvent } from "./gameEvent.js";

export interface OperationResult<E extends GameEvent = GameEvent> {
  readonly state: GameState;
  readonly event: E;
}
