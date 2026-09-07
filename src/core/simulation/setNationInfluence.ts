import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { NationInfluence } from "../model/nationInfluence.js";
import {
  getNationInfluence,
  SelfNationInfluenceError,
} from "../model/nationInfluence.js";
import { UnknownNationError } from "../model/worldState.js";
import { validateGameState } from "./validateGameState.js";

export { SelfNationInfluenceError, MissingNationInfluenceError } from "../model/nationInfluence.js";

export class InvalidNationInfluenceValueError extends Error {
  constructor(
    influencerNationId: NationId,
    targetNationId: NationId,
    value: number,
  ) {
    super(
      `Invalid influence value for pair "${influencerNationId}" -> "${targetNationId}": expected integer 0..100, got ${value}`,
    );
    this.name = "InvalidNationInfluenceValueError";
  }
}

export function setNationInfluence(
  state: Readonly<GameState>,
  influencerNationId: NationId,
  targetNationId: NationId,
  value: number,
): GameState {
  const influencerNation = state.world.nations.find(
    (n) => n.id === influencerNationId,
  );
  if (!influencerNation) {
    throw new UnknownNationError(influencerNationId);
  }

  const targetNation = state.world.nations.find(
    (n) => n.id === targetNationId,
  );
  if (!targetNation) {
    throw new UnknownNationError(targetNationId);
  }

  if (influencerNationId === targetNationId) {
    throw new SelfNationInfluenceError(influencerNationId);
  }

  const currentEntry = getNationInfluence(
    state.world,
    influencerNationId,
    targetNationId,
  );

  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new InvalidNationInfluenceValueError(
      influencerNationId,
      targetNationId,
      value,
    );
  }

  validateGameState(state);

  if (currentEntry.value === value) {
    return state;
  }

  const updatedEntry: NationInfluence = {
    ...currentEntry,
    value,
  };

  const newNationInfluence = state.world.nationInfluence.map((e) =>
    e.influencerNationId === influencerNationId &&
    e.targetNationId === targetNationId
      ? updatedEntry
      : e,
  );

  return {
    ...state,
    world: {
      ...state.world,
      nationInfluence: newNationInfluence,
    },
  };
}
