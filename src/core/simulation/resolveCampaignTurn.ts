import type { GameState } from "../model/gameState.js";
import type { TurnOrder } from "../model/turnOrder.js";
import type { TurnResult } from "../model/turnResult.js";
import type { CampaignCrisisKind } from "../model/campaignCrisis.js";
import type { NationStrategicStatKey } from "../model/nationStrategicStats.js";
import {
  CAMPAIGN_CRISIS_INTERVAL,
  CAMPAIGN_CRISIS_IMPACT,
} from "../model/campaignCrisis.js";
import { getNationStrategicStats } from "../model/nationStrategicStats.js";
import { resolveTurn } from "./resolveTurn.js";
import { validateGameState } from "./validateGameState.js";
import { setNationStrategicStat } from "./setNationStrategicStat.js";

const CRISIS_CYCLE: readonly {
  crisis: CampaignCrisisKind;
  strategicStat: NationStrategicStatKey;
}[] = [
  { crisis: "stability-shock", strategicStat: "stability" },
  { crisis: "public-support-shock", strategicStat: "publicSupport" },
  { crisis: "security-shock", strategicStat: "internalSecurity" },
];

export function resolveCampaignTurn(
  state: Readonly<GameState>,
  orders: readonly TurnOrder[],
): {
  readonly state: GameState;
  readonly result: TurnResult;
} {
  validateGameState(state);
  const base = resolveTurn(state, orders);
  const nextTurn = base.state.turn;

  if (nextTurn % CAMPAIGN_CRISIS_INTERVAL !== 0) {
    return base;
  }

  const crisisNumber = nextTurn / CAMPAIGN_CRISIS_INTERVAL;
  const cycleIndex = (crisisNumber - 1) % 3;
  const { crisis, strategicStat } = CRISIS_CYCLE[cycleIndex];

  const playerNationId = base.state.playerNationId;
  const stats = getNationStrategicStats(base.state.world, playerNationId);
  const previousValue = stats[strategicStat];
  const newValue = Math.max(0, previousValue - CAMPAIGN_CRISIS_IMPACT);

  const newState = setNationStrategicStat(
    base.state,
    playerNationId,
    strategicStat,
    newValue,
  );

  const crisisEvent = {
    type: "campaign-crisis-triggered" as const,
    turn: nextTurn,
    targetNationId: playerNationId,
    crisis,
    strategicStat,
    previousValue,
    newValue,
  };

  const result: TurnResult = {
    previousTurn: base.result.previousTurn,
    nextTurn: base.result.nextTurn,
    processedOrderIds: base.result.processedOrderIds,
    events: [...base.result.events, crisisEvent],
  };

  return { state: newState, result };
}
