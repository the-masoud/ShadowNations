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
import { BootScene } from "../../src/game/scenes/BootScene.js";
import { createInitialGameState } from "../../src/core/model/gameState.js";
import { createCityDossierModel } from "../../src/game/ui/cityDossierPresentation.js";

const citySceneMethods = CityScene.prototype as unknown as Record<string, () => string>;

describe("G6.1 CP3 — Dravos City Set", () => {
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

  it("3: Kragen and Raskov have deterministic map entries", () => {
    expect(hasCityMap("kragen")).toBe(true);
    expect(hasCityMap("raskov")).toBe(true);
    expect(getCityVisualEntry("kragen")).toEqual({
      cityId: "kragen",
      mapAsset: "/assets/cities/kragen/city-map.png",
      hasMap: true,
    });
    expect(getCityVisualEntry("raskov")).toEqual({
      cityId: "raskov",
      mapAsset: "/assets/cities/raskov/city-map.png",
      hasMap: true,
    });
  });

  it("4: non-Dravos cities remain on the fallback path", () => {
    expect(hasCityMap("solara")).toBe(false);
    expect(hasCityMap("norhaven")).toBe(false);
    expect(getCityVisualEntry("solara")).toBeUndefined();
    expect(getCityVisualEntry("norhaven")).toBeUndefined();
  });

  it("5: cityVisualCatalog does not import src/core simulation", () => {
    const mod = "../../src/game/city/cityVisualCatalog.js";
    expect(mod).not.toMatch(/simulation/);
    expect(mod).not.toMatch(/\/core\//);
  });

  it("6: cityVisualCatalog has no random or time dependency", () => {
    const entry = getCityVisualEntry("dravik");
    expect(entry).toBeDefined();
    expect(typeof entry!.mapAsset).toBe("string");
    expect(entry!.mapAsset.length).toBeGreaterThan(0);
  });

  it("7: BootScene preloads all three Dravos maps", () => {
    const source = BootScene.prototype.preload.toString();
    expect(source).toContain("city-map-dravik");
    expect(source).toContain("city-map-kragen");
    expect(source).toContain("city-map-raskov");
  });

  it("8: BootScene is defined and has correct key", async () => {
    const { BootScene } = await import("../../src/game/scenes/BootScene.js");
    expect(BootScene).toBeDefined();
    expect(typeof BootScene).toBe("function");
  });

  it("9: CityScene is defined and has correct key", async () => {
    const { CityScene } = await import("../../src/game/scenes/CityScene.js");
    expect(CityScene).toBeDefined();
    expect(typeof CityScene).toBe("function");
  });

  it("10: catalog does not modify GameState schema", () => {
    const entry = getCityVisualEntry("dravik");
    expect(entry).toBeDefined();
    const keys = Object.keys(entry!);
    expect(keys).toEqual(expect.arrayContaining(["cityId", "mapAsset", "hasMap"]));
    expect(keys.length).toBe(3);
  });

  it("11: catalog does not reference save or replay data", () => {
    const entry = getCityVisualEntry("dravik");
    const serialized = JSON.stringify(entry);
    expect(serialized).not.toMatch(/save/);
    expect(serialized).not.toMatch(/replay/);
    expect(serialized).not.toMatch(/timeline/);
  });

  it("12: CityScene remains the generic city scene", async () => {
    const { CityScene } = await import("../../src/game/scenes/CityScene.js");
    expect(typeof CityScene.prototype.create).toBe("function");
    expect(typeof CityScene.prototype.init).toBe("function");
    expect(CityScene.name).toBe("CityScene");
  });

  it("13: CityScene carries pending events and preserves the timeline on round-trip", () => {
    const initSource = citySceneMethods.init.toString();
    const createSource = citySceneMethods.create.toString();
    const operationSource = citySceneMethods.openDossier.toString();
    expect(initSource).toMatch(/pendingTurnEvents/);
    expect(createSource).toMatch(/pendingTurnEvents/);
    expect(createSource).toMatch(/timeline: this\.timeline/);
    expect(operationSource).toMatch(/pendingTurnEvents/);
    expect(operationSource).toMatch(/result\.event/);
  });

  it("14: map zoom and pan transform only the map container", () => {
    const source = citySceneMethods.setupPanZoom.toString();
    expect(source).toMatch(/this\.container\.setScale\(mapScale\)/);
    expect(source).toMatch(/this\.container\.x \+= dx/);
    expect(source).toMatch(/this\.container\.y \+= dy/);
    expect(source).not.toMatch(/cameras\.main\.setZoom/);
    expect(source).not.toMatch(/cameras\.main\.scroll/);
  });

  it("15: approved Dravik asset mapping remains unchanged", () => {
    expect(getCityVisualEntry("dravik")?.mapAsset).toBe("/assets/cities/dravik/city-map.png");
  });

  it("16: Dravos city dossier stats remain role-specific", () => {
    const state = createInitialGameState();
    expect(createCityDossierModel(state, "dravik").affectedStat).toBe("stability");
    expect(createCityDossierModel(state, "kragen").affectedStat).toBe("internalSecurity");
    expect(createCityDossierModel(state, "raskov").affectedStat).toBe("publicSupport");
  });
});
