import { describe, it, expect } from "vitest";
import {
  GAME_LOGICAL_WIDTH,
  GAME_LOGICAL_HEIGHT,
  createResponsiveViewportModel,
} from "../../src/game/ui/responsiveViewport.js";

describe("responsiveViewport", () => {
  // A — Exact logical constants
  it("A: exact logical constants", () => {
    expect(GAME_LOGICAL_WIDTH).toBe(1280);
    expect(GAME_LOGICAL_HEIGHT).toBe(768);
  });

  // B — Canonical viewport
  it("B: canonical 1280x768 viewport", () => {
    const m = createResponsiveViewportModel(1280, 768);
    expect(m.scale).toBe(1);
    expect(m.canvasWidth).toBe(1280);
    expect(m.canvasHeight).toBe(768);
  });

  // C — 1920x1080 desktop
  it("C: 1920x1080 desktop viewport", () => {
    const m = createResponsiveViewportModel(1920, 1080);
    expect(m.scale).toBe(1.40625);
    expect(m.canvasWidth).toBe(1800);
    expect(m.canvasHeight).toBe(1080);
  });

  // D — 800x600 viewport
  it("D: 800x600 viewport", () => {
    const m = createResponsiveViewportModel(800, 600);
    expect(m.scale).toBe(0.625);
    expect(m.canvasWidth).toBe(800);
    expect(m.canvasHeight).toBe(480);
  });

  // E — Portrait mobile 390x844
  it("E: portrait mobile 390x844", () => {
    const m = createResponsiveViewportModel(390, 844);
    expect(m.scale).toBe(0.3046875);
    expect(m.canvasWidth).toBe(390);
    expect(m.canvasHeight).toBe(234);
  });

  // F — Ultrawide 2560x1080
  it("F: ultrawide 2560x1080", () => {
    const m = createResponsiveViewportModel(2560, 1080);
    expect(m.scale).toBe(1.40625);
    expect(m.canvasWidth).toBe(1800);
    expect(m.canvasHeight).toBe(1080);
  });

  // G — Landscape mobile 844x390
  it("G: landscape mobile 844x390", () => {
    const m = createResponsiveViewportModel(844, 390);
    expect(m.scale).toBe(0.5078125);
    expect(m.canvasWidth).toBe(650);
    expect(m.canvasHeight).toBe(390);
  });

  // H — Aspect ratio preserved
  it("H: aspect ratio preserved for representative viewports", () => {
    const targets = [
      [1920, 1080],
      [800, 600],
      [390, 844],
      [844, 390],
      [2560, 1080],
      [1024, 768],
    ];
    const expectedRatio = 1280 / 768;
    for (const [w, h] of targets) {
      const m = createResponsiveViewportModel(w, h);
      expect(m.canvasWidth / m.canvasHeight).toBeCloseTo(expectedRatio, 10);
    }
  });

  // I — Freshness
  it("I: fresh objects for identical inputs", () => {
    const a = createResponsiveViewportModel(1920, 1080);
    const b = createResponsiveViewportModel(1920, 1080);
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  // J — Width validation
  it("J: invalid width values throw RangeError", () => {
    const bad = [0, -1, NaN, Infinity, -Infinity];
    for (const v of bad) {
      expect(() => createResponsiveViewportModel(v, 768)).toThrow(RangeError);
      expect(() => createResponsiveViewportModel(v, 768)).toThrow(
        "Viewport width must be a finite positive number.",
      );
    }
  });

  // K — Height validation
  it("K: invalid height values throw RangeError", () => {
    const bad = [0, -1, NaN, Infinity, -Infinity];
    for (const v of bad) {
      expect(() => createResponsiveViewportModel(1280, v)).toThrow(RangeError);
      expect(() => createResponsiveViewportModel(1280, v)).toThrow(
        "Viewport height must be a finite positive number.",
      );
    }
  });
});
