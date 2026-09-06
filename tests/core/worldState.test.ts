import { describe, it, expect } from "vitest";
import {
  createInitialWorldState,
  getNationById,
  validateWorldState,
  UnknownNationError,
  WorldValidationError,
} from "../../src/core/model/worldState";
import type { WorldState } from "../../src/core/model/worldState";
import { createInitialStrategicMap } from "../../src/core/model/strategicMap";
import { createInitialGameState } from "../../src/core/model/gameState";
import { resolveTurn } from "../../src/core/simulation/resolveTurn";

const CANONICAL_IDS = [
  "solaris",
  "dravos",
  "norvia",
  "veloria",
  "karsen",
  "arkania",
];

const CANONICAL_CODES = ["SOL", "DRA", "NOR", "VEL", "KAR", "ARK"];

describe("createInitialWorldState", () => {
  it("contains exactly six nations", () => {
    const world = createInitialWorldState();
    expect(world.nations).toHaveLength(6);
  });

  it("canonical nation order is exact", () => {
    const world = createInitialWorldState();
    const ids = world.nations.map((n) => n.id);
    expect(ids).toEqual(CANONICAL_IDS);
  });

  it("all expected IDs are present", () => {
    const world = createInitialWorldState();
    const ids = world.nations.map((n) => n.id);
    for (const expected of CANONICAL_IDS) {
      expect(ids).toContain(expected);
    }
  });

  it("all expected codes are present", () => {
    const world = createInitialWorldState();
    const codes = world.nations.map((n) => n.code);
    for (const expected of CANONICAL_CODES) {
      expect(codes).toContain(expected);
    }
  });

  it("Solaris is the player nation", () => {
    const world = createInitialWorldState();
    const solaris = world.nations.find((n) => n.id === "solaris");
    expect(solaris).toBeDefined();
    expect(solaris!.name).toBe("Solaris");
    expect(solaris!.code).toBe("SOL");
  });

  it("repeated calls are deeply equal", () => {
    const a = createInitialWorldState();
    const b = createInitialWorldState();
    expect(a).toEqual(b);
  });

  it("separate calls do not share the nations array", () => {
    const a = createInitialWorldState();
    const b = createInitialWorldState();
    expect(a.nations).not.toBe(b.nations);
  });

  it("initial world passes validation", () => {
    const world = createInitialWorldState();
    expect(() => validateWorldState(world)).not.toThrow();
  });
});

describe("getNationById", () => {
  it("finds Solaris", () => {
    const world = createInitialWorldState();
    const nation = getNationById(world, "solaris");
    expect(nation.id).toBe("solaris");
    expect(nation.name).toBe("Solaris");
    expect(nation.code).toBe("SOL");
  });

  it("unknown nation ID fails explicitly", () => {
    const world = createInitialWorldState();
    expect(() => getNationById(world, "nonexistent")).toThrow(
      UnknownNationError,
    );
    expect(() => getNationById(world, "nonexistent")).toThrow(
      'Unknown nation: "nonexistent"',
    );
  });
});

describe("validateWorldState", () => {
  it("duplicate nation ID fails", () => {
    const world: WorldState = {
      nations: [
        { id: "a", name: "A", code: "A1" },
        { id: "a", name: "B", code: "B1" },
      ],
      map: createInitialStrategicMap(),
      regionOwnership: [],
    };
    expect(() => validateWorldState(world)).toThrow(WorldValidationError);
    expect(() => validateWorldState(world)).toThrow(
      'Duplicate nation ID: "a"',
    );
  });

  it("duplicate nation code fails", () => {
    const world: WorldState = {
      nations: [
        { id: "a", name: "A", code: "X" },
        { id: "b", name: "B", code: "X" },
      ],
      map: createInitialStrategicMap(),
      regionOwnership: [],
    };
    expect(() => validateWorldState(world)).toThrow(WorldValidationError);
    expect(() => validateWorldState(world)).toThrow(
      'Duplicate nation code: "X" for nation "b"',
    );
  });

  it("empty ID fails", () => {
    const world: WorldState = {
      nations: [{ id: "", name: "A", code: "A1" }],
      map: createInitialStrategicMap(),
      regionOwnership: [],
    };
    expect(() => validateWorldState(world)).toThrow(WorldValidationError);
    expect(() => validateWorldState(world)).toThrow("Empty nation ID");
  });

  it("empty name fails", () => {
    const world: WorldState = {
      nations: [{ id: "a", name: "", code: "A1" }],
      map: createInitialStrategicMap(),
      regionOwnership: [],
    };
    expect(() => validateWorldState(world)).toThrow(WorldValidationError);
    expect(() => validateWorldState(world)).toThrow(
      'Empty nation name for id "a"',
    );
  });

  it("empty code fails", () => {
    const world: WorldState = {
      nations: [{ id: "a", name: "A", code: "" }],
      map: createInitialStrategicMap(),
      regionOwnership: [],
    };
    expect(() => validateWorldState(world)).toThrow(WorldValidationError);
    expect(() => validateWorldState(world)).toThrow(
      'Empty nation code for id "a"',
    );
  });
});

describe("GameState integration", () => {
  it("createInitialGameState is deterministic", () => {
    const a = createInitialGameState();
    const b = createInitialGameState();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  it("player nation exists in world.nations", () => {
    const state = createInitialGameState();
    const ids = state.world.nations.map((n) => n.id);
    expect(ids).toContain(state.playerNationId);
  });
});

describe("resolveTurn world compatibility", () => {
  it("resolveTurn preserves world contents", () => {
    const state = createInitialGameState();
    const { state: next } = resolveTurn(state, []);

    expect(next.world).toEqual(state.world);
  });

  it("resolveTurn does not mutate original world", () => {
    const state = createInitialGameState();
    const worldSnapshot = JSON.parse(JSON.stringify(state.world));

    resolveTurn(state, []);

    expect(state.world).toEqual(worldSnapshot);
  });
});
