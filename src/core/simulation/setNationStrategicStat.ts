import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type {
  NationStrategicStatKey,
  NationStrategicStats,
} from "../model/nationStrategicStats.js";
import {
  getNationStrategicStats,
  VALID_STRATEGIC_STAT_KEYS,
} from "../model/nationStrategicStats.js";
import { UnknownNationError } from "../model/worldState.js";
import { validateGameState } from "./validateGameState.js";

export { MissingNationStrategicStatsError } from "../model/nationStrategicStats.js";

export class InvalidNationStrategicStatKeyError extends Error {
  constructor(statKey: string) {
    super(`Invalid nation strategic stat key: "${statKey}"`);
    this.name = "InvalidNationStrategicStatKeyError";
  }
}

export class InvalidNationStrategicStatValueError extends Error {
  constructor(nationId: NationId, statKey: string, value: number) {
    super(
      `Invalid strategic stat value for nation "${nationId}" stat "${statKey}": expected integer 0..100, got ${value}`,
    );
    this.name = "InvalidNationStrategicStatValueError";
  }
}

export function setNationStrategicStat(
  state: Readonly<GameState>,
  nationId: NationId,
  stat: NationStrategicStatKey,
  value: number,
): GameState {
  const nation = state.world.nations.find((n) => n.id === nationId);
  if (!nation) {
    throw new UnknownNationError(nationId);
  }

  const currentStats = getNationStrategicStats(state.world, nationId);

  if (!(VALID_STRATEGIC_STAT_KEYS as readonly string[]).includes(stat)) {
    throw new InvalidNationStrategicStatKeyError(stat);
  }

  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new InvalidNationStrategicStatValueError(nationId, stat, value);
  }

  validateGameState(state);

  if (currentStats[stat] === value) {
    return state;
  }

  const updatedStats: NationStrategicStats = {
    ...currentStats,
    [stat]: value,
  };

  const newNationStrategicStats = state.world.nationStrategicStats.map((s) =>
    s.nationId === nationId ? updatedStats : s,
  );

  return {
    ...state,
    world: {
      ...state.world,
      nationStrategicStats: newNationStrategicStats,
    },
  };
}
