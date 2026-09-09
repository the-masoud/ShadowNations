import type { GameState } from "../../core/model/gameState.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import { createInitialCitySecurity } from "../../core/model/citySecurity.js";

export const SAVE_GAME_VERSION = 2;
export const SAVE_GAME_STORAGE_KEY = "shadow-nations.save.v1";

export interface SaveGameEnvelope {
  readonly version: 2;
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

function migrateV1State(candidate: Record<string, unknown>): GameState {
  if (
    candidate === null ||
    typeof candidate !== "object" ||
    Array.isArray(candidate)
  ) {
    throw new SaveGameFormatError("Saved campaign state is invalid.");
  }

  const candidateWorld = candidate.world;
  if (
    candidateWorld === null ||
    typeof candidateWorld !== "object" ||
    Array.isArray(candidateWorld)
  ) {
    throw new SaveGameFormatError("Saved campaign state is invalid.");
  }

  const migratedWorld = {
    ...(candidateWorld as Record<string, unknown>),
    citySecurity: createInitialCitySecurity(),
  };

  const migratedState = {
    ...candidate,
    world: migratedWorld,
  };

  try {
    validateGameState(migratedState as GameState);
  } catch {
    throw new SaveGameFormatError("Saved campaign state is invalid.");
  }

  return migratedState as GameState;
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

  const version = envelope.version;

  if (version === 1) {
    const candidate = envelope.state;
    return migrateV1State(candidate as Record<string, unknown>);
  }

  if (version === 2) {
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

  throw new SaveGameFormatError(
    `Unsupported save version: ${version}.`,
  );
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