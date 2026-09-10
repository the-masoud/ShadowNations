import { describe, it, expect, vi } from "vitest";

vi.mock("phaser", () => ({ default: {} }));

import visualThemeSource from "../../src/game/ui/visualTheme.ts?raw";
import nationRegionSource from "../../src/game/ui/renderNationRegionUi.ts?raw";
import timelineLauncherSource from "../../src/game/ui/renderTimelineLauncher.ts?raw";

const {
  COLORS,
  FONT_FAMILY,
  TYPOGRAPHY,
  SPACING,
  BUTTON_PADDING,
} = await import("../../src/game/ui/visualTheme.js");

describe("visualTheme", () => {
  it("1: exports all required semantic color keys", () => {
    const requiredKeys = [
      "appBackground", "surfacePanel", "elevatedSurface", "borderSubtle",
      "primaryText", "headerText", "titleText", "bodyText", "secondaryText",
      "sectionHeading", "accent", "selected", "success", "warning", "danger", "disabled",
    ];
    for (const key of requiredKeys) {
      expect(COLORS).toHaveProperty(key);
    }
  });

  it("2: numeric colors are valid Phaser hex values", () => {
    const numericKeys = [
      "appBackground", "surfacePanel", "elevatedSurface", "borderSubtle",
      "buttonPrimary", "overlayFull", "connectionLine", "nodeStroke",
    ];
    for (const key of numericKeys) {
      const val = COLORS[key as keyof typeof COLORS];
      expect(typeof val).toBe("number");
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(0xffffff);
    }
  });

  it("3: required typography styles exist", () => {
    const requiredStyles = [
      "screenTitle", "sectionHeading", "body", "bodyStrong",
      "metadata", "button", "disabledButton", "panelTitle", "code", "dynamicValue",
    ];
    for (const key of requiredStyles) {
      expect(TYPOGRAPHY).toHaveProperty(key);
      const style = TYPOGRAPHY[key as keyof typeof TYPOGRAPHY];
      expect(style).toHaveProperty("fontFamily");
      expect(style).toHaveProperty("fontSize");
      expect(style).toHaveProperty("color");
    }
  });

  it("4: typography uses no remote/web font dependency", () => {
    for (const key of Object.keys(TYPOGRAPHY)) {
      const style = TYPOGRAPHY[key as keyof typeof TYPOGRAPHY];
      expect(style.fontFamily).not.toMatch(/https?:\/\//);
      expect(style.fontFamily).not.toMatch(/googleapis/);
      expect(style.fontFamily).not.toMatch(/font-face/);
    }
    expect(FONT_FAMILY).toBe("Arial, sans-serif");
  });

  it("5: standard spacing values are positive and deterministic", () => {
    expect(SPACING.small).toBeGreaterThan(0);
    expect(SPACING.medium).toBeGreaterThan(0);
    expect(SPACING.large).toBeGreaterThan(0);
    expect(typeof SPACING.small).toBe("number");
    expect(typeof SPACING.medium).toBe("number");
    expect(typeof SPACING.large).toBe("number");
  });

  it("6: button padding values are valid", () => {
    const paddingKeys = ["compact", "standard", "comfortable", "operation", "tight"];
    for (const key of paddingKeys) {
      const pad = BUTTON_PADDING[key as keyof typeof BUTTON_PADDING];
      expect(pad.left).toBeGreaterThan(0);
      expect(pad.right).toBeGreaterThan(0);
      expect(pad.top).toBeGreaterThan(0);
      expect(pad.bottom).toBeGreaterThan(0);
    }
  });

  it("7: visualTheme source contains no browser/global mutable state", () => {
    expect(visualThemeSource).not.toMatch(/window\./);
    expect(visualThemeSource).not.toMatch(/document\./);
    expect(visualThemeSource).not.toMatch(/globalThis/);
    expect(visualThemeSource).not.toMatch(/localStorage/);
    expect(visualThemeSource).not.toMatch(/sessionStorage/);
  });

  it("8: visualTheme source does not import src/core or simulation modules", () => {
    const lines = visualThemeSource.split("\n");
    const importLines = lines.filter(
      (l: string) => l.startsWith("import ") || l.includes("from "),
    );
    for (const line of importLines) {
      expect(line).not.toMatch(/\/core\//);
      expect(line).not.toMatch(/core\//);
      expect(line).not.toMatch(/simulation/);
    }
  });

  it("9: visualTheme source does not use Math.random()", () => {
    expect(visualThemeSource).not.toMatch(/Math\.random\(/);
  });

  it("10: visualTheme source does not use Date.now() or new Date()", () => {
    expect(visualThemeSource).not.toMatch(/Date\.now\(/);
    expect(visualThemeSource).not.toMatch(/new Date\(/);
  });

  it("11: nation colors are NOT duplicated/redefined in visualTheme", () => {
    expect(COLORS).not.toHaveProperty("solaris");
    expect(COLORS).not.toHaveProperty("dravos");
    expect(COLORS).not.toHaveProperty("norvia");
    expect(COLORS).not.toHaveProperty("veloria");
    expect(COLORS).not.toHaveProperty("karsen");
    expect(COLORS).not.toHaveProperty("arkania");
  });

  it("12: createNationRegionPanelModel returns unchanged canonical data for Sunreach", async () => {
    const { createInitialGameState } = await import("../../src/core/model/gameState.js");
    const { createNationRegionPanelModel } = await import(
      "../../src/game/ui/nationRegionPresentation.js"
    );

    const state = createInitialGameState();
    const model = createNationRegionPanelModel(state, "sunreach");

    expect(model.regionId).toBe("sunreach");
    expect(model.regionName).toBe("Sunreach");
    expect(model.regionCode).toBe("SUN");
    expect(model.ownerNationId).toBe("solaris");
    expect(model.ownerNationName).toBe("Solaris");
    expect(model.ownerNationCode).toBe("SOL");
    expect(model.neighboringRegionCount).toBe(2);
    expect(model.ownedRegionCount).toBe(3);
    expect(model.stability).toBe(72);
    expect(model.publicSupport).toBe(68);
    expect(model.internalSecurity).toBe(66);
  });

  it("13: NationRegionUi has no remaining direct color literals", () => {
    expect(nationRegionSource).not.toMatch(/"Arial, sans-serif"/);
    expect(nationRegionSource).not.toMatch(/"#263244"/);
  });

  it("14: TimelineLauncher has no remaining direct color literals", () => {
    expect(timelineLauncherSource).not.toMatch(/"#111827"/);
  });
});
