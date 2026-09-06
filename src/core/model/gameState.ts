import {
  createInitialPlanningState,
  type PlanningState,
} from "./actionPoints.js";
import { createInitialWorldState } from "./worldState.js";
import type { WorldState } from "./worldState.js";

export type GamePhase = "planning" | "resolution";

export interface GameState {
  readonly turn: number;
  readonly phase: GamePhase;
  readonly playerNationId: string;
  readonly world: WorldState;
  readonly planning: PlanningState;
}

export function createInitialGameState(): GameState {
  const world = createInitialWorldState();
  return {
    turn: 1,
    phase: "planning",
    playerNationId: "solaris",
    world,
    planning: createInitialPlanningState(world.nations),
  };
}
