import { describe, it, expect } from "vitest";
import {
  conductCovertSabotage,
} from "../../src/core/simulation/conductCovertSabotage";
import {
  startProxyConflict,
  START_PROXY_CONFLICT_AP_COST,
  PROXY_CONFLICT_MINIMUM_INFLUENCE,
  PROXY_CONFLICT_MAXIMUM_HOST_STABILITY,
} from "../../src/core/simulation/startProxyConflict";
import {
  escalateProxyConflict,
  ESCALATE_PROXY_CONFLICT_AP_COST,
} from "../../src/core/simulation/escalateProxyConflict";
import { addProxyConflict } from "../../src/core/simulation/addProxyConflict";
import { setProxyConflictIntensity } from "../../src/core/simulation/setProxyConflictIntensity";
import {
  UnknownProxyConflictError,
  InvalidProxyConflictIdError,
  InvalidProxyConflictParticipantsError,
  DuplicateProxyConflictIdError,
  DuplicateProxyConflictError,
  InvalidProxyConflictIntensityError,
  ProxyConflictParticipationError,
  MaximumProxyConflictIntensityError,
  InsufficientProxyConflictInfluenceError,
  NonHostileProxyConflictRivalryError,
  HostTooStableForProxyConflictError,
} from "../../src/core/simulation/proxyConflictErrors";
import { createInitialGameState } from "../../src/core/model/gameState";
import { createInitialWorldState } from "../../src/core/model/worldState";
import { UnknownNationError } from "../../src/core/model/worldState";
import { getNationStrategicStats } from "../../src/core/model/nationStrategicStats";
import { getNationInfluence } from "../../src/core/model/nationInfluence";
import { getDiplomaticRelationship } from "../../src/core/model/diplomaticRelationship";
import { setNationStrategicStat } from "../../src/core/simulation/setNationStrategicStat";
import { setNationInfluence } from "../../src/core/simulation/setNationInfluence";
import { setDiplomaticStatus } from "../../src/core/simulation/setDiplomaticStatus";
import { setIntelligenceNetworkLevel } from "../../src/core/simulation/setIntelligenceNetworkLevel";
import { validateGameState } from "../../src/core/simulation/validateGameState";
import { InsufficientActionPointsError } from "../../src/core/simulation/spendActionPoints";
import { resolveTurn } from "../../src/core/simulation/resolveTurn";

function validState() {
  return createInitialGameState();
}

// ============================================================
// MODEL / WORLD STATE TESTS
// ============================================================

describe("MODEL: INITIAL PROXY CONFLICTS", () => {
  it("initial proxyConflicts length = 0", () => {
    const world = createInitialWorldState();
    expect(world.proxyConflicts).toHaveLength(0);
  });

  it("separately created initial worlds have different proxyConflicts arrays", () => {
    const a = createInitialWorldState();
    const b = createInitialWorldState();
    expect(a.proxyConflicts).not.toBe(b.proxyConflicts);
  });

  it("empty collection validates", () => {
    const state = createInitialGameState();
    expect(() => validateGameState(state)).not.toThrow();
  });
});

describe("MODEL: PROXY CONFLICT VALIDATION", () => {
  it("blank ID fails", () => {
    const world = {
      ...createInitialWorldState(),
      proxyConflicts: [{
        id: "",
        hostNationId: "norvia",
        nationAId: "solaris",
        nationBId: "dravos",
        intensity: "low" as const,
      }],
    };
    expect(() => validateGameState({ turn: 1, phase: "planning" as const, playerNationId: "solaris", world, planning: { actionPoints: [] }, intelligence: { nationVisibility: [], networks: [], agents: [], assets: [], counterintelligenceAwareness: [], doubleAgents: [] } })).toThrow();
  });

  it("whitespace-only ID fails", () => {
    const world = {
      ...createInitialWorldState(),
      proxyConflicts: [{
        id: "   ",
        hostNationId: "norvia",
        nationAId: "solaris",
        nationBId: "dravos",
        intensity: "low" as const,
      }],
    };
    expect(() => validateGameState({ turn: 1, phase: "planning" as const, playerNationId: "solaris", world, planning: { actionPoints: [] }, intelligence: { nationVisibility: [], networks: [], agents: [], assets: [], counterintelligenceAwareness: [], doubleAgents: [] } })).toThrow();
  });

  it("duplicate ID fails", () => {
    const world = {
      ...createInitialWorldState(),
      proxyConflicts: [
        { id: "proxy-001", hostNationId: "norvia", nationAId: "solaris", nationBId: "dravos", intensity: "low" as const },
        { id: "proxy-001", hostNationId: "veloria", nationAId: "solaris", nationBId: "dravos", intensity: "low" as const },
      ],
    };
    expect(() => validateGameState({ turn: 1, phase: "planning" as const, playerNationId: "solaris", world, planning: { actionPoints: [] }, intelligence: { nationVisibility: [], networks: [], agents: [], assets: [], counterintelligenceAwareness: [], doubleAgents: [] } })).toThrow();
  });

  it("duplicate host + sponsor pair fails", () => {
    const world = {
      ...createInitialWorldState(),
      proxyConflicts: [
        { id: "proxy-001", hostNationId: "norvia", nationAId: "solaris", nationBId: "dravos", intensity: "low" as const },
        { id: "proxy-002", hostNationId: "norvia", nationAId: "solaris", nationBId: "dravos", intensity: "medium" as const },
      ],
    };
    expect(() => validateGameState({ turn: 1, phase: "planning" as const, playerNationId: "solaris", world, planning: { actionPoints: [] }, intelligence: { nationVisibility: [], networks: [], agents: [], assets: [], counterintelligenceAwareness: [], doubleAgents: [] } })).toThrow();
  });

  it("reversed sponsor pair represents duplicate identity", () => {
    const world = {
      ...createInitialWorldState(),
      proxyConflicts: [
        { id: "proxy-001", hostNationId: "norvia", nationAId: "solaris", nationBId: "dravos", intensity: "low" as const },
        { id: "proxy-002", hostNationId: "norvia", nationAId: "dravos", nationBId: "solaris", intensity: "low" as const },
      ],
    };
    expect(() => validateGameState({ turn: 1, phase: "planning" as const, playerNationId: "solaris", world, planning: { actionPoints: [] }, intelligence: { nationVisibility: [], networks: [], agents: [], assets: [], counterintelligenceAwareness: [], doubleAgents: [] } })).toThrow();
  });

  it("host equal to sponsor fails", () => {
    const world = {
      ...createInitialWorldState(),
      proxyConflicts: [{
        id: "proxy-001",
        hostNationId: "solaris",
        nationAId: "solaris",
        nationBId: "dravos",
        intensity: "low" as const,
      }],
    };
    expect(() => validateGameState({ turn: 1, phase: "planning" as const, playerNationId: "solaris", world, planning: { actionPoints: [] }, intelligence: { nationVisibility: [], networks: [], agents: [], assets: [], counterintelligenceAwareness: [], doubleAgents: [] } })).toThrow();
  });

  it("sponsors equal each other fails", () => {
    const world = {
      ...createInitialWorldState(),
      proxyConflicts: [{
        id: "proxy-001",
        hostNationId: "norvia",
        nationAId: "solaris",
        nationBId: "solaris",
        intensity: "low" as const,
      }],
    };
    expect(() => validateGameState({ turn: 1, phase: "planning" as const, playerNationId: "solaris", world, planning: { actionPoints: [] }, intelligence: { nationVisibility: [], networks: [], agents: [], assets: [], counterintelligenceAwareness: [], doubleAgents: [] } })).toThrow();
  });

  it("unknown host stored entry fails", () => {
    const world = {
      ...createInitialWorldState(),
      proxyConflicts: [{
        id: "proxy-001",
        hostNationId: "nonexistent",
        nationAId: "solaris",
        nationBId: "dravos",
        intensity: "low" as const,
      }],
    };
    expect(() => validateGameState({ turn: 1, phase: "planning" as const, playerNationId: "solaris", world, planning: { actionPoints: [] }, intelligence: { nationVisibility: [], networks: [], agents: [], assets: [], counterintelligenceAwareness: [], doubleAgents: [] } })).toThrow();
  });

  it("unknown nationA stored entry fails", () => {
    const world = {
      ...createInitialWorldState(),
      proxyConflicts: [{
        id: "proxy-001",
        hostNationId: "norvia",
        nationAId: "nonexistent",
        nationBId: "dravos",
        intensity: "low" as const,
      }],
    };
    expect(() => validateGameState({ turn: 1, phase: "planning" as const, playerNationId: "solaris", world, planning: { actionPoints: [] }, intelligence: { nationVisibility: [], networks: [], agents: [], assets: [], counterintelligenceAwareness: [], doubleAgents: [] } })).toThrow();
  });

  it("unknown nationB stored entry fails", () => {
    const world = {
      ...createInitialWorldState(),
      proxyConflicts: [{
        id: "proxy-001",
        hostNationId: "norvia",
        nationAId: "solaris",
        nationBId: "nonexistent",
        intensity: "low" as const,
      }],
    };
    expect(() => validateGameState({ turn: 1, phase: "planning" as const, playerNationId: "solaris", world, planning: { actionPoints: [] }, intelligence: { nationVisibility: [], networks: [], agents: [], assets: [], counterintelligenceAwareness: [], doubleAgents: [] } })).toThrow();
  });

  it("noncanonical stored sponsor order fails", () => {
    const world = {
      ...createInitialWorldState(),
      proxyConflicts: [{
        id: "proxy-001",
        hostNationId: "norvia",
        nationAId: "dravos",
        nationBId: "solaris",
        intensity: "low" as const,
      }],
    };
    expect(() => validateGameState({ turn: 1, phase: "planning" as const, playerNationId: "solaris", world, planning: { actionPoints: [] }, intelligence: { nationVisibility: [], networks: [], agents: [], assets: [], counterintelligenceAwareness: [], doubleAgents: [] } })).toThrow();
  });

  it("invalid intensity fails", () => {
    const world = {
      ...createInitialWorldState(),
      proxyConflicts: [{
        id: "proxy-001",
        hostNationId: "norvia",
        nationAId: "solaris",
        nationBId: "dravos",
        intensity: "extreme" as any,
      }],
    };
    expect(() => validateGameState({ turn: 1, phase: "planning" as const, playerNationId: "solaris", world, planning: { actionPoints: [] }, intelligence: { nationVisibility: [], networks: [], agents: [], assets: [], counterintelligenceAwareness: [], doubleAgents: [] } })).toThrow();
  });

  it("unknown conflict lookup fails", () => {
    const world = createInitialWorldState();
    expect(() => {
      const found = world.proxyConflicts.find((c) => c.id === "nonexistent");
      if (!found) throw new UnknownProxyConflictError("nonexistent");
    }).toThrow(UnknownProxyConflictError);
  });

  it("exact ID lookup succeeds", () => {
    const world = {
      ...createInitialWorldState(),
      proxyConflicts: [{
        id: "proxy-001",
        hostNationId: "norvia",
        nationAId: "solaris",
        nationBId: "dravos",
        intensity: "low" as const,
      }],
    };
    expect(world.proxyConflicts.find((c) => c.id === "proxy-001")).toBeDefined();
  });
});

// ============================================================
// ADD PRIMITIVE TESTS
// ============================================================

describe("ADD PROXY CONFLICT PRIMITIVE", () => {
  it("successful immutable add", () => {
    const state = validState();
    const conflict = { id: "proxy-001", hostNationId: "norvia", nationAId: "solaris", nationBId: "dravos", intensity: "low" as const };
    const result = addProxyConflict(state, conflict);
    expect(result).not.toBe(state);
    expect(result.world.proxyConflicts).toHaveLength(1);
    expect(result.world.proxyConflicts[0].id).toBe("proxy-001");
  });

  it("original state unchanged", () => {
    const state = validState();
    const conflict = { id: "proxy-001", hostNationId: "norvia", nationAId: "solaris", nationBId: "dravos", intensity: "low" as const };
    const snapshot = JSON.parse(JSON.stringify(state));
    addProxyConflict(state, conflict);
    expect(state).toEqual(snapshot);
  });

  it("new GameState", () => {
    const state = validState();
    const conflict = { id: "proxy-001", hostNationId: "norvia", nationAId: "solaris", nationBId: "dravos", intensity: "low" as const };
    const result = addProxyConflict(state, conflict);
    expect(result).not.toBe(state);
  });

  it("new WorldState", () => {
    const state = validState();
    const conflict = { id: "proxy-001", hostNationId: "norvia", nationAId: "solaris", nationBId: "dravos", intensity: "low" as const };
    const result = addProxyConflict(state, conflict);
    expect(result.world).not.toBe(state.world);
  });

  it("new proxyConflicts array", () => {
    const state = validState();
    const conflict = { id: "proxy-001", hostNationId: "norvia", nationAId: "solaris", nationBId: "dravos", intensity: "low" as const };
    const result = addProxyConflict(state, conflict);
    expect(result.world.proxyConflicts).not.toBe(state.world.proxyConflicts);
  });

  it("unrelated WorldState references preserved", () => {
    const state = validState();
    const conflict = { id: "proxy-001", hostNationId: "norvia", nationAId: "solaris", nationBId: "dravos", intensity: "low" as const };
    const result = addProxyConflict(state, conflict);
    expect(result.world.nations).toBe(state.world.nations);
    expect(result.world.map).toBe(state.world.map);
    expect(result.world.regionOwnership).toBe(state.world.regionOwnership);
    expect(result.world.nationStrategicStats).toBe(state.world.nationStrategicStats);
    expect(result.world.nationInfluence).toBe(state.world.nationInfluence);
    expect(result.world.diplomaticRelationships).toBe(state.world.diplomaticRelationships);
  });

  it("PlanningState preserved", () => {
    const state = validState();
    const conflict = { id: "proxy-001", hostNationId: "norvia", nationAId: "solaris", nationBId: "dravos", intensity: "low" as const };
    const result = addProxyConflict(state, conflict);
    expect(result.planning).toBe(state.planning);
  });

  it("IntelligenceState preserved", () => {
    const state = validState();
    const conflict = { id: "proxy-001", hostNationId: "norvia", nationAId: "solaris", nationBId: "dravos", intensity: "low" as const };
    const result = addProxyConflict(state, conflict);
    expect(result.intelligence).toBe(state.intelligence);
  });

  it("invalid ID fails", () => {
    const state = validState();
    const conflict = { id: "", hostNationId: "norvia", nationAId: "solaris", nationBId: "dravos", intensity: "low" as const };
    expect(() => addProxyConflict(state, conflict)).toThrow(InvalidProxyConflictIdError);
  });

  it("unknown host fails", () => {
    const state = validState();
    const conflict = { id: "proxy-001", hostNationId: "nonexistent", nationAId: "solaris", nationBId: "dravos", intensity: "low" as const };
    expect(() => addProxyConflict(state, conflict)).toThrow(UnknownNationError);
  });

  it("unknown nationA fails", () => {
    const state = validState();
    const conflict = { id: "proxy-001", hostNationId: "norvia", nationAId: "nonexistent", nationBId: "dravos", intensity: "low" as const };
    expect(() => addProxyConflict(state, conflict)).toThrow(UnknownNationError);
  });

  it("unknown nationB fails", () => {
    const state = validState();
    const conflict = { id: "proxy-001", hostNationId: "norvia", nationAId: "solaris", nationBId: "nonexistent", intensity: "low" as const };
    expect(() => addProxyConflict(state, conflict)).toThrow(UnknownNationError);
  });

  it("invalid participants fail", () => {
    const state = validState();
    const conflict = { id: "proxy-001", hostNationId: "solaris", nationAId: "solaris", nationBId: "dravos", intensity: "low" as const };
    expect(() => addProxyConflict(state, conflict)).toThrow(InvalidProxyConflictParticipantsError);
  });

  it("noncanonical sponsor order fails", () => {
    const state = validState();
    const conflict = { id: "proxy-001", hostNationId: "norvia", nationAId: "dravos", nationBId: "solaris", intensity: "low" as const };
    expect(() => addProxyConflict(state, conflict)).toThrow();
  });

  it("invalid intensity fails", () => {
    const state = validState();
    const conflict = { id: "proxy-001", hostNationId: "norvia", nationAId: "solaris", nationBId: "dravos", intensity: "extreme" as any };
    expect(() => addProxyConflict(state, conflict)).toThrow(InvalidProxyConflictIntensityError);
  });

  it("duplicate ID fails", () => {
    let state = validState();
    const conflict1 = { id: "proxy-001", hostNationId: "norvia", nationAId: "solaris", nationBId: "dravos", intensity: "low" as const };
    state = addProxyConflict(state, conflict1);
    const conflict2 = { id: "proxy-001", hostNationId: "veloria", nationAId: "solaris", nationBId: "dravos", intensity: "low" as const };
    expect(() => addProxyConflict(state, conflict2)).toThrow(DuplicateProxyConflictIdError);
  });

  it("duplicate conflict identity fails", () => {
    let state = validState();
    const conflict1 = { id: "proxy-001", hostNationId: "norvia", nationAId: "solaris", nationBId: "dravos", intensity: "low" as const };
    state = addProxyConflict(state, conflict1);
    const conflict2 = { id: "proxy-002", hostNationId: "norvia", nationAId: "solaris", nationBId: "dravos", intensity: "medium" as const };
    expect(() => addProxyConflict(state, conflict2)).toThrow(DuplicateProxyConflictError);
  });

  it("successful result passes validateGameState", () => {
    const state = validState();
    const conflict = { id: "proxy-001", hostNationId: "norvia", nationAId: "solaris", nationBId: "dravos", intensity: "low" as const };
    const result = addProxyConflict(state, conflict);
    expect(() => validateGameState(result)).not.toThrow();
  });
});

// ============================================================
// INTENSITY PRIMITIVE TESTS
// ============================================================

describe("SET PROXY CONFLICT INTENSITY PRIMITIVE", () => {
  function stateWithConflict() {
    let state = validState();
    const conflict = { id: "proxy-001", hostNationId: "norvia", nationAId: "solaris", nationBId: "dravos", intensity: "low" as const };
    return addProxyConflict(state, conflict);
  }

  it("low -> medium immutable transition", () => {
    const state = stateWithConflict();
    const result = setProxyConflictIntensity(state, "proxy-001", "medium");
    expect(result).not.toBe(state);
    expect(result.world.proxyConflicts[0].intensity).toBe("medium");
  });

  it("medium -> high structurally allowed", () => {
    let state = stateWithConflict();
    state = setProxyConflictIntensity(state, "proxy-001", "medium");
    const result = setProxyConflictIntensity(state, "proxy-001", "high");
    expect(result.world.proxyConflicts[0].intensity).toBe("high");
  });

  it("same intensity returns exact original GameState reference", () => {
    const state = stateWithConflict();
    const result = setProxyConflictIntensity(state, "proxy-001", "low");
    expect(result).toBe(state);
  });

  it("unknown conflict fails", () => {
    const state = stateWithConflict();
    expect(() => setProxyConflictIntensity(state, "nonexistent", "medium")).toThrow(UnknownProxyConflictError);
  });

  it("invalid runtime intensity fails", () => {
    const state = stateWithConflict();
    expect(() => setProxyConflictIntensity(state, "proxy-001", "extreme" as any)).toThrow(InvalidProxyConflictIntensityError);
  });

  it("unrelated references preserved", () => {
    const state = stateWithConflict();
    const result = setProxyConflictIntensity(state, "proxy-001", "medium");
    expect(result.world.nations).toBe(state.world.nations);
    expect(result.world.regionOwnership).toBe(state.world.regionOwnership);
    expect(result.world.nationStrategicStats).toBe(state.world.nationStrategicStats);
    expect(result.world.nationInfluence).toBe(state.world.nationInfluence);
    expect(result.world.diplomaticRelationships).toBe(state.world.diplomaticRelationships);
  });

  it("successful result validates", () => {
    const state = stateWithConflict();
    const result = setProxyConflictIntensity(state, "proxy-001", "medium");
    expect(() => validateGameState(result)).not.toThrow();
  });
});

// ============================================================
// START PROXY CONFLICT TESTS
// ============================================================

function setupForStart(actor: string, rival: string, host: string) {
  let state = validState();
  state = setDiplomaticStatus(state, actor, rival, "hostile");
  state = setNationInfluence(state, actor, host, PROXY_CONFLICT_MINIMUM_INFLUENCE);
  state = setNationStrategicStat(state, host, "stability", PROXY_CONFLICT_MAXIMUM_HOST_STABILITY);
  return state;
}

describe("START PROXY CONFLICT: BASIC SUCCESS", () => {
  it("successful start creates conflict", () => {
    const state = setupForStart("solaris", "dravos", "norvia");
    const result = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001");
    expect(result.state.world.proxyConflicts).toHaveLength(1);
    expect(result.state.world.proxyConflicts[0].id).toBe("proxy-001");
  });

  it("exact conflict data", () => {
    const state = setupForStart("solaris", "dravos", "norvia");
    const result = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001");
    const conflict = result.state.world.proxyConflicts[0];
    expect(conflict.hostNationId).toBe("norvia");
    expect(conflict.nationAId).toBe("solaris");
    expect(conflict.nationBId).toBe("dravos");
    expect(conflict.intensity).toBe("low");
  });

  it("canonical sponsor ordering", () => {
    const state = setupForStart("dravos", "solaris", "norvia");
    const result = startProxyConflict(state, "dravos", "solaris", "norvia", "proxy-001");
    const conflict = result.state.world.proxyConflicts[0];
    expect(conflict.nationAId).toBe("solaris");
    expect(conflict.nationBId).toBe("dravos");
  });

  it("intensity starts at low", () => {
    const state = setupForStart("solaris", "dravos", "norvia");
    const result = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001");
    expect(result.state.world.proxyConflicts[0].intensity).toBe("low");
  });

  it("exact 3 AP cost", () => {
    const state = setupForStart("solaris", "dravos", "norvia");
    const result = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001");
    expect(result.event.actionPointCost).toBe(START_PROXY_CONFLICT_AP_COST);
  });

  it("host stability decreases exactly 5", () => {
    const state = setupForStart("solaris", "dravos", "norvia");
    const result = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001");
    expect(getNationStrategicStats(result.state.world, "norvia").stability).toBe(65);
  });

  it("host stability below 5 floors at 0", () => {
    let state = setupForStart("solaris", "dravos", "norvia");
    state = setNationStrategicStat(state, "norvia", "stability", 3);
    const result = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001");
    expect(getNationStrategicStats(result.state.world, "norvia").stability).toBe(0);
  });

  it("exact deterministic event", () => {
    const state = setupForStart("solaris", "dravos", "norvia");
    const result = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001");
    expect(result.event).toEqual({
      type: "proxy-conflict-started",
      turn: state.turn,
      actorNationId: "solaris",
      rivalNationId: "dravos",
      hostNationId: "norvia",
      conflictId: "proxy-001",
      intensity: "low",
      previousHostStability: 70,
      newHostStability: 65,
      actionPointCost: START_PROXY_CONFLICT_AP_COST,
    });
  });
});

describe("START PROXY CONFLICT: ELIGIBILITY THRESHOLDS", () => {
  it("influence exactly 40 succeeds", () => {
    let state = validState();
    state = setDiplomaticStatus(state, "solaris", "dravos", "hostile");
    state = setNationInfluence(state, "solaris", "norvia", 40);
    state = setNationStrategicStat(state, "norvia", "stability", 70);
    expect(() => startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001")).not.toThrow();
  });

  it("influence 39 fails", () => {
    let state = validState();
    state = setDiplomaticStatus(state, "solaris", "dravos", "hostile");
    state = setNationInfluence(state, "solaris", "norvia", 39);
    state = setNationStrategicStat(state, "norvia", "stability", 70);
    expect(() => startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001")).toThrow(InsufficientProxyConflictInfluenceError);
  });

  it("hostile diplomacy succeeds", () => {
    let state = validState();
    state = setDiplomaticStatus(state, "solaris", "dravos", "hostile");
    state = setNationInfluence(state, "solaris", "norvia", 40);
    state = setNationStrategicStat(state, "norvia", "stability", 70);
    expect(() => startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001")).not.toThrow();
  });

  it("neutral diplomacy fails", () => {
    let state = validState();
    state = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    state = setNationInfluence(state, "solaris", "norvia", 40);
    state = setNationStrategicStat(state, "norvia", "stability", 70);
    expect(() => startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001")).toThrow(NonHostileProxyConflictRivalryError);
  });

  it("friendly diplomacy fails", () => {
    let state = validState();
    state = setDiplomaticStatus(state, "solaris", "dravos", "friendly");
    state = setNationInfluence(state, "solaris", "norvia", 40);
    state = setNationStrategicStat(state, "norvia", "stability", 70);
    expect(() => startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001")).toThrow(NonHostileProxyConflictRivalryError);
  });

  it("host stability exactly 70 succeeds", () => {
    let state = validState();
    state = setDiplomaticStatus(state, "solaris", "dravos", "hostile");
    state = setNationInfluence(state, "solaris", "norvia", 40);
    state = setNationStrategicStat(state, "norvia", "stability", 70);
    expect(() => startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001")).not.toThrow();
  });

  it("host stability 71 fails", () => {
    let state = validState();
    state = setDiplomaticStatus(state, "solaris", "dravos", "hostile");
    state = setNationInfluence(state, "solaris", "norvia", 40);
    state = setNationStrategicStat(state, "norvia", "stability", 71);
    expect(() => startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001")).toThrow(HostTooStableForProxyConflictError);
  });
});

describe("START PROXY CONFLICT: ERROR CASES", () => {
  it("blank ID fails", () => {
    const state = setupForStart("solaris", "dravos", "norvia");
    expect(() => startProxyConflict(state, "solaris", "dravos", "norvia", "")).toThrow(InvalidProxyConflictIdError);
  });

  it("whitespace ID fails", () => {
    const state = setupForStart("solaris", "dravos", "norvia");
    expect(() => startProxyConflict(state, "solaris", "dravos", "norvia", "  ")).toThrow(InvalidProxyConflictIdError);
  });

  it("duplicate conflict ID fails", () => {
    let state = setupForStart("solaris", "dravos", "norvia");
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    expect(() => startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001")).toThrow(DuplicateProxyConflictIdError);
  });

  it("duplicate logical conflict fails", () => {
    let state = setupForStart("solaris", "dravos", "norvia");
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    expect(() => startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-002")).toThrow(DuplicateProxyConflictError);
  });

  it("actor/rival same fails", () => {
    const state = setupForStart("solaris", "dravos", "norvia");
    expect(() => startProxyConflict(state, "solaris", "solaris", "norvia", "proxy-001")).toThrow(InvalidProxyConflictParticipantsError);
  });

  it("actor/host same fails", () => {
    const state = setupForStart("solaris", "dravos", "norvia");
    expect(() => startProxyConflict(state, "solaris", "dravos", "solaris", "proxy-001")).toThrow(InvalidProxyConflictParticipantsError);
  });

  it("rival/host same fails", () => {
    const state = setupForStart("solaris", "dravos", "norvia");
    expect(() => startProxyConflict(state, "solaris", "norvia", "norvia", "proxy-001")).toThrow(InvalidProxyConflictParticipantsError);
  });

  it("unknown actor fails", () => {
    const state = setupForStart("solaris", "dravos", "norvia");
    expect(() => startProxyConflict(state, "nonexistent", "dravos", "norvia", "proxy-001")).toThrow(UnknownNationError);
  });

  it("unknown rival fails", () => {
    const state = setupForStart("solaris", "dravos", "norvia");
    expect(() => startProxyConflict(state, "solaris", "nonexistent", "norvia", "proxy-001")).toThrow(UnknownNationError);
  });

  it("unknown host fails", () => {
    const state = setupForStart("solaris", "dravos", "norvia");
    expect(() => startProxyConflict(state, "solaris", "dravos", "nonexistent", "proxy-001")).toThrow(UnknownNationError);
  });

  it("invalid phase fails", () => {
    let state = setupForStart("solaris", "dravos", "norvia");
    const badState = { ...state, phase: "resolution" as const };
    expect(() => startProxyConflict(badState, "solaris", "dravos", "norvia", "proxy-001")).toThrow();
  });

  it("insufficient AP fails", () => {
    let state = setupForStart("solaris", "dravos", "norvia");
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    state = setNationInfluence(state, "solaris", "veloria", PROXY_CONFLICT_MINIMUM_INFLUENCE);
    state = setNationStrategicStat(state, "veloria", "stability", PROXY_CONFLICT_MAXIMUM_HOST_STABILITY);
    state = startProxyConflict(state, "solaris", "dravos", "veloria", "proxy-002").state;
    state = setNationInfluence(state, "solaris", "karsen", PROXY_CONFLICT_MINIMUM_INFLUENCE);
    state = setNationStrategicStat(state, "karsen", "stability", PROXY_CONFLICT_MAXIMUM_HOST_STABILITY);
    expect(() => startProxyConflict(state, "solaris", "dravos", "karsen", "proxy-003")).toThrow(InsufficientActionPointsError);
  });
});

describe("START PROXY CONFLICT: ATOMICITY", () => {
  it("failure preserves original state", () => {
    const state = setupForStart("solaris", "dravos", "norvia");
    const snapshot = JSON.parse(JSON.stringify(state));
    try {
      startProxyConflict(state, "solaris", "solaris", "norvia", "proxy-001");
    } catch {
      // expected
    }
    expect(state).toEqual(snapshot);
  });
});

describe("START PROXY CONFLICT: SIDE EFFECTS PRESERVED", () => {
  it("influence unchanged", () => {
    const state = setupForStart("solaris", "dravos", "norvia");
    const before = getNationInfluence(state.world, "solaris", "norvia").value;
    const result = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001");
    expect(getNationInfluence(result.state.world, "solaris", "norvia").value).toBe(before);
  });

  it("diplomacy unchanged", () => {
    const state = setupForStart("solaris", "dravos", "norvia");
    const before = getDiplomaticRelationship(state.world, "solaris", "dravos").status;
    const result = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001");
    expect(getDiplomaticRelationship(result.state.world, "solaris", "dravos").status).toBe(before);
  });

  it("publicSupport unchanged", () => {
    const state = setupForStart("solaris", "dravos", "norvia");
    const before = getNationStrategicStats(state.world, "norvia").publicSupport;
    const result = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001");
    expect(getNationStrategicStats(result.state.world, "norvia").publicSupport).toBe(before);
  });

  it("internalSecurity unchanged", () => {
    const state = setupForStart("solaris", "dravos", "norvia");
    const before = getNationStrategicStats(state.world, "norvia").internalSecurity;
    const result = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001");
    expect(getNationStrategicStats(result.state.world, "norvia").internalSecurity).toBe(before);
  });

  it("IntelligenceState unchanged", () => {
    const state = setupForStart("solaris", "dravos", "norvia");
    const result = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001");
    expect(result.state.intelligence).toBe(state.intelligence);
  });
});

// ============================================================
// ESCALATE PROXY CONFLICT TESTS
// ============================================================

function stateWithLowConflict() {
  return setupForStart("solaris", "dravos", "norvia");
}

describe("ESCALATE PROXY CONFLICT: BASIC SUCCESS", () => {
  it("low -> medium", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    const result = escalateProxyConflict(state, "solaris", "proxy-001");
    expect(result.state.world.proxyConflicts[0].intensity).toBe("medium");
  });

  it("medium -> high", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    state = escalateProxyConflict(state, "solaris", "proxy-001").state;
    state = resolveTurn(state, []).state;
    const result = escalateProxyConflict(state, "solaris", "proxy-001");
    expect(result.state.world.proxyConflicts[0].intensity).toBe("high");
  });

  it("high -> error MaximumProxyConflictIntensityError", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    state = resolveTurn(state, []).state;
    state = escalateProxyConflict(state, "solaris", "proxy-001").state;
    state = escalateProxyConflict(state, "solaris", "proxy-001").state;
    expect(() => escalateProxyConflict(state, "solaris", "proxy-001")).toThrow(MaximumProxyConflictIntensityError);
  });

  it("exact 2 AP cost", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    const result = escalateProxyConflict(state, "solaris", "proxy-001");
    expect(result.event.actionPointCost).toBe(ESCALATE_PROXY_CONFLICT_AP_COST);
  });

  it("actor nationA can escalate", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    expect(() => escalateProxyConflict(state, "solaris", "proxy-001")).not.toThrow();
  });

  it("actor nationB can escalate", () => {
    let state = stateWithLowConflict();
    state = setNationInfluence(state, "dravos", "norvia", PROXY_CONFLICT_MINIMUM_INFLUENCE);
    state = startProxyConflict(state, "dravos", "solaris", "norvia", "proxy-001").state;
    expect(() => escalateProxyConflict(state, "dravos", "proxy-001")).not.toThrow();
  });

  it("nonparticipant fails", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    expect(() => escalateProxyConflict(state, "veloria", "proxy-001")).toThrow(ProxyConflictParticipationError);
  });

  it("unknown actor fails", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    expect(() => escalateProxyConflict(state, "nonexistent", "proxy-001")).toThrow(UnknownNationError);
  });

  it("unknown conflict fails", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    expect(() => escalateProxyConflict(state, "solaris", "nonexistent")).toThrow(UnknownProxyConflictError);
  });

  it("missing host strategic stats fails", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    const world = {
      ...state.world,
      nationStrategicStats: state.world.nationStrategicStats.filter((s) => s.nationId !== "norvia"),
    };
    const badState = { ...state, world };
    expect(() => escalateProxyConflict(badState, "solaris", "proxy-001")).toThrow();
  });

  it("invalid phase fails", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    const badState = { ...state, phase: "resolution" as const };
    expect(() => escalateProxyConflict(badState, "solaris", "proxy-001")).toThrow();
  });

  it("insufficient AP fails", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    state = escalateProxyConflict(state, "solaris", "proxy-001").state;
    expect(() => escalateProxyConflict(state, "solaris", "proxy-001")).toThrow(InsufficientActionPointsError);
  });

  it("host stability decreases exactly 5", () => {
    let state = stateWithLowConflict();
    state = setNationStrategicStat(state, "norvia", "stability", 50);
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    const result = escalateProxyConflict(state, "solaris", "proxy-001");
    expect(getNationStrategicStats(result.state.world, "norvia").stability).toBe(40);
  });

  it("host stability below 5 floors at 0", () => {
    let state = stateWithLowConflict();
    state = setNationStrategicStat(state, "norvia", "stability", 3);
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    const result = escalateProxyConflict(state, "solaris", "proxy-001");
    expect(getNationStrategicStats(result.state.world, "norvia").stability).toBe(0);
  });

  it("exact event", () => {
    let state = stateWithLowConflict();
    state = setNationStrategicStat(state, "norvia", "stability", 50);
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    const result = escalateProxyConflict(state, "solaris", "proxy-001");
    expect(result.event).toEqual({
      type: "proxy-conflict-escalated",
      turn: state.turn,
      actorNationId: "solaris",
      conflictId: "proxy-001",
      hostNationId: "norvia",
      previousIntensity: "low",
      newIntensity: "medium",
      previousHostStability: 45,
      newHostStability: 40,
      actionPointCost: ESCALATE_PROXY_CONFLICT_AP_COST,
    });
  });

  it("event determinism", () => {
    const a = stateWithLowConflict();
    const b = stateWithLowConflict();
    const sa = startProxyConflict(a, "solaris", "dravos", "norvia", "proxy-001").state;
    const sb = startProxyConflict(b, "solaris", "dravos", "norvia", "proxy-001").state;
    const eventA = escalateProxyConflict(sa, "solaris", "proxy-001").event;
    const eventB = escalateProxyConflict(sb, "solaris", "proxy-001").event;
    expect(eventA).toEqual(eventB);
  });

  it("failure atomicity", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    state = resolveTurn(state, []).state;
    state = escalateProxyConflict(state, "solaris", "proxy-001").state;
    state = escalateProxyConflict(state, "solaris", "proxy-001").state;
    const snapshot = JSON.parse(JSON.stringify(state));
    try {
      escalateProxyConflict(state, "solaris", "proxy-001");
    } catch {
      // expected
    }
    expect(state).toEqual(snapshot);
  });
});

describe("ESCALATION DOES NOT RECHECK START ELIGIBILITY", () => {
  it("escalation succeeds even when influence below threshold", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    state = setNationInfluence(state, "solaris", "norvia", 10);
    expect(() => escalateProxyConflict(state, "solaris", "proxy-001")).not.toThrow();
  });

  it("escalation succeeds even when diplomacy is no longer hostile", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    state = setDiplomaticStatus(state, "solaris", "dravos", "friendly");
    expect(() => escalateProxyConflict(state, "solaris", "proxy-001")).not.toThrow();
  });

  it("escalation succeeds even when host stability above threshold", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    state = setNationStrategicStat(state, "norvia", "stability", 90);
    expect(() => escalateProxyConflict(state, "solaris", "proxy-001")).not.toThrow();
  });
});

describe("ESCALATION: SIDE EFFECTS PRESERVED", () => {
  it("influence unchanged", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    const before = getNationInfluence(state.world, "solaris", "norvia").value;
    const result = escalateProxyConflict(state, "solaris", "proxy-001");
    expect(getNationInfluence(result.state.world, "solaris", "norvia").value).toBe(before);
  });

  it("diplomacy unchanged", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    const before = getDiplomaticRelationship(state.world, "solaris", "dravos").status;
    const result = escalateProxyConflict(state, "solaris", "proxy-001");
    expect(getDiplomaticRelationship(result.state.world, "solaris", "dravos").status).toBe(before);
  });

  it("publicSupport unchanged", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    const before = getNationStrategicStats(state.world, "norvia").publicSupport;
    const result = escalateProxyConflict(state, "solaris", "proxy-001");
    expect(getNationStrategicStats(result.state.world, "norvia").publicSupport).toBe(before);
  });

  it("internalSecurity unchanged", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    const before = getNationStrategicStats(state.world, "norvia").internalSecurity;
    const result = escalateProxyConflict(state, "solaris", "proxy-001");
    expect(getNationStrategicStats(result.state.world, "norvia").internalSecurity).toBe(before);
  });

  it("IntelligenceState unchanged", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    const result = escalateProxyConflict(state, "solaris", "proxy-001");
    expect(result.state.intelligence).toBe(state.intelligence);
  });
});

// ============================================================
// PERSISTENCE / REGRESSION TESTS
// ============================================================

describe("PERSISTENCE ACROSS RESOLVETURN", () => {
  it("proxy conflict survives resolveTurn", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    const { state: next } = resolveTurn(state, []);
    expect(next.world.proxyConflicts).toHaveLength(1);
    expect(next.world.proxyConflicts[0].id).toBe("proxy-001");
  });

  it("proxyConflicts array reference preserved across ordinary resolveTurn", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    const { state: next } = resolveTurn(state, []);
    expect(next.world.proxyConflicts).toBe(state.world.proxyConflicts);
  });

  it("intensity survives resolveTurn", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    state = escalateProxyConflict(state, "solaris", "proxy-001").state;
    const { state: next } = resolveTurn(state, []);
    expect(next.world.proxyConflicts[0].intensity).toBe("medium");
  });

  it("host stability effect survives resolveTurn", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    const stabilityAfterStart = getNationStrategicStats(state.world, "norvia").stability;
    const { state: next } = resolveTurn(state, []);
    expect(getNationStrategicStats(next.world, "norvia").stability).toBe(stabilityAfterStart);
  });

  it("AP resets normally", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    const { state: next } = resolveTurn(state, []);
    expect(next.planning.actionPoints.find((a) => a.nationId === "solaris")!.remaining).toBe(6);
  });

  it("TurnAdvancedEvent unchanged", () => {
    let state = stateWithLowConflict();
    state = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001").state;
    const { result } = resolveTurn(state, []);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].type).toBe("turn-advanced");
  });

  it("G2.5 sabotage behavior unchanged", () => {
    let state = stateWithLowConflict();
    state = setIntelligenceNetworkLevel(state, "solaris", "norvia", "foothold");
    state = setIntelligenceNetworkLevel(state, "solaris", "norvia", "established");
    const { state: afterSabotage } = conductCovertSabotage(
      state, "solaris", "norvia", "solaris-echo", "internal-security",
    );
    expect(getNationStrategicStats(afterSabotage.world, "norvia").internalSecurity).toBe(42);
  });
});

// ============================================================
// CROSS-NATION SCENARIOS
// ============================================================

describe("CROSS-NATION SCENARIOS", () => {
  it("Dravos starts proxy conflict in Veloria against Solaris", () => {
    let state = validState();
    state = setDiplomaticStatus(state, "dravos", "solaris", "hostile");
    state = setNationInfluence(state, "dravos", "veloria", 50);
    state = setNationStrategicStat(state, "veloria", "stability", 60);
    const result = startProxyConflict(state, "dravos", "solaris", "veloria", "proxy-001");
    expect(result.state.world.proxyConflicts[0].nationAId).toBe("solaris");
    expect(result.state.world.proxyConflicts[0].nationBId).toBe("dravos");
    expect(getNationStrategicStats(result.state.world, "veloria").stability).toBe(55);
  });

  it("event turn matches state turn", () => {
    const state = stateWithLowConflict();
    const result = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-001");
    expect(result.event.turn).toBe(state.turn);
  });
});
