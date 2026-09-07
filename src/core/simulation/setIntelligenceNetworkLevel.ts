import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { IntelligenceNetworkLevel } from "../model/intelligenceNetwork.js";
import type { IntelligenceNetwork } from "../model/intelligenceNetwork.js";
import type { IntelligenceState } from "../model/intelligenceState.js";
import { VALID_NETWORK_LEVELS } from "../model/intelligenceNetwork.js";
import {
  SelfIntelligenceNetworkError,
  MissingIntelligenceNetworkError,
} from "../model/intelligenceState.js";
import { getNationById } from "../model/worldState.js";
import { validateGameState } from "./validateGameState.js";

export class InvalidIntelligenceNetworkLevelError extends Error {
  constructor(level: string) {
    super(
      `Invalid intelligence network level: expected "none", "foothold", "established", or "deep", got "${level}"`,
    );
    this.name = "InvalidIntelligenceNetworkLevelError";
  }
}

export function setIntelligenceNetworkLevel(
  state: Readonly<GameState>,
  observerNationId: NationId,
  targetNationId: NationId,
  level: IntelligenceNetworkLevel,
): GameState {
  getNationById(state.world, observerNationId);
  getNationById(state.world, targetNationId);

  if (observerNationId === targetNationId) {
    throw new SelfIntelligenceNetworkError(observerNationId);
  }

  const existing = state.intelligence.networks.find(
    (n) =>
      n.observerNationId === observerNationId &&
      n.targetNationId === targetNationId,
  );
  if (!existing) {
    throw new MissingIntelligenceNetworkError(
      observerNationId,
      targetNationId,
    );
  }

  if (!(VALID_NETWORK_LEVELS as readonly string[]).includes(level)) {
    throw new InvalidIntelligenceNetworkLevelError(level);
  }

  validateGameState(state);

  if (existing.level === level) {
    return state;
  }

  const newNetwork: IntelligenceNetwork = {
    ...existing,
    level,
  };

  const newIntelligence: IntelligenceState = {
    ...state.intelligence,
    networks: state.intelligence.networks.map((n) =>
      n === existing ? newNetwork : n,
    ),
  };

  return {
    ...state,
    intelligence: newIntelligence,
  };
}
