import type { GameState } from "../../core/model/gameState.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";

export const SAVE_GAME_VERSION = 1;
export const SAVE_GAME_STORAGE_KEY = "shadow-nations.save.v1";

export interface SaveGameEnvelope {
  readonly version: 1;
  readonly state: GameState;
}

export interface SaveGameStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class SaveGameFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SaveGameFormatError";
  }
}

export function serializeGameState(
  state: Readonly<GameState>,
): string {
  validateGameState(state);
  return JSON.stringify({
    version: SAVE_GAME_VERSION,
    state,
  });
}

export function deserializeGameState(
  serialized: string,
): GameState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new SaveGameFormatError(
      "Saved campaign is not valid JSON.",
    );
  }

  if (
    parsed === null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    throw new SaveGameFormatError(
      "Saved campaign envelope is invalid.",
    );
  }

  const envelope = parsed as Record<string, unknown>;

  if (!("version" in envelope) || !("state" in envelope)) {
    throw new SaveGameFormatError(
      "Saved campaign envelope is invalid.",
    );
  }

  if (envelope.version !== SAVE_GAME_VERSION) {
    throw new SaveGameFormatError(
      `Unsupported save version: ${envelope.version}.`,
    );
  }

  const candidate = envelope.state;

  if (
    candidate === null ||
    typeof candidate !== "object" ||
    Array.isArray(candidate)
  ) {
    throw new SaveGameFormatError(
      "Saved campaign state is invalid.",
    );
  }

  try {
    validateGameState(candidate as GameState);
  } catch {
    throw new SaveGameFormatError(
      "Saved campaign state is invalid.",
    );
  }

  return candidate as GameState;
}

export function saveGameState(
  storage: SaveGameStorage,
  state: Readonly<GameState>,
): void {
  const serialized = serializeGameState(state);
  storage.setItem(SAVE_GAME_STORAGE_KEY, serialized);
}

export function loadGameState(
  storage: SaveGameStorage,
): GameState | null {
  const serialized = storage.getItem(SAVE_GAME_STORAGE_KEY);
  if (serialized === null) {
    return null;
  }
  return deserializeGameState(serialized);
}
