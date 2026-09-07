import type { GameEvent } from "./gameEvent.js";

export interface TurnResult {
  readonly previousTurn: number;
  readonly nextTurn: number;
  readonly processedOrderIds: readonly string[];
  readonly events: readonly GameEvent[];
}
