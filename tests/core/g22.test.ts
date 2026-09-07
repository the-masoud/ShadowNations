import { describe, it, expect } from "vitest";
import {
  createInitialNationInfluence,
  getNationInfluence,
  validateNationInfluence,
  SelfNationInfluenceError,
  MissingNationInfluenceError,
  NationInfluenceValidationError,
} from "../../src/core/model/nationInfluence";
import { createInitialGameState } from "../../src/core/model/gameState";
import type { GameState } from "../../src/core/model/gameState";
import { validateGameState } from "../../src/core/simulation/validateGameState";
import { resolveTurn } from "../../src/core/simulation/resolveTurn";
import type { TurnOrder } from "../../src/core/model/turnOrder";
import { UnknownNationError } from "../../src/core/model/worldState";
import {
  setNationInfluence,
  InvalidNationInfluenceValueError,
} from "../../src/core/simulation/setNationInfluence";

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
  it("1. initial world contains exactly 30 influence entries", () => {
    const state = validState();
    expect(state.world.nationInfluence).toHaveLength(30);
  });

  it("2. no self pairs exist", () => {
    const state = validState();
    for (const entry of state.world.nationInfluence) {
      expect(entry.influencerNationId).not.toBe(entry.targetNationId);
    }
  });

  it("3. influencer ordering is canonical", () => {
    const state = validState();
    const influencers = new Set<string>();
    for (const entry of state.world.nationInfluence) {
      influencers.add(entry.influencerNationId);
    }
    expect([...influencers]).toEqual([...CANONICAL_NATION_IDS]);
  });

  it("4. target ordering within influencer is canonical", () => {
    const state = validState();
    for (const influencerId of CANONICAL_NATION_IDS) {
      const targets = state.world.nationInfluence
        .filter((e) => e.influencerNationId === influencerId)
        .map((e) => e.targetNationId);
      const expectedTargets = CANONICAL_NATION_IDS.filter(
        (id) => id !== influencerId,
      );
      expect(targets).toEqual([...expectedTargets]);
    }
  });

  it("5. exact Solaris outgoing values", () => {
    const state = validState();
    const solarisOut = state.world.nationInfluence.filter(
      (e) => e.influencerNationId === "solaris",
    );
    expect(solarisOut.find((e) => e.targetNationId === "dravos")?.value).toBe(18);
    expect(solarisOut.find((e) => e.targetNationId === "norvia")?.value).toBe(42);
    expect(solarisOut.find((e) => e.targetNationId === "veloria")?.value).toBe(50);
    expect(solarisOut.find((e) => e.targetNationId === "karsen")?.value).toBe(24);
    expect(solarisOut.find((e) => e.targetNationId === "arkania")?.value).toBe(28);
  });

  it("6. exact Dravos outgoing values", () => {
    const state = validState();
    const dravosOut = state.world.nationInfluence.filter(
      (e) => e.influencerNationId === "dravos",
    );
    expect(dravosOut.find((e) => e.targetNationId === "solaris")?.value).toBe(22);
    expect(dravosOut.find((e) => e.targetNationId === "norvia")?.value).toBe(26);
    expect(dravosOut.find((e) => e.targetNationId === "veloria")?.value).toBe(20);
    expect(dravosOut.find((e) => e.targetNationId === "karsen")?.value).toBe(46);
    expect(dravosOut.find((e) => e.targetNationId === "arkania")?.value).toBe(38);
  });

  it("7. exact Norvia outgoing values", () => {
    const state = validState();
    const norviaOut = state.world.nationInfluence.filter(
      (e) => e.influencerNationId === "norvia",
    );
    expect(norviaOut.find((e) => e.targetNationId === "solaris")?.value).toBe(40);
    expect(norviaOut.find((e) => e.targetNationId === "dravos")?.value).toBe(16);
    expect(norviaOut.find((e) => e.targetNationId === "veloria")?.value).toBe(44);
    expect(norviaOut.find((e) => e.targetNationId === "karsen")?.value).toBe(18);
    expect(norviaOut.find((e) => e.targetNationId === "arkania")?.value).toBe(25);
  });

  it("8. exact Veloria outgoing values", () => {
    const state = validState();
    const veloriaOut = state.world.nationInfluence.filter(
      (e) => e.influencerNationId === "veloria",
    );
    expect(veloriaOut.find((e) => e.targetNationId === "solaris")?.value).toBe(48);
    expect(veloriaOut.find((e) => e.targetNationId === "dravos")?.value).toBe(24);
    expect(veloriaOut.find((e) => e.targetNationId === "norvia")?.value).toBe(46);
    expect(veloriaOut.find((e) => e.targetNationId === "karsen")?.value).toBe(32);
    expect(veloriaOut.find((e) => e.targetNationId === "arkania")?.value).toBe(34);
  });

  it("9. exact Karsen outgoing values", () => {
    const state = validState();
    const karsenOut = state.world.nationInfluence.filter(
      (e) => e.influencerNationId === "karsen",
    );
    expect(karsenOut.find((e) => e.targetNationId === "solaris")?.value).toBe(20);
    expect(karsenOut.find((e) => e.targetNationId === "dravos")?.value).toBe(44);
    expect(karsenOut.find((e) => e.targetNationId === "norvia")?.value).toBe(21);
    expect(karsenOut.find((e) => e.targetNationId === "veloria")?.value).toBe(30);
    expect(karsenOut.find((e) => e.targetNationId === "arkania")?.value).toBe(41);
  });

  it("10. exact Arkania outgoing values", () => {
    const state = validState();
    const arkaniaOut = state.world.nationInfluence.filter(
      (e) => e.influencerNationId === "arkania",
    );
    expect(arkaniaOut.find((e) => e.targetNationId === "solaris")?.value).toBe(26);
    expect(arkaniaOut.find((e) => e.targetNationId === "dravos")?.value).toBe(36);
    expect(arkaniaOut.find((e) => e.targetNationId === "norvia")?.value).toBe(28);
    expect(arkaniaOut.find((e) => e.targetNationId === "veloria")?.value).toBe(33);
    expect(arkaniaOut.find((e) => e.targetNationId === "karsen")?.value).toBe(39);
  });

  it("11. repeated creation is deeply equal", () => {
    const a = createInitialNationInfluence(
      createInitialGameState().world.nations,
    );
    const b = createInitialNationInfluence(
      createInitialGameState().world.nations,
    );
    expect(a).toEqual(b);
  });

  it("12. separate initial worlds do not share nationInfluence array", () => {
    const a = validState();
    const b = validState();
    expect(a.world.nationInfluence).not.toBe(b.world.nationInfluence);
  });

  it("13. initial GameState passes validateGameState", () => {
    const state = validState();
    expect(() => validateGameState(state)).not.toThrow();
  });
});

describe("LOOKUP", () => {
  it("14. Solaris -> Norvia returns 42", () => {
    const state = validState();
    const entry = getNationInfluence(state.world, "solaris", "norvia");
    expect(entry.value).toBe(42);
  });

  it("15. Norvia -> Solaris returns 40", () => {
    const state = validState();
    const entry = getNationInfluence(state.world, "norvia", "solaris");
    expect(entry.value).toBe(40);
  });

  it("16. unknown influencer throws UnknownNationError", () => {
    const state = validState();
    expect(() =>
      getNationInfluence(state.world, "nonexistent", "solaris"),
    ).toThrow(UnknownNationError);
  });

  it("17. unknown target throws UnknownNationError", () => {
    const state = validState();
    expect(() =>
      getNationInfluence(state.world, "solaris", "nonexistent"),
    ).toThrow(UnknownNationError);
  });

  it("18. self influence throws SelfNationInfluenceError", () => {
    const state = validState();
    expect(() =>
      getNationInfluence(state.world, "solaris", "solaris"),
    ).toThrow(SelfNationInfluenceError);
  });

  it("19. existing pair with entry removed throws MissingNationInfluenceError", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nationInfluence: state.world.nationInfluence.filter(
        (e) =>
          !(
            e.influencerNationId === "solaris" &&
            e.targetNationId === "norvia"
          ),
      ),
    };
    expect(() => getNationInfluence(badWorld, "solaris", "norvia")).toThrow(
      MissingNationInfluenceError,
    );
  });
});

describe("VALIDATION", () => {
  it("20. canonical influence passes", () => {
    const state = validState();
    expect(() => validateNationInfluence(state.world)).not.toThrow();
  });

  it("21. duplicate pair fails", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nationInfluence: [
        ...state.world.nationInfluence,
        { influencerNationId: "solaris", targetNationId: "norvia", value: 50 },
      ],
    };
    expect(() => validateNationInfluence(badWorld)).toThrow(
      NationInfluenceValidationError,
    );
    expect(() => validateNationInfluence(badWorld)).toThrow(
      'Duplicate influence entry for pair: "solaris" -> "norvia"',
    );
  });

  it("22. reversed directional pair is NOT a duplicate", () => {
    const state = validState();
    const solarisToNorvia = getNationInfluence(state.world, "solaris", "norvia");
    const norviaToSolaris = getNationInfluence(state.world, "norvia", "solaris");
    expect(solarisToNorvia.value).toBe(42);
    expect(norviaToSolaris.value).toBe(40);
    expect(solarisToNorvia).not.toBe(norviaToSolaris);
  });

  it("23. self pair fails", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nationInfluence: [
        ...state.world.nationInfluence,
        { influencerNationId: "solaris", targetNationId: "solaris", value: 50 },
      ],
    };
    expect(() => validateNationInfluence(badWorld)).toThrow(
      NationInfluenceValidationError,
    );
    expect(() => validateNationInfluence(badWorld)).toThrow(
      'Self-influence pair not allowed: "solaris"',
    );
  });

  it("24. unknown influencer fails", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nationInfluence: [
        ...state.world.nationInfluence,
        { influencerNationId: "nonexistent", targetNationId: "solaris", value: 50 },
      ],
    };
    expect(() => validateNationInfluence(badWorld)).toThrow(
      NationInfluenceValidationError,
    );
    expect(() => validateNationInfluence(badWorld)).toThrow(
      'Influence entry references unknown influencer nation: "nonexistent"',
    );
  });

  it("25. unknown target fails", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nationInfluence: [
        ...state.world.nationInfluence,
        { influencerNationId: "solaris", targetNationId: "nonexistent", value: 50 },
      ],
    };
    expect(() => validateNationInfluence(badWorld)).toThrow(
      NationInfluenceValidationError,
    );
    expect(() => validateNationInfluence(badWorld)).toThrow(
      'Influence entry references unknown target nation: "nonexistent"',
    );
  });

  it("26. missing required pair fails", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nationInfluence: state.world.nationInfluence.filter(
        (e) =>
          !(
            e.influencerNationId === "solaris" &&
            e.targetNationId === "norvia"
          ),
      ),
    };
    expect(() => validateNationInfluence(badWorld)).toThrow(
      NationInfluenceValidationError,
    );
    expect(() => validateNationInfluence(badWorld)).toThrow(
      'Missing influence entry for pair: "solaris" -> "norvia"',
    );
  });

  it("27. fractional influence fails", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nationInfluence: state.world.nationInfluence.map((e) =>
        e.influencerNationId === "solaris" && e.targetNationId === "norvia"
          ? { ...e, value: 1.5 }
          : e,
      ),
    };
    expect(() => validateNationInfluence(badWorld)).toThrow(
      NationInfluenceValidationError,
    );
    expect(() => validateNationInfluence(badWorld)).toThrow(
      'Invalid influence value for pair "solaris" -> "norvia": expected integer, got 1.5',
    );
  });

  it("28. influence below 0 fails", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nationInfluence: state.world.nationInfluence.map((e) =>
        e.influencerNationId === "solaris" && e.targetNationId === "norvia"
          ? { ...e, value: -1 }
          : e,
      ),
    };
    expect(() => validateNationInfluence(badWorld)).toThrow(
      NationInfluenceValidationError,
    );
    expect(() => validateNationInfluence(badWorld)).toThrow(
      'Invalid influence value for pair "solaris" -> "norvia": expected 0..100, got -1',
    );
  });

  it("29. influence above 100 fails", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nationInfluence: state.world.nationInfluence.map((e) =>
        e.influencerNationId === "solaris" && e.targetNationId === "norvia"
          ? { ...e, value: 101 }
          : e,
      ),
    };
    expect(() => validateNationInfluence(badWorld)).toThrow(
      NationInfluenceValidationError,
    );
    expect(() => validateNationInfluence(badWorld)).toThrow(
      'Invalid influence value for pair "solaris" -> "norvia": expected 0..100, got 101',
    );
  });

  it("30. influence 0 is valid", () => {
    const state = validState();
    const validWorld = {
      ...state.world,
      nationInfluence: state.world.nationInfluence.map((e) =>
        e.influencerNationId === "solaris" && e.targetNationId === "norvia"
          ? { ...e, value: 0 }
          : e,
      ),
    };
    expect(() => validateNationInfluence(validWorld)).not.toThrow();
  });

  it("31. influence 100 is valid", () => {
    const state = validState();
    const validWorld = {
      ...state.world,
      nationInfluence: state.world.nationInfluence.map((e) =>
        e.influencerNationId === "solaris" && e.targetNationId === "norvia"
          ? { ...e, value: 100 }
          : e,
      ),
    };
    expect(() => validateNationInfluence(validWorld)).not.toThrow();
  });

  it("32. asymmetrical values are structurally valid", () => {
    const state = validState();
    const validWorld = {
      ...state.world,
      nationInfluence: state.world.nationInfluence.map((e) => {
        if (e.influencerNationId === "solaris" && e.targetNationId === "norvia") {
          return { ...e, value: 90 };
        }
        if (e.influencerNationId === "norvia" && e.targetNationId === "solaris") {
          return { ...e, value: 10 };
        }
        return e;
      }),
    };
    expect(() => validateNationInfluence(validWorld)).not.toThrow();
  });
});

describe("TRANSITION", () => {
  it("33. Solaris -> Norvia 42 -> 60", () => {
    const state = validState();
    const next = setNationInfluence(state, "solaris", "norvia", 60);
    const entry = getNationInfluence(next.world, "solaris", "norvia");
    expect(entry.value).toBe(60);
  });

  it("34. resulting lookup returns 60", () => {
    const state = validState();
    const next = setNationInfluence(state, "solaris", "norvia", 60);
    const entry = getNationInfluence(next.world, "solaris", "norvia");
    expect(entry.value).toBe(60);
  });

  it("35. Norvia -> Solaris remains 40", () => {
    const state = validState();
    const next = setNationInfluence(state, "solaris", "norvia", 60);
    const entry = getNationInfluence(next.world, "norvia", "solaris");
    expect(entry.value).toBe(40);
  });

  it("36. Solaris other outgoing influence remains unchanged", () => {
    const state = validState();
    const next = setNationInfluence(state, "solaris", "norvia", 60);
    expect(getNationInfluence(next.world, "solaris", "dravos").value).toBe(18);
    expect(getNationInfluence(next.world, "solaris", "veloria").value).toBe(50);
    expect(getNationInfluence(next.world, "solaris", "karsen").value).toBe(24);
    expect(getNationInfluence(next.world, "solaris", "arkania").value).toBe(28);
  });

  it("37. original GameState unchanged", () => {
    const state = validState();
    const snapshot = JSON.parse(JSON.stringify(state));
    setNationInfluence(state, "solaris", "norvia", 60);
    expect(state).toEqual(snapshot);
  });

  it("38. original WorldState unchanged", () => {
    const state = validState();
    const worldSnapshot = JSON.parse(JSON.stringify(state.world));
    setNationInfluence(state, "solaris", "norvia", 60);
    expect(state.world).toEqual(worldSnapshot);
  });

  it("39. original influence array unchanged", () => {
    const state = validState();
    const arraySnapshot = JSON.parse(
      JSON.stringify(state.world.nationInfluence),
    );
    setNationInfluence(state, "solaris", "norvia", 60);
    expect(state.world.nationInfluence).toEqual(arraySnapshot);
  });

  it("40. changed GameState new reference", () => {
    const state = validState();
    const next = setNationInfluence(state, "solaris", "norvia", 60);
    expect(next).not.toBe(state);
  });

  it("41. changed WorldState new reference", () => {
    const state = validState();
    const next = setNationInfluence(state, "solaris", "norvia", 60);
    expect(next.world).not.toBe(state.world);
  });

  it("42. changed influence array new reference", () => {
    const state = validState();
    const next = setNationInfluence(state, "solaris", "norvia", 60);
    expect(next.world.nationInfluence).not.toBe(state.world.nationInfluence);
  });

  it("43. nations reference preserved", () => {
    const state = validState();
    const next = setNationInfluence(state, "solaris", "norvia", 60);
    expect(next.world.nations).toBe(state.world.nations);
  });

  it("44. map reference preserved", () => {
    const state = validState();
    const next = setNationInfluence(state, "solaris", "norvia", 60);
    expect(next.world.map).toBe(state.world.map);
  });

  it("45. regionOwnership reference preserved", () => {
    const state = validState();
    const next = setNationInfluence(state, "solaris", "norvia", 60);
    expect(next.world.regionOwnership).toBe(state.world.regionOwnership);
  });

  it("46. nationStrategicStats reference preserved", () => {
    const state = validState();
    const next = setNationInfluence(state, "solaris", "norvia", 60);
    expect(next.world.nationStrategicStats).toBe(
      state.world.nationStrategicStats,
    );
  });

  it("47. planning reference preserved", () => {
    const state = validState();
    const next = setNationInfluence(state, "solaris", "norvia", 60);
    expect(next.planning).toBe(state.planning);
  });

  it("48. intelligence reference preserved", () => {
    const state = validState();
    const next = setNationInfluence(state, "solaris", "norvia", 60);
    expect(next.intelligence).toBe(state.intelligence);
  });

  it("49. turn unchanged", () => {
    const state = validState();
    const next = setNationInfluence(state, "solaris", "norvia", 60);
    expect(next.turn).toBe(state.turn);
  });

  it("50. phase unchanged", () => {
    const state = validState();
    const next = setNationInfluence(state, "solaris", "norvia", 60);
    expect(next.phase).toBe(state.phase);
  });

  it("51. playerNationId unchanged", () => {
    const state = validState();
    const next = setNationInfluence(state, "solaris", "norvia", 60);
    expect(next.playerNationId).toBe(state.playerNationId);
  });

  it("52. ordering preserved", () => {
    const state = validState();
    const next = setNationInfluence(state, "solaris", "norvia", 60);
    const pairs = next.world.nationInfluence.map(
      (e) => `${e.influencerNationId}|${e.targetNationId}`,
    );
    const expected: string[] = [];
    for (const d of CANONICAL_NATION_IDS) {
      for (const t of CANONICAL_NATION_IDS) {
        if (d !== t) expected.push(`${d}|${t}`);
      }
    }
    expect(pairs).toEqual(expected);
  });

  it("53. unchanged influence entries preserve references", () => {
    const state = validState();
    const next = setNationInfluence(state, "solaris", "norvia", 60);
    const unchangedEntry = state.world.nationInfluence.find(
      (e) =>
        e.influencerNationId === "dravos" && e.targetNationId === "solaris",
    );
    const nextEntry = next.world.nationInfluence.find(
      (e) =>
        e.influencerNationId === "dravos" && e.targetNationId === "solaris",
    );
    expect(nextEntry).toBe(unchangedEntry);
  });

  it("54. same-value transition returns exact original state", () => {
    const state = validState();
    const next = setNationInfluence(state, "solaris", "norvia", 42);
    expect(next).toBe(state);
  });

  it("55. unknown influencer fails", () => {
    const state = validState();
    expect(() =>
      setNationInfluence(state, "nonexistent", "solaris", 50),
    ).toThrow(UnknownNationError);
  });

  it("56. unknown target fails", () => {
    const state = validState();
    expect(() =>
      setNationInfluence(state, "solaris", "nonexistent", 50),
    ).toThrow(UnknownNationError);
  });

  it("57. self pair fails", () => {
    const state = validState();
    expect(() =>
      setNationInfluence(state, "solaris", "solaris", 50),
    ).toThrow(SelfNationInfluenceError);
  });

  it("58. missing influence entry fails", () => {
    const state = validState();
    const badState: GameState = {
      ...state,
      world: {
        ...state.world,
        nationInfluence: state.world.nationInfluence.filter(
          (e) =>
            !(
              e.influencerNationId === "solaris" &&
              e.targetNationId === "norvia"
            ),
        ),
      },
    };
    expect(() =>
      setNationInfluence(badState, "solaris", "norvia", 50),
    ).toThrow(MissingNationInfluenceError);
  });

  it("59. fractional requested value fails", () => {
    const state = validState();
    expect(() =>
      setNationInfluence(state, "solaris", "norvia", 1.5),
    ).toThrow(InvalidNationInfluenceValueError);
  });

  it("60. value below 0 fails", () => {
    const state = validState();
    expect(() =>
      setNationInfluence(state, "solaris", "norvia", -1),
    ).toThrow(InvalidNationInfluenceValueError);
  });

  it("61. value above 100 fails", () => {
    const state = validState();
    expect(() =>
      setNationInfluence(state, "solaris", "norvia", 101),
    ).toThrow(InvalidNationInfluenceValueError);
  });

  it("62. malformed input GameState fails closed", () => {
    const badState: GameState = { ...validState(), turn: 0 };
    expect(() =>
      setNationInfluence(badState, "solaris", "norvia", 50),
    ).toThrow();
  });

  it("63. successful transitioned state validates", () => {
    const state = validState();
    const next = setNationInfluence(state, "solaris", "norvia", 60);
    expect(() => validateGameState(next)).not.toThrow();
  });
});

describe("TURN REGRESSION", () => {
  it("64. influence survives resolveTurn unchanged", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "norvia", 60);
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    const entry = getNationInfluence(next.world, "solaris", "norvia");
    expect(entry.value).toBe(60);
  });

  it("65. influence-array reference preserved across ordinary resolveTurn", () => {
    const state = validState();
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    expect(next.world.nationInfluence).toBe(state.world.nationInfluence);
  });

  it("66. strategic stats remain unchanged", () => {
    const state = validState();
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    expect(next.world.nationStrategicStats).toBe(
      state.world.nationStrategicStats,
    );
  });

  it("67. AP reset still works", () => {
    const state = validState();
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    const ap = next.planning.actionPoints.find((a) => a.nationId === "solaris");
    expect(ap?.remaining).toBe(6);
  });

  it("68. intelligence state still persists", () => {
    const state = validState();
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    expect(next.intelligence).toBe(state.intelligence);
  });

  it("69. ownership remains unchanged", () => {
    const state = validState();
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    expect(next.world.regionOwnership).toBe(state.world.regionOwnership);
  });

  it("70. TurnAdvancedEvent remains correct", () => {
    const state = validState();
    const { result } = resolveTurn(state, [passOrder("o1")]);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].type).toBe("turn-advanced");
  });

  it("71. all existing G0/G1/G2.1 tests remain passing", () => {
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
    expect(state.world.nationStrategicStats).toHaveLength(6);
    expect(state.world.nationInfluence).toHaveLength(30);
    expect(() => validateGameState(state)).not.toThrow();
  });
});
