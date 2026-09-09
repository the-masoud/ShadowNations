import { describe, it, expect } from "vitest";
import { createInitialGameState } from "../../src/core/model/gameState.js";
import { setNationVisibility } from "../../src/core/simulation/setNationVisibility.js";
import { setIntelligenceNetworkLevel } from "../../src/core/simulation/setIntelligenceNetworkLevel.js";
import { setCitySecurity } from "../../src/core/simulation/setCitySecurity.js";
import { setRegionOwner } from "../../src/core/simulation/setRegionOwner.js";
import { spendActionPoints } from "../../src/core/simulation/spendActionPoints.js";
import {
  createCityDossierModel,
  getSecurityBand,
} from "../../src/game/ui/cityDossierPresentation.js";
import {
  executeCityDossierCommand,
} from "../../src/game/ui/executeCityDossierCommand.js";
import {
  SelfTargetCityOperationError,
} from "../../src/core/simulation/cityOperationErrors.js";
import { UnknownCityError } from "../../src/core/model/city.js";

describe("cityDossierPresentation", () => {
  it("A: getSecurityBand boundaries", () => {
    expect(getSecurityBand(0)).toBe("BREACHED");
    expect(getSecurityBand(25)).toBe("BREACHED");
    expect(getSecurityBand(26)).toBe("COMPROMISED");
    expect(getSecurityBand(50)).toBe("COMPROMISED");
    expect(getSecurityBand(51)).toBe("GUARDED");
    expect(getSecurityBand(75)).toBe("GUARDED");
    expect(getSecurityBand(76)).toBe("HARDENED");
    expect(getSecurityBand(100)).toBe("HARDENED");
  });

  it("B: own city shows exact current + base + band", () => {
    const state = createInitialGameState();
    const model = createCityDossierModel(state, "solara");
    expect(model.isOwnCity).toBe(true);
    expect(model.showCurrentSecurity).toBe(true);
    expect(model.showBaseSecurity).toBe(true);
    expect(model.showBand).toBe(true);
    expect(model.currentSecurity).toBe(65);
    expect(model.baseSecurity).toBe(65);
    expect(model.securityBand).toBe("GUARDED");
  });

  it("C: foreign unknown shows all hidden", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "unknown");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "none");
    const model = createCityDossierModel(state, "dravik");
    expect(model.isOwnCity).toBe(false);
    expect(model.showCurrentSecurity).toBe(false);
    expect(model.showBaseSecurity).toBe(false);
    expect(model.showBand).toBe(false);
  });

  it("D: foreign limited shows band only", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "limited");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "foothold");
    state = setCitySecurity(state, "dravik", 30);
    const model = createCityDossierModel(state, "dravik");
    expect(model.showCurrentSecurity).toBe(false);
    expect(model.showBaseSecurity).toBe(false);
    expect(model.showBand).toBe(true);
    expect(model.securityBand).toBe("COMPROMISED");
  });

  it("E: foreign known shows exact current + base + band", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "deep");
    state = setCitySecurity(state, "dravik", 30);
    const model = createCityDossierModel(state, "dravik");
    expect(model.showCurrentSecurity).toBe(true);
    expect(model.showBaseSecurity).toBe(true);
    expect(model.showBand).toBe(true);
    expect(model.currentSecurity).toBe(30);
    expect(model.baseSecurity).toBe(80);
    expect(model.securityBand).toBe("COMPROMISED");
  });

  it("F: city/region/controller fields correct", () => {
    const state = createInitialGameState();
    const model = createCityDossierModel(state, "dravik");
    expect(model.cityId).toBe("dravik");
    expect(model.cityName).toBe("Dravik");
    expect(model.cityRole).toBe("capital");
    expect(model.regionId).toBe("ironvale");
    expect(model.regionName).toBe("Ironvale");
    expect(model.regionCode).toBe("IRO");
    expect(model.controllerNationId).toBe("dravos");
    expect(model.controllerNationName).toBe("Dravos");
    expect(model.controllerNationCode).toBe("DRA");
  });

  it("G: 3 role mappings correct", () => {
    const state = createInitialGameState();
    const capital = createCityDossierModel(state, "dravik");
    const media = createCityDossierModel(state, "raskov");
    const security = createCityDossierModel(state, "kragen");
    expect(capital.affectedStat).toBe("stability");
    expect(capital.affectedStatDisplayName).toBe("STABILITY");
    expect(media.affectedStat).toBe("publicSupport");
    expect(media.affectedStatDisplayName).toBe("PUBLIC SUPPORT");
    expect(security.affectedStat).toBe("internalSecurity");
    expect(security.affectedStatDisplayName).toBe("INTERNAL SECURITY");
  });

  it("H: 3 exact Black labels", () => {
    const state = createInitialGameState();
    const capital = createCityDossierModel(state, "dravik");
    const media = createCityDossierModel(state, "raskov");
    const security = createCityDossierModel(state, "kragen");
    expect(capital.operations.find((o) => o.kind === "city-black-operation")!.label).toBe("BLACK OP \u2014 PALACE CRISIS");
    expect(media.operations.find((o) => o.kind === "city-black-operation")!.label).toBe("BLACK OP \u2014 INFORMATION BLACKOUT");
    expect(security.operations.find((o) => o.kind === "city-black-operation")!.label).toBe("BLACK OP \u2014 DIRECTORATE BREACH");
  });

  it("I: player agents only", () => {
    const state = createInitialGameState();
    const model = createCityDossierModel(state, "dravik");
    expect(model.agents.length).toBe(2);
    expect(model.agents[0].agentId).toBe("solaris-echo");
    expect(model.agents[1].agentId).toBe("solaris-orbit");
  });

  it("J: own-city operations all disabled", () => {
    const state = createInitialGameState();
    const model = createCityDossierModel(state, "solara");
    for (const op of model.operations) {
      expect(op.enabled).toBe(false);
      expect(op.disabledReason).toBe("OWN CITY");
    }
  });

  it("K: infiltrate disabled rules", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "unknown");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "established");
    const model = createCityDossierModel(state, "dravik");
    const inf = model.operations.find((o) => o.kind === "infiltrate-city")!;
    expect(inf.enabled).toBe(false);
    expect(inf.disabledReason).toBe("REQUIRES LIMITED INTEL");
    let state2 = createInitialGameState();
    state2 = setNationVisibility(state2, "solaris", "dravos", "known");
    state2 = setIntelligenceNetworkLevel(state2, "solaris", "dravos", "none");
    const model2 = createCityDossierModel(state2, "dravik");
    const inf2 = model2.operations.find((o) => o.kind === "infiltrate-city")!;
    expect(inf2.enabled).toBe(false);
    expect(inf2.disabledReason).toBe("REQUIRES FOOTHOLD NETWORK");
  });

  it("L: urban enable/disable + 50/51", () => {
    let state50 = createInitialGameState();
    state50 = setNationVisibility(state50, "solaris", "dravos", "known");
    state50 = setIntelligenceNetworkLevel(state50, "solaris", "dravos", "established");
    state50 = setCitySecurity(state50, "dravik", 50);
    const model50 = createCityDossierModel(state50, "dravik");
    expect(model50.operations.find((o) => o.kind === "urban-disruption")!.enabled).toBe(true);
    let state51 = createInitialGameState();
    state51 = setNationVisibility(state51, "solaris", "dravos", "known");
    state51 = setIntelligenceNetworkLevel(state51, "solaris", "dravos", "established");
    state51 = setCitySecurity(state51, "dravik", 51);
    const model51 = createCityDossierModel(state51, "dravik");
    const urban = model51.operations.find((o) => o.kind === "urban-disruption")!;
    expect(urban.enabled).toBe(false);
    expect(urban.disabledReason).toBe("CITY SECURITY ABOVE 50");
  });

  it("M: black enable/disable + 25/26", () => {
    let state25 = createInitialGameState();
    state25 = setNationVisibility(state25, "solaris", "dravos", "known");
    state25 = setIntelligenceNetworkLevel(state25, "solaris", "dravos", "deep");
    state25 = setCitySecurity(state25, "dravik", 25);
    const model25 = createCityDossierModel(state25, "dravik");
    expect(model25.operations.find((o) => o.kind === "city-black-operation")!.enabled).toBe(true);
    let state26 = createInitialGameState();
    state26 = setNationVisibility(state26, "solaris", "dravos", "known");
    state26 = setIntelligenceNetworkLevel(state26, "solaris", "dravos", "deep");
    state26 = setCitySecurity(state26, "dravik", 26);
    const model26 = createCityDossierModel(state26, "dravik");
    const black = model26.operations.find((o) => o.kind === "city-black-operation")!;
    expect(black.enabled).toBe(false);
    expect(black.disabledReason).toBe("CITY SECURITY ABOVE 25");
  });

  it("N: AP disabled reason", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "deep");
    state = setCitySecurity(state, "dravik", 20);
    state = spendActionPoints(state, "solaris", 5);
    const model = createCityDossierModel(state, "dravik");
    const black = model.operations.find((o) => o.kind === "city-black-operation")!;
    expect(black.enabled).toBe(false);
    expect(black.disabledReason).toBe("INSUFFICIENT AP");
  });

  it("O: phase disabled reason", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "deep");
    state = setCitySecurity(state, "dravik", 20);
    state = { ...state, phase: "resolution" as const };
    const model = createCityDossierModel(state, "dravik");
    const inf = model.operations.find((o) => o.kind === "infiltrate-city")!;
    expect(inf.enabled).toBe(false);
    expect(inf.disabledReason).toBe("NOT IN PLANNING PHASE");
  });

  it("P: exact targetEffect strings", () => {
    const state = createInitialGameState();
    const model = createCityDossierModel(state, "dravik");
    const inf = model.operations.find((o) => o.kind === "infiltrate-city")!;
    const urban = model.operations.find((o) => o.kind === "urban-disruption")!;
    const black = model.operations.find((o) => o.kind === "city-black-operation")!;
    expect(inf.targetEffect).toBe("CITY SECURITY -25");
    expect(urban.targetEffect).toBe("STABILITY -8; SECURITY -> BASE +25");
    expect(black.targetEffect).toBe("STABILITY -15; SECURITY -> BASE +40");
  });

  it("Q: ownership transfer updates controller", () => {
    let state = createInitialGameState();
    state = setRegionOwner(state, "ironvale", "norvia");
    const model = createCityDossierModel(state, "dravik");
    expect(model.controllerNationId).toBe("norvia");
    expect(model.controllerNationName).toBe("Norvia");
    expect(model.controllerNationCode).toBe("NOR");
  });

  it("R: deterministic immutable presentation", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "deep");
    state = setCitySecurity(state, "dravik", 30);
    const a = createCityDossierModel(state, "dravik");
    const b = createCityDossierModel(state, "dravik");
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  it("S: urban disabled when network foothold or limited visibility", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "foothold");
    const model = createCityDossierModel(state, "dravik");
    expect(model.operations.find((o) => o.kind === "urban-disruption")!.disabledReason).toBe("REQUIRES ESTABLISHED NETWORK");
    let state2 = createInitialGameState();
    state2 = setNationVisibility(state2, "solaris", "dravos", "limited");
    state2 = setIntelligenceNetworkLevel(state2, "solaris", "dravos", "established");
    const model2 = createCityDossierModel(state2, "dravik");
    expect(model2.operations.find((o) => o.kind === "urban-disruption")!.disabledReason).toBe("REQUIRES KNOWN INTEL");
  });

  it("T: black disabled when limited visibility or established network", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "limited");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "deep");
    const model = createCityDossierModel(state, "dravik");
    expect(model.operations.find((o) => o.kind === "city-black-operation")!.disabledReason).toBe("REQUIRES KNOWN INTEL");
    let state2 = createInitialGameState();
    state2 = setNationVisibility(state2, "solaris", "dravos", "known");
    state2 = setIntelligenceNetworkLevel(state2, "solaris", "dravos", "established");
    const model2 = createCityDossierModel(state2, "dravik");
    expect(model2.operations.find((o) => o.kind === "city-black-operation")!.disabledReason).toBe("REQUIRES DEEP NETWORK");
  });

  it("U: infiltrate enabled when limited + foothold", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "limited");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "foothold");
    state = setCitySecurity(state, "dravik", 60);
    const model = createCityDossierModel(state, "dravik");
    const inf = model.operations.find((o) => o.kind === "infiltrate-city")!;
    expect(inf.enabled).toBe(true);
    expect(inf.disabledReason).toBe("");
  });

  it("V: urban enabled when known + established", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "established");
    state = setCitySecurity(state, "dravik", 40);
    const model = createCityDossierModel(state, "dravik");
    const urban = model.operations.find((o) => o.kind === "urban-disruption")!;
    expect(urban.enabled).toBe(true);
    expect(urban.disabledReason).toBe("");
  });

  it("W: black enabled when known + deep", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "deep");
    state = setCitySecurity(state, "dravik", 20);
    const model = createCityDossierModel(state, "dravik");
    const black = model.operations.find((o) => o.kind === "city-black-operation")!;
    expect(black.enabled).toBe(true);
    expect(black.disabledReason).toBe("");
  });

  it("X: target nation stats displayed", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "deep");
    const model = createCityDossierModel(state, "dravik");
    expect(model.targetNationStability).toBe(78);
    expect(model.targetNationPublicSupport).toBe(55);
    expect(model.targetNationInternalSecurity).toBe(82);
  });
});

describe("executeCityDossierCommand", () => {
  it("U: infiltrate dispatches correctly", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "established");
    state = setCitySecurity(state, "dravik", 60);
    const result = executeCityDossierCommand(state, {
      kind: "infiltrate-city",
      cityId: "dravik",
      agentId: "solaris-echo",
    });
    expect(result.event.type).toBe("city-infiltrated");
  });

  it("V: urban dispatches correctly", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "established");
    state = setCitySecurity(state, "dravik", 40);
    const result = executeCityDossierCommand(state, {
      kind: "urban-disruption",
      cityId: "dravik",
      agentId: "solaris-echo",
    });
    expect(result.event.type).toBe("urban-disruption-conducted");
  });

  it("W: black dispatches correctly", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "deep");
    state = setCitySecurity(state, "dravik", 20);
    const result = executeCityDossierCommand(state, {
      kind: "city-black-operation",
      cityId: "dravik",
      agentId: "solaris-echo",
    });
    expect(result.event.type).toBe("city-black-operation-conducted");
  });

  it("X: actor derives from playerNationId", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "established");
    state = setCitySecurity(state, "dravik", 40);
    const result = executeCityDossierCommand(state, {
      kind: "urban-disruption",
      cityId: "dravik",
      agentId: "solaris-echo",
    });
    expect("actorNationId" in result.event && result.event.actorNationId).toBe("solaris");
  });

  it("Y: command has cityId not targetNationId", () => {
    const cmd = {
      kind: "infiltrate-city" as const,
      cityId: "dravik",
      agentId: "solaris-echo",
    };
    expect(cmd).toHaveProperty("cityId");
    expect(cmd).not.toHaveProperty("targetNationId");
  });

  it("Z: core errors propagate and unknown city throws", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "known");
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "established");
    expect(() =>
      executeCityDossierCommand(state, {
        kind: "infiltrate-city",
        cityId: "solara",
        agentId: "solaris-echo",
      }),
    ).toThrow(SelfTargetCityOperationError);
    expect(() =>
      executeCityDossierCommand(state, {
        kind: "infiltrate-city",
        cityId: "nonexistent" as any,
        agentId: "solaris-echo",
      }),
    ).toThrow(UnknownCityError);
  });
});
