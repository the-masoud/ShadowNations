import { describe, it, expect } from "vitest";
import { createInitialGameState } from "../../src/core/model/gameState.js";
import type { GameState } from "../../src/core/model/gameState.js";
import type { GameEvent } from "../../src/core/model/gameEvent.js";
import {
  executeTurnResolution,
} from "../../src/game/ui/executeTurnResolution.js";
import {
  createTurnResolutionPresentationModel,
} from "../../src/game/ui/turnResolutionPresentation.js";
import { buildIntelligenceNetwork } from "../../src/core/simulation/buildIntelligenceNetwork.js";
import { gatherIntelligence } from "../../src/core/simulation/gatherIntelligence.js";
import { setIntelligenceNetworkLevel } from "../../src/core/simulation/setIntelligenceNetworkLevel.js";
import { spendActionPoints } from "../../src/core/simulation/spendActionPoints.js";
import { GameStateValidationError } from "../../src/core/simulation/validateGameState.js";
import { InvalidPhaseError } from "../../src/core/simulation/resolveTurn.js";

describe("executeTurnResolution", () => {
  // A — Executor validation precedence
  it("A: executor throws GameStateValidationError for invalid state", () => {
    const invalidState = { ...createInitialGameState(), turn: 0 };
    expect(() => executeTurnResolution(invalidState)).toThrow(
      GameStateValidationError,
    );
  });

  // B — Initial turn resolution
  it("B: initial turn resolution invariants", () => {
    const state = createInitialGameState();
    const { state: nextState, result } = executeTurnResolution(state);
    expect(nextState.turn).toBe(2);
    expect(nextState.phase).toBe("planning");
    expect(result.previousTurn).toBe(1);
    expect(result.nextTurn).toBe(2);
    expect(result.processedOrderIds).toEqual([]);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].type).toBe("turn-advanced");
    const evt = result.events[0] as Extract<GameEvent, { type: "turn-advanced" }>;
    expect(evt.previousTurn).toBe(1);
    expect(evt.nextTurn).toBe(2);
  });

  // C — AP reset
  it("C: AP reset after turn resolution", () => {
    let state = createInitialGameState();
    state = spendActionPoints(state, "solaris", 4);
    const { state: nextState } = executeTurnResolution(state);
    const ap = nextState.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!;
    expect(ap.remaining).toBe(6);
    expect(ap.maximum).toBe(6);
  });

  // D — Executor input immutability
  it("D: executor does not mutate original state", () => {
    const state = createInitialGameState();
    const before = JSON.stringify(state);
    const { state: nextState } = executeTurnResolution(state);
    expect(JSON.stringify(state)).toBe(before);
    expect(nextState).not.toBe(state);
  });

  // E — Core error propagation
  it("E: InvalidPhaseError for non-planning phase", () => {
    const state: GameState = {
      ...createInitialGameState(),
      phase: "resolution",
    };
    expect(() => executeTurnResolution(state)).toThrow(InvalidPhaseError);
  });
});

describe("turnResolutionPresentation", () => {
  // F — Exact initial presentation model
  it("F: exact initial presentation model", () => {
    const state = createInitialGameState();
    const { result } = executeTurnResolution(state);
    const model = createTurnResolutionPresentationModel([], result);
    expect(model).toEqual({
      previousTurn: 1,
      nextTurn: 2,
      eventCount: 1,
      events: [
        { type: "turn-advanced", label: "TURN ADVANCED" },
      ],
    });
  });

  // G — Event label mapping
  it("G: all 15 event types map to exact labels", () => {
    const state = createInitialGameState();
    const { result } = executeTurnResolution(state);
    const allTypes: GameEvent["type"][] = [
      "intelligence-network-built",
      "intelligence-gathered",
      "intelligence-asset-recruited",
      "counterintelligence-sweep",
      "intelligence-asset-turned",
      "false-intelligence-fed",
      "turn-advanced",
      "political-influence-cultivated",
      "diplomatic-outreach-conducted",
      "government-stabilized",
      "covert-sabotage-conducted",
      "proxy-conflict-started",
      "proxy-conflict-escalated",
      "regime-pressure-applied",
      "city-security-normalized",
    ];
    const expectedLabels: string[] = [
      "INTELLIGENCE NETWORK BUILT",
      "INTELLIGENCE GATHERED",
      "INTELLIGENCE ASSET RECRUITED",
      "COUNTERINTELLIGENCE SWEEP",
      "INTELLIGENCE ASSET TURNED",
      "FALSE INTELLIGENCE FED",
      "TURN ADVANCED",
      "POLITICAL INFLUENCE CULTIVATED",
      "DIPLOMATIC OUTREACH CONDUCTED",
      "GOVERNMENT STABILIZED",
      "COVERT SABOTAGE CONDUCTED",
      "PROXY CONFLICT STARTED",
      "PROXY CONFLICT ESCALATED",
      "REGIME PRESSURE APPLIED",
      "CITY SECURITY NORMALIZED",
    ];
    for (let i = 0; i < allTypes.length; i++) {
      const fakeEvents = [{ type: allTypes[i] }] as unknown as GameEvent[];
      const model = createTurnResolutionPresentationModel(fakeEvents, result);
      expect(model.events[0].type).toBe(allTypes[i]);
      expect(model.events[0].label).toBe(expectedLabels[i]);
    }
  });

  // H — Pending-event order
  it("H: pending event precedes turn-advanced", () => {
    let state = createInitialGameState();
    const buildResult = buildIntelligenceNetwork(
      state,
      "solaris",
      "dravos",
      "solaris-echo",
    );
    state = buildResult.state;
    const { result } = executeTurnResolution(state);
    const model = createTurnResolutionPresentationModel(
      [buildResult.event],
      result,
    );
    expect(model.events.map((e) => e.type)).toEqual([
      "intelligence-network-built",
      "turn-advanced",
    ]);
    expect(model.eventCount).toBe(2);
  });

  // I — Multiple operation chronology
  it("I: multiple pending events preserve execution order", () => {
    let state = createInitialGameState();
    const buildResult = buildIntelligenceNetwork(
      state,
      "solaris",
      "dravos",
      "solaris-echo",
    );
    state = buildResult.state;
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "foothold");
    const gatherResult = gatherIntelligence(
      state,
      "solaris",
      "dravos",
      "solaris-echo",
    );
    state = gatherResult.state;
    const { result } = executeTurnResolution(state);
    const model = createTurnResolutionPresentationModel(
      [buildResult.event, gatherResult.event],
      result,
    );
    expect(model.events.map((e) => e.type)).toEqual([
      "intelligence-network-built",
      "intelligence-gathered",
      "turn-advanced",
    ]);
    expect(model.eventCount).toBe(3);
  });

  // J — Presentation freshness
  it("J: presentation returns fresh references for identical inputs", () => {
    const state = createInitialGameState();
    const { result } = executeTurnResolution(state);
    const a = createTurnResolutionPresentationModel([], result);
    const b = createTurnResolutionPresentationModel([], result);
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(a.events).not.toBe(b.events);
    expect(a.events[0]).not.toBe(b.events[0]);
  });

  // K — Presentation immutability
  it("K: pendingEvents and TurnResult unchanged after model creation", () => {
    const state = createInitialGameState();
    const { result } = executeTurnResolution(state);
    const pendingBefore = JSON.stringify(result.events);
    const resultBefore = JSON.stringify(result);
    createTurnResolutionPresentationModel(result.events, result);
    expect(JSON.stringify(result.events)).toBe(pendingBefore);
    expect(JSON.stringify(result)).toBe(resultBefore);
  });

  // L — No persistent event history
  it("L: resolved GameState has no event history fields", () => {
    const state = createInitialGameState();
    const { state: nextState } = executeTurnResolution(state);
    const asRecord = nextState as unknown as Record<string, unknown>;
    expect(asRecord.pendingTurnEvents).toBeUndefined();
    expect(asRecord.eventHistory).toBeUndefined();
    expect(asRecord.events).toBeUndefined();
    expect(asRecord.lastEvent).toBeUndefined();
  });
});
