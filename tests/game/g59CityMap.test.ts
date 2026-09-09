import { describe, it, expect } from "vitest";
import { createInitialGameState } from "../../src/core/model/gameState.js";
import { CANONICAL_CITIES } from "../../src/core/model/city.js";
import { setNationVisibility } from "../../src/core/simulation/setNationVisibility.js";
import { setCitySecurity } from "../../src/core/simulation/setCitySecurity.js";
import { setRegionOwner } from "../../src/core/simulation/setRegionOwner.js";
import {
  createCityMapPresentationModel,
  getSecurityBand,
} from "../../src/game/map/cityMapPresentation.js";
import {
  STRATEGIC_MAP_LAYOUT,
  getStrategicMapNationColor,
} from "../../src/game/map/strategicMapPresentation.js";
import { getRegionById } from "../../src/core/model/strategicMap.js";
import { GameStateValidationError } from "../../src/core/simulation/validateGameState.js";

describe("cityMapPresentation", () => {
  it("A: exact 18 node count", () => {
    const state = createInitialGameState();
    const nodes = createCityMapPresentationModel(state);
    expect(nodes).toHaveLength(18);
  });

  it("B: canonical city order preserved", () => {
    const state = createInitialGameState();
    const nodes = createCityMapPresentationModel(state);
    for (let i = 0; i < CANONICAL_CITIES.length; i++) {
      expect(nodes[i].cityId).toBe(CANONICAL_CITIES[i].id);
    }
  });

  it("C: canonical region association/order", () => {
    const state = createInitialGameState();
    const nodes = createCityMapPresentationModel(state);
    for (let i = 0; i < CANONICAL_CITIES.length; i++) {
      expect(nodes[i].regionId).toBe(CANONICAL_CITIES[i].regionId);
    }
  });

  it("D: exact layout coordinates reused", () => {
    const state = createInitialGameState();
    const nodes = createCityMapPresentationModel(state);
    for (const node of nodes) {
      const layout = STRATEGIC_MAP_LAYOUT.find((l) => l.regionId === node.regionId)!;
      expect(node.x).toBe(layout.x);
      expect(node.y).toBe(layout.y);
    }
  });

  it("E: city name + region code identity", () => {
    const state = createInitialGameState();
    const nodes = createCityMapPresentationModel(state);
    for (const node of nodes) {
      const city = CANONICAL_CITIES.find((c) => c.id === node.cityId)!;
      const region = getRegionById(state.world.map, node.regionId);
      expect(node.cityName).toBe(city.name);
      expect(node.regionCode).toBe(region.code);
    }
  });

  it("F: exact node runtime keys + no forbidden keys", () => {
    const state = createInitialGameState();
    const nodes = createCityMapPresentationModel(state);
    const expectedKeys = [
      "cityId", "cityName", "cityRole", "regionId", "regionCode",
      "x", "y", "ownerNationId", "ownerColor", "roleShape",
      "isOwnCity", "visibility", "securityBand", "securitySegments",
    ];
    const forbidden = ["currentSecurity", "baseSecurity", "regionName", "network", "networkLevel"];
    for (const node of nodes) {
      expect(Object.keys(node).sort()).toEqual(expectedKeys.sort());
      for (const key of forbidden) {
        expect(node).not.toHaveProperty(key);
      }
    }
  });

  it("G: capital -> star", () => {
    const state = createInitialGameState();
    const nodes = createCityMapPresentationModel(state);
    for (const node of nodes) {
      if (node.cityRole === "capital") {
        expect(node.roleShape).toBe("star");
      }
    }
  });

  it("H: media-hub -> diamond", () => {
    const state = createInitialGameState();
    const nodes = createCityMapPresentationModel(state);
    for (const node of nodes) {
      if (node.cityRole === "media-hub") {
        expect(node.roleShape).toBe("diamond");
      }
    }
  });

  it("I: security-hub -> hexagon", () => {
    const state = createInitialGameState();
    const nodes = createCityMapPresentationModel(state);
    for (const node of nodes) {
      if (node.cityRole === "security-hub") {
        expect(node.roleShape).toBe("hexagon");
      }
    }
  });

  it("J: role totals 6/6/6", () => {
    const state = createInitialGameState();
    const nodes = createCityMapPresentationModel(state);
    const capitals = nodes.filter((n) => n.cityRole === "capital").length;
    const media = nodes.filter((n) => n.cityRole === "media-hub").length;
    const security = nodes.filter((n) => n.cityRole === "security-hub").length;
    expect(capitals).toBe(6);
    expect(media).toBe(6);
    expect(security).toBe(6);
  });

  it("K: initial owner derivation", () => {
    const state = createInitialGameState();
    const nodes = createCityMapPresentationModel(state);
    for (const node of nodes) {
      const ownership = state.world.regionOwnership.find(
        (o) => o.regionId === node.regionId,
      )!;
      expect(node.ownerNationId).toBe(ownership.ownerNationId);
    }
  });

  it("L: owner nation colors match nation color map", () => {
    const state = createInitialGameState();
    const nodes = createCityMapPresentationModel(state);
    for (const node of nodes) {
      expect(node.ownerColor).toBe(getStrategicMapNationColor(node.ownerNationId));
    }
  });

  it("M: ownership transfer changes owner/color", () => {
    let state = createInitialGameState();
    const initialNodes = createCityMapPresentationModel(state);
    const initialSolara = initialNodes.find((n) => n.cityId === "solara")!;
    const initialColor = initialSolara.ownerColor;

    state = setRegionOwner(state, "sunreach", "dravos");
    const nodes = createCityMapPresentationModel(state);
    const solaraNode = nodes.find((n) => n.cityId === "solara")!;
    expect(solaraNode.ownerNationId).toBe("dravos");
    expect(solaraNode.ownerColor).toBe(getStrategicMapNationColor("dravos"));
    expect(solaraNode.ownerColor).not.toBe(initialColor);
  });

  it("N: own city security visible", () => {
    const state = createInitialGameState();
    const nodes = createCityMapPresentationModel(state);
    for (const node of nodes) {
      if (node.isOwnCity) {
        expect(node.securityBand).not.toBeNull();
        expect(node.securitySegments).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("O: foreign UNKNOWN hidden/null/0", () => {
    const state = createInitialGameState();
    const nodes = createCityMapPresentationModel(state);
    for (const node of nodes) {
      if (!node.isOwnCity && node.visibility === "unknown") {
        expect(node.securityBand).toBeNull();
        expect(node.securitySegments).toBe(0);
      }
    }
  });

  it("P: foreign LIMITED visible", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "limited");
    const nodes = createCityMapPresentationModel(state);
    const dravikNode = nodes.find((n) => n.cityId === "dravik")!;
    expect(dravikNode.securityBand).not.toBeNull();
    expect(dravikNode.securitySegments).toBeGreaterThanOrEqual(1);
  });

  it("Q: foreign KNOWN visible", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    const nodes = createCityMapPresentationModel(state);
    const dravikNode = nodes.find((n) => n.cityId === "dravik")!;
    expect(dravikNode.securityBand).not.toBeNull();
    expect(dravikNode.securitySegments).toBeGreaterThanOrEqual(1);
  });

  it("R: BREACHED band + 1 segment via presentation model", () => {
    expect(getSecurityBand(0)).toBe("BREACHED");
    expect(getSecurityBand(25)).toBe("BREACHED");
    expect(getSecurityBand(26)).toBe("COMPROMISED");
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setCitySecurity(state, "dravik", 25);
    const nodes = createCityMapPresentationModel(state);
    const node = nodes.find((n) => n.cityId === "dravik")!;
    expect(node.securityBand).toBe("BREACHED");
    expect(node.securitySegments).toBe(1);
  });

  it("S: COMPROMISED band + 2 segments via presentation model", () => {
    expect(getSecurityBand(26)).toBe("COMPROMISED");
    expect(getSecurityBand(50)).toBe("COMPROMISED");
    expect(getSecurityBand(51)).toBe("GUARDED");
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setCitySecurity(state, "dravik", 50);
    const nodes = createCityMapPresentationModel(state);
    const node = nodes.find((n) => n.cityId === "dravik")!;
    expect(node.securityBand).toBe("COMPROMISED");
    expect(node.securitySegments).toBe(2);
  });

  it("T: GUARDED band + 3 segments via presentation model", () => {
    expect(getSecurityBand(51)).toBe("GUARDED");
    expect(getSecurityBand(75)).toBe("GUARDED");
    expect(getSecurityBand(76)).toBe("HARDENED");
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setCitySecurity(state, "dravik", 75);
    const nodes = createCityMapPresentationModel(state);
    const node = nodes.find((n) => n.cityId === "dravik")!;
    expect(node.securityBand).toBe("GUARDED");
    expect(node.securitySegments).toBe(3);
  });

  it("U: HARDENED band + 4 segments via presentation model", () => {
    expect(getSecurityBand(76)).toBe("HARDENED");
    expect(getSecurityBand(100)).toBe("HARDENED");
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setCitySecurity(state, "dravik", 100);
    const nodes = createCityMapPresentationModel(state);
    const node = nodes.find((n) => n.cityId === "dravik")!;
    expect(node.securityBand).toBe("HARDENED");
    expect(node.securitySegments).toBe(4);
  });

  it("V: current security change affects band; base does not substitute", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setCitySecurity(state, "dravik", 10);
    const nodesBefore = createCityMapPresentationModel(state);
    const nodeBefore = nodesBefore.find((n) => n.cityId === "dravik")!;
    expect(nodeBefore.securityBand).toBe("BREACHED");
    expect(nodeBefore.securitySegments).toBe(1);

    state = setCitySecurity(state, "dravik", 90);
    const nodesAfter = createCityMapPresentationModel(state);
    const nodeAfter = nodesAfter.find((n) => n.cityId === "dravik")!;
    expect(nodeAfter.securityBand).toBe("HARDENED");
    expect(nodeAfter.securitySegments).toBe(4);
  });

  it("W: deterministic fresh + input immutable", () => {
    const state = createInitialGameState();
    const nodes1 = createCityMapPresentationModel(state);
    const nodes2 = createCityMapPresentationModel(state);
    expect(nodes1).toEqual(nodes2);
    expect(nodes1).not.toBe(nodes2);
    expect(nodes1[0]).not.toBe(nodes2[0]);

    const stateBefore = JSON.parse(JSON.stringify(state));
    createCityMapPresentationModel(state);
    expect(state).toEqual(stateBefore);
  });

  it("X: invalid GameState validation precedence", () => {
    const badState = { ...createInitialGameState(), turn: 0 };
    expect(() => createCityMapPresentationModel(badState)).toThrow(GameStateValidationError);
  });

});
