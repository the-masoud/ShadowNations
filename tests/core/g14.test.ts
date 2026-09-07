import { describe, it, expect } from "vitest";
import {
  getIntelligenceAgent,
  UnknownIntelligenceAgentError,
  CANONICAL_AGENTS,
} from "../../src/core/model/intelligenceAgent";
import {
  getIntelligenceAsset,
  UnknownIntelligenceAssetError,
} from "../../src/core/model/intelligenceAsset";
import type { IntelligenceAsset } from "../../src/core/model/intelligenceAsset";
import {
  addIntelligenceAsset,
  DuplicateIntelligenceAssetError,
} from "../../src/core/simulation/addIntelligenceAsset";
import { validateIntelligenceState, IntelligenceValidationError } from "../../src/core/simulation/validateIntelligenceState";
import { createInitialGameState } from "../../src/core/model/gameState";
import type { GameState } from "../../src/core/model/gameState";
import { validateGameState } from "../../src/core/simulation/validateGameState";
import { resolveTurn } from "../../src/core/simulation/resolveTurn";
import type { TurnOrder } from "../../src/core/model/turnOrder";

function validState(): GameState {
  return createInitialGameState();
}

function passOrder(id: string, nationId = "solaris"): TurnOrder {
  return { id, nationId, kind: "pass" };
}

describe("1. exact 12 canonical agent identities/order", () => {
  it("1.1 has 12 agents in order", () => {
    const state = validState();
    expect(state.intelligence.agents).toHaveLength(12);
    const ids = state.intelligence.agents.map((a) => a.id);
    expect(ids).toEqual(CANONICAL_AGENTS.map((a) => a.id));
  });
});

describe("2. canonical initial ownership of agents", () => {
  it("2.1 ownership matches", () => {
    const state = validState();
    expect(state.intelligence.agents[0].ownerNationId).toBe("solaris");
    expect(state.intelligence.agents[1].ownerNationId).toBe("solaris");
    expect(state.intelligence.agents[2].ownerNationId).toBe("dravos");
    expect(state.intelligence.agents[3].ownerNationId).toBe("dravos");
    expect(state.intelligence.agents[4].ownerNationId).toBe("norvia");
    expect(state.intelligence.agents[5].ownerNationId).toBe("norvia");
    expect(state.intelligence.agents[6].ownerNationId).toBe("veloria");
    expect(state.intelligence.agents[7].ownerNationId).toBe("veloria");
    expect(state.intelligence.agents[8].ownerNationId).toBe("karsen");
    expect(state.intelligence.agents[9].ownerNationId).toBe("karsen");
    expect(state.intelligence.agents[10].ownerNationId).toBe("arkania");
    expect(state.intelligence.agents[11].ownerNationId).toBe("arkania");
  });
});

describe("3. initial assets empty", () => {
  it("3.1 empty", () => {
    const state = validState();
    expect(state.intelligence.assets).toHaveLength(0);
  });
});

describe("4. deterministic initial creation", () => {
  it("4.1 equal results", () => {
    const a = validState();
    const b = validState();
    expect(a.intelligence.agents).toEqual(b.intelligence.agents);
    expect(a.intelligence.assets).toEqual(b.intelligence.assets);
  });
});

describe("5. separate agent/asset arrays", () => {
  it("5.1 different references", () => {
    const a = validState();
    const b = validState();
    expect(a.intelligence.agents).not.toBe(b.intelligence.agents);
    expect(a.intelligence.assets).not.toBe(b.intelligence.assets);
  });
});

describe("6. agent lookup", () => {
  it("6.1 found", () => {
    const state = validState();
    const agent = getIntelligenceAgent(state, "solaris-echo");
    expect(agent.id).toBe("solaris-echo");
    expect(agent.codename).toBe("Echo");
  });
});

describe("7. asset lookup", () => {
  it("7.1 unknown throws", () => {
    const state = validState();
    expect(() => getIntelligenceAsset(state, "nonexistent")).toThrow(
      UnknownIntelligenceAssetError,
    );
  });
});

describe("8. invalid agent structural cases", () => {
  it("8.1 unknown agent throws", () => {
    const state = validState();
    expect(() => getIntelligenceAgent(state, "nonexistent")).toThrow(
      UnknownIntelligenceAgentError,
    );
  });
});

describe("9. invalid asset structural cases", () => {
  it("9.1 empty owner fails validation", () => {
    const state = validState();
    const badIntelligence = {
      ...state.intelligence,
      assets: [
        {
          id: "test",
          ownerNationId: "nonexistent",
          targetNationId: "dravos",
          access: "limited" as const,
        },
      ],
    };
    const badState: GameState = { ...state, intelligence: badIntelligence };
    expect(() => validateIntelligenceState(badState)).toThrow(
      IntelligenceValidationError,
    );
  });
});

describe("10. duplicate asset ID rejection", () => {
  it("10.1 addIntelligenceAsset rejects duplicate", () => {
    const state = validState();
    const asset: IntelligenceAsset = {
      id: "asset-001",
      ownerNationId: "solaris",
      targetNationId: "dravos",
      access: "limited",
    };
    const state1 = addIntelligenceAsset(state, asset);
    expect(() => addIntelligenceAsset(state1, asset)).toThrow(
      DuplicateIntelligenceAssetError,
    );
  });
});

describe("11. immutable addIntelligenceAsset", () => {
  it("11.1 new references", () => {
    const state = validState();
    const asset: IntelligenceAsset = {
      id: "asset-001",
      ownerNationId: "solaris",
      targetNationId: "dravos",
      access: "limited",
    };
    const next = addIntelligenceAsset(state, asset);
    expect(next).not.toBe(state);
    expect(next.intelligence).not.toBe(state.intelligence);
    expect(next.intelligence.assets).not.toBe(state.intelligence.assets);
  });
});

describe("12. unrelated intelligence references preserved", () => {
  it("12.1 networks and visibility unchanged", () => {
    const state = validState();
    const asset: IntelligenceAsset = {
      id: "asset-001",
      ownerNationId: "solaris",
      targetNationId: "dravos",
      access: "limited",
    };
    const next = addIntelligenceAsset(state, asset);
    expect(next.intelligence.nationVisibility).toBe(
      state.intelligence.nationVisibility,
    );
    expect(next.intelligence.networks).toBe(state.intelligence.networks);
    expect(next.intelligence.agents).toBe(state.intelligence.agents);
  });
});

describe("13. agents/assets survive resolveTurn", () => {
  it("13.1 persist", () => {
    const state = validState();
    const asset: IntelligenceAsset = {
      id: "asset-001",
      ownerNationId: "solaris",
      targetNationId: "dravos",
      access: "limited",
    };
    const withAsset = addIntelligenceAsset(state, asset);
    const { state: next } = resolveTurn(withAsset, [passOrder("o1")]);
    expect(next.intelligence.agents).toHaveLength(12);
    expect(next.intelligence.assets).toHaveLength(1);
    expect(next.intelligence.assets[0].id).toBe("asset-001");
  });
});

describe("14. all earlier tests remain passing", () => {
  it("14.1 invariants intact", () => {
    const state = validState();
    expect(state.turn).toBe(1);
    expect(state.phase).toBe("planning");
    expect(state.playerNationId).toBe("solaris");
    expect(state.intelligence.nationVisibility).toHaveLength(36);
    expect(state.intelligence.networks).toHaveLength(30);
    expect(state.intelligence.agents).toHaveLength(12);
    expect(state.intelligence.assets).toHaveLength(0);
    expect(() => validateGameState(state)).not.toThrow();
  });
});
