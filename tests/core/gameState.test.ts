import { describe, it, expect } from "vitest";
import { createInitialGameState } from "../../src/core/model/gameState";

describe("createInitialGameState", () => {
  it("returns turn 1", () => {
    const state = createInitialGameState();
    expect(state.turn).toBe(1);
  });

  it("returns phase 'planning'", () => {
    const state = createInitialGameState();
    expect(state.phase).toBe("planning");
  });

  it("returns playerNationId 'solaris'", () => {
    const state = createInitialGameState();
    expect(state.playerNationId).toBe("solaris");
  });

  it("returns a new object each call", () => {
    const a = createInitialGameState();
    const b = createInitialGameState();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});
