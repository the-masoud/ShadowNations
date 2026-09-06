import { describe, it, expect } from "vitest";
import {
  resolveTurn,
  InvalidPhaseError,
  DuplicateOrderError,
} from "../../src/core/simulation/resolveTurn";
import { createInitialGameState } from "../../src/core/model/gameState";
import type { GameState } from "../../src/core/model/gameState";
import type { TurnOrder } from "../../src/core/model/turnOrder";

function planningState(overrides?: Partial<GameState>): GameState {
  return { ...createInitialGameState(), ...overrides };
}

function passOrder(id: string, nationId = "solaris"): TurnOrder {
  return { id, nationId, kind: "pass" };
}

describe("resolveTurn", () => {
  it("empty order list advances turn", () => {
    const state = planningState();
    const { state: next, result } = resolveTurn(state, []);

    expect(next.turn).toBe(2);
    expect(next.phase).toBe("planning");
    expect(result.previousTurn).toBe(1);
    expect(result.nextTurn).toBe(2);
    expect(result.processedOrderIds).toEqual([]);
  });

  it("pass order advances turn", () => {
    const state = planningState();
    const order = passOrder("o1");
    const { state: next, result } = resolveTurn(state, [order]);

    expect(next.turn).toBe(2);
    expect(result.processedOrderIds).toEqual(["o1"]);
  });

  it("multiple orders produce deterministic ordering", () => {
    const state = planningState();
    const orders = [passOrder("c"), passOrder("a"), passOrder("b")];
    const { result } = resolveTurn(state, orders);

    expect(result.processedOrderIds).toEqual(["a", "b", "c"]);
  });

  it("different input ordering produces identical processedOrderIds", () => {
    const state = planningState();
    const ordersA = [passOrder("x"), passOrder("y"), passOrder("z")];
    const ordersB = [passOrder("z"), passOrder("x"), passOrder("y")];

    const resultA = resolveTurn(state, ordersA);
    const resultB = resolveTurn(state, ordersB);

    expect(resultA.result.processedOrderIds).toEqual(
      resultB.result.processedOrderIds,
    );
  });

  it("original GameState is not mutated", () => {
    const state = planningState();
    const originalTurn = state.turn;
    const originalPhase = state.phase;

    resolveTurn(state, [passOrder("o1")]);

    expect(state.turn).toBe(originalTurn);
    expect(state.phase).toBe(originalPhase);
  });

  it("original orders array is not mutated", () => {
    const state = planningState();
    const orders: TurnOrder[] = [passOrder("b"), passOrder("a")];
    const snapshot = orders.map((o) => ({ ...o }));

    resolveTurn(state, orders);

    expect(orders).toEqual(snapshot);
  });

  it("playerNationId remains unchanged", () => {
    const state = planningState({ playerNationId: "dravos" });
    const { state: next } = resolveTurn(state, [passOrder("o1", "dravos")]);

    expect(next.playerNationId).toBe("dravos");
  });

  it("resolving from non-planning phase fails", () => {
    const state = planningState({ phase: "resolution" });

    expect(() => resolveTurn(state, [])).toThrow(InvalidPhaseError);
    expect(() => resolveTurn(state, [])).toThrow(
      'Invalid phase: expected "planning", got "resolution"',
    );
  });

  it("duplicate order IDs fail", () => {
    const state = planningState();
    const orders = [passOrder("dup"), passOrder("dup")];

    expect(() => resolveTurn(state, orders)).toThrow(DuplicateOrderError);
    expect(() => resolveTurn(state, orders)).toThrow(
      'Duplicate order id: "dup"',
    );
  });

  it("explicit comparator orders by UTF-16 code unit, not locale", () => {
    const state = planningState();
    const ids = ["z", "a", "A", "10", "2", "ä"];
    const orders = ids.map((id) => passOrder(id));
    const { result } = resolveTurn(state, orders);

    expect(result.processedOrderIds).toEqual([
      "10",
      "2",
      "A",
      "a",
      "z",
      "ä",
    ]);
  });

  it("repeated identical calls produce deeply equal outputs", () => {
    const state = planningState();
    const orders = [passOrder("a"), passOrder("b")];

    const run1 = resolveTurn(state, orders);
    const run2 = resolveTurn(state, orders);

    expect(run1.state).toEqual(run2.state);
    expect(run1.result).toEqual(run2.result);
    expect(run1.state).not.toBe(run2.state);
    expect(run1.result).not.toBe(run2.result);
  });
});
