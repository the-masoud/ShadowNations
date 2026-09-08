import type { GameState } from "../model/gameState.js";
import type { CampaignSetup } from "../model/campaignSetup.js";
import { createInitialGameState } from "../model/gameState.js";
import { getNationById } from "../model/worldState.js";
import { validateGameState } from "./validateGameState.js";

export function createCampaignGameState(
  setup: Readonly<CampaignSetup>,
): GameState {
  const initial = createInitialGameState();
  getNationById(initial.world, setup.playerNationId);

  const state: GameState = {
    ...initial,
    playerNationId: setup.playerNationId,
  };

  validateGameState(state);
  return state;
}
