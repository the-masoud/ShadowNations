import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { AssetId } from "../model/intelligenceAsset.js";
import { getNationById } from "../model/worldState.js";
import { getIntelligenceAsset } from "../model/intelligenceAsset.js";
import { getCounterintelligenceAwareness } from "../model/counterintelligenceAwareness.js";
import { addDoubleAgentControl } from "./addDoubleAgentControl.js";
import { spendActionPoints } from "./spendActionPoints.js";
import { validateGameState } from "./validateGameState.js";
import { InvalidPhaseError } from "./resolveTurn.js";

export const TURN_ASSET_AP_COST = 3;

export class InsufficientCounterintelligenceAwarenessError extends Error {
  constructor(defenderNationId: NationId, intruderNationId: NationId) {
    super(
      `Insufficient counterintelligence awareness for defender "${defenderNationId}" / intruder "${intruderNationId}": required "identified"`,
    );
    this.name = "InsufficientCounterintelligenceAwarenessError";
  }
}

export class AssetAlreadyTurnedError extends Error {
  constructor(assetId: AssetId) {
    super(`Asset "${assetId}" is already turned as a double agent`);
    this.name = "AssetAlreadyTurnedError";
  }
}

export class InvalidDoubleAgentTargetError extends Error {
  constructor(assetId: AssetId, defenderNationId: NationId) {
    super(
      `Asset "${assetId}" target "${defenderNationId}" does not match defender nation`,
    );
    this.name = "InvalidDoubleAgentTargetError";
  }
}

export function turnIntelligenceAsset(
  state: Readonly<GameState>,
  defenderNationId: NationId,
  assetId: AssetId,
): GameState {
  getNationById(state.world, defenderNationId);

  const asset = getIntelligenceAsset(state, assetId);

  if (asset.targetNationId !== defenderNationId) {
    throw new InvalidDoubleAgentTargetError(assetId, defenderNationId);
  }

  const intruderNationId = asset.ownerNationId;

  const awareness = getCounterintelligenceAwareness(
    state,
    defenderNationId,
    intruderNationId,
  );

  if (awareness.level !== "identified") {
    throw new InsufficientCounterintelligenceAwarenessError(
      defenderNationId,
      intruderNationId,
    );
  }

  const existingControl = state.intelligence.doubleAgents.find(
    (d) => d.assetId === assetId,
  );
  if (existingControl) {
    throw new AssetAlreadyTurnedError(assetId);
  }

  validateGameState(state);

  if (state.phase !== "planning") {
    throw new InvalidPhaseError("planning", state.phase);
  }

  const spentState = spendActionPoints(
    state,
    defenderNationId,
    TURN_ASSET_AP_COST,
  );

  return addDoubleAgentControl(spentState, {
    assetId,
    controllerNationId: defenderNationId,
  });
}
