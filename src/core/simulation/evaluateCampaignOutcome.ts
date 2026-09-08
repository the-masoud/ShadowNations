import type { GameState } from "../model/gameState.js";
import type { CampaignOutcome } from "../model/campaignOutcome.js";
import { STRATEGIC_HEGEMONY_INFLUENCE_THRESHOLD } from "../model/campaignOutcome.js";
import { validateGameState } from "./validateGameState.js";
import { getNationStrategicStats } from "../model/nationStrategicStats.js";
import { getNationInfluence } from "../model/nationInfluence.js";

export function evaluateCampaignOutcome(
  state: Readonly<GameState>,
): CampaignOutcome {
  validateGameState(state);

  const playerNationId = state.playerNationId;
  const stats = getNationStrategicStats(state.world, playerNationId);

  if (stats.stability === 0) {
    return { status: "defeat", reason: "stability-collapse" };
  }

  if (stats.publicSupport === 0) {
    return { status: "defeat", reason: "public-support-collapse" };
  }

  if (stats.internalSecurity === 0) {
    return { status: "defeat", reason: "internal-security-collapse" };
  }

  const foreignNations = state.world.nations.filter(
    (n) => n.id !== playerNationId,
  );

  if (foreignNations.length === 0) {
    return { status: "ongoing" };
  }

  for (const foreign of foreignNations) {
    const influence = getNationInfluence(
      state.world,
      playerNationId,
      foreign.id,
    );
    if (influence.value < STRATEGIC_HEGEMONY_INFLUENCE_THRESHOLD) {
      return { status: "ongoing" };
    }
  }

  return { status: "victory", reason: "strategic-hegemony" };
}
