import { describe, it, expect } from "vitest";
import {
  createInitialGameState,
  type GameState,
} from "../../src/core/model/gameState";
import {
  buildIntelligenceNetwork,
  BUILD_NETWORK_AP_COST,
} from "../../src/core/simulation/buildIntelligenceNetwork";
import {
  gatherIntelligence,
  GATHER_INTELLIGENCE_AP_COST,
} from "../../src/core/simulation/gatherIntelligence";
import {
  recruitIntelligenceAsset,
  RECRUIT_ASSET_AP_COST,
} from "../../src/core/simulation/recruitIntelligenceAsset";
import {
  runCounterintelligenceSweep,
  COUNTERINTELLIGENCE_SWEEP_AP_COST,
} from "../../src/core/simulation/runCounterintelligenceSweep";
import {
  turnIntelligenceAsset,
  TURN_ASSET_AP_COST,
} from "../../src/core/simulation/turnIntelligenceAsset";
import {
  feedFalseIntelligence,
  FEED_FALSE_INTELLIGENCE_AP_COST,
} from "../../src/core/simulation/feedFalseIntelligence";
import { setNationVisibility } from "../../src/core/simulation/setNationVisibility";
import { resetActionPointsForNewTurn } from "../../src/core/simulation/resetActionPointsForNewTurn";
import { resolveTurn } from "../../src/core/simulation/resolveTurn";
import type { TurnOrder } from "../../src/core/model/turnOrder";
import type {
  IntelligenceNetworkBuiltEvent,
  IntelligenceGatheredEvent,
  IntelligenceAssetRecruitedEvent,
  CounterintelligenceSweepEvent,
  IntelligenceAssetTurnedEvent,
  FalseIntelligenceFedEvent,
  TurnAdvancedEvent,
} from "../../src/core/model/gameEvent";

function validState(): GameState {
  return createInitialGameState();
}

function passOrder(id: string, nationId = "solaris"): TurnOrder {
  return { id, nationId, kind: "pass" };
}

function resetAP(state: GameState): GameState {
  return { ...state, planning: resetActionPointsForNewTurn(state.planning) };
}

function setupFullAwarenessSequence(state: GameState): GameState {
  let s = state;
  s = buildIntelligenceNetwork(s, "solaris", "dravos", "solaris-echo").state;
  s = buildIntelligenceNetwork(s, "solaris", "dravos", "solaris-echo").state;
  s = recruitIntelligenceAsset(s, "solaris", "dravos", "solaris-echo", "asset-dravos-001").state;
  s = resetAP(s);
  s = runCounterintelligenceSweep(s, "dravos", "solaris").state;
  s = resetAP(s);
  s = runCounterintelligenceSweep(s, "dravos", "solaris").state;
  return s;
}

describe("OPERATION RESULT TYPE", () => {
  it("buildIntelligenceNetwork returns { state, event }", () => {
    const state = validState();
    const result = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    expect(result).toHaveProperty("state");
    expect(result).toHaveProperty("event");
    expect(result.state).not.toBe(state);
  });

  it("gatherIntelligence returns { state, event }", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    const result = gatherIntelligence(state, "solaris", "dravos", "solaris-echo");
    expect(result).toHaveProperty("state");
    expect(result).toHaveProperty("event");
  });

  it("recruitIntelligenceAsset returns { state, event }", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    const result = recruitIntelligenceAsset(state, "solaris", "dravos", "solaris-echo", "asset-001");
    expect(result).toHaveProperty("state");
    expect(result).toHaveProperty("event");
  });

  it("runCounterintelligenceSweep returns { state, event }", () => {
    const state = validState();
    const result = runCounterintelligenceSweep(state, "dravos", "solaris");
    expect(result).toHaveProperty("state");
    expect(result).toHaveProperty("event");
  });

  it("turnIntelligenceAsset returns { state, event }", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    state = resetAP(state);
    const result = turnIntelligenceAsset(state, "dravos", "asset-dravos-001");
    expect(result).toHaveProperty("state");
    expect(result).toHaveProperty("event");
  });

  it("feedFalseIntelligence returns { state, event }", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = resetAP(state);
    state = turnIntelligenceAsset(state, "dravos", "asset-dravos-001").state;
    state = resetAP(state);
    const result = feedFalseIntelligence(state, "dravos", "asset-dravos-001");
    expect(result).toHaveProperty("state");
    expect(result).toHaveProperty("event");
  });
});

describe("BUILD NETWORK EVENT", () => {
  it("emits intelligence-network-built with correct fields", () => {
    const state = validState();
    const { event } = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    expect(event.type).toBe("intelligence-network-built");
    const e = event as IntelligenceNetworkBuiltEvent;
    expect(e.turn).toBe(1);
    expect(e.actorNationId).toBe("solaris");
    expect(e.targetNationId).toBe("dravos");
    expect(e.agentId).toBe("solaris-echo");
    expect(e.previousLevel).toBe("none");
    expect(e.newLevel).toBe("foothold");
    expect(e.actionPointCost).toBe(BUILD_NETWORK_AP_COST);
  });

  it("foothold -> established records previousLevel correctly", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    const { event } = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    const e = event as IntelligenceNetworkBuiltEvent;
    expect(e.previousLevel).toBe("foothold");
    expect(e.newLevel).toBe("established");
  });

  it("established -> deep records previousLevel correctly", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    const { event } = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    const e = event as IntelligenceNetworkBuiltEvent;
    expect(e.previousLevel).toBe("established");
    expect(e.newLevel).toBe("deep");
  });
});

describe("GATHER INTELLIGENCE EVENT", () => {
  it("emits intelligence-gathered unknown -> limited", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    const { event } = gatherIntelligence(state, "solaris", "dravos", "solaris-echo");
    expect(event.type).toBe("intelligence-gathered");
    const e = event as IntelligenceGatheredEvent;
    expect(e.turn).toBe(1);
    expect(e.actorNationId).toBe("solaris");
    expect(e.targetNationId).toBe("dravos");
    expect(e.agentId).toBe("solaris-echo");
    expect(e.previousVisibility).toBe("unknown");
    expect(e.newVisibility).toBe("limited");
    expect(e.actionPointCost).toBe(GATHER_INTELLIGENCE_AP_COST);
  });

  it("emits intelligence-gathered limited -> known", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    state = gatherIntelligence(state, "solaris", "dravos", "solaris-echo").state;
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    const { event } = gatherIntelligence(state, "solaris", "dravos", "solaris-echo");
    const e = event as IntelligenceGatheredEvent;
    expect(e.previousVisibility).toBe("limited");
    expect(e.newVisibility).toBe("known");
  });
});

describe("RECRUIT ASSET EVENT", () => {
  it("emits intelligence-asset-recruited with correct access", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    const { event } = recruitIntelligenceAsset(state, "solaris", "dravos", "solaris-echo", "asset-001");
    expect(event.type).toBe("intelligence-asset-recruited");
    const e = event as IntelligenceAssetRecruitedEvent;
    expect(e.turn).toBe(1);
    expect(e.actorNationId).toBe("solaris");
    expect(e.targetNationId).toBe("dravos");
    expect(e.agentId).toBe("solaris-echo");
    expect(e.assetId).toBe("asset-001");
    expect(e.access).toBe("limited");
    expect(e.actionPointCost).toBe(RECRUIT_ASSET_AP_COST);
  });

  it("deep network emits high access", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    state = resetAP(state);
    const { event } = recruitIntelligenceAsset(state, "solaris", "dravos", "solaris-echo", "asset-001");
    const e = event as IntelligenceAssetRecruitedEvent;
    expect(e.access).toBe("high");
  });
});

describe("SWEEP EVENT", () => {
  it("emits counterintelligence-sweep with presence detected", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    const { event } = runCounterintelligenceSweep(state, "dravos", "solaris");
    expect(event.type).toBe("counterintelligence-sweep");
    const e = event as CounterintelligenceSweepEvent;
    expect(e.turn).toBe(1);
    expect(e.defenderNationId).toBe("dravos");
    expect(e.intruderNationId).toBe("solaris");
    expect(e.foreignPresenceDetected).toBe(true);
    expect(e.previousAwareness).toBe("unaware");
    expect(e.newAwareness).toBe("suspected");
    expect(e.actionPointCost).toBe(COUNTERINTELLIGENCE_SWEEP_AP_COST);
  });

  it("emits counterintelligence-sweep with no presence", () => {
    const state = validState();
    const { event } = runCounterintelligenceSweep(state, "dravos", "solaris");
    const e = event as CounterintelligenceSweepEvent;
    expect(e.foreignPresenceDetected).toBe(false);
    expect(e.previousAwareness).toBe("unaware");
    expect(e.newAwareness).toBe("unaware");
  });

  it("second sweep on same pair: suspected -> identified", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    state = runCounterintelligenceSweep(state, "dravos", "solaris").state;
    state = resetAP(state);
    const { event } = runCounterintelligenceSweep(state, "dravos", "solaris");
    const e = event as CounterintelligenceSweepEvent;
    expect(e.previousAwareness).toBe("suspected");
    expect(e.newAwareness).toBe("identified");
  });
});

describe("TURN ASSET EVENT", () => {
  it("emits intelligence-asset-turned with correct fields", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    state = resetAP(state);
    const { event } = turnIntelligenceAsset(state, "dravos", "asset-dravos-001");
    expect(event.type).toBe("intelligence-asset-turned");
    const e = event as IntelligenceAssetTurnedEvent;
    expect(e.turn).toBe(1);
    expect(e.defenderNationId).toBe("dravos");
    expect(e.intruderNationId).toBe("solaris");
    expect(e.assetId).toBe("asset-dravos-001");
    expect(e.actionPointCost).toBe(TURN_ASSET_AP_COST);
  });
});

describe("FALSE INTELLIGENCE EVENT", () => {
  it("emits false-intelligence-fed known -> limited", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = resetAP(state);
    state = turnIntelligenceAsset(state, "dravos", "asset-dravos-001").state;
    state = resetAP(state);
    const { event } = feedFalseIntelligence(state, "dravos", "asset-dravos-001");
    expect(event.type).toBe("false-intelligence-fed");
    const e = event as FalseIntelligenceFedEvent;
    expect(e.turn).toBe(1);
    expect(e.controllerNationId).toBe("dravos");
    expect(e.observerNationId).toBe("solaris");
    expect(e.assetId).toBe("asset-dravos-001");
    expect(e.previousVisibility).toBe("known");
    expect(e.newVisibility).toBe("limited");
    expect(e.actionPointCost).toBe(FEED_FALSE_INTELLIGENCE_AP_COST);
  });

  it("emits false-intelligence-fed limited -> unknown", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    state = setNationVisibility(state, "solaris", "dravos", "limited");
    state = resetAP(state);
    state = turnIntelligenceAsset(state, "dravos", "asset-dravos-001").state;
    state = resetAP(state);
    const { event } = feedFalseIntelligence(state, "dravos", "asset-dravos-001");
    const e = event as FalseIntelligenceFedEvent;
    expect(e.previousVisibility).toBe("limited");
    expect(e.newVisibility).toBe("unknown");
  });
});

describe("TURN ADVANCED EVENT", () => {
  it("resolveTurn emits turn-advanced with correct fields", () => {
    const state = validState();
    const { result } = resolveTurn(state, [passOrder("o1")]);
    expect(result.events).toHaveLength(1);
    const e = result.events[0] as TurnAdvancedEvent;
    expect(e.type).toBe("turn-advanced");
    expect(e.turn).toBe(2);
    expect(e.previousTurn).toBe(1);
    expect(e.nextTurn).toBe(2);
    expect(result.processedOrderIds).toEqual(["o1"]);
  });

  it("resolveTurn with empty orders emits turn-advanced", () => {
    const state = validState();
    const { result } = resolveTurn(state, []);
    expect(result.events).toHaveLength(1);
    const e = result.events[0] as TurnAdvancedEvent;
    expect(e.type).toBe("turn-advanced");
    expect(result.processedOrderIds).toEqual([]);
  });

  it("multiple orders produce sorted processedOrderIds in event", () => {
    const state = validState();
    const { result } = resolveTurn(state, [
      passOrder("o3"),
      passOrder("o1"),
      passOrder("o2"),
    ]);
    expect(result.processedOrderIds).toEqual(["o1", "o2", "o3"]);
    const e = result.events[0] as TurnAdvancedEvent;
    expect(e.processedOrderIds).toEqual(["o1", "o2", "o3"]);
  });
});

describe("EVENT STATE INTEGRITY", () => {
  it("buildIntelligenceNetwork: returned state matches expected", () => {
    const state = validState();
    const { state: next } = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    expect(next.turn).toBe(state.turn);
    expect(next.phase).toBe(state.phase);
    expect(next.world).toBe(state.world);
    expect(next.intelligence.nationVisibility).toBe(state.intelligence.nationVisibility);
    expect(next.intelligence.agents).toBe(state.intelligence.agents);
  });

  it("gatherIntelligence: returned state matches expected", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    const { state: next } = gatherIntelligence(state, "solaris", "dravos", "solaris-echo");
    expect(next.turn).toBe(state.turn);
    expect(next.phase).toBe(state.phase);
    expect(next.intelligence.networks).toBe(state.intelligence.networks);
    expect(next.intelligence.agents).toBe(state.intelligence.agents);
  });

  it("recruitIntelligenceAsset: returned state matches expected", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    const { state: next } = recruitIntelligenceAsset(state, "solaris", "dravos", "solaris-echo", "asset-001");
    expect(next.turn).toBe(state.turn);
    expect(next.intelligence.nationVisibility).toBe(state.intelligence.nationVisibility);
    expect(next.intelligence.networks).toBe(state.intelligence.networks);
    expect(next.intelligence.agents).toBe(state.intelligence.agents);
  });

  it("sweep: returned state matches expected", () => {
    const state = validState();
    const { state: next } = runCounterintelligenceSweep(state, "dravos", "solaris");
    expect(next.turn).toBe(state.turn);
    expect(next.intelligence.nationVisibility).toBe(state.intelligence.nationVisibility);
    expect(next.intelligence.networks).toBe(state.intelligence.networks);
    expect(next.intelligence.agents).toBe(state.intelligence.agents);
  });

  it("turn asset: returned state matches expected", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    state = resetAP(state);
    const { state: next } = turnIntelligenceAsset(state, "dravos", "asset-dravos-001");
    expect(next.turn).toBe(state.turn);
    expect(next.intelligence.nationVisibility).toBe(state.intelligence.nationVisibility);
    expect(next.intelligence.networks).toBe(state.intelligence.networks);
    expect(next.intelligence.agents).toBe(state.intelligence.agents);
  });

  it("false intel: returned state matches expected", () => {
    let state = validState();
    state = setupFullAwarenessSequence(state);
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = resetAP(state);
    state = turnIntelligenceAsset(state, "dravos", "asset-dravos-001").state;
    state = resetAP(state);
    const { state: next } = feedFalseIntelligence(state, "dravos", "asset-dravos-001");
    expect(next.turn).toBe(state.turn);
    expect(next.intelligence.networks).toBe(state.intelligence.networks);
    expect(next.intelligence.agents).toBe(state.intelligence.agents);
  });
});

describe("TURN RESULT EVENTS FIELD", () => {
  it("resolveTurn result has events array", () => {
    const state = validState();
    const { result } = resolveTurn(state, [passOrder("o1")]);
    expect(Array.isArray(result.events)).toBe(true);
    expect(result.events.length).toBeGreaterThan(0);
  });

  it("all events are valid GameEvent types", () => {
    const state = validState();
    const { result } = resolveTurn(state, [passOrder("o1")]);
    for (const event of result.events) {
      expect(event).toHaveProperty("type");
      expect(typeof event.type).toBe("string");
    }
  });

  it("result.previousTurn and result.nextTurn are correct", () => {
    const state = validState();
    const { result } = resolveTurn(state, [passOrder("o1")]);
    expect(result.previousTurn).toBe(1);
    expect(result.nextTurn).toBe(2);
  });
});

describe("IMMUTABILITY WITH EVENTS", () => {
  it("operation does not mutate input state", () => {
    const state = validState();
    const snapshot = JSON.parse(JSON.stringify(state));
    buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    expect(state).toEqual(snapshot);
  });

  it("returned state is a new object", () => {
    const state = validState();
    const { state: next } = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    expect(next).not.toBe(state);
  });

  it("returned event is a new object", () => {
    const state = validState();
    const { event: e1 } = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    const { event: e2 } = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    expect(e1).not.toBe(e2);
  });
});

describe("EVENT TURN NUMBER", () => {
  it("all operation events use state.turn (not nextTurn)", () => {
    let state = validState();
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    state = gatherIntelligence(state, "solaris", "dravos", "solaris-echo").state;
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    state = resetAP(state);
    const { event: buildEvent } = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    expect(buildEvent.turn).toBe(state.turn);
  });
});

describe("VERTICAL SLICE WITH EVENTS", () => {
  it("full scenario emits correct event sequence", () => {
    let state = validState();

    const b1 = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo");
    expect(b1.event.type).toBe("intelligence-network-built");
    state = b1.state;

    const g1 = gatherIntelligence(state, "solaris", "dravos", "solaris-echo");
    expect(g1.event.type).toBe("intelligence-gathered");
    state = g1.state;

    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;
    state = resetAP(state);
    state = buildIntelligenceNetwork(state, "solaris", "dravos", "solaris-echo").state;

    state = resetAP(state);

    const r1 = recruitIntelligenceAsset(state, "solaris", "dravos", "solaris-echo", "asset-001");
    expect(r1.event.type).toBe("intelligence-asset-recruited");
    state = r1.state;

    state = resetAP(state);

    const s1 = runCounterintelligenceSweep(state, "dravos", "solaris");
    expect(s1.event.type).toBe("counterintelligence-sweep");
    expect((s1.event as CounterintelligenceSweepEvent).newAwareness).toBe("suspected");
    state = s1.state;

    state = resetAP(state);

    const s2 = runCounterintelligenceSweep(state, "dravos", "solaris");
    expect((s2.event as CounterintelligenceSweepEvent).newAwareness).toBe("identified");
    state = s2.state;

    state = resetAP(state);

    const t1 = turnIntelligenceAsset(state, "dravos", "asset-001");
    expect(t1.event.type).toBe("intelligence-asset-turned");
    state = t1.state;

    state = setNationVisibility(state, "solaris", "dravos", "limited");
    state = resetAP(state);

    const f1 = feedFalseIntelligence(state, "dravos", "asset-001");
    expect(f1.event.type).toBe("false-intelligence-fed");
    expect((f1.event as FalseIntelligenceFedEvent).newVisibility).toBe("unknown");
    state = f1.state;

    const turnResult = resolveTurn(state, [passOrder("o1")]);
    expect(turnResult.result.events[0].type).toBe("turn-advanced");
  });
});
