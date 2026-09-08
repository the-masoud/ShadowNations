import { describe, it, expect } from "vitest";
import {
  CAMPAIGN_CRISIS_INTERVAL,
  CAMPAIGN_CRISIS_IMPACT,
} from "../../src/core/model/campaignCrisis.js";
import { createInitialGameState } from "../../src/core/model/gameState.js";
import type { GameEvent, CampaignCrisisTriggeredEvent } from "../../src/core/model/gameEvent.js";
import { resolveCampaignTurn } from "../../src/core/simulation/resolveCampaignTurn.js";
import { resolveTurn } from "../../src/core/simulation/resolveTurn.js";
import { createCampaignGameState } from "../../src/core/simulation/createCampaignGameState.js";
import { setNationStrategicStat } from "../../src/core/simulation/setNationStrategicStat.js";
import { getNationStrategicStats } from "../../src/core/model/nationStrategicStats.js";
import { GameStateValidationError } from "../../src/core/simulation/validateGameState.js";
import type { GameState } from "../../src/core/model/gameState.js";

function turnNState(n: number): GameState {
  const s = createInitialGameState();
  return { ...s, turn: n };
}

function requireCampaignCrisisEvent(
  event: GameEvent,
): CampaignCrisisTriggeredEvent {
  if (event.type !== "campaign-crisis-triggered") {
    throw new Error(
      `Expected campaign-crisis-triggered event, got "${event.type}"`,
    );
  }
  return event;
}

describe("resolveCampaignTurn", () => {
  // A — exact constants
  it("A: exact constants", () => {
    expect(CAMPAIGN_CRISIS_INTERVAL).toBe(3);
    expect(CAMPAIGN_CRISIS_IMPACT).toBe(5);
  });

  // B — turn 1 -> 2 has no crisis
  it("B: turn 1 -> 2 has no crisis", () => {
    const state = createInitialGameState();
    const { state: next, result } = resolveCampaignTurn(state, []);
    expect(next.turn).toBe(2);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].type).toBe("turn-advanced");
  });

  // C — turn 2 -> 3 stability crisis
  it("C: turn 2 -> 3 stability crisis", () => {
    const state = turnNState(2);
    const { state: next, result } = resolveCampaignTurn(state, []);
    expect(next.turn).toBe(3);
    expect(result.events).toHaveLength(2);
    expect(result.events[0].type).toBe("turn-advanced");
    const crisis = requireCampaignCrisisEvent(result.events[1]);
    expect(crisis.type).toBe("campaign-crisis-triggered");
    expect(crisis.turn).toBe(3);
    expect(crisis.targetNationId).toBe("solaris");
    expect(crisis.crisis).toBe("stability-shock");
    expect(crisis.strategicStat).toBe("stability");
    expect(crisis.previousValue).toBe(72);
    expect(crisis.newValue).toBe(67);
    const stats = getNationStrategicStats(next.world, "solaris");
    expect(stats.stability).toBe(67);
  });

  // D — turn 5 -> 6 public-support crisis
  it("D: turn 5 -> 6 public-support crisis", () => {
    const state = turnNState(5);
    const { result } = resolveCampaignTurn(state, []);
    expect(result.events).toHaveLength(2);
    const crisis = requireCampaignCrisisEvent(result.events[1]);
    expect(crisis.type).toBe("campaign-crisis-triggered");
    expect(crisis.crisis).toBe("public-support-shock");
    expect(crisis.strategicStat).toBe("publicSupport");
    expect(crisis.previousValue).toBe(68);
    expect(crisis.newValue).toBe(63);
  });

  // E — turn 8 -> 9 security crisis
  it("E: turn 8 -> 9 security crisis", () => {
    const state = turnNState(8);
    const { result } = resolveCampaignTurn(state, []);
    const crisis = requireCampaignCrisisEvent(result.events[1]);
    expect(crisis.crisis).toBe("security-shock");
    expect(crisis.strategicStat).toBe("internalSecurity");
    expect(crisis.previousValue).toBe(66);
    expect(crisis.newValue).toBe(61);
  });

  // F — turn 11 -> 12 cycles to stability
  it("F: turn 11 -> 12 cycles to stability", () => {
    const state = turnNState(11);
    const { result } = resolveCampaignTurn(state, []);
    const crisis = requireCampaignCrisisEvent(result.events[1]);
    expect(crisis.crisis).toBe("stability-shock");
    expect(crisis.strategicStat).toBe("stability");
  });

  // G — alternate player target (dravos)
  it("G: alternate player target (dravos)", () => {
    const state: GameState = createCampaignGameState({ playerNationId: "dravos" });
    const turn2: GameState = { ...state, turn: 2 };
    const { state: next, result } = resolveCampaignTurn(turn2, []);
    const crisis = requireCampaignCrisisEvent(result.events[1]);
    expect(crisis.targetNationId).toBe("dravos");
    const dravosStats = getNationStrategicStats(next.world, "dravos");
    expect(dravosStats.stability).toBe(73);
    const solarisStats = getNationStrategicStats(next.world, "solaris");
    expect(solarisStats.stability).toBe(72);
  });

  // H — clamp at zero
  it("H: clamp at zero", () => {
    const state = turnNState(2);
    const prepared = setNationStrategicStat(state, "solaris", "stability", 3);
    const { state: next, result } = resolveCampaignTurn(prepared, []);
    const crisis = requireCampaignCrisisEvent(result.events[1]);
    expect(crisis.previousValue).toBe(3);
    expect(crisis.newValue).toBe(0);
    const stats = getNationStrategicStats(next.world, "solaris");
    expect(stats.stability).toBe(0);
  });

  // I — already zero still emits
  it("I: already zero still emits", () => {
    const state = turnNState(2);
    const prepared = setNationStrategicStat(state, "solaris", "stability", 0);
    const { result } = resolveCampaignTurn(prepared, []);
    const crisis = requireCampaignCrisisEvent(result.events[1]);
    expect(crisis.type).toBe("campaign-crisis-triggered");
    expect(crisis.previousValue).toBe(0);
    expect(crisis.newValue).toBe(0);
  });

  // J — input immutability
  it("J: input immutability", () => {
    const state = turnNState(2);
    const snapshot = JSON.stringify(state);
    resolveCampaignTurn(state, []);
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  // K — deterministic result
  it("K: deterministic result", () => {
    const a = turnNState(2);
    const b = turnNState(2);
    const ra = resolveCampaignTurn(a, []);
    const rb = resolveCampaignTurn(b, []);
    expect(ra).toEqual(rb);
  });

  // L — validation precedence
  it("L: validation precedence", () => {
    const state: GameState = { ...createInitialGameState(), turn: 0 };
    expect(() => resolveCampaignTurn(state, [])).toThrow(
      GameStateValidationError,
    );
  });

  // M — order forwarding
  it("M: order forwarding", () => {
    const state = turnNState(1);
    const orders = [
      { id: "b-2", nationId: "solaris", kind: "pass" as const },
      { id: "a-1", nationId: "dravos", kind: "pass" as const },
    ];
    const { result } = resolveCampaignTurn(state, orders);
    expect(result.processedOrderIds).toEqual(["a-1", "b-2"]);
  });

  // N — base resolveTurn unchanged
  it("N: base resolveTurn unchanged", () => {
    const state = turnNState(2);
    const { result } = resolveTurn(state, []);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].type).toBe("turn-advanced");
  });
});
