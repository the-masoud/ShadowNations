import { describe, it, expect } from "vitest";
import { createInitialGameState } from "../../src/core/model/gameState.js";
import type { GameState } from "../../src/core/model/gameState.js";
import { UnknownNationError } from "../../src/core/model/worldState.js";
import { getNationStrategicStats } from "../../src/core/model/nationStrategicStats.js";
import { getNationActionPoints } from "../../src/core/model/actionPoints.js";
import { getCitySecurity } from "../../src/core/model/citySecurity.js";
import { setNationVisibility } from "../../src/core/simulation/setNationVisibility.js";
import { setIntelligenceNetworkLevel } from "../../src/core/simulation/setIntelligenceNetworkLevel.js";
import { setCitySecurity } from "../../src/core/simulation/setCitySecurity.js";
import { setNationStrategicStat } from "../../src/core/simulation/setNationStrategicStat.js";
import { setRegionOwner } from "../../src/core/simulation/setRegionOwner.js";
import { spendActionPoints } from "../../src/core/simulation/spendActionPoints.js";
import { InvalidPhaseError } from "../../src/core/simulation/resolveTurn.js";
import {
  AgentOwnershipError,
  InsufficientIntelligenceNetworkError,
} from "../../src/core/simulation/intelligenceErrors.js";
import {
  SelfTargetCityOperationError,
  InsufficientCityVisibilityError,
  CitySecurityTooHighError,
} from "../../src/core/simulation/cityOperationErrors.js";
import { UnknownCityError } from "../../src/core/model/city.js";
import {
  INFILTRATE_CITY_AP_COST,
  INFILTRATE_CITY_SECURITY_DAMAGE,
  infiltrateCity,
} from "../../src/core/simulation/infiltrateCity.js";
import {
  URBAN_DISRUPTION_AP_COST,
  URBAN_DISRUPTION_MAXIMUM_SECURITY,
  URBAN_DISRUPTION_STAT_DAMAGE,
  URBAN_DISRUPTION_POST_SECURITY_BONUS,
  conductUrbanDisruption,
} from "../../src/core/simulation/conductUrbanDisruption.js";
import {
  CITY_BLACK_OPERATION_AP_COST,
  CITY_BLACK_OPERATION_MAXIMUM_SECURITY,
  CITY_BLACK_OPERATION_STAT_DAMAGE,
  CITY_BLACK_OPERATION_POST_SECURITY_BONUS,
  conductCityBlackOperation,
} from "../../src/core/simulation/conductCityBlackOperation.js";

function setupInfiltrate(
  visibility: "unknown" | "limited" | "known" = "known",
  network: "none" | "foothold" | "established" | "deep" = "established",
  citySecurity = 60,
): GameState {
  let state = createInitialGameState();
  state = setNationVisibility(state, "solaris", "dravos", visibility);
  state = setIntelligenceNetworkLevel(state, "solaris", "dravos", network);
  state = setCitySecurity(state, "dravik", citySecurity);
  return state;
}

function setupUrban(citySecurity = 40): GameState {
  let state = createInitialGameState();
  state = setNationVisibility(state, "solaris", "dravos", "known");
  state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "established");
  state = setCitySecurity(state, "dravik", citySecurity);
  return state;
}

function setupBlack(citySecurity = 20): GameState {
  let state = createInitialGameState();
  state = setNationVisibility(state, "solaris", "dravos", "known");
  state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "deep");
  state = setCitySecurity(state, "dravik", citySecurity);
  return state;
}

describe("infiltrateCity", () => {
  it("A: exact constants", () => {
    expect(INFILTRATE_CITY_AP_COST).toBe(2);
    expect(INFILTRATE_CITY_SECURITY_DAMAGE).toBe(25);
  });

  it("B: LIMITED + FOOTHOLD success", () => {
    const state = setupInfiltrate("limited", "foothold", 60);
    const result = infiltrateCity(state, "solaris", "dravik", "solaris-echo");
    expect(result.event.type).toBe("city-infiltrated");
    expect(result.event.previousSecurity).toBe(60);
    expect(result.event.newSecurity).toBe(35);
    expect(result.event.actionPointCost).toBe(2);
  });

  it("C: KNOWN + DEEP success", () => {
    const state = setupInfiltrate("known", "deep", 60);
    const result = infiltrateCity(state, "solaris", "dravik", "solaris-echo");
    expect(result.event.previousSecurity).toBe(60);
    expect(result.event.newSecurity).toBe(35);
  });

  it("D: exact -25 effect and clamp 0", () => {
    const state = setupInfiltrate("known", "established", 15);
    const result = infiltrateCity(state, "solaris", "dravik", "solaris-echo");
    expect(result.event.previousSecurity).toBe(15);
    expect(result.event.newSecurity).toBe(0);
  });

  it("E: security=0 succeeds and event 0 to 0", () => {
    const state = setupInfiltrate("known", "established", 0);
    const result = infiltrateCity(state, "solaris", "dravik", "solaris-echo");
    const apBefore = getNationActionPoints(state, "solaris").remaining;
    const apAfter = getNationActionPoints(result.state, "solaris").remaining;
    expect(result.event.previousSecurity).toBe(0);
    expect(result.event.newSecurity).toBe(0);
    expect(apBefore - apAfter).toBe(2);
  });

  it("F: no strategic stat changes", () => {
    const state = setupInfiltrate();
    const before = getNationStrategicStats(state.world, "dravos");
    const result = infiltrateCity(state, "solaris", "dravik", "solaris-echo");
    const after = getNationStrategicStats(result.state.world, "dravos");
    expect(after.stability).toBe(before.stability);
    expect(after.publicSupport).toBe(before.publicSupport);
    expect(after.internalSecurity).toBe(before.internalSecurity);
  });

  it("G: exactly 2 AP deducted; unrelated nation AP preserved", () => {
    const state = setupInfiltrate();
    const solarisApBefore = getNationActionPoints(state, "solaris").remaining;
    const norviaApBefore = getNationActionPoints(state, "norvia").remaining;
    const result = infiltrateCity(state, "solaris", "dravik", "solaris-echo");
    const solarisApAfter = getNationActionPoints(result.state, "solaris").remaining;
    const norviaApAfter = getNationActionPoints(result.state, "norvia").remaining;
    expect(solarisApBefore - solarisApAfter).toBe(2);
    expect(norviaApAfter).toBe(norviaApBefore);
  });

  it("H: changed state/world/citySecurity/planning refs; input immutable", () => {
    const state = setupInfiltrate();
    const snapshot = JSON.stringify(state);
    const result = infiltrateCity(state, "solaris", "dravik", "solaris-echo");
    expect(result.state).not.toBe(state);
    expect(result.state.world).not.toBe(state.world);
    expect(result.state.world.citySecurity).not.toBe(state.world.citySecurity);
    expect(getCitySecurity(result.state.world, "dravik").value).not.toBe(
      getCitySecurity(state.world, "dravik").value,
    );
    expect(result.state.planning).not.toBe(state.planning);
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it("I: ownership transfer — targetNationId follows new owner", () => {
    let state = setupInfiltrate();
    state = setRegionOwner(state, "ironvale", "norvia");
    state = setNationVisibility(state, "solaris", "norvia", "limited");
    state = setIntelligenceNetworkLevel(state, "solaris", "norvia", "foothold");
    const result = infiltrateCity(state, "solaris", "dravik", "solaris-echo");
    expect(result.event.targetNationId).toBe("norvia");
  });

  it("J: unknown actor throws UnknownNationError", () => {
    const state = setupInfiltrate();
    expect(() =>
      infiltrateCity(state, "nonexistent" as any, "dravik", "solaris-echo"),
    ).toThrow(UnknownNationError);
  });

  it("K: unknown visibility fails before AP spend", () => {
    const state = setupInfiltrate("unknown", "established", 60);
    const apBefore = getNationActionPoints(state, "solaris").remaining;
    expect(() =>
      infiltrateCity(state, "solaris", "dravik", "solaris-echo"),
    ).toThrow(InsufficientCityVisibilityError);
    expect(getNationActionPoints(state, "solaris").remaining).toBe(apBefore);
  });

  it("L: none network fails before AP spend", () => {
    const state = setupInfiltrate("known", "none", 60);
    const apBefore = getNationActionPoints(state, "solaris").remaining;
    expect(() =>
      infiltrateCity(state, "solaris", "dravik", "solaris-echo"),
    ).toThrow(InsufficientIntelligenceNetworkError);
    expect(getNationActionPoints(state, "solaris").remaining).toBe(apBefore);
  });

  it("M: invalid phase leaves City Security unchanged", () => {
    let state = setupInfiltrate("known", "established", 60);
    state = { ...state, phase: "resolution" as const };
    const secBefore = getCitySecurity(state.world, "dravik").value;
    expect(() =>
      infiltrateCity(state, "solaris", "dravik", "solaris-echo"),
    ).toThrow(InvalidPhaseError);
    expect(getCitySecurity(state.world, "dravik").value).toBe(secBefore);
  });

  it("N: self-target, wrong-agent, unknown-city errors", () => {
    const state = setupInfiltrate();
    expect(() =>
      infiltrateCity(state, "solaris", "solara", "solaris-echo"),
    ).toThrow(SelfTargetCityOperationError);
    expect(() =>
      infiltrateCity(state, "solaris", "dravik", "dravos-raven"),
    ).toThrow(AgentOwnershipError);
    expect(() =>
      infiltrateCity(state, "solaris", "nonexistent" as any, "solaris-echo"),
    ).toThrow(UnknownCityError);
  });

  it("O: insufficient AP leaves City Security unchanged", () => {
    let state = setupInfiltrate();
    state = spendActionPoints(state, "solaris", 5);
    const secBefore = getCitySecurity(state.world, "dravik").value;
    expect(() =>
      infiltrateCity(state, "solaris", "dravik", "solaris-echo"),
    ).toThrow();
    expect(getCitySecurity(state.world, "dravik").value).toBe(secBefore);
  });
});

describe("conductUrbanDisruption", () => {
  it("A: exact constants", () => {
    expect(URBAN_DISRUPTION_AP_COST).toBe(2);
    expect(URBAN_DISRUPTION_MAXIMUM_SECURITY).toBe(50);
    expect(URBAN_DISRUPTION_STAT_DAMAGE).toBe(8);
    expect(URBAN_DISRUPTION_POST_SECURITY_BONUS).toBe(25);
  });

  it("B: KNOWN + ESTABLISHED success", () => {
    const state = setupUrban(40);
    const result = conductUrbanDisruption(state, "solaris", "dravik", "solaris-echo");
    expect(result.event.type).toBe("urban-disruption-conducted");
    expect(result.event.previousSecurity).toBe(40);
  });

  it("C: KNOWN + DEEP success", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "deep");
    state = setCitySecurity(state, "dravik", 40);
    const result = conductUrbanDisruption(state, "solaris", "dravik", "solaris-echo");
    expect(result.event.type).toBe("urban-disruption-conducted");
  });

  it("D: 50 pass and 51 fail", () => {
    const pass = setupUrban(50);
    const passResult = conductUrbanDisruption(pass, "solaris", "dravik", "solaris-echo");
    expect(passResult.event.previousSecurity).toBe(50);
    const fail = setupUrban(51);
    expect(() =>
      conductUrbanDisruption(fail, "solaris", "dravik", "solaris-echo"),
    ).toThrow(CitySecurityTooHighError);
  });

  it("E: capital stability -8", () => {
    let state = setupUrban(40);
    const before = getNationStrategicStats(state.world, "dravos").stability;
    const result = conductUrbanDisruption(state, "solaris", "dravik", "solaris-echo");
    expect(result.event.strategicStat).toBe("stability");
    expect(result.event.previousValue).toBe(before);
    expect(result.event.newValue).toBe(Math.max(before - 8, 0));
  });

  it("F: media publicSupport -8", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "established");
    state = setCitySecurity(state, "raskov", 40);
    const before = getNationStrategicStats(state.world, "dravos").publicSupport;
    const result = conductUrbanDisruption(state, "solaris", "raskov", "solaris-echo");
    expect(result.event.strategicStat).toBe("publicSupport");
    expect(result.event.previousValue).toBe(before);
    expect(result.event.newValue).toBe(Math.max(before - 8, 0));
  });

  it("G: security-hub internalSecurity -8", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "established");
    state = setCitySecurity(state, "kragen", 40);
    const before = getNationStrategicStats(state.world, "dravos").internalSecurity;
    const result = conductUrbanDisruption(state, "solaris", "kragen", "solaris-echo");
    expect(result.event.strategicStat).toBe("internalSecurity");
    expect(result.event.previousValue).toBe(before);
    expect(result.event.newValue).toBe(Math.max(before - 8, 0));
  });

  it("H: stat clamp 0", () => {
    let state = setupUrban(40);
    state = setNationStrategicStat(state, "dravos", "stability", 5);
    const result = conductUrbanDisruption(state, "solaris", "dravik", "solaris-echo");
    expect(result.event.previousValue).toBe(5);
    expect(result.event.newValue).toBe(0);
  });

  it("I: non-clamped base+25", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "norvia", "known");
    state = setIntelligenceNetworkLevel(state, "solaris", "norvia", "established");
    state = setCitySecurity(state, "eirholm", 30);
    const result = conductUrbanDisruption(state, "solaris", "eirholm", "solaris-echo");
    expect(result.event.newSecurity).toBe(65);
  });

  it("J: clamp-to-100 post-security", () => {
    const state = setupUrban(40);
    const result = conductUrbanDisruption(state, "solaris", "dravik", "solaris-echo");
    expect(result.event.newSecurity).toBe(100);
  });

  it("K: exactly 2 AP; unrelated nation AP preserved", () => {
    const state = setupUrban();
    const solarisApBefore = getNationActionPoints(state, "solaris").remaining;
    const veloriaApBefore = getNationActionPoints(state, "veloria").remaining;
    const result = conductUrbanDisruption(state, "solaris", "dravik", "solaris-echo");
    expect(solarisApBefore - getNationActionPoints(result.state, "solaris").remaining).toBe(2);
    expect(getNationActionPoints(result.state, "veloria").remaining).toBe(veloriaApBefore);
  });

  it("L: ownership transfer target derivation", () => {
    let state = setupUrban(40);
    state = setRegionOwner(state, "ironvale", "norvia");
    state = setNationVisibility(state, "solaris", "norvia", "known");
    state = setIntelligenceNetworkLevel(state, "solaris", "norvia", "established");
    const result = conductUrbanDisruption(state, "solaris", "dravik", "solaris-echo");
    expect(result.event.targetNationId).toBe("norvia");
  });

  it("M: LIMITED visibility and FOOTHOLD network rejection", () => {
    const limitedState = (() => {
      let s = createInitialGameState();
      s = setNationVisibility(s, "solaris", "dravos", "limited");
      s = setIntelligenceNetworkLevel(s, "solaris", "dravos", "established");
      s = setCitySecurity(s, "dravik", 40);
      return s;
    })();
    const apBeforeLimited = getNationActionPoints(limitedState, "solaris").remaining;
    expect(() =>
      conductUrbanDisruption(limitedState, "solaris", "dravik", "solaris-echo"),
    ).toThrow(InsufficientCityVisibilityError);
    expect(getNationActionPoints(limitedState, "solaris").remaining).toBe(apBeforeLimited);
    const footholdState = (() => {
      let s = createInitialGameState();
      s = setNationVisibility(s, "solaris", "dravos", "known");
      s = setIntelligenceNetworkLevel(s, "solaris", "dravos", "foothold");
      s = setCitySecurity(s, "dravik", 40);
      return s;
    })();
    const apBeforeFoothold = getNationActionPoints(footholdState, "solaris").remaining;
    expect(() =>
      conductUrbanDisruption(footholdState, "solaris", "dravik", "solaris-echo"),
    ).toThrow(InsufficientIntelligenceNetworkError);
    expect(getNationActionPoints(footholdState, "solaris").remaining).toBe(apBeforeFoothold);
  });

  it("N: self-target, wrong-agent, invalid-phase errors", () => {
    const state = setupUrban();
    expect(() =>
      conductUrbanDisruption(state, "solaris", "solara", "solaris-echo"),
    ).toThrow(SelfTargetCityOperationError);
    expect(() =>
      conductUrbanDisruption(state, "solaris", "dravik", "dravos-raven"),
    ).toThrow(AgentOwnershipError);
    let resPhase = createInitialGameState();
    resPhase = { ...resPhase, phase: "resolution" as const };
    expect(() =>
      conductUrbanDisruption(resPhase, "solaris", "dravik", "solaris-echo"),
    ).toThrow(InvalidPhaseError);
  });

  it("O: insufficient AP and unknown city errors", () => {
    let state = setupUrban();
    state = spendActionPoints(state, "solaris", 5);
    const secBefore = getCitySecurity(state.world, "dravik").value;
    const statsBefore = getNationStrategicStats(state.world, "dravos");
    expect(() =>
      conductUrbanDisruption(state, "solaris", "dravik", "solaris-echo"),
    ).toThrow();
    expect(getCitySecurity(state.world, "dravik").value).toBe(secBefore);
    expect(getNationStrategicStats(state.world, "dravos").stability).toBe(statsBefore.stability);
    const fresh = createInitialGameState();
    expect(() =>
      conductUrbanDisruption(fresh, "solaris", "nonexistent" as any, "solaris-echo"),
    ).toThrow(UnknownCityError);
  });
});

describe("conductCityBlackOperation", () => {
  it("A: exact constants", () => {
    expect(CITY_BLACK_OPERATION_AP_COST).toBe(3);
    expect(CITY_BLACK_OPERATION_MAXIMUM_SECURITY).toBe(25);
    expect(CITY_BLACK_OPERATION_STAT_DAMAGE).toBe(15);
    expect(CITY_BLACK_OPERATION_POST_SECURITY_BONUS).toBe(40);
  });

  it("B: KNOWN + DEEP success", () => {
    const state = setupBlack(20);
    const result = conductCityBlackOperation(state, "solaris", "dravik", "solaris-echo");
    expect(result.event.type).toBe("city-black-operation-conducted");
    expect(result.event.previousSecurity).toBe(20);
  });

  it("C: 25 pass and 26 fail", () => {
    const pass = setupBlack(25);
    const passResult = conductCityBlackOperation(pass, "solaris", "dravik", "solaris-echo");
    expect(passResult.event.previousSecurity).toBe(25);
    const fail = setupBlack(26);
    expect(() =>
      conductCityBlackOperation(fail, "solaris", "dravik", "solaris-echo"),
    ).toThrow(CitySecurityTooHighError);
  });

  it("D: capital stability -15", () => {
    let state = setupBlack(20);
    const before = getNationStrategicStats(state.world, "dravos").stability;
    const result = conductCityBlackOperation(state, "solaris", "dravik", "solaris-echo");
    expect(result.event.strategicStat).toBe("stability");
    expect(result.event.previousValue).toBe(before);
    expect(result.event.newValue).toBe(Math.max(before - 15, 0));
  });

  it("E: media publicSupport -15", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "deep");
    state = setCitySecurity(state, "raskov", 20);
    const before = getNationStrategicStats(state.world, "dravos").publicSupport;
    const result = conductCityBlackOperation(state, "solaris", "raskov", "solaris-echo");
    expect(result.event.strategicStat).toBe("publicSupport");
    expect(result.event.previousValue).toBe(before);
    expect(result.event.newValue).toBe(Math.max(before - 15, 0));
  });

  it("F: security-hub internalSecurity -15", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "deep");
    state = setCitySecurity(state, "kragen", 20);
    const before = getNationStrategicStats(state.world, "dravos").internalSecurity;
    const result = conductCityBlackOperation(state, "solaris", "kragen", "solaris-echo");
    expect(result.event.strategicStat).toBe("internalSecurity");
    expect(result.event.previousValue).toBe(before);
    expect(result.event.newValue).toBe(Math.max(before - 15, 0));
  });

  it("G: stat clamp 0", () => {
    let state = setupBlack(20);
    state = setNationStrategicStat(state, "dravos", "stability", 10);
    const result = conductCityBlackOperation(state, "solaris", "dravik", "solaris-echo");
    expect(result.event.previousValue).toBe(10);
    expect(result.event.newValue).toBe(0);
  });

  it("H: non-clamped base+40", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "veloria", "known");
    state = setIntelligenceNetworkLevel(state, "solaris", "veloria", "deep");
    state = setCitySecurity(state, "argentis", 10);
    const result = conductCityBlackOperation(state, "solaris", "argentis", "solaris-echo");
    expect(result.event.newSecurity).toBe(90);
  });

  it("I: clamp-to-100 post-security", () => {
    const state = setupBlack(20);
    const result = conductCityBlackOperation(state, "solaris", "dravik", "solaris-echo");
    expect(result.event.newSecurity).toBe(100);
  });

  it("J: exactly 3 AP; unrelated nation AP preserved", () => {
    const state = setupBlack();
    const solarisApBefore = getNationActionPoints(state, "solaris").remaining;
    const arkaniaApBefore = getNationActionPoints(state, "arkania").remaining;
    const result = conductCityBlackOperation(state, "solaris", "dravik", "solaris-echo");
    expect(solarisApBefore - getNationActionPoints(result.state, "solaris").remaining).toBe(3);
    expect(getNationActionPoints(result.state, "arkania").remaining).toBe(arkaniaApBefore);
  });

  it("K: ownership transfer target derivation", () => {
    let state = setupBlack(20);
    state = setRegionOwner(state, "ironvale", "norvia");
    state = setNationVisibility(state, "solaris", "norvia", "known");
    state = setIntelligenceNetworkLevel(state, "solaris", "norvia", "deep");
    const result = conductCityBlackOperation(state, "solaris", "dravik", "solaris-echo");
    expect(result.event.targetNationId).toBe("norvia");
  });

  it("L: LIMITED visibility and ESTABLISHED network rejection", () => {
    const limitedState = (() => {
      let s = createInitialGameState();
      s = setNationVisibility(s, "solaris", "dravos", "limited");
      s = setIntelligenceNetworkLevel(s, "solaris", "dravos", "deep");
      s = setCitySecurity(s, "dravik", 20);
      return s;
    })();
    const apBeforeLimited = getNationActionPoints(limitedState, "solaris").remaining;
    expect(() =>
      conductCityBlackOperation(limitedState, "solaris", "dravik", "solaris-echo"),
    ).toThrow(InsufficientCityVisibilityError);
    expect(getNationActionPoints(limitedState, "solaris").remaining).toBe(apBeforeLimited);
    const establishedState = (() => {
      let s = createInitialGameState();
      s = setNationVisibility(s, "solaris", "dravos", "known");
      s = setIntelligenceNetworkLevel(s, "solaris", "dravos", "established");
      s = setCitySecurity(s, "dravik", 20);
      return s;
    })();
    const apBeforeEstablished = getNationActionPoints(establishedState, "solaris").remaining;
    expect(() =>
      conductCityBlackOperation(establishedState, "solaris", "dravik", "solaris-echo"),
    ).toThrow(InsufficientIntelligenceNetworkError);
    expect(getNationActionPoints(establishedState, "solaris").remaining).toBe(apBeforeEstablished);
  });

  it("M: self-target, wrong-agent, invalid-phase errors", () => {
    const state = setupBlack();
    expect(() =>
      conductCityBlackOperation(state, "solaris", "solara", "solaris-echo"),
    ).toThrow(SelfTargetCityOperationError);
    expect(() =>
      conductCityBlackOperation(state, "solaris", "dravik", "dravos-raven"),
    ).toThrow(AgentOwnershipError);
    let resPhase = createInitialGameState();
    resPhase = { ...resPhase, phase: "resolution" as const };
    expect(() =>
      conductCityBlackOperation(resPhase, "solaris", "dravik", "solaris-echo"),
    ).toThrow(InvalidPhaseError);
  });

  it("N: insufficient AP and unknown city errors", () => {
    let state = setupBlack();
    state = spendActionPoints(state, "solaris", 5);
    const secBefore = getCitySecurity(state.world, "dravik").value;
    const statsBefore = getNationStrategicStats(state.world, "dravos");
    expect(() =>
      conductCityBlackOperation(state, "solaris", "dravik", "solaris-echo"),
    ).toThrow();
    expect(getCitySecurity(state.world, "dravik").value).toBe(secBefore);
    expect(getNationStrategicStats(state.world, "dravos").stability).toBe(statsBefore.stability);
    const fresh = createInitialGameState();
    expect(() =>
      conductCityBlackOperation(fresh, "solaris", "nonexistent" as any, "solaris-echo"),
    ).toThrow(UnknownCityError);
  });

  it("O: unknown actor throws UnknownNationError", () => {
    const state = setupBlack();
    expect(() =>
      conductCityBlackOperation(state, "nonexistent" as any, "dravik", "solaris-echo"),
    ).toThrow(UnknownNationError);
  });
});
