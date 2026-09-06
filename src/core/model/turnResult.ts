export interface TurnResult {
  readonly previousTurn: number;
  readonly nextTurn: number;
  readonly processedOrderIds: readonly string[];
}
