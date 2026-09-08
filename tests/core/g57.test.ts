import { describe, it, expect } from "vitest";
import { createCampaignGameState } from "../../src/core/simulation/createCampaignGameState.js";
import {
  cultivatePoliticalInfluence,
  CULTIVATE_POLITICAL_INFLUENCE_AP_COST,
  POLITICAL_INFLUENCE_GAIN,
} from "../../src/core/simulation/cultivatePoliticalInfluence.js";
import { evaluateCampaignOutcome } from "../../src/core/simulation/evaluateCampaignOutcome.js";
import { resolveCampaignTurn } from "../../src/core/simulation/resolveCampaignTurn.js";
import {
  getNationActionPoints,
  ACTION_POINTS_PER_TURN,
} from "../../src/core/model/actionPoints.js";
import { getNationInfluence } from "../../src/core/model/nationInfluence.js";
import {
  getNationStrategicStats,
} from "../../src/core/model/nationStrategicStats.js";
import {
  STRATEGIC_HEGEMONY_INFLUENCE_THRESHOLD,
  NATIONAL_COLLAPSE_THRESHOLD,
} from "../../src/core/model/campaignOutcome.js";
import {
  CAMPAIGN_CRISIS_INTERVAL,
  CAMPAIGN_CRISIS_IMPACT,
} from "../../src/core/model/campaignCrisis.js";

const CANONICAL_NATIONS = [
  "solaris",
  "dravos",
  "norvia",
  "veloria",
  "karsen",
  "arkania",
] as const;

interface BalanceRunResult {
  readonly playerNationId: string;
  readonly cultivateOperationCount: number;
  readonly victoryTurn: number;
  readonly crisisCount: number;
  readonly finalStability: number;
  readonly finalPublicSupport: number;
  readonly finalInternalSecurity: number;
}

function runBalanceReferencePath(
  playerNationId: string,
): BalanceRunResult {
  let state = createCampaignGameState({ playerNationId });

  const initialOutcome = evaluateCampaignOutcome(state);
  expect(initialOutcome).toEqual({ status: "ongoing" });

  let cultivateOperationCount = 0;
  let crisisCount = 0;

  while (true) {
    if (state.turn > 12) {
      throw new Error("Balance reference path exceeded turn 12.");
    }

    const ap = getNationActionPoints(state, playerNationId);
    const foreignNations = state.world.nations.filter(
      (n) => n.id !== playerNationId,
    );

    let targetNationId: string | null = null;
    for (const foreign of foreignNations) {
      const influence = getNationInfluence(
        state.world,
        playerNationId,
        foreign.id,
      );
      if (influence.value < STRATEGIC_HEGEMONY_INFLUENCE_THRESHOLD) {
        targetNationId = foreign.id;
        break;
      }
    }

    if (
      targetNationId !== null &&
      ap.remaining >= CULTIVATE_POLITICAL_INFLUENCE_AP_COST
    ) {
      const result = cultivatePoliticalInfluence(
        state,
        playerNationId,
        targetNationId,
      );
      state = result.state;
      cultivateOperationCount++;

      const outcome = evaluateCampaignOutcome(state);
      if (outcome.status === "victory") {
        const stats = getNationStrategicStats(
          state.world,
          playerNationId,
        );
        return {
          playerNationId,
          cultivateOperationCount,
          victoryTurn: state.turn,
          crisisCount,
          finalStability: stats.stability,
          finalPublicSupport: stats.publicSupport,
          finalInternalSecurity: stats.internalSecurity,
        };
      }

      if (outcome.status === "defeat") {
        throw new Error(
          `Unexpected defeat for ${playerNationId} at turn ${state.turn}.`,
        );
      }
    } else {
      const turnResult = resolveCampaignTurn(state, []);
      state = turnResult.state;

      for (const event of turnResult.result.events) {
        if (event.type === "campaign-crisis-triggered") {
          crisisCount++;
        }
      }

      const outcome = evaluateCampaignOutcome(state);
      if (outcome.status === "victory") {
        const stats = getNationStrategicStats(
          state.world,
          playerNationId,
        );
        return {
          playerNationId,
          cultivateOperationCount,
          victoryTurn: state.turn,
          crisisCount,
          finalStability: stats.stability,
          finalPublicSupport: stats.publicSupport,
          finalInternalSecurity: stats.internalSecurity,
        };
      }

      if (outcome.status === "defeat") {
        throw new Error(
          `Unexpected defeat for ${playerNationId} at turn ${state.turn}.`,
        );
      }
    }
  }
}

describe("G5.7 balance verification", () => {
  // A — accepted balance constants
  it("A: accepted balance constants", () => {
    expect(ACTION_POINTS_PER_TURN).toBe(6);
    expect(CULTIVATE_POLITICAL_INFLUENCE_AP_COST).toBe(2);
    expect(POLITICAL_INFLUENCE_GAIN).toBe(10);
    expect(STRATEGIC_HEGEMONY_INFLUENCE_THRESHOLD).toBe(75);
    expect(NATIONAL_COLLAPSE_THRESHOLD).toBe(0);
    expect(CAMPAIGN_CRISIS_INTERVAL).toBe(3);
    expect(CAMPAIGN_CRISIS_IMPACT).toBe(5);
  });

  // B — all six initial campaigns are ongoing
  it("B: all six initial campaigns are ongoing", () => {
    for (const nationId of CANONICAL_NATIONS) {
      const state = createCampaignGameState({ playerNationId: nationId });
      const outcome = evaluateCampaignOutcome(state);
      expect(outcome).toEqual({ status: "ongoing" });
    }
  });

  // C — exact cultivate-operation counts
  it("C: exact cultivate-operation counts", () => {
    const results = CANONICAL_NATIONS.map((n) =>
      runBalanceReferencePath(n),
    );
    expect(results.find((r) => r.playerNationId === "solaris")!.cultivateOperationCount).toBe(24);
    expect(results.find((r) => r.playerNationId === "dravos")!.cultivateOperationCount).toBe(24);
    expect(results.find((r) => r.playerNationId === "norvia")!.cultivateOperationCount).toBe(25);
    expect(results.find((r) => r.playerNationId === "veloria")!.cultivateOperationCount).toBe(22);
    expect(results.find((r) => r.playerNationId === "karsen")!.cultivateOperationCount).toBe(25);
    expect(results.find((r) => r.playerNationId === "arkania")!.cultivateOperationCount).toBe(23);
  });

  // D — exact victory turns
  it("D: exact victory turns", () => {
    const results = CANONICAL_NATIONS.map((n) =>
      runBalanceReferencePath(n),
    );
    expect(results.find((r) => r.playerNationId === "solaris")!.victoryTurn).toBe(8);
    expect(results.find((r) => r.playerNationId === "dravos")!.victoryTurn).toBe(8);
    expect(results.find((r) => r.playerNationId === "norvia")!.victoryTurn).toBe(9);
    expect(results.find((r) => r.playerNationId === "veloria")!.victoryTurn).toBe(8);
    expect(results.find((r) => r.playerNationId === "karsen")!.victoryTurn).toBe(9);
    expect(results.find((r) => r.playerNationId === "arkania")!.victoryTurn).toBe(8);
  });

  // E — victory-turn spread
  it("E: victory-turn spread", () => {
    const results = CANONICAL_NATIONS.map((n) =>
      runBalanceReferencePath(n),
    );
    const turns = results.map((r) => r.victoryTurn);
    const min = Math.min(...turns);
    const max = Math.max(...turns);
    expect(min).toBe(8);
    expect(max).toBe(9);
    expect(max - min).toBe(1);
  });

  // F — exact crisis exposure
  it("F: exact crisis exposure", () => {
    const results = CANONICAL_NATIONS.map((n) =>
      runBalanceReferencePath(n),
    );
    expect(results.find((r) => r.playerNationId === "solaris")!.crisisCount).toBe(2);
    expect(results.find((r) => r.playerNationId === "dravos")!.crisisCount).toBe(2);
    expect(results.find((r) => r.playerNationId === "norvia")!.crisisCount).toBe(3);
    expect(results.find((r) => r.playerNationId === "veloria")!.crisisCount).toBe(2);
    expect(results.find((r) => r.playerNationId === "karsen")!.crisisCount).toBe(3);
    expect(results.find((r) => r.playerNationId === "arkania")!.crisisCount).toBe(2);
  });

  // G — final strategic safety
  it("G: final strategic safety", () => {
    const results = CANONICAL_NATIONS.map((n) =>
      runBalanceReferencePath(n),
    );

    const solaris = results.find((r) => r.playerNationId === "solaris")!;
    expect(solaris.finalStability).toBe(67);
    expect(solaris.finalPublicSupport).toBe(63);
    expect(solaris.finalInternalSecurity).toBe(66);

    const dravos = results.find((r) => r.playerNationId === "dravos")!;
    expect(dravos.finalStability).toBe(73);
    expect(dravos.finalPublicSupport).toBe(50);
    expect(dravos.finalInternalSecurity).toBe(82);

    const norvia = results.find((r) => r.playerNationId === "norvia")!;
    expect(norvia.finalStability).toBe(53);
    expect(norvia.finalPublicSupport).toBe(69);
    expect(norvia.finalInternalSecurity).toBe(47);

    const veloria = results.find((r) => r.playerNationId === "veloria")!;
    expect(veloria.finalStability).toBe(65);
    expect(veloria.finalPublicSupport).toBe(64);
    expect(veloria.finalInternalSecurity).toBe(60);

    const karsen = results.find((r) => r.playerNationId === "karsen")!;
    expect(karsen.finalStability).toBe(59);
    expect(karsen.finalPublicSupport).toBe(52);
    expect(karsen.finalInternalSecurity).toBe(71);

    const arkania = results.find((r) => r.playerNationId === "arkania")!;
    expect(arkania.finalStability).toBe(56);
    expect(arkania.finalPublicSupport).toBe(57);
    expect(arkania.finalInternalSecurity).toBe(58);

    for (const r of results) {
      expect(r.finalStability).toBeGreaterThan(0);
      expect(r.finalPublicSupport).toBeGreaterThan(0);
      expect(r.finalInternalSecurity).toBeGreaterThan(0);
    }
  });

  // H — deterministic balance runs
  it("H: deterministic balance runs", () => {
    const run1 = CANONICAL_NATIONS.map((n) =>
      runBalanceReferencePath(n),
    );
    const run2 = CANONICAL_NATIONS.map((n) =>
      runBalanceReferencePath(n),
    );
    expect(run1).toEqual(run2);
  });
});
