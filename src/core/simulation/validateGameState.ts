import type { GameState, GamePhase } from "../model/gameState.js";
import { validateWorldState, getNationById } from "../model/worldState.js";
import { validateStrategicMap } from "../model/strategicMap.js";
import { validateRegionOwnership } from "../model/regionOwnership.js";
import { validatePlanningState } from "./validatePlanningState.js";
import { validateIntelligenceState } from "./validateIntelligenceState.js";

const VALID_PHASES: readonly GamePhase[] = ["planning", "resolution"];

export class GameStateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameStateValidationError";
  }
}

export function validateGameState(state: Readonly<GameState>): void {
  if (!Number.isInteger(state.turn)) {
    throw new GameStateValidationError(
      `Invalid turn: expected integer, got ${state.turn}`,
    );
  }

  if (state.turn < 1) {
    throw new GameStateValidationError(
      `Invalid turn: expected >= 1, got ${state.turn}`,
    );
  }

  if (!(VALID_PHASES as readonly string[]).includes(state.phase)) {
    throw new GameStateValidationError(
      `Invalid phase: expected "planning" or "resolution", got "${state.phase}"`,
    );
  }

  if (state.playerNationId === "") {
    throw new GameStateValidationError("Empty playerNationId");
  }

  validateWorldState(state.world);
  validateStrategicMap(state.world.map);
  validateRegionOwnership(state.world);
  getNationById(state.world, state.playerNationId);
  validatePlanningState(state);
  validateIntelligenceState(state);
}
