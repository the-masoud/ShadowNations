import { describe, it, expect } from "vitest";
import {
  CANONICAL_CITIES,
  getCityById,
  getCityByRegionId,
  getCityOwnerNationId,
  validateCityCatalog,
  UnknownCityError,
  MissingCityForRegionError,
  CityCatalogValidationError,
  type City,
  type CityRole,
} from "../../src/core/model/city.js";
import { createInitialStrategicMap } from "../../src/core/model/strategicMap.js";
import { createInitialGameState } from "../../src/core/model/gameState.js";
import { createInitialWorldState } from "../../src/core/model/worldState.js";
import { setRegionOwner } from "../../src/core/simulation/setRegionOwner.js";

const CANONICAL_REGION_ORDER = [
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
] as const;

describe("canonical city catalog", () => {
  it("CANONICAL_CITIES has exactly 18 cities", () => {
    expect(CANONICAL_CITIES).toHaveLength(18);
  });

  it("exact canonical city order", () => {
    const expectedOrder = [
      "solara",
      "aurelis",
      "helion",
      "dravik",
      "kragen",
      "raskov",
      "norhaven",
      "eirholm",
      "argentis",
      "velyra",
      "meridia",
      "cerulea",
      "kharos",
      "sirok",
      "skarhold",
      "arkalis",
      "vespera",
      "dawnspire",
    ];
    const actualOrder = CANONICAL_CITIES.map((c) => c.id);
    expect(actualOrder).toEqual(expectedOrder);
  });

  it("exact city names", () => {
    const expectedNames = [
      "Solara",
      "Aurelis",
      "Helion",
      "Dravik",
      "Kragen",
      "Raskov",
      "Norhaven",
      "Eirholm",
      "Argentis",
      "Velyra",
      "Meridia",
      "Cerulea",
      "Kharos",
      "Sirok",
      "Skarhold",
      "Arkalis",
      "Vespera",
      "Dawnspire",
    ];
    const actualNames = CANONICAL_CITIES.map((c) => c.name);
    expect(actualNames).toEqual(expectedNames);
  });

  it("exact region linkage", () => {
    const expectedRegionIds = [
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
    const actualRegionIds = CANONICAL_CITIES.map((c) => c.regionId);
    expect(actualRegionIds).toEqual(expectedRegionIds);
  });

  it("exact roles", () => {
    const expectedRoles: CityRole[] = [
      "capital",
      "media-hub",
      "security-hub",
      "capital",
      "security-hub",
      "media-hub",
      "capital",
      "media-hub",
      "media-hub",
      "capital",
      "media-hub",
      "security-hub",
      "capital",
      "security-hub",
      "security-hub",
      "capital",
      "security-hub",
      "media-hub",
    ];
    const actualRoles = CANONICAL_CITIES.map((c) => c.role);
    expect(actualRoles).toEqual(expectedRoles);
  });

  it("exact baseSecurity values", () => {
    const expectedSecurity = [
      65, 55, 75, 80, 90, 70, 50, 40, 50, 60, 65, 70, 75, 85, 60, 60, 70, 50,
    ];
    const actualSecurity = CANONICAL_CITIES.map((c) => c.baseSecurity);
    expect(actualSecurity).toEqual(expectedSecurity);
  });

  it("exactly 6 capitals", () => {
    const capitals = CANONICAL_CITIES.filter((c) => c.role === "capital");
    expect(capitals).toHaveLength(6);
  });

  it("exactly 6 media-hubs", () => {
    const mediaHubs = CANONICAL_CITIES.filter((c) => c.role === "media-hub");
    expect(mediaHubs).toHaveLength(6);
  });

  it("exactly 6 security-hubs", () => {
    const securityHubs = CANONICAL_CITIES.filter((c) => c.role === "security-hub");
    expect(securityHubs).toHaveLength(6);
  });

  it("every canonical region has exactly one city", () => {
    const cityRegions = new Set(CANONICAL_CITIES.map((c) => c.regionId));
    expect(cityRegions.size).toBe(18);
    for (const regionId of CANONICAL_REGION_ORDER) {
      expect(cityRegions.has(regionId)).toBe(true);
    }
  });

  it("canonical catalog passes validateCityCatalog against createInitialStrategicMap", () => {
    const map = createInitialStrategicMap();
    expect(() => validateCityCatalog(CANONICAL_CITIES, map)).not.toThrow();
  });
});

describe("getCityById", () => {
  it("success for known city", () => {
    const city = getCityById("solara");
    expect(city.id).toBe("solara");
    expect(city.name).toBe("Solara");
    expect(city.regionId).toBe("sunreach");
    expect(city.role).toBe("capital");
    expect(city.baseSecurity).toBe(65);
  });

  it("unknown city throws UnknownCityError with exact message", () => {
    expect(() => getCityById("nonexistent")).toThrow(UnknownCityError);
    expect(() => getCityById("nonexistent")).toThrow('Unknown city: "nonexistent"');
  });
});

describe("getCityByRegionId", () => {
  it("success for known region", () => {
    const city = getCityByRegionId("sunreach");
    expect(city.id).toBe("solara");
    expect(city.regionId).toBe("sunreach");
  });

  it("missing region city lookup throws MissingCityForRegionError with exact message", () => {
    expect(() => getCityByRegionId("nonexistent")).toThrow(MissingCityForRegionError);
    expect(() => getCityByRegionId("nonexistent")).toThrow('Missing city for region: "nonexistent"');
  });
});

describe("validateCityCatalog", () => {
  const map = createInitialStrategicMap();

  it("duplicate city ID fails validation with exact error", () => {
    const cities: City[] = [
      ...CANONICAL_CITIES,
      { id: "solara", name: "Duplicate", regionId: "auric-basin", role: "media-hub", baseSecurity: 50 },
    ];
    expect(() => validateCityCatalog(cities, map)).toThrow(CityCatalogValidationError);
    expect(() => validateCityCatalog(cities, map)).toThrow('Duplicate city ID: "solara"');
  });

  it("duplicate region linkage fails validation with exact error", () => {
    const cities: City[] = [
      { id: "city1", name: "City1", regionId: "sunreach", role: "capital", baseSecurity: 65 },
      { id: "city2", name: "City2", regionId: "sunreach", role: "media-hub", baseSecurity: 55 },
    ];
    expect(() => validateCityCatalog(cities, map)).toThrow(CityCatalogValidationError);
    expect(() => validateCityCatalog(cities, map)).toThrow('Duplicate city for region: "sunreach"');
  });

  it("unknown region linkage fails validation with exact error", () => {
    const cities: City[] = [
      { id: "city1", name: "City1", regionId: "unknown-region", role: "capital", baseSecurity: 65 },
    ];
    expect(() => validateCityCatalog(cities, map)).toThrow(CityCatalogValidationError);
    expect(() => validateCityCatalog(cities, map)).toThrow('City "city1" references unknown region: "unknown-region"');
  });

  it("invalid role fails validation with exact error", () => {
    const cities: City[] = [
      { id: "city1", name: "City1", regionId: "sunreach", role: "invalid-role" as CityRole, baseSecurity: 65 },
    ];
    expect(() => validateCityCatalog(cities, map)).toThrow(CityCatalogValidationError);
    expect(() => validateCityCatalog(cities, map)).toThrow('Invalid city role: "invalid-role" for city "city1"');
  });

  it("non-integer baseSecurity fails validation", () => {
    const cities: City[] = [
      { id: "city1", name: "City1", regionId: "sunreach", role: "capital", baseSecurity: 65.5 },
    ];
    expect(() => validateCityCatalog(cities, map)).toThrow(CityCatalogValidationError);
    expect(() => validateCityCatalog(cities, map)).toThrow('Invalid base security for city "city1": expected integer 0..100, got 65.5');
  });

  it("baseSecurity < 0 fails validation", () => {
    const cities: City[] = [
      { id: "city1", name: "City1", regionId: "sunreach", role: "capital", baseSecurity: -1 },
    ];
    expect(() => validateCityCatalog(cities, map)).toThrow(CityCatalogValidationError);
    expect(() => validateCityCatalog(cities, map)).toThrow('Invalid base security for city "city1": expected integer 0..100, got -1');
  });

  it("baseSecurity > 100 fails validation", () => {
    const cities: City[] = [
      { id: "city1", name: "City1", regionId: "sunreach", role: "capital", baseSecurity: 101 },
    ];
    expect(() => validateCityCatalog(cities, map)).toThrow(CityCatalogValidationError);
    expect(() => validateCityCatalog(cities, map)).toThrow('Invalid base security for city "city1": expected integer 0..100, got 101');
  });

  it("empty city ID fails validation", () => {
    const cities: City[] = [
      { id: "", name: "City1", regionId: "sunreach", role: "capital", baseSecurity: 65 },
    ];
    expect(() => validateCityCatalog(cities, map)).toThrow(CityCatalogValidationError);
    expect(() => validateCityCatalog(cities, map)).toThrow("Empty city ID");
  });

  it("empty city name fails validation", () => {
    const cities: City[] = [
      { id: "city1", name: "", regionId: "sunreach", role: "capital", baseSecurity: 65 },
    ];
    expect(() => validateCityCatalog(cities, map)).toThrow(CityCatalogValidationError);
    expect(() => validateCityCatalog(cities, map)).toThrow('Empty city name for id "city1"');
  });

  it("missing city for a map region fails validation", () => {
    const cities: City[] = CANONICAL_CITIES.slice(0, 17);
    expect(() => validateCityCatalog(cities, map)).toThrow(CityCatalogValidationError);
    expect(() => validateCityCatalog(cities, map)).toThrow('Missing city for map region: "eastern-reach"');
  });
});

describe("initial canonical ownership", () => {
  const world = createInitialWorldState();

  it("gives each of the six nations exactly three cities", () => {
    const counts = new Map<string, number>();
    for (const city of CANONICAL_CITIES) {
      const owner = getCityOwnerNationId(world, city.id);
      counts.set(owner, (counts.get(owner) ?? 0) + 1);
    }
    expect(counts.size).toBe(6);
    for (const count of counts.values()) {
      expect(count).toBe(3);
    }
  });

  it("every nation has exactly one capital, one media-hub, one security-hub", () => {
    const nationRoles = new Map<string, { capital: number; "media-hub": number; "security-hub": number }>();
    for (const city of CANONICAL_CITIES) {
      const owner = getCityOwnerNationId(world, city.id);
      const roles = nationRoles.get(owner) ?? { capital: 0, "media-hub": 0, "security-hub": 0 };
      roles[city.role]++;
      nationRoles.set(owner, roles);
    }
    expect(nationRoles.size).toBe(6);
    for (const roles of nationRoles.values()) {
      expect(roles.capital).toBe(1);
      expect(roles["media-hub"]).toBe(1);
      expect(roles["security-hub"]).toBe(1);
    }
  });

  it("exact Solaris cities", () => {
    const solarisCities = CANONICAL_CITIES.filter((c) => getCityOwnerNationId(world, c.id) === "solaris");
    expect(solarisCities.map((c) => c.id)).toEqual(["solara", "aurelis", "helion"]);
    expect(solarisCities.find((c) => c.role === "capital")?.id).toBe("solara");
    expect(solarisCities.find((c) => c.role === "media-hub")?.id).toBe("aurelis");
    expect(solarisCities.find((c) => c.role === "security-hub")?.id).toBe("helion");
  });

  it("exact Dravos cities", () => {
    const dravosCities = CANONICAL_CITIES.filter((c) => getCityOwnerNationId(world, c.id) === "dravos");
    expect(dravosCities.map((c) => c.id)).toEqual(["dravik", "kragen", "raskov"]);
    expect(dravosCities.find((c) => c.role === "capital")?.id).toBe("dravik");
    expect(dravosCities.find((c) => c.role === "media-hub")?.id).toBe("raskov");
    expect(dravosCities.find((c) => c.role === "security-hub")?.id).toBe("kragen");
  });

  it("exact Norvia cities", () => {
    const norviaCities = CANONICAL_CITIES.filter((c) => getCityOwnerNationId(world, c.id) === "norvia");
    expect(norviaCities.map((c) => c.id)).toEqual(["norhaven", "eirholm", "skarhold"]);
    expect(norviaCities.find((c) => c.role === "capital")?.id).toBe("norhaven");
    expect(norviaCities.find((c) => c.role === "media-hub")?.id).toBe("eirholm");
    expect(norviaCities.find((c) => c.role === "security-hub")?.id).toBe("skarhold");
  });

  it("exact Veloria cities", () => {
    const veloriaCities = CANONICAL_CITIES.filter((c) => getCityOwnerNationId(world, c.id) === "veloria");
    expect(veloriaCities.map((c) => c.id)).toEqual(["argentis", "velyra", "cerulea"]);
    expect(veloriaCities.find((c) => c.role === "capital")?.id).toBe("velyra");
    expect(veloriaCities.find((c) => c.role === "media-hub")?.id).toBe("argentis");
    expect(veloriaCities.find((c) => c.role === "security-hub")?.id).toBe("cerulea");
  });

  it("exact Karsen cities", () => {
    const karsenCities = CANONICAL_CITIES.filter((c) => getCityOwnerNationId(world, c.id) === "karsen");
    expect(karsenCities.map((c) => c.id)).toEqual(["meridia", "kharos", "sirok"]);
    expect(karsenCities.find((c) => c.role === "capital")?.id).toBe("kharos");
    expect(karsenCities.find((c) => c.role === "media-hub")?.id).toBe("meridia");
    expect(karsenCities.find((c) => c.role === "security-hub")?.id).toBe("sirok");
  });

  it("exact Arkania cities", () => {
    const arkaniaCities = CANONICAL_CITIES.filter((c) => getCityOwnerNationId(world, c.id) === "arkania");
    expect(arkaniaCities.map((c) => c.id)).toEqual(["arkalis", "vespera", "dawnspire"]);
    expect(arkaniaCities.find((c) => c.role === "capital")?.id).toBe("arkalis");
    expect(arkaniaCities.find((c) => c.role === "media-hub")?.id).toBe("dawnspire");
    expect(arkaniaCities.find((c) => c.role === "security-hub")?.id).toBe("vespera");
  });
});

describe("ownership derivation", () => {
  it("getCityOwnerNationId reflects new Region owner without modifying CANONICAL_CITIES", () => {
    let state = createInitialGameState();
    const solaraBefore = getCityOwnerNationId(state.world, "solara");
    expect(solaraBefore).toBe("solaris");

    state = setRegionOwner(state, "sunreach", "dravos");
    const solaraAfter = getCityOwnerNationId(state.world, "solara");
    expect(solaraAfter).toBe("dravos");

    const catalogUnchanged = CANONICAL_CITIES.find((c) => c.id === "solara");
    expect(catalogUnchanged?.regionId).toBe("sunreach");
  });

  it("transferring region to another valid nation updates all cities in that region", () => {
    let state = createInitialGameState();
    const helionBefore = getCityOwnerNationId(state.world, "helion");
    expect(helionBefore).toBe("solaris");

    state = setRegionOwner(state, "helion-coast", "norvia");
    const helionAfter = getCityOwnerNationId(state.world, "helion");
    expect(helionAfter).toBe("norvia");
  });
});