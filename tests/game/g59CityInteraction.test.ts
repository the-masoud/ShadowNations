import { describe, it, expect } from "vitest";
import { CANONICAL_CITIES } from "../../src/core/model/city.js";
import { UnknownCityError } from "../../src/core/model/city.js";
import {
  createInitialCityMapInteractionState,
  selectCityMapCity,
  hoverCityMapCity,
} from "../../src/game/map/cityMapInteraction.js";

describe("cityMapInteraction", () => {
  it("1: initial state exact runtime keys", () => {
    const state = createInitialCityMapInteractionState();
    const keys = Object.keys(state).sort();
    expect(keys).toEqual(["hoveredCityId", "selectedCityId", "selectedRegionId"]);
  });

  it("2: initial selectedCityId == solara", () => {
    const state = createInitialCityMapInteractionState();
    expect(state.selectedCityId).toBe("solara");
  });

  it("3: initial selectedRegionId == sunreach", () => {
    const state = createInitialCityMapInteractionState();
    expect(state.selectedRegionId).toBe("sunreach");
  });

  it("4: initial hoveredCityId == null", () => {
    const state = createInitialCityMapInteractionState();
    expect(state.hoveredCityId).toBeNull();
  });

  it("5: select dravik => selectedCityId dravik, selectedRegionId ironvale", () => {
    const initial = createInitialCityMapInteractionState();
    const next = selectCityMapCity(initial, "dravik");
    expect(next.selectedCityId).toBe("dravik");
    expect(next.selectedRegionId).toBe("ironvale");
  });

  it("6: all 18 canonical cities select to their exact canonical region", () => {
    const initial = createInitialCityMapInteractionState();
    for (const city of CANONICAL_CITIES) {
      const next = selectCityMapCity(initial, city.id);
      expect(next.selectedCityId).toBe(city.id);
      expect(next.selectedRegionId).toBe(city.regionId);
    }
  });

  it("7: select clears a previous hoveredCityId", () => {
    let state = createInitialCityMapInteractionState();
    state = hoverCityMapCity(state, "dravik");
    expect(state.hoveredCityId).toBe("dravik");
    state = selectCityMapCity(state, "dravik");
    expect(state.hoveredCityId).toBeNull();
  });

  it("8: hover city preserves selected city/region and sets hovered city", () => {
    const initial = createInitialCityMapInteractionState();
    const hovered = hoverCityMapCity(initial, "dravik");
    expect(hovered.selectedCityId).toBe("solara");
    expect(hovered.selectedRegionId).toBe("sunreach");
    expect(hovered.hoveredCityId).toBe("dravik");
  });

  it("9: hover null clears hover and preserves selection", () => {
    let state = createInitialCityMapInteractionState();
    state = hoverCityMapCity(state, "dravik");
    state = hoverCityMapCity(state, null);
    expect(state.hoveredCityId).toBeNull();
    expect(state.selectedCityId).toBe("solara");
    expect(state.selectedRegionId).toBe("sunreach");
  });

  it("10: select unknown city throws UnknownCityError", () => {
    const initial = createInitialCityMapInteractionState();
    expect(() => selectCityMapCity(initial, "nonexistent")).toThrow(UnknownCityError);
  });

  it("11: hover unknown city throws UnknownCityError", () => {
    const initial = createInitialCityMapInteractionState();
    expect(() => hoverCityMapCity(initial, "nonexistent")).toThrow(UnknownCityError);
  });

  it("12: select/hover return fresh objects and never mutate input", () => {
    const initial = createInitialCityMapInteractionState();
    const initialJson = JSON.stringify(initial);

    const selected = selectCityMapCity(initial, "dravik");
    expect(JSON.stringify(initial)).toBe(initialJson);
    expect(selected).not.toBe(initial);

    const hovered = hoverCityMapCity(initial, "dravik");
    expect(JSON.stringify(initial)).toBe(initialJson);
    expect(hovered).not.toBe(initial);
  });
});
