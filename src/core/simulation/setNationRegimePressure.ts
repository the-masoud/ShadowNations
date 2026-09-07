import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import {
  getNationRegimePressure,
  SelfNationRegimePressureError,
  InvalidNationRegimePressureValueError,
} from "../model/nationRegimePressure.js";
import { UnknownNationError } from "../model/worldState.js";
import { validateGameState } from "./validateGameState.js";

export {
  SelfNationRegimePressureError,
  InvalidNationRegimePressureValueError,
  MissingNationRegimePressureError,
} from "../model/nationRegimePressure.js";

export function setNationRegimePressure(
  state: Readonly<GameState>,
  sourceNationId: NationId,
  targetNationId: NationId,
  value: number,
): GameState {
  const sourceNation = state.world.nations.find((n) => n.id === sourceNationId);
  if (!sourceNation) {
    throw new UnknownNationError(sourceNationId);
  }

  const targetNation = state.world.nations.find((n) => n.id === targetNationId);
  if (!targetNation) {
    throw new UnknownNationError(targetNationId);
  }

  if (sourceNationId === targetNationId) {
    throw new SelfNationRegimePressureError(sourceNationId);
  }

  const currentEntry = getNationRegimePressure(
    state.world,
    sourceNationId,
    targetNationId,
  );

  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new InvalidNationRegimePressureValueError(
      sourceNationId,
      targetNationId,
      value,
    );
  }

  validateGameState(state);

  if (currentEntry.value === value) {
    return state;
  }

  const updatedEntry = {
    ...currentEntry,
    value,
  };

  const newNationRegimePressure = state.world.nationRegimePressure.map((e) =>
    e.sourceNationId === sourceNationId && e.targetNationId === targetNationId
      ? updatedEntry
      : e,
  );

  const result: GameState = {
    ...state,
    world: {
      ...state.world,
      nationRegimePressure: newNationRegimePressure,
    },
  };

  validateGameState(result);

  return result;
}
