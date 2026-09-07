import type { GameState } from "../model/gameState.js";
import {
  VALID_VISIBILITY_VALUES,
  MissingIntelligenceVisibilityError,
} from "../model/intelligenceVisibility.js";
import { VALID_NETWORK_LEVELS } from "../model/intelligenceNetwork.js";
import { VALID_ASSET_ACCESS_VALUES } from "../model/intelligenceAsset.js";

export { MissingIntelligenceVisibilityError };

export class IntelligenceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntelligenceValidationError";
  }
}

export class InvalidIntelligenceVisibilityError extends Error {
  constructor(visibility: string) {
    super(
      `Invalid intelligence visibility: expected "unknown", "limited", or "known", got "${visibility}"`,
    );
    this.name = "InvalidIntelligenceVisibilityError";
  }
}

export class SelfVisibilityInvariantError extends Error {
  constructor(nationId: string) {
    super(
      `Self-visibility invariant violated for nation "${nationId}": must be "known"`,
    );
    this.name = "SelfVisibilityInvariantError";
  }
}

export class InvalidIntelligenceNetworkLevelError extends Error {
  constructor(level: string) {
    super(
      `Invalid intelligence network level: expected "none", "foothold", "established", or "deep", got "${level}"`,
    );
    this.name = "InvalidIntelligenceNetworkLevelError";
  }
}

export function validateIntelligenceState(
  state: Readonly<GameState>,
): void {
  const nationIds = new Set(state.world.nations.map((n) => n.id));
  const seenPairs = new Set<string>();

  for (const entry of state.intelligence.nationVisibility) {
    const pairKey = `${entry.observerNationId}|${entry.targetNationId}`;

    if (seenPairs.has(pairKey)) {
      throw new IntelligenceValidationError(
        `Duplicate visibility entry for observer "${entry.observerNationId}" / target "${entry.targetNationId}"`,
      );
    }
    seenPairs.add(pairKey);

    if (!nationIds.has(entry.observerNationId)) {
      throw new IntelligenceValidationError(
        `Visibility entry references unknown observer nation: "${entry.observerNationId}"`,
      );
    }

    if (!nationIds.has(entry.targetNationId)) {
      throw new IntelligenceValidationError(
        `Visibility entry references unknown target nation: "${entry.targetNationId}"`,
      );
    }

    if (
      !(VALID_VISIBILITY_VALUES as readonly string[]).includes(entry.visibility)
    ) {
      throw new InvalidIntelligenceVisibilityError(entry.visibility);
    }

    if (
      entry.observerNationId === entry.targetNationId &&
      entry.visibility !== "known"
    ) {
      throw new SelfVisibilityInvariantError(entry.observerNationId);
    }
  }

  for (const observer of state.world.nations) {
    for (const target of state.world.nations) {
      const pairKey = `${observer.id}|${target.id}`;
      if (!seenPairs.has(pairKey)) {
        throw new IntelligenceValidationError(
          `Missing visibility entry for observer "${observer.id}" / target "${target.id}"`,
        );
      }
    }
  }

  const seenNetworkPairs = new Set<string>();

  for (const network of state.intelligence.networks) {
    const pairKey = `${network.observerNationId}|${network.targetNationId}`;

    if (network.observerNationId === network.targetNationId) {
      throw new IntelligenceValidationError(
        `Self-network entry for nation: "${network.observerNationId}"`,
      );
    }

    if (seenNetworkPairs.has(pairKey)) {
      throw new IntelligenceValidationError(
        `Duplicate network entry for observer "${network.observerNationId}" / target "${network.targetNationId}"`,
      );
    }
    seenNetworkPairs.add(pairKey);

    if (!nationIds.has(network.observerNationId)) {
      throw new IntelligenceValidationError(
        `Network entry references unknown observer nation: "${network.observerNationId}"`,
      );
    }

    if (!nationIds.has(network.targetNationId)) {
      throw new IntelligenceValidationError(
        `Network entry references unknown target nation: "${network.targetNationId}"`,
      );
    }

    if (
      !(VALID_NETWORK_LEVELS as readonly string[]).includes(network.level)
    ) {
      throw new InvalidIntelligenceNetworkLevelError(network.level);
    }
  }

  for (const observer of state.world.nations) {
    for (const target of state.world.nations) {
      if (observer.id === target.id) continue;
      const pairKey = `${observer.id}|${target.id}`;
      if (!seenNetworkPairs.has(pairKey)) {
        throw new IntelligenceValidationError(
          `Missing network entry for observer "${observer.id}" / target "${target.id}"`,
        );
      }
    }
  }

  const seenAgentIds = new Set<string>();

  for (const agent of state.intelligence.agents) {
    if (agent.id === "") {
      throw new IntelligenceValidationError("Empty agent ID");
    }

    if (seenAgentIds.has(agent.id)) {
      throw new IntelligenceValidationError(
        `Duplicate agent ID: "${agent.id}"`,
      );
    }
    seenAgentIds.add(agent.id);

    if (agent.codename === "") {
      throw new IntelligenceValidationError(
        `Empty codename for agent: "${agent.id}"`,
      );
    }

    if (!nationIds.has(agent.ownerNationId)) {
      throw new IntelligenceValidationError(
        `Agent "${agent.id}" references unknown owner nation: "${agent.ownerNationId}"`,
      );
    }
  }

  const seenAssetIds = new Set<string>();

  for (const asset of state.intelligence.assets) {
    if (asset.id === "") {
      throw new IntelligenceValidationError("Empty asset ID");
    }

    if (seenAssetIds.has(asset.id)) {
      throw new IntelligenceValidationError(
        `Duplicate asset ID: "${asset.id}"`,
      );
    }
    seenAssetIds.add(asset.id);

    if (!nationIds.has(asset.ownerNationId)) {
      throw new IntelligenceValidationError(
        `Asset "${asset.id}" references unknown owner nation: "${asset.ownerNationId}"`,
      );
    }

    if (!nationIds.has(asset.targetNationId)) {
      throw new IntelligenceValidationError(
        `Asset "${asset.id}" references unknown target nation: "${asset.targetNationId}"`,
      );
    }

    if (asset.ownerNationId === asset.targetNationId) {
      throw new IntelligenceValidationError(
        `Asset "${asset.id}" owner and target are the same nation`,
      );
    }

    if (
      !(VALID_ASSET_ACCESS_VALUES as readonly string[]).includes(asset.access)
    ) {
      throw new IntelligenceValidationError(
        `Invalid asset access for asset "${asset.id}": expected "limited" or "high", got "${asset.access}"`,
      );
    }
  }
}
