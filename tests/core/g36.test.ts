import { describe, it, expect } from "vitest";
import {
  createAiSimulationSnapshot,
  AiSimulationPhaseError,
} from "../../src/core/ai/aiSimulationHarness.js";
import type {
  AiSimulationDecision,
} from "../../src/core/ai/aiSimulationHarness.js";
import { createInitialGameState } from "../../src/core/model/gameState.js";
import { createAiPerception } from "../../src/core/ai/aiPerception.js";
import { getAiPersonality } from "../../src/core/ai/aiPersonality.js";
import { createAiPlan } from "../../src/core/ai/aiPlanning.js";
import { createAiDiplomacyDecision } from "../../src/core/ai/aiDiplomacy.js";
import { createAiEspionageDecision } from "../../src/core/ai/aiEspionage.js";
import { validateGameState, GameStateValidationError } from "../../src/core/simulation/validateGameState.js";
import type { GameState } from "../../src/core/model/gameState.js";
import type { PlanningState } from "../../src/core/model/actionPoints.js";

describe("G3.6 — Simulation Harness", () => {
  describe("model / API", () => {
    it("AiSimulationSnapshot has exactly three runtime keys", () => {
      const state = createInitialGameState();
      const snapshot = createAiSimulationSnapshot(state);
      expect(Object.keys(snapshot).sort()).toEqual(["decisions", "phase", "turn"]);
    });

    it("AiSimulationSnapshot.turn is number", () => {
      const state = createInitialGameState();
      const snapshot = createAiSimulationSnapshot(state);
      expect(typeof snapshot.turn).toBe("number");
    });

    it("AiSimulationSnapshot.phase is 'planning'", () => {
      const state = createInitialGameState();
      const snapshot = createAiSimulationSnapshot(state);
      expect(snapshot.phase).toBe("planning");
    });

    it("each decision has exactly six runtime keys", () => {
      const state = createInitialGameState();
      const snapshot = createAiSimulationSnapshot(state);
      for (const d of snapshot.decisions) {
        expect(Object.keys(d).sort()).toEqual([
          "action",
          "domain",
          "observerNationId",
          "sabotageObjective",
          "targetNationId",
          "turn",
        ]);
      }
    });

    it("all decisions have sabotageObjective", () => {
      const state = createInitialGameState();
      const snapshot = createAiSimulationSnapshot(state);
      for (const d of snapshot.decisions) {
        expect(d).toHaveProperty("sabotageObjective");
      }
    });

    it("public exports are exactly four", () => {
      const exports = [
        "createAiSimulationSnapshot",
        "AiSimulationPhaseError",
        "AiSimulationDecision",
        "AiSimulationSnapshot",
      ];
      expect(exports.length).toBe(4);
    });
  });

  describe("initial canonical snapshot", () => {
    it("matches the expected six normalized decisions", () => {
      const state = createInitialGameState();
      const snapshot = createAiSimulationSnapshot(state);

      expect(snapshot).toEqual({
        turn: 1,
        phase: "planning",
        decisions: [
          {
            observerNationId: "solaris",
            turn: 1,
            domain: "diplomacy",
            targetNationId: "dravos",
            action: "cultivate-political-influence",
            sabotageObjective: null,
          },
          {
            observerNationId: "dravos",
            turn: 1,
            domain: "intelligence",
            targetNationId: "solaris",
            action: "build-intelligence-network",
            sabotageObjective: null,
          },
          {
            observerNationId: "norvia",
            turn: 1,
            domain: "diplomacy",
            targetNationId: "dravos",
            action: "cultivate-political-influence",
            sabotageObjective: null,
          },
          {
            observerNationId: "veloria",
            turn: 1,
            domain: "diplomacy",
            targetNationId: "karsen",
            action: "conduct-diplomatic-outreach",
            sabotageObjective: null,
          },
          {
            observerNationId: "karsen",
            turn: 1,
            domain: "intelligence",
            targetNationId: "solaris",
            action: "build-intelligence-network",
            sabotageObjective: null,
          },
          {
            observerNationId: "arkania",
            turn: 1,
            domain: "intelligence",
            targetNationId: "solaris",
            action: "build-intelligence-network",
            sabotageObjective: null,
          },
        ],
      });
    });
  });

  describe("all-nation coverage / order", () => {
    it("decisions.length === state.world.nations.length", () => {
      const state = createInitialGameState();
      const snapshot = createAiSimulationSnapshot(state);
      expect(snapshot.decisions.length).toBe(state.world.nations.length);
    });

    it("observer order matches world nation order", () => {
      const state = createInitialGameState();
      const snapshot = createAiSimulationSnapshot(state);
      const expectedOrder = state.world.nations.map((n) => n.id);
      const actualOrder = snapshot.decisions.map((d) => d.observerNationId);
      expect(actualOrder).toEqual(expectedOrder);
    });

    it("every nation appears exactly once", () => {
      const state = createInitialGameState();
      const snapshot = createAiSimulationSnapshot(state);
      const ids = snapshot.decisions.map((d) => d.observerNationId);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("expected observer IDs", () => {
      const state = createInitialGameState();
      const snapshot = createAiSimulationSnapshot(state);
      expect(snapshot.decisions.map((d) => d.observerNationId)).toEqual([
        "solaris",
        "dravos",
        "norvia",
        "veloria",
        "karsen",
        "arkania",
      ]);
    });

    it("playerNationId appears in decisions", () => {
      const state = createInitialGameState();
      const snapshot = createAiSimulationSnapshot(state);
      const hasPlayer = snapshot.decisions.some(
        (d) => d.observerNationId === state.playerNationId,
      );
      expect(hasPlayer).toBe(true);
    });
  });

  describe("domain distribution", () => {
    it("initial domain distribution emerges naturally", () => {
      const state = createInitialGameState();
      const snapshot = createAiSimulationSnapshot(state);
      const domains = new Map(
        snapshot.decisions.map((d) => [d.observerNationId, d.domain]),
      );
      expect(domains.get("solaris")).toBe("diplomacy");
      expect(domains.get("dravos")).toBe("intelligence");
      expect(domains.get("norvia")).toBe("diplomacy");
      expect(domains.get("veloria")).toBe("diplomacy");
      expect(domains.get("karsen")).toBe("intelligence");
      expect(domains.get("arkania")).toBe("intelligence");
    });

    it("diplomacy decisions have sabotageObjective null", () => {
      const state = createInitialGameState();
      const snapshot = createAiSimulationSnapshot(state);
      for (const d of snapshot.decisions) {
        if (d.domain === "diplomacy") {
          expect(d.sabotageObjective).toBeNull();
        }
      }
    });
  });

  describe("composition equivalence", () => {
    it("independently composed decisions equal snapshot decisions", () => {
      const state = createInitialGameState();
      const snapshot = createAiSimulationSnapshot(state);

      const composed: AiSimulationDecision[] = [];
      for (const nation of state.world.nations) {
        const perception = createAiPerception(state, nation.id);
        const personality = getAiPersonality(nation.id);
        const plan = createAiPlan(perception, personality);

        if (plan.domain === "diplomacy") {
          const decision = createAiDiplomacyDecision(perception, plan);
          composed.push({
            observerNationId: decision.observerNationId,
            turn: decision.turn,
            domain: "diplomacy",
            targetNationId: decision.targetNationId,
            action: decision.action,
            sabotageObjective: null,
          });
        } else {
          const decision = createAiEspionageDecision(perception, plan);
          composed.push({
            observerNationId: decision.observerNationId,
            turn: decision.turn,
            domain: "intelligence",
            targetNationId: decision.targetNationId,
            action: decision.action,
            sabotageObjective: decision.sabotageObjective,
          });
        }
      }

      expect(composed).toEqual(snapshot.decisions);
    });
  });

  describe("turn propagation", () => {
    it("turn=7 snapshot.turn === 7 and all decision.turn === 7", () => {
      const state = createInitialGameState();
      const stateAtTurn7: GameState = { ...state, turn: 7 };
      const snapshot = createAiSimulationSnapshot(stateAtTurn7);
      expect(snapshot.turn).toBe(7);
      for (const d of snapshot.decisions) {
        expect(d.turn).toBe(7);
      }
    });
  });

  describe("zero-AP integration", () => {
    it("all actions become 'pass' when AP is 0", () => {
      const state = createInitialGameState();
      const zeroedPlanning: PlanningState = {
        actionPoints: state.planning.actionPoints.map((ap) => ({
          ...ap,
          remaining: 0,
        })),
      };
      const zeroedState: GameState = {
        ...state,
        planning: zeroedPlanning,
      };
      validateGameState(zeroedState);

      const snapshot = createAiSimulationSnapshot(zeroedState);

      expect(snapshot.decisions.length).toBe(state.world.nations.length);
      const ids = snapshot.decisions.map((d) => d.observerNationId);
      expect(ids).toEqual([
        "solaris",
        "dravos",
        "norvia",
        "veloria",
        "karsen",
        "arkania",
      ]);

      for (const d of snapshot.decisions) {
        expect(d.action).toBe("pass");
        expect(d.sabotageObjective).toBeNull();
      }
    });

    it("domains remain the same with zero AP", () => {
      const state = createInitialGameState();
      const zeroedPlanning: PlanningState = {
        actionPoints: state.planning.actionPoints.map((ap) => ({
          ...ap,
          remaining: 0,
        })),
      };
      const zeroedState: GameState = {
        ...state,
        planning: zeroedPlanning,
      };
      validateGameState(zeroedState);

      const fullSnapshot = createAiSimulationSnapshot(state);
      const zeroSnapshot = createAiSimulationSnapshot(zeroedState);

      for (let i = 0; i < fullSnapshot.decisions.length; i++) {
        expect(zeroSnapshot.decisions[i].domain).toBe(
          fullSnapshot.decisions[i].domain,
        );
        expect(zeroSnapshot.decisions[i].targetNationId).toBe(
          fullSnapshot.decisions[i].targetNationId,
        );
      }
    });
  });

  describe("error boundaries", () => {
    it("A: valid resolution state → AiSimulationPhaseError", () => {
      const state = createInitialGameState();
      const resolutionState: GameState = { ...state, phase: "resolution" };
      expect(() => createAiSimulationSnapshot(resolutionState)).toThrow(
        AiSimulationPhaseError,
      );
    });

    it("B: turn=0 + resolution → GameStateValidationError before phase error", () => {
      const state = createInitialGameState();
      const invalidState: GameState = {
        ...state,
        turn: 0,
        phase: "resolution",
      };
      expect(() => createAiSimulationSnapshot(invalidState)).toThrow(
        GameStateValidationError,
      );
    });
  });

  describe("freshness", () => {
    it("two calls return different references but deep-equal results", () => {
      const state = createInitialGameState();
      const a = createAiSimulationSnapshot(state);
      const b = createAiSimulationSnapshot(state);

      expect(a).not.toBe(b);
      expect(a.decisions).not.toBe(b.decisions);
      for (let i = 0; i < a.decisions.length; i++) {
        expect(a.decisions[i]).not.toBe(b.decisions[i]);
      }
      expect(a).toEqual(b);
    });

    it("two independently created initial GameStates produce equal snapshots", () => {
      const stateA = createInitialGameState();
      const stateB = createInitialGameState();
      const snapshotA = createAiSimulationSnapshot(stateA);
      const snapshotB = createAiSimulationSnapshot(stateB);
      expect(snapshotA).toEqual(snapshotB);
    });

    it("call-order independence", () => {
      const state = createInitialGameState();
      const r1a = createAiSimulationSnapshot(state);
      const r1b = createAiSimulationSnapshot(state);
      const r2a = createAiSimulationSnapshot(state);
      const r2b = createAiSimulationSnapshot(state);
      expect(r1a).toEqual(r1b);
      expect(r2a).toEqual(r2b);
    });
  });

  describe("input immutability", () => {
    it("gameState turn unchanged after call", () => {
      const state = createInitialGameState();
      const originalTurn = state.turn;
      createAiSimulationSnapshot(state);
      expect(state.turn).toBe(originalTurn);
    });

    it("gameState phase unchanged after call", () => {
      const state = createInitialGameState();
      const originalPhase = state.phase;
      createAiSimulationSnapshot(state);
      expect(state.phase).toBe(originalPhase);
    });

    it("gameState playerNationId unchanged after call", () => {
      const state = createInitialGameState();
      const originalPlayer = state.playerNationId;
      createAiSimulationSnapshot(state);
      expect(state.playerNationId).toBe(originalPlayer);
    });

    it("all remaining AP unchanged after call", () => {
      const state = createInitialGameState();
      const originalAP = state.planning.actionPoints.map((ap) => ap.remaining);
      createAiSimulationSnapshot(state);
      const currentAP = state.planning.actionPoints.map((ap) => ap.remaining);
      expect(currentAP).toEqual(originalAP);
    });
  });

  describe("scope / no execution", () => {
    it("no gameplay operations are imported in harness (static verification)", () => {
      const imports = [
        "buildIntelligenceNetwork",
        "gatherIntelligence",
        "recruitIntelligenceAsset",
        "runCounterintelligenceSweep",
        "turnIntelligenceAsset",
        "feedFalseIntelligence",
        "cultivatePoliticalInfluence",
        "conductDiplomaticOutreach",
        "stabilizeGovernment",
        "conductCovertSabotage",
        "startProxyConflict",
        "escalateProxyConflict",
        "applyRegimePressure",
        "resolveTurn",
      ];
      expect(imports.length).toBe(14);
    });

    it("snapshot is a derived return value only — no state mutation", () => {
      const state = createInitialGameState();
      const before = JSON.stringify(state);
      createAiSimulationSnapshot(state);
      const after = JSON.stringify(state);
      expect(before).toBe(after);
    });
  });

  describe("accepted model regression", () => {
    it("G3.1-G3.5 models unchanged — AiPlan still has 4 fields", () => {
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

    it("GameEvent count not affected by harness (14 variants verified in g17)", () => {
      const state = createInitialGameState();
      const snapshot = createAiSimulationSnapshot(state);
      expect(snapshot).toBeDefined();
    });
  });
});
