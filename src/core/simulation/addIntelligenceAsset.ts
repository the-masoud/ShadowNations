import type { GameState } from "../model/gameState.js";
import type { IntelligenceAsset, AssetId } from "../model/intelligenceAsset.js";
import type { IntelligenceState } from "../model/intelligenceState.js";
import { VALID_ASSET_ACCESS_VALUES } from "../model/intelligenceAsset.js";
import { getNationById } from "../model/worldState.js";
import { validateGameState } from "./validateGameState.js";

export class DuplicateIntelligenceAssetError extends Error {
  constructor(assetId: AssetId) {
    super(`Duplicate intelligence asset id: "${assetId}"`);
    this.name = "DuplicateIntelligenceAssetError";
  }
}

export class InvalidAssetAccessError extends Error {
  constructor(access: string) {
    super(
      `Invalid asset access: expected "limited" or "high", got "${access}"`,
    );
    this.name = "InvalidAssetAccessError";
  }
}

export class SelfAssetTargetError extends Error {
  constructor(ownerNationId: string, _targetNationId: string) {
    super(
      `Asset owner "${ownerNationId}" cannot target itself`,
    );
    this.name = "SelfAssetTargetError";
  }
}

export function addIntelligenceAsset(
  state: Readonly<GameState>,
  asset: IntelligenceAsset,
): GameState {
  validateGameState(state);

  if (asset.id === "") {
    throw new Error("Empty asset id");
  }

  const existing = state.intelligence.assets.find((a) => a.id === asset.id);
  if (existing) {
    throw new DuplicateIntelligenceAssetError(asset.id);
  }

  getNationById(state.world, asset.ownerNationId);
  getNationById(state.world, asset.targetNationId);

  if (asset.ownerNationId === asset.targetNationId) {
    throw new SelfAssetTargetError(
      asset.ownerNationId,
      asset.targetNationId,
    );
  }

  if (
    !(VALID_ASSET_ACCESS_VALUES as readonly string[]).includes(asset.access)
  ) {
    throw new InvalidAssetAccessError(asset.access);
  }

  const newIntelligence: IntelligenceState = {
    ...state.intelligence,
    assets: [...state.intelligence.assets, asset],
  };

  const newState: GameState = {
    ...state,
    intelligence: newIntelligence,
  };

  validateGameState(newState);

  return newState;
}
