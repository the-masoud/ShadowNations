import { describe, it, expect } from "vitest";
import {
  createIntelligenceDashboardModel,
} from "../../src/game/ui/intelligenceDashboardPresentation.js";
import { createInitialGameState } from "../../src/core/model/gameState.js";
import type { GameState } from "../../src/core/model/gameState.js";
import { addIntelligenceAsset } from "../../src/core/simulation/addIntelligenceAsset.js";
import { addDoubleAgentControl } from "../../src/core/simulation/addDoubleAgentControl.js";
import { setNationVisibility } from "../../src/core/simulation/setNationVisibility.js";
import { setIntelligenceNetworkLevel } from "../../src/core/simulation/setIntelligenceNetworkLevel.js";
import { setCounterintelligenceAwareness } from "../../src/core/simulation/setCounterintelligenceAwareness.js";
import { GameStateValidationError } from "../../src/core/simulation/validateGameState.js";

describe("G4.3 — Intelligence Dashboard Presentation", () => {
  const state = createInitialGameState();

  describe("A. top-level keys", () => {
    it("model has exactly 7 keys in correct order", () => {
      const model = createIntelligenceDashboardModel(state);
      expect(Object.keys(model)).toEqual([
        "observerNationId",
        "observerNationName",
        "observerNationCode",
        "agentCount",
        "ownedAssetCount",
        "controlledDoubleAgentCount",
        "targets",
      ]);
    });
  });

  describe("B. target keys", () => {
    it("each target has exactly 8 keys in correct order", () => {
      const model = createIntelligenceDashboardModel(state);
      for (const target of model.targets) {
        expect(Object.keys(target)).toEqual([
          "targetNationId",
          "targetNationName",
          "targetNationCode",
          "targetColor",
          "visibility",
          "networkLevel",
          "defensiveAwareness",
          "ownedAssetCount",
        ]);
      }
    });
  });

  describe("C. exact initial model", () => {
    it("matches the canonical initial dashboard", () => {
      const model = createIntelligenceDashboardModel(state);
      expect(model).toEqual({
        observerNationId: "solaris",
        observerNationName: "Solaris",
        observerNationCode: "SOL",
        agentCount: 2,
        ownedAssetCount: 0,
        controlledDoubleAgentCount: 0,
        targets: [
          {
            targetNationId: "dravos",
            targetNationName: "Dravos",
            targetNationCode: "DRA",
            targetColor: 0xbf5a5a,
            visibility: "unknown",
            networkLevel: "none",
            defensiveAwareness: "unaware",
            ownedAssetCount: 0,
          },
          {
            targetNationId: "norvia",
            targetNationName: "Norvia",
            targetNationCode: "NOR",
            targetColor: 0x5d8fc7,
            visibility: "unknown",
            networkLevel: "none",
            defensiveAwareness: "unaware",
            ownedAssetCount: 0,
          },
          {
            targetNationId: "veloria",
            targetNationName: "Veloria",
            targetNationCode: "VEL",
            targetColor: 0x8b6fc0,
            visibility: "unknown",
            networkLevel: "none",
            defensiveAwareness: "unaware",
            ownedAssetCount: 0,
          },
          {
            targetNationId: "karsen",
            targetNationName: "Karsen",
            targetNationCode: "KAR",
            targetColor: 0xc47a45,
            visibility: "unknown",
            networkLevel: "none",
            defensiveAwareness: "unaware",
            ownedAssetCount: 0,
          },
          {
            targetNationId: "arkania",
            targetNationName: "Arkania",
            targetNationCode: "ARK",
            targetColor: 0x4f9d82,
            visibility: "unknown",
            networkLevel: "none",
            defensiveAwareness: "unaware",
            ownedAssetCount: 0,
          },
        ],
      });
    });
  });

  describe("D. target order", () => {
    it("exact target IDs in world nation order with observer removed", () => {
      const model = createIntelligenceDashboardModel(state);
      expect(model.targets.map((t) => t.targetNationId)).toEqual([
        "dravos",
        "norvia",
        "veloria",
        "karsen",
        "arkania",
      ]);
    });
  });

  describe("E. player-owned asset count", () => {
    it("ownedAssetCount reflects player-owned assets", () => {
      let s = createInitialGameState();
      s = addIntelligenceAsset(s, {
        id: "g43-solaris-dravos",
        ownerNationId: "solaris",
        targetNationId: "dravos",
        access: "limited",
      });
      const model = createIntelligenceDashboardModel(s);
      expect(model.ownedAssetCount).toBe(1);
      expect(model.targets.find((t) => t.targetNationId === "dravos")!.ownedAssetCount).toBe(1);
      expect(model.targets.find((t) => t.targetNationId === "norvia")!.ownedAssetCount).toBe(0);
      expect(model.targets.find((t) => t.targetNationId === "veloria")!.ownedAssetCount).toBe(0);
      expect(model.targets.find((t) => t.targetNationId === "karsen")!.ownedAssetCount).toBe(0);
      expect(model.targets.find((t) => t.targetNationId === "arkania")!.ownedAssetCount).toBe(0);
    });
  });

  describe("F. foreign asset exclusion", () => {
    it("foreign-owned assets do not affect player dashboard", () => {
      let s = createInitialGameState();
      s = addIntelligenceAsset(s, {
        id: "g43-dravos-norvia",
        ownerNationId: "dravos",
        targetNationId: "norvia",
        access: "limited",
      });
      const model = createIntelligenceDashboardModel(s);
      expect(model.ownedAssetCount).toBe(0);
      expect(model.targets.find((t) => t.targetNationId === "norvia")!.ownedAssetCount).toBe(0);
    });
  });

  describe("G. controlled double agent semantics", () => {
    it("controlled double agent is separate from asset ownership", () => {
      let s = createInitialGameState();
      s = addIntelligenceAsset(s, {
        id: "g43-dravos-solaris",
        ownerNationId: "dravos",
        targetNationId: "solaris",
        access: "limited",
      });
      s = addDoubleAgentControl(s, {
        assetId: "g43-dravos-solaris",
        controllerNationId: "solaris",
      });
      const model = createIntelligenceDashboardModel(s);
      expect(model.controlledDoubleAgentCount).toBe(1);
      expect(model.ownedAssetCount).toBe(0);
      for (const target of model.targets) {
        expect(target.ownedAssetCount).toBe(0);
      }
    });
  });

  describe("H. visibility update", () => {
    it("setNationVisibility changes target visibility", () => {
      let s = createInitialGameState();
      s = setNationVisibility(s, "solaris", "dravos", "limited");
      let model = createIntelligenceDashboardModel(s);
      expect(model.targets.find((t) => t.targetNationId === "dravos")!.visibility).toBe("limited");
      for (const t of model.targets) {
        if (t.targetNationId !== "dravos") {
          expect(t.visibility).toBe("unknown");
        }
      }

      s = setNationVisibility(s, "solaris", "dravos", "known");
      model = createIntelligenceDashboardModel(s);
      expect(model.targets.find((t) => t.targetNationId === "dravos")!.visibility).toBe("known");
      for (const t of model.targets) {
        if (t.targetNationId !== "dravos") {
          expect(t.visibility).toBe("unknown");
        }
      }
    });
  });

  describe("I. network update", () => {
    it("setIntelligenceNetworkLevel changes target networkLevel", () => {
      let s = createInitialGameState();
      s = setIntelligenceNetworkLevel(s, "solaris", "dravos", "established");
      let model = createIntelligenceDashboardModel(s);
      expect(model.targets.find((t) => t.targetNationId === "dravos")!.networkLevel).toBe("established");
      for (const t of model.targets) {
        if (t.targetNationId !== "dravos") {
          expect(t.networkLevel).toBe("none");
        }
      }

      s = setIntelligenceNetworkLevel(s, "solaris", "dravos", "deep");
      model = createIntelligenceDashboardModel(s);
      expect(model.targets.find((t) => t.targetNationId === "dravos")!.networkLevel).toBe("deep");
      for (const t of model.targets) {
        if (t.targetNationId !== "dravos") {
          expect(t.networkLevel).toBe("none");
        }
      }
    });
  });

  describe("J. counterintelligence direction", () => {
    it("reverse direction does not affect dashboard; forward direction does", () => {
      let s = createInitialGameState();
      s = setCounterintelligenceAwareness(s, "dravos", "solaris", "identified");
      let model = createIntelligenceDashboardModel(s);
      expect(model.targets.find((t) => t.targetNationId === "dravos")!.defensiveAwareness).toBe("unaware");

      s = setCounterintelligenceAwareness(s, "solaris", "dravos", "suspected");
      model = createIntelligenceDashboardModel(s);
      expect(model.targets.find((t) => t.targetNationId === "dravos")!.defensiveAwareness).toBe("suspected");
    });
  });

  describe("K. alternate player", () => {
    it("dashboard reflects alternate playerNationId", () => {
      const initial = createInitialGameState();
      const altState: GameState = { ...initial, playerNationId: "dravos" };
      const model = createIntelligenceDashboardModel(altState);
      expect(model.observerNationId).toBe("dravos");
      expect(model.observerNationName).toBe("Dravos");
      expect(model.observerNationCode).toBe("DRA");
      expect(model.agentCount).toBe(2);
      expect(model.targets.map((t) => t.targetNationId)).toEqual([
        "solaris",
        "norvia",
        "veloria",
        "karsen",
        "arkania",
      ]);
    });
  });

  describe("L. freshness", () => {
    it("two calls with identical input are deep equal but different references", () => {
      const a = createIntelligenceDashboardModel(state);
      const b = createIntelligenceDashboardModel(state);
      expect(a).toEqual(b);
      expect(a).not.toBe(b);
      expect(a.targets).not.toBe(b.targets);
      for (let i = 0; i < a.targets.length; i++) {
        expect(a.targets[i]).not.toBe(b.targets[i]);
      }
    });
  });

  describe("M. state immutability", () => {
    it("calling createIntelligenceDashboardModel does not mutate input state", () => {
      const before = JSON.stringify(state);
      createIntelligenceDashboardModel(state);
      const after = JSON.stringify(state);
      expect(before).toBe(after);
    });
  });

  describe("N. validation precedence", () => {
    it("GameStateValidationError thrown for invalid state", () => {
      const invalidState = { ...state, turn: 0 };
      expect(() =>
        createIntelligenceDashboardModel(invalidState as GameState),
      ).toThrow(GameStateValidationError);
    });
  });

  describe("O. forbidden data leakage", () => {
    it("model keys contain none of the forbidden fields", () => {
      const model = createIntelligenceDashboardModel(state);
      const forbidden = [
        "stability",
        "publicSupport",
        "internalSecurity",
        "diplomaticStatus",
        "influence",
        "regimePressure",
        "proxyConflicts",
        "actionPoints",
        "agents",
        "assets",
        "doubleAgents",
        "aiPlan",
        "aiDecision",
        "operations",
      ];
      for (const key of forbidden) {
        expect(model).not.toHaveProperty(key);
      }
      for (const target of model.targets) {
        for (const key of forbidden) {
          expect(target).not.toHaveProperty(key);
        }
      }
    });
  });
});
