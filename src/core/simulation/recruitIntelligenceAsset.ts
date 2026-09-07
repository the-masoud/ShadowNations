import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { AgentId } from "../model/intelligenceAgent.js";
import type { AssetId, IntelligenceAssetAccess } from "../model/intelligenceAsset.js";
import { getNationById } from "../model/worldState.js";
import { getIntelligenceAgent } from "../model/intelligenceAgent.js";
import { getIntelligenceNetwork } from "../model/intelligenceState.js";
import { addIntelligenceAsset } from "./addIntelligenceAsset.js";
import { spendActionPoints } from "./spendActionPoints.js";
import { validateGameState } from "./validateGameState.js";
import { InvalidPhaseError } from "./resolveTurn.js";
import {
  SelfTargetEspionageOperationError,
  AgentOwnershipError,
  InsufficientIntelligenceNetworkError,
} from "./intelligenceErrors.js";

export { SelfTargetEspionageOperationError, AgentOwnershipError, InsufficientIntelligenceNetworkError } from "./intelligenceErrors.js";

export const RECRUIT_ASSET_AP_COST = 2;

export class EmptyAssetIdError extends Error {
  constructor() {
    super("Empty asset id");
    this.name = "EmptyAssetIdError";
  }
}

export class DuplicateSuppliedAssetIdError extends Error {
  constructor(assetId: AssetId) {
    super(`Duplicate supplied asset id: "${assetId}"`);
    this.name = "DuplicateSuppliedAssetIdError";
  }
}

export function recruitIntelligenceAsset(
  state: Readonly<GameState>,
  actorNationId: NationId,
  targetNationId: NationId,
  agentId: AgentId,
  assetId: AssetId,
): GameState {
  getNationById(state.world, actorNationId);
  getNationById(state.world, targetNationId);

  if (actorNationId === targetNationId) {
    throw new SelfTargetEspionageOperationError(actorNationId, targetNationId);
  }

  const agent = getIntelligenceAgent(state, agentId);
  if (agent.ownerNationId !== actorNationId) {
    throw new AgentOwnershipError(agentId, actorNationId);
  }

  const network = getIntelligenceNetwork(state, actorNationId, targetNationId);

  validateGameState(state);

  if (state.phase !== "planning") {
    throw new InvalidPhaseError("planning", state.phase);
  }

  if (assetId === "") {
    throw new EmptyAssetIdError();
  }

  const existingAsset = state.intelligence.assets.find(
    (a) => a.id === assetId,
  );
  if (existingAsset) {
    throw new DuplicateSuppliedAssetIdError(assetId);
  }

  if (network.level !== "established" && network.level !== "deep") {
    throw new InsufficientIntelligenceNetworkError(
      actorNationId,
      targetNationId,
      "established or deep",
    );
  }

  const access: IntelligenceAssetAccess =
    network.level === "established" ? "limited" : "high";

  const asset = {
    id: assetId,
    ownerNationId: actorNationId,
    targetNationId,
    access,
  };

  const spentState = spendActionPoints(
    state,
    actorNationId,
    RECRUIT_ASSET_AP_COST,
  );

  return addIntelligenceAsset(spentState, asset);
}
