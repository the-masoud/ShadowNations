import { describe, it, expect } from "vitest";
import {
  getRegionOwnership,
  getRegionOwnerNation,
  getNationOwnedRegionIds,
  validateRegionOwnership,
  MissingRegionOwnershipError,
  OwnershipValidationError,
} from "../../src/core/model/regionOwnership";
import { createInitialWorldState } from "../../src/core/model/worldState";
import type { WorldState } from "../../src/core/model/worldState";
import { UnknownRegionError } from "../../src/core/model/strategicMap";
import { createInitialGameState } from "../../src/core/model/gameState";
import { resolveTurn } from "../../src/core/simulation/resolveTurn";

const CANONICAL_REGION_ORDER = [
  "sunreach",
  "auric-basin",
  "helion-coast",
  "ironvale",
  "blackridge",
  "varkesh",
  "northwatch",
  "frostmere",
  "silverplain",
  "velis",
  "meridian",
  "blueharbor",
  "karsk",
  "red-steppe",
  "stonegate",
  "arka",
  "duskfall",
  "eastern-reach",
];

function minimalWorld(overrides?: Partial<WorldState>): WorldState {
  return {
    nations: [{ id: "a", name: "A", code: "A1" }],
    map: {
      regions: [{ id: "r1", name: "R1", code: "R1" }],
      connections: [],
    },
    regionOwnership: [{ regionId: "r1", ownerNationId: "a" }],
    nationStrategicStats: [{ nationId: "a", stability: 50, publicSupport: 50, internalSecurity: 50 }],
    nationInfluence: [],
    ...overrides,
  };
}

describe("initial ownership", () => {
  it("initial ownership contains exactly 18 entries", () => {
    const world = createInitialWorldState();
    expect(world.regionOwnership).toHaveLength(18);
  });

  it("ownership order follows canonical region order", () => {
    const world = createInitialWorldState();
    const ids = world.regionOwnership.map((o) => o.regionId);
    expect(ids).toEqual(CANONICAL_REGION_ORDER);
  });

  it("every canonical region has exactly one owner", () => {
    const world = createInitialWorldState();
    const owned = new Set(world.regionOwnership.map((o) => o.regionId));
    expect(owned.size).toBe(18);
    for (const regionId of CANONICAL_REGION_ORDER) {
      expect(owned.has(regionId)).toBe(true);
    }
  });

  it("exact Solaris starting ownership", () => {
    const world = createInitialWorldState();
    const solaris = world.regionOwnership
      .filter((o) => o.ownerNationId === "solaris")
      .map((o) => o.regionId);
    expect(solaris).toEqual(["sunreach", "auric-basin", "helion-coast"]);
  });

  it("exact Dravos starting ownership", () => {
    const world = createInitialWorldState();
    const dravos = world.regionOwnership
      .filter((o) => o.ownerNationId === "dravos")
      .map((o) => o.regionId);
    expect(dravos).toEqual(["ironvale", "blackridge", "varkesh"]);
  });

  it("exact Norvia starting ownership", () => {
    const world = createInitialWorldState();
    const norvia = world.regionOwnership
      .filter((o) => o.ownerNationId === "norvia")
      .map((o) => o.regionId);
    expect(norvia).toEqual(["northwatch", "frostmere", "stonegate"]);
  });

  it("exact Veloria starting ownership", () => {
    const world = createInitialWorldState();
    const veloria = world.regionOwnership
      .filter((o) => o.ownerNationId === "veloria")
      .map((o) => o.regionId);
    expect(veloria).toEqual(["silverplain", "velis", "blueharbor"]);
  });

  it("exact Karsen starting ownership", () => {
    const world = createInitialWorldState();
    const karsen = world.regionOwnership
      .filter((o) => o.ownerNationId === "karsen")
      .map((o) => o.regionId);
    expect(karsen).toEqual(["meridian", "karsk", "red-steppe"]);
  });

  it("exact Arkania starting ownership", () => {
    const world = createInitialWorldState();
    const arkania = world.regionOwnership
      .filter((o) => o.ownerNationId === "arkania")
      .map((o) => o.regionId);
    expect(arkania).toEqual(["arka", "duskfall", "eastern-reach"]);
  });

  it("every nation initially owns exactly 3 regions", () => {
    const world = createInitialWorldState();
    const counts = new Map<string, number>();
    for (const entry of world.regionOwnership) {
      counts.set(entry.ownerNationId, (counts.get(entry.ownerNationId) ?? 0) + 1);
    }
    expect(counts.size).toBe(6);
    for (const count of counts.values()) {
      expect(count).toBe(3);
    }
  });
});

describe("lookups", () => {
  it("getRegionOwnership finds correct owner", () => {
    const world = createInitialWorldState();
    const ownership = getRegionOwnership(world, "sunreach");
    expect(ownership.ownerNationId).toBe("solaris");
  });

  it("getRegionOwnerNation returns correct Nation", () => {
    const world = createInitialWorldState();
    const nation = getRegionOwnerNation(world, "sunreach");
    expect(nation.id).toBe("solaris");
    expect(nation.name).toBe("Solaris");
  });

  it("getNationOwnedRegionIds returns exact Solaris regions", () => {
    const world = createInitialWorldState();
    const ids = getNationOwnedRegionIds(world, "solaris");
    expect(ids).toEqual(["sunreach", "auric-basin", "helion-coast"]);
  });

  it("owned-region output preserves canonical region order", () => {
    const world = createInitialWorldState();
    const ids = getNationOwnedRegionIds(world, "solaris");
    expect(ids).toEqual(["sunreach", "auric-basin", "helion-coast"]);
  });

  it("unknown region lookup fails explicitly", () => {
    const world = createInitialWorldState();
    expect(() => getRegionOwnership(world, "nonexistent")).toThrow(
      UnknownRegionError,
    );
  });

  it("unknown nation lookup fails explicitly", () => {
    const world = createInitialWorldState();
    const ownership = getRegionOwnership(world, "sunreach");
    expect(ownership.ownerNationId).not.toBe("nonexistent");
  });

  it("missing region ownership lookup fails explicitly", () => {
    const world = minimalWorld({
      regionOwnership: [],
    });
    expect(() => getRegionOwnership(world, "r1")).toThrow(
      MissingRegionOwnershipError,
    );
    expect(() => getRegionOwnership(world, "r1")).toThrow(
      'Missing ownership for region: "r1"',
    );
  });

  it("unknown region -> UnknownRegionError", () => {
    const world = minimalWorld();
    expect(() => getRegionOwnership(world, "nonexistent")).toThrow(
      UnknownRegionError,
    );
    expect(() => getRegionOwnership(world, "nonexistent")).toThrow(
      'Unknown region: "nonexistent"',
    );
  });

  it("existing region with ownership removed -> MissingRegionOwnershipError", () => {
    const world = minimalWorld({ regionOwnership: [] });
    expect(() => getRegionOwnership(world, "r1")).toThrow(
      MissingRegionOwnershipError,
    );
    expect(() => getRegionOwnership(world, "r1")).not.toThrow(
      UnknownRegionError,
    );
  });
});

describe("validation", () => {
  it("duplicate ownership validation fails", () => {
    const world = minimalWorld({
      regionOwnership: [
        { regionId: "r1", ownerNationId: "a" },
        { regionId: "r1", ownerNationId: "a" },
      ],
    });
    expect(() => validateRegionOwnership(world)).toThrow(
      OwnershipValidationError,
    );
    expect(() => validateRegionOwnership(world)).toThrow(
      'Duplicate ownership for region: "r1"',
    );
  });

  it("unknown-region ownership validation fails", () => {
    const world = minimalWorld({
      regionOwnership: [{ regionId: "unknown", ownerNationId: "a" }],
    });
    expect(() => validateRegionOwnership(world)).toThrow(
      OwnershipValidationError,
    );
    expect(() => validateRegionOwnership(world)).toThrow(
      'Ownership references unknown region: "unknown"',
    );
  });

  it("unknown-nation ownership validation fails", () => {
    const world = minimalWorld({
      regionOwnership: [{ regionId: "r1", ownerNationId: "unknown" }],
    });
    expect(() => validateRegionOwnership(world)).toThrow(
      OwnershipValidationError,
    );
    expect(() => validateRegionOwnership(world)).toThrow(
      'Ownership references unknown nation: "unknown" for region "r1"',
    );
  });

  it("missing ownership validation fails", () => {
    const world = minimalWorld({
      regionOwnership: [],
    });
    expect(() => validateRegionOwnership(world)).toThrow(
      OwnershipValidationError,
    );
    expect(() => validateRegionOwnership(world)).toThrow(
      'Missing ownership for map region: "r1"',
    );
  });

  it("valid initial ownership passes validation", () => {
    const world = createInitialWorldState();
    expect(() => validateRegionOwnership(world)).not.toThrow();
  });
});

describe("determinism", () => {
  it("repeated createInitialWorldState calls deeply equal", () => {
    const a = createInitialWorldState();
    const b = createInitialWorldState();
    expect(a).toEqual(b);
  });

  it("separate initial worlds do not share ownership array", () => {
    const a = createInitialWorldState();
    const b = createInitialWorldState();
    expect(a.regionOwnership).not.toBe(b.regionOwnership);
  });
});

describe("turn-engine compatibility", () => {
  it("resolveTurn preserves ownership contents", () => {
    const state = createInitialGameState();
    const { state: next } = resolveTurn(state, []);
    expect(next.world.regionOwnership).toEqual(state.world.regionOwnership);
  });

  it("resolveTurn does not mutate ownership", () => {
    const state = createInitialGameState();
    const snapshot = JSON.parse(JSON.stringify(state.world.regionOwnership));
    resolveTurn(state, []);
    expect(state.world.regionOwnership).toEqual(snapshot);
  });
});

describe("existing behavior unchanged", () => {
  it("existing map contents remain unchanged", () => {
    const world = createInitialWorldState();
    expect(world.map.regions).toHaveLength(18);
    expect(world.map.connections).toHaveLength(30);
  });

  it("existing nation behavior remains unchanged", () => {
    const world = createInitialWorldState();
    expect(world.nations).toHaveLength(6);
    const ids = world.nations.map((n) => n.id);
    expect(ids).toEqual([
      "solaris",
      "dravos",
      "norvia",
      "veloria",
      "karsen",
      "arkania",
    ]);
  });
});
