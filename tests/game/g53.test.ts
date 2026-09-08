import { describe, it, expect } from "vitest";
import { createInitialGameState } from "../../src/core/model/gameState.js";
import { getNationStrategicStats } from "../../src/core/model/nationStrategicStats.js";
import { executeTurnResolution } from "../../src/game/ui/executeTurnResolution.js";
import { createTurnResolutionPresentationModel } from "../../src/game/ui/turnResolutionPresentation.js";
import type { GameState } from "../../src/core/model/gameState.js";

function turnNState(n: number): GameState {
  const s = createInitialGameState();
  return { ...s, turn: n };
}

describe("g53 game tests", () => {
  // O — executeTurnResolution turn 1 -> 2
  it("O: executeTurnResolution turn 1 -> 2 no crisis", () => {
    const state = createInitialGameState();
    const { result } = executeTurnResolution(state);
    expect(result.events.map((e) => e.type)).toEqual(["turn-advanced"]);
  });

  // P — executeTurnResolution turn 2 -> 3
  it("P: executeTurnResolution turn 2 -> 3 stability crisis", () => {
    const state = turnNState(2);
    const { state: next, result } = executeTurnResolution(state);
    expect(result.events.map((e) => e.type)).toEqual([
      "turn-advanced",
      "campaign-crisis-triggered",
    ]);
    const stats = getNationStrategicStats(next.world, "solaris");
    expect(stats.stability).toBe(67);
  });

  // Q — crisis presentation label stability
  it("Q: crisis presentation label stability", () => {
    const state = turnNState(2);
    const { result } = executeTurnResolution(state);
    const presentation = createTurnResolutionPresentationModel([], result);
    const crisisEvent = presentation.events.find(
      (e) => e.type === "campaign-crisis-triggered",
    )!;
    expect(crisisEvent.label).toBe("CAMPAIGN CRISIS — STABILITY SHOCK");
  });

  // R — crisis presentation label public support
  it("R: crisis presentation label public support", () => {
    const state = turnNState(5);
    const { result } = executeTurnResolution(state);
    const presentation = createTurnResolutionPresentationModel([], result);
    const crisisEvent = presentation.events.find(
      (e) => e.type === "campaign-crisis-triggered",
    )!;
    expect(crisisEvent.label).toBe(
      "CAMPAIGN CRISIS — PUBLIC SUPPORT SHOCK",
    );
  });

  // S — crisis presentation label security
  it("S: crisis presentation label security", () => {
    const state = turnNState(8);
    const { result } = executeTurnResolution(state);
    const presentation = createTurnResolutionPresentationModel([], result);
    const crisisEvent = presentation.events.find(
      (e) => e.type === "campaign-crisis-triggered",
    )!;
    expect(crisisEvent.label).toBe("CAMPAIGN CRISIS — SECURITY SHOCK");
  });

  // T — combined chronology
  it("T: combined chronology with pending event", () => {
    const state = turnNState(2);
    const { result } = executeTurnResolution(state);
    const pendingEvent = {
      type: "government-stabilized" as const,
      turn: 2,
      actorNationId: "solaris" as const,
      targetNationId: "dravos" as const,
      previousStability: 60,
      newStability: 70,
      actionPointCost: 2,
    };
    const presentation = createTurnResolutionPresentationModel(
      [pendingEvent],
      result,
    );
    expect(presentation.events.map((e) => e.type)).toEqual([
      "government-stabilized",
      "turn-advanced",
      "campaign-crisis-triggered",
    ]);
  });
});
