import type { Nation, NationId } from "./nation.js";
import type { GameState } from "./gameState.js";
import { UnknownNationError } from "./worldState.js";

export const ACTION_POINTS_PER_TURN = 6;

export interface NationActionPoints {
  readonly nationId: NationId;
  readonly maximum: number;
  readonly remaining: number;
}

export interface PlanningState {
  readonly actionPoints: readonly NationActionPoints[];
}

export function createInitialPlanningState(
  nations: readonly Nation[],
): PlanningState {
  return {
    actionPoints: nations.map((n) => ({
      nationId: n.id,
      maximum: ACTION_POINTS_PER_TURN,
      remaining: ACTION_POINTS_PER_TURN,
    })),
  };
}

export class MissingNationActionPointsError extends Error {
  constructor(nationId: NationId) {
    super(`Missing action points for nation: "${nationId}"`);
    this.name = "MissingNationActionPointsError";
  }
}

export function getNationActionPoints(
  state: Readonly<GameState>,
  nationId: NationId,
): NationActionPoints {
  const nation = state.world.nations.find((n) => n.id === nationId);
  if (!nation) {
    throw new UnknownNationError(nationId);
  }

  const entry = state.planning.actionPoints.find(
    (ap) => ap.nationId === nationId,
  );
  if (!entry) {
    throw new MissingNationActionPointsError(nationId);
  }
  return entry;
}
