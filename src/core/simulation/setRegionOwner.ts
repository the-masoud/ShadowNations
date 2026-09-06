import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { RegionId } from "../model/region.js";
import type { WorldState } from "../model/worldState.js";
import type { RegionOwnership } from "../model/regionOwnership.js";
import { getRegionById } from "../model/strategicMap.js";
import { getNationById } from "../model/worldState.js";
import { getRegionOwnership } from "../model/regionOwnership.js";
import { validateGameState } from "./validateGameState.js";

export function setRegionOwner(
  state: Readonly<GameState>,
  regionId: RegionId,
  newOwnerNationId: NationId,
): GameState {
  validateGameState(state);

  getRegionById(state.world.map, regionId);
  getNationById(state.world, newOwnerNationId);
  getRegionOwnership(state.world, regionId);

  const currentOwner = state.world.regionOwnership.find(
    (o) => o.regionId === regionId,
  )!;

  if (currentOwner.ownerNationId === newOwnerNationId) {
    return state;
  }

  const newOwnership: readonly RegionOwnership[] =
    state.world.regionOwnership.map((o) =>
      o.regionId === regionId ? { ...o, ownerNationId: newOwnerNationId } : o,
    );

  const newWorld: WorldState = {
    ...state.world,
    regionOwnership: newOwnership,
  };

  const newState: GameState = {
    ...state,
    world: newWorld,
  };

  validateGameState(newState);

  return newState;
}
