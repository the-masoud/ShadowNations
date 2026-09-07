import { describe, it, expect } from "vitest";
import {
  createNationRegionPanelModel,
} from "../../src/game/ui/nationRegionPresentation.js";
import { createInitialGameState } from "../../src/core/model/gameState.js";
import { getRegionOwnership } from "../../src/core/model/regionOwnership.js";
import { getNationById } from "../../src/core/model/worldState.js";
import { getNationStrategicStats } from "../../src/core/model/nationStrategicStats.js";
import { getNeighborRegionIds } from "../../src/core/model/strategicMap.js";
import { getNationOwnedRegionIds } from "../../src/core/model/regionOwnership.js";
import { getStrategicMapNationColor } from "../../src/game/map/strategicMapPresentation.js";
import {
  UnknownRegionError,
} from "../../src/core/model/strategicMap.js";
import {
  GameStateValidationError,
} from "../../src/core/simulation/validateGameState.js";

describe("G4.2 — Nation & Region Presentation", () => {
  const state = createInitialGameState();

  describe("A. exact runtime keys", () => {
    it("model has exactly 12 keys in correct order", () => {
      const model = createNationRegionPanelModel(state, "sunreach");
      expect(Object.keys(model)).toEqual([
        "regionId",
        "regionName",
        "regionCode",
        "ownerNationId",
        "ownerNationName",
        "ownerNationCode",
        "ownerColor",
        "stability",
        "publicSupport",
        "internalSecurity",
        "ownedRegionCount",
        "neighboringRegionCount",
      ]);
    });
  });

  describe("B. canonical Sunreach model", () => {
    it("matches exact expected values", () => {
      const model = createNationRegionPanelModel(state, "sunreach");
      expect(model).toEqual({
        regionId: "sunreach",
        regionName: "Sunreach",
        regionCode: "SUN",
        ownerNationId: "solaris",
        ownerNationName: "Solaris",
        ownerNationCode: "SOL",
        ownerColor: 0xd6b450,
        stability: 72,
        publicSupport: 68,
        internalSecurity: 66,
        ownedRegionCount: 3,
        neighboringRegionCount: 2,
      });
    });
  });

  describe("C. every canonical region identity", () => {
    it("regionId, regionName, regionCode match accepted Region data", () => {
      for (const region of state.world.map.regions) {
        const model = createNationRegionPanelModel(state, region.id);
        expect(model.regionId).toBe(region.id);
        expect(model.regionName).toBe(region.name);
        expect(model.regionCode).toBe(region.code);
      }
    });
  });

  describe("D. every canonical owner identity", () => {
    it("ownerNationId, ownerNationName, ownerNationCode match accepted data", () => {
      for (const region of state.world.map.regions) {
        const model = createNationRegionPanelModel(state, region.id);
        const ownership = getRegionOwnership(state.world, region.id);
        const nation = getNationById(state.world, ownership.ownerNationId);
        expect(model.ownerNationId).toBe(ownership.ownerNationId);
        expect(model.ownerNationName).toBe(nation.name);
        expect(model.ownerNationCode).toBe(nation.code);
      }
    });
  });

  describe("E. every canonical strategic stat", () => {
    it("stability, publicSupport, internalSecurity match accepted stats", () => {
      for (const region of state.world.map.regions) {
        const model = createNationRegionPanelModel(state, region.id);
        const ownership = getRegionOwnership(state.world, region.id);
        const stats = getNationStrategicStats(
          state.world,
          ownership.ownerNationId,
        );
        expect(model.stability).toBe(stats.stability);
        expect(model.publicSupport).toBe(stats.publicSupport);
        expect(model.internalSecurity).toBe(stats.internalSecurity);
      }
    });
  });

  describe("F. controlled-region count", () => {
    it("ownedRegionCount equals getNationOwnedRegionIds length", () => {
      for (const region of state.world.map.regions) {
        const model = createNationRegionPanelModel(state, region.id);
        const ownedRegionIds = getNationOwnedRegionIds(
          state.world,
          model.ownerNationId,
        );
        expect(model.ownedRegionCount).toBe(ownedRegionIds.length);
      }
    });
  });

  describe("G. neighbor count", () => {
    it("neighboringRegionCount equals getNeighborRegionIds length", () => {
      for (const region of state.world.map.regions) {
        const model = createNationRegionPanelModel(state, region.id);
        const neighborIds = getNeighborRegionIds(
          state.world.map,
          region.id,
        );
        expect(model.neighboringRegionCount).toBe(neighborIds.length);
      }
    });
  });

  describe("H. owner color", () => {
    it("ownerColor equals getStrategicMapNationColor", () => {
      for (const region of state.world.map.regions) {
        const model = createNationRegionPanelModel(state, region.id);
        const color = getStrategicMapNationColor(model.ownerNationId);
        expect(model.ownerColor).toBe(color);
      }
    });
  });

  describe("I. fresh deterministic model", () => {
    it("two calls with identical input are deep equal but not same reference", () => {
      const a = createNationRegionPanelModel(state, "sunreach");
      const b = createNationRegionPanelModel(state, "sunreach");
      expect(a).toEqual(b);
      expect(a).not.toBe(b);
    });
  });

  describe("J. state immutability", () => {
    it("calling createNationRegionPanelModel does not mutate input state", () => {
      const before = JSON.stringify(state);
      createNationRegionPanelModel(state, "sunreach");
      const after = JSON.stringify(state);
      expect(before).toBe(after);
    });
  });

  describe("K. unknown-region behavior", () => {
    it("throws UnknownRegionError for unknown region", () => {
      expect(() =>
        createNationRegionPanelModel(state, "nonexistent"),
      ).toThrow(UnknownRegionError);
    });
  });

  describe("L. validation precedence", () => {
    it("GameStateValidationError before UnknownRegionError", () => {
      const invalidState = { ...state, turn: 0 };
      expect(() =>
        createNationRegionPanelModel(
          invalidState as ReturnType<typeof createInitialGameState>,
          "nonexistent",
        ),
      ).toThrow(GameStateValidationError);
    });
  });

  describe("M. no G4.3 fields", () => {
    it("model keys contain none of the forbidden fields", () => {
      const model = createNationRegionPanelModel(state, "sunreach");
      const forbidden = [
        "visibility",
        "network",
        "networkLevel",
        "agents",
        "assets",
        "awareness",
        "doubleAgents",
        "actionPoints",
        "influence",
        "diplomaticStatus",
        "regimePressure",
        "proxyConflicts",
      ];
      for (const key of forbidden) {
        expect(model).not.toHaveProperty(key);
      }
    });
  });
});
