import { describe, it, expect } from "vitest";
import { createInitialGameState } from "../../src/core/model/gameState.js";
import type { GameState } from "../../src/core/model/gameState.js";
import {
  createConspiracyBoardModel,
} from "../../src/game/ui/conspiracyBoardPresentation.js";
import { addIntelligenceAsset } from "../../src/core/simulation/addIntelligenceAsset.js";
import { addDoubleAgentControl } from "../../src/core/simulation/addDoubleAgentControl.js";
import { setNationVisibility } from "../../src/core/simulation/setNationVisibility.js";
import { setIntelligenceNetworkLevel } from "../../src/core/simulation/setIntelligenceNetworkLevel.js";
import { GameStateValidationError } from "../../src/core/simulation/validateGameState.js";

describe("conspiracyBoardPresentation", () => {
  // A — Top-level keys
  it("A: top-level keys are exact", () => {
    const state = createInitialGameState();
    const model = createConspiracyBoardModel(state);
    expect(Object.keys(model)).toEqual([
      "observerNationId",
      "observerNationName",
      "observerNationCode",
      "agents",
      "targets",
    ]);
  });

  // B — Agent keys
  it("B: agent keys are exact", () => {
    const state = createInitialGameState();
    const model = createConspiracyBoardModel(state);
    for (const agent of model.agents) {
      expect(Object.keys(agent)).toEqual(["agentId", "codename"]);
    }
  });

  // C — Target keys
  it("C: target keys are exact", () => {
    const state = createInitialGameState();
    const model = createConspiracyBoardModel(state);
    for (const target of model.targets) {
      expect(Object.keys(target)).toEqual([
        "targetNationId",
        "targetNationName",
        "targetNationCode",
        "targetColor",
        "visibility",
        "networkLevel",
        "ownedAssetCount",
        "controlledDoubleAgentCount",
      ]);
    }
  });

  // D — Exact initial model
  it("D: exact initial canonical model", () => {
    const state = createInitialGameState();
    const model = createConspiracyBoardModel(state);
    expect(model).toEqual({
      observerNationId: "solaris",
      observerNationName: "Solaris",
      observerNationCode: "SOL",
      agents: [
        { agentId: "solaris-echo", codename: "Echo" },
        { agentId: "solaris-orbit", codename: "Orbit" },
      ],
      targets: [
        {
          targetNationId: "dravos",
          targetNationName: "Dravos",
          targetNationCode: "DRA",
          targetColor: 0xbf5a5a,
          visibility: "unknown",
          networkLevel: "none",
          ownedAssetCount: 0,
          controlledDoubleAgentCount: 0,
        },
        {
          targetNationId: "norvia",
          targetNationName: "Norvia",
          targetNationCode: "NOR",
          targetColor: 0x5d8fc7,
          visibility: "unknown",
          networkLevel: "none",
          ownedAssetCount: 0,
          controlledDoubleAgentCount: 0,
        },
        {
          targetNationId: "veloria",
          targetNationName: "Veloria",
          targetNationCode: "VEL",
          targetColor: 0x8b6fc0,
          visibility: "unknown",
          networkLevel: "none",
          ownedAssetCount: 0,
          controlledDoubleAgentCount: 0,
        },
        {
          targetNationId: "karsen",
          targetNationName: "Karsen",
          targetNationCode: "KAR",
          targetColor: 0xc47a45,
          visibility: "unknown",
          networkLevel: "none",
          ownedAssetCount: 0,
          controlledDoubleAgentCount: 0,
        },
        {
          targetNationId: "arkania",
          targetNationName: "Arkania",
          targetNationCode: "ARK",
          targetColor: 0x4f9d82,
          visibility: "unknown",
          networkLevel: "none",
          ownedAssetCount: 0,
          controlledDoubleAgentCount: 0,
        },
      ],
    });
  });

  // E — Target order
  it("E: initial Solaris target IDs are exact", () => {
    const state = createInitialGameState();
    const model = createConspiracyBoardModel(state);
    expect(model.targets.map((t) => t.targetNationId)).toEqual([
      "dravos",
      "norvia",
      "veloria",
      "karsen",
      "arkania",
    ]);
  });

  // F — Player agent order
  it("F: initial Solaris agent models are exact", () => {
    const state = createInitialGameState();
    const model = createConspiracyBoardModel(state);
    expect(model.agents).toEqual([
      { agentId: "solaris-echo", codename: "Echo" },
      { agentId: "solaris-orbit", codename: "Orbit" },
    ]);
  });

  // G — Alternate player
  it("G: alternate player (dravos) behavior", () => {
    const initial = createInitialGameState();
    const state: GameState = {
      ...initial,
      playerNationId: "dravos",
    };
    const model = createConspiracyBoardModel(state);
    expect(model.observerNationId).toBe("dravos");
    expect(model.observerNationName).toBe("Dravos");
    expect(model.observerNationCode).toBe("DRA");
    expect(model.agents).toEqual([
      { agentId: "dravos-raven", codename: "Raven" },
      { agentId: "dravos-iron", codename: "Iron" },
    ]);
    expect(model.targets.map((t) => t.targetNationId)).toEqual([
      "solaris",
      "norvia",
      "veloria",
      "karsen",
      "arkania",
    ]);
  });

  // H — Player-owned asset
  it("H: player-owned asset counts", () => {
    let state = createInitialGameState();
    state = addIntelligenceAsset(state, {
      id: "g44-solaris-dravos",
      ownerNationId: "solaris",
      targetNationId: "dravos",
      access: "limited",
    });
    const model = createConspiracyBoardModel(state);
    const dravos = model.targets.find((t) => t.targetNationId === "dravos")!;
    expect(dravos.ownedAssetCount).toBe(1);
    for (const t of model.targets) {
      if (t.targetNationId !== "dravos") {
        expect(t.ownedAssetCount).toBe(0);
      }
    }
  });

  // I — Foreign asset exclusion
  it("I: foreign assets are excluded", () => {
    let state = createInitialGameState();
    state = addIntelligenceAsset(state, {
      id: "g44-dravos-norvia",
      ownerNationId: "dravos",
      targetNationId: "norvia",
      access: "limited",
    });
    const model = createConspiracyBoardModel(state);
    for (const t of model.targets) {
      expect(t.ownedAssetCount).toBe(0);
    }
  });

  // J — Controlled double agent source
  it("J: controlled double agent grouped by asset.ownerNationId", () => {
    let state = createInitialGameState();
    state = addIntelligenceAsset(state, {
      id: "g44-dravos-solaris",
      ownerNationId: "dravos",
      targetNationId: "solaris",
      access: "limited",
    });
    state = addDoubleAgentControl(state, {
      assetId: "g44-dravos-solaris",
      controllerNationId: "solaris",
    });
    const model = createConspiracyBoardModel(state);
    const dravos = model.targets.find((t) => t.targetNationId === "dravos")!;
    expect(dravos.controlledDoubleAgentCount).toBe(1);
    expect(dravos.ownedAssetCount).toBe(0);
    for (const t of model.targets) {
      if (t.targetNationId !== "dravos") {
        expect(t.controlledDoubleAgentCount).toBe(0);
      }
    }
  });

  // K — Visibility update
  it("K: visibility updates correctly", () => {
    let state = createInitialGameState();
    state = setNationVisibility(state, "solaris", "dravos", "limited");
    let model = createConspiracyBoardModel(state);
    expect(
      model.targets.find((t) => t.targetNationId === "dravos")!.visibility,
    ).toBe("limited");
    for (const t of model.targets) {
      if (t.targetNationId !== "dravos") {
        expect(t.visibility).toBe("unknown");
      }
    }

    state = setNationVisibility(state, "solaris", "dravos", "known");
    model = createConspiracyBoardModel(state);
    expect(
      model.targets.find((t) => t.targetNationId === "dravos")!.visibility,
    ).toBe("known");
    for (const t of model.targets) {
      if (t.targetNationId !== "dravos") {
        expect(t.visibility).toBe("unknown");
      }
    }
  });

  // L — Network update
  it("L: network level updates sequentially", () => {
    let state = createInitialGameState();
    const levels = ["foothold", "established", "deep"] as const;
    for (const level of levels) {
      state = setIntelligenceNetworkLevel(state, "solaris", "dravos", level);
      const model = createConspiracyBoardModel(state);
      expect(
        model.targets.find((t) => t.targetNationId === "dravos")!
          .networkLevel,
      ).toBe(level);
      for (const t of model.targets) {
        if (t.targetNationId !== "dravos") {
          expect(t.networkLevel).toBe("none");
        }
      }
    }
  });

  // M — Freshness
  it("M: fresh objects on every call", () => {
    const state = createInitialGameState();
    const a = createConspiracyBoardModel(state);
    const b = createConspiracyBoardModel(state);
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(a.agents).not.toBe(b.agents);
    expect(a.targets).not.toBe(b.targets);
    for (let i = 0; i < a.agents.length; i++) {
      expect(a.agents[i]).not.toBe(b.agents[i]);
    }
    for (let i = 0; i < a.targets.length; i++) {
      expect(a.targets[i]).not.toBe(b.targets[i]);
    }
  });

  // N — State immutability
  it("N: does not mutate state", () => {
    const state = createInitialGameState();
    const before = JSON.stringify(state);
    createConspiracyBoardModel(state);
    expect(JSON.stringify(state)).toBe(before);
  });

  // O — Validation precedence
  it("O: throws GameStateValidationError for invalid state", () => {
    const invalidState = {
      ...createInitialGameState(),
      turn: 0,
    };
    expect(() => createConspiracyBoardModel(invalidState)).toThrow(
      GameStateValidationError,
    );
  });

  // P — No forbidden data leakage
  it("P: no forbidden data leakage in runtime objects", () => {
    const state = createInitialGameState();
    const model = createConspiracyBoardModel(state);
    const forbidden = [
      "stability",
      "publicSupport",
      "internalSecurity",
      "defensiveAwareness",
      "diplomaticStatus",
      "influence",
      "regimePressure",
      "proxyConflicts",
      "actionPoints",
      "foreignAgents",
      "assets",
      "doubleAgents",
      "aiPlan",
      "aiDecision",
      "operations",
    ];
    const topKeys = Object.keys(model);
    for (const key of forbidden) {
      expect(topKeys).not.toContain(key);
    }
    for (const agent of model.agents) {
      for (const key of forbidden) {
        expect(Object.keys(agent)).not.toContain(key);
      }
    }
    for (const target of model.targets) {
      for (const key of forbidden) {
        expect(Object.keys(target)).not.toContain(key);
      }
    }
  });
});
