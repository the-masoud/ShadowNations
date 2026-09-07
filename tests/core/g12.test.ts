import { describe, it, expect } from "vitest";
import {
  getNationVisibility,
} from "../../src/core/model/intelligenceVisibility";
import type {
  IntelligenceVisibility,
} from "../../src/core/model/intelligenceVisibility";
import {
  createInitialIntelligenceState,
  type IntelligenceState,
} from "../../src/core/model/intelligenceState";
import {
  validateIntelligenceState,
  IntelligenceValidationError,
  MissingIntelligenceVisibilityError,
  InvalidIntelligenceVisibilityError,
  SelfVisibilityInvariantError,
} from "../../src/core/simulation/validateIntelligenceState";
import {
  setNationVisibility,
  MissingIntelligenceVisibilityPairError,
  InvalidVisibilityValueError,
  SelfVisibilityInvariantError as SetSelfVisibilityInvariantError,
} from "../../src/core/simulation/setNationVisibility";
import { createInitialGameState } from "../../src/core/model/gameState";
import type { GameState } from "../../src/core/model/gameState";
import { validateGameState } from "../../src/core/simulation/validateGameState";
import { resolveTurn } from "../../src/core/simulation/resolveTurn";
import type { TurnOrder } from "../../src/core/model/turnOrder";
import { UnknownNationError } from "../../src/core/model/worldState";

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

function lookupVisibility(
  state: GameState,
  observer: string,
  target: string,
): IntelligenceVisibility {
  return getNationVisibility(state, observer, target);
}

describe("1. exactly 36 initial entries", () => {
  it("1.1 has 36 entries", () => {
    const state = validState();
    expect(state.intelligence.nationVisibility).toHaveLength(36);
  });
});

describe("2. canonical observer/target ordering", () => {
  it("2.1 ordering matches", () => {
    const state = validState();
    const pairs = state.intelligence.nationVisibility.map(
      (e) => `${e.observerNationId}|${e.targetNationId}`,
    );
    const expected: string[] = [];
    for (const obs of CANONICAL_NATION_IDS) {
      for (const tgt of CANONICAL_NATION_IDS) {
        expected.push(`${obs}|${tgt}`);
      }
    }
    expect(pairs).toEqual(expected);
  });
});

describe("3. all self entries known", () => {
  it("3.1 self pairs are known", () => {
    const state = validState();
    for (const id of CANONICAL_NATION_IDS) {
      const entry = state.intelligence.nationVisibility.find(
        (e) => e.observerNationId === id && e.targetNationId === id,
      );
      expect(entry?.visibility).toBe("known");
    }
  });
});

describe("4. all initial non-self entries unknown", () => {
  it("4.1 non-self pairs are unknown", () => {
    const state = validState();
    for (const entry of state.intelligence.nationVisibility) {
      if (entry.observerNationId === entry.targetNationId) continue;
      expect(entry.visibility).toBe("unknown");
    }
  });
});

describe("5. deterministic creation", () => {
  it("5.1 two calls produce equal results", () => {
    const a = createInitialIntelligenceState(validState().world.nations);
    const b = createInitialIntelligenceState(validState().world.nations);
    expect(a).toEqual(b);
  });
});

describe("6. separate visibility arrays", () => {
  it("6.1 different references", () => {
    const a = createInitialIntelligenceState(validState().world.nations);
    const b = createInitialIntelligenceState(validState().world.nations);
    expect(a.nationVisibility).not.toBe(b.nationVisibility);
  });
});

describe("7. initial GameState validates", () => {
  it("7.1 no throw", () => {
    const state = validState();
    expect(() => validateGameState(state)).not.toThrow();
  });
});

describe("8. lookup known case", () => {
  it("8.1 self lookup returns known", () => {
    const state = validState();
    expect(lookupVisibility(state, "solaris", "solaris")).toBe("known");
  });
});

describe("9. lookup unknown case", () => {
  it("9.1 non-self lookup returns unknown", () => {
    const state = validState();
    expect(lookupVisibility(state, "solaris", "dravos")).toBe("unknown");
  });
});

describe("10. unknown observer error", () => {
  it("10.1 throws UnknownNationError", () => {
    const state = validState();
    expect(() => getNationVisibility(state, "nonexistent", "solaris")).toThrow(
      UnknownNationError,
    );
  });
});

describe("11. unknown target error", () => {
  it("11.1 throws UnknownNationError", () => {
    const state = validState();
    expect(() => getNationVisibility(state, "solaris", "nonexistent")).toThrow(
      UnknownNationError,
    );
  });
});

describe("12. missing-pair error", () => {
  it("12.1 throws MissingIntelligenceVisibilityError", () => {
    const state = validState();
    const badIntelligence: IntelligenceState = {
      ...state.intelligence,
      nationVisibility: state.intelligence.nationVisibility.filter(
        (e) =>
          !(e.observerNationId === "solaris" && e.targetNationId === "dravos"),
      ),
    };
    const badState: GameState = {
      ...state,
      intelligence: badIntelligence,
    };
    expect(() => getNationVisibility(badState, "solaris", "dravos")).toThrow(
      MissingIntelligenceVisibilityError,
    );
  });
});

describe("13. invalid runtime visibility error", () => {
  it("13.1 validation catches invalid visibility", () => {
    const state = validState();
    const badIntelligence: IntelligenceState = {
      ...state.intelligence,
      nationVisibility: state.intelligence.nationVisibility.map((e) =>
        e.observerNationId === "solaris" && e.targetNationId === "dravos"
          ? { ...e, visibility: "bogus" as never }
          : e,
      ),
    };
    const badState: GameState = {
      ...state,
      intelligence: badIntelligence,
    };
    expect(() => validateIntelligenceState(badState)).toThrow(
      InvalidIntelligenceVisibilityError,
    );
  });
});

describe("14. duplicate-pair validation error", () => {
  it("14.1 duplicate detected", () => {
    const state = validState();
    const badIntelligence: IntelligenceState = {
      ...state.intelligence,
      nationVisibility: [
        ...state.intelligence.nationVisibility,
        {
          observerNationId: "solaris",
          targetNationId: "solaris",
          visibility: "known",
        },
      ],
    };
    const badState: GameState = {
      ...state,
      intelligence: badIntelligence,
    };
    expect(() => validateIntelligenceState(badState)).toThrow(
      IntelligenceValidationError,
    );
  });
});

describe("15. self invariant", () => {
  it("15.1 self-pair must be known", () => {
    const state = validState();
    const badIntelligence: IntelligenceState = {
      ...state.intelligence,
      nationVisibility: state.intelligence.nationVisibility.map((e) =>
        e.observerNationId === "solaris" && e.targetNationId === "solaris"
          ? { ...e, visibility: "unknown" as never }
          : e,
      ),
    };
    const badState: GameState = {
      ...state,
      intelligence: badIntelligence,
    };
    expect(() => validateIntelligenceState(badState)).toThrow(
      SelfVisibilityInvariantError,
    );
  });
});

describe("16. immutable real transition", () => {
  it("16.1 new references for changed objects", () => {
    const state = validState();
    const next = setNationVisibility(
      state,
      "solaris",
      "dravos",
      "limited",
    );
    expect(next).not.toBe(state);
    expect(next.intelligence).not.toBe(state.intelligence);
    expect(next.intelligence.nationVisibility).not.toBe(
      state.intelligence.nationVisibility,
    );
  });
});

describe("17. unchanged entries retain references", () => {
  it("17.1 unrelated entries preserved", () => {
    const state = validState();
    const next = setNationVisibility(
      state,
      "solaris",
      "dravos",
      "limited",
    );
    const changed = next.intelligence.nationVisibility.find(
      (e) =>
        e.observerNationId === "solaris" && e.targetNationId === "dravos",
    );
    const unchanged = next.intelligence.nationVisibility.find(
      (e) =>
        e.observerNationId === "dravos" && e.targetNationId === "solaris",
    );
    const origUnchanged = state.intelligence.nationVisibility.find(
      (e) =>
        e.observerNationId === "dravos" && e.targetNationId === "solaris",
    );
    expect(changed?.visibility).toBe("limited");
    expect(unchanged).toBe(origUnchanged);
  });
});

describe("18. same-value exact-reference no-op", () => {
  it("18.1 returns same reference", () => {
    const state = validState();
    const next = setNationVisibility(
      state,
      "solaris",
      "dravos",
      "unknown",
    );
    expect(next).toBe(state);
  });
});

describe("19. visibility survives resolveTurn", () => {
  it("19.1 visibility persists", () => {
    const state = validState();
    const changed = setNationVisibility(
      state,
      "solaris",
      "dravos",
      "limited",
    );
    const { state: next } = resolveTurn(changed, [passOrder("o1")]);
    expect(lookupVisibility(next, "solaris", "dravos")).toBe("limited");
  });
});

describe("20. IntelligenceState reference survives ordinary resolveTurn", () => {
  it("20.1 reference preserved when no visibility change", () => {
    const state = validState();
    const { state: next } = resolveTurn(state, [passOrder("o1")]);
    expect(next.intelligence).toBe(state.intelligence);
  });
});

describe("21. setNationVisibility validates target-specific errors before structural", () => {
  it("21.1 unknown observer throws UnknownNationError", () => {
    const state = validState();
    expect(() =>
      setNationVisibility(state, "nonexistent", "solaris", "limited"),
    ).toThrow(UnknownNationError);
  });

  it("21.2 unknown target throws UnknownNationError", () => {
    const state = validState();
    expect(() =>
      setNationVisibility(state, "solaris", "nonexistent", "limited"),
    ).toThrow(UnknownNationError);
  });

  it("21.3 missing pair throws MissingIntelligenceVisibilityPairError", () => {
    const state = validState();
    const badIntelligence: IntelligenceState = {
      ...state.intelligence,
      nationVisibility: state.intelligence.nationVisibility.filter(
        (e) =>
          !(e.observerNationId === "solaris" && e.targetNationId === "dravos"),
      ),
    };
    const badState: GameState = {
      ...state,
      intelligence: badIntelligence,
    };
    expect(() =>
      setNationVisibility(badState, "solaris", "dravos", "limited"),
    ).toThrow(MissingIntelligenceVisibilityPairError);
  });

  it("21.4 invalid visibility value throws InvalidVisibilityValueError", () => {
    const state = validState();
    expect(() =>
      setNationVisibility(state, "solaris", "dravos", "bogus" as never),
    ).toThrow(InvalidVisibilityValueError);
  });
});

describe("22. self-visibility invariant on setNationVisibility", () => {
  it("22.1 self -> limited throws SelfVisibilityInvariantError", () => {
    const state = validState();
    expect(() =>
      setNationVisibility(state, "solaris", "solaris", "limited"),
    ).toThrow(SetSelfVisibilityInvariantError);
  });

  it("22.2 self -> unknown throws SelfVisibilityInvariantError", () => {
    const state = validState();
    expect(() =>
      setNationVisibility(state, "solaris", "solaris", "unknown"),
    ).toThrow(SetSelfVisibilityInvariantError);
  });

  it("22.3 self -> known is a no-op (already known)", () => {
    const state = validState();
    const next = setNationVisibility(
      state,
      "solaris",
      "solaris",
      "known",
    );
    expect(next).toBe(state);
  });
});

describe("23. all previous tests remain passing", () => {
  it("23.1 G0/G1.1 invariants intact", () => {
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
    expect(() => validateGameState(state)).not.toThrow();
  });
});
