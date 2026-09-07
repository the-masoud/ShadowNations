import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { AssetId } from "../model/intelligenceAsset.js";
import type { IntelligenceVisibility } from "../model/intelligenceVisibility.js";
import { getNationById } from "../model/worldState.js";
import { getIntelligenceAsset } from "../model/intelligenceAsset.js";
import { getNationVisibility } from "../model/intelligenceVisibility.js";
import { getDoubleAgentControl } from "./addDoubleAgentControl.js";
import { setNationVisibility } from "./setNationVisibility.js";
import { spendActionPoints } from "./spendActionPoints.js";
import { validateGameState } from "./validateGameState.js";
import { InvalidPhaseError } from "./resolveTurn.js";

export const FEED_FALSE_INTELLIGENCE_AP_COST = 1;

export class DoubleAgentControlOwnershipError extends Error {
  constructor(assetId: AssetId, controllerNationId: NationId) {
    super(
      `Double-agent control for asset "${assetId}" is not owned by nation "${controllerNationId}"`,
    );
    this.name = "DoubleAgentControlOwnershipError";
  }
}

export class NoIntelligenceToDegradeError extends Error {
  constructor(observerNationId: NationId, targetNationId: NationId) {
    super(
      `No intelligence to degrade for observer "${observerNationId}" / target "${targetNationId}": visibility is already "unknown"`,
    );
    this.name = "NoIntelligenceToDegradeError";
  }
}

export function feedFalseIntelligence(
  state: Readonly<GameState>,
  controllerNationId: NationId,
  assetId: AssetId,
): GameState {
  getNationById(state.world, controllerNationId);

  const asset = getIntelligenceAsset(state, assetId);

  const control = getDoubleAgentControl(state, assetId);

  if (control.controllerNationId !== controllerNationId) {
    throw new DoubleAgentControlOwnershipError(assetId, controllerNationId);
  }

  if (asset.targetNationId !== controllerNationId) {
    throw new DoubleAgentControlOwnershipError(assetId, controllerNationId);
  }

  const observerNationId = asset.ownerNationId;

  const currentVisibility = getNationVisibility(
    state,
    observerNationId,
    controllerNationId,
  );

  validateGameState(state);

  if (state.phase !== "planning") {
    throw new InvalidPhaseError("planning", state.phase);
  }

  let degradedVisibility: IntelligenceVisibility;

  if (currentVisibility === "known") {
    degradedVisibility = "limited";
  } else if (currentVisibility === "limited") {
    degradedVisibility = "unknown";
  } else {
    throw new NoIntelligenceToDegradeError(
      observerNationId,
      controllerNationId,
    );
  }

  const spentState = spendActionPoints(
    state,
    controllerNationId,
    FEED_FALSE_INTELLIGENCE_AP_COST,
  );

  return setNationVisibility(
    spentState,
    observerNationId,
    controllerNationId,
    degradedVisibility,
  );
}
