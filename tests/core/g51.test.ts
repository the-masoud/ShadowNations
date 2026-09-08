import { describe, it, expect } from "vitest";
import { createInitialGameState } from "../../src/core/model/gameState.js";
import type { GameState } from "../../src/core/model/gameState.js";
import {
  STRATEGIC_HEGEMONY_INFLUENCE_THRESHOLD,
  NATIONAL_COLLAPSE_THRESHOLD,
} from "../../src/core/model/campaignOutcome.js";
import { evaluateCampaignOutcome } from "../../src/core/simulation/evaluateCampaignOutcome.js";
import { setNationStrategicStat } from "../../src/core/simulation/setNationStrategicStat.js";
import { setNationInfluence } from "../../src/core/simulation/setNationInfluence.js";
import { GameStateValidationError } from "../../src/core/simulation/validateGameState.js";

describe("evaluateCampaignOutcome", () => {
  // A — Constants
  it("A: exact constants", () => {
    expect(STRATEGIC_HEGEMONY_INFLUENCE_THRESHOLD).toBe(75);
    expect(NATIONAL_COLLAPSE_THRESHOLD).toBe(0);
  });

  // B — Initial state is ongoing
  it("B: initial state returns ongoing", () => {
    const state = createInitialGameState();
    expect(evaluateCampaignOutcome(state)).toEqual({ status: "ongoing" });
  });

  // C — Stability collapse
  it("C: stability collapse defeat", () => {
    let state = createInitialGameState();
    state = setNationStrategicStat(state, "solaris", "stability", 0);
    expect(evaluateCampaignOutcome(state)).toEqual({
      status: "defeat",
      reason: "stability-collapse",
    });
  });

  // D — Public-support collapse
  it("D: public-support collapse defeat", () => {
    let state = createInitialGameState();
    state = setNationStrategicStat(state, "solaris", "stability", 50);
    state = setNationStrategicStat(state, "solaris", "publicSupport", 0);
    expect(evaluateCampaignOutcome(state)).toEqual({
      status: "defeat",
      reason: "public-support-collapse",
    });
  });

  // E — Internal-security collapse
  it("E: internal-security collapse defeat", () => {
    let state = createInitialGameState();
    state = setNationStrategicStat(state, "solaris", "stability", 50);
    state = setNationStrategicStat(state, "solaris", "publicSupport", 50);
    state = setNationStrategicStat(state, "solaris", "internalSecurity", 0);
    expect(evaluateCampaignOutcome(state)).toEqual({
      status: "defeat",
      reason: "internal-security-collapse",
    });
  });

  // F — Collapse reason precedence
  it("F: all-zero stats returns stability-collapse", () => {
    let state = createInitialGameState();
    state = setNationStrategicStat(state, "solaris", "stability", 0);
    state = setNationStrategicStat(state, "solaris", "publicSupport", 0);
    state = setNationStrategicStat(state, "solaris", "internalSecurity", 0);
    expect(evaluateCampaignOutcome(state)).toEqual({
      status: "defeat",
      reason: "stability-collapse",
    });
  });

  // G — Defeat overrides victory
  it("G: defeat overrides victory", () => {
    let state = createInitialGameState();
    state = setNationStrategicStat(state, "solaris", "stability", 0);
    const foreign = state.world.nations.filter((n) => n.id !== "solaris");
    for (const f of foreign) {
      state = setNationInfluence(state, "solaris", f.id, 75);
    }
    expect(evaluateCampaignOutcome(state)).toEqual({
      status: "defeat",
      reason: "stability-collapse",
    });
  });

  // H — Exact-threshold victory
  it("H: exact-threshold victory", () => {
    let state = createInitialGameState();
    const foreign = state.world.nations.filter((n) => n.id !== "solaris");
    for (const f of foreign) {
      state = setNationInfluence(state, "solaris", f.id, 75);
    }
    expect(evaluateCampaignOutcome(state)).toEqual({
      status: "victory",
      reason: "strategic-hegemony",
    });
  });

  // I — One target below threshold
  it("I: one target below threshold returns ongoing", () => {
    let state = createInitialGameState();
    const foreign = state.world.nations.filter((n) => n.id !== "solaris");
    for (let i = 0; i < foreign.length; i++) {
      state = setNationInfluence(state, "solaris", foreign[i].id, i === 0 ? 74 : 75);
    }
    expect(evaluateCampaignOutcome(state)).toEqual({ status: "ongoing" });
  });

  // J — Above-threshold victory
  it("J: above-threshold victory with 100 included", () => {
    let state = createInitialGameState();
    const foreign = state.world.nations.filter((n) => n.id !== "solaris");
    for (let i = 0; i < foreign.length; i++) {
      state = setNationInfluence(state, "solaris", foreign[i].id, i === 0 ? 100 : 80);
    }
    expect(evaluateCampaignOutcome(state)).toEqual({
      status: "victory",
      reason: "strategic-hegemony",
    });
  });

  // K — Alternate player nation
  it("K: alternate player (dravos) victory", () => {
    let state: GameState = {
      ...createInitialGameState(),
      playerNationId: "dravos",
    };
    const foreign = state.world.nations.filter((n) => n.id !== "dravos");
    for (const f of foreign) {
      state = setNationInfluence(state, "dravos", f.id, 75);
    }
    expect(evaluateCampaignOutcome(state)).toEqual({
      status: "victory",
      reason: "strategic-hegemony",
    });
  });

  // L — Validation precedence
  it("L: throws GameStateValidationError for invalid state", () => {
    const invalid = { ...createInitialGameState(), turn: 0 };
    expect(() => evaluateCampaignOutcome(invalid)).toThrow(
      GameStateValidationError,
    );
  });

  // M — Input immutability
  it("M: evaluator does not mutate input state", () => {
    const state = createInitialGameState();
    const before = JSON.stringify(state);
    evaluateCampaignOutcome(state);
    expect(JSON.stringify(state)).toBe(before);
  });

  // N — Freshness
  it("N: fresh outcome objects for identical input", () => {
    const state = createInitialGameState();
    const a = evaluateCampaignOutcome(state);
    const b = evaluateCampaignOutcome(state);
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });
});
