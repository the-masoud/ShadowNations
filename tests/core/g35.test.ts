import { describe, it, expect } from "vitest";
import {
  createAiEspionageDecision,
  AiEspionagePlanDomainError,
  AiEspionageObserverMismatchError,
  AiEspionageTurnMismatchError,
  AiEspionagePhaseError,
  AiEspionageTargetNotPerceivedError,
} from "../../src/core/ai/aiEspionage.js";
import type { AiEspionageAction } from "../../src/core/ai/aiEspionage.js";
import type {
  AiPerception,
  AiForeignNationPerception,
  AiExactStrategicStats,
} from "../../src/core/ai/aiPerception.js";
import type { AiPlan } from "../../src/core/ai/aiPlanning.js";
import { createInitialGameState } from "../../src/core/model/gameState.js";
import { createAiPerception } from "../../src/core/ai/aiPerception.js";
import { getAiPersonality } from "../../src/core/ai/aiPersonality.js";
import { createAiPlan } from "../../src/core/ai/aiPlanning.js";
import { BUILD_NETWORK_AP_COST } from "../../src/core/simulation/buildIntelligenceNetwork.js";
import { GATHER_INTELLIGENCE_AP_COST } from "../../src/core/simulation/gatherIntelligence.js";
import { COUNTERINTELLIGENCE_SWEEP_AP_COST } from "../../src/core/simulation/runCounterintelligenceSweep.js";
import { COVERT_SABOTAGE_AP_COST } from "../../src/core/simulation/conductCovertSabotage.js";

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
    domain: "intelligence",
    ...overrides,
  };
}

function exactStats(
  overrides: Partial<AiExactStrategicStats> = {},
): AiExactStrategicStats {
  return {
    kind: "exact",
    stability: 50,
    publicSupport: 50,
    internalSecurity: 50,
    ...overrides,
  };
}

describe("G3.5 — AI Espionage", () => {
  describe("model / API", () => {
    it("AiEspionageAction permits exactly five values", () => {
      const validActions: AiEspionageAction[] = [
        "build-intelligence-network",
        "gather-intelligence",
        "counterintelligence-sweep",
        "conduct-covert-sabotage",
        "pass",
      ];
      expect(validActions.length).toBe(5);
    });

    it("createAiEspionageDecision returns correct shape with 5 fields", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const result = createAiEspionageDecision(perception, plan);
      expect(Object.keys(result).sort()).toEqual([
        "action",
        "observerNationId",
        "sabotageObjective",
        "targetNationId",
        "turn",
      ]);
      expect(Object.keys(result).length).toBe(5);
    });

    it("returns fresh decision objects on each call", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const resultA = createAiEspionageDecision(perception, plan);
      const resultB = createAiEspionageDecision(perception, plan);
      expect(resultA).not.toBe(resultB);
      expect(resultA).toEqual(resultB);
    });
  });

  describe("error precedence — A-E exact boundary proof", () => {
    it("A: wrong domain + wrong observer + wrong turn + resolution + missing → PlanDomainError", () => {
      const perception = makePerception({
        observerNationId: "wrong",
        turn: 999,
        phase: "resolution",
        foreignNations: [],
      });
      const plan: AiPlan = {
        observerNationId: "wrong",
        turn: 999,
        domain: "diplomacy",
        targetNationId: "missing",
      };
      expect(() => createAiEspionageDecision(perception, plan)).toThrow(
        AiEspionagePlanDomainError,
      );
    });

    it("B: valid intelligence domain + wrong observer + wrong turn + resolution + missing → ObserverMismatchError", () => {
      const perception = makePerception({
        observerNationId: "solaris",
        turn: 999,
        phase: "resolution",
        foreignNations: [],
      });
      const plan: AiPlan = {
        observerNationId: "dravos",
        turn: 999,
        domain: "intelligence",
        targetNationId: "missing",
      };
      expect(() => createAiEspionageDecision(perception, plan)).toThrow(
        AiEspionageObserverMismatchError,
      );
    });

    it("C: valid domain + matching observer + wrong turn + resolution + missing → TurnMismatchError", () => {
      const perception = makePerception({
        observerNationId: "solaris",
        turn: 1,
        phase: "resolution",
        foreignNations: [],
      });
      const plan: AiPlan = {
        observerNationId: "solaris",
        turn: 2,
        domain: "intelligence",
        targetNationId: "missing",
      };
      expect(() => createAiEspionageDecision(perception, plan)).toThrow(
        AiEspionageTurnMismatchError,
      );
    });

    it("D: valid domain + matching observer + matching turn + resolution + missing → PhaseError", () => {
      const perception = makePerception({
        observerNationId: "solaris",
        turn: 1,
        phase: "resolution",
        foreignNations: [],
      });
      const plan: AiPlan = {
        observerNationId: "solaris",
        turn: 1,
        domain: "intelligence",
        targetNationId: "missing",
      };
      expect(() => createAiEspionageDecision(perception, plan)).toThrow(
        AiEspionagePhaseError,
      );
    });

    it("E: valid domain + matching observer + matching turn + planning + missing → TargetNotPerceivedError", () => {
      const perception = makePerception({
        observerNationId: "solaris",
        turn: 1,
        phase: "planning",
        foreignNations: [],
      });
      const plan: AiPlan = {
        observerNationId: "solaris",
        turn: 1,
        domain: "intelligence",
        targetNationId: "missing",
      };
      expect(() => createAiEspionageDecision(perception, plan)).toThrow(
        AiEspionageTargetNotPerceivedError,
      );
    });
  });

  describe("initial canonical Dravos → Solaris result", () => {
    it("Dravos with unknown/none/unaware/6AP → build-intelligence-network", () => {
      const perception = makePerception({
        observerNationId: "dravos",
        foreignNations: [
          makeForeignNation({
            nationId: "solaris",
            visibility: "unknown",
            strategicStats: { kind: "unknown" },
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan: AiPlan = {
        observerNationId: "dravos",
        turn: perception.turn,
        domain: "intelligence",
        targetNationId: "solaris",
      };
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision).toEqual({
        observerNationId: "dravos",
        turn: perception.turn,
        targetNationId: "solaris",
        action: "build-intelligence-network",
        sabotageObjective: null,
      });
    });
  });

  describe("awareness boundary", () => {
    it("unaware → normal policy (not sweep)", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("build-intelligence-network");
      expect(decision.sabotageObjective).toBeNull();
    });

    it("suspected → counterintelligence-sweep", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "suspected",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("counterintelligence-sweep");
      expect(decision.sabotageObjective).toBeNull();
    });

    it("identified → normal policy (not sweep)", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "identified",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("build-intelligence-network");
      expect(decision.sabotageObjective).toBeNull();
    });
  });

  describe("network/visibility boundaries", () => {
    it("none → build-intelligence-network", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("build-intelligence-network");
    });

    it("foothold → build-intelligence-network", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "foothold",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("build-intelligence-network");
    });

    it("established + unknown → gather-intelligence", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "established",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("gather-intelligence");
    });

    it("established + limited → gather-intelligence", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "limited",
            intelligenceNetworkLevel: "established",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("gather-intelligence");
    });

    it("deep + unknown → gather-intelligence", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "deep",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("gather-intelligence");
    });

    it("deep + limited → gather-intelligence", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "limited",
            intelligenceNetworkLevel: "deep",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("gather-intelligence");
    });

    it("established + known → build-intelligence-network (deepen)", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "known",
            strategicStats: exactStats(),
            intelligenceNetworkLevel: "established",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("build-intelligence-network");
      expect(decision.sabotageObjective).toBeNull();
    });
  });

  describe("sabotage evaluation — deep + known + exact", () => {
    it("internalSecurity > 0 → conduct-covert-sabotage / internal-security", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "known",
            strategicStats: exactStats({ internalSecurity: 50, publicSupport: 80 }),
            intelligenceNetworkLevel: "deep",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("conduct-covert-sabotage");
      expect(decision.sabotageObjective).toBe("internal-security");
    });

    it("internalSecurity 1 wins before publicSupport 100", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "known",
            strategicStats: exactStats({ internalSecurity: 1, publicSupport: 100 }),
            intelligenceNetworkLevel: "deep",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("conduct-covert-sabotage");
      expect(decision.sabotageObjective).toBe("internal-security");
    });

    it("internalSecurity 0 + publicSupport > 0 → public-support", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "known",
            strategicStats: exactStats({ internalSecurity: 0, publicSupport: 50 }),
            intelligenceNetworkLevel: "deep",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("conduct-covert-sabotage");
      expect(decision.sabotageObjective).toBe("public-support");
    });

    it("both 0 → pass / null", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "known",
            strategicStats: exactStats({ internalSecurity: 0, publicSupport: 0 }),
            intelligenceNetworkLevel: "deep",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("pass");
      expect(decision.sabotageObjective).toBeNull();
    });

    it("stability does not affect sabotage objective", () => {
      const highStability = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "known",
            strategicStats: exactStats({ stability: 100, internalSecurity: 0, publicSupport: 30 }),
            intelligenceNetworkLevel: "deep",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const lowStability = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "known",
            strategicStats: exactStats({ stability: 0, internalSecurity: 0, publicSupport: 30 }),
            intelligenceNetworkLevel: "deep",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const resultHigh = createAiEspionageDecision(highStability, plan);
      const resultLow = createAiEspionageDecision(lowStability, plan);
      expect(resultHigh.action).toBe(resultLow.action);
      expect(resultHigh.sabotageObjective).toBe(resultLow.sabotageObjective);
    });
  });

  describe("AP boundary results", () => {
    it("BUILD: AP 1 → pass", () => {
      const perception = makePerception({
        actionPoints: { maximum: 6, remaining: 1 },
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("pass");
      expect(decision.sabotageObjective).toBeNull();
    });

    it("BUILD: AP 2 → build-intelligence-network", () => {
      const perception = makePerception({
        actionPoints: { maximum: 6, remaining: 2 },
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("build-intelligence-network");
    });

    it("GATHER: AP 0 → pass", () => {
      const perception = makePerception({
        actionPoints: { maximum: 6, remaining: 0 },
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "established",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("pass");
      expect(decision.sabotageObjective).toBeNull();
    });

    it("GATHER: AP 1 → gather-intelligence", () => {
      const perception = makePerception({
        actionPoints: { maximum: 6, remaining: 1 },
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "established",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("gather-intelligence");
    });

    it("SWEEP: AP 1 → pass", () => {
      const perception = makePerception({
        actionPoints: { maximum: 6, remaining: 1 },
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "suspected",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("pass");
      expect(decision.sabotageObjective).toBeNull();
    });

    it("SWEEP: AP 2 → counterintelligence-sweep", () => {
      const perception = makePerception({
        actionPoints: { maximum: 6, remaining: 2 },
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "suspected",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("counterintelligence-sweep");
    });

    it("SABOTAGE: AP 1 → pass", () => {
      const perception = makePerception({
        actionPoints: { maximum: 6, remaining: 1 },
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "known",
            strategicStats: exactStats({ internalSecurity: 10 }),
            intelligenceNetworkLevel: "deep",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("pass");
      expect(decision.sabotageObjective).toBeNull();
    });

    it("SABOTAGE: AP 2 → conduct-covert-sabotage", () => {
      const perception = makePerception({
        actionPoints: { maximum: 6, remaining: 2 },
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "known",
            strategicStats: exactStats({ internalSecurity: 10 }),
            intelligenceNetworkLevel: "deep",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("conduct-covert-sabotage");
      expect(decision.sabotageObjective).toBe("internal-security");
    });
  });

  describe("no cheaper fallback", () => {
    it("suspected + AP 1 → pass, not gather-intelligence", () => {
      const perception = makePerception({
        actionPoints: { maximum: 6, remaining: 1 },
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "established",
            defensiveAwareness: "suspected",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("pass");
      expect(decision.sabotageObjective).toBeNull();
    });
  });

  describe("plan target is authoritative", () => {
    it("decision uses plan.targetNationId, not first perception entry", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "veridian",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.targetNationId).toBe("dravos");
    });

    it("no target rescoring occurs", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.targetNationId).toBe("dravos");
    });

    it("no target fallback to another nation", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "veridian",
            visibility: "known",
            strategicStats: exactStats(),
            intelligenceNetworkLevel: "deep",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      expect(() => createAiEspionageDecision(perception, plan)).toThrow(
        AiEspionageTargetNotPerceivedError,
      );
    });
  });

  describe("forbidden data independence", () => {
    it("diplomaticStatus does not change decision", () => {
      const base: AiForeignNationPerception = {
        nationId: "dravos",
        visibility: "unknown",
        strategicStats: { kind: "unknown" },
        diplomaticStatus: "friendly",
        observerInfluence: 50,
        observerRegimePressure: 0,
        intelligenceNetworkLevel: "none",
        defensiveAwareness: "unaware",
      };
      const perceptionA = makePerception({
        foreignNations: [{ ...base, diplomaticStatus: "friendly" }],
      });
      const perceptionB = makePerception({
        foreignNations: [{ ...base, diplomaticStatus: "hostile" }],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const resultA = createAiEspionageDecision(perceptionA, plan);
      const resultB = createAiEspionageDecision(perceptionB, plan);
      expect(resultA.action).toBe(resultB.action);
      expect(resultA.sabotageObjective).toBe(resultB.sabotageObjective);
    });

    it("observerInfluence does not change decision", () => {
      const base: AiForeignNationPerception = {
        nationId: "dravos",
        visibility: "unknown",
        strategicStats: { kind: "unknown" },
        diplomaticStatus: "neutral",
        observerInfluence: 0,
        observerRegimePressure: 0,
        intelligenceNetworkLevel: "none",
        defensiveAwareness: "unaware",
      };
      const perceptionA = makePerception({
        foreignNations: [{ ...base, observerInfluence: 0 }],
      });
      const perceptionB = makePerception({
        foreignNations: [{ ...base, observerInfluence: 100 }],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const resultA = createAiEspionageDecision(perceptionA, plan);
      const resultB = createAiEspionageDecision(perceptionB, plan);
      expect(resultA.action).toBe(resultB.action);
      expect(resultA.sabotageObjective).toBe(resultB.sabotageObjective);
    });

    it("observerRegimePressure does not change decision", () => {
      const base: AiForeignNationPerception = {
        nationId: "dravos",
        visibility: "unknown",
        strategicStats: { kind: "unknown" },
        diplomaticStatus: "neutral",
        observerInfluence: 50,
        observerRegimePressure: 0,
        intelligenceNetworkLevel: "none",
        defensiveAwareness: "unaware",
      };
      const perceptionA = makePerception({
        foreignNations: [{ ...base, observerRegimePressure: 0 }],
      });
      const perceptionB = makePerception({
        foreignNations: [{ ...base, observerRegimePressure: 100 }],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const resultA = createAiEspionageDecision(perceptionA, plan);
      const resultB = createAiEspionageDecision(perceptionB, plan);
      expect(resultA.action).toBe(resultB.action);
      expect(resultA.sabotageObjective).toBe(resultB.sabotageObjective);
    });

    it("involvedProxyConflicts does not change decision", () => {
      const perceptionA = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
        involvedProxyConflicts: [],
      });
      const perceptionB = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
        involvedProxyConflicts: [
          {
            id: "pc_1",
            hostNationId: "veridian",
            nationAId: "solaris",
            nationBId: "dravos",
            intensity: "high",
          },
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const resultA = createAiEspionageDecision(perceptionA, plan);
      const resultB = createAiEspionageDecision(perceptionB, plan);
      expect(resultA.action).toBe(resultB.action);
      expect(resultA.sabotageObjective).toBe(resultB.sabotageObjective);
    });

    it("selfStrategicStats does not change decision", () => {
      const perceptionA = makePerception({
        selfStrategicStats: {
          kind: "exact",
          stability: 0,
          publicSupport: 0,
          internalSecurity: 0,
        },
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const perceptionB = makePerception({
        selfStrategicStats: {
          kind: "exact",
          stability: 100,
          publicSupport: 100,
          internalSecurity: 100,
        },
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const resultA = createAiEspionageDecision(perceptionA, plan);
      const resultB = createAiEspionageDecision(perceptionB, plan);
      expect(resultA.action).toBe(resultB.action);
      expect(resultA.sabotageObjective).toBe(resultB.sabotageObjective);
    });
  });

  describe("strategic-stat boundary — stability does not affect earlier rules", () => {
    it("sweep rule: stability variation does not change decision", () => {
      const low = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            strategicStats: exactStats({ stability: 10 }),
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "suspected",
          }),
        ],
      });
      const high = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            strategicStats: exactStats({ stability: 90 }),
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "suspected",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      expect(createAiEspionageDecision(low, plan).action).toBe(
        createAiEspionageDecision(high, plan).action,
      );
    });

    it("build rule: stability variation does not change decision", () => {
      const low = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            strategicStats: exactStats({ stability: 5 }),
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const high = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            strategicStats: exactStats({ stability: 95 }),
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      expect(createAiEspionageDecision(low, plan).action).toBe(
        createAiEspionageDecision(high, plan).action,
      );
    });

    it("gather rule: stability variation does not change decision", () => {
      const low = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            strategicStats: exactStats({ stability: 10 }),
            intelligenceNetworkLevel: "established",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const high = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            strategicStats: exactStats({ stability: 90 }),
            intelligenceNetworkLevel: "established",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      expect(createAiEspionageDecision(low, plan).action).toBe(
        createAiEspionageDecision(high, plan).action,
      );
    });
  });

  describe("strategic-stat boundary — publicSupport does not change sabotage objective when internalSecurity > 0", () => {
    it("internalSecurity 50 + publicSupport 100 → internal-security", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "known",
            strategicStats: exactStats({ internalSecurity: 50, publicSupport: 100 }),
            intelligenceNetworkLevel: "deep",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).toBe("conduct-covert-sabotage");
      expect(decision.sabotageObjective).toBe("internal-security");
    });
  });

  describe("strategic-stat boundary — publicSupport independence on earlier policy (build)", () => {
    it("publicSupport 0 vs 100 does not change build-intelligence-network decision", () => {
      const base: AiForeignNationPerception = {
        nationId: "dravos",
        visibility: "unknown",
        strategicStats: { kind: "unknown" },
        diplomaticStatus: "neutral",
        observerInfluence: 50,
        observerRegimePressure: 0,
        intelligenceNetworkLevel: "none",
        defensiveAwareness: "unaware",
      };
      const perceptionLow = makePerception({
        foreignNations: [{ ...base, strategicStats: exactStats({ publicSupport: 0 }) }],
      });
      const perceptionHigh = makePerception({
        foreignNations: [{ ...base, strategicStats: exactStats({ publicSupport: 100 }) }],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const resultLow = createAiEspionageDecision(perceptionLow, plan);
      const resultHigh = createAiEspionageDecision(perceptionHigh, plan);
      expect(resultLow.action).toBe("build-intelligence-network");
      expect(resultHigh.action).toBe("build-intelligence-network");
      expect(resultLow).toEqual(resultHigh);
    });
  });

  describe("strategic-stat boundary — internalSecurity independence on earlier policy (gather)", () => {
    it("internalSecurity 0 vs 100 does not change gather-intelligence decision", () => {
      const base: AiForeignNationPerception = {
        nationId: "dravos",
        visibility: "unknown",
        strategicStats: { kind: "unknown" },
        diplomaticStatus: "neutral",
        observerInfluence: 50,
        observerRegimePressure: 0,
        intelligenceNetworkLevel: "established",
        defensiveAwareness: "unaware",
      };
      const perceptionLow = makePerception({
        foreignNations: [{ ...base, strategicStats: exactStats({ internalSecurity: 0 }) }],
      });
      const perceptionHigh = makePerception({
        foreignNations: [{ ...base, strategicStats: exactStats({ internalSecurity: 100 }) }],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const resultLow = createAiEspionageDecision(perceptionLow, plan);
      const resultHigh = createAiEspionageDecision(perceptionHigh, plan);
      expect(resultLow.action).toBe("gather-intelligence");
      expect(resultHigh.action).toBe("gather-intelligence");
      expect(resultLow).toEqual(resultHigh);
    });
  });

  describe("hidden-information result", () => {
    it("no agent/asset/double-agent access", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision).not.toHaveProperty("agentId");
      expect(decision).not.toHaveProperty("assetId");
      expect(decision).not.toHaveProperty("doubleAgentId");
    });

    it("no recruitAsset action", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "known",
            strategicStats: exactStats({ internalSecurity: 50 }),
            intelligenceNetworkLevel: "deep",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).not.toBe("recruit-asset");
    });

    it("no turnAsset action", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "known",
            strategicStats: exactStats({ internalSecurity: 50 }),
            intelligenceNetworkLevel: "deep",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).not.toBe("turn-asset");
    });

    it("no feedFalseIntelligence action", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "known",
            strategicStats: exactStats({ internalSecurity: 50 }),
            intelligenceNetworkLevel: "deep",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.action).not.toBe("feed-false-intelligence");
    });
  });

  describe("non-sabotage objective always null", () => {
    it("build-intelligence-network → sabotageObjective null", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.sabotageObjective).toBeNull();
    });

    it("gather-intelligence → sabotageObjective null", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "established",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.sabotageObjective).toBeNull();
    });

    it("counterintelligence-sweep → sabotageObjective null", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "suspected",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.sabotageObjective).toBeNull();
    });

    it("pass → sabotageObjective null", () => {
      const perception = makePerception({
        actionPoints: { maximum: 6, remaining: 0 },
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const decision = createAiEspionageDecision(perception, plan);
      expect(decision.sabotageObjective).toBeNull();
    });
  });

  describe("fresh-decision result", () => {
    it("independent calls with equal inputs produce equal results", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const resultA = createAiEspionageDecision(perception, plan);
      const resultB = createAiEspionageDecision(perception, plan);
      expect(resultA).not.toBe(resultB);
      expect(resultA).toEqual(resultB);
    });

    it("call-order independence", () => {
      const perception1 = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const perception2 = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "known",
            strategicStats: exactStats(),
            intelligenceNetworkLevel: "deep",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const r1a = createAiEspionageDecision(perception1, plan);
      const r2a = createAiEspionageDecision(perception2, plan);
      const r2b = createAiEspionageDecision(perception2, plan);
      const r1b = createAiEspionageDecision(perception1, plan);
      expect(r1a).toEqual(r1b);
      expect(r2a).toEqual(r2b);
    });
  });

  describe("input-immutability", () => {
    it("perception is not mutated", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const frozenPerception = JSON.parse(JSON.stringify(perception));
      createAiEspionageDecision(perception, plan);
      expect(perception).toEqual(frozenPerception);
    });

    it("plan is not mutated", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const frozenPlan = JSON.parse(JSON.stringify(plan));
      createAiEspionageDecision(perception, plan);
      expect(plan).toEqual(frozenPlan);
    });
  });

  describe("AP remains unchanged", () => {
    it("actionPoints.remaining is not modified", () => {
      const perception = makePerception({
        actionPoints: { maximum: 6, remaining: 6 },
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "unknown",
            intelligenceNetworkLevel: "none",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      createAiEspionageDecision(perception, plan);
      expect(perception.actionPoints.remaining).toBe(6);
    });
  });

  describe("AP-cost constants imported correctly", () => {
    it("BUILD_NETWORK_AP_COST is 2", () => {
      expect(BUILD_NETWORK_AP_COST).toBe(2);
    });

    it("GATHER_INTELLIGENCE_AP_COST is 1", () => {
      expect(GATHER_INTELLIGENCE_AP_COST).toBe(1);
    });

    it("COUNTERINTELLIGENCE_SWEEP_AP_COST is 2", () => {
      expect(COUNTERINTELLIGENCE_SWEEP_AP_COST).toBe(2);
    });

    it("COVERT_SABOTAGE_AP_COST is 2", () => {
      expect(COVERT_SABOTAGE_AP_COST).toBe(2);
    });
  });

  describe("determinism", () => {
    it("same inputs always produce same output", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "known",
            strategicStats: exactStats({ internalSecurity: 25 }),
            intelligenceNetworkLevel: "deep",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      for (let i = 0; i < 20; i++) {
        const result = createAiEspionageDecision(perception, plan);
        expect(result.action).toBe("conduct-covert-sabotage");
        expect(result.sabotageObjective).toBe("internal-security");
      }
    });
  });

  describe("no gameplay operation executed", () => {
    it("function only returns decision, no side effects", () => {
      const perception = makePerception({
        foreignNations: [
          makeForeignNation({
            nationId: "dravos",
            visibility: "known",
            strategicStats: exactStats({ internalSecurity: 10 }),
            intelligenceNetworkLevel: "deep",
            defensiveAwareness: "unaware",
          }),
        ],
      });
      const plan = makePlan({ targetNationId: "dravos" });
      const before = JSON.stringify(perception);
      const decision = createAiEspionageDecision(perception, plan);
      const after = JSON.stringify(perception);
      expect(before).toBe(after);
      expect(decision).toBeDefined();
    });
  });

  describe("canonical G3.3 Dravos intelligence plan target", () => {
    it("Dravos with intelligence domain targets solaris", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "dravos");
      const personality = getAiPersonality("dravos");
      const plan = createAiPlan(perception, personality);
      if (plan.domain === "intelligence") {
        const decision = createAiEspionageDecision(perception, plan);
        expect(decision.targetNationId).toBe(plan.targetNationId);
        expect(decision.observerNationId).toBe("dravos");
        expect(decision.turn).toBe(perception.turn);
      }
    });
  });
});
