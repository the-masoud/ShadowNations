import { describe, it, expect } from "vitest";
import { createInitialGameState } from "../../src/core/model/gameState.js";
import { createAiPerception } from "../../src/core/ai/aiPerception.js";
import type { GameState } from "../../src/core/model/gameState.js";
import { setNationStrategicStat } from "../../src/core/simulation/setNationStrategicStat.js";
import { setNationRegimePressure } from "../../src/core/simulation/setNationRegimePressure.js";
import { setNationVisibility } from "../../src/core/simulation/setNationVisibility.js";
import { setIntelligenceNetworkLevel } from "../../src/core/simulation/setIntelligenceNetworkLevel.js";
import { setCounterintelligenceAwareness } from "../../src/core/simulation/setCounterintelligenceAwareness.js";
import { addProxyConflict } from "../../src/core/simulation/addProxyConflict.js";
import { resolveTurn } from "../../src/core/simulation/resolveTurn.js";
import type { ProxyConflict } from "../../src/core/model/proxyConflict.js";

const EXPECTED_EVENT_VARIANT_COUNT = 14;

describe("G3.1 — AI Perception", () => {
  describe("initial canonical perception", () => {
    const state = createInitialGameState();
    const perception = createAiPerception(state, "solaris");

    it("observerNationId is solaris", () => {
      expect(perception.observerNationId).toBe("solaris");
    });

    it("turn equals initial state.turn", () => {
      expect(perception.turn).toBe(state.turn);
    });

    it("phase equals initial state.phase", () => {
      expect(perception.phase).toBe(state.phase);
    });

    it("actionPoints maximum is 6", () => {
      expect(perception.actionPoints.maximum).toBe(6);
    });

    it("actionPoints remaining is 6", () => {
      expect(perception.actionPoints.remaining).toBe(6);
    });

    it("selfStrategicStats kind is exact", () => {
      expect(perception.selfStrategicStats.kind).toBe("exact");
    });

    it("selfStrategicStats stability is 72", () => {
      expect(perception.selfStrategicStats.stability).toBe(72);
    });

    it("selfStrategicStats publicSupport is 68", () => {
      expect(perception.selfStrategicStats.publicSupport).toBe(68);
    });

    it("selfStrategicStats internalSecurity is 66", () => {
      expect(perception.selfStrategicStats.internalSecurity).toBe(66);
    });

    it("foreignNations length is 5", () => {
      expect(perception.foreignNations.length).toBe(5);
    });

    it("foreign nation order is dravos, norvia, veloria, karsen, arkania", () => {
      expect(perception.foreignNations.map((f) => f.nationId)).toEqual([
        "dravos",
        "norvia",
        "veloria",
        "karsen",
        "arkania",
      ]);
    });

    it("all initial foreign strategicStats are unknown", () => {
      for (const foreign of perception.foreignNations) {
        expect(foreign.strategicStats).toEqual({ kind: "unknown" });
      }
    });
  });

  describe("self perception does not depend on visibility", () => {
    it("observer always knows own stats exactly", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "dravos");

      expect(perception.selfStrategicStats).toEqual({
        kind: "exact",
        stability: 78,
        publicSupport: 55,
        internalSecurity: 82,
      });
    });
  });

  describe("unknown visibility", () => {
    const state = createInitialGameState();
    const perception = createAiPerception(state, "solaris");

    it("dravos visibility is unknown", () => {
      const dravos = perception.foreignNations.find(
        (f) => f.nationId === "dravos",
      );
      expect(dravos?.visibility).toBe("unknown");
    });

    it("dravos strategicStats is unknown", () => {
      const dravos = perception.foreignNations.find(
        (f) => f.nationId === "dravos",
      );
      expect(dravos?.strategicStats).toEqual({ kind: "unknown" });
    });
  });

  describe("limited visibility with stat bands", () => {
    it("visibility limited shows bands not exact values", () => {
      let state = createInitialGameState();
      state = setNationVisibility(state, "solaris", "dravos", "limited");
      const perception = createAiPerception(state, "solaris");
      const dravos = perception.foreignNations.find(
        (f) => f.nationId === "dravos",
      );

      expect(dravos?.visibility).toBe("limited");
      expect(dravos?.strategicStats.kind).toBe("limited");
      if (dravos?.strategicStats.kind === "limited") {
        expect(typeof dravos.strategicStats.stability).toBe("string");
        expect(typeof dravos.strategicStats.publicSupport).toBe("string");
        expect(typeof dravos.strategicStats.internalSecurity).toBe("string");
      }
    });

    it("band boundaries: 0->low, 33->low, 34->medium, 66->medium, 67->high, 100->high", () => {
      let state = createInitialGameState();
      state = setNationVisibility(state, "solaris", "dravos", "limited");
      state = setNationStrategicStat(state, "dravos", "stability", 0);
      state = setNationStrategicStat(state, "dravos", "publicSupport", 33);
      state = setNationStrategicStat(state, "dravos", "internalSecurity", 100);

      const perception = createAiPerception(state, "solaris");
      const dravos = perception.foreignNations.find(
        (f) => f.nationId === "dravos",
      );

      expect(dravos?.strategicStats).toEqual({
        kind: "limited",
        stability: "low",
        publicSupport: "low",
        internalSecurity: "high",
      });
    });

    it("band boundaries at edges: 34->medium, 66->medium, 67->high", () => {
      let state = createInitialGameState();
      state = setNationVisibility(state, "solaris", "dravos", "limited");
      state = setNationStrategicStat(state, "dravos", "stability", 34);
      state = setNationStrategicStat(state, "dravos", "publicSupport", 66);
      state = setNationStrategicStat(state, "dravos", "internalSecurity", 67);

      const perception = createAiPerception(state, "solaris");
      const dravos = perception.foreignNations.find(
        (f) => f.nationId === "dravos",
      );

      expect(dravos?.strategicStats).toEqual({
        kind: "limited",
        stability: "medium",
        publicSupport: "medium",
        internalSecurity: "high",
      });
    });
  });

  describe("known visibility", () => {
    it("visibility known shows exact values", () => {
      let state = createInitialGameState();
      state = setNationVisibility(state, "solaris", "dravos", "known");
      const perception = createAiPerception(state, "solaris");
      const dravos = perception.foreignNations.find(
        (f) => f.nationId === "dravos",
      );

      expect(dravos?.visibility).toBe("known");
      expect(dravos?.strategicStats).toEqual({
        kind: "exact",
        stability: 78,
        publicSupport: 55,
        internalSecurity: 82,
      });
    });
  });

  describe("network/visibility separation", () => {
    it("deep network with unknown visibility exposes unknown strategicStats", () => {
      let state = createInitialGameState();
      state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "deep");

      const perception = createAiPerception(state, "solaris");
      const dravos = perception.foreignNations.find(
        (f) => f.nationId === "dravos",
      );

      expect(dravos?.intelligenceNetworkLevel).toBe("deep");
      expect(dravos?.visibility).toBe("unknown");
      expect(dravos?.strategicStats).toEqual({ kind: "unknown" });
    });
  });

  describe("directional influence", () => {
    it("observerInfluence is O->T, not T->O", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "solaris");
      const dravos = perception.foreignNations.find(
        (f) => f.nationId === "dravos",
      );

      expect(dravos?.observerInfluence).toBe(18);
    });

    it("reverse direction differs", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "dravos");
      const solaris = perception.foreignNations.find(
        (f) => f.nationId === "solaris",
      );

      expect(solaris?.observerInfluence).toBe(22);
    });
  });

  describe("bilateral diplomacy", () => {
    it("solaris-dravos is hostile", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "solaris");
      const dravos = perception.foreignNations.find(
        (f) => f.nationId === "dravos",
      );

      expect(dravos?.diplomaticStatus).toBe("hostile");
    });

    it("solaris-norvia is friendly", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "solaris");
      const norvia = perception.foreignNations.find(
        (f) => f.nationId === "norvia",
      );

      expect(norvia?.diplomaticStatus).toBe("friendly");
    });
  });

  describe("directional regime pressure", () => {
    it("observerRegimePressure is O->T", () => {
      let state = createInitialGameState();
      state = setNationRegimePressure(state, "solaris", "dravos", 40);

      const perception = createAiPerception(state, "solaris");
      const dravos = perception.foreignNations.find(
        (f) => f.nationId === "dravos",
      );

      expect(dravos?.observerRegimePressure).toBe(40);
    });

    it("reverse direction is independent", () => {
      let state = createInitialGameState();
      state = setNationRegimePressure(state, "dravos", "solaris", 70);

      const perception = createAiPerception(state, "solaris");
      const dravos = perception.foreignNations.find(
        (f) => f.nationId === "dravos",
      );

      expect(dravos?.observerRegimePressure).toBe(0);
    });
  });

  describe("observer -> target network", () => {
    it("network level is observer -> target", () => {
      let state = createInitialGameState();
      state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "established");

      const perception = createAiPerception(state, "solaris");
      const dravos = perception.foreignNations.find(
        (f) => f.nationId === "dravos",
      );

      expect(dravos?.intelligenceNetworkLevel).toBe("established");
    });
  });

  describe("defensive awareness direction", () => {
    it("awareness is observer-as-defender of foreign-as-intruder", () => {
      let state = createInitialGameState();
      state = setCounterintelligenceAwareness(state, "solaris", "dravos", "suspected");

      const perception = createAiPerception(state, "solaris");
      const dravos = perception.foreignNations.find(
        (f) => f.nationId === "dravos",
      );

      expect(dravos?.defensiveAwareness).toBe("suspected");
    });

    it("reverse direction is independent", () => {
      let state = createInitialGameState();
      state = setCounterintelligenceAwareness(state, "dravos", "solaris", "identified");

      const perception = createAiPerception(state, "solaris");
      const dravos = perception.foreignNations.find(
        (f) => f.nationId === "dravos",
      );

      expect(dravos?.defensiveAwareness).toBe("unaware");
    });
  });

  describe("proxy conflict filtering", () => {
    it("includes conflicts where observer is a sponsor", () => {
      let state = createInitialGameState();
      const conflict: ProxyConflict = {
        id: "pc-1",
        hostNationId: "norvia",
        nationAId: "solaris",
        nationBId: "dravos",
        intensity: "low",
      };
      state = addProxyConflict(state, conflict);

      const perception = createAiPerception(state, "solaris");
      expect(perception.involvedProxyConflicts.length).toBe(1);
      expect(perception.involvedProxyConflicts[0].hostNationId).toBe("norvia");
    });

    it("includes conflicts where observer is the host", () => {
      let state = createInitialGameState();
      const conflict: ProxyConflict = {
        id: "pc-2",
        hostNationId: "solaris",
        nationAId: "dravos",
        nationBId: "norvia",
        intensity: "low",
      };
      state = addProxyConflict(state, conflict);

      const perception = createAiPerception(state, "solaris");
      expect(perception.involvedProxyConflicts.length).toBe(1);
      expect(perception.involvedProxyConflicts[0].hostNationId).toBe("solaris");
    });

    it("excludes conflicts where observer is not involved", () => {
      let state = createInitialGameState();
      const conflict: ProxyConflict = {
        id: "pc-3",
        hostNationId: "norvia",
        nationAId: "dravos",
        nationBId: "veloria",
        intensity: "low",
      };
      state = addProxyConflict(state, conflict);

      const perception = createAiPerception(state, "solaris");
      expect(perception.involvedProxyConflicts.length).toBe(0);
    });

    it("preserves world.proxyConflicts order", () => {
      let state = createInitialGameState();
      const c1: ProxyConflict = {
        id: "pc-4",
        hostNationId: "norvia",
        nationAId: "solaris",
        nationBId: "dravos",
        intensity: "low",
      };
      state = addProxyConflict(state, c1);
      const c2: ProxyConflict = {
        id: "pc-5",
        hostNationId: "veloria",
        nationAId: "solaris",
        nationBId: "arkania",
        intensity: "medium",
      };
      state = addProxyConflict(state, c2);

      const perception = createAiPerception(state, "solaris");
      expect(perception.involvedProxyConflicts.length).toBe(2);
      expect(perception.involvedProxyConflicts[0].hostNationId).toBe("norvia");
      expect(perception.involvedProxyConflicts[1].hostNationId).toBe("veloria");
    });
  });

  describe("unknown observer", () => {
    it("throws UnknownNationError for unknown observer", () => {
      const state = createInitialGameState();
      expect(() => createAiPerception(state, "nonexistent")).toThrow(
        'Unknown nation: "nonexistent"',
      );
    });

    it("unknown observer precedence over malformed state", () => {
      const state = createInitialGameState();
      const badState: GameState = {
        ...state,
        turn: -1,
      };
      expect(() => createAiPerception(badState, "nonexistent")).toThrow(
        'Unknown nation: "nonexistent"',
      );
    });

    it("valid observer + malformed state throws validation error", () => {
      const state = createInitialGameState();
      const badState: GameState = {
        ...state,
        turn: -1,
      };
      expect(() => createAiPerception(badState, "solaris")).toThrow(
        "Invalid turn: expected >= 1, got -1",
      );
    });
  });

  describe("fresh snapshot contract", () => {
    it("returns fresh objects (resultA !== resultB but deep equal)", () => {
      const state = createInitialGameState();
      const resultA = createAiPerception(state, "solaris");
      const resultB = createAiPerception(state, "solaris");

      expect(resultA).not.toBe(resultB);
      expect(resultA).toEqual(resultB);
    });

    it("each foreign nation object is fresh between calls", () => {
      const state = createInitialGameState();
      const resultA = createAiPerception(state, "solaris");
      const resultB = createAiPerception(state, "solaris");

      for (let i = 0; i < resultA.foreignNations.length; i++) {
        expect(resultA.foreignNations[i]).not.toBe(
          resultB.foreignNations[i],
        );
      }
    });

    it("source state remains unchanged", () => {
      const state = createInitialGameState();
      const snapshot = JSON.stringify(state);
      createAiPerception(state, "solaris");
      expect(JSON.stringify(state)).toBe(snapshot);
    });
  });

  describe("determinism", () => {
    it("deeply equal independent GameStates produce deeply equal results", () => {
      const stateA = createInitialGameState();
      const stateB = createInitialGameState();
      const resultA = createAiPerception(stateA, "solaris");
      const resultB = createAiPerception(stateB, "solaris");

      expect(resultA).toEqual(resultB);
    });
  });

  describe("turn/phase/AP reflection", () => {
    it("perception reflects current turn and phase", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "solaris");

      expect(perception.turn).toBe(1);
      expect(perception.phase).toBe("planning");
    });

    it("perception reflects AP after resolveTurn", () => {
      let state = createInitialGameState();
      const turnResult = resolveTurn(state, []);
      state = turnResult.state;

      const perception = createAiPerception(state, "solaris");
      expect(perception.turn).toBe(2);
      expect(perception.actionPoints.maximum).toBe(6);
      expect(perception.actionPoints.remaining).toBe(6);
    });
  });

  describe("any valid nation may observe", () => {
    it("dravos can observe", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "dravos");

      expect(perception.observerNationId).toBe("dravos");
      expect(perception.selfStrategicStats).toEqual({
        kind: "exact",
        stability: 78,
        publicSupport: 55,
        internalSecurity: 82,
      });
      expect(perception.foreignNations.length).toBe(5);
    });

    it("norvia can observe", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "norvia");

      expect(perception.observerNationId).toBe("norvia");
      expect(perception.selfStrategicStats).toEqual({
        kind: "exact",
        stability: 58,
        publicSupport: 74,
        internalSecurity: 52,
      });
    });
  });

  describe("no-omniscience shape", () => {
    it("AiForeignNationPerception has exactly the accepted fields", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "solaris");
      const foreign = perception.foreignNations[0];

      const keys = Object.keys(foreign).sort();
      expect(keys).toEqual([
        "defensiveAwareness",
        "diplomaticStatus",
        "intelligenceNetworkLevel",
        "nationId",
        "observerInfluence",
        "observerRegimePressure",
        "strategicStats",
        "visibility",
      ]);
    });

    it("AiPerception has exactly the accepted fields", () => {
      const state = createInitialGameState();
      const perception = createAiPerception(state, "solaris");

      const keys = Object.keys(perception).sort();
      expect(keys).toEqual([
        "actionPoints",
        "foreignNations",
        "involvedProxyConflicts",
        "observerNationId",
        "phase",
        "selfStrategicStats",
        "turn",
      ]);
    });
  });

  describe("query-only contract", () => {
    it("createAiPerception does not spend AP", () => {
      const state = createInitialGameState();
      createAiPerception(state, "solaris");

      const ap = state.planning.actionPoints.find(
        (a) => a.nationId === "solaris",
      );
      expect(ap?.remaining).toBe(6);
    });
  });

  describe("state shape unchanged", () => {
    it("GameState shape unchanged", () => {
      const state = createInitialGameState();
      const keys = Object.keys(state).sort();
      expect(keys).toEqual([
        "intelligence",
        "phase",
        "planning",
        "playerNationId",
        "turn",
        "world",
      ]);
    });

    it("WorldState shape unchanged", () => {
      const state = createInitialGameState();
      const keys = Object.keys(state.world).sort();
      expect(keys).toEqual([
        "diplomaticRelationships",
        "map",
        "nationInfluence",
        "nationRegimePressure",
        "nationStrategicStats",
        "nations",
        "proxyConflicts",
        "regionOwnership",
      ]);
    });

    it("IntelligenceState shape unchanged", () => {
      const state = createInitialGameState();
      const keys = Object.keys(state.intelligence).sort();
      expect(keys).toEqual([
        "agents",
        "assets",
        "counterintelligenceAwareness",
        "doubleAgents",
        "nationVisibility",
        "networks",
      ]);
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
      expect(eventTypes.length).toBe(EXPECTED_EVENT_VARIANT_COUNT);
    });
  });
});
