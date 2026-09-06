import type { GameState } from "../model/gameState.js";
import type { TurnOrder } from "../model/turnOrder.js";
import type { TurnResult } from "../model/turnResult.js";

export class InvalidPhaseError extends Error {
  constructor(expected: string, actual: string) {
    super(`Invalid phase: expected "${expected}", got "${actual}"`);
    this.name = "InvalidPhaseError";
  }
}

export class DuplicateOrderError extends Error {
  constructor(id: string) {
    super(`Duplicate order id: "${id}"`);
    this.name = "DuplicateOrderError";
  }
}

const compareIds = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;

function sortedIds(orders: readonly TurnOrder[]): string[] {
  return orders.map((o) => o.id).sort(compareIds);
}

function validateNoDuplicates(orders: readonly TurnOrder[]): void {
  const seen = new Set<string>();
  for (const order of orders) {
    if (seen.has(order.id)) {
      throw new DuplicateOrderError(order.id);
    }
    seen.add(order.id);
  }
}

export function resolveTurn(
  state: Readonly<GameState>,
  orders: readonly TurnOrder[],
): { state: GameState; result: TurnResult } {
  if (state.phase !== "planning") {
    throw new InvalidPhaseError("planning", state.phase);
  }

  validateNoDuplicates(orders);

  const processedOrderIds = sortedIds(orders);

  const nextState: GameState = {
    turn: state.turn + 1,
    phase: "planning",
    playerNationId: state.playerNationId,
    world: state.world,
  };

  const result: TurnResult = {
    previousTurn: state.turn,
    nextTurn: state.turn + 1,
    processedOrderIds,
  };

  return { state: nextState, result };
}
