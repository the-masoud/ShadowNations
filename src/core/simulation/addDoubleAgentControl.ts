import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { AssetId } from "../model/intelligenceAsset.js";
import type { DoubleAgentControl } from "../model/doubleAgent.js";
import type { IntelligenceState } from "../model/intelligenceState.js";
import { getNationById } from "../model/worldState.js";
import { getIntelligenceAsset } from "../model/intelligenceAsset.js";
import { validateGameState } from "./validateGameState.js";

export class MissingDoubleAgentControlError extends Error {
  constructor(assetId: AssetId) {
    super(
      `Missing double-agent control for asset "${assetId}"`,
    );
    this.name = "MissingDoubleAgentControlError";
  }
}

export class DuplicateDoubleAgentControlError extends Error {
  constructor(assetId: AssetId) {
    super(
      `Duplicate double-agent control for asset "${assetId}"`,
    );
    this.name = "DuplicateDoubleAgentControlError";
  }
}

export class InvalidDoubleAgentControllerError extends Error {
  constructor(assetId: AssetId, expectedNationId: NationId) {
    super(
      `Invalid double-agent controller for asset "${assetId}": expected nation "${expectedNationId}"`,
    );
    this.name = "InvalidDoubleAgentControllerError";
  }
}

export function getDoubleAgentControl(
  state: Readonly<GameState>,
  assetId: AssetId,
): DoubleAgentControl {
  getIntelligenceAsset(state, assetId);

  const control = state.intelligence.doubleAgents.find(
    (d) => d.assetId === assetId,
  );

  if (!control) {
    throw new MissingDoubleAgentControlError(assetId);
  }

  return control;
}

export function addDoubleAgentControl(
  state: Readonly<GameState>,
  control: DoubleAgentControl,
): GameState {
  validateGameState(state);

  const asset = getIntelligenceAsset(state, control.assetId);
  getNationById(state.world, control.controllerNationId);

  if (asset.targetNationId !== control.controllerNationId) {
    throw new InvalidDoubleAgentControllerError(
      control.assetId,
      asset.targetNationId,
    );
  }

  if (asset.ownerNationId === control.controllerNationId) {
    throw new InvalidDoubleAgentControllerError(
      control.assetId,
      asset.targetNationId,
    );
  }

  const existing = state.intelligence.doubleAgents.find(
    (d) => d.assetId === control.assetId,
  );
  if (existing) {
    throw new DuplicateDoubleAgentControlError(control.assetId);
  }

  const newIntelligence: IntelligenceState = {
    ...state.intelligence,
    doubleAgents: [...state.intelligence.doubleAgents, control],
  };

  const newState: GameState = {
    ...state,
    intelligence: newIntelligence,
  };

  validateGameState(newState);

  return newState;
}
