import { describe, it, expect } from "vitest";
import {
  createInitialNationRegimePressure,
  getNationRegimePressure,
  validateNationRegimePressure,
  SelfNationRegimePressureError,
  MissingNationRegimePressureError,
  NationRegimePressureValidationError,
  InvalidNationRegimePressureValueError,
} from "../../src/core/model/nationRegimePressure";
import {
  applyRegimePressure,
  APPLY_REGIME_PRESSURE_AP_COST,
} from "../../src/core/simulation/applyRegimePressure";
import {
  FriendlyDiplomaticRelationshipError,
  MaximumNationRegimePressureError,
} from "../../src/core/simulation/regimePressureErrors";
import { setNationRegimePressure } from "../../src/core/simulation/setNationRegimePressure";
import { createInitialGameState } from "../../src/core/model/gameState";
import { createInitialWorldState } from "../../src/core/model/worldState";
import { UnknownNationError } from "../../src/core/model/worldState";
import { getNationStrategicStats } from "../../src/core/model/nationStrategicStats";
import { getNationInfluence, MissingNationInfluenceError } from "../../src/core/model/nationInfluence";
import { getDiplomaticRelationship, MissingDiplomaticRelationshipError } from "../../src/core/model/diplomaticRelationship";
import { setNationStrategicStat } from "../../src/core/simulation/setNationStrategicStat";
import { setNationInfluence } from "../../src/core/simulation/setNationInfluence";
import { setDiplomaticStatus } from "../../src/core/simulation/setDiplomaticStatus";
import { InsufficientActionPointsError } from "../../src/core/simulation/spendActionPoints";
import { SelfTargetPoliticalOperationError, InsufficientPoliticalInfluenceError } from "../../src/core/simulation/politicalOperationErrors";
import { validateGameState } from "../../src/core/simulation/validateGameState";
import { resolveTurn } from "../../src/core/simulation/resolveTurn";

function validState() {
  return createInitialGameState();
}

function setupForPressure(
  actor: string,
  target: string,
  influence: number,
  diplomacy: "neutral" | "hostile",
) {
  let state = validState();
  state = setDiplomaticStatus(state, actor, target, diplomacy);
  state = setNationInfluence(state, actor, target, influence);
  return state;
}

// ============================================================
// INITIAL / MODEL TESTS
// ============================================================

describe("MODEL: INITIAL REGIME PRESSURE", () => {
  it("initial collection has exactly 30 entries", () => {
    const world = createInitialWorldState();
    expect(world.nationRegimePressure).toHaveLength(30);
  });

  it("every initial value = 0", () => {
    const world = createInitialWorldState();
    for (const entry of world.nationRegimePressure) {
      expect(entry.value).toBe(0);
    }
  });

  it("no self pair", () => {
    const world = createInitialWorldState();
    for (const entry of world.nationRegimePressure) {
      expect(entry.sourceNationId).not.toBe(entry.targetNationId);
    }
  });

  it("exact canonical directional ordering", () => {
    const world = createInitialWorldState();
    const canonical = ["solaris", "dravos", "norvia", "veloria", "karsen", "arkania"];
    let index = 0;
    for (const source of canonical) {
      for (const target of canonical) {
        if (source === target) continue;
        expect(world.nationRegimePressure[index].sourceNationId).toBe(source);
        expect(world.nationRegimePressure[index].targetNationId).toBe(target);
        index++;
      }
    }
  });

  it("separate initial worlds have separate pressure arrays", () => {
    const a = createInitialWorldState();
    const b = createInitialWorldState();
    expect(a.nationRegimePressure).not.toBe(b.nationRegimePressure);
  });

  it("repeated creation deeply equal", () => {
    const a = createInitialNationRegimePressure(createInitialWorldState().nations);
    const b = createInitialNationRegimePressure(createInitialWorldState().nations);
    expect(a).toEqual(b);
  });

  it("canonical initial GameState validates", () => {
    const state = createInitialGameState();
    expect(() => validateGameState(state)).not.toThrow();
  });
});

// ============================================================
// LOOKUP TESTS
// ============================================================

describe("MODEL: REGIME PRESSURE LOOKUP", () => {
  it("valid lookup succeeds", () => {
    const world = createInitialWorldState();
    const entry = getNationRegimePressure(world, "solaris", "dravos");
    expect(entry.sourceNationId).toBe("solaris");
    expect(entry.targetNationId).toBe("dravos");
    expect(entry.value).toBe(0);
  });

  it("unknown source -> UnknownNationError", () => {
    const world = createInitialWorldState();
    expect(() => getNationRegimePressure(world, "nonexistent", "dravos")).toThrow(UnknownNationError);
  });

  it("unknown target -> UnknownNationError", () => {
    const world = createInitialWorldState();
    expect(() => getNationRegimePressure(world, "solaris", "nonexistent")).toThrow(UnknownNationError);
  });

  it("self pair -> SelfNationRegimePressureError", () => {
    const world = createInitialWorldState();
    expect(() => getNationRegimePressure(world, "solaris", "solaris")).toThrow(SelfNationRegimePressureError);
  });

  it("missing required entry -> MissingNationRegimePressureError", () => {
    const world = {
      ...createInitialWorldState(),
      nationRegimePressure: [],
    };
    expect(() => getNationRegimePressure(world, "solaris", "dravos")).toThrow(MissingNationRegimePressureError);
  });
});

// ============================================================
// VALIDATION TESTS
// ============================================================

describe("MODEL: REGIME PRESSURE VALIDATION", () => {
  it("valid canonical pressure passes", () => {
    const world = createInitialWorldState();
    expect(() => validateNationRegimePressure(world)).not.toThrow();
  });

  it("duplicate ordered pair fails", () => {
    const world = createInitialWorldState();
    const bad = {
      ...world,
      nationRegimePressure: [
        ...world.nationRegimePressure,
        { sourceNationId: "solaris" as const, targetNationId: "dravos" as const, value: 10 },
      ],
    };
    expect(() => validateNationRegimePressure(bad)).toThrow(NationRegimePressureValidationError);
  });

  it("reversed directional pair is NOT a duplicate", () => {
    const world = createInitialWorldState();
    const modified = world.nationRegimePressure.map((e) =>
      e.sourceNationId === "solaris" && e.targetNationId === "dravos"
        ? { ...e, value: 25 }
        : e,
    );
    expect(() => validateNationRegimePressure({ ...world, nationRegimePressure: modified })).not.toThrow();
  });

  it("self pair fails", () => {
    const world = createInitialWorldState();
    const bad = {
      ...world,
      nationRegimePressure: [
        { sourceNationId: "solaris" as const, targetNationId: "solaris" as const, value: 10 },
      ],
    };
    expect(() => validateNationRegimePressure(bad)).toThrow(NationRegimePressureValidationError);
  });

  it("unknown source stored entry fails", () => {
    const world = createInitialWorldState();
    const bad = {
      ...world,
      nationRegimePressure: [
        { sourceNationId: "nonexistent" as const, targetNationId: "dravos" as const, value: 10 },
      ],
    };
    expect(() => validateNationRegimePressure(bad)).toThrow(NationRegimePressureValidationError);
  });

  it("unknown target stored entry fails", () => {
    const world = createInitialWorldState();
    const bad = {
      ...world,
      nationRegimePressure: [
        { sourceNationId: "solaris" as const, targetNationId: "nonexistent" as const, value: 10 },
      ],
    };
    expect(() => validateNationRegimePressure(bad)).toThrow(NationRegimePressureValidationError);
  });

  it("missing required pair fails", () => {
    const world = createInitialWorldState();
    const incomplete = world.nationRegimePressure.filter(
      (e) => !(e.sourceNationId === "solaris" && e.targetNationId === "dravos"),
    );
    expect(() => validateNationRegimePressure({ ...world, nationRegimePressure: incomplete })).toThrow(
      NationRegimePressureValidationError,
    );
  });

  it("fractional value fails", () => {
    const world = createInitialWorldState();
    const bad = {
      ...world,
      nationRegimePressure: world.nationRegimePressure.map((e) =>
        e.sourceNationId === "solaris" && e.targetNationId === "dravos"
          ? { ...e, value: 10.5 }
          : e,
      ),
    };
    expect(() => validateNationRegimePressure(bad)).toThrow(NationRegimePressureValidationError);
  });

  it("value below 0 fails", () => {
    const world = createInitialWorldState();
    const bad = {
      ...world,
      nationRegimePressure: world.nationRegimePressure.map((e) =>
        e.sourceNationId === "solaris" && e.targetNationId === "dravos"
          ? { ...e, value: -1 }
          : e,
      ),
    };
    expect(() => validateNationRegimePressure(bad)).toThrow(NationRegimePressureValidationError);
  });

  it("value above 100 fails", () => {
    const world = createInitialWorldState();
    const bad = {
      ...world,
      nationRegimePressure: world.nationRegimePressure.map((e) =>
        e.sourceNationId === "solaris" && e.targetNationId === "dravos"
          ? { ...e, value: 101 }
          : e,
      ),
    };
    expect(() => validateNationRegimePressure(bad)).toThrow(NationRegimePressureValidationError);
  });

  it("value 0 valid", () => {
    const world = createInitialWorldState();
    expect(() => validateNationRegimePressure(world)).not.toThrow();
  });

  it("value 100 valid", () => {
    const world = createInitialWorldState();
    const modified = {
      ...world,
      nationRegimePressure: world.nationRegimePressure.map((e) =>
        e.sourceNationId === "solaris" && e.targetNationId === "dravos"
          ? { ...e, value: 100 }
          : e,
      ),
    };
    expect(() => validateNationRegimePressure(modified)).not.toThrow();
  });

  it("asymmetrical pressure values valid", () => {
    const world = createInitialWorldState();
    const modified = {
      ...world,
      nationRegimePressure: world.nationRegimePressure.map((e) => {
        if (e.sourceNationId === "solaris" && e.targetNationId === "dravos") {
          return { ...e, value: 30 };
        }
        if (e.sourceNationId === "dravos" && e.targetNationId === "solaris") {
          return { ...e, value: 60 };
        }
        return e;
      }),
    };
    expect(() => validateNationRegimePressure(modified)).not.toThrow();
  });
});

// ============================================================
// PRIMITIVE TESTS
// ============================================================

describe("SET REGIME PRESSURE PRIMITIVE", () => {
  it("real 0 -> 20 transition succeeds", () => {
    let state = validState();
    state = setNationRegimePressure(state, "solaris", "dravos", 20);
    expect(getNationRegimePressure(state.world, "solaris", "dravos").value).toBe(20);
  });

  it("result lookup returns 20", () => {
    let state = validState();
    state = setNationRegimePressure(state, "solaris", "dravos", 20);
    const entry = getNationRegimePressure(state.world, "solaris", "dravos");
    expect(entry.value).toBe(20);
  });

  it("original GameState unchanged", () => {
    const original = validState();
    const snapshot = JSON.parse(JSON.stringify(original));
    setNationRegimePressure(original, "solaris", "dravos", 20);
    expect(original).toEqual(snapshot);
  });

  it("original WorldState unchanged", () => {
    const original = validState();
    const wsSnapshot = JSON.parse(JSON.stringify(original.world));
    setNationRegimePressure(original, "solaris", "dravos", 20);
    expect(original.world).toEqual(wsSnapshot);
  });

  it("original pressure array unchanged", () => {
    const original = validState();
    const pressureSnapshot = JSON.parse(JSON.stringify(original.world.nationRegimePressure));
    setNationRegimePressure(original, "solaris", "dravos", 20);
    expect(original.world.nationRegimePressure).toEqual(pressureSnapshot);
  });

  it("new GameState reference", () => {
    const original = validState();
    const result = setNationRegimePressure(original, "solaris", "dravos", 20);
    expect(result).not.toBe(original);
  });

  it("new WorldState reference", () => {
    const original = validState();
    const result = setNationRegimePressure(original, "solaris", "dravos", 20);
    expect(result.world).not.toBe(original.world);
  });

  it("new pressure array reference", () => {
    const original = validState();
    const result = setNationRegimePressure(original, "solaris", "dravos", 20);
    expect(result.world.nationRegimePressure).not.toBe(original.world.nationRegimePressure);
  });

  it("only changed entry replaced", () => {
    const original = validState();
    const result = setNationRegimePressure(original, "solaris", "dravos", 20);
    const changed = result.world.nationRegimePressure.find(
      (e) => e.sourceNationId === "solaris" && e.targetNationId === "dravos",
    )!;
    expect(changed.value).toBe(20);
    const unchanged = result.world.nationRegimePressure.find(
      (e) => e.sourceNationId === "solaris" && e.targetNationId === "norvia",
    )!;
    expect(unchanged.value).toBe(0);
  });

  it("unrelated entry references preserved", () => {
    const original = validState();
    const result = setNationRegimePressure(original, "solaris", "dravos", 20);
    const otherEntry = result.world.nationRegimePressure.find(
      (e) => e.sourceNationId === "dravos" && e.targetNationId === "norvia",
    );
    const originalEntry = original.world.nationRegimePressure.find(
      (e) => e.sourceNationId === "dravos" && e.targetNationId === "norvia",
    );
    expect(otherEntry).toBe(originalEntry);
  });

  it("nations reference preserved", () => {
    const original = validState();
    const result = setNationRegimePressure(original, "solaris", "dravos", 20);
    expect(result.world.nations).toBe(original.world.nations);
  });

  it("map reference preserved", () => {
    const original = validState();
    const result = setNationRegimePressure(original, "solaris", "dravos", 20);
    expect(result.world.map).toBe(original.world.map);
  });

  it("regionOwnership reference preserved", () => {
    const original = validState();
    const result = setNationRegimePressure(original, "solaris", "dravos", 20);
    expect(result.world.regionOwnership).toBe(original.world.regionOwnership);
  });

  it("strategic stats reference preserved", () => {
    const original = validState();
    const result = setNationRegimePressure(original, "solaris", "dravos", 20);
    expect(result.world.nationStrategicStats).toBe(original.world.nationStrategicStats);
  });

  it("influence reference preserved", () => {
    const original = validState();
    const result = setNationRegimePressure(original, "solaris", "dravos", 20);
    expect(result.world.nationInfluence).toBe(original.world.nationInfluence);
  });

  it("diplomacy reference preserved", () => {
    const original = validState();
    const result = setNationRegimePressure(original, "solaris", "dravos", 20);
    expect(result.world.diplomaticRelationships).toBe(original.world.diplomaticRelationships);
  });

  it("proxyConflicts reference preserved", () => {
    const original = validState();
    const result = setNationRegimePressure(original, "solaris", "dravos", 20);
    expect(result.world.proxyConflicts).toBe(original.world.proxyConflicts);
  });

  it("PlanningState reference preserved", () => {
    const original = validState();
    const result = setNationRegimePressure(original, "solaris", "dravos", 20);
    expect(result.planning).toBe(original.planning);
  });

  it("IntelligenceState reference preserved", () => {
    const original = validState();
    const result = setNationRegimePressure(original, "solaris", "dravos", 20);
    expect(result.intelligence).toBe(original.intelligence);
  });

  it("turn/phase/playerNationId unchanged", () => {
    const original = validState();
    const result = setNationRegimePressure(original, "solaris", "dravos", 20);
    expect(result.turn).toBe(original.turn);
    expect(result.phase).toBe(original.phase);
    expect(result.playerNationId).toBe(original.playerNationId);
  });

  it("ordering preserved", () => {
    const original = validState();
    const result = setNationRegimePressure(original, "solaris", "dravos", 20);
    expect(result.world.nationRegimePressure.length).toBe(original.world.nationRegimePressure.length);
    for (let i = 0; i < result.world.nationRegimePressure.length; i++) {
      expect(result.world.nationRegimePressure[i].sourceNationId).toBe(
        original.world.nationRegimePressure[i].sourceNationId,
      );
      expect(result.world.nationRegimePressure[i].targetNationId).toBe(
        original.world.nationRegimePressure[i].targetNationId,
      );
    }
  });

  it("same value exact GameState no-op", () => {
    const original = validState();
    const result = setNationRegimePressure(original, "solaris", "dravos", 0);
    expect(result).toBe(original);
  });

  it("unknown source failure", () => {
    const state = validState();
    expect(() => setNationRegimePressure(state, "nonexistent", "dravos", 20)).toThrow(UnknownNationError);
  });

  it("unknown target failure", () => {
    const state = validState();
    expect(() => setNationRegimePressure(state, "solaris", "nonexistent", 20)).toThrow(UnknownNationError);
  });

  it("self failure", () => {
    const state = validState();
    expect(() => setNationRegimePressure(state, "solaris", "solaris", 20)).toThrow(SelfNationRegimePressureError);
  });

  it("missing entry failure", () => {
    const state = validState();
    const bad = { ...state, world: { ...state.world, nationRegimePressure: [] } };
    expect(() => setNationRegimePressure(bad, "solaris", "dravos", 20)).toThrow(MissingNationRegimePressureError);
  });

  it("fractional runtime value failure", () => {
    const state = validState();
    expect(() => setNationRegimePressure(state, "solaris", "dravos", 10.5)).toThrow(
      InvalidNationRegimePressureValueError,
    );
  });

  it("below 0 failure", () => {
    const state = validState();
    expect(() => setNationRegimePressure(state, "solaris", "dravos", -1)).toThrow(
      InvalidNationRegimePressureValueError,
    );
  });

  it("above 100 failure", () => {
    const state = validState();
    expect(() => setNationRegimePressure(state, "solaris", "dravos", 101)).toThrow(
      InvalidNationRegimePressureValueError,
    );
  });

  it("malformed input GameState fails closed", () => {
    const state = validState();
    const bad = {
      ...state,
      world: {
        ...state.world,
        nationRegimePressure: "not-an-array",
      },
    };
    expect(() => validateGameState(bad as never)).toThrow();
  });

  it("successful result validates", () => {
    const state = validState();
    const result = setNationRegimePressure(state, "solaris", "dravos", 50);
    expect(() => validateGameState(result)).not.toThrow();
  });
});

// ============================================================
// GAMEPLAY TESTS
// ============================================================

describe("APPLY REGIME PRESSURE: BASIC SUCCESS", () => {
  it("successful 0 -> 20 pressure", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    const result = applyRegimePressure(state, "solaris", "dravos");
    expect(getNationRegimePressure(result.state.world, "solaris", "dravos").value).toBe(20);
  });

  it("successful 90 -> 100 pressure", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    state = setNationRegimePressure(state, "solaris", "dravos", 90);
    const result = applyRegimePressure(state, "solaris", "dravos");
    expect(getNationRegimePressure(result.state.world, "solaris", "dravos").value).toBe(100);
  });

  it("pressure already 100 fails", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    state = setNationRegimePressure(state, "solaris", "dravos", 100);
    expect(() => applyRegimePressure(state, "solaris", "dravos")).toThrow(MaximumNationRegimePressureError);
  });

  it("exact 3 AP cost", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    const result = applyRegimePressure(state, "solaris", "dravos");
    expect(result.event.actionPointCost).toBe(APPLY_REGIME_PRESSURE_AP_COST);
  });

  it("exact event", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    state = setNationRegimePressure(state, "solaris", "dravos", 10);
    state = setNationStrategicStat(state, "dravos", "stability", 60);
    const result = applyRegimePressure(state, "solaris", "dravos");
    expect(result.event).toEqual({
      type: "regime-pressure-applied",
      turn: state.turn,
      actorNationId: "solaris",
      targetNationId: "dravos",
      previousPressure: 10,
      newPressure: 30,
      previousStability: 60,
      newStability: 55,
      actionPointCost: APPLY_REGIME_PRESSURE_AP_COST,
    });
  });

  it("event determinism", () => {
    const a = setupForPressure("solaris", "dravos", 50, "neutral");
    const b = setupForPressure("solaris", "dravos", 50, "neutral");
    const eventA = applyRegimePressure(a, "solaris", "dravos").event;
    const eventB = applyRegimePressure(b, "solaris", "dravos").event;
    expect(eventA).toEqual(eventB);
  });
});

describe("APPLY REGIME PRESSURE: INFLUENCE", () => {
  it("influence exactly 40 succeeds", () => {
    const state = setupForPressure("solaris", "dravos", 40, "neutral");
    expect(() => applyRegimePressure(state, "solaris", "dravos")).not.toThrow();
  });

  it("influence 39 fails", () => {
    const state = setupForPressure("solaris", "dravos", 39, "neutral");
    expect(() => applyRegimePressure(state, "solaris", "dravos")).toThrow(InsufficientPoliticalInfluenceError);
  });

  it("insufficient influence spends no AP", () => {
    const state = setupForPressure("solaris", "dravos", 39, "neutral");
    expect(() => applyRegimePressure(state, "solaris", "dravos")).toThrow(InsufficientPoliticalInfluenceError);
    expect(
      state.planning.actionPoints.find((a) => a.nationId === "solaris")!.remaining,
    ).toBe(6);
  });
});

describe("APPLY REGIME PRESSURE: DIPLOMACY", () => {
  it("neutral succeeds", () => {
    const state = setupForPressure("solaris", "dravos", 50, "neutral");
    expect(() => applyRegimePressure(state, "solaris", "dravos")).not.toThrow();
  });

  it("hostile succeeds", () => {
    const state = setupForPressure("solaris", "dravos", 50, "hostile");
    expect(() => applyRegimePressure(state, "solaris", "dravos")).not.toThrow();
  });

  it("friendly fails", () => {
    let state = validState();
    state = setDiplomaticStatus(state, "solaris", "dravos", "friendly");
    state = setNationInfluence(state, "solaris", "dravos", 50);
    expect(() => applyRegimePressure(state, "solaris", "dravos")).toThrow(FriendlyDiplomaticRelationshipError);
  });

  it("friendly failure spends no AP", () => {
    let state = validState();
    state = setDiplomaticStatus(state, "solaris", "dravos", "friendly");
    state = setNationInfluence(state, "solaris", "dravos", 50);
    expect(() => applyRegimePressure(state, "solaris", "dravos")).toThrow(FriendlyDiplomaticRelationshipError);
    expect(
      state.planning.actionPoints.find((a) => a.nationId === "solaris")!.remaining,
    ).toBe(6);
  });
});

describe("APPLY REGIME PRESSURE: STABILITY", () => {
  it("decreases exactly 5", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    state = setNationStrategicStat(state, "dravos", "stability", 60);
    const result = applyRegimePressure(state, "solaris", "dravos");
    expect(getNationStrategicStats(result.state.world, "dravos").stability).toBe(55);
  });

  it("value below 5 floors at 0", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    state = setNationStrategicStat(state, "dravos", "stability", 3);
    const result = applyRegimePressure(state, "solaris", "dravos");
    expect(getNationStrategicStats(result.state.world, "dravos").stability).toBe(0);
  });
});

describe("APPLY REGIME PRESSURE: IDENTITY/DATA ERRORS", () => {
  it("unknown actor", () => {
    const state = validState();
    expect(() => applyRegimePressure(state, "nonexistent", "dravos")).toThrow(UnknownNationError);
  });

  it("unknown target", () => {
    const state = validState();
    expect(() => applyRegimePressure(state, "solaris", "nonexistent")).toThrow(UnknownNationError);
  });

  it("self target", () => {
    const state = validState();
    expect(() => applyRegimePressure(state, "solaris", "solaris")).toThrow(SelfTargetPoliticalOperationError);
  });

  it("missing influence", () => {
    const state = validState();
    const world = {
      ...state.world,
      nationInfluence: state.world.nationInfluence.filter(
        (e) => !(e.influencerNationId === "solaris" && e.targetNationId === "dravos"),
      ),
    };
    const bad = { ...state, world };
    expect(() => applyRegimePressure(bad, "solaris", "dravos")).toThrow(MissingNationInfluenceError);
  });

  it("missing diplomacy", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "dravos", 50);
    const world = {
      ...state.world,
      diplomaticRelationships: state.world.diplomaticRelationships.filter((e) => {
        return !(
          (e.nationAId === "solaris" && e.nationBId === "dravos") ||
          (e.nationAId === "dravos" && e.nationBId === "solaris")
        );
      }),
    };
    const bad = { ...state, world };
    expect(() => applyRegimePressure(bad, "solaris", "dravos")).toThrow(MissingDiplomaticRelationshipError);
  });

  it("missing strategic stats", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    const world = {
      ...state.world,
      nationStrategicStats: state.world.nationStrategicStats.filter((s) => s.nationId !== "dravos"),
    };
    const bad = { ...state, world };
    expect(() => applyRegimePressure(bad, "solaris", "dravos")).toThrow();
  });
});

describe("APPLY REGIME PRESSURE: EXECUTION ERRORS", () => {
  it("invalid phase", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    const bad = { ...state, phase: "resolution" as const };
    expect(() => applyRegimePressure(bad, "solaris", "dravos")).toThrow();
  });

  it("insufficient AP", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    state = {
      ...state,
      planning: {
        actionPoints: state.planning.actionPoints.map((a) =>
          a.nationId === "solaris"
            ? { ...a, remaining: 1 }
            : a,
        ),
      },
    };
    expect(() => applyRegimePressure(state, "solaris", "dravos")).toThrow(InsufficientActionPointsError);
  });

  it("maximum pressure", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    state = setNationRegimePressure(state, "solaris", "dravos", 100);
    expect(() => applyRegimePressure(state, "solaris", "dravos")).toThrow(MaximumNationRegimePressureError);
  });
});

describe("APPLY REGIME PRESSURE: ATOMICITY", () => {
  it("representative failure leaves original state unchanged", () => {
    const state = setupForPressure("solaris", "dravos", 39, "neutral");
    const snapshot = JSON.parse(JSON.stringify(state));
    try {
      applyRegimePressure(state, "solaris", "dravos");
    } catch {
      // expected
    }
    expect(state).toEqual(snapshot);
  });
});

// ============================================================
// SEPARATION TESTS
// ============================================================

describe("APPLY REGIME PRESSURE: SEPARATION", () => {
  it("publicSupport unchanged", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    const before = getNationStrategicStats(state.world, "dravos").publicSupport;
    const result = applyRegimePressure(state, "solaris", "dravos");
    expect(getNationStrategicStats(result.state.world, "dravos").publicSupport).toBe(before);
  });

  it("internalSecurity unchanged", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    const before = getNationStrategicStats(state.world, "dravos").internalSecurity;
    const result = applyRegimePressure(state, "solaris", "dravos");
    expect(getNationStrategicStats(result.state.world, "dravos").internalSecurity).toBe(before);
  });

  it("NationInfluence unchanged", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    const before = getNationInfluence(state.world, "solaris", "dravos").value;
    const result = applyRegimePressure(state, "solaris", "dravos");
    expect(getNationInfluence(result.state.world, "solaris", "dravos").value).toBe(before);
  });

  it("diplomaticRelationships unchanged", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    const before = getDiplomaticRelationship(state.world, "solaris", "dravos").status;
    const result = applyRegimePressure(state, "solaris", "dravos");
    expect(getDiplomaticRelationship(result.state.world, "solaris", "dravos").status).toBe(before);
  });

  it("proxyConflicts unchanged", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    const result = applyRegimePressure(state, "solaris", "dravos");
    expect(result.state.world.proxyConflicts).toEqual(state.world.proxyConflicts);
  });

  it("regionOwnership unchanged", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    const result = applyRegimePressure(state, "solaris", "dravos");
    expect(result.state.world.regionOwnership).toEqual(state.world.regionOwnership);
  });

  it("IntelligenceState unchanged", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    const result = applyRegimePressure(state, "solaris", "dravos");
    expect(result.state.intelligence).toBe(state.intelligence);
  });
});

// ============================================================
// TURN PERSISTENCE TESTS
// ============================================================

describe("PERSISTENCE ACROSS RESOLVETURN", () => {
  it("pressure survives resolveTurn", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    state = applyRegimePressure(state, "solaris", "dravos").state;
    const { state: next } = resolveTurn(state, []);
    expect(getNationRegimePressure(next.world, "solaris", "dravos").value).toBe(20);
  });

  it("nationRegimePressure array reference preserved", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    state = applyRegimePressure(state, "solaris", "dravos").state;
    const { state: next } = resolveTurn(state, []);
    expect(next.world.nationRegimePressure).toBe(state.world.nationRegimePressure);
  });

  it("changed stability survives resolveTurn", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    state = applyRegimePressure(state, "solaris", "dravos").state;
    const stabilityAfter = getNationStrategicStats(state.world, "dravos").stability;
    const { state: next } = resolveTurn(state, []);
    expect(getNationStrategicStats(next.world, "dravos").stability).toBe(stabilityAfter);
  });

  it("AP resets", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    state = applyRegimePressure(state, "solaris", "dravos").state;
    const { state: next } = resolveTurn(state, []);
    expect(next.planning.actionPoints.find((a) => a.nationId === "solaris")!.remaining).toBe(6);
  });

  it("TurnAdvancedEvent unchanged", () => {
    let state = setupForPressure("solaris", "dravos", 50, "neutral");
    state = applyRegimePressure(state, "solaris", "dravos").state;
    const { result } = resolveTurn(state, []);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].type).toBe("turn-advanced");
  });
});
