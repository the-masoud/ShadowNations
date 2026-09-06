import type { PlanningState, NationActionPoints } from "../model/actionPoints.js";

export function resetActionPointsForNewTurn(
  planning: Readonly<PlanningState>,
): PlanningState {
  let changed = false;

  const actionPoints: NationActionPoints[] = planning.actionPoints.map((ap) => {
    if (ap.remaining !== ap.maximum) {
      changed = true;
      return { ...ap, remaining: ap.maximum };
    }
    return ap;
  });

  if (!changed) {
    return planning;
  }

  return { actionPoints };
}
