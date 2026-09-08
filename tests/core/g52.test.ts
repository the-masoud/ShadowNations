import { describe, it, expect } from "vitest";
import { createCampaignGameState } from "../../src/core/simulation/createCampaignGameState.js";
import { evaluateCampaignOutcome } from "../../src/core/simulation/evaluateCampaignOutcome.js";
import { validateGameState } from "../../src/core/simulation/validateGameState.js";
import { getNationVisibility } from "../../src/core/model/intelligenceVisibility.js";
import { getIntelligenceNetwork } from "../../src/core/model/intelligenceState.js";
import { UnknownNationError } from "../../src/core/model/worldState.js";

const ALL_NATION_IDS = [
  "solaris",
  "dravos",
  "norvia",
  "veloria",
  "karsen",
  "arkania",
] as const;

describe("createCampaignGameState", () => {
  // A — Solaris campaign creation
  it("A: solaris campaign creation", () => {
    const state = createCampaignGameState({ playerNationId: "solaris" });
    expect(state.turn).toBe(1);
    expect(state.phase).toBe("planning");
    expect(state.playerNationId).toBe("solaris");
  });

  // B — All six canonical nations selectable
  it("B: all six canonical nations selectable", () => {
    for (const nationId of ALL_NATION_IDS) {
      const state = createCampaignGameState({ playerNationId: nationId });
      expect(state.playerNationId).toBe(nationId);
      expect(() => validateGameState(state)).not.toThrow();
    }
  });

  // C — Alternate player Dravos
  it("C: dravos campaign creation", () => {
    const state = createCampaignGameState({ playerNationId: "dravos" });
    expect(state.turn).toBe(1);
    expect(state.phase).toBe("planning");
    expect(state.playerNationId).toBe("dravos");
  });

  // D — AP invariants
  it("D: AP invariants for non-solaris player", () => {
    const state = createCampaignGameState({ playerNationId: "dravos" });
    for (const ap of state.planning.actionPoints) {
      expect(ap.maximum).toBe(6);
      expect(ap.remaining).toBe(6);
    }
  });

  // E — Intelligence invariants
  it("E: intelligence invariants for selected player", () => {
    const state = createCampaignGameState({ playerNationId: "dravos" });
    const selfVis = getNationVisibility(state, "dravos", "dravos");
    expect(selfVis).toBe("known");
    for (const foreign of state.world.nations) {
      if (foreign.id === "dravos") continue;
      const vis = getNationVisibility(state, "dravos", foreign.id);
      expect(vis).toBe("unknown");
      const net = getIntelligenceNetwork(state, "dravos", foreign.id);
      expect(net.level).toBe("none");
    }
    expect(state.intelligence.assets.length).toBe(0);
    expect(state.intelligence.doubleAgents.length).toBe(0);
  });

  // F — Initial campaign outcome ongoing for all six
  it("F: initial campaign outcome ongoing for all six", () => {
    for (const nationId of ALL_NATION_IDS) {
      const state = createCampaignGameState({ playerNationId: nationId });
      expect(evaluateCampaignOutcome(state)).toEqual({ status: "ongoing" });
    }
  });

  // G — Unknown nation
  it("G: unknown nation throws UnknownNationError", () => {
    expect(() =>
      createCampaignGameState({ playerNationId: "unknown-nation" }),
    ).toThrow(UnknownNationError);
  });

  // H — Setup immutability
  it("H: setup immutability", () => {
    const setup = { playerNationId: "dravos" as const };
    const before = JSON.stringify(setup);
    createCampaignGameState(setup);
    expect(JSON.stringify(setup)).toBe(before);
  });

  // I — Deterministic freshness
  it("I: deterministic freshness", () => {
    const setup = { playerNationId: "solaris" as const };
    const a = createCampaignGameState(setup);
    const b = createCampaignGameState(setup);
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(a.world).not.toBe(b.world);
    expect(a.planning).not.toBe(b.planning);
    expect(a.intelligence).not.toBe(b.intelligence);
  });

  // J — Campaign isolation
  it("J: campaign isolation", () => {
    const dravosState = createCampaignGameState({ playerNationId: "dravos" });
    const solarisState = createCampaignGameState({ playerNationId: "solaris" });
    expect(solarisState.playerNationId).toBe("solaris");
    expect(dravosState.playerNationId).toBe("dravos");
    expect(solarisState.turn).toBe(1);
    expect(solarisState.phase).toBe("planning");
  });
});
