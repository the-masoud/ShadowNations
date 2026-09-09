import { describe, it, expect } from "vitest";
import {
  createInitialCitySecurity,
  getCitySecurity,
  validateCitySecurity,
  MissingCitySecurityError,
  CitySecurityValidationError,
} from "../../src/core/model/citySecurity.js";
import { CANONICAL_CITIES } from "../../src/core/model/city.js";
import { createInitialWorldState } from "../../src/core/model/worldState.js";
import { createInitialGameState } from "../../src/core/model/gameState.js";
import { resolveTurn } from "../../src/core/simulation/resolveTurn.js";
import { setCitySecurity } from "../../src/core/simulation/setCitySecurity.js";
import { setRegionOwner } from "../../src/core/simulation/setRegionOwner.js";
import { InvalidCitySecurityValueError } from "../../src/core/simulation/setCitySecurity.js";
import { UnknownCityError } from "../../src/core/model/city.js";
import type { WorldState } from "../../src/core/model/worldState.js";

describe("initial city security", () => {
  it("has exactly 18 entries", () => {
    const security = createInitialCitySecurity();
    expect(security).toHaveLength(18);
  });

  it("exact initial cityId order", () => {
    const security = createInitialCitySecurity();
    const expectedOrder = CANONICAL_CITIES.map((c) => c.id);
    const actualOrder = security.map((s) => s.cityId);
    expect(actualOrder).toEqual(expectedOrder);
  });

  it("exact initial values", () => {
    const security = createInitialCitySecurity();
    const expectedValues = CANONICAL_CITIES.map((c) => c.baseSecurity);
    const actualValues = security.map((s) => s.value);
    expect(actualValues).toEqual(expectedValues);
  });

  it("values equal each CANONICAL_CITIES baseSecurity", () => {
    const security = createInitialCitySecurity();
    for (let i = 0; i < CANONICAL_CITIES.length; i++) {
      expect(security[i].cityId).toBe(CANONICAL_CITIES[i].id);
      expect(security[i].value).toBe(CANONICAL_CITIES[i].baseSecurity);
    }
  });

  it("repeated initial creation deeply equal", () => {
    const a = createInitialCitySecurity();
    const b = createInitialCitySecurity();
    expect(a).toEqual(b);
  });

  it("repeated initial creation does not share array", () => {
    const a = createInitialCitySecurity();
    const b = createInitialCitySecurity();
    expect(a).not.toBe(b);
  });

  it("initial WorldState contains exact City Security state", () => {
    const world = createInitialWorldState();
    expect(world.citySecurity).toBeDefined();
    expect(world.citySecurity).toHaveLength(18);
    for (let i = 0; i < CANONICAL_CITIES.length; i++) {
      expect(world.citySecurity[i].cityId).toBe(CANONICAL_CITIES[i].id);
      expect(world.citySecurity[i].value).toBe(CANONICAL_CITIES[i].baseSecurity);
    }
  });

  it("initial WorldState passes validation", () => {
    const world = createInitialWorldState();
    expect(() => validateCitySecurity(world)).not.toThrow();
  });
});

describe("getCitySecurity", () => {
  it("returns correct entry", () => {
    const world = createInitialWorldState();
    const security = getCitySecurity(world, "solara");
    expect(security.cityId).toBe("solara");
    expect(security.value).toBe(65);
  });

  it("unknown canonical city lookup fails through existing UnknownCityError", () => {
    const world = createInitialWorldState();
    expect(() => getCitySecurity(world, "nonexistent")).toThrow(UnknownCityError);
    expect(() => getCitySecurity(world, "nonexistent")).toThrow('Unknown city: "nonexistent"');
  });

  it("missing dynamic entry throws MissingCitySecurityError exact message", () => {
    const world = createInitialWorldState();
    const worldWithoutSolara = {
      ...world,
      citySecurity: world.citySecurity.filter((s) => s.cityId !== "solara"),
    };
    expect(() => getCitySecurity(worldWithoutSolara, "solara")).toThrow(MissingCitySecurityError);
    expect(() => getCitySecurity(worldWithoutSolara, "solara")).toThrow('Missing city security for city: "solara"');
  });
});

describe("validateCitySecurity", () => {
  it("canonical City Security passes validateCitySecurity", () => {
    const world = createInitialWorldState();
    expect(() => validateCitySecurity(world)).not.toThrow();
  });

  it("unknown city entry fails exact validation error", () => {
    const world = createInitialWorldState();
    const badWorld: WorldState = {
      ...world,
      citySecurity: [
        ...world.citySecurity,
        { cityId: "unknown-city", value: 50 },
      ],
    };
    expect(() => validateCitySecurity(badWorld)).toThrow(CitySecurityValidationError);
    expect(() => validateCitySecurity(badWorld)).toThrow('City security references unknown city: "unknown-city"');
  });

  it("duplicate city entry fails exact validation error", () => {
    const world = createInitialWorldState();
    const badWorld: WorldState = {
      ...world,
      citySecurity: [
        ...world.citySecurity,
        { cityId: "solara", value: 50 },
      ],
    };
    expect(() => validateCitySecurity(badWorld)).toThrow(CitySecurityValidationError);
    expect(() => validateCitySecurity(badWorld)).toThrow('Duplicate city security: "solara"');
  });

  it("non-integer value fails exact validation error", () => {
    const world = createInitialWorldState();
    const badWorld: WorldState = {
      ...world,
      citySecurity: world.citySecurity.map((s) =>
        s.cityId === "solara" ? { ...s, value: 50.5 } : s
      ),
    };
    expect(() => validateCitySecurity(badWorld)).toThrow(CitySecurityValidationError);
    expect(() => validateCitySecurity(badWorld)).toThrow('Invalid city security for "solara": expected integer 0..100, got 50.5');
  });

  it("value -1 fails", () => {
    const world = createInitialWorldState();
    const badWorld: WorldState = {
      ...world,
      citySecurity: world.citySecurity.map((s) =>
        s.cityId === "solara" ? { ...s, value: -1 } : s
      ),
    };
    expect(() => validateCitySecurity(badWorld)).toThrow(CitySecurityValidationError);
    expect(() => validateCitySecurity(badWorld)).toThrow('Invalid city security for "solara": expected integer 0..100, got -1');
  });

  it("value 101 fails", () => {
    const world = createInitialWorldState();
    const badWorld: WorldState = {
      ...world,
      citySecurity: world.citySecurity.map((s) =>
        s.cityId === "solara" ? { ...s, value: 101 } : s
      ),
    };
    expect(() => validateCitySecurity(badWorld)).toThrow(CitySecurityValidationError);
    expect(() => validateCitySecurity(badWorld)).toThrow('Invalid city security for "solara": expected integer 0..100, got 101');
  });

  it("missing canonical city fails exact validation error", () => {
    const world = createInitialWorldState();
    const badWorld: WorldState = {
      ...world,
      citySecurity: world.citySecurity.filter((s) => s.cityId !== "solara"),
    };
    expect(() => validateCitySecurity(badWorld)).toThrow(CitySecurityValidationError);
    expect(() => validateCitySecurity(badWorld)).toThrow('Missing city security for city: "solara"');
  });
});

describe("setCitySecurity", () => {
  it("updates exact target", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 50);
    const security = getCitySecurity(state.world, "solara");
    expect(security.value).toBe(50);
  });

  it("preserves all unrelated entries", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 50);
    const aurelis = getCitySecurity(state.world, "aurelis");
    const helion = getCitySecurity(state.world, "helion");
    expect(aurelis.value).toBe(55);
    expect(helion.value).toBe(75);
  });

  it("does not mutate input state", () => {
    const state = createInitialGameState();
    const originalSolara = getCitySecurity(state.world, "solara").value;
    setCitySecurity(state, "solara", 50);
    expect(getCitySecurity(state.world, "solara").value).toBe(originalSolara);
  });

  it("returns a new state/world/array when changed", () => {
    const state = createInitialGameState();
    const newState = setCitySecurity(state, "solara", 50);
    expect(newState).not.toBe(state);
    expect(newState.world).not.toBe(state.world);
    expect(newState.world.citySecurity).not.toBe(state.world.citySecurity);
  });

  it("returns exact same state reference on no-op value", () => {
    const state = createInitialGameState();
    const newState = setCitySecurity(state, "solara", 65);
    expect(newState).toBe(state);
  });

  it("rejects non-integer value with InvalidCitySecurityValueError", () => {
    const state = createInitialGameState();
    expect(() => setCitySecurity(state, "solara", 50.5)).toThrow(InvalidCitySecurityValueError);
    expect(() => setCitySecurity(state, "solara", 50.5)).toThrow('Invalid city security value for city "solara": expected integer 0..100, got 50.5');
  });

  it("rejects <0", () => {
    const state = createInitialGameState();
    expect(() => setCitySecurity(state, "solara", -1)).toThrow(InvalidCitySecurityValueError);
    expect(() => setCitySecurity(state, "solara", -1)).toThrow('Invalid city security value for city "solara": expected integer 0..100, got -1');
  });

  it("rejects >100", () => {
    const state = createInitialGameState();
    expect(() => setCitySecurity(state, "solara", 101)).toThrow(InvalidCitySecurityValueError);
    expect(() => setCitySecurity(state, "solara", 101)).toThrow('Invalid city security value for city "solara": expected integer 0..100, got 101');
  });

  it("rejects unknown city through existing UnknownCityError", () => {
    const state = createInitialGameState();
    expect(() => setCitySecurity(state, "nonexistent", 50)).toThrow(UnknownCityError);
    expect(() => setCitySecurity(state, "nonexistent", 50)).toThrow('Unknown city: "nonexistent"');
  });
});

describe("turn and ownership interactions", () => {
  it("resolving a normal turn does NOT yet change citySecurity", () => {
    const state = createInitialGameState();
    const originalSecurity = state.world.citySecurity.map((s) => s.value);
    const { state: next } = resolveTurn(state, []);
    const newSecurity = next.world.citySecurity.map((s) => s.value);
    expect(newSecurity).toEqual(originalSecurity);
  });

  it("City ownership transfer via setRegionOwner does NOT alter the City's security value", () => {
    let state = createInitialGameState();
    const originalSecurity = getCitySecurity(state.world, "solara").value;
    state = setRegionOwner(state, "sunreach", "dravos");
    const newSecurity = getCitySecurity(state.world, "solara").value;
    expect(newSecurity).toBe(originalSecurity);
  });

  it("createInitialGameState repeated calls remain deterministic", () => {
    const a = createInitialGameState();
    const b = createInitialGameState();
    expect(a).toEqual(b);
  });
});