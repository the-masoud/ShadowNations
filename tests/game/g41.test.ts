import { describe, it, expect } from "vitest";
import {
  STRATEGIC_MAP_LAYOUT,
  getStrategicMapRegionLayout,
  getStrategicMapNationColor,
  MissingStrategicMapLayoutError,
  MissingStrategicMapNationColorError,
} from "../../src/game/map/strategicMapPresentation.js";
import type { StrategicMapRegionLayout } from "../../src/game/map/strategicMapPresentation.js";
import { createInitialGameState } from "../../src/core/model/gameState.js";

describe("G4.1 — Strategic Map Presentation", () => {
  describe("A. layout entry count", () => {
    it("STRATEGIC_MAP_LAYOUT has exactly 18 entries", () => {
      expect(STRATEGIC_MAP_LAYOUT.length).toBe(18);
    });
  });

  describe("B. layout IDs match canonical regions", () => {
    it("layout IDs exactly equal canonical region IDs in order", () => {
      const state = createInitialGameState();
      const regionIds = state.world.map.regions.map((r) => r.id);
      const layoutIds = STRATEGIC_MAP_LAYOUT.map((l) => l.regionId);
      expect(layoutIds).toEqual(regionIds);
    });
  });

  describe("C. layout IDs are unique", () => {
    it("all layout region IDs are unique", () => {
      const ids = STRATEGIC_MAP_LAYOUT.map((l) => l.regionId);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("D. exact coordinate table", () => {
    it("matches the frozen 18-entry table", () => {
      const expected: readonly StrategicMapRegionLayout[] = [
        { regionId: "sunreach", x: 110, y: 220 },
        { regionId: "auric-basin", x: 230, y: 270 },
        { regionId: "helion-coast", x: 205, y: 410 },
        { regionId: "ironvale", x: 360, y: 230 },
        { regionId: "blackridge", x: 500, y: 205 },
        { regionId: "varkesh", x: 640, y: 175 },
        { regionId: "northwatch", x: 220, y: 120 },
        { regionId: "frostmere", x: 380, y: 105 },
        { regionId: "silverplain", x: 400, y: 335 },
        { regionId: "velis", x: 350, y: 470 },
        { regionId: "meridian", x: 545, y: 385 },
        { regionId: "blueharbor", x: 530, y: 535 },
        { regionId: "karsk", x: 680, y: 320 },
        { regionId: "red-steppe", x: 800, y: 235 },
        { regionId: "stonegate", x: 600, y: 115 },
        { regionId: "arka", x: 720, y: 465 },
        { regionId: "duskfall", x: 860, y: 375 },
        { regionId: "eastern-reach", x: 815, y: 545 },
      ];
      expect(STRATEGIC_MAP_LAYOUT).toEqual(expected);
    });
  });

  describe("E. coordinates are finite integers", () => {
    it("every x and y is finite and integer", () => {
      for (const entry of STRATEGIC_MAP_LAYOUT) {
        expect(Number.isFinite(entry.x)).toBe(true);
        expect(Number.isInteger(entry.x)).toBe(true);
        expect(Number.isFinite(entry.y)).toBe(true);
        expect(Number.isInteger(entry.y)).toBe(true);
      }
    });
  });

  describe("F. coordinate bounds", () => {
    it("every coordinate satisfies bounds", () => {
      for (const entry of STRATEGIC_MAP_LAYOUT) {
        expect(entry.x).toBeGreaterThanOrEqual(64);
        expect(entry.x).toBeLessThanOrEqual(960);
        expect(entry.y).toBeGreaterThanOrEqual(96);
        expect(entry.y).toBeLessThanOrEqual(560);
      }
    });
  });

  describe("G. connection endpoints resolve", () => {
    it("every endpoint of every canonical map connection resolves through getStrategicMapRegionLayout", () => {
      const state = createInitialGameState();
      for (const conn of state.world.map.connections) {
        expect(() => getStrategicMapRegionLayout(conn.a)).not.toThrow();
        expect(() => getStrategicMapRegionLayout(conn.b)).not.toThrow();
      }
    });
  });

  describe("H. layout lookup returns exact value", () => {
    it("for each canonical layout ID, getStrategicMapRegionLayout returns the exact matching entry", () => {
      for (const entry of STRATEGIC_MAP_LAYOUT) {
        const result = getStrategicMapRegionLayout(entry.regionId);
        expect(result).toBe(entry);
      }
    });
  });

  describe("I. unknown region ID throws", () => {
    it("MissingStrategicMapLayoutError for unknown region", () => {
      expect(() => getStrategicMapRegionLayout("nonexistent")).toThrow(
        MissingStrategicMapLayoutError,
      );
    });

    it("error message is exact", () => {
      try {
        getStrategicMapRegionLayout("nonexistent");
        expect.fail("should have thrown");
      } catch (e) {
        expect((e as Error).message).toBe(
          'Missing strategic map layout for region: "nonexistent"',
        );
      }
    });
  });

  describe("J. nation color mapping", () => {
    it("exact nation-color mapping", () => {
      expect(getStrategicMapNationColor("solaris")).toBe(0xd6b450);
      expect(getStrategicMapNationColor("dravos")).toBe(0xbf5a5a);
      expect(getStrategicMapNationColor("norvia")).toBe(0x5d8fc7);
      expect(getStrategicMapNationColor("veloria")).toBe(0x8b6fc0);
      expect(getStrategicMapNationColor("karsen")).toBe(0xc47a45);
      expect(getStrategicMapNationColor("arkania")).toBe(0x4f9d82);
    });
  });

  describe("K. all ownerNationIds resolve", () => {
    it("every ownerNationId in canonical initial regionOwnership resolves through getStrategicMapNationColor", () => {
      const state = createInitialGameState();
      for (const ownership of state.world.regionOwnership) {
        expect(() =>
          getStrategicMapNationColor(ownership.ownerNationId),
        ).not.toThrow();
      }
    });
  });

  describe("L. unknown nation ID throws", () => {
    it("MissingStrategicMapNationColorError for unknown nation", () => {
      expect(() => getStrategicMapNationColor("nonexistent")).toThrow(
        MissingStrategicMapNationColorError,
      );
    });

    it("error message is exact", () => {
      try {
        getStrategicMapNationColor("nonexistent");
        expect.fail("should have thrown");
      } catch (e) {
        expect((e as Error).message).toBe(
          'Missing strategic map color for nation: "nonexistent"',
        );
      }
    });
  });
});
