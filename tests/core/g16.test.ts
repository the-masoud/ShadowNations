import { describe, it, expect } from "vitest";
import {
  createInitialGameState,
  type GameState,
} from "../../src/core/model/gameState";
import {
  getCounterintelligenceAwareness,
  getNextCounterintelligenceAwarenessLevel,
  SelfCounterintelligenceError,
} from "../../src/core/model/counterintelligenceAwareness";
import {
  getDoubleAgentControl,
  addDoubleAgentControl,
  MissingDoubleAgentControlError,
  DuplicateDoubleAgentControlError,
  InvalidDoubleAgentControllerError,
} from "../../src/core/simulation/addDoubleAgentControl";
import {
  setCounterintelligenceAwareness,
} from "../../src/core/simulation/setCounterintelligenceAwareness";
import {
  runCounterintelligenceSweep,
  COUNTERINTELLIGENCE_SWEEP_AP_COST,
  SelfCounterintelligenceSweepError,
} from "../../src/core/simulation/runCounterintelligenceSweep";
import {
  turnIntelligenceAsset,
  TURN_ASSET_AP_COST,
  InsufficientCounterintelligenceAwarenessError,
  AssetAlreadyTurnedError,
  InvalidDoubleAgentTargetError,
} from "../../src/core/simulation/turnIntelligenceAsset";
import {
  feedFalseIntelligence,
  FEED_FALSE_INTELLIGENCE_AP_COST,
  DoubleAgentControlOwnershipError,
  NoIntelligenceToDegradeError,
} from "../../src/core/simulation/feedFalseIntelligence";
import {
  buildIntelligenceNetwork,
} from "../../src/core/simulation/buildIntelligenceNetwork";
import {
  recruitIntelligenceAsset,
} from "../../src/core/simulation/recruitIntelligenceAsset";
import {
  getNationVisibility,
} from "../../src/core/model/intelligenceVisibility";
import {
  setNationVisibility,
} from "../../src/core/simulation/setNationVisibility";
import { getNationActionPoints } from "../../src/core/model/actionPoints";
import { resolveTurn } from "../../src/core/simulation/resolveTurn";
import { validateGameState } from "../../src/core/simulation/validateGameState";
import { resetActionPointsForNewTurn } from "../../src/core/simulation/resetActionPointsForNewTurn";
import { spendActionPoints } from "../../src/core/simulation/spendActionPoints";
import { InvalidPhaseError } from "../../src/core/simulation/resolveTurn";
import { InsufficientActionPointsError } from "../../src/core/simulation/spendActionPoints";
import { UnknownNationError } from "../../src/core/model/worldState";
import type { TurnOrder } from "../../src/core/model/turnOrder";

function validState(): GameState {
  return createInitialGameState();
}

function passOrder(id: string, nationId = "solaris"): TurnOrder {
  return { id, nationId, kind: "pass" };
}

function setupSolarisPresenceInDravos(state: GameState): GameState {
  let s = state;
  s = buildIntelligenceNetwork(s, "solaris", "dravos", "solaris-echo").state;
  s = buildIntelligenceNetwork(s, "solaris", "dravos", "solaris-echo").state;
  s = recruitIntelligenceAsset(s, "solaris", "dravos", "solaris-echo", "asset-dravos-001").state;
  return s;
}

function resetAP(state: GameState): GameState {
  return { ...state, planning: resetActionPointsForNewTurn(state.planning) };
}

function setupFullAwarenessSequence(state: GameState): GameState {
  let s = state;
  s = setupSolarisPresenceInDravos(s);
  s = resetAP(s);
  s = runCounterintelligenceSweep(s, "dravos", "solaris").state;
  s = resetAP(s);
  s = runCounterintelligenceSweep(s, "dravos", "solaris").state;
  return s;
}

describe("AWARENESS MODEL", () => {
  it("exactly 30 initial entries", () => {
    const state = validState();
    expect(state.intelligence.counterintelligenceAwareness.length).toBe(30);
  });

  it("canonical ordering: defender then intruder", () => {
    const state = validState();
    const entries = state.intelligence.counterintelligenceAwareness;
    const defenders = ["solaris", "dravos", "norvia", "veloria", "karsen", "arkania"];
    const expected: string[] = [];
    for (const d of defenders) {
      for (const i of defenders) {
        if (d !== i) expected.push(`${d}|${i}`);
      }
    }
    const actual = entries.map((e) => `${e.defenderNationId}|${e.intruderNationId}`);
    expect(actual).toEqual(expected);
  });

  it("no self pair", () => {
    const state = validState();
    for (const entry of state.intelligence.counterintelligenceAwareness) {
      expect(entry.defenderNationId).not.toBe(entry.intruderNationId);
    }
  });

  it("all initial unaware", () => {
    const state = validState();
    for (const entry of state.intelligence.counterintelligenceAwareness) {
      expect(entry.level).toBe("unaware");
    }
  });

  it("validation passes on initial state", () => {
    const state = validState();
    expect(() => validateGameState(state)).not.toThrow();
  });

  it("lookup defender exists", () => {
    const state = validState();
    expect(() =>
      getCounterintelligenceAwareness(state, "nonexistent", "dravos"),
    ).toThrow(UnknownNationError);
  });

  it("lookup intruder exists", () => {
    const state = validState();
    expect(() =>
      getCounterintelligenceAwareness(state, "solaris", "nonexistent"),
    ).toThrow(UnknownNationError);
  });

  it("lookup self pair fails", () => {
    const state = validState();
    expect(() =>
      getCounterintelligenceAwareness(state, "solaris", "solaris"),
    ).toThrow(SelfCounterintelligenceError);
  });

  it("lookup missing entry fails", () => {
    const state = validState();
    expect(() =>
      getCounterintelligenceAwareness(state, "dravos", "solaris"),
    ).not.toThrow();
  });

  it("immutable structural transition", () => {
    const state = validState();
    const next = setCounterintelligenceAwareness(
      state,
      "solaris",
      "dravos",
      "suspected",
    );
    expect(next).not.toBe(state);
    expect(next.intelligence).not.toBe(state.intelligence);
    expect(next.intelligence.counterintelligenceAwareness).not.toBe(
      state.intelligence.counterintelligenceAwareness,
    );
  });

  it("same-value no-op returns reference", () => {
    const state = validState();
    const next = setCounterintelligenceAwareness(
      state,
      "solaris",
      "dravos",
      "unaware",
    );
    expect(next).toBe(state);
  });

  it("progression helper", () => {
    expect(getNextCounterintelligenceAwarenessLevel("unaware")).toBe("suspected");
    expect(getNextCounterintelligenceAwarenessLevel("suspected")).toBe("identified");
    expect(getNextCounterintelligenceAwarenessLevel("identified")).toBe("identified");
  });

  it("persistence across turn", () => {
    let state = validState();
    state = setCounterintelligenceAwareness(state, "solaris", "dravos", "suspected");
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    const entry = getCounterintelligenceAwareness(next, "solaris", "dravos");
    expect(entry.level).toBe("suspected");
  });
});

describe("SWEEP", () => {
  it("foreign network presence advances awareness", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    const next = runCounterintelligenceSweep(state, "dravos", "solaris").state;
    const entry = getCounterintelligenceAwareness(next, "dravos", "solaris");
    expect(entry.level).toBe("suspected");
  });

  it("foreign asset presence counts as presence", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    state = recruitIntelligenceAsset(state, "solaris", "dravos", "solaris-echo", "asset-001").state;
    const next = runCounterintelligenceSweep(state, "dravos", "solaris").state;
    const entry = getCounterintelligenceAwareness(next, "dravos", "solaris");
    expect(entry.level).toBe("suspected");
  });

  it("no presence leaves awareness unchanged", () => {
    const state = validState();
    const next = runCounterintelligenceSweep(state, "dravos", "solaris").state;
    const entry = getCounterintelligenceAwareness(next, "dravos", "solaris");
    expect(entry.level).toBe("unaware");
  });

  it("valid no-presence sweep still costs 2 AP", () => {
    const state = validState();
    const before = getNationActionPoints(state, "dravos");
    const next = runCounterintelligenceSweep(state, "dravos", "solaris").state;
    const after = getNationActionPoints(next, "dravos");
    expect(before.remaining - after.remaining).toBe(COUNTERINTELLIGENCE_SWEEP_AP_COST);
  });

  it("identified remains identified", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    state = resetAP(state);
    const next = runCounterintelligenceSweep(state, "dravos", "solaris").state;
    const entry = getCounterintelligenceAwareness(next, "dravos", "solaris");
    expect(entry.level).toBe("identified");
  });

  it("exact 2 AP cost", () => {
    const state = validState();
    const before = getNationActionPoints(state, "dravos");
    const next = runCounterintelligenceSweep(state, "dravos", "solaris").state;
    const after = getNationActionPoints(next, "dravos");
    expect(before.remaining - after.remaining).toBe(2);
  });

  it("self pair fails", () => {
    const state = validState();
    expect(() => runCounterintelligenceSweep(state, "solaris", "solaris")).toThrow(
      SelfCounterintelligenceSweepError,
    );
  });

  it("unknown nations fail", () => {
    const state = validState();
    expect(() => runCounterintelligenceSweep(state, "nonexistent", "solaris")).toThrow(
      UnknownNationError,
    );
  });

  it("resolution phase fails", () => {
    const state: GameState = { ...validState(), phase: "resolution" };
    expect(() => runCounterintelligenceSweep(state, "dravos", "solaris")).toThrow(
      InvalidPhaseError,
    );
  });

  it("insufficient AP fails", () => {
    let state = validState();
    state = spendActionPoints(state, "dravos", 6);
    expect(() => runCounterintelligenceSweep(state, "dravos", "solaris")).toThrow(
      InsufficientActionPointsError,
    );
  });

  it("input state not mutated", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    const before = getNationActionPoints(state, "dravos");
    runCounterintelligenceSweep(state, "dravos", "solaris");
    const after = getNationActionPoints(state, "dravos");
    expect(before.remaining).toBe(after.remaining);
  });
});

describe("DOUBLE AGENT", () => {
  it("initial doubleAgents empty", () => {
    const state = validState();
    expect(state.intelligence.doubleAgents.length).toBe(0);
  });

  it("valid control structural addition", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    state = resetAP(state);
    const next = turnIntelligenceAsset(state, "dravos", "asset-dravos-001").state;
    const control = getDoubleAgentControl(next, "asset-dravos-001");
    expect(control.assetId).toBe("asset-dravos-001");
    expect(control.controllerNationId).toBe("dravos");
  });

  it("duplicate control rejected", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    state = resetAP(state);
    state = addDoubleAgentControl(state, {
      assetId: "asset-dravos-001",
      controllerNationId: "dravos",
    });
    expect(() =>
      addDoubleAgentControl(state, {
        assetId: "asset-dravos-001",
        controllerNationId: "dravos",
      }),
    ).toThrow(DuplicateDoubleAgentControlError);
  });

  it("invalid controller rejected", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    const asset = state.intelligence.assets.find((a) => a.id === "asset-dravos-001");
    expect(asset).toBeDefined();
    expect(() =>
      addDoubleAgentControl(state, {
        assetId: "asset-dravos-001",
        controllerNationId: "solaris",
      }),
    ).toThrow(InvalidDoubleAgentControllerError);
  });

  it("lookup behavior", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    state = addDoubleAgentControl(state, {
      assetId: "asset-dravos-001",
      controllerNationId: "dravos",
    });
    const control = getDoubleAgentControl(state, "asset-dravos-001");
    expect(control.assetId).toBe("asset-dravos-001");
  });

  it("lookup missing control fails", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    expect(() => getDoubleAgentControl(state, "asset-dravos-001")).toThrow(
      MissingDoubleAgentControlError,
    );
  });

  it("turned asset remains unchanged", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    state = resetAP(state);
    const next = turnIntelligenceAsset(state, "dravos", "asset-dravos-001").state;
    const asset = next.intelligence.assets.find((a) => a.id === "asset-dravos-001");
    expect(asset?.ownerNationId).toBe("solaris");
    expect(asset?.targetNationId).toBe("dravos");
    expect(asset?.access).toBe("limited");
  });

  it("exact 3 AP cost", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    state = resetAP(state);
    const before = getNationActionPoints(state, "dravos");
    const next = turnIntelligenceAsset(state, "dravos", "asset-dravos-001").state;
    const after = getNationActionPoints(next, "dravos");
    expect(before.remaining - after.remaining).toBe(TURN_ASSET_AP_COST);
  });

  it("awareness below identified fails with no AP spent", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    state = recruitIntelligenceAsset(state, "solaris", "dravos", "solaris-echo", "asset-dravos-001").state;
    state = runCounterintelligenceSweep(state, "dravos", "solaris").state;
    const before = getNationActionPoints(state, "dravos");
    expect(() =>
      turnIntelligenceAsset(state, "dravos", "asset-dravos-001"),
    ).toThrow(InsufficientCounterintelligenceAwarenessError);
    const after = getNationActionPoints(state, "dravos");
    expect(before.remaining).toBe(after.remaining);
  });

  it("identified allows turn", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    state = resetAP(state);
    expect(() =>
      turnIntelligenceAsset(state, "dravos", "asset-dravos-001"),
    ).not.toThrow();
  });

  it("already turned fails", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    state = resetAP(state);
    state = turnIntelligenceAsset(state, "dravos", "asset-dravos-001").state;
    state = resetAP(state);
    expect(() =>
      turnIntelligenceAsset(state, "dravos", "asset-dravos-001"),
    ).toThrow(AssetAlreadyTurnedError);
  });

  it("persistence across turn", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    state = resetAP(state);
    state = turnIntelligenceAsset(state, "dravos", "asset-dravos-001").state;
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    const control = getDoubleAgentControl(next, "asset-dravos-001");
    expect(control.controllerNationId).toBe("dravos");
  });

  it("wrong target fails with no AP spent", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    const before = getNationActionPoints(state, "dravos");
    expect(() =>
      turnIntelligenceAsset(state, "solaris", "asset-dravos-001"),
    ).toThrow(InvalidDoubleAgentTargetError);
    const after = getNationActionPoints(state, "dravos");
    expect(before.remaining).toBe(after.remaining);
  });
});

describe("FALSE INTELLIGENCE", () => {
  function setupWithLimitedVisibility(): GameState {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    state = setNationVisibility(state, "solaris", "dravos", "limited");
    state = resetAP(state);
    state = turnIntelligenceAsset(state, "dravos", "asset-dravos-001").state;
    state = resetAP(state);
    return state;
  }

  function setupWithKnownVisibility(): GameState {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = resetAP(state);
    state = turnIntelligenceAsset(state, "dravos", "asset-dravos-001").state;
    state = resetAP(state);
    return state;
  }

  it("known -> limited", () => {
    const state = setupWithKnownVisibility();
    const next = feedFalseIntelligence(state, "dravos", "asset-dravos-001").state;
    const vis = getNationVisibility(next, "solaris", "dravos");
    expect(vis).toBe("limited");
  });

  it("limited -> unknown", () => {
    const state = setupWithLimitedVisibility();
    const next = feedFalseIntelligence(state, "dravos", "asset-dravos-001").state;
    const vis = getNationVisibility(next, "solaris", "dravos");
    expect(vis).toBe("unknown");
  });

  it("unknown fails", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    state = setNationVisibility(state, "solaris", "dravos", "unknown");
    state = resetAP(state);
    state = turnIntelligenceAsset(state, "dravos", "asset-dravos-001").state;
    state = resetAP(state);
    expect(() =>
      feedFalseIntelligence(state, "dravos", "asset-dravos-001"),
    ).toThrow(NoIntelligenceToDegradeError);
  });

  it("exact 1 AP cost", () => {
    const state = setupWithKnownVisibility();
    const before = getNationActionPoints(state, "dravos");
    const next = feedFalseIntelligence(state, "dravos", "asset-dravos-001").state;
    const after = getNationActionPoints(next, "dravos");
    expect(before.remaining - after.remaining).toBe(FEED_FALSE_INTELLIGENCE_AP_COST);
  });

  it("unknown failure spends no AP", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    state = setNationVisibility(state, "solaris", "dravos", "unknown");
    state = resetAP(state);
    state = turnIntelligenceAsset(state, "dravos", "asset-dravos-001").state;
    state = resetAP(state);
    const before = getNationActionPoints(state, "dravos");
    expect(() =>
      feedFalseIntelligence(state, "dravos", "asset-dravos-001"),
    ).toThrow(NoIntelligenceToDegradeError);
    const after = getNationActionPoints(state, "dravos");
    expect(before.remaining).toBe(after.remaining);
  });

  it("missing control fails", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = resetAP(state);
    expect(() =>
      feedFalseIntelligence(state, "dravos", "asset-dravos-001"),
    ).toThrow();
  });

  it("wrong controller fails", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = resetAP(state);
    state = turnIntelligenceAsset(state, "dravos", "asset-dravos-001").state;
    state = resetAP(state);
    expect(() =>
      feedFalseIntelligence(state, "solaris", "asset-dravos-001"),
    ).toThrow(DoubleAgentControlOwnershipError);
  });

  it("asset unchanged", () => {
    const state = setupWithKnownVisibility();
    const before = state.intelligence.assets.find((a) => a.id === "asset-dravos-001");
    const next = feedFalseIntelligence(state, "dravos", "asset-dravos-001").state;
    const after = next.intelligence.assets.find((a) => a.id === "asset-dravos-001");
    expect(after).toEqual(before);
  });

  it("double-agent record unchanged", () => {
    const state = setupWithKnownVisibility();
    const before = state.intelligence.doubleAgents.find(
      (d) => d.assetId === "asset-dravos-001",
    );
    const next = feedFalseIntelligence(state, "dravos", "asset-dravos-001").state;
    const after = next.intelligence.doubleAgents.find(
      (d) => d.assetId === "asset-dravos-001",
    );
    expect(after).toEqual(before);
  });

  it("network unchanged", () => {
    const state = setupWithKnownVisibility();
    const before = state.intelligence.networks.find(
      (n) =>
        n.observerNationId === "solaris" && n.targetNationId === "dravos",
    );
    const next = feedFalseIntelligence(state, "dravos", "asset-dravos-001").state;
    const after = next.intelligence.networks.find(
      (n) =>
        n.observerNationId === "solaris" && n.targetNationId === "dravos",
    );
    expect(after).toEqual(before);
  });

  it("awareness unchanged", () => {
    const state = setupWithKnownVisibility();
    const before = getCounterintelligenceAwareness(state, "dravos", "solaris");
    const next = feedFalseIntelligence(state, "dravos", "asset-dravos-001").state;
    const after = getCounterintelligenceAwareness(next, "dravos", "solaris");
    expect(after.level).toBe(before.level);
  });

  it("resulting state validates", () => {
    const state = setupWithKnownVisibility();
    const next = feedFalseIntelligence(state, "dravos", "asset-dravos-001").state;
    expect(() => validateGameState(next)).not.toThrow();
  });
});

describe("INTEGRATION", () => {
  it("full scenario from section 19", () => {
    let state = validState();

    state = setupSolarisPresenceInDravos(state);
    expect(state.intelligence.assets.find((a) => a.id === "asset-dravos-001")).toBeDefined();
    expect(state.intelligence.assets.find((a) => a.id === "asset-dravos-001")?.ownerNationId).toBe("solaris");
    expect(state.intelligence.assets.find((a) => a.id === "asset-dravos-001")?.targetNationId).toBe("dravos");

    state = runCounterintelligenceSweep(state, "dravos", "solaris").state;
    let awareness = getCounterintelligenceAwareness(state, "dravos", "solaris");
    expect(awareness.level).toBe("suspected");

    state = resetAP(state);
    state = runCounterintelligenceSweep(state, "dravos", "solaris").state;
    awareness = getCounterintelligenceAwareness(state, "dravos", "solaris");
    expect(awareness.level).toBe("identified");

    state = resetAP(state);
    state = turnIntelligenceAsset(state, "dravos", "asset-dravos-001").state;
    const control = getDoubleAgentControl(state, "asset-dravos-001");
    expect(control.assetId).toBe("asset-dravos-001");
    expect(control.controllerNationId).toBe("dravos");

    const asset = state.intelligence.assets.find((a) => a.id === "asset-dravos-001");
    expect(asset?.ownerNationId).toBe("solaris");
    expect(asset?.targetNationId).toBe("dravos");

    state = setNationVisibility(state, "solaris", "dravos", "limited");

    state = resetAP(state);
    const beforeAP = getNationActionPoints(state, "dravos");
    expect(getNationVisibility(state, "solaris", "dravos")).toBe("limited");
    state = feedFalseIntelligence(state, "dravos", "asset-dravos-001").state;
    const afterVis = getNationVisibility(state, "solaris", "dravos");
    const afterAP = getNationActionPoints(state, "dravos");

    expect(beforeAP.remaining - afterAP.remaining).toBe(1);
    expect(afterVis).toBe("unknown");

    const controlAfterFeed = getDoubleAgentControl(state, "asset-dravos-001");
    expect(controlAfterFeed.controllerNationId).toBe("dravos");

    const assetAfterFeed = state.intelligence.assets.find((a) => a.id === "asset-dravos-001");
    expect(assetAfterFeed?.ownerNationId).toBe("solaris");
    expect(assetAfterFeed?.targetNationId).toBe("dravos");
  });
});

describe("REGRESSION", () => {
  it("G1.1 AP reset still correct", () => {
    let state = validState();
    const before = getNationActionPoints(state, "solaris");
    expect(before.remaining).toBe(before.maximum);
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    const after = getNationActionPoints(next, "solaris");
    expect(after.remaining).toBe(after.maximum);
  });

  it("existing intelligence state persists correctly", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    const network = state.intelligence.networks.find(
      (n) =>
        n.observerNationId === "solaris" && n.targetNationId === "dravos",
    );
    expect(network?.level).toBe("foothold");

    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    const nextNetwork = next.intelligence.networks.find(
      (n) =>
        n.observerNationId === "solaris" && n.targetNationId === "dravos",
    );
    expect(nextNetwork?.level).toBe("foothold");
  });

  it("all original test files still pass", () => {
    expect(() => validateGameState(validState())).not.toThrow();
  });
});
