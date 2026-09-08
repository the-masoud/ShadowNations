import { describe, it, expect } from "vitest";
import { createInitialGameState } from "../../src/core/model/gameState.js";
import type { GameState } from "../../src/core/model/gameState.js";
import {
  createOperationPlannerModel,
} from "../../src/game/ui/operationPlannerPresentation.js";
import {
  executeOperationPlannerCommand,
} from "../../src/game/ui/executeOperationPlannerCommand.js";
import { addIntelligenceAsset } from "../../src/core/simulation/addIntelligenceAsset.js";
import { addDoubleAgentControl } from "../../src/core/simulation/addDoubleAgentControl.js";
import { addProxyConflict } from "../../src/core/simulation/addProxyConflict.js";
import { setNationVisibility } from "../../src/core/simulation/setNationVisibility.js";
import { setCounterintelligenceAwareness } from "../../src/core/simulation/setCounterintelligenceAwareness.js";
import { setIntelligenceNetworkLevel } from "../../src/core/simulation/setIntelligenceNetworkLevel.js";
import { setNationInfluence } from "../../src/core/simulation/setNationInfluence.js";

import { getNationVisibility } from "../../src/core/model/intelligenceVisibility.js";
import { getIntelligenceNetwork } from "../../src/core/model/intelligenceState.js";
import { getNationInfluence } from "../../src/core/model/nationInfluence.js";
import { getDiplomaticRelationship } from "../../src/core/model/diplomaticRelationship.js";
import { getNationStrategicStats } from "../../src/core/model/nationStrategicStats.js";
import { getNationRegimePressure } from "../../src/core/model/nationRegimePressure.js";
import { GameStateValidationError } from "../../src/core/simulation/validateGameState.js";
import { InsufficientIntelligenceNetworkError } from "../../src/core/simulation/gatherIntelligence.js";

describe("operationPlannerPresentation", () => {
  // A — Top-level keys
  it("A: top-level keys are exact", () => {
    const state = createInitialGameState();
    const model = createOperationPlannerModel(state);
    expect(Object.keys(model)).toEqual([
      "actorNationId",
      "actorNationName",
      "actorNationCode",
      "maximumActionPoints",
      "remainingActionPoints",
      "operations",
      "targets",
      "agents",
      "turnableAssets",
      "controlledDoubleAgents",
      "proxyConflicts",
    ]);
  });

  // B — Nested runtime keys
  it("B: nested runtime keys are exact", () => {
    const state = createInitialGameState();
    const model = createOperationPlannerModel(state);
    expect(Object.keys(model.operations[0])).toEqual(["kind", "label", "actionPointCost"]);
    expect(Object.keys(model.targets[0])).toEqual(["nationId", "nationName", "nationCode", "nationColor"]);
    expect(Object.keys(model.agents[0])).toEqual(["agentId", "codename"]);
  });

  it("B2: asset model keys are exact", () => {
    let state = createInitialGameState();
    state = addIntelligenceAsset(state, {
      id: "g45-asset-key-test",
      ownerNationId: "dravos",
      targetNationId: "solaris",
      access: "limited",
    });
    state = setCounterintelligenceAwareness(state, "solaris", "dravos", "identified");
    const model = createOperationPlannerModel(state);
    expect(model.turnableAssets.length).toBe(1);
    expect(Object.keys(model.turnableAssets[0])).toEqual(["assetId", "sourceNationId", "sourceNationCode"]);
  });

  it("B3: conflict model keys are exact", () => {
    let state = createInitialGameState();
    state = addProxyConflict(state, {
      id: "proxy-solaris-dravos-norvia-1",
      hostNationId: "norvia",
      nationAId: "solaris",
      nationBId: "dravos",
      intensity: "low",
    });
    const model = createOperationPlannerModel(state);
    expect(model.proxyConflicts.length).toBe(1);
    expect(Object.keys(model.proxyConflicts[0])).toEqual(["conflictId", "hostNationId", "hostNationCode", "intensity"]);
  });

  // C — Initial planner
  it("C: exact initial planner invariants", () => {
    const state = createInitialGameState();
    const model = createOperationPlannerModel(state);
    expect(model.actorNationId).toBe("solaris");
    expect(model.actorNationName).toBe("Solaris");
    expect(model.actorNationCode).toBe("SOL");
    expect(model.maximumActionPoints).toBe(6);
    expect(model.remainingActionPoints).toBe(6);
    expect(model.operations.length).toBe(13);
    expect(model.targets.map((t) => t.nationId)).toEqual([
      "dravos", "norvia", "veloria", "karsen", "arkania",
    ]);
    expect(model.agents).toEqual([
      { agentId: "solaris-echo", codename: "Echo" },
      { agentId: "solaris-orbit", codename: "Orbit" },
    ]);
    expect(model.turnableAssets).toEqual([]);
    expect(model.controlledDoubleAgents).toEqual([]);
    expect(model.proxyConflicts).toEqual([]);
  });

  // D — Exact 13 operations
  it("D: exact 13 operations with correct kinds, labels, costs", () => {
    const state = createInitialGameState();
    const model = createOperationPlannerModel(state);
    const expected = [
      ["build-network", "BUILD NETWORK", 2],
      ["gather-intelligence", "GATHER INTELLIGENCE", 1],
      ["recruit-asset", "RECRUIT ASSET", 2],
      ["counterintelligence-sweep", "COUNTERINTEL SWEEP", 2],
      ["turn-asset", "TURN ASSET", 3],
      ["feed-false-intelligence", "FEED FALSE INTEL", 1],
      ["cultivate-influence", "CULTIVATE INFLUENCE", 2],
      ["diplomatic-outreach", "DIPLOMATIC OUTREACH", 2],
      ["stabilize-government", "STABILIZE GOVERNMENT", 2],
      ["covert-sabotage", "COVERT SABOTAGE", 2],
      ["start-proxy-conflict", "START PROXY CONFLICT", 3],
      ["escalate-proxy-conflict", "ESCALATE PROXY CONFLICT", 2],
      ["apply-regime-pressure", "APPLY REGIME PRESSURE", 3],
    ] as const;
    for (let i = 0; i < expected.length; i++) {
      expect(model.operations[i].kind).toBe(expected[i][0]);
      expect(model.operations[i].label).toBe(expected[i][1]);
      expect(model.operations[i].actionPointCost).toBe(expected[i][2]);
    }
  });

  // E — Alternate player
  it("E: alternate player (dravos) behavior", () => {
    const state: GameState = {
      ...createInitialGameState(),
      playerNationId: "dravos",
    };
    const model = createOperationPlannerModel(state);
    expect(model.actorNationId).toBe("dravos");
    expect(model.actorNationName).toBe("Dravos");
    expect(model.actorNationCode).toBe("DRA");
    expect(model.maximumActionPoints).toBe(6);
    expect(model.remainingActionPoints).toBe(6);
    expect(model.agents).toEqual([
      { agentId: "dravos-raven", codename: "Raven" },
      { agentId: "dravos-iron", codename: "Iron" },
    ]);
    expect(model.targets.map((t) => t.nationId)).toEqual([
      "solaris", "norvia", "veloria", "karsen", "arkania",
    ]);
  });

  // F — Turnable asset filter
  it("F: turnable asset filter", () => {
    let state = createInitialGameState();
    state = addIntelligenceAsset(state, {
      id: "g45-dravos-solaris",
      ownerNationId: "dravos",
      targetNationId: "solaris",
      access: "limited",
    });
    let model = createOperationPlannerModel(state);
    expect(model.turnableAssets).toEqual([]);

    state = setCounterintelligenceAwareness(state, "solaris", "dravos", "identified");
    model = createOperationPlannerModel(state);
    expect(model.turnableAssets).toEqual([
      { assetId: "g45-dravos-solaris", sourceNationId: "dravos", sourceNationCode: "DRA" },
    ]);

    state = addDoubleAgentControl(state, {
      assetId: "g45-dravos-solaris",
      controllerNationId: "solaris",
    });
    model = createOperationPlannerModel(state);
    expect(model.turnableAssets).toEqual([]);
    expect(model.controlledDoubleAgents).toEqual([
      { assetId: "g45-dravos-solaris", sourceNationId: "dravos", sourceNationCode: "DRA" },
    ]);
  });

  // G — Player proxy conflict filter
  it("G: player proxy conflict filter includes player conflicts", () => {
    let state = createInitialGameState();
    state = addProxyConflict(state, {
      id: "proxy-solaris-dravos-norvia-1",
      hostNationId: "norvia",
      nationAId: "solaris",
      nationBId: "dravos",
      intensity: "low",
    });
    const model = createOperationPlannerModel(state);
    expect(model.proxyConflicts.length).toBe(1);
    expect(model.proxyConflicts[0].conflictId).toBe("proxy-solaris-dravos-norvia-1");
    expect(model.proxyConflicts[0].hostNationId).toBe("norvia");
    expect(model.proxyConflicts[0].hostNationCode).toBe("NOR");
    expect(model.proxyConflicts[0].intensity).toBe("low");
  });

  it("G2: non-player proxy conflicts excluded", () => {
    let state = createInitialGameState();
    state = addProxyConflict(state, {
      id: "proxy-karsen-dravos-veloria-1",
      hostNationId: "veloria",
      nationAId: "dravos",
      nationBId: "karsen",
      intensity: "low",
    });
    const model = createOperationPlannerModel(state);
    expect(model.proxyConflicts.length).toBe(0);
  });

  // H — Model freshness
  it("H: model freshness", () => {
    const state = createInitialGameState();
    const a = createOperationPlannerModel(state);
    const b = createOperationPlannerModel(state);
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(a.operations).not.toBe(b.operations);
    expect(a.targets).not.toBe(b.targets);
    expect(a.agents).not.toBe(b.agents);
    expect(a.turnableAssets).not.toBe(b.turnableAssets);
    expect(a.controlledDoubleAgents).not.toBe(b.controlledDoubleAgents);
    expect(a.proxyConflicts).not.toBe(b.proxyConflicts);
    for (let i = 0; i < a.operations.length; i++) {
      expect(a.operations[i]).not.toBe(b.operations[i]);
    }
    for (let i = 0; i < a.targets.length; i++) {
      expect(a.targets[i]).not.toBe(b.targets[i]);
    }
    for (let i = 0; i < a.agents.length; i++) {
      expect(a.agents[i]).not.toBe(b.agents[i]);
    }
  });

  it("H2: freshness with populated arrays", () => {
    let state = createInitialGameState();
    state = addIntelligenceAsset(state, {
      id: "g45-fresh-asset-a",
      ownerNationId: "dravos",
      targetNationId: "solaris",
      access: "limited",
    });
    state = setCounterintelligenceAwareness(state, "solaris", "dravos", "identified");
    state = addIntelligenceAsset(state, {
      id: "g45-fresh-asset-b",
      ownerNationId: "norvia",
      targetNationId: "solaris",
      access: "limited",
    });
    state = addDoubleAgentControl(state, {
      assetId: "g45-fresh-asset-b",
      controllerNationId: "solaris",
    });
    state = addProxyConflict(state, {
      id: "proxy-solaris-dravos-norvia-1",
      hostNationId: "norvia",
      nationAId: "solaris",
      nationBId: "dravos",
      intensity: "low",
    });
    const a = createOperationPlannerModel(state);
    const b = createOperationPlannerModel(state);
    expect(a).toEqual(b);
    expect(a.turnableAssets).not.toBe(b.turnableAssets);
    expect(a.controlledDoubleAgents).not.toBe(b.controlledDoubleAgents);
    expect(a.proxyConflicts).not.toBe(b.proxyConflicts);
    expect(a.turnableAssets.length).toBe(1);
    expect(a.controlledDoubleAgents.length).toBe(1);
    expect(a.proxyConflicts.length).toBe(1);
    expect(a.turnableAssets[0]).not.toBe(b.turnableAssets[0]);
    expect(a.controlledDoubleAgents[0]).not.toBe(b.controlledDoubleAgents[0]);
    expect(a.proxyConflicts[0]).not.toBe(b.proxyConflicts[0]);
  });

  // I — Model immutability
  it("I: model does not mutate state", () => {
    const state = createInitialGameState();
    const before = JSON.stringify(state);
    createOperationPlannerModel(state);
    expect(JSON.stringify(state)).toBe(before);
  });

  // J — Model validation precedence
  it("J: model throws GameStateValidationError for invalid state", () => {
    const invalidState = { ...createInitialGameState(), turn: 0 };
    expect(() => createOperationPlannerModel(invalidState)).toThrow(GameStateValidationError);
  });

  // K — Executor validation precedence
  it("K: executor throws GameStateValidationError for invalid state", () => {
    const invalidState = { ...createInitialGameState(), turn: 0 };
    expect(() =>
      executeOperationPlannerCommand(invalidState, {
        kind: "build-network",
        targetNationId: "dravos",
        agentId: "solaris-echo",
      }),
    ).toThrow(GameStateValidationError);
  });

  // L — Build network route
  it("L: build-network route", () => {
    let state = createInitialGameState();
    const result = executeOperationPlannerCommand(state, {
      kind: "build-network",
      targetNationId: "dravos",
      agentId: "solaris-echo",
    });
    expect(result.event.type).toBe("intelligence-network-built");
    const ap = result.state.planning.actionPoints.find((a) => a.nationId === "solaris")!;
    expect(ap.remaining).toBe(4);
    const network = getIntelligenceNetwork(result.state, "solaris", "dravos");
    expect(network.level).toBe("foothold");
  });

  // M — Gather intelligence route
  it("M: gather-intelligence route", () => {
    let state = createInitialGameState();
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "foothold");
    const result = executeOperationPlannerCommand(state, {
      kind: "gather-intelligence",
      targetNationId: "dravos",
      agentId: "solaris-echo",
    });
    expect(result.event.type).toBe("intelligence-gathered");
    const ap = result.state.planning.actionPoints.find((a) => a.nationId === "solaris")!;
    expect(ap.remaining).toBe(5);
    const visibility = getNationVisibility(result.state, "solaris", "dravos");
    expect(visibility).toBe("limited");
  });

  // N — Recruit asset route
  it("N: recruit-asset route with deterministic ID", () => {
    let state = createInitialGameState();
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "established");
    const result = executeOperationPlannerCommand(state, {
      kind: "recruit-asset",
      targetNationId: "dravos",
      agentId: "solaris-echo",
    });
    expect(result.event.type).toBe("intelligence-asset-recruited");
    if (result.event.type === "intelligence-asset-recruited") {
      expect(result.event.assetId).toBe("asset-solaris-dravos-1");
    }
    const ap = result.state.planning.actionPoints.find((a) => a.nationId === "solaris")!;
    expect(ap.remaining).toBe(4);
    const recruitedAsset = result.state.intelligence.assets.find((a) => a.id === "asset-solaris-dravos-1");
    expect(recruitedAsset).toBeDefined();
    expect(recruitedAsset!.ownerNationId).toBe("solaris");
    expect(recruitedAsset!.targetNationId).toBe("dravos");
  });

  it("N2: recruit-asset deterministic collision", () => {
    let state = createInitialGameState();
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "established");
    state = addIntelligenceAsset(state, {
      id: "asset-solaris-dravos-1",
      ownerNationId: "solaris",
      targetNationId: "dravos",
      access: "limited",
    });
    const result = executeOperationPlannerCommand(state, {
      kind: "recruit-asset",
      targetNationId: "dravos",
      agentId: "solaris-echo",
    });
    expect(result.event.type).toBe("intelligence-asset-recruited");
    if (result.event.type === "intelligence-asset-recruited") {
      expect(result.event.assetId).toBe("asset-solaris-dravos-2");
    }
  });

  // O — Counterintelligence sweep route
  it("O: counterintelligence-sweep route", () => {
    const state = createInitialGameState();
    const result = executeOperationPlannerCommand(state, {
      kind: "counterintelligence-sweep",
      intruderNationId: "dravos",
    });
    expect(result.event.type).toBe("counterintelligence-sweep");
    const ap = result.state.planning.actionPoints.find((a) => a.nationId === "solaris")!;
    expect(ap.remaining).toBe(4);
  });

  // P — Turn asset route
  it("P: turn-asset route", () => {
    let state = createInitialGameState();
    state = addIntelligenceAsset(state, {
      id: "g45-dravos-solaris",
      ownerNationId: "dravos",
      targetNationId: "solaris",
      access: "limited",
    });
    state = setCounterintelligenceAwareness(state, "solaris", "dravos", "identified");
    const result = executeOperationPlannerCommand(state, {
      kind: "turn-asset",
      assetId: "g45-dravos-solaris",
    });
    expect(result.event.type).toBe("intelligence-asset-turned");
    const ap = result.state.planning.actionPoints.find((a) => a.nationId === "solaris")!;
    expect(ap.remaining).toBe(3);
    const control = result.state.intelligence.doubleAgents.find((d) => d.assetId === "g45-dravos-solaris");
    expect(control).toBeDefined();
    expect(control!.assetId).toBe("g45-dravos-solaris");
    expect(control!.controllerNationId).toBe("solaris");
  });

  // Q — Feed false intelligence route
  it("Q: feed-false-intelligence route", () => {
    let state = createInitialGameState();
    state = addIntelligenceAsset(state, {
      id: "g45-dravos-solaris",
      ownerNationId: "dravos",
      targetNationId: "solaris",
      access: "limited",
    });
    state = addDoubleAgentControl(state, {
      assetId: "g45-dravos-solaris",
      controllerNationId: "solaris",
    });
    state = setNationVisibility(state, "dravos", "solaris", "limited");
    const result = executeOperationPlannerCommand(state, {
      kind: "feed-false-intelligence",
      assetId: "g45-dravos-solaris",
    });
    expect(result.event.type).toBe("false-intelligence-fed");
    const ap = result.state.planning.actionPoints.find((a) => a.nationId === "solaris")!;
    expect(ap.remaining).toBe(5);
    const visibility = getNationVisibility(result.state, "dravos", "solaris");
    expect(visibility).toBe("unknown");
  });

  // R — Cultivate influence route
  it("R: cultivate-influence route", () => {
    const state = createInitialGameState();
    const result = executeOperationPlannerCommand(state, {
      kind: "cultivate-influence",
      targetNationId: "dravos",
    });
    expect(result.event.type).toBe("political-influence-cultivated");
    const ap = result.state.planning.actionPoints.find((a) => a.nationId === "solaris")!;
    expect(ap.remaining).toBe(4);
    const influence = getNationInfluence(result.state.world, "solaris", "dravos");
    expect(influence.value).toBe(28);
  });

  // S — Diplomatic outreach route
  it("S: diplomatic-outreach route", () => {
    let state = createInitialGameState();
    state = setNationInfluence(state, "solaris", "dravos", 30);
    const result = executeOperationPlannerCommand(state, {
      kind: "diplomatic-outreach",
      targetNationId: "dravos",
    });
    expect(result.event.type).toBe("diplomatic-outreach-conducted");
    const ap = result.state.planning.actionPoints.find((a) => a.nationId === "solaris")!;
    expect(ap.remaining).toBe(4);
    const diplo = getDiplomaticRelationship(result.state.world, "solaris", "dravos");
    expect(diplo.status).toBe("neutral");
  });

  // T — Stabilize government route
  it("T: stabilize-government route", () => {
    const state = createInitialGameState();
    const result = executeOperationPlannerCommand(state, {
      kind: "stabilize-government",
      targetNationId: "veloria",
    });
    expect(result.event.type).toBe("government-stabilized");
    const ap = result.state.planning.actionPoints.find((a) => a.nationId === "solaris")!;
    expect(ap.remaining).toBe(4);
    const stats = getNationStrategicStats(result.state.world, "veloria");
    expect(stats.stability).toBe(75);
  });

  // U — Covert sabotage route
  it("U: covert-sabotage route", () => {
    let state = createInitialGameState();
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "established");
    const result = executeOperationPlannerCommand(state, {
      kind: "covert-sabotage",
      targetNationId: "dravos",
      agentId: "solaris-echo",
      objective: "internal-security",
    });
    expect(result.event.type).toBe("covert-sabotage-conducted");
    const ap = result.state.planning.actionPoints.find((a) => a.nationId === "solaris")!;
    expect(ap.remaining).toBe(4);
    const stats = getNationStrategicStats(result.state.world, "dravos");
    expect(stats.internalSecurity).toBe(72);
  });

  // V — Start proxy conflict route
  it("V: start-proxy-conflict route", () => {
    const state = createInitialGameState();
    const result = executeOperationPlannerCommand(state, {
      kind: "start-proxy-conflict",
      rivalNationId: "dravos",
      hostNationId: "norvia",
    });
    expect(result.event.type).toBe("proxy-conflict-started");
    if (result.event.type === "proxy-conflict-started") {
      expect(result.event.conflictId).toBe("proxy-solaris-dravos-norvia-1");
    }
    const ap = result.state.planning.actionPoints.find((a) => a.nationId === "solaris")!;
    expect(ap.remaining).toBe(3);
    const conflict = result.state.world.proxyConflicts.find((c) => c.id === "proxy-solaris-dravos-norvia-1");
    expect(conflict).toBeDefined();
    expect(conflict!.intensity).toBe("low");
    const hostStats = getNationStrategicStats(result.state.world, "norvia");
    expect(hostStats.stability).toBe(53);
  });

  it("V2: start-proxy-conflict deterministic proxy-ID collision", () => {
    let state = createInitialGameState();
    state = addProxyConflict(state, {
      id: "proxy-solaris-dravos-norvia-1",
      hostNationId: "veloria",
      nationAId: "dravos",
      nationBId: "karsen",
      intensity: "low",
    });
    const result = executeOperationPlannerCommand(state, {
      kind: "start-proxy-conflict",
      rivalNationId: "dravos",
      hostNationId: "norvia",
    });
    expect(result.event.type).toBe("proxy-conflict-started");
    if (result.event.type === "proxy-conflict-started") {
      expect(result.event.conflictId).toBe("proxy-solaris-dravos-norvia-2");
    }
    const conflict = result.state.world.proxyConflicts.find(
      (c) => c.id === "proxy-solaris-dravos-norvia-2",
    );
    expect(conflict).toBeDefined();
    expect(conflict!.hostNationId).toBe("norvia");
    expect(conflict!.intensity).toBe("low");
  });

  // W — Escalate proxy conflict route
  it("W: escalate-proxy-conflict route", () => {
    let state = createInitialGameState();
    const startResult = executeOperationPlannerCommand(state, {
      kind: "start-proxy-conflict",
      rivalNationId: "dravos",
      hostNationId: "norvia",
    });
    state = startResult.state;
    const conflictId = startResult.event.type === "proxy-conflict-started"
      ? startResult.event.conflictId
      : "";
    const apBefore = state.planning.actionPoints.find((a) => a.nationId === "solaris")!;
    const hostStatsBefore = getNationStrategicStats(state.world, "norvia");
    const result = executeOperationPlannerCommand(state, {
      kind: "escalate-proxy-conflict",
      conflictId,
    });
    expect(result.event.type).toBe("proxy-conflict-escalated");
    const conflict = result.state.world.proxyConflicts.find((c) => c.id === conflictId);
    expect(conflict!.intensity).toBe("medium");
    const hostStatsAfter = getNationStrategicStats(result.state.world, "norvia");
    expect(hostStatsAfter.stability).toBe(hostStatsBefore.stability - 5);
    const apAfter = result.state.planning.actionPoints.find((a) => a.nationId === "solaris")!;
    expect(apAfter.remaining).toBe(apBefore.remaining - 2);
  });

  // X — Apply regime pressure route
  it("X: apply-regime-pressure route", () => {
    let state = createInitialGameState();
    state = setNationInfluence(state, "solaris", "dravos", 40);
    const result = executeOperationPlannerCommand(state, {
      kind: "apply-regime-pressure",
      targetNationId: "dravos",
    });
    expect(result.event.type).toBe("regime-pressure-applied");
    const ap = result.state.planning.actionPoints.find((a) => a.nationId === "solaris")!;
    expect(ap.remaining).toBe(3);
    const pressure = getNationRegimePressure(result.state.world, "solaris", "dravos");
    expect(pressure.value).toBe(20);
    const stats = getNationStrategicStats(result.state.world, "dravos");
    expect(stats.stability).toBe(73);
  });

  // Y — Core error propagation
  it("Y: core error propagation", () => {
    const state = createInitialGameState();
    expect(() =>
      executeOperationPlannerCommand(state, {
        kind: "gather-intelligence",
        targetNationId: "dravos",
        agentId: "solaris-echo",
      }),
    ).toThrow(InsufficientIntelligenceNetworkError);
  });

  // Z — Executor input immutability
  it("Z: executor does not mutate original state", () => {
    const state = createInitialGameState();
    const before = JSON.stringify(state);
    const result = executeOperationPlannerCommand(state, {
      kind: "build-network",
      targetNationId: "dravos",
      agentId: "solaris-echo",
    });
    expect(JSON.stringify(state)).toBe(before);
    expect(result.state).not.toBe(state);
  });
});
