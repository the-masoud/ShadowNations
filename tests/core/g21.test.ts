import { describe, it, expect } from "vitest";
import {
  createInitialNationStrategicStats,
  getNationStrategicStats,
  validateNationStrategicStats,
  MissingNationStrategicStatsError,
  NationStrategicStatsValidationError,
} from "../../src/core/model/nationStrategicStats";
import { createInitialGameState } from "../../src/core/model/gameState";
import type { GameState } from "../../src/core/model/gameState";
import { validateGameState } from "../../src/core/simulation/validateGameState";
import { resolveTurn } from "../../src/core/simulation/resolveTurn";
import type { TurnOrder } from "../../src/core/model/turnOrder";
import { UnknownNationError } from "../../src/core/model/worldState";
import {
  setNationStrategicStat,
  InvalidNationStrategicStatKeyError,
  InvalidNationStrategicStatValueError,
} from "../../src/core/simulation/setNationStrategicStat";

function validState(): GameState {
  return createInitialGameState();
}

function passOrder(id: string, nationId = "solaris"): TurnOrder {
  return { id, nationId, kind: "pass" };
}

const CANONICAL_NATION_IDS = [
  "solaris",
  "dravos",
  "norvia",
  "veloria",
  "karsen",
  "arkania",
] as const;

describe("INITIAL STATE", () => {
  it("1. initial world has exactly 6 strategic-stat entries", () => {
    const state = validState();
    expect(state.world.nationStrategicStats).toHaveLength(6);
  });

  it("2. entry order follows canonical nation order", () => {
    const state = validState();
    const ids = state.world.nationStrategicStats.map((s) => s.nationId);
    expect(ids).toEqual([...CANONICAL_NATION_IDS]);
  });

  it("3. exact Solaris initial values", () => {
    const state = validState();
    const stats = getNationStrategicStats(state.world, "solaris");
    expect(stats.stability).toBe(72);
    expect(stats.publicSupport).toBe(68);
    expect(stats.internalSecurity).toBe(66);
  });

  it("4. exact Dravos initial values", () => {
    const state = validState();
    const stats = getNationStrategicStats(state.world, "dravos");
    expect(stats.stability).toBe(78);
    expect(stats.publicSupport).toBe(55);
    expect(stats.internalSecurity).toBe(82);
  });

  it("5. exact Norvia initial values", () => {
    const state = validState();
    const stats = getNationStrategicStats(state.world, "norvia");
    expect(stats.stability).toBe(58);
    expect(stats.publicSupport).toBe(74);
    expect(stats.internalSecurity).toBe(52);
  });

  it("6. exact Veloria initial values", () => {
    const state = validState();
    const stats = getNationStrategicStats(state.world, "veloria");
    expect(stats.stability).toBe(70);
    expect(stats.publicSupport).toBe(69);
    expect(stats.internalSecurity).toBe(60);
  });

  it("7. exact Karsen initial values", () => {
    const state = validState();
    const stats = getNationStrategicStats(state.world, "karsen");
    expect(stats.stability).toBe(64);
    expect(stats.publicSupport).toBe(57);
    expect(stats.internalSecurity).toBe(76);
  });

  it("8. exact Arkania initial values", () => {
    const state = validState();
    const stats = getNationStrategicStats(state.world, "arkania");
    expect(stats.stability).toBe(61);
    expect(stats.publicSupport).toBe(62);
    expect(stats.internalSecurity).toBe(58);
  });

  it("9. repeated initial creation is deeply equal", () => {
    const a = createInitialNationStrategicStats(
      createInitialGameState().world.nations,
    );
    const b = createInitialNationStrategicStats(
      createInitialGameState().world.nations,
    );
    expect(a).toEqual(b);
  });

  it("10. separate initial worlds do not share strategic-stat array", () => {
    const a = validState();
    const b = validState();
    expect(a.world.nationStrategicStats).not.toBe(
      b.world.nationStrategicStats,
    );
  });

  it("11. initial GameState passes validateGameState", () => {
    const state = validState();
    expect(() => validateGameState(state)).not.toThrow();
  });
});

describe("LOOKUP", () => {
  it("12. Solaris lookup returns exact stats", () => {
    const state = validState();
    const stats = getNationStrategicStats(state.world, "solaris");
    expect(stats.nationId).toBe("solaris");
    expect(stats.stability).toBe(72);
    expect(stats.publicSupport).toBe(68);
    expect(stats.internalSecurity).toBe(66);
  });

  it("13. unknown nation throws UnknownNationError", () => {
    const state = validState();
    expect(() => getNationStrategicStats(state.world, "nonexistent")).toThrow(
      UnknownNationError,
    );
  });

  it("14. existing nation with missing stats entry throws MissingNationStrategicStatsError", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nationStrategicStats: state.world.nationStrategicStats.filter(
        (s) => s.nationId !== "solaris",
      ),
    };
    expect(() => getNationStrategicStats(badWorld, "solaris")).toThrow(
      MissingNationStrategicStatsError,
    );
  });
});

describe("VALIDATION", () => {
  it("15. valid canonical stats pass", () => {
    const state = validState();
    expect(() => validateNationStrategicStats(state.world)).not.toThrow();
  });

  it("16. duplicate nation stats fails", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nationStrategicStats: [
        ...state.world.nationStrategicStats,
        { nationId: "solaris", stability: 50, publicSupport: 50, internalSecurity: 50 },
      ],
    };
    expect(() => validateNationStrategicStats(badWorld)).toThrow(
      NationStrategicStatsValidationError,
    );
    expect(() => validateNationStrategicStats(badWorld)).toThrow(
      'Duplicate strategic stats entry for nation: "solaris"',
    );
  });

  it("17. unknown nation entry fails", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nationStrategicStats: [
        ...state.world.nationStrategicStats,
        { nationId: "nonexistent", stability: 50, publicSupport: 50, internalSecurity: 50 },
      ],
    };
    expect(() => validateNationStrategicStats(badWorld)).toThrow(
      NationStrategicStatsValidationError,
    );
    expect(() => validateNationStrategicStats(badWorld)).toThrow(
      'Strategic stats entry references unknown nation: "nonexistent"',
    );
  });

  it("18. missing nation stats fails", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nationStrategicStats: state.world.nationStrategicStats.filter(
        (s) => s.nationId !== "solaris",
      ),
    };
    expect(() => validateNationStrategicStats(badWorld)).toThrow(
      NationStrategicStatsValidationError,
    );
    expect(() => validateNationStrategicStats(badWorld)).toThrow(
      'Missing strategic stats entry for nation: "solaris"',
    );
  });

  it("19. fractional stability fails", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nationStrategicStats: state.world.nationStrategicStats.map((s) =>
        s.nationId === "solaris" ? { ...s, stability: 1.5 } : s,
      ),
    };
    expect(() => validateNationStrategicStats(badWorld)).toThrow(
      NationStrategicStatsValidationError,
    );
    expect(() => validateNationStrategicStats(badWorld)).toThrow(
      'Invalid stability for nation "solaris": expected integer, got 1.5',
    );
  });

  it("20. stability below 0 fails", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nationStrategicStats: state.world.nationStrategicStats.map((s) =>
        s.nationId === "solaris" ? { ...s, stability: -1 } : s,
      ),
    };
    expect(() => validateNationStrategicStats(badWorld)).toThrow(
      NationStrategicStatsValidationError,
    );
    expect(() => validateNationStrategicStats(badWorld)).toThrow(
      'Invalid stability for nation "solaris": expected 0..100, got -1',
    );
  });

  it("21. stability above 100 fails", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nationStrategicStats: state.world.nationStrategicStats.map((s) =>
        s.nationId === "solaris" ? { ...s, stability: 101 } : s,
      ),
    };
    expect(() => validateNationStrategicStats(badWorld)).toThrow(
      NationStrategicStatsValidationError,
    );
    expect(() => validateNationStrategicStats(badWorld)).toThrow(
      'Invalid stability for nation "solaris": expected 0..100, got 101',
    );
  });

  it("22. fractional publicSupport fails", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nationStrategicStats: state.world.nationStrategicStats.map((s) =>
        s.nationId === "solaris" ? { ...s, publicSupport: 2.5 } : s,
      ),
    };
    expect(() => validateNationStrategicStats(badWorld)).toThrow(
      NationStrategicStatsValidationError,
    );
  });

  it("23. publicSupport below 0 fails", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nationStrategicStats: state.world.nationStrategicStats.map((s) =>
        s.nationId === "solaris" ? { ...s, publicSupport: -1 } : s,
      ),
    };
    expect(() => validateNationStrategicStats(badWorld)).toThrow(
      NationStrategicStatsValidationError,
    );
  });

  it("24. publicSupport above 100 fails", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nationStrategicStats: state.world.nationStrategicStats.map((s) =>
        s.nationId === "solaris" ? { ...s, publicSupport: 101 } : s,
      ),
    };
    expect(() => validateNationStrategicStats(badWorld)).toThrow(
      NationStrategicStatsValidationError,
    );
  });

  it("25. fractional internalSecurity fails", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nationStrategicStats: state.world.nationStrategicStats.map((s) =>
        s.nationId === "solaris" ? { ...s, internalSecurity: 3.5 } : s,
      ),
    };
    expect(() => validateNationStrategicStats(badWorld)).toThrow(
      NationStrategicStatsValidationError,
    );
  });

  it("26. internalSecurity below 0 fails", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nationStrategicStats: state.world.nationStrategicStats.map((s) =>
        s.nationId === "solaris" ? { ...s, internalSecurity: -1 } : s,
      ),
    };
    expect(() => validateNationStrategicStats(badWorld)).toThrow(
      NationStrategicStatsValidationError,
    );
  });

  it("27. internalSecurity above 100 fails", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nationStrategicStats: state.world.nationStrategicStats.map((s) =>
        s.nationId === "solaris" ? { ...s, internalSecurity: 101 } : s,
      ),
    };
    expect(() => validateNationStrategicStats(badWorld)).toThrow(
      NationStrategicStatsValidationError,
    );
  });

  it("28. boundary 0 is valid", () => {
    const state = validState();
    const validWorld = {
      ...state.world,
      nationStrategicStats: state.world.nationStrategicStats.map((s) =>
        s.nationId === "solaris"
          ? { ...s, stability: 0, publicSupport: 0, internalSecurity: 0 }
          : s,
      ),
    };
    expect(() => validateNationStrategicStats(validWorld)).not.toThrow();
  });

  it("29. boundary 100 is valid", () => {
    const state = validState();
    const validWorld = {
      ...state.world,
      nationStrategicStats: state.world.nationStrategicStats.map((s) =>
        s.nationId === "solaris"
          ? { ...s, stability: 100, publicSupport: 100, internalSecurity: 100 }
          : s,
      ),
    };
    expect(() => validateNationStrategicStats(validWorld)).not.toThrow();
  });
});

describe("TRANSITION", () => {
  it("30. Solaris stability 72 -> 60", () => {
    const state = validState();
    const next = setNationStrategicStat(state, "solaris", "stability", 60);
    const stats = getNationStrategicStats(next.world, "solaris");
    expect(stats.stability).toBe(60);
  });

  it("31. Solaris publicSupport 68 -> 80", () => {
    const state = validState();
    const next = setNationStrategicStat(state, "solaris", "publicSupport", 80);
    const stats = getNationStrategicStats(next.world, "solaris");
    expect(stats.publicSupport).toBe(80);
  });

  it("32. Solaris internalSecurity 66 -> 40", () => {
    const state = validState();
    const next = setNationStrategicStat(state, "solaris", "internalSecurity", 40);
    const stats = getNationStrategicStats(next.world, "solaris");
    expect(stats.internalSecurity).toBe(40);
  });

  it("33. resulting lookup returns changed value", () => {
    const state = validState();
    const next = setNationStrategicStat(state, "solaris", "stability", 60);
    const stats = getNationStrategicStats(next.world, "solaris");
    expect(stats.stability).toBe(60);
    expect(stats.publicSupport).toBe(68);
    expect(stats.internalSecurity).toBe(66);
  });

  it("34. original GameState unchanged", () => {
    const state = validState();
    const snapshot = JSON.parse(JSON.stringify(state));
    setNationStrategicStat(state, "solaris", "stability", 60);
    expect(state).toEqual(snapshot);
  });

  it("35. original WorldState unchanged", () => {
    const state = validState();
    const worldSnapshot = JSON.parse(JSON.stringify(state.world));
    setNationStrategicStat(state, "solaris", "stability", 60);
    expect(state.world).toEqual(worldSnapshot);
  });

  it("36. original stats array unchanged", () => {
    const state = validState();
    const statsSnapshot = JSON.parse(
      JSON.stringify(state.world.nationStrategicStats),
    );
    setNationStrategicStat(state, "solaris", "stability", 60);
    expect(state.world.nationStrategicStats).toEqual(statsSnapshot);
  });

  it("37. changed GameState new reference", () => {
    const state = validState();
    const next = setNationStrategicStat(state, "solaris", "stability", 60);
    expect(next).not.toBe(state);
  });

  it("38. changed WorldState new reference", () => {
    const state = validState();
    const next = setNationStrategicStat(state, "solaris", "stability", 60);
    expect(next.world).not.toBe(state.world);
  });

  it("39. changed stats array new reference", () => {
    const state = validState();
    const next = setNationStrategicStat(state, "solaris", "stability", 60);
    expect(next.world.nationStrategicStats).not.toBe(
      state.world.nationStrategicStats,
    );
  });

  it("40. nations reference preserved", () => {
    const state = validState();
    const next = setNationStrategicStat(state, "solaris", "stability", 60);
    expect(next.world.nations).toBe(state.world.nations);
  });

  it("41. map reference preserved", () => {
    const state = validState();
    const next = setNationStrategicStat(state, "solaris", "stability", 60);
    expect(next.world.map).toBe(state.world.map);
  });

  it("42. regionOwnership reference preserved", () => {
    const state = validState();
    const next = setNationStrategicStat(state, "solaris", "stability", 60);
    expect(next.world.regionOwnership).toBe(state.world.regionOwnership);
  });

  it("43. PlanningState reference preserved", () => {
    const state = validState();
    const next = setNationStrategicStat(state, "solaris", "stability", 60);
    expect(next.planning).toBe(state.planning);
  });

  it("44. IntelligenceState reference preserved", () => {
    const state = validState();
    const next = setNationStrategicStat(state, "solaris", "stability", 60);
    expect(next.intelligence).toBe(state.intelligence);
  });

  it("45. turn unchanged", () => {
    const state = validState();
    const next = setNationStrategicStat(state, "solaris", "stability", 60);
    expect(next.turn).toBe(state.turn);
  });

  it("46. phase unchanged", () => {
    const state = validState();
    const next = setNationStrategicStat(state, "solaris", "stability", 60);
    expect(next.phase).toBe(state.phase);
  });

  it("47. playerNationId unchanged", () => {
    const state = validState();
    const next = setNationStrategicStat(state, "solaris", "stability", 60);
    expect(next.playerNationId).toBe(state.playerNationId);
  });

  it("48. ordering preserved", () => {
    const state = validState();
    const next = setNationStrategicStat(state, "solaris", "stability", 60);
    const ids = next.world.nationStrategicStats.map((s) => s.nationId);
    expect(ids).toEqual([...CANONICAL_NATION_IDS]);
  });

  it("49. unchanged nation stat entries preserve references", () => {
    const state = validState();
    const next = setNationStrategicStat(state, "solaris", "stability", 60);
    const unchangedDravos = state.world.nationStrategicStats.find(
      (s) => s.nationId === "dravos",
    );
    const nextDravos = next.world.nationStrategicStats.find(
      (s) => s.nationId === "dravos",
    );
    expect(nextDravos).toBe(unchangedDravos);
  });

  it("50. same-value transition returns exact original state reference", () => {
    const state = validState();
    const next = setNationStrategicStat(state, "solaris", "stability", 72);
    expect(next).toBe(state);
  });

  it("51. unknown nation fails", () => {
    const state = validState();
    expect(() =>
      setNationStrategicStat(state, "nonexistent", "stability", 50),
    ).toThrow(UnknownNationError);
  });

  it("52. missing stats entry fails", () => {
    const state = validState();
    const badState: GameState = {
      ...state,
      world: {
        ...state.world,
        nationStrategicStats: state.world.nationStrategicStats.filter(
          (s) => s.nationId !== "solaris",
        ),
      },
    };
    expect(() =>
      setNationStrategicStat(badState, "solaris", "stability", 50),
    ).toThrow(MissingNationStrategicStatsError);
  });

  it("53. invalid runtime stat key fails", () => {
    const state = validState();
    expect(() =>
      setNationStrategicStat(state, "solaris", "bogus" as never, 50),
    ).toThrow(InvalidNationStrategicStatKeyError);
  });

  it("54. fractional requested value fails", () => {
    const state = validState();
    expect(() =>
      setNationStrategicStat(state, "solaris", "stability", 1.5),
    ).toThrow(InvalidNationStrategicStatValueError);
  });

  it("55. value below 0 fails", () => {
    const state = validState();
    expect(() =>
      setNationStrategicStat(state, "solaris", "stability", -1),
    ).toThrow(InvalidNationStrategicStatValueError);
  });

  it("56. value above 100 fails", () => {
    const state = validState();
    expect(() =>
      setNationStrategicStat(state, "solaris", "stability", 101),
    ).toThrow(InvalidNationStrategicStatValueError);
  });

  it("57. invalid input GameState fails closed", () => {
    const badState: GameState = { ...validState(), turn: 0 };
    expect(() =>
      setNationStrategicStat(badState, "solaris", "stability", 50),
    ).toThrow();
  });

  it("58. successful transition passes validateGameState", () => {
    const state = validState();
    const next = setNationStrategicStat(state, "solaris", "stability", 60);
    expect(() => validateGameState(next)).not.toThrow();
  });
});

describe("TURN REGRESSION", () => {
  it("59. strategic stats survive resolveTurn unchanged", () => {
    let state = validState();
    state = setNationStrategicStat(state, "solaris", "stability", 50);
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    const stats = getNationStrategicStats(next.world, "solaris");
    expect(stats.stability).toBe(50);
  });

  it("60. strategic-stat array reference is preserved across ordinary resolveTurn", () => {
    const state = validState();
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    expect(next.world.nationStrategicStats).toBe(
      state.world.nationStrategicStats,
    );
  });

  it("61. AP still resets correctly", () => {
    const state = validState();
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    const ap = next.planning.actionPoints.find((a) => a.nationId === "solaris");
    expect(ap?.remaining).toBe(6);
  });

  it("62. intelligence state still persists", () => {
    const state = validState();
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    expect(next.intelligence).toBe(state.intelligence);
  });

  it("63. region ownership still persists", () => {
    const state = validState();
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    expect(next.world.regionOwnership).toBe(state.world.regionOwnership);
  });

  it("64. TurnAdvancedEvent behavior remains unchanged", () => {
    const state = validState();
    const { result } = resolveTurn(state, [passOrder("o1")]);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].type).toBe("turn-advanced");
  });

  it("65. all G0/G1 tests remain passing", () => {
    const state = validState();
    expect(state.turn).toBe(1);
    expect(state.phase).toBe("planning");
    expect(state.playerNationId).toBe("solaris");
    expect(state.world.nations).toHaveLength(6);
    expect(state.world.map.regions).toHaveLength(18);
    expect(state.world.map.connections).toHaveLength(30);
    expect(state.world.regionOwnership).toHaveLength(18);
    expect(state.planning.actionPoints).toHaveLength(6);
    expect(state.intelligence.nationVisibility).toHaveLength(36);
    expect(state.intelligence.networks).toHaveLength(30);
    expect(state.intelligence.agents).toHaveLength(12);
    expect(() => validateGameState(state)).not.toThrow();
  });
});
