import { describe, it, expect } from "vitest";
import {
  buildIntelligenceNetwork,
  SelfTargetEspionageOperationError,
  AgentOwnershipError,
  MaximumIntelligenceNetworkLevelError,
  BUILD_NETWORK_AP_COST,
} from "../../src/core/simulation/buildIntelligenceNetwork";
import {
  gatherIntelligence,
  IntelligenceAlreadyKnownError,
  InsufficientIntelligenceNetworkError,
  GATHER_INTELLIGENCE_AP_COST,
} from "../../src/core/simulation/gatherIntelligence";
import {
  recruitIntelligenceAsset,
  EmptyAssetIdError,
  DuplicateSuppliedAssetIdError,
  RECRUIT_ASSET_AP_COST,
} from "../../src/core/simulation/recruitIntelligenceAsset";
import { getNationActionPoints } from "../../src/core/model/actionPoints";
import { getNationVisibility } from "../../src/core/model/intelligenceVisibility";
import { getIntelligenceNetwork } from "../../src/core/model/intelligenceState";
import { createInitialGameState } from "../../src/core/model/gameState";
import type { GameState } from "../../src/core/model/gameState";
import { validateGameState } from "../../src/core/simulation/validateGameState";
import { resolveTurn } from "../../src/core/simulation/resolveTurn";
import type { TurnOrder } from "../../src/core/model/turnOrder";
import { UnknownNationError } from "../../src/core/model/worldState";
import { InvalidPhaseError } from "../../src/core/simulation/resolveTurn";
import { InsufficientActionPointsError, spendActionPoints } from "../../src/core/simulation/spendActionPoints";
import { resetActionPointsForNewTurn } from "../../src/core/simulation/resetActionPointsForNewTurn";

function validState(): GameState {
  return createInitialGameState();
}

function passOrder(id: string, nationId = "solaris"): TurnOrder {
  return { id, nationId, kind: "pass" };
}

describe("BUILD NETWORK", () => {
  it("none -> foothold", () => {
    const state = validState();
    const next = buildIntelligenceNetwork(
      state,
      "solaris",
      "dravos",
      "solaris-echo",
    );
    const net = getIntelligenceNetwork(next, "solaris", "dravos");
    expect(net.level).toBe("foothold");
  });

  it("foothold -> established", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    const next = buildIntelligenceNetwork(
      state,
      "solaris",
      "dravos",
      "solaris-echo",
    );
    const net = getIntelligenceNetwork(next, "solaris", "dravos");
    expect(net.level).toBe("established");
  });

  it("established -> deep", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    const next = buildIntelligenceNetwork(
      state,
      "solaris",
      "dravos",
      "solaris-echo",
    );
    const net = getIntelligenceNetwork(next, "solaris", "dravos");
    expect(net.level).toBe("deep");
  });

  it("deep fails", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    expect(() =>
      buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo"),
    ).toThrow(MaximumIntelligenceNetworkLevelError);
  });

  it("exact 2 AP cost", () => {
    const state = validState();
    const before = getNationActionPoints(state, "solaris");
    const next = buildIntelligenceNetwork(
      state,
      "solaris",
      "dravos",
      "solaris-echo",
    );
    const after = getNationActionPoints(next, "solaris");
    expect(before.remaining - after.remaining).toBe(BUILD_NETWORK_AP_COST);
  });

  it("failure spends no AP", () => {
    const state = validState();
    expect(() =>
      buildIntelligenceNetwork(state, "solaris", "solaris", "solaris-echo"),
    ).toThrow();
    const after = getNationActionPoints(state, "solaris");
    expect(after.remaining).toBe(6);
  });
});

describe("GATHER INTELLIGENCE", () => {
  it("unknown + none fails", () => {
    const state = validState();
    expect(() =>
      gatherIntelligence(state, "solaris", "dravos", "solaris-echo"),
    ).toThrow(InsufficientIntelligenceNetworkError);
  });

  it("unknown + foothold -> limited", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    const next = gatherIntelligence(
      state,
      "solaris",
      "dravos",
      "solaris-echo",
    );
    expect(getNationVisibility(next, "solaris", "dravos")).toBe("limited");
  });

  it("limited + foothold fails", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    state = gatherIntelligence(state, "solaris", "dravos", "solaris-echo");
    expect(() =>
      gatherIntelligence(state, "solaris", "dravos", "solaris-echo"),
    ).toThrow(InsufficientIntelligenceNetworkError);
  });

  it("limited + established -> known", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    state = gatherIntelligence(state, "solaris", "dravos", "solaris-echo");
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    const next = gatherIntelligence(
      state,
      "solaris",
      "dravos",
      "solaris-echo",
    );
    expect(getNationVisibility(next, "solaris", "dravos")).toBe("known");
  });

  it("known fails", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    state = gatherIntelligence(state, "solaris", "dravos", "solaris-echo");
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    state = gatherIntelligence(state, "solaris", "dravos", "solaris-echo");
    expect(() =>
      gatherIntelligence(state, "solaris", "dravos", "solaris-echo"),
    ).toThrow(IntelligenceAlreadyKnownError);
  });

  it("exact 1 AP cost", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    const before = getNationActionPoints(state, "solaris");
    const next = gatherIntelligence(
      state,
      "solaris",
      "dravos",
      "solaris-echo",
    );
    const after = getNationActionPoints(next, "solaris");
    expect(before.remaining - after.remaining).toBe(GATHER_INTELLIGENCE_AP_COST);
  });

  it("failure spends no AP", () => {
    const state = validState();
    expect(() =>
      gatherIntelligence(state, "solaris", "dravos", "solaris-echo"),
    ).toThrow();
    expect(getNationActionPoints(state, "solaris").remaining).toBe(6);
  });
});

describe("RECRUIT ASSET", () => {
  it("none network fails", () => {
    const state = validState();
    expect(() =>
      recruitIntelligenceAsset(
        state,
        "solaris",
        "dravos",
        "solaris-echo",
        "asset-001",
      ),
    ).toThrow(InsufficientIntelligenceNetworkError);
  });

  it("foothold network fails", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    expect(() =>
      recruitIntelligenceAsset(
        state,
        "solaris",
        "dravos",
        "solaris-echo",
        "asset-001",
      ),
    ).toThrow(InsufficientIntelligenceNetworkError);
  });

  it("established creates limited-access asset", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    const next = recruitIntelligenceAsset(
      state,
      "solaris",
      "dravos",
      "solaris-echo",
      "asset-001",
    );
    const asset = next.intelligence.assets.find((a) => a.id === "asset-001");
    expect(asset).toBeDefined();
    expect(asset?.access).toBe("limited");
    expect(asset?.ownerNationId).toBe("solaris");
    expect(asset?.targetNationId).toBe("dravos");
  });

  it("deep creates high-access asset", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    state = { ...state, planning: resetActionPointsForNewTurn(state.planning) };
    const next = recruitIntelligenceAsset(
      state,
      "solaris",
      "dravos",
      "solaris-echo",
      "asset-001",
    );
    const asset = next.intelligence.assets.find((a) => a.id === "asset-001");
    expect(asset?.access).toBe("high");
  });

  it("exact 2 AP cost", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    const before = getNationActionPoints(state, "solaris");
    const next = recruitIntelligenceAsset(
      state,
      "solaris",
      "dravos",
      "solaris-echo",
      "asset-001",
    );
    const after = getNationActionPoints(next, "solaris");
    expect(before.remaining - after.remaining).toBe(RECRUIT_ASSET_AP_COST);
  });

  it("empty asset ID fails", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    expect(() =>
      recruitIntelligenceAsset(
        state,
        "solaris",
        "dravos",
        "solaris-echo",
        "",
      ),
    ).toThrow(EmptyAssetIdError);
  });

  it("duplicate asset ID fails", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    state = recruitIntelligenceAsset(
      state,
      "solaris",
      "dravos",
      "solaris-echo",
      "asset-001",
    );
    expect(() =>
      recruitIntelligenceAsset(
        state,
        "solaris",
        "dravos",
        "solaris-echo",
        "asset-001",
      ),
    ).toThrow(DuplicateSuppliedAssetIdError);
  });

  it("failure spends no AP", () => {
    const state = validState();
    expect(() =>
      recruitIntelligenceAsset(
        state,
        "solaris",
        "dravos",
        "solaris-echo",
        "asset-001",
      ),
    ).toThrow();
    expect(getNationActionPoints(state, "solaris").remaining).toBe(6);
  });
});

describe("COMMON", () => {
  it("unknown actor fails", () => {
    const state = validState();
    expect(() =>
      buildIntelligenceNetwork(state, "nonexistent", "dravos", "solaris-echo"),
    ).toThrow(UnknownNationError);
  });

  it("unknown target fails", () => {
    const state = validState();
    expect(() =>
      buildIntelligenceNetwork(state, "solaris", "nonexistent", "solaris-echo"),
    ).toThrow(UnknownNationError);
  });

  it("self-target fails", () => {
    const state = validState();
    expect(() =>
      buildIntelligenceNetwork(state, "solaris", "solaris", "solaris-echo"),
    ).toThrow(SelfTargetEspionageOperationError);
  });

  it("unknown agent fails", () => {
    const state = validState();
    expect(() =>
      buildIntelligenceNetwork(state, "solaris", "dravos", "nonexistent"),
    ).toThrow();
  });

  it("foreign-owned agent fails", () => {
    const state = validState();
    expect(() =>
      buildIntelligenceNetwork(state, "solaris", "dravos", "dravos-raven"),
    ).toThrow(AgentOwnershipError);
  });

  it("insufficient AP fails", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "norvia", "solaris-echo");
    state = buildIntelligenceNetwork(state, "solaris", "norvia", "solaris-echo");
    state = spendActionPoints(state, "solaris", 2);
    expect(() =>
      buildIntelligenceNetwork(state, "solaris", "norvia", "solaris-orbit"),
    ).toThrow(InsufficientActionPointsError);
  });

  it("resolution phase fails", () => {
    const state: GameState = { ...validState(), phase: "resolution" };
    expect(() =>
      buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo"),
    ).toThrow(InvalidPhaseError);
  });

  it("input state not mutated", () => {
    const state = validState();
    const snapshot = JSON.parse(JSON.stringify(state));
    buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    expect(state).toEqual(snapshot);
  });

  it("successful result validates", () => {
    const state = validState();
    const next = buildIntelligenceNetwork(
      state,
      "solaris",
      "dravos",
      "solaris-echo",
    );
    expect(() => validateGameState(next)).not.toThrow();
  });
});

describe("VERTICAL SLICE", () => {
  it("full sequence", () => {
    let state = validState();

    const s1 = buildIntelligenceNetwork(
      state,
      "solaris",
      "dravos",
      "solaris-echo",
    );
    expect(getIntelligenceNetwork(s1, "solaris", "dravos").level).toBe("foothold");
    expect(getNationActionPoints(s1, "solaris").remaining).toBe(4);

    const s2 = gatherIntelligence(s1, "solaris", "dravos", "solaris-echo");
    expect(getNationVisibility(s2, "solaris", "dravos")).toBe("limited");
    expect(getNationActionPoints(s2, "solaris").remaining).toBe(3);

    const s3 = buildIntelligenceNetwork(s2, "solaris", "dravos", "solaris-echo");
    expect(getIntelligenceNetwork(s3, "solaris", "dravos").level).toBe("established");
    expect(getNationActionPoints(s3, "solaris").remaining).toBe(1);

    expect(() =>
      recruitIntelligenceAsset(s3, "solaris", "dravos", "solaris-echo", "asset-dravos-001"),
    ).toThrow(InsufficientActionPointsError);

    const { state: nextTurn } = resolveTurn(s3, [passOrder("o1")]);
    expect(nextTurn.turn).toBe(2);
    expect(getNationActionPoints(nextTurn, "solaris").remaining).toBe(6);
    expect(getIntelligenceNetwork(nextTurn, "solaris", "dravos").level).toBe("established");
    expect(getNationVisibility(nextTurn, "solaris", "dravos")).toBe("limited");
    expect(nextTurn.intelligence.agents).toHaveLength(12);

    const s6 = recruitIntelligenceAsset(
      nextTurn,
      "solaris",
      "dravos",
      "solaris-echo",
      "asset-dravos-001",
    );
    expect(getNationActionPoints(s6, "solaris").remaining).toBe(4);
    const asset = s6.intelligence.assets.find(
      (a) => a.id === "asset-dravos-001",
    );
    expect(asset).toBeDefined();
    expect(asset?.ownerNationId).toBe("solaris");
    expect(asset?.targetNationId).toBe("dravos");
    expect(asset?.access).toBe("limited");
  });
});

describe("TURN", () => {
  it("after resolveTurn: AP replenishes", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    expect(getNationActionPoints(next, "solaris").remaining).toBe(6);
  });

  it("visibility persists", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    state = gatherIntelligence(state, "solaris", "dravos", "solaris-echo");
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    expect(getNationVisibility(next, "solaris", "dravos")).toBe("limited");
  });

  it("networks persist", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    expect(getIntelligenceNetwork(next, "solaris", "dravos").level).toBe("foothold");
  });

  it("agents persist", () => {
    const state = validState();
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    expect(next.intelligence.agents).toHaveLength(12);
  });

  it("assets persist", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    state = recruitIntelligenceAsset(
      state,
      "solaris",
      "dravos",
      "solaris-echo",
      "asset-001",
    );
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    expect(next.intelligence.assets).toHaveLength(1);
    expect(next.intelligence.assets[0].id).toBe("asset-001");
  });
});
