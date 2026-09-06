import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { PlanningState, NationActionPoints } from "../model/actionPoints.js";
import { getNationActionPoints } from "../model/actionPoints.js";
import { validateGameState } from "./validateGameState.js";
import { InvalidPhaseError } from "./resolveTurn.js";

export class InvalidActionPointAmountError extends Error {
  constructor(amount: number) {
    super(`Invalid action point amount: expected integer >= 1, got ${amount}`);
    this.name = "InvalidActionPointAmountError";
  }
}

export class InsufficientActionPointsError extends Error {
  constructor(nationId: NationId, required: number, available: number) {
    super(
      `Insufficient action points for nation "${nationId}": required ${required}, available ${available}`,
    );
    this.name = "InsufficientActionPointsError";
  }
}

export function spendActionPoints(
  state: Readonly<GameState>,
  nationId: NationId,
  amount: number,
): GameState {
  const ap = getNationActionPoints(state, nationId);

  validateGameState(state);

  if (state.phase !== "planning") {
    throw new InvalidPhaseError("planning", state.phase);
  }

  if (!Number.isInteger(amount) || amount < 1) {
    throw new InvalidActionPointAmountError(amount);
  }

  if (ap.remaining < amount) {
    throw new InsufficientActionPointsError(nationId, amount, ap.remaining);
  }

  const newAp: NationActionPoints = {
    ...ap,
    remaining: ap.remaining - amount,
  };

  const newPlanning: PlanningState = {
    actionPoints: state.planning.actionPoints.map((entry) =>
      entry.nationId === nationId ? newAp : entry,
    ),
  };

  return {
    ...state,
    planning: newPlanning,
  };
}
