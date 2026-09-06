import { describe, it, expect } from "vitest";
import {
  createInitialPlanningState,
  getNationActionPoints,
  MissingNationActionPointsError,
  ACTION_POINTS_PER_TURN,
} from "../../src/core/model/actionPoints";
import type { PlanningState } from "../../src/core/model/actionPoints";
import { createInitialGameState } from "../../src/core/model/gameState";
import type { GameState } from "../../src/core/model/gameState";
import { validateGameState, GameStateValidationError } from "../../src/core/simulation/validateGameState";
import { validatePlanningState, PlanningValidationError } from "../../src/core/simulation/validatePlanningState";
import { UnknownNationError } from "../../src/core/model/worldState";
import { spendActionPoints, InvalidActionPointAmountError, InsufficientActionPointsError } from "../../src/core/simulation/spendActionPoints";
import { InvalidPhaseError } from "../../src/core/simulation/resolveTurn";
import { resetActionPointsForNewTurn } from "../../src/core/simulation/resetActionPointsForNewTurn";
import { resolveTurn } from "../../src/core/simulation/resolveTurn";
import type { TurnOrder } from "../../src/core/model/turnOrder";

const CANONICAL_NATION_IDS = [
  "solaris",
  "dravos",
  "norvia",
  "veloria",
  "karsen",
  "arkania",
];

function validState(): GameState {
  return createInitialGameState();
}

function passOrder(id: string, nationId = "solaris"): TurnOrder {
  return { id, nationId, kind: "pass" };
}

describe("1. canonical initial state has 6 AP entries", () => {
  it("1.1 has exactly 6 entries", () => {
    const state = validState();
    expect(state.planning.actionPoints).toHaveLength(6);
  });
});

describe("2. AP entry order matches canonical nation order", () => {
  it("2.1 order matches", () => {
    const state = validState();
    const ids = state.planning.actionPoints.map((ap) => ap.nationId);
    expect(ids).toEqual(CANONICAL_NATION_IDS);
  });
});

describe("3. every initial nation has maximum 6", () => {
  it("3.1 all maximums are 6", () => {
    const state = validState();
    for (const ap of state.planning.actionPoints) {
      expect(ap.maximum).toBe(ACTION_POINTS_PER_TURN);
    }
  });
});

describe("4. every initial nation has remaining 6", () => {
  it("4.1 all remaining are 6", () => {
    const state = validState();
    for (const ap of state.planning.actionPoints) {
      expect(ap.remaining).toBe(ACTION_POINTS_PER_TURN);
    }
  });
});

describe("5. repeated initial PlanningState creation is deeply equal", () => {
  it("5.1 two separate calls produce equal results", () => {
    const a = createInitialPlanningState(validState().world.nations);
    const b = createInitialPlanningState(validState().world.nations);
    expect(a).toEqual(b);
  });
});

describe("6. separate creation does not share actionPoints array", () => {
  it("6.1 different references", () => {
    const a = createInitialPlanningState(validState().world.nations);
    const b = createInitialPlanningState(validState().world.nations);
    expect(a.actionPoints).not.toBe(b.actionPoints);
  });
});

describe("7. initial GameState passes updated validateGameState", () => {
  it("7.1 no throw", () => {
    const state = validState();
    expect(() => validateGameState(state)).not.toThrow();
  });
});

describe("8. duplicate nation AP entry fails", () => {
  it("8.1 duplicate fails", () => {
    const state = validState();
    const badPlanning: PlanningState = {
      actionPoints: [
        ...state.planning.actionPoints,
        { nationId: "solaris", maximum: 6, remaining: 6 },
      ],
    };
    const badState: GameState = { ...state, planning: badPlanning };
    expect(() => validatePlanningState(badState)).toThrow(PlanningValidationError);
    expect(() => validatePlanningState(badState)).toThrow(
      'Duplicate action point entry for nation: "solaris"',
    );
  });
});

describe("9. unknown nation AP entry fails", () => {
  it("9.1 unknown nation fails", () => {
    const state = validState();
    const badPlanning: PlanningState = {
      actionPoints: [
        ...state.planning.actionPoints,
        { nationId: "nonexistent", maximum: 6, remaining: 6 },
      ],
    };
    const badState: GameState = { ...state, planning: badPlanning };
    expect(() => validatePlanningState(badState)).toThrow(PlanningValidationError);
    expect(() => validatePlanningState(badState)).toThrow(
      'Action point entry references unknown nation: "nonexistent"',
    );
  });
});

describe("10. missing nation AP entry fails", () => {
  it("10.1 missing entry fails", () => {
    const state = validState();
    const badPlanning: PlanningState = {
      actionPoints: state.planning.actionPoints.filter(
        (ap) => ap.nationId !== "solaris",
      ),
    };
    const badState: GameState = { ...state, planning: badPlanning };
    expect(() => validatePlanningState(badState)).toThrow(PlanningValidationError);
    expect(() => validatePlanningState(badState)).toThrow(
      'Missing action point entry for nation: "solaris"',
    );
  });
});

describe("11. fractional maximum fails", () => {
  it("11.1 fractional fails", () => {
    const state = validState();
    const badPlanning: PlanningState = {
      actionPoints: state.planning.actionPoints.map((ap) =>
        ap.nationId === "solaris" ? { ...ap, maximum: 1.5 } : ap,
      ),
    };
    const badState: GameState = { ...state, planning: badPlanning };
    expect(() => validatePlanningState(badState)).toThrow(PlanningValidationError);
    expect(() => validatePlanningState(badState)).toThrow(
      'Invalid maximum action points for nation "solaris": expected integer, got 1.5',
    );
  });
});

describe("12. negative maximum fails", () => {
  it("12.1 negative fails", () => {
    const state = validState();
    const badPlanning: PlanningState = {
      actionPoints: state.planning.actionPoints.map((ap) =>
        ap.nationId === "solaris" ? { ...ap, maximum: -1 } : ap,
      ),
    };
    const badState: GameState = { ...state, planning: badPlanning };
    expect(() => validatePlanningState(badState)).toThrow(PlanningValidationError);
    expect(() => validatePlanningState(badState)).toThrow(
      'Invalid maximum action points for nation "solaris": expected >= 0, got -1',
    );
  });
});

describe("13. fractional remaining fails", () => {
  it("13.1 fractional fails", () => {
    const state = validState();
    const badPlanning: PlanningState = {
      actionPoints: state.planning.actionPoints.map((ap) =>
        ap.nationId === "solaris" ? { ...ap, remaining: 2.5 } : ap,
      ),
    };
    const badState: GameState = { ...state, planning: badPlanning };
    expect(() => validatePlanningState(badState)).toThrow(PlanningValidationError);
    expect(() => validatePlanningState(badState)).toThrow(
      'Invalid remaining action points for nation "solaris": expected integer, got 2.5',
    );
  });
});

describe("14. negative remaining fails", () => {
  it("14.1 negative fails", () => {
    const state = validState();
    const badPlanning: PlanningState = {
      actionPoints: state.planning.actionPoints.map((ap) =>
        ap.nationId === "solaris" ? { ...ap, remaining: -1 } : ap,
      ),
    };
    const badState: GameState = { ...state, planning: badPlanning };
    expect(() => validatePlanningState(badState)).toThrow(PlanningValidationError);
    expect(() => validatePlanningState(badState)).toThrow(
      'Invalid remaining action points for nation "solaris": expected >= 0, got -1',
    );
  });
});

describe("15. remaining greater than maximum fails", () => {
  it("15.1 exceeds maximum fails", () => {
    const state = validState();
    const badPlanning: PlanningState = {
      actionPoints: state.planning.actionPoints.map((ap) =>
        ap.nationId === "solaris" ? { ...ap, remaining: 7 } : ap,
      ),
    };
    const badState: GameState = { ...state, planning: badPlanning };
    expect(() => validatePlanningState(badState)).toThrow(PlanningValidationError);
    expect(() => validatePlanningState(badState)).toThrow(
      'Remaining action points exceeds maximum for nation "solaris": 7 > 6',
    );
  });
});

describe("16. maximum zero with remaining zero is structurally valid", () => {
  it("16.1 zero/zero passes", () => {
    const state = validState();
    const planning: PlanningState = {
      actionPoints: state.planning.actionPoints.map((ap) =>
        ap.nationId === "solaris" ? { ...ap, maximum: 0, remaining: 0 } : ap,
      ),
    };
    const testState: GameState = { ...state, planning };
    expect(() => validatePlanningState(testState)).not.toThrow();
  });
});

describe("17. Solaris AP lookup returns correct entry", () => {
  it("17.1 lookup succeeds", () => {
    const state = validState();
    const ap = getNationActionPoints(state, "solaris");
    expect(ap.nationId).toBe("solaris");
    expect(ap.maximum).toBe(6);
    expect(ap.remaining).toBe(6);
  });
});

describe("18. unknown nation fails explicitly", () => {
  it("18.1 unknown fails", () => {
    const state = validState();
    expect(() => getNationActionPoints(state, "nonexistent")).toThrow(
      UnknownNationError,
    );
    expect(() => getNationActionPoints(state, "nonexistent")).toThrow(
      'Unknown nation: "nonexistent"',
    );
  });
});

describe("19. existing nation missing AP entry fails explicitly", () => {
  it("19.1 missing entry fails", () => {
    const state = validState();
    const badPlanning: PlanningState = {
      actionPoints: state.planning.actionPoints.filter(
        (ap) => ap.nationId !== "solaris",
      ),
    };
    const badState: GameState = { ...state, planning: badPlanning };
    expect(() => getNationActionPoints(badState, "solaris")).toThrow(
      MissingNationActionPointsError,
    );
    expect(() => getNationActionPoints(badState, "solaris")).toThrow(
      'Missing action points for nation: "solaris"',
    );
  });
});

describe("20. Solaris spends 1 AP: 6 -> 5", () => {
  it("20.1 spends 1", () => {
    const state = validState();
    const next = spendActionPoints(state, "solaris", 1);
    const ap = getNationActionPoints(next, "solaris");
    expect(ap.remaining).toBe(5);
  });
});

describe("21. Solaris spends 2 AP: 6 -> 4", () => {
  it("21.1 spends 2", () => {
    const state = validState();
    const next = spendActionPoints(state, "solaris", 2);
    const ap = getNationActionPoints(next, "solaris");
    expect(ap.remaining).toBe(4);
  });
});

describe("22. sequential immutable spends behave correctly", () => {
  it("22.1 sequential spends", () => {
    const state = validState();
    const s1 = spendActionPoints(state, "solaris", 1);
    const s2 = spendActionPoints(s1, "solaris", 2);
    const ap = getNationActionPoints(s2, "solaris");
    expect(ap.remaining).toBe(3);
  });
});

describe("23. spend exact remaining amount reaches zero", () => {
  it("23.1 exact spend", () => {
    const state = validState();
    const next = spendActionPoints(state, "solaris", 6);
    const ap = getNationActionPoints(next, "solaris");
    expect(ap.remaining).toBe(0);
  });
});

describe("24. spending more than remaining fails", () => {
  it("24.1 insufficient fails", () => {
    const state = validState();
    expect(() => spendActionPoints(state, "solaris", 7)).toThrow(
      InsufficientActionPointsError,
    );
    expect(() => spendActionPoints(state, "solaris", 7)).toThrow(
      'Insufficient action points for nation "solaris": required 7, available 6',
    );
  });
});

describe("25. spending zero fails", () => {
  it("25.1 zero fails", () => {
    const state = validState();
    expect(() => spendActionPoints(state, "solaris", 0)).toThrow(
      InvalidActionPointAmountError,
    );
    expect(() => spendActionPoints(state, "solaris", 0)).toThrow(
      "Invalid action point amount: expected integer >= 1, got 0",
    );
  });
});

describe("26. spending negative amount fails", () => {
  it("26.1 negative fails", () => {
    const state = validState();
    expect(() => spendActionPoints(state, "solaris", -1)).toThrow(
      InvalidActionPointAmountError,
    );
  });
});

describe("27. spending fractional amount fails", () => {
  it("27.1 fractional fails", () => {
    const state = validState();
    expect(() => spendActionPoints(state, "solaris", 1.5)).toThrow(
      InvalidActionPointAmountError,
    );
  });
});

describe("28. spending in resolution phase fails", () => {
  it("28.1 resolution phase fails", () => {
    const state = validState();
    const resolutionState: GameState = { ...state, phase: "resolution" };
    expect(() => spendActionPoints(resolutionState, "solaris", 1)).toThrow(
      InvalidPhaseError,
    );
    expect(() => spendActionPoints(resolutionState, "solaris", 1)).toThrow(
      'Invalid phase: expected "planning", got "resolution"',
    );
  });
});

describe("29. unknown nation fails", () => {
  it("29.1 unknown fails", () => {
    const state = validState();
    expect(() => spendActionPoints(state, "nonexistent", 1)).toThrow(
      UnknownNationError,
    );
    expect(() => spendActionPoints(state, "nonexistent", 1)).toThrow(
      'Unknown nation: "nonexistent"',
    );
  });
});

describe("30. missing AP entry fails", () => {
  it("30.1 missing fails", () => {
    const state = validState();
    const badPlanning: PlanningState = {
      actionPoints: state.planning.actionPoints.filter(
        (ap) => ap.nationId !== "solaris",
      ),
    };
    const badState: GameState = { ...state, planning: badPlanning };
    expect(() => spendActionPoints(badState, "solaris", 1)).toThrow(
      MissingNationActionPointsError,
    );
    expect(() => spendActionPoints(badState, "solaris", 1)).toThrow(
      'Missing action points for nation: "solaris"',
    );
  });
});

describe("31. invalid input GameState fails closed", () => {
  it("31.1 bad turn fails", () => {
    const badState = { ...validState(), turn: 0 };
    expect(() => spendActionPoints(badState, "solaris", 1)).toThrow(
      GameStateValidationError,
    );
  });
});

describe("32. original GameState not mutated", () => {
  it("32.1 original unchanged", () => {
    const state = validState();
    const snapshot = JSON.parse(JSON.stringify(state));
    spendActionPoints(state, "solaris", 2);
    expect(state).toEqual(snapshot);
  });
});

describe("33. original PlanningState not mutated", () => {
  it("33.1 planning unchanged", () => {
    const state = validState();
    const planningSnapshot = JSON.parse(JSON.stringify(state.planning));
    spendActionPoints(state, "solaris", 2);
    expect(state.planning).toEqual(planningSnapshot);
  });
});

describe("34. original AP array not mutated", () => {
  it("34.1 array unchanged", () => {
    const state = validState();
    const arraySnapshot = JSON.parse(
      JSON.stringify(state.planning.actionPoints),
    );
    spendActionPoints(state, "solaris", 2);
    expect(state.planning.actionPoints).toEqual(arraySnapshot);
  });
});

describe("35. unchanged nation AP entries preserved", () => {
  it("35.1 other entries unchanged", () => {
    const state = validState();
    const next = spendActionPoints(state, "solaris", 2);
    for (const ap of state.planning.actionPoints) {
      if (ap.nationId === "solaris") continue;
      const nextAp = next.planning.actionPoints.find(
        (a) => a.nationId === ap.nationId,
      );
      expect(nextAp?.remaining).toBe(ap.remaining);
      expect(nextAp?.maximum).toBe(ap.maximum);
    }
  });
});

describe("36. world reference preserved", () => {
  it("36.1 world same reference", () => {
    const state = validState();
    const next = spendActionPoints(state, "solaris", 2);
    expect(next.world).toBe(state.world);
  });
});

describe("37. turn unchanged", () => {
  it("37.1 turn same", () => {
    const state = validState();
    const next = spendActionPoints(state, "solaris", 2);
    expect(next.turn).toBe(state.turn);
  });
});

describe("38. phase unchanged", () => {
  it("38.1 phase same", () => {
    const state = validState();
    const next = spendActionPoints(state, "solaris", 2);
    expect(next.phase).toBe(state.phase);
  });
});

describe("39. playerNationId unchanged", () => {
  it("39.1 playerNationId same", () => {
    const state = validState();
    const next = spendActionPoints(state, "solaris", 2);
    expect(next.playerNationId).toBe(state.playerNationId);
  });
});

describe("40. successful result passes validateGameState", () => {
  it("40.1 passes validation", () => {
    const state = validState();
    const next = spendActionPoints(state, "solaris", 2);
    expect(() => validateGameState(next)).not.toThrow();
  });
});

describe("41. spent Solaris AP resets to maximum after resolveTurn", () => {
  it("41.1 reset works", () => {
    const state = validState();
    const spent = spendActionPoints(state, "solaris", 4);
    const { state: next } = resolveTurn(spent, [passOrder("o1")]);
    const ap = getNationActionPoints(next, "solaris");
    expect(ap.remaining).toBe(ACTION_POINTS_PER_TURN);
  });
});

describe("42. multiple nations' spent AP all reset after resolveTurn", () => {
  it("42.1 all reset", () => {
    const state = validState();
    let spent = spendActionPoints(state, "solaris", 3);
    spent = spendActionPoints(spent, "dravos", 2);
    spent = spendActionPoints(spent, "norvia", 6);
    const { state: next } = resolveTurn(spent, [passOrder("o1")]);
    expect(getNationActionPoints(next, "solaris").remaining).toBe(6);
    expect(getNationActionPoints(next, "dravos").remaining).toBe(6);
    expect(getNationActionPoints(next, "norvia").remaining).toBe(6);
  });
});

describe("43. maximum values are preserved during reset", () => {
  it("43.1 maximum unchanged", () => {
    const state = validState();
    const spent = spendActionPoints(state, "solaris", 4);
    const { state: next } = resolveTurn(spent, [passOrder("o1")]);
    for (const ap of next.planning.actionPoints) {
      expect(ap.maximum).toBe(ACTION_POINTS_PER_TURN);
    }
  });
});

describe("44. reset preserves AP-entry ordering", () => {
  it("44.1 ordering preserved", () => {
    const state = validState();
    const spent = spendActionPoints(state, "solaris", 4);
    const { state: next } = resolveTurn(spent, [passOrder("o1")]);
    const ids = next.planning.actionPoints.map((ap) => ap.nationId);
    expect(ids).toEqual(CANONICAL_NATION_IDS);
  });
});

describe("45. resolveTurn does not mutate original planning state", () => {
  it("45.1 original unchanged", () => {
    const state = validState();
    const spent = spendActionPoints(state, "solaris", 4);
    const planningSnapshot = JSON.parse(JSON.stringify(spent.planning));
    resolveTurn(spent, [passOrder("o1")]);
    expect(spent.planning).toEqual(planningSnapshot);
  });
});

describe("46. fresh fully-funded planning state remains logically identical", () => {
  it("46.1 no-op reset", () => {
    const state = validState();
    const reset = resetActionPointsForNewTurn(state.planning);
    expect(reset).toBe(state.planning);
  });
});

describe("47. next turn still increments exactly once", () => {
  it("47.1 turn increments", () => {
    const state = validState();
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    expect(next.turn).toBe(2);
  });
});

describe("48. world remains preserved", () => {
  it("48.1 world same reference", () => {
    const state = validState();
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    expect(next.world).toBe(state.world);
  });
});

describe("49. existing ownership remains preserved", () => {
  it("49.1 ownership preserved", () => {
    const state = validState();
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    expect(next.world.regionOwnership).toEqual(state.world.regionOwnership);
  });
});

describe("50. all G0 tests remain passing", () => {
  it("50.1 G0 invariants intact", () => {
    const state = validState();
    expect(state.turn).toBe(1);
    expect(state.phase).toBe("planning");
    expect(state.playerNationId).toBe("solaris");
    expect(state.world.nations).toHaveLength(6);
    expect(state.world.map.regions).toHaveLength(18);
    expect(state.world.map.connections).toHaveLength(30);
    expect(state.world.regionOwnership).toHaveLength(18);
    expect(() => validateGameState(state)).not.toThrow();
  });
});

describe("51. getNationActionPoints: unknown nation throws UnknownNationError", () => {
  it("51.1 unknown nation throws UnknownNationError", () => {
    const state = validState();
    expect(() => getNationActionPoints(state, "nonexistent")).toThrow(
      UnknownNationError,
    );
    expect(() => getNationActionPoints(state, "nonexistent")).toThrow(
      'Unknown nation: "nonexistent"',
    );
  });
});

describe("52. getNationActionPoints: existing nation missing AP throws MissingNationActionPointsError", () => {
  it("52.1 missing AP entry throws MissingNationActionPointsError", () => {
    const state = validState();
    const badPlanning: PlanningState = {
      actionPoints: state.planning.actionPoints.filter(
        (ap) => ap.nationId !== "solaris",
      ),
    };
    const badState: GameState = { ...state, planning: badPlanning };
    expect(() => getNationActionPoints(badState, "solaris")).toThrow(
      MissingNationActionPointsError,
    );
    expect(() => getNationActionPoints(badState, "solaris")).toThrow(
      'Missing action points for nation: "solaris"',
    );
  });
});

describe("53. getNationActionPoints: the two errors are not interchangeable", () => {
  it("53.1 UnknownNationError is not MissingNationActionPointsError", () => {
    expect(UnknownNationError).not.toBe(MissingNationActionPointsError);
  });

  it("53.2 unknown nation does NOT throw MissingNationActionPointsError", () => {
    const state = validState();
    expect(() => getNationActionPoints(state, "nonexistent")).not.toThrow(
      MissingNationActionPointsError,
    );
  });

  it("53.3 missing AP entry does NOT throw UnknownNationError", () => {
    const state = validState();
    const badPlanning: PlanningState = {
      actionPoints: state.planning.actionPoints.filter(
        (ap) => ap.nationId !== "solaris",
      ),
    };
    const badState: GameState = { ...state, planning: badPlanning };
    expect(() => getNationActionPoints(badState, "solaris")).not.toThrow(
      UnknownNationError,
    );
  });
});

describe("54. spendActionPoints: unknown nation throws UnknownNationError", () => {
  it("54.1 unknown nation throws UnknownNationError", () => {
    const state = validState();
    expect(() => spendActionPoints(state, "nonexistent", 1)).toThrow(
      UnknownNationError,
    );
    expect(() => spendActionPoints(state, "nonexistent", 1)).toThrow(
      'Unknown nation: "nonexistent"',
    );
  });
});

describe("55. spendActionPoints: existing nation with missing AP throws MissingNationActionPointsError", () => {
  it("55.1 missing AP entry throws MissingNationActionPointsError", () => {
    const state = validState();
    const badPlanning: PlanningState = {
      actionPoints: state.planning.actionPoints.filter(
        (ap) => ap.nationId !== "solaris",
      ),
    };
    const badState: GameState = { ...state, planning: badPlanning };
    expect(() => spendActionPoints(badState, "solaris", 1)).toThrow(
      MissingNationActionPointsError,
    );
    expect(() => spendActionPoints(badState, "solaris", 1)).toThrow(
      'Missing action points for nation: "solaris"',
    );
  });
});
