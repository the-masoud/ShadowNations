import { describe, it, expect } from "vitest";
import {
  conductCovertSabotage,
  COVERT_SABOTAGE_AP_COST,
  InvalidCovertSabotageObjectiveError,
  MinimumCovertSabotageTargetStatError,
} from "../../src/core/simulation/conductCovertSabotage";
import { createInitialGameState } from "../../src/core/model/gameState";
import { getNationStrategicStats } from "../../src/core/model/nationStrategicStats";
import { getNationInfluence } from "../../src/core/model/nationInfluence";
import { getDiplomaticRelationship } from "../../src/core/model/diplomaticRelationship";
import { UnknownNationError } from "../../src/core/model/worldState";
import { UnknownIntelligenceAgentError } from "../../src/core/model/intelligenceAgent";
import { AgentOwnershipError } from "../../src/core/simulation/intelligenceErrors";
import { SelfTargetEspionageOperationError } from "../../src/core/simulation/intelligenceErrors";
import { MissingIntelligenceNetworkError } from "../../src/core/model/intelligenceState";
import { InsufficientIntelligenceNetworkError } from "../../src/core/simulation/intelligenceErrors";
import { MissingNationStrategicStatsError } from "../../src/core/model/nationStrategicStats";
import { InsufficientActionPointsError } from "../../src/core/simulation/spendActionPoints";
import { validateGameState } from "../../src/core/simulation/validateGameState";
import { setNationStrategicStat } from "../../src/core/simulation/setNationStrategicStat";
import { setIntelligenceNetworkLevel } from "../../src/core/simulation/setIntelligenceNetworkLevel";
import { resolveTurn } from "../../src/core/simulation/resolveTurn";

function validState() {
  return createInitialGameState();
}

function stateWithEstablishedNetwork(observer: string, target: string) {
  let state = validState();
  state = setIntelligenceNetworkLevel(state, observer, target, "foothold");
  state = setIntelligenceNetworkLevel(state, observer, target, "established");
  return state;
}

function stateWithDeepNetwork(observer: string, target: string) {
  let state = stateWithEstablishedNetwork(observer, target);
  state = setIntelligenceNetworkLevel(state, observer, target, "deep");
  return state;
}

describe("1. ESTABLISHED NETWORK SUCCEEDS", () => {
  it("established network succeeds for internal-security", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    expect(() =>
      conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "internal-security"),
    ).not.toThrow();
  });

  it("established network succeeds for public-support", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    expect(() =>
      conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "public-support"),
    ).not.toThrow();
  });
});

describe("2. DEEP NETWORK SUCCEEDS", () => {
  it("deep network succeeds for internal-security", () => {
    let state = stateWithDeepNetwork("solaris", "norvia");
    expect(() =>
      conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "internal-security"),
    ).not.toThrow();
  });

  it("deep network succeeds for public-support", () => {
    let state = stateWithDeepNetwork("solaris", "norvia");
    expect(() =>
      conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "public-support"),
    ).not.toThrow();
  });
});

describe("3. NONE NETWORK FAILS", () => {
  it("none network fails InsufficientIntelligenceNetworkError", () => {
    const state = validState();
    expect(() =>
      conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "internal-security"),
    ).toThrow(InsufficientIntelligenceNetworkError);
  });
});

describe("4. FOOTHOLD NETWORK FAILS", () => {
  it("foothold network fails InsufficientIntelligenceNetworkError", () => {
    let state = validState();
    state = setIntelligenceNetworkLevel(state, "solaris", "norvia", "foothold");
    expect(() =>
      conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "internal-security"),
    ).toThrow(InsufficientIntelligenceNetworkError);
  });
});

describe("5. INTERNAL-SECURITY REDUCES BY 10", () => {
  it("internal-security reduces internalSecurity by exactly 10", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const before = getNationStrategicStats(state.world, "norvia").internalSecurity;
    const { state: next } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "internal-security",
    );
    const after = getNationStrategicStats(next.world, "norvia").internalSecurity;
    expect(after).toBe(before - 10);
  });
});

describe("6. INTERNAL-SECURITY BELOW 10 CAPS AT 0", () => {
  it("internalSecurity 7 -> 0", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    state = setNationStrategicStat(state, "norvia", "internalSecurity", 7);
    const { state: next } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "internal-security",
    );
    expect(getNationStrategicStats(next.world, "norvia").internalSecurity).toBe(0);
  });

  it("internalSecurity 5 -> 0", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    state = setNationStrategicStat(state, "norvia", "internalSecurity", 5);
    const { state: next } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "internal-security",
    );
    expect(getNationStrategicStats(next.world, "norvia").internalSecurity).toBe(0);
  });
});

describe("7. INTERNAL-SECURITY ALREADY 0 FAILS", () => {
  it("internalSecurity 0 fails MinimumCovertSabotageTargetStatError", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    state = setNationStrategicStat(state, "norvia", "internalSecurity", 0);
    expect(() =>
      conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "internal-security"),
    ).toThrow(MinimumCovertSabotageTargetStatError);
  });

  it("internalSecurity 0 failure spends no AP", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    state = setNationStrategicStat(state, "norvia", "internalSecurity", 0);
    const apBefore = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    try {
      conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "internal-security");
    } catch {
      // expected
    }
    const apAfter = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    expect(apAfter).toBe(apBefore);
  });
});

describe("8. PUBLIC-SUPPORT REDUCES BY 10", () => {
  it("public-support reduces publicSupport by exactly 10", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const before = getNationStrategicStats(state.world, "norvia").publicSupport;
    const { state: next } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "public-support",
    );
    const after = getNationStrategicStats(next.world, "norvia").publicSupport;
    expect(after).toBe(before - 10);
  });
});

describe("9. PUBLIC-SUPPORT BELOW 10 CAPS AT 0", () => {
  it("publicSupport 7 -> 0", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    state = setNationStrategicStat(state, "norvia", "publicSupport", 7);
    const { state: next } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "public-support",
    );
    expect(getNationStrategicStats(next.world, "norvia").publicSupport).toBe(0);
  });

  it("publicSupport 5 -> 0", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    state = setNationStrategicStat(state, "norvia", "publicSupport", 5);
    const { state: next } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "public-support",
    );
    expect(getNationStrategicStats(next.world, "norvia").publicSupport).toBe(0);
  });
});

describe("10. PUBLIC-SUPPORT ALREADY 0 FAILS", () => {
  it("publicSupport 0 fails MinimumCovertSabotageTargetStatError", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    state = setNationStrategicStat(state, "norvia", "publicSupport", 0);
    expect(() =>
      conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "public-support"),
    ).toThrow(MinimumCovertSabotageTargetStatError);
  });

  it("publicSupport 0 failure spends no AP", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    state = setNationStrategicStat(state, "norvia", "publicSupport", 0);
    const apBefore = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    try {
      conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "public-support");
    } catch {
      // expected
    }
    const apAfter = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    expect(apAfter).toBe(apBefore);
  });
});

describe("11. EXACT AP COST = 2", () => {
  it("AP cost is exactly 2", () => {
    expect(COVERT_SABOTAGE_AP_COST).toBe(2);
  });

  it("event.actionPointCost is 2 for internal-security", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const { event } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "internal-security",
    );
    expect(event.actionPointCost).toBe(2);
  });

  it("event.actionPointCost is 2 for public-support", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const { event } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "public-support",
    );
    expect(event.actionPointCost).toBe(2);
  });
});

describe("12. EXACT INTERNAL-SECURITY EVENT", () => {
  it("exact event for internal-security", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const { event } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "internal-security",
    );
    expect(event).toEqual({
      type: "covert-sabotage-conducted",
      turn: state.turn,
      actorNationId: "solaris",
      targetNationId: "norvia",
      agentId: "solaris-echo",
      objective: "internal-security",
      previousValue: 52,
      newValue: 42,
      actionPointCost: COVERT_SABOTAGE_AP_COST,
    });
  });
});

describe("13. EXACT PUBLIC-SUPPORT EVENT", () => {
  it("exact event for public-support", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const { event } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "public-support",
    );
    expect(event).toEqual({
      type: "covert-sabotage-conducted",
      turn: state.turn,
      actorNationId: "solaris",
      targetNationId: "norvia",
      agentId: "solaris-echo",
      objective: "public-support",
      previousValue: 74,
      newValue: 64,
      actionPointCost: COVERT_SABOTAGE_AP_COST,
    });
  });
});

describe("14. UNKNOWN ACTOR FAILS", () => {
  it("unknown actor fails UnknownNationError", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    expect(() =>
      conductCovertSabotage(state, "nonexistent", "norvia", "solaris-echo", "internal-security"),
    ).toThrow(UnknownNationError);
  });
});

describe("15. UNKNOWN TARGET FAILS", () => {
  it("unknown target fails UnknownNationError", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    expect(() =>
      conductCovertSabotage(state, "solaris", "nonexistent", "solaris-echo", "internal-security"),
    ).toThrow(UnknownNationError);
  });
});

describe("16. SELF TARGET FAILS", () => {
  it("self target fails SelfTargetEspionageOperationError", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    expect(() =>
      conductCovertSabotage(state, "solaris", "solaris", "solaris-echo", "internal-security"),
    ).toThrow(SelfTargetEspionageOperationError);
  });

  it("self target spends no AP", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const apBefore = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    try {
      conductCovertSabotage(state, "solaris", "solaris", "solaris-echo", "internal-security");
    } catch {
      // expected
    }
    const apAfter = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    expect(apAfter).toBe(apBefore);
  });
});

describe("17. UNKNOWN AGENT FAILS", () => {
  it("unknown agent fails UnknownIntelligenceAgentError", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    expect(() =>
      conductCovertSabotage(state, "solaris", "norvia", "nonexistent", "internal-security"),
    ).toThrow(UnknownIntelligenceAgentError);
  });
});

describe("18. WRONG AGENT OWNER FAILS", () => {
  it("wrong agent owner fails AgentOwnershipError", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    expect(() =>
      conductCovertSabotage(state, "solaris", "norvia", "dravos-raven", "internal-security"),
    ).toThrow(AgentOwnershipError);
  });

  it("wrong agent owner spends no AP", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const apBefore = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    try {
      conductCovertSabotage(state, "solaris", "norvia", "dravos-raven", "internal-security");
    } catch {
      // expected
    }
    const apAfter = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    expect(apAfter).toBe(apBefore);
  });
});

describe("19. MISSING NETWORK FAILS", () => {
  it("missing network fails MissingIntelligenceNetworkError", () => {
    let state = validState();
    const intelligence = {
      ...state.intelligence,
      networks: state.intelligence.networks.filter(
        (n) => !(n.observerNationId === "solaris" && n.targetNationId === "norvia"),
      ),
    };
    const badState = { ...state, intelligence };
    expect(() =>
      conductCovertSabotage(badState, "solaris", "norvia", "solaris-echo", "internal-security"),
    ).toThrow(MissingIntelligenceNetworkError);
  });
});

describe("20. MISSING STRATEGIC STATS FAILS", () => {
  it("missing strategic stats fails MissingNationStrategicStatsError", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const world = {
      ...state.world,
      nationStrategicStats: state.world.nationStrategicStats.filter(
        (s) => s.nationId !== "norvia",
      ),
    };
    const badState = { ...state, world };
    expect(() =>
      conductCovertSabotage(badState, "solaris", "norvia", "solaris-echo", "internal-security"),
    ).toThrow(MissingNationStrategicStatsError);
  });
});

describe("21. INVALID RUNTIME OBJECTIVE FAILS", () => {
  it("invalid objective fails InvalidCovertSabotageObjectiveError", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    expect(() =>
      conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "stability" as any),
    ).toThrow(InvalidCovertSabotageObjectiveError);
  });

  it("empty string objective fails", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    expect(() =>
      conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "" as any),
    ).toThrow(InvalidCovertSabotageObjectiveError);
  });

  it("invalid objective spends no AP", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const apBefore = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    try {
      conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "stability" as any);
    } catch {
      // expected
    }
    const apAfter = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    expect(apAfter).toBe(apBefore);
  });

  it("objective validation precedes validateGameState (step 8 before step 9)", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const world = {
      ...state.world,
      nationStrategicStats: state.world.nationStrategicStats.filter(
        (s) => s.nationId !== "solaris",
      ),
    };
    const badState = { ...state, world };
    expect(() =>
      conductCovertSabotage(badState, "solaris", "norvia", "solaris-echo", "stability" as any),
    ).toThrow(InvalidCovertSabotageObjectiveError);
  });
});

describe("22. INVALID PHASE FAILS", () => {
  it("resolution phase fails InvalidPhaseError", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const badState = { ...state, phase: "resolution" as const };
    expect(() =>
      conductCovertSabotage(badState, "solaris", "norvia", "solaris-echo", "internal-security"),
    ).toThrow();
  });

  it("resolution phase spends no AP", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const badState = { ...state, phase: "resolution" as const };
    const apBefore = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    try {
      conductCovertSabotage(badState, "solaris", "norvia", "solaris-echo", "internal-security");
    } catch {
      // expected
    }
    const apAfter = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    expect(apAfter).toBe(apBefore);
  });
});

describe("23. INSUFFICIENT AP FAILS", () => {
  it("insufficient AP fails InsufficientActionPointsError", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    state = conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "internal-security").state;
    state = conductCovertSabotage(state, "solaris", "norvia", "solaris-orbit", "internal-security").state;
    state = conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "public-support").state;
    expect(state.planning.actionPoints.find((a) => a.nationId === "solaris")!.remaining).toBe(0);
    expect(() =>
      conductCovertSabotage(state, "solaris", "norvia", "solaris-orbit", "internal-security"),
    ).toThrow(InsufficientActionPointsError);
  });

  it("insufficient AP failure preserves original state", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    state = conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "internal-security").state;
    state = conductCovertSabotage(state, "solaris", "norvia", "solaris-orbit", "internal-security").state;
    state = conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "public-support").state;
    const snapshot = JSON.parse(JSON.stringify(state));
    try {
      conductCovertSabotage(state, "solaris", "norvia", "solaris-orbit", "internal-security");
    } catch {
      // expected
    }
    expect(state).toEqual(snapshot);
  });
});

describe("24. REPRESENTATIVE FAILURES ARE ATOMIC", () => {
  it("self target preserves original state", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const snapshot = JSON.parse(JSON.stringify(state));
    try {
      conductCovertSabotage(state, "solaris", "solaris", "solaris-echo", "internal-security");
    } catch {
      // expected
    }
    expect(state).toEqual(snapshot);
  });

  it("wrong agent preserves original state", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const snapshot = JSON.parse(JSON.stringify(state));
    try {
      conductCovertSabotage(state, "solaris", "norvia", "dravos-raven", "internal-security");
    } catch {
      // expected
    }
    expect(state).toEqual(snapshot);
  });

  it("foothold network preserves original state", () => {
    let state = validState();
    state = setIntelligenceNetworkLevel(state, "solaris", "norvia", "foothold");
    const snapshot = JSON.parse(JSON.stringify(state));
    try {
      conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "internal-security");
    } catch {
      // expected
    }
    expect(state).toEqual(snapshot);
  });

  it("invalid objective preserves original state", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const snapshot = JSON.parse(JSON.stringify(state));
    try {
      conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "stability" as any);
    } catch {
      // expected
    }
    expect(state).toEqual(snapshot);
  });
});

describe("25. STABILITY UNCHANGED", () => {
  it("stability unchanged for internal-security objective", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const before = getNationStrategicStats(state.world, "norvia").stability;
    const { state: next } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "internal-security",
    );
    expect(getNationStrategicStats(next.world, "norvia").stability).toBe(before);
  });

  it("stability unchanged for public-support objective", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const before = getNationStrategicStats(state.world, "norvia").stability;
    const { state: next } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "public-support",
    );
    expect(getNationStrategicStats(next.world, "norvia").stability).toBe(before);
  });
});

describe("26. INFLUENCE UNCHANGED", () => {
  it("influence unchanged for internal-security", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const before = getNationInfluence(state.world, "solaris", "norvia").value;
    const { state: next } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "internal-security",
    );
    expect(getNationInfluence(next.world, "solaris", "norvia").value).toBe(before);
  });

  it("influence unchanged for public-support", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const before = getNationInfluence(state.world, "solaris", "norvia").value;
    const { state: next } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "public-support",
    );
    expect(getNationInfluence(next.world, "solaris", "norvia").value).toBe(before);
  });
});

describe("27. DIPLOMACY UNCHANGED", () => {
  it("diplomacy unchanged for internal-security", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const before = getDiplomaticRelationship(state.world, "solaris", "norvia").status;
    const { state: next } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "internal-security",
    );
    expect(getDiplomaticRelationship(next.world, "solaris", "norvia").status).toBe(before);
  });

  it("diplomacy unchanged for public-support", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const before = getDiplomaticRelationship(state.world, "solaris", "norvia").status;
    const { state: next } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "public-support",
    );
    expect(getDiplomaticRelationship(next.world, "solaris", "norvia").status).toBe(before);
  });
});

describe("28. NETWORK UNCHANGED", () => {
  it("network level unchanged after internal-security sabotage", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const { state: next } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "internal-security",
    );
    const network = next.intelligence.networks.find(
      (n) => n.observerNationId === "solaris" && n.targetNationId === "norvia",
    );
    expect(network!.level).toBe("established");
  });

  it("network level unchanged after public-support sabotage", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const { state: next } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "public-support",
    );
    const network = next.intelligence.networks.find(
      (n) => n.observerNationId === "solaris" && n.targetNationId === "norvia",
    );
    expect(network!.level).toBe("established");
  });
});

describe("29. AWARENESS UNCHANGED", () => {
  it("counterintelligence awareness unchanged", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const before = state.intelligence.counterintelligenceAwareness.find(
      (a) => a.defenderNationId === "norvia" && a.intruderNationId === "solaris",
    )!.level;
    const { state: next } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "internal-security",
    );
    const after = next.intelligence.counterintelligenceAwareness.find(
      (a) => a.defenderNationId === "norvia" && a.intruderNationId === "solaris",
    )!.level;
    expect(after).toBe(before);
  });
});

describe("30. AGENTS/ASSETS UNCHANGED", () => {
  it("agents unchanged", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const { state: next } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "internal-security",
    );
    expect(next.intelligence.agents).toEqual(state.intelligence.agents);
  });

  it("assets unchanged", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const { state: next } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "internal-security",
    );
    expect(next.intelligence.assets).toEqual(state.intelligence.assets);
  });
});

describe("31. REGION OWNERSHIP UNCHANGED", () => {
  it("region ownership unchanged", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const { state: next } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "internal-security",
    );
    expect(next.world.regionOwnership).toEqual(state.world.regionOwnership);
  });
});

describe("32. EVENT DETERMINISM", () => {
  it("repeated internal-security sabotage produces deeply equal events from equal states", () => {
    const a = stateWithEstablishedNetwork("solaris", "norvia");
    const b = stateWithEstablishedNetwork("solaris", "norvia");
    const eventA = conductCovertSabotage(a, "solaris", "norvia", "solaris-echo", "internal-security").event;
    const eventB = conductCovertSabotage(b, "solaris", "norvia", "solaris-echo", "internal-security").event;
    expect(eventA).toEqual(eventB);
  });

  it("repeated public-support sabotage produces deeply equal events from equal states", () => {
    const a = stateWithEstablishedNetwork("solaris", "norvia");
    const b = stateWithEstablishedNetwork("solaris", "norvia");
    const eventA = conductCovertSabotage(a, "solaris", "norvia", "solaris-echo", "public-support").event;
    const eventB = conductCovertSabotage(b, "solaris", "norvia", "solaris-echo", "public-support").event;
    expect(eventA).toEqual(eventB);
  });
});

describe("33. SABOTAGE EFFECT PERSISTS ACROSS RESOLVETURN", () => {
  it("internal-security damage persists after resolveTurn", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    state = conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "internal-security").state;
    const { state: next } = resolveTurn(state, []);
    expect(getNationStrategicStats(next.world, "norvia").internalSecurity).toBe(42);
  });

  it("public-support damage persists after resolveTurn", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    state = conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "public-support").state;
    const { state: next } = resolveTurn(state, []);
    expect(getNationStrategicStats(next.world, "norvia").publicSupport).toBe(64);
  });
});

describe("34. AP RESETS NORMALLY AFTER RESOLVETURN", () => {
  it("AP resets to 6 after resolveTurn", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    state = conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "internal-security").state;
    state = conductCovertSabotage(state, "solaris", "norvia", "solaris-orbit", "internal-security").state;
    expect(state.planning.actionPoints.find((a) => a.nationId === "solaris")!.remaining).toBe(2);
    const { state: next } = resolveTurn(state, []);
    expect(next.planning.actionPoints.find((a) => a.nationId === "solaris")!.remaining).toBe(6);
  });
});

describe("35. ALL G0-G2.4 TESTS CONTINUE PASSING", () => {
  it("validation passes on initial state", () => {
    const state = validState();
    expect(() => validateGameState(state)).not.toThrow();
  });

  it("validation passes after sabotage", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    state = conductCovertSabotage(state, "solaris", "norvia", "solaris-echo", "internal-security").state;
    expect(() => validateGameState(state)).not.toThrow();
  });

  it("world state integrity preserved", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const { state: next } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "internal-security",
    );
    expect(next.world.nationStrategicStats).toHaveLength(6);
    expect(next.world.nationInfluence).toHaveLength(30);
    expect(next.world.diplomaticRelationships).toHaveLength(15);
    expect(next.world.regionOwnership).toHaveLength(18);
  });

  it("intelligence state integrity preserved", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const { state: next } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "internal-security",
    );
    expect(next.intelligence.networks).toHaveLength(30);
    expect(next.intelligence.agents).toHaveLength(12);
  });
});

describe("BONUS: CROSS-NATION SCENARIOS", () => {
  it("Dravos -> Arkania internal-security", () => {
    let state = stateWithEstablishedNetwork("dravos", "arkania");
    const { state: next } = conductCovertSabotage(
      state, "dravos", "arkania", "dravos-raven", "internal-security",
    );
    expect(getNationStrategicStats(next.world, "arkania").internalSecurity).toBe(48);
  });

  it("Norvia -> Veloria public-support", () => {
    let state = stateWithEstablishedNetwork("norvia", "veloria");
    const { state: next } = conductCovertSabotage(
      state, "norvia", "veloria", "norvia-frost", "public-support",
    );
    expect(getNationStrategicStats(next.world, "veloria").publicSupport).toBe(59);
  });

  it("event turn matches state turn", () => {
    let state = stateWithEstablishedNetwork("solaris", "norvia");
    const { event } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "internal-security",
    );
    expect(event.turn).toBe(state.turn);
  });
});
