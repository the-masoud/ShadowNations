import type { GameState } from "../model/gameState.js";

export class PlanningValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanningValidationError";
  }
}

export function validatePlanningState(state: Readonly<GameState>): void {
  const nationIds = state.world.nations.map((n) => n.id);
  const seenNationIds = new Set<string>();

  for (const ap of state.planning.actionPoints) {
    if (seenNationIds.has(ap.nationId)) {
      throw new PlanningValidationError(
        `Duplicate action point entry for nation: "${ap.nationId}"`,
      );
    }
    seenNationIds.add(ap.nationId);

    if (!nationIds.includes(ap.nationId)) {
      throw new PlanningValidationError(
        `Action point entry references unknown nation: "${ap.nationId}"`,
      );
    }

    if (!Number.isInteger(ap.maximum)) {
      throw new PlanningValidationError(
        `Invalid maximum action points for nation "${ap.nationId}": expected integer, got ${ap.maximum}`,
      );
    }

    if (ap.maximum < 0) {
      throw new PlanningValidationError(
        `Invalid maximum action points for nation "${ap.nationId}": expected >= 0, got ${ap.maximum}`,
      );
    }

    if (!Number.isInteger(ap.remaining)) {
      throw new PlanningValidationError(
        `Invalid remaining action points for nation "${ap.nationId}": expected integer, got ${ap.remaining}`,
      );
    }

    if (ap.remaining < 0) {
      throw new PlanningValidationError(
        `Invalid remaining action points for nation "${ap.nationId}": expected >= 0, got ${ap.remaining}`,
      );
    }

    if (ap.remaining > ap.maximum) {
      throw new PlanningValidationError(
        `Remaining action points exceeds maximum for nation "${ap.nationId}": ${ap.remaining} > ${ap.maximum}`,
      );
    }
  }

  for (const nationId of nationIds) {
    if (!seenNationIds.has(nationId)) {
      throw new PlanningValidationError(
        `Missing action point entry for nation: "${nationId}"`,
      );
    }
  }
}
