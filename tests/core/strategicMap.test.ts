import { describe, it, expect } from "vitest";
import {
  createInitialStrategicMap,
  getRegionById,
  getNeighborRegionIds,
  validateStrategicMap,
  UnknownRegionError,
  StrategicMapValidationError,
} from "../../src/core/model/strategicMap";
import type { StrategicMap } from "../../src/core/model/strategicMap";
import { createInitialWorldState } from "../../src/core/model/worldState";
import { createInitialGameState } from "../../src/core/model/gameState";
import { resolveTurn } from "../../src/core/simulation/resolveTurn";

const CANONICAL_REGION_IDS = [
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

const CANONICAL_REGION_CODES = [
  "SUN",
  "AUR",
  "HEL",
  "IRO",
  "BLK",
  "VAR",
  "NWT",
  "FRO",
  "SIL",
  "VLS",
  "MER",
  "BLU",
  "KSK",
  "RST",
  "STG",
  "ARK",
  "DSK",
  "ERE",
];

describe("createInitialStrategicMap", () => {
  it("canonical map has exactly 18 regions", () => {
    const map = createInitialStrategicMap();
    expect(map.regions).toHaveLength(18);
  });

  it("canonical region order is exact", () => {
    const map = createInitialStrategicMap();
    const ids = map.regions.map((r) => r.id);
    expect(ids).toEqual(CANONICAL_REGION_IDS);
  });

  it("all expected region IDs are present", () => {
    const map = createInitialStrategicMap();
    const ids = map.regions.map((r) => r.id);
    for (const expected of CANONICAL_REGION_IDS) {
      expect(ids).toContain(expected);
    }
  });

  it("all expected region codes are present", () => {
    const map = createInitialStrategicMap();
    const codes = map.regions.map((r) => r.code);
    for (const expected of CANONICAL_REGION_CODES) {
      expect(codes).toContain(expected);
    }
  });

  it("canonical connection count is exact", () => {
    const map = createInitialStrategicMap();
    expect(map.connections).toHaveLength(30);
  });

  it("canonical map passes validation", () => {
    const map = createInitialStrategicMap();
    expect(() => validateStrategicMap(map)).not.toThrow();
  });

  it("repeated calls are deeply equal", () => {
    const a = createInitialStrategicMap();
    const b = createInitialStrategicMap();
    expect(a).toEqual(b);
  });

  it("separate maps do not share regions array", () => {
    const a = createInitialStrategicMap();
    const b = createInitialStrategicMap();
    expect(a.regions).not.toBe(b.regions);
  });

  it("separate maps do not share connections array", () => {
    const a = createInitialStrategicMap();
    const b = createInitialStrategicMap();
    expect(a.connections).not.toBe(b.connections);
  });
});

describe("getRegionById", () => {
  it("getRegionById returns correct region", () => {
    const map = createInitialStrategicMap();
    const region = getRegionById(map, "sunreach");
    expect(region.id).toBe("sunreach");
    expect(region.name).toBe("Sunreach");
    expect(region.code).toBe("SUN");
  });

  it("unknown region fails explicitly", () => {
    const map = createInitialStrategicMap();
    expect(() => getRegionById(map, "nonexistent")).toThrow(
      UnknownRegionError,
    );
    expect(() => getRegionById(map, "nonexistent")).toThrow(
      'Unknown region: "nonexistent"',
    );
  });
});

describe("getNeighborRegionIds", () => {
  it("getNeighborRegionIds returns exact neighbors", () => {
    const map = createInitialStrategicMap();
    const neighbors = getNeighborRegionIds(map, "sunreach");
    expect(neighbors).toEqual(["auric-basin", "northwatch"]);
  });

  it("neighbor output order is deterministic", () => {
    const map = createInitialStrategicMap();
    const neighbors1 = getNeighborRegionIds(map, "meridian");
    const neighbors2 = getNeighborRegionIds(map, "meridian");
    expect(neighbors1).toEqual(neighbors2);

    expect(neighbors1).toEqual([
      "arka",
      "blueharbor",
      "karsk",
      "silverplain",
      "velis",
    ]);
  });
});

describe("validateStrategicMap", () => {
  it("duplicate region ID fails", () => {
    const map: StrategicMap = {
      regions: [
        { id: "a", name: "A", code: "A1" },
        { id: "a", name: "B", code: "B1" },
      ],
      connections: [],
    };
    expect(() => validateStrategicMap(map)).toThrow(
      StrategicMapValidationError,
    );
    expect(() => validateStrategicMap(map)).toThrow(
      'Duplicate region ID: "a"',
    );
  });

  it("duplicate region code fails", () => {
    const map: StrategicMap = {
      regions: [
        { id: "a", name: "A", code: "X" },
        { id: "b", name: "B", code: "X" },
      ],
      connections: [],
    };
    expect(() => validateStrategicMap(map)).toThrow(
      StrategicMapValidationError,
    );
    expect(() => validateStrategicMap(map)).toThrow(
      'Duplicate region code: "X" for region "b"',
    );
  });

  it("empty region ID fails", () => {
    const map: StrategicMap = {
      regions: [{ id: "", name: "A", code: "A1" }],
      connections: [],
    };
    expect(() => validateStrategicMap(map)).toThrow(
      StrategicMapValidationError,
    );
    expect(() => validateStrategicMap(map)).toThrow("Empty region ID");
  });

  it("empty region name fails", () => {
    const map: StrategicMap = {
      regions: [{ id: "a", name: "", code: "A1" }],
      connections: [],
    };
    expect(() => validateStrategicMap(map)).toThrow(
      StrategicMapValidationError,
    );
    expect(() => validateStrategicMap(map)).toThrow(
      'Empty region name for id "a"',
    );
  });

  it("empty region code fails", () => {
    const map: StrategicMap = {
      regions: [{ id: "a", name: "A", code: "" }],
      connections: [],
    };
    expect(() => validateStrategicMap(map)).toThrow(
      StrategicMapValidationError,
    );
    expect(() => validateStrategicMap(map)).toThrow(
      'Empty region code for id "a"',
    );
  });

  it("unknown connection endpoint fails", () => {
    const map: StrategicMap = {
      regions: [{ id: "a", name: "A", code: "A1" }],
      connections: [{ a: "a", b: "nonexistent" }],
    };
    expect(() => validateStrategicMap(map)).toThrow(
      StrategicMapValidationError,
    );
    expect(() => validateStrategicMap(map)).toThrow(
      'Connection references unknown region: "nonexistent"',
    );
  });

  it("self-connection fails", () => {
    const map: StrategicMap = {
      regions: [{ id: "a", name: "A", code: "A1" }],
      connections: [{ a: "a", b: "a" }],
    };
    expect(() => validateStrategicMap(map)).toThrow(
      StrategicMapValidationError,
    );
    expect(() => validateStrategicMap(map)).toThrow(
      'Self-connection at region: "a"',
    );
  });

  it("duplicate A-B connection fails", () => {
    const map: StrategicMap = {
      regions: [
        { id: "a", name: "A", code: "A1" },
        { id: "b", name: "B", code: "B1" },
      ],
      connections: [
        { a: "a", b: "b" },
        { a: "a", b: "b" },
      ],
    };
    expect(() => validateStrategicMap(map)).toThrow(
      StrategicMapValidationError,
    );
    expect(() => validateStrategicMap(map)).toThrow(
      'Duplicate connection: "a" <-> "b"',
    );
  });

  it("reversed duplicate B-A fails", () => {
    const map: StrategicMap = {
      regions: [
        { id: "a", name: "A", code: "A1" },
        { id: "b", name: "B", code: "B1" },
      ],
      connections: [
        { a: "a", b: "b" },
        { a: "b", b: "a" },
      ],
    };
    expect(() => validateStrategicMap(map)).toThrow(
      StrategicMapValidationError,
    );
    expect(() => validateStrategicMap(map)).toThrow(
      'Duplicate connection: "b" <-> "a"',
    );
  });

  it("disconnected graph fails", () => {
    const map: StrategicMap = {
      regions: [
        { id: "a", name: "A", code: "A1" },
        { id: "b", name: "B", code: "B1" },
        { id: "c", name: "C", code: "C1" },
      ],
      connections: [{ a: "a", b: "b" }],
    };
    expect(() => validateStrategicMap(map)).toThrow(
      StrategicMapValidationError,
    );
    expect(() => validateStrategicMap(map)).toThrow("Disconnected graph");
  });

  it("empty region collection fails", () => {
    const map: StrategicMap = {
      regions: [],
      connections: [],
    };
    expect(() => validateStrategicMap(map)).toThrow(
      StrategicMapValidationError,
    );
    expect(() => validateStrategicMap(map)).toThrow("Empty region collection");
  });
});

describe("WorldState integration", () => {
  it("initial WorldState contains map", () => {
    const world = createInitialWorldState();
    expect(world.map).toBeDefined();
    expect(world.map.regions).toHaveLength(18);
    expect(world.map.connections).toHaveLength(30);
  });

  it("repeated createInitialWorldState remains deterministic", () => {
    const a = createInitialWorldState();
    const b = createInitialWorldState();
    expect(a).toEqual(b);
    expect(a.map).not.toBe(b.map);
  });
});

describe("resolveTurn map compatibility", () => {
  it("resolveTurn preserves map contents", () => {
    const state = createInitialGameState();
    const { state: next } = resolveTurn(state, []);
    expect(next.world.map).toEqual(state.world.map);
  });

  it("resolveTurn does not mutate map", () => {
    const state = createInitialGameState();
    const mapSnapshot = JSON.parse(JSON.stringify(state.world.map));
    resolveTurn(state, []);
    expect(state.world.map).toEqual(mapSnapshot);
  });
});

describe("existing nation behavior", () => {
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
