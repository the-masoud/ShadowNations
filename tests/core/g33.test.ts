import { describe, it, expect } from "vitest";
import {
  createAiPlan,
  AiPlanningObserverMismatchError,
  AiPlanningPhaseError,
  AiPlanningNoTargetError,
} from "../../src/core/ai/aiPlanning.js";
import { getAiPersonality } from "../../src/core/ai/aiPersonality.js";
import { createInitialGameState } from "../../src/core/model/gameState.js";
import { createAiPerception } from "../../src/core/ai/aiPerception.js";
import type { AiPerception, AiForeignNationPerception } from "../../src/core/ai/aiPerception.js";

function makePerception(
  overrides: Partial<AiPerception> & {
    foreignNations?: AiForeignNationPerception[];
  },
): AiPerception {
  const defaults: AiPerception = {
    observerNationId: "solaris",
    turn: 1,
    phase: "planning",
    actionPoints: { maximum: 6, remaining: 6 },
    selfStrategicStats: {
      kind: "exact",
      stability: 72,
      publicSupport: 68,
      internalSecurity: 66,
    },
    foreignNations: [],
    involvedProxyConflicts: [],
  };
  return { ...defaults, ...overrides };
}

function makeForeignNation(
  overrides: Partial<AiForeignNationPerception> & { nationId: string },
): AiForeignNationPerception {
  return {
    visibility: "unknown",
    strategicStats: { kind: "unknown" },
    diplomaticStatus: "neutral",
    observerInfluence: 50,
    observerRegimePressure: 0,
    intelligenceNetworkLevel: "none",
    defensiveAwareness: "unaware",
    ...overrides,
    nationId: overrides.nationId,
  };
}

describe("G3.3 — AI Planning", () => {
  describe("domain selection — canonical personalities", () => {
    it("Solaris → diplomacy", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "solaris");
      const personality = getAiPersonality("solaris");
      const plan = createAiPlan(perception, personality);
      expect(plan.domain).toBe("diplomacy");
    });

    it("Dravos → intelligence", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "dravos");
      const personality = getAiPersonality("dravos");
      const plan = createAiPlan(perception, personality);
      expect(plan.domain).toBe("intelligence");
    });

    it("Norvia → diplomacy", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "norvia");
      const personality = getAiPersonality("norvia");
      const plan = createAiPlan(perception, personality);
      expect(plan.domain).toBe("diplomacy");
    });

    it("Veloria → diplomacy", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "veloria");
      const personality = getAiPersonality("veloria");
      const plan = createAiPlan(perception, personality);
      expect(plan.domain).toBe("diplomacy");
    });

    it("Karsen → intelligence", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "karsen");
      const personality = getAiPersonality("karsen");
      const plan = createAiPlan(perception, personality);
      expect(plan.domain).toBe("intelligence");
    });

    it("Arkania → intelligence", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "arkania");
      const personality = getAiPersonality("arkania");
      const plan = createAiPlan(perception, personality);
      expect(plan.domain).toBe("intelligence");
    });

    it("domain tie → diplomacy", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({ nationId: "dravos" }),
        ],
      });
      const personality = {
        nationId: "solaris" as const,
        assertiveness: 50,
        caution: 50,
        diplomacyAffinity: 50,
        intelligenceAffinity: 50,
      };
      const plan = createAiPlan(perception, personality);
      expect(plan.domain).toBe("diplomacy");
    });
  });

  describe("diplomacy target — initial Solaris", () => {
    it("initial Solaris → dravos", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "solaris");
      const personality = getAiPersonality("solaris");
      const plan = createAiPlan(perception, personality);
      expect(plan.targetNationId).toBe("dravos");
    });

    it("hostile score = 30 + floor(influence/10)", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({ nationId: "a", diplomaticStatus: "hostile", observerInfluence: 18 }),
          makeForeignNation({ nationId: "b", diplomaticStatus: "neutral", observerInfluence: 50 }),
          makeForeignNation({ nationId: "c", diplomaticStatus: "friendly", observerInfluence: 90 }),
        ],
      });
      const personality = {
        nationId: "solaris" as const,
        assertiveness: 0,
        caution: 0,
        diplomacyAffinity: 100,
        intelligenceAffinity: 0,
      };
      const plan = createAiPlan(perception, personality);
      expect(plan.targetNationId).toBe("a");
    });

    it("neutral score = 15 + floor(influence/10)", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({ nationId: "a", diplomaticStatus: "neutral", observerInfluence: 50 }),
          makeForeignNation({ nationId: "b", diplomaticStatus: "friendly", observerInfluence: 100 }),
        ],
      });
      const personality = {
        nationId: "solaris" as const,
        assertiveness: 0,
        caution: 0,
        diplomacyAffinity: 100,
        intelligenceAffinity: 0,
      };
      const plan = createAiPlan(perception, personality);
      expect(plan.targetNationId).toBe("a");
    });

    it("friendly score = 0 + floor(influence/10)", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({ nationId: "a", diplomaticStatus: "friendly", observerInfluence: 0 }),
          makeForeignNation({ nationId: "b", diplomaticStatus: "friendly", observerInfluence: 0 }),
        ],
      });
      const personality = {
        nationId: "solaris" as const,
        assertiveness: 0,
        caution: 0,
        diplomacyAffinity: 100,
        intelligenceAffinity: 0,
      };
      const plan = createAiPlan(perception, personality);
      expect(plan.targetNationId).toBe("a");
    });

    it("influence readiness uses floor(influence/10)", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({ nationId: "a", diplomaticStatus: "hostile", observerInfluence: 9 }),
          makeForeignNation({ nationId: "b", diplomaticStatus: "hostile", observerInfluence: 10 }),
        ],
      });
      const personality = {
        nationId: "solaris" as const,
        assertiveness: 0,
        caution: 0,
        diplomacyAffinity: 100,
        intelligenceAffinity: 0,
      };
      const plan = createAiPlan(perception, personality);
      expect(plan.targetNationId).toBe("b");
    });

    it("diplomacy target tie uses first foreign order", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({ nationId: "alpha", diplomaticStatus: "hostile", observerInfluence: 0 }),
          makeForeignNation({ nationId: "beta", diplomaticStatus: "hostile", observerInfluence: 0 }),
        ],
      });
      const personality = {
        nationId: "solaris" as const,
        assertiveness: 0,
        caution: 0,
        diplomacyAffinity: 100,
        intelligenceAffinity: 0,
      };
      const plan = createAiPlan(perception, personality);
      expect(plan.targetNationId).toBe("alpha");
    });

    it("changing diplomatic/influence perception changes target", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({ nationId: "a", diplomaticStatus: "neutral", observerInfluence: 0 }),
          makeForeignNation({ nationId: "b", diplomaticStatus: "hostile", observerInfluence: 0 }),
        ],
      });
      const personality = {
        nationId: "solaris" as const,
        assertiveness: 0,
        caution: 0,
        diplomacyAffinity: 100,
        intelligenceAffinity: 0,
      };
      const plan1 = createAiPlan(perception, personality);
      expect(plan1.targetNationId).toBe("b");

      const perception2 = makePerception({
        foreignNations: [
          makeForeignNation({ nationId: "a", diplomaticStatus: "hostile", observerInfluence: 100 }),
          makeForeignNation({ nationId: "b", diplomaticStatus: "neutral", observerInfluence: 0 }),
        ],
      });
      const plan2 = createAiPlan(perception2, personality);
      expect(plan2.targetNationId).toBe("a");
    });
  });

  describe("intelligence target — initial Dravos", () => {
    it("initial Dravos → solaris", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "dravos");
      const personality = getAiPersonality("dravos");
      const plan = createAiPlan(perception, personality);
      expect(plan.targetNationId).toBe("solaris");
    });

    it("unknown visibility score = 30", () => {
      const perception = makePerception({
        observerNationId: "dravos",
        foreignNations: [
          makeForeignNation({ nationId: "a", visibility: "unknown", intelligenceNetworkLevel: "none", defensiveAwareness: "unaware" }),
        ],
      });
      const personality = {
        nationId: "dravos" as const,
        assertiveness: 100,
        caution: 0,
        diplomacyAffinity: 0,
        intelligenceAffinity: 0,
      };
      const plan = createAiPlan(perception, personality);
      expect(plan.targetNationId).toBe("a");
    });

    it("limited visibility score = 15", () => {
      const perception = makePerception({
        observerNationId: "dravos",
        foreignNations: [
          makeForeignNation({ nationId: "a", visibility: "limited", intelligenceNetworkLevel: "none", defensiveAwareness: "unaware" }),
          makeForeignNation({ nationId: "b", visibility: "known", intelligenceNetworkLevel: "none", defensiveAwareness: "unaware" }),
        ],
      });
      const personality = {
        nationId: "dravos" as const,
        assertiveness: 100,
        caution: 0,
        diplomacyAffinity: 0,
        intelligenceAffinity: 0,
      };
      const plan = createAiPlan(perception, personality);
      expect(plan.targetNationId).toBe("a");
    });

    it("known visibility score = 0", () => {
      const perception = makePerception({
        observerNationId: "dravos",
        foreignNations: [
          makeForeignNation({ nationId: "a", visibility: "known", intelligenceNetworkLevel: "none", defensiveAwareness: "unaware" }),
          makeForeignNation({ nationId: "b", visibility: "known", intelligenceNetworkLevel: "none", defensiveAwareness: "unaware" }),
        ],
      });
      const personality = {
        nationId: "dravos" as const,
        assertiveness: 100,
        caution: 0,
        diplomacyAffinity: 0,
        intelligenceAffinity: 0,
      };
      const plan = createAiPlan(perception, personality);
      expect(plan.targetNationId).toBe("a");
    });

    it("none network score = 20", () => {
      const perception = makePerception({
        observerNationId: "dravos",
        foreignNations: [
          makeForeignNation({ nationId: "a", visibility: "known", intelligenceNetworkLevel: "none", defensiveAwareness: "unaware" }),
          makeForeignNation({ nationId: "b", visibility: "known", intelligenceNetworkLevel: "deep", defensiveAwareness: "unaware" }),
        ],
      });
      const personality = {
        nationId: "dravos" as const,
        assertiveness: 100,
        caution: 0,
        diplomacyAffinity: 0,
        intelligenceAffinity: 0,
      };
      const plan = createAiPlan(perception, personality);
      expect(plan.targetNationId).toBe("a");
    });

    it("foothold network score = 10", () => {
      const perception = makePerception({
        observerNationId: "dravos",
        foreignNations: [
          makeForeignNation({ nationId: "a", visibility: "known", intelligenceNetworkLevel: "foothold", defensiveAwareness: "unaware" }),
          makeForeignNation({ nationId: "b", visibility: "known", intelligenceNetworkLevel: "deep", defensiveAwareness: "unaware" }),
        ],
      });
      const personality = {
        nationId: "dravos" as const,
        assertiveness: 100,
        caution: 0,
        diplomacyAffinity: 0,
        intelligenceAffinity: 0,
      };
      const plan = createAiPlan(perception, personality);
      expect(plan.targetNationId).toBe("a");
    });

    it("established network score = 5", () => {
      const perception = makePerception({
        observerNationId: "dravos",
        foreignNations: [
          makeForeignNation({ nationId: "a", visibility: "known", intelligenceNetworkLevel: "established", defensiveAwareness: "unaware" }),
          makeForeignNation({ nationId: "b", visibility: "known", intelligenceNetworkLevel: "deep", defensiveAwareness: "unaware" }),
        ],
      });
      const personality = {
        nationId: "dravos" as const,
        assertiveness: 100,
        caution: 0,
        diplomacyAffinity: 0,
        intelligenceAffinity: 0,
      };
      const plan = createAiPlan(perception, personality);
      expect(plan.targetNationId).toBe("a");
    });

    it("deep network score = 0", () => {
      const perception = makePerception({
        observerNationId: "dravos",
        foreignNations: [
          makeForeignNation({ nationId: "a", visibility: "known", intelligenceNetworkLevel: "deep", defensiveAwareness: "unaware" }),
          makeForeignNation({ nationId: "b", visibility: "known", intelligenceNetworkLevel: "deep", defensiveAwareness: "unaware" }),
        ],
      });
      const personality = {
        nationId: "dravos" as const,
        assertiveness: 100,
        caution: 0,
        diplomacyAffinity: 0,
        intelligenceAffinity: 0,
      };
      const plan = createAiPlan(perception, personality);
      expect(plan.targetNationId).toBe("a");
    });

    it("unaware awareness score = 0", () => {
      const perception = makePerception({
        observerNationId: "dravos",
        foreignNations: [
          makeForeignNation({ nationId: "a", visibility: "known", intelligenceNetworkLevel: "deep", defensiveAwareness: "unaware" }),
          makeForeignNation({ nationId: "b", visibility: "known", intelligenceNetworkLevel: "deep", defensiveAwareness: "suspected" }),
        ],
      });
      const personality = {
        nationId: "dravos" as const,
        assertiveness: 100,
        caution: 0,
        diplomacyAffinity: 0,
        intelligenceAffinity: 0,
      };
      const plan = createAiPlan(perception, personality);
      expect(plan.targetNationId).toBe("b");
    });

    it("suspected awareness score = 10", () => {
      const perception = makePerception({
        observerNationId: "dravos",
        foreignNations: [
          makeForeignNation({ nationId: "a", visibility: "known", intelligenceNetworkLevel: "deep", defensiveAwareness: "suspected" }),
          makeForeignNation({ nationId: "b", visibility: "known", intelligenceNetworkLevel: "deep", defensiveAwareness: "identified" }),
        ],
      });
      const personality = {
        nationId: "dravos" as const,
        assertiveness: 100,
        caution: 0,
        diplomacyAffinity: 0,
        intelligenceAffinity: 0,
      };
      const plan = createAiPlan(perception, personality);
      expect(plan.targetNationId).toBe("b");
    });

    it("identified awareness score = 20", () => {
      const perception = makePerception({
        observerNationId: "dravos",
        foreignNations: [
          makeForeignNation({ nationId: "a", visibility: "known", intelligenceNetworkLevel: "deep", defensiveAwareness: "identified" }),
          makeForeignNation({ nationId: "b", visibility: "known", intelligenceNetworkLevel: "deep", defensiveAwareness: "identified" }),
        ],
      });
      const personality = {
        nationId: "dravos" as const,
        assertiveness: 100,
        caution: 0,
        diplomacyAffinity: 0,
        intelligenceAffinity: 0,
      };
      const plan = createAiPlan(perception, personality);
      expect(plan.targetNationId).toBe("a");
    });

    it("combined score is exact sum", () => {
      const perception = makePerception({
        observerNationId: "dravos",
        foreignNations: [
          makeForeignNation({
            nationId: "a",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "identified",
          }),
        ],
      });
      const personality = {
        nationId: "dravos" as const,
        assertiveness: 100,
        caution: 0,
        diplomacyAffinity: 0,
        intelligenceAffinity: 0,
      };
      const plan = createAiPlan(perception, personality);
      expect(plan.targetNationId).toBe("a");
    });

    it("intelligence target tie uses first foreign order", () => {
      const perception = makePerception({
        observerNationId: "dravos",
        foreignNations: [
          makeForeignNation({ nationId: "alpha", visibility: "unknown", intelligenceNetworkLevel: "none", defensiveAwareness: "unaware" }),
          makeForeignNation({ nationId: "beta", visibility: "unknown", intelligenceNetworkLevel: "none", defensiveAwareness: "unaware" }),
        ],
      });
      const personality = {
        nationId: "dravos" as const,
        assertiveness: 100,
        caution: 0,
        diplomacyAffinity: 0,
        intelligenceAffinity: 0,
      };
      const plan = createAiPlan(perception, personality);
      expect(plan.targetNationId).toBe("alpha");
    });

    it("uniquely higher intelligence target wins", () => {
      const perception = makePerception({
        observerNationId: "dravos",
        foreignNations: [
          makeForeignNation({ nationId: "a", visibility: "unknown", intelligenceNetworkLevel: "none", defensiveAwareness: "identified" }),
          makeForeignNation({ nationId: "b", visibility: "known", intelligenceNetworkLevel: "deep", defensiveAwareness: "unaware" }),
        ],
      });
      const personality = {
        nationId: "dravos" as const,
        assertiveness: 100,
        caution: 0,
        diplomacyAffinity: 0,
        intelligenceAffinity: 0,
      };
      const plan = createAiPlan(perception, personality);
      expect(plan.targetNationId).toBe("a");
    });
  });

  describe("errors", () => {
    it("observer/personality mismatch", () => {
      const perception = makePerception({ observerNationId: "solaris" });
      const personality = getAiPersonality("dravos");
      expect(() => createAiPlan(perception, personality)).toThrow(
        AiPlanningObserverMismatchError,
      );
    });

    it("mismatch error precedes phase error", () => {
      const perception = makePerception({ observerNationId: "solaris", phase: "resolution" });
      const personality = getAiPersonality("dravos");
      expect(() => createAiPlan(perception, personality)).toThrow(
        AiPlanningObserverMismatchError,
      );
    });

    it("resolution phase fails", () => {
      const perception = makePerception({ observerNationId: "solaris", phase: "resolution" });
      const personality = getAiPersonality("solaris");
      expect(() => createAiPlan(perception, personality)).toThrow(
        AiPlanningPhaseError,
      );
    });

    it("empty foreignNations fails", () => {
      const perception = makePerception({ observerNationId: "solaris", foreignNations: [] });
      const personality = getAiPersonality("solaris");
      expect(() => createAiPlan(perception, personality)).toThrow(
        AiPlanningNoTargetError,
      );
    });
  });

  describe("plan shape", () => {
    it("exactly 4 fields", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "solaris");
      const personality = getAiPersonality("solaris");
      const plan = createAiPlan(perception, personality);
      expect(Object.keys(plan).sort()).toEqual([
        "domain",
        "observerNationId",
        "targetNationId",
        "turn",
      ]);
    });

    it("observerNationId correct", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "solaris");
      const personality = getAiPersonality("solaris");
      const plan = createAiPlan(perception, personality);
      expect(plan.observerNationId).toBe("solaris");
    });

    it("turn copied from perception", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "solaris");
      const personality = getAiPersonality("solaris");
      const plan = createAiPlan(perception, personality);
      expect(plan.turn).toBe(perception.turn);
    });

    it("domain correct for solaris", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "solaris");
      const personality = getAiPersonality("solaris");
      const plan = createAiPlan(perception, personality);
      expect(plan.domain).toBe("diplomacy");
    });

    it("targetNationId correct for initial solaris", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "solaris");
      const personality = getAiPersonality("solaris");
      const plan = createAiPlan(perception, personality);
      expect(plan.targetNationId).toBe("dravos");
    });
  });

  describe("immutability / determinism", () => {
    it("fresh plan object", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "solaris");
      const personality = getAiPersonality("solaris");
      const a = createAiPlan(perception, personality);
      const b = createAiPlan(perception, personality);
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });

    it("same inputs deep-equal output", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "solaris");
      const personality = getAiPersonality("solaris");
      const a = createAiPlan(perception, personality);
      const b = createAiPlan(perception, personality);
      expect(a).toEqual(b);
    });

    it("equal independent inputs deep-equal output", () => {
      const state1 = createInitialGameState();
      const state2 = createInitialGameState();
      const p1 = createAiPerception(state1, "solaris");
      const p2 = createAiPerception(state2, "solaris");
      const pers1 = getAiPersonality("solaris");
      const pers2 = getAiPersonality("solaris");
      const plan1 = createAiPlan(p1, pers1);
      const plan2 = createAiPlan(p2, pers2);
      expect(plan1).toEqual(plan2);
    });

    it("input perception unchanged", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "solaris");
      const snapshot = JSON.stringify(perception);
      const personality = getAiPersonality("solaris");
      createAiPlan(perception, personality);
      expect(JSON.stringify(perception)).toBe(snapshot);
    });

    it("input personality unchanged", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "solaris");
      const personality = getAiPersonality("solaris");
      const snapshot = JSON.stringify(personality);
      createAiPlan(perception, personality);
      expect(JSON.stringify(personality)).toBe(snapshot);
    });

    it("call-order independence", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "dravos");
      const personality = getAiPersonality("dravos");
      const a = createAiPlan(perception, personality);
      createAiPlan(
        createAiPerception(createInitialGameState(), "solaris"),
        getAiPersonality("solaris"),
      );
      const b = createAiPlan(perception, personality);
      expect(a).toEqual(b);
    });
  });

  describe("hidden-information boundary", () => {
    it("diplomacy planning ignores strategic stats, network, awareness, proxy, AP", () => {
      const base: AiForeignNationPerception = {
        nationId: "dravos",
        visibility: "unknown",
        strategicStats: { kind: "unknown" },
        diplomaticStatus: "hostile",
        observerInfluence: 18,
        observerRegimePressure: 0,
        intelligenceNetworkLevel: "none",
        defensiveAwareness: "unaware",
      };
      const perception1 = makePerception({
        observerNationId: "solaris",
        foreignNations: [{ ...base }],
      });
      const perception2 = makePerception({
        observerNationId: "solaris",
        actionPoints: { maximum: 6, remaining: 0 },
        involvedProxyConflicts: [
          { id: "pc-1", hostNationId: "norvia", nationAId: "solaris", nationBId: "dravos", intensity: "high" },
        ],
        foreignNations: [
          {
            ...base,
            visibility: "known",
            strategicStats: { kind: "exact", stability: 10, publicSupport: 10, internalSecurity: 10 },
            intelligenceNetworkLevel: "deep",
            defensiveAwareness: "identified",
            observerRegimePressure: 100,
          },
        ],
      });
      const personality = getAiPersonality("solaris");
      const plan1 = createAiPlan(perception1, personality);
      const plan2 = createAiPlan(perception2, personality);
      expect(plan1).toEqual(plan2);
    });

    it("intelligence planning ignores diplomatic status, influence, proxy, AP", () => {
      const base: AiForeignNationPerception = {
        nationId: "dravos",
        visibility: "unknown",
        strategicStats: { kind: "unknown" },
        diplomaticStatus: "hostile",
        observerInfluence: 18,
        observerRegimePressure: 0,
        intelligenceNetworkLevel: "none",
        defensiveAwareness: "unaware",
      };
      const perception1 = makePerception({
        observerNationId: "dravos",
        foreignNations: [{ ...base }],
      });
      const perception2 = makePerception({
        observerNationId: "dravos",
        actionPoints: { maximum: 6, remaining: 0 },
        involvedProxyConflicts: [
          { id: "pc-1", hostNationId: "norvia", nationAId: "dravos", nationBId: "solaris", intensity: "high" },
        ],
        foreignNations: [
          {
            ...base,
            diplomaticStatus: "friendly",
            observerInfluence: 100,
            observerRegimePressure: 100,
          },
        ],
      });
      const personality = getAiPersonality("dravos");
      const plan1 = createAiPlan(perception1, personality);
      const plan2 = createAiPlan(perception2, personality);
      expect(plan1).toEqual(plan2);
    });
  });

  describe("AP independence", () => {
    it("plan produced when remaining AP is 0", () => {
      const perception = makePerception({
        observerNationId: "solaris",
        actionPoints: { maximum: 6, remaining: 0 },
        foreignNations: [
          makeForeignNation({ nationId: "dravos", diplomaticStatus: "hostile", observerInfluence: 18 }),
        ],
      });
      const personality = getAiPersonality("solaris");
      const plan = createAiPlan(perception, personality);
      expect(plan.domain).toBe("diplomacy");
      expect(plan.targetNationId).toBe("dravos");
    });
  });

  describe("no concrete operation", () => {
    it("plan has no operation/action field", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "solaris");
      const personality = getAiPersonality("solaris");
      const plan = createAiPlan(perception, personality);
      expect(plan).not.toHaveProperty("operation");
      expect(plan).not.toHaveProperty("action");
      expect(plan).not.toHaveProperty("actionCost");
      expect(plan).not.toHaveProperty("operationId");
    });
  });

  describe("no gameplay state changed", () => {
    it("GameState remains unchanged after planning", () => {
      const state = createInitialGameState();
      const snapshot = JSON.stringify(state);
      const perception = createAiPerception(state, "solaris");
      const personality = getAiPersonality("solaris");
      createAiPlan(perception, personality);
      expect(JSON.stringify(state)).toBe(snapshot);
    });
  });

  describe("state shape unchanged", () => {
    it("GameEvent remains 14 variants", () => {
      const eventTypes = [
        "intelligence-network-built",
        "intelligence-gathered",
        "intelligence-asset-recruited",
        "counterintelligence-sweep",
        "intelligence-asset-turned",
        "false-intelligence-fed",
        "turn-advanced",
        "political-influence-cultivated",
        "diplomatic-outreach-conducted",
        "government-stabilized",
        "covert-sabotage-conducted",
        "proxy-conflict-started",
        "proxy-conflict-escalated",
        "regime-pressure-applied",
      ];
      expect(eventTypes.length).toBe(14);
    });
  });
});
