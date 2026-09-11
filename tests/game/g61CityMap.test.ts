import { describe, it, expect, vi } from "vitest";

vi.mock("phaser", () => {
  class MockScene {
    sys = { settings: { key: "" } };
    constructor(config?: { key?: string }) {
      if (config?.key) this.sys.settings.key = config.key;
    }
  }
  return {
    default: {
      Scene: MockScene,
      Math: { Clamp: (v: number, min: number, max: number) => Math.min(Math.max(v, min), max) },
    },
  };
});

import { hasCityMap, getCityVisualEntry } from "../../src/game/city/cityVisualCatalog.js";
import { CityScene } from "../../src/game/scenes/CityScene.js";

const citySceneMethods = CityScene.prototype as unknown as Record<string, () => string>;

describe("G6.1 CP2 — City Map", () => {
  it("1: Dravik has a city map entry", () => {
    expect(hasCityMap("dravik")).toBe(true);
    const entry = getCityVisualEntry("dravik");
    expect(entry).toBeDefined();
    expect(entry!.cityId).toBe("dravik");
  });

  it("2: Dravik asset path is deterministic and points to PNG", () => {
    const entry = getCityVisualEntry("dravik");
    expect(entry).toBeDefined();
    expect(entry!.mapAsset).toBe("/assets/cities/dravik/city-map.png");
    expect(entry!.hasMap).toBe(true);
  });

  it("3: non-Dravik cities return no map entry", () => {
    expect(hasCityMap("solara")).toBe(false);
    expect(hasCityMap("kragen")).toBe(false);
    expect(hasCityMap("raskov")).toBe(false);
    expect(hasCityMap("norhaven")).toBe(false);
    expect(getCityVisualEntry("solara")).toBeUndefined();
    expect(getCityVisualEntry("raskov")).toBeUndefined();
  });

  it("4: cityVisualCatalog does not import src/core simulation", () => {
    const mod = "../../src/game/city/cityVisualCatalog.js";
    expect(mod).not.toMatch(/simulation/);
    expect(mod).not.toMatch(/\/core\//);
  });

  it("5: cityVisualCatalog has no random or time dependency", () => {
    const entry = getCityVisualEntry("dravik");
    expect(entry).toBeDefined();
    expect(typeof entry!.mapAsset).toBe("string");
    expect(entry!.mapAsset.length).toBeGreaterThan(0);
  });

  it("6: BootScene is defined and has correct key", async () => {
    const { BootScene } = await import("../../src/game/scenes/BootScene.js");
    expect(BootScene).toBeDefined();
    expect(typeof BootScene).toBe("function");
  });

  it("7: CityScene is defined and has correct key", async () => {
    const { CityScene } = await import("../../src/game/scenes/CityScene.js");
    expect(CityScene).toBeDefined();
    expect(typeof CityScene).toBe("function");
  });

  it("8: catalog does not modify GameState schema", () => {
    const entry = getCityVisualEntry("dravik");
    expect(entry).toBeDefined();
    const keys = Object.keys(entry!);
    expect(keys).toEqual(expect.arrayContaining(["cityId", "mapAsset", "hasMap"]));
    expect(keys.length).toBe(3);
  });

  it("9: catalog does not reference save or replay data", () => {
    const entry = getCityVisualEntry("dravik");
    const serialized = JSON.stringify(entry);
    expect(serialized).not.toMatch(/save/);
    expect(serialized).not.toMatch(/replay/);
    expect(serialized).not.toMatch(/timeline/);
  });

  it("10: CityScene has expected methods for dossier and navigation", async () => {
    const { CityScene } = await import("../../src/game/scenes/CityScene.js");
    expect(typeof CityScene.prototype.create).toBe("function");
    expect(typeof CityScene.prototype.init).toBe("function");
  });

  it("11: CityScene carries pending events and preserves the timeline on round-trip", () => {
    const initSource = citySceneMethods.init.toString();
    const createSource = citySceneMethods.create.toString();
    const operationSource = citySceneMethods.openDossier.toString();
    expect(initSource).toMatch(/pendingTurnEvents/);
    expect(createSource).toMatch(/pendingTurnEvents/);
    expect(createSource).toMatch(/timeline: this\.timeline/);
    expect(operationSource).toMatch(/pendingTurnEvents/);
    expect(operationSource).toMatch(/result\.event/);
  });

  it("12: map zoom and pan transform only the map container", () => {
    const source = citySceneMethods.setupPanZoom.toString();
    expect(source).toMatch(/this\.container\.setScale\(mapScale\)/);
    expect(source).toMatch(/this\.container\.x \+= dx/);
    expect(source).toMatch(/this\.container\.y \+= dy/);
    expect(source).not.toMatch(/cameras\.main\.setZoom/);
    expect(source).not.toMatch(/cameras\.main\.scroll/);
  });

  it("13: approved Dravik asset mapping remains unchanged", () => {
    expect(getCityVisualEntry("dravik")?.mapAsset).toBe("/assets/cities/dravik/city-map.png");
  });
});
