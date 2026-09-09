import { describe, it, expect } from "vitest";
import { createInitialGameState } from "../../src/core/model/gameState.js";
import { createCampaignGameState } from "../../src/core/simulation/createCampaignGameState.js";
import { setNationStrategicStat } from "../../src/core/simulation/setNationStrategicStat.js";
import { GameStateValidationError } from "../../src/core/simulation/validateGameState.js";
import {
  SAVE_GAME_VERSION,
  SAVE_GAME_STORAGE_KEY,
  SaveGameFormatError,
  serializeGameState,
  deserializeGameState,
  saveGameState,
  loadGameState,
  type SaveGameStorage,
} from "../../src/game/save/saveGame.js";

function createMemoryStorage(): SaveGameStorage {
  const data = new Map<string, string>();
  return {
    getItem(key: string): string | null {
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      data.set(key, value);
    },
  };
}

function createInspectableMemoryStorage(): {
  readonly storage: SaveGameStorage;
  readonly data: Map<string, string>;
} {
  const data = new Map<string, string>();
  return {
    data,
    storage: {
      getItem(key: string): string | null {
        return data.get(key) ?? null;
      },
      setItem(key: string, value: string): void {
        data.set(key, value);
      },
    },
  };
}

function createVersion1StateFixture(
  state = createInitialGameState(),
): unknown {
  const fixture = JSON.parse(JSON.stringify(state)) as {
    world: Record<string, unknown>;
  };
  delete fixture.world.citySecurity;
  return fixture;
}

describe("saveGame", () => {
  // A — exact constants
  it("A: exact constants", () => {
    expect(SAVE_GAME_VERSION).toBe(2);
    expect(SAVE_GAME_STORAGE_KEY).toBe("shadow-nations.save.v1");
  });

  // B — serialization envelope
  it("B: serialization envelope", () => {
    const state = createInitialGameState();
    const serialized = serializeGameState(state);
    const parsed = JSON.parse(serialized);
    expect(Object.keys(parsed)).toEqual(["version", "state"]);
    expect(parsed.version).toBe(2);
    expect(parsed.state).toEqual(state);
  });

  // C — deterministic serialization
  it("C: deterministic serialization", () => {
    const a = createInitialGameState();
    const b = createInitialGameState();
    expect(serializeGameState(a)).toBe(serializeGameState(b));
  });

  // D — serialization input immutability
  it("D: serialization input immutability", () => {
    const state = createInitialGameState();
    const snapshot = JSON.stringify(state);
    serializeGameState(state);
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  // E — deserialize round-trip
  it("E: deserialize round-trip", () => {
    const original = createInitialGameState();
    const serialized = serializeGameState(original);
    const loaded = deserializeGameState(serialized);
    expect(loaded).toEqual(original);
    expect(loaded).not.toBe(original);
    expect(loaded.world).not.toBe(original.world);
    expect(loaded.planning).not.toBe(original.planning);
    expect(loaded.intelligence).not.toBe(original.intelligence);
  });

  // F — malformed JSON
  it("F: malformed JSON", () => {
    expect(() => deserializeGameState("{")).toThrow(SaveGameFormatError);
    expect(() => deserializeGameState("{")).toThrow(
      "Saved campaign is not valid JSON.",
    );
  });

  // G — invalid envelope
  it("G: invalid envelope", () => {
    expect(() => deserializeGameState("null")).toThrow(SaveGameFormatError);
    expect(() => deserializeGameState("null")).toThrow(
      "Saved campaign envelope is invalid.",
    );
  });

  // H — missing state key
  it("H: missing state key", () => {
    const envelope = JSON.stringify({ version: 2 });
    expect(() => deserializeGameState(envelope)).toThrow(
      SaveGameFormatError,
    );
    expect(() => deserializeGameState(envelope)).toThrow(
      "Saved campaign envelope is invalid.",
    );
  });

  // I — unsupported version
  it("I: unsupported version", () => {
    const state = createInitialGameState();
    const envelope = JSON.stringify({ version: 3, state });
    expect(() => deserializeGameState(envelope)).toThrow(
      SaveGameFormatError,
    );
    expect(() => deserializeGameState(envelope)).toThrow(
      "Unsupported save version: 3.",
    );
  });

  // J — malformed saved state
  it("J: malformed saved state", () => {
    const state = createInitialGameState();
    const badState = { ...state, turn: 0 };
    const envelope = JSON.stringify({ version: 2, state: badState });
    expect(() => deserializeGameState(envelope)).toThrow(
      SaveGameFormatError,
    );
    expect(() => deserializeGameState(envelope)).toThrow(
      "Saved campaign state is invalid.",
    );
  });

  // K — save uses exact storage key
  it("K: save uses exact storage key", () => {
    const { storage, data } = createInspectableMemoryStorage();
    const state = createInitialGameState();
    saveGameState(storage, state);
    expect(Array.from(data.keys())).toEqual([
      "shadow-nations.save.v1",
    ]);
    expect(storage.getItem(SAVE_GAME_STORAGE_KEY)).toBe(
      serializeGameState(state),
    );
  });

  // L — missing storage save
  it("L: missing storage save", () => {
    const storage = createMemoryStorage();
    expect(loadGameState(storage)).toBeNull();
  });

  // M — storage round-trip
  it("M: storage round-trip", () => {
    const storage = createMemoryStorage();
    const state = createInitialGameState();
    saveGameState(storage, state);
    const loaded = loadGameState(storage);
    expect(loaded).toEqual(state);
  });

  // N — load freshness
  it("N: load freshness", () => {
    const storage = createMemoryStorage();
    const state = createInitialGameState();
    saveGameState(storage, state);
    const a = loadGameState(storage)!;
    const b = loadGameState(storage)!;
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(a.world).not.toBe(b.world);
    expect(a.planning).not.toBe(b.planning);
    expect(a.intelligence).not.toBe(b.intelligence);
  });

  // O — alternate/progressed campaign preservation
  it("O: alternate/progressed campaign preservation", () => {
    let state = createCampaignGameState({ playerNationId: "dravos" });
    state = setNationStrategicStat(state, "dravos", "stability", 71);
    state = { ...state, turn: 5 };
    const storage = createMemoryStorage();
    saveGameState(storage, state);
    const loaded = loadGameState(storage)!;
    expect(loaded.playerNationId).toBe("dravos");
    expect(loaded.turn).toBe(5);
    const dravosStats = loaded.world.nationStrategicStats.find(
      (s) => s.nationId === "dravos",
    );
    expect(dravosStats!.stability).toBe(71);
  });

  // P — transient UI state excluded
  it("P: transient UI state excluded", () => {
    const state = createInitialGameState();
    const serialized = serializeGameState(state);
    const parsed = JSON.parse(serialized);
    expect(Object.keys(parsed)).toEqual(["version", "state"]);
    expect(parsed).not.toHaveProperty("pendingTurnEvents");
    expect(parsed).not.toHaveProperty("showTutorial");
    expect(parsed).not.toHaveProperty("tutorial");
    expect(parsed).not.toHaveProperty("eventHistory");
    expect(parsed).not.toHaveProperty("events");
  });

  // Q — serialization validation precedence
  it("Q: serialization validation precedence", () => {
    const state = createInitialGameState();
    const badState = { ...state, turn: 0 };
    expect(() => serializeGameState(badState as never)).toThrow(
      GameStateValidationError,
    );
  });

  // R — version 1 migration
  it("R: version 1 migration loads successfully", () => {
    const v1Fixture = createVersion1StateFixture();
    expect(v1Fixture).not.toHaveProperty("citySecurity");
    expect((v1Fixture as { world: Record<string, unknown> }).world).not.toHaveProperty("citySecurity");
    const v1Envelope = JSON.stringify({ version: 1, state: v1Fixture });
    const loaded = deserializeGameState(v1Envelope);
    expect(loaded).toBeDefined();
    expect(loaded.world.citySecurity).toBeDefined();
    expect(loaded.world.citySecurity).toHaveLength(18);
  });

  it("R1: migrated v1 City Security equals canonical baseSecurity", async () => {
    const v1Fixture = createVersion1StateFixture();
    const v1Envelope = JSON.stringify({ version: 1, state: v1Fixture });
    const loaded = deserializeGameState(v1Envelope);
    const { CANONICAL_CITIES } = await import("../../src/core/model/city.js");
    for (const city of CANONICAL_CITIES) {
      const security = loaded.world.citySecurity.find(
        (s: { cityId: string; value: number }) => s.cityId === city.id,
      );
      expect(security).toBeDefined();
      expect(security!.value).toBe(city.baseSecurity);
    }
  });

  it("R2: v1 migration preserves progressed campaign", () => {
    let state = createCampaignGameState({ playerNationId: "dravos" });
    state = setNationStrategicStat(state, "dravos", "stability", 71);
    state = { ...state, turn: 5 };
    const v1Fixture = createVersion1StateFixture(state);
    const v1Envelope = JSON.stringify({ version: 1, state: v1Fixture });
    const loaded = deserializeGameState(v1Envelope);
    expect(loaded.playerNationId).toBe("dravos");
    expect(loaded.turn).toBe(5);
    const dravosStats = loaded.world.nationStrategicStats.find(
      (s) => s.nationId === "dravos",
    );
    expect(dravosStats!.stability).toBe(71);
  });

  it("R3: v1 migration produces new state/world objects", () => {
    const v1Fixture = createVersion1StateFixture();
    const v1Envelope = JSON.stringify({ version: 1, state: v1Fixture });
    const loaded = deserializeGameState(v1Envelope);
    expect(loaded).not.toBe(v1Fixture);
    expect(loaded.world).not.toBe((v1Fixture as { world: unknown }).world);
  });

  it("R4: malformed v1 world fails with invalid state", () => {
    const v1Envelope = JSON.stringify({
      version: 1,
      state: { ...createInitialGameState(), world: {} },
    });
    expect(() => deserializeGameState(v1Envelope)).toThrow(
      SaveGameFormatError,
    );
    expect(() => deserializeGameState(v1Envelope)).toThrow(
      "Saved campaign state is invalid.",
    );
  });

  it("R5: v2 state missing citySecurity fails", () => {
    const v2State = { ...createInitialGameState(), world: { ...createInitialGameState().world } };
    delete (v2State.world as any).citySecurity;
    const envelope = JSON.stringify({ version: 2, state: v2State });
    expect(() => deserializeGameState(envelope)).toThrow(
      SaveGameFormatError,
    );
    expect(() => deserializeGameState(envelope)).toThrow(
      "Saved campaign state is invalid.",
    );
  });

  it("R6: v2 state with invalid citySecurity fails", () => {
    const v2State = createInitialGameState();
    const badSecurity = [...v2State.world.citySecurity, { cityId: "solara", value: -1 }];
    const badWorld = { ...v2State.world, citySecurity: badSecurity };
    const envelope = JSON.stringify({ version: 2, state: { ...v2State, world: badWorld } });
    expect(() => deserializeGameState(envelope)).toThrow(
      SaveGameFormatError,
    );
    expect(() => deserializeGameState(envelope)).toThrow(
      "Saved campaign state is invalid.",
    );
  });

  it("R7: load v1 does not rewrite storage", () => {
    const v1Fixture = createVersion1StateFixture();
    const v1Envelope = JSON.stringify({ version: 1, state: v1Fixture });
    const { storage, data } = createInspectableMemoryStorage();
    data.set(SAVE_GAME_STORAGE_KEY, v1Envelope);
    loadGameState(storage);
    expect(data.get(SAVE_GAME_STORAGE_KEY)).toBe(v1Envelope);
  });

  it("R8: explicit save after v1 load writes v2 to same slot", () => {
    const v1Fixture = createVersion1StateFixture();
    const v1Envelope = JSON.stringify({ version: 1, state: v1Fixture });
    const { storage, data } = createInspectableMemoryStorage();
    data.set(SAVE_GAME_STORAGE_KEY, v1Envelope);
    const loaded = loadGameState(storage)!;
    saveGameState(storage, loaded);
    const saved = data.get(SAVE_GAME_STORAGE_KEY);
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(parsed.version).toBe(2);
  });
});
