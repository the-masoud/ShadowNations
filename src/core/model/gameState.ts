export type GamePhase = "planning";

export interface GameState {
  turn: number;
  phase: GamePhase;
  playerNationId: string;
}

export function createInitialGameState(): GameState {
  return {
    turn: 1,
    phase: "planning",
    playerNationId: "solaris",
  };
}
