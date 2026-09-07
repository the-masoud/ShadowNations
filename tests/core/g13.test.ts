import { describe, it, expect } from "vitest";
import {
  getIntelligenceNetwork,
  SelfIntelligenceNetworkError,
  MissingIntelligenceNetworkError,
} from "../../src/core/model/intelligenceState";
import {
  getNextIntelligenceNetworkLevel,
} from "../../src/core/model/intelligenceNetwork";
import {
  setIntelligenceNetworkLevel,
} from "../../src/core/simulation/setIntelligenceNetworkLevel";
import {
  validateIntelligenceState,
  IntelligenceValidationError,
  InvalidIntelligenceNetworkLevelError as ValidationNetworkLevelError,
} from "../../src/core/simulation/validateIntelligenceState";
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

describe("1. exactly 30 initial networks", () => {
  it("1.1 has 30 entries", () => {
    const state = validState();
    expect(state.intelligence.networks).toHaveLength(30);
  });
});

describe("2. no self-network entries", () => {
  it("2.1 no self pairs", () => {
    const state = validState();
    for (const n of state.intelligence.networks) {
      expect(n.observerNationId).not.toBe(n.targetNationId);
    }
  });
});

describe("3. all initial levels none", () => {
  it("3.1 all none", () => {
    const state = validState();
    for (const n of state.intelligence.networks) {
      expect(n.level).toBe("none");
    }
  });
});

describe("4. deterministic canonical ordering", () => {
  it("4.1 ordering matches", () => {
    const state = validState();
    const pairs = state.intelligence.networks.map(
      (n) => `${n.observerNationId}|${n.targetNationId}`,
    );
    const expected: string[] = [];
    for (const obs of CANONICAL_NATION_IDS) {
      for (const tgt of CANONICAL_NATION_IDS) {
        if (obs === tgt) continue;
        expected.push(`${obs}|${tgt}`);
      }
    }
    expect(pairs).toEqual(expected);
  });
});

describe("5. deterministic creation", () => {
  it("5.1 two calls produce equal results", () => {
    const a = createInitialGameState();
    const b = createInitialGameState();
    expect(a.intelligence.networks).toEqual(b.intelligence.networks);
  });
});

describe("6. separate network arrays", () => {
  it("6.1 different references", () => {
    const a = createInitialGameState();
    const b = createInitialGameState();
    expect(a.intelligence.networks).not.toBe(b.intelligence.networks);
  });
});

describe("7. unknown observer distinction", () => {
  it("7.1 throws UnknownNationError", () => {
    const state = validState();
    expect(() =>
      getIntelligenceNetwork(state, "nonexistent", "solaris"),
    ).toThrow(UnknownNationError);
  });
});

describe("8. unknown target distinction", () => {
  it("8.1 throws UnknownNationError", () => {
    const state = validState();
    expect(() =>
      getIntelligenceNetwork(state, "solaris", "nonexistent"),
    ).toThrow(UnknownNationError);
  });
});

describe("9. self-network distinction", () => {
  it("9.1 throws SelfIntelligenceNetworkError", () => {
    const state = validState();
    expect(() =>
      getIntelligenceNetwork(state, "solaris", "solaris"),
    ).toThrow(SelfIntelligenceNetworkError);
  });
});

describe("10. missing-network distinction", () => {
  it("10.1 throws MissingIntelligenceNetworkError", () => {
    const state = validState();
    const badIntelligence = {
      ...state.intelligence,
      networks: state.intelligence.networks.filter(
        (n) =>
          !(n.observerNationId === "solaris" && n.targetNationId === "dravos"),
      ),
    };
    const badState: GameState = { ...state, intelligence: badIntelligence };
    expect(() =>
      getIntelligenceNetwork(badState, "solaris", "dravos"),
    ).toThrow(MissingIntelligenceNetworkError);
  });
});

describe("11. duplicate pair validation", () => {
  it("11.1 throws IntelligenceValidationError", () => {
    const state = validState();
    const badIntelligence = {
      ...state.intelligence,
      networks: [
        ...state.intelligence.networks,
        {
          observerNationId: "solaris",
          targetNationId: "dravos",
          level: "none" as const,
        },
      ],
    };
    const badState: GameState = { ...state, intelligence: badIntelligence };
    expect(() => validateIntelligenceState(badState)).toThrow(
      IntelligenceValidationError,
    );
  });
});

describe("12. invalid runtime level validation", () => {
  it("12.1 throws InvalidIntelligenceNetworkLevelError", () => {
    const state = validState();
    const badIntelligence = {
      ...state.intelligence,
      networks: state.intelligence.networks.map((n) =>
        n.observerNationId === "solaris" && n.targetNationId === "dravos"
          ? { ...n, level: "bogus" as never }
          : n,
      ),
    };
    const badState: GameState = { ...state, intelligence: badIntelligence };
    expect(() => validateIntelligenceState(badState)).toThrow(
      ValidationNetworkLevelError,
    );
  });
});

describe("13. immutable transition", () => {
  it("13.1 new references for changed objects", () => {
    const state = validState();
    const next = setIntelligenceNetworkLevel(
      state,
      "solaris",
      "dravos",
      "foothold",
    );
    expect(next).not.toBe(state);
    expect(next.intelligence).not.toBe(state.intelligence);
    expect(next.intelligence.networks).not.toBe(state.intelligence.networks);
  });
});

describe("14. same-level exact-reference no-op", () => {
  it("14.1 returns same reference", () => {
    const state = validState();
    const next = setIntelligenceNetworkLevel(
      state,
      "solaris",
      "dravos",
      "none",
    );
    expect(next).toBe(state);
  });
});

describe("15. nationVisibility reference preserved", () => {
  it("15.1 visibility array unchanged", () => {
    const state = validState();
    const next = setIntelligenceNetworkLevel(
      state,
      "solaris",
      "dravos",
      "foothold",
    );
    expect(next.intelligence.nationVisibility).toBe(
      state.intelligence.nationVisibility,
    );
  });
});

describe("16. progression helper exact mapping", () => {
  it("16.1 none -> foothold", () => {
    expect(getNextIntelligenceNetworkLevel("none")).toBe("foothold");
  });
  it("16.2 foothold -> established", () => {
    expect(getNextIntelligenceNetworkLevel("foothold")).toBe("established");
  });
  it("16.3 established -> deep", () => {
    expect(getNextIntelligenceNetworkLevel("established")).toBe("deep");
  });
  it("16.4 deep -> deep", () => {
    expect(getNextIntelligenceNetworkLevel("deep")).toBe("deep");
  });
});

describe("17. persistence through resolveTurn", () => {
  it("17.1 networks persist", () => {
    const state = validState();
    const changed = setIntelligenceNetworkLevel(
      state,
      "solaris",
      "dravos",
      "foothold",
    );
    const { state: next } = resolveTurn(changed, [passOrder("o1")]);
    const net = getIntelligenceNetwork(next, "solaris", "dravos");
    expect(net.level).toBe("foothold");
  });
});

describe("18. all G0/G1.1/G1.2 tests remain passing", () => {
  it("18.1 invariants intact", () => {
    const state = validState();
    expect(state.turn).toBe(1);
    expect(state.phase).toBe("planning");
    expect(state.playerNationId).toBe("solaris");
    expect(state.world.nations).toHaveLength(6);
    expect(state.intelligence.nationVisibility).toHaveLength(36);
    expect(state.intelligence.networks).toHaveLength(30);
    expect(state.planning.actionPoints).toHaveLength(6);
    expect(() => validateGameState(state)).not.toThrow();
  });
});
