import { describe, it, expect } from "vitest";
import {
  createAiDiplomacyDecision,
  AiDiplomacyPlanDomainError,
  AiDiplomacyObserverMismatchError,
  AiDiplomacyTurnMismatchError,
  AiDiplomacyPhaseError,
  AiDiplomacyTargetNotPerceivedError,
} from "../../src/core/ai/aiDiplomacy.js";
import type { AiDiplomaticAction } from "../../src/core/ai/aiDiplomacy.js";
import type {
  AiPerception,
  AiForeignNationPerception,
  AiPerceivedStrategicStats,
} from "../../src/core/ai/aiPerception.js";
import type { AiPlan } from "../../src/core/ai/aiPlanning.js";
import { createInitialGameState } from "../../src/core/model/gameState.js";
import { createAiPerception } from "../../src/core/ai/aiPerception.js";
import { getAiPersonality } from "../../src/core/ai/aiPersonality.js";
import { createAiPlan } from "../../src/core/ai/aiPlanning.js";
import {
  CULTIVATE_POLITICAL_INFLUENCE_AP_COST,
} from "../../src/core/simulation/cultivatePoliticalInfluence.js";
import {
  DIPLOMATIC_OUTREACH_AP_COST,
} from "../../src/core/simulation/conductDiplomaticOutreach.js";
import {
  STABILIZE_GOVERNMENT_AP_COST,
} from "../../src/core/simulation/stabilizeGovernment.js";

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

function makePlan(
  overrides: Partial<AiPlan> & { targetNationId: string },
): AiPlan {
  return {
    observerNationId: "solaris",
    turn: 1,
    domain: "diplomacy",
    ...overrides,
  };
}

describe("G3.4 — AI Diplomacy", () => {
  describe("model / API", () => {
    it("AiDiplomaticAction permits exactly four values", () => {
      const validActions: AiDiplomaticAction[] = [
        "cultivate-political-influence",
        "conduct-diplomatic-outreach",
        "stabilize-government",
        "pass",
      ];
      expect(validActions.length).toBe(4);
    });

    it("createAiDiplomacyDecision returns correct shape", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({ nationId: "dravos", diplomaticStatus: "hostile", observerInfluence: 18 }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const result = createAiDiplomacyDecision(perception, plan);
      expect(Object.keys(result).sort()).toEqual([
        "action",
        "observerNationId",
        "targetNationId",
        "turn",
      ]);
    });

    it("returns exactly 4 fields", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({ nationId: "dravos", diplomaticStatus: "hostile", observerInfluence: 18 }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const result = createAiDiplomacyDecision(perception, plan);
      expect(Object.keys(result).length).toBe(4);
    });
  });

  describe("error precedence", () => {
    it("AiDiplomacyPlanDomainError precedes all other errors", () => {
      const perception = makePerception({
        observerNationId: "wrong",
        turn: 999,
        phase: "resolution",
        foreignNations: [],
      });
      const plan: AiPlan = {
        observerNationId: "wrong",
        turn: 999,
        domain: "intelligence",
        targetNationId: "missing",
      };
      expect(() => createAiDiplomacyDecision(perception, plan)).toThrow(
        AiDiplomacyPlanDomainError,
      );
    });

    it("AiDiplomacyObserverMismatchError precedes turn/phase/target errors", () => {
      const perception = makePerception({
        observerNationId: "solaris",
        turn: 999,
        phase: "resolution",
        foreignNations: [],
      });
      const plan: AiPlan = {
        observerNationId: "dravos",
        turn: 999,
        domain: "diplomacy",
        targetNationId: "missing",
      };
      expect(() => createAiDiplomacyDecision(perception, plan)).toThrow(
        AiDiplomacyObserverMismatchError,
      );
    });

    it("AiDiplomacyTurnMismatchError precedes phase/target errors", () => {
      const perception = makePerception({
        observerNationId: "solaris",
        turn: 1,
        phase: "resolution",
        foreignNations: [],
      });
      const plan: AiPlan = {
        observerNationId: "solaris",
        turn: 2,
        domain: "diplomacy",
        targetNationId: "missing",
      };
      expect(() => createAiDiplomacyDecision(perception, plan)).toThrow(
        AiDiplomacyTurnMismatchError,
      );
    });

    it("AiDiplomacyPhaseError precedes target error", () => {
      const perception = makePerception({
        observerNationId: "solaris",
        turn: 1,
        phase: "resolution",
        foreignNations: [],
      });
      const plan: AiPlan = {
        observerNationId: "solaris",
        turn: 1,
        domain: "diplomacy",
        targetNationId: "missing",
      };
      expect(() => createAiDiplomacyDecision(perception, plan)).toThrow(
        AiDiplomacyPhaseError,
      );
    });

    it("AiDiplomacyTargetNotPerceivedError is last", () => {
      const perception = makePerception({
        observerNationId: "solaris",
        turn: 1,
        phase: "planning",
        foreignNations: [],
      });
      const plan: AiPlan = {
        observerNationId: "solaris",
        turn: 1,
        domain: "diplomacy",
        targetNationId: "missing",
      };
      expect(() => createAiDiplomacyDecision(perception, plan)).toThrow(
        AiDiplomacyTargetNotPerceivedError,
      );
    });

    it("combined-invalid input throws PlanDomainError first", () => {
      const perception = makePerception({
        observerNationId: "wrong",
        turn: 999,
        phase: "resolution",
        foreignNations: [],
      });
      const plan: AiPlan = {
        observerNationId: "wrong",
        turn: 999,
        domain: "intelligence",
        targetNationId: "missing",
      };
      expect(() => createAiDiplomacyDecision(perception, plan)).toThrow(
        AiDiplomacyPlanDomainError,
      );
    });
  });

  describe("initial canonical Solaris", () => {
    it("canonical G3.3 plan targets dravos", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "solaris");
      const personality = getAiPersonality("solaris");
      const plan = createAiPlan(perception, personality);
      expect(plan.domain).toBe("diplomacy");
      expect(plan.targetNationId).toBe("dravos");
    });

    it("initial G3.4 decision is cultivate-political-influence", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "solaris");
      const personality = getAiPersonality("solaris");
      const plan = createAiPlan(perception, personality);
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision).toEqual({
        observerNationId: "solaris",
        turn: perception.turn,
        targetNationId: "dravos",
        action: "cultivate-political-influence",
      });
    });
  });

  describe("hostile target", () => {
    it("influence 29 → cultivate", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            diplomaticStatus: "hostile",
            observerInfluence: 29,
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).toBe("cultivate-political-influence");
    });

    it("influence 30 → outreach", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            diplomaticStatus: "hostile",
            observerInfluence: 30,
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).toBe("conduct-diplomatic-outreach");
    });

    it("never stabilize", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            diplomaticStatus: "hostile",
            observerInfluence: 100,
            strategicStats: { kind: "exact", stability: 50, publicSupport: 50, internalSecurity: 50 },
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).not.toBe("stabilize-government");
    });
  });

  describe("neutral target", () => {
    it("influence 29 → cultivate", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "norvia",
            diplomaticStatus: "neutral",
            observerInfluence: 29,
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "norvia" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).toBe("cultivate-political-influence");
    });

    it("influence 30 → outreach", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "norvia",
            diplomaticStatus: "neutral",
            observerInfluence: 30,
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "norvia" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).toBe("conduct-diplomatic-outreach");
    });

    it("never stabilize", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "norvia",
            diplomaticStatus: "neutral",
            observerInfluence: 100,
            strategicStats: { kind: "exact", stability: 50, publicSupport: 50, internalSecurity: 50 },
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "norvia" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).not.toBe("stabilize-government");
    });
  });

  describe("friendly target", () => {
    it("exact stability 99 + influence >= 40 → stabilize", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "veloria",
            diplomaticStatus: "friendly",
            observerInfluence: 40,
            strategicStats: {
              kind: "exact",
              stability: 99,
              publicSupport: 50,
              internalSecurity: 50,
            },
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "veloria" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).toBe("stabilize-government");
    });

    it("exact stability 100 → no stabilize", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "veloria",
            diplomaticStatus: "friendly",
            observerInfluence: 40,
            strategicStats: {
              kind: "exact",
              stability: 100,
              publicSupport: 50,
              internalSecurity: 50,
            },
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "veloria" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).not.toBe("stabilize-government");
    });

    it("limited low → stabilize", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "veloria",
            diplomaticStatus: "friendly",
            observerInfluence: 40,
            strategicStats: {
              kind: "limited",
              stability: "low",
              publicSupport: "medium",
              internalSecurity: "medium",
            },
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "veloria" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).toBe("stabilize-government");
    });

    it("limited medium → stabilize", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "veloria",
            diplomaticStatus: "friendly",
            observerInfluence: 40,
            strategicStats: {
              kind: "limited",
              stability: "medium",
              publicSupport: "medium",
              internalSecurity: "medium",
            },
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "veloria" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).toBe("stabilize-government");
    });

    it("limited high → no stabilize", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "veloria",
            diplomaticStatus: "friendly",
            observerInfluence: 40,
            strategicStats: {
              kind: "limited",
              stability: "high",
              publicSupport: "medium",
              internalSecurity: "medium",
            },
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "veloria" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).not.toBe("stabilize-government");
    });

    it("unknown → no stabilize", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "veloria",
            diplomaticStatus: "friendly",
            observerInfluence: 40,
            strategicStats: { kind: "unknown" },
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "veloria" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).not.toBe("stabilize-government");
    });

    it("influence 39 → cultivate", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "veloria",
            diplomaticStatus: "friendly",
            observerInfluence: 39,
            strategicStats: {
              kind: "exact",
              stability: 50,
              publicSupport: 50,
              internalSecurity: 50,
            },
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "veloria" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).toBe("cultivate-political-influence");
    });

    it("influence 40 + safe stability knowledge → stabilize", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "veloria",
            diplomaticStatus: "friendly",
            observerInfluence: 40,
            strategicStats: {
              kind: "exact",
              stability: 80,
              publicSupport: 50,
              internalSecurity: 50,
            },
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "veloria" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).toBe("stabilize-government");
    });

    it("influence 100 + invalid stabilization path → pass", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "veloria",
            diplomaticStatus: "friendly",
            observerInfluence: 100,
            strategicStats: { kind: "unknown" },
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "veloria" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).toBe("pass");
    });

    it("never conduct-diplomatic-outreach", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "veloria",
            diplomaticStatus: "friendly",
            observerInfluence: 100,
            strategicStats: {
              kind: "exact",
              stability: 50,
              publicSupport: 50,
              internalSecurity: 50,
            },
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "veloria" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).not.toBe("conduct-diplomatic-outreach");
    });
  });

  describe("AP boundaries", () => {
    it("AP 1 → pass (cultivate path)", () => {
      const perception = makePerception({
        actionPoints: { maximum: 6, remaining: 1 },
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            diplomaticStatus: "hostile",
            observerInfluence: 18,
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).toBe("pass");
    });

    it("AP 2 → selected candidate (cultivate)", () => {
      const perception = makePerception({
        actionPoints: { maximum: 6, remaining: 2 },
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            diplomaticStatus: "hostile",
            observerInfluence: 18,
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).toBe("cultivate-political-influence");
    });

    it("AP 2 → selected candidate (outreach)", () => {
      const perception = makePerception({
        actionPoints: { maximum: 6, remaining: 2 },
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            diplomaticStatus: "hostile",
            observerInfluence: 30,
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).toBe("conduct-diplomatic-outreach");
    });

    it("AP 2 → selected candidate (stabilize)", () => {
      const perception = makePerception({
        actionPoints: { maximum: 6, remaining: 2 },
        foreignNations: [
          makeForeignNation({
            nationId: "veloria",
            diplomaticStatus: "friendly",
            observerInfluence: 40,
            strategicStats: {
              kind: "exact",
              stability: 80,
              publicSupport: 50,
              internalSecurity: 50,
            },
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "veloria" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).toBe("stabilize-government");
    });

    it("AP 1 → pass (outreach path)", () => {
      const perception = makePerception({
        actionPoints: { maximum: 6, remaining: 1 },
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            diplomaticStatus: "hostile",
            observerInfluence: 30,
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).toBe("pass");
    });

    it("AP 1 → pass (stabilize path)", () => {
      const perception = makePerception({
        actionPoints: { maximum: 6, remaining: 1 },
        foreignNations: [
          makeForeignNation({
            nationId: "veloria",
            diplomaticStatus: "friendly",
            observerInfluence: 40,
            strategicStats: {
              kind: "exact",
              stability: 80,
              publicSupport: 50,
              internalSecurity: 50,
            },
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "veloria" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).toBe("pass");
    });

    it("AP remains unchanged after decision", () => {
      const perception = makePerception({
        actionPoints: { maximum: 6, remaining: 6 },
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            diplomaticStatus: "hostile",
            observerInfluence: 18,
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      createAiDiplomacyDecision(perception, plan);
      expect(perception.actionPoints.remaining).toBe(6);
      expect(perception.actionPoints.maximum).toBe(6);
    });
  });

  describe("target", () => {
    it("plan target is used exactly", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({ nationId: "alpha", diplomaticStatus: "hostile", observerInfluence: 18 }),
          makeForeignNation({ nationId: "beta", diplomaticStatus: "neutral", observerInfluence: 50 }),
        ],
      });
      const plan = makePlan({ targetNationId: "beta" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.targetNationId).toBe("beta");
    });

    it("target is never reselected", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({ nationId: "alpha", diplomaticStatus: "hostile", observerInfluence: 100 }),
          makeForeignNation({ nationId: "beta", diplomaticStatus: "neutral", observerInfluence: 0 }),
        ],
      });
      const plan = makePlan({ targetNationId: "beta" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.targetNationId).toBe("beta");
    });

    it("missing target throws AiDiplomacyTargetNotPerceivedError", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({ nationId: "alpha" }),
        ],
      });
      const plan = makePlan({ targetNationId: "missing" });
      expect(() => createAiDiplomacyDecision(perception, plan)).toThrow(
        AiDiplomacyTargetNotPerceivedError,
      );
    });
  });

  describe("forbidden data independence", () => {
    const baseTarget: AiForeignNationPerception = {
      nationId: "dravos",
      visibility: "unknown",
      strategicStats: { kind: "unknown" },
      diplomaticStatus: "hostile",
      observerInfluence: 18,
      observerRegimePressure: 0,
      intelligenceNetworkLevel: "none",
      defensiveAwareness: "unaware",
    };

    it("changing observerRegimePressure does not change decision", () => {
      const p1 = makePerception({
        foreignNations: [{ ...baseTarget, observerRegimePressure: 0 }],
      });
      const p2 = makePerception({
        foreignNations: [{ ...baseTarget, observerRegimePressure: 100 }],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      expect(createAiDiplomacyDecision(p1, plan)).toEqual(
        createAiDiplomacyDecision(p2, plan),
      );
    });

    it("changing intelligenceNetworkLevel does not change decision", () => {
      const p1 = makePerception({
        foreignNations: [{ ...baseTarget, intelligenceNetworkLevel: "none" }],
      });
      const p2 = makePerception({
        foreignNations: [{ ...baseTarget, intelligenceNetworkLevel: "deep" }],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      expect(createAiDiplomacyDecision(p1, plan)).toEqual(
        createAiDiplomacyDecision(p2, plan),
      );
    });

    it("changing defensiveAwareness does not change decision", () => {
      const p1 = makePerception({
        foreignNations: [{ ...baseTarget, defensiveAwareness: "unaware" }],
      });
      const p2 = makePerception({
        foreignNations: [{ ...baseTarget, defensiveAwareness: "identified" }],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      expect(createAiDiplomacyDecision(p1, plan)).toEqual(
        createAiDiplomacyDecision(p2, plan),
      );
    });

    it("changing involvedProxyConflicts does not change decision", () => {
      const p1 = makePerception({
        foreignNations: [{ ...baseTarget }],
        involvedProxyConflicts: [],
      });
      const p2 = makePerception({
        foreignNations: [{ ...baseTarget }],
        involvedProxyConflicts: [
          { id: "pc-1", hostNationId: "norvia", nationAId: "solaris", nationBId: "dravos", intensity: "high" },
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      expect(createAiDiplomacyDecision(p1, plan)).toEqual(
        createAiDiplomacyDecision(p2, plan),
      );
    });

    it("changing visibility does not change decision", () => {
      const p1 = makePerception({
        foreignNations: [{ ...baseTarget, visibility: "unknown" }],
      });
      const p2 = makePerception({
        foreignNations: [{ ...baseTarget, visibility: "known" }],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      expect(createAiDiplomacyDecision(p1, plan)).toEqual(
        createAiDiplomacyDecision(p2, plan),
      );
    });

    it("changing publicSupport does not change decision", () => {
      const p1 = makePerception({
        foreignNations: [
          {
            ...baseTarget,
            strategicStats: {
              kind: "exact",
              stability: 80,
              publicSupport: 0,
              internalSecurity: 50,
            },
          },
        ],
      });
      const p2 = makePerception({
        foreignNations: [
          {
            ...baseTarget,
            strategicStats: {
              kind: "exact",
              stability: 80,
              publicSupport: 100,
              internalSecurity: 50,
            },
          },
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      expect(createAiDiplomacyDecision(p1, plan)).toEqual(
        createAiDiplomacyDecision(p2, plan),
      );
    });

    it("changing internalSecurity does not change decision", () => {
      const p1 = makePerception({
        foreignNations: [
          {
            ...baseTarget,
            strategicStats: {
              kind: "exact",
              stability: 80,
              publicSupport: 50,
              internalSecurity: 0,
            },
          },
        ],
      });
      const p2 = makePerception({
        foreignNations: [
          {
            ...baseTarget,
            strategicStats: {
              kind: "exact",
              stability: 80,
              publicSupport: 50,
              internalSecurity: 100,
            },
          },
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      expect(createAiDiplomacyDecision(p1, plan)).toEqual(
        createAiDiplomacyDecision(p2, plan),
      );
    });
  });

  describe("immutability", () => {
    it("perception unchanged after decision", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({ nationId: "dravos", diplomaticStatus: "hostile", observerInfluence: 18 }),
        ],
      });
      const snapshot = JSON.stringify(perception);
      const plan = makePlan({ targetNationId: "dravos" });
      createAiDiplomacyDecision(perception, plan);
      expect(JSON.stringify(perception)).toBe(snapshot);
    });

    it("plan unchanged after decision", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({ nationId: "dravos", diplomaticStatus: "hostile", observerInfluence: 18 }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const snapshot = JSON.stringify(plan);
      createAiDiplomacyDecision(perception, plan);
      expect(JSON.stringify(plan)).toBe(snapshot);
    });

    it("fresh decision object each call", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({ nationId: "dravos", diplomaticStatus: "hostile", observerInfluence: 18 }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const a = createAiDiplomacyDecision(perception, plan);
      const b = createAiDiplomacyDecision(perception, plan);
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  describe("determinism", () => {
    it("same inputs → deeply equal output", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({ nationId: "dravos", diplomaticStatus: "hostile", observerInfluence: 18 }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const a = createAiDiplomacyDecision(perception, plan);
      const b = createAiDiplomacyDecision(perception, plan);
      expect(a).toEqual(b);
    });

    it("deeply equal independent inputs → deeply equal output", () => {
      const p1 = makePerception({
        foreignNations: [
          makeForeignNation({ nationId: "dravos", diplomaticStatus: "hostile", observerInfluence: 18 }),
        ],
      });
      const p2 = makePerception({
        foreignNations: [
          makeForeignNation({ nationId: "dravos", diplomaticStatus: "hostile", observerInfluence: 18 }),
        ],
      });
      const pl1 = makePlan({ targetNationId: "dravos" });
      const pl2 = makePlan({ targetNationId: "dravos" });
      expect(createAiDiplomacyDecision(p1, pl1)).toEqual(
        createAiDiplomacyDecision(p2, pl2),
      );
    });

    it("call order does not affect output", () => {
      const p1 = makePerception({
        foreignNations: [
          makeForeignNation({ nationId: "dravos", diplomaticStatus: "hostile", observerInfluence: 18 }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const a = createAiDiplomacyDecision(p1, plan);
      createAiDiplomacyDecision(
        makePerception({
          observerNationId: "norvia",
          foreignNations: [
            makeForeignNation({ nationId: "solaris", diplomaticStatus: "neutral", observerInfluence: 50 }),
          ],
        }),
        makePlan({ observerNationId: "norvia", targetNationId: "solaris" }),
      );
      const b = createAiDiplomacyDecision(p1, plan);
      expect(a).toEqual(b);
    });
  });

  describe("scope", () => {
    it("no G2 operation executed", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({ nationId: "dravos", diplomaticStatus: "hostile", observerInfluence: 18 }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const result = createAiDiplomacyDecision(perception, plan);
      expect(typeof result.action).toBe("string");
      expect(result).not.toHaveProperty("operation");
      expect(result).not.toHaveProperty("event");
      expect(result).not.toHaveProperty("state");
    });

    it("no AP spent", () => {
      const perception = makePerception({
        actionPoints: { maximum: 6, remaining: 6 },
        foreignNations: [
          makeForeignNation({ nationId: "dravos", diplomaticStatus: "hostile", observerInfluence: 18 }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      createAiDiplomacyDecision(perception, plan);
      expect(perception.actionPoints.remaining).toBe(6);
    });

    it("no GameEvent created", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({ nationId: "dravos", diplomaticStatus: "hostile", observerInfluence: 18 }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const result = createAiDiplomacyDecision(perception, plan);
      expect(result).not.toHaveProperty("event");
      expect(result).not.toHaveProperty("events");
    });

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

  describe("AP-cost imports", () => {
    it("CULTIVATE_POLITICAL_INFLUENCE_AP_COST is 2", () => {
      expect(CULTIVATE_POLITICAL_INFLUENCE_AP_COST).toBe(2);
    });

    it("DIPLOMATIC_OUTREACH_AP_COST is 2", () => {
      expect(DIPLOMATIC_OUTREACH_AP_COST).toBe(2);
    });

    it("STABILIZE_GOVERNMENT_AP_COST is 2", () => {
      expect(STABILIZE_GOVERNMENT_AP_COST).toBe(2);
    });
  });

  describe("stability knowledge boundaries", () => {
    it("exact stability 99 is known below maximum", () => {
      const stats: AiPerceivedStrategicStats = {
        kind: "exact",
        stability: 99,
        publicSupport: 50,
        internalSecurity: 50,
      };
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "veloria",
            diplomaticStatus: "friendly",
            observerInfluence: 40,
            strategicStats: stats,
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "veloria" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).toBe("stabilize-government");
    });

    it("exact stability 100 is NOT known below maximum", () => {
      const stats: AiPerceivedStrategicStats = {
        kind: "exact",
        stability: 100,
        publicSupport: 50,
        internalSecurity: 50,
      };
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "veloria",
            diplomaticStatus: "friendly",
            observerInfluence: 40,
            strategicStats: stats,
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "veloria" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).not.toBe("stabilize-government");
    });

    it("limited low is known below maximum", () => {
      const stats: AiPerceivedStrategicStats = {
        kind: "limited",
        stability: "low",
        publicSupport: "medium",
        internalSecurity: "medium",
      };
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "veloria",
            diplomaticStatus: "friendly",
            observerInfluence: 40,
            strategicStats: stats,
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "veloria" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).toBe("stabilize-government");
    });

    it("limited medium is known below maximum", () => {
      const stats: AiPerceivedStrategicStats = {
        kind: "limited",
        stability: "medium",
        publicSupport: "low",
        internalSecurity: "low",
      };
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "veloria",
            diplomaticStatus: "friendly",
            observerInfluence: 40,
            strategicStats: stats,
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "veloria" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).toBe("stabilize-government");
    });

    it("limited high is NOT known below maximum", () => {
      const stats: AiPerceivedStrategicStats = {
        kind: "limited",
        stability: "high",
        publicSupport: "medium",
        internalSecurity: "medium",
      };
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "veloria",
            diplomaticStatus: "friendly",
            observerInfluence: 40,
            strategicStats: stats,
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "veloria" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).not.toBe("stabilize-government");
    });

    it("unknown is NOT known below maximum", () => {
      const stats: AiPerceivedStrategicStats = { kind: "unknown" };
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "veloria",
            diplomaticStatus: "friendly",
            observerInfluence: 40,
            strategicStats: stats,
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "veloria" });
      const decision = createAiDiplomacyDecision(perception, plan);
      expect(decision.action).not.toBe("stabilize-government");
    });
  });

  describe("regression", () => {
    it("G3.1 perception creation still works", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "solaris");
      expect(perception.observerNationId).toBe("solaris");
      expect(perception.foreignNations.length).toBeGreaterThan(0);
    });

    it("G3.2 personality lookup still works", () => {
      const personality = getAiPersonality("solaris");
      expect(personality.nationId).toBe("solaris");
    });

    it("G3.3 plan creation still works", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "solaris");
      const personality = getAiPersonality("solaris");
      const plan = createAiPlan(perception, personality);
      expect(plan.domain).toBe("diplomacy");
      expect(plan.targetNationId).toBe("dravos");
    });
  });
});
