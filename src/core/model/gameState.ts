import { createInitialWorldState } from "./worldState.js";
import type { WorldState } from "./worldState.js";

export type GamePhase = "planning" | "resolution";

export interface GameState {
  readonly turn: number;
  readonly phase: GamePhase;
  readonly playerNationId: string;
  readonly world: WorldState;
}

export function createInitialGameState(): GameState {
  return {
    turn: 1,
    phase: "planning",
    playerNationId: "solaris",
    world: createInitialWorldState(),
  };
}
