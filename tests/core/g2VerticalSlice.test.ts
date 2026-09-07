import { describe, it, expect } from "vitest";
import { createInitialGameState } from "../../src/core/model/gameState";
import { validateGameState } from "../../src/core/simulation/validateGameState";
import { getNationStrategicStats } from "../../src/core/model/nationStrategicStats";
import { getNationInfluence } from "../../src/core/model/nationInfluence";
import { getNationRegimePressure } from "../../src/core/model/nationRegimePressure";
import { getDiplomaticRelationship } from "../../src/core/model/diplomaticRelationship";
import { setNationInfluence } from "../../src/core/simulation/setNationInfluence";
import { setIntelligenceNetworkLevel } from "../../src/core/simulation/setIntelligenceNetworkLevel";
import { cultivatePoliticalInfluence } from "../../src/core/simulation/cultivatePoliticalInfluence";
import { conductCovertSabotage } from "../../src/core/simulation/conductCovertSabotage";
import { startProxyConflict } from "../../src/core/simulation/startProxyConflict";
import { escalateProxyConflict } from "../../src/core/simulation/escalateProxyConflict";
import { applyRegimePressure } from "../../src/core/simulation/applyRegimePressure";
import { resolveTurn } from "../../src/core/simulation/resolveTurn";

describe("G2 CROSS-SYSTEM VERTICAL SLICE", () => {
  it("G2.4 -> G2.5 -> resolveTurn -> G2.6 -> G2.7 deterministic scenario", () => {
    // A. Start canonical GameState.
    let state = createInitialGameState();

    // B. G2.4: cultivatePoliticalInfluence — Solaris -> Norvia
    //    Initial influence: 42, expected: 52
    const resultB = cultivatePoliticalInfluence(state, "solaris", "norvia");
    state = resultB.state;
    expect(getNationInfluence(state.world, "solaris", "norvia").value).toBe(52);
    expect(resultB.event.type).toBe("political-influence-cultivated");
    //    Solaris AP: 6 -> 4
    expect(state.planning.actionPoints.find((a) => a.nationId === "solaris")!.remaining).toBe(4);

    // C. TEST SETUP: establish Solaris -> Dravos intelligence network at "established"
    state = setIntelligenceNetworkLevel(state, "solaris", "dravos", "established");

    // D. G2.5: conductCovertSabotage — solaris-echo against Dravos
    //    Objective: "internal-security"
    //    Dravos initial internalSecurity: 82, expected: 72
    const resultD = conductCovertSabotage(
      state,
      "solaris",
      "dravos",
      "solaris-echo",
      "internal-security",
    );
    state = resultD.state;
    expect(getNationStrategicStats(state.world, "dravos").internalSecurity).toBe(72);
    expect(resultD.event.type).toBe("covert-sabotage-conducted");
    //    Solaris AP: 4 -> 2
    expect(state.planning.actionPoints.find((a) => a.nationId === "solaris")!.remaining).toBe(2);

    // E. resolveTurn
    const { state: afterTurn } = resolveTurn(state, []);
    state = afterTurn;
    //    Solaris AP resets: 6
    expect(state.planning.actionPoints.find((a) => a.nationId === "solaris")!.remaining).toBe(6);

    // F. G2.6: startProxyConflict — Solaris, Dravos, Norvia
    //    Eligibility: Solaris/Dravos hostile, Solaris->Norvia influence=52, Norvia stability=58
    const resultF = startProxyConflict(state, "solaris", "dravos", "norvia", "proxy-g2-acceptance-001");
    state = resultF.state;
    expect(resultF.event.type).toBe("proxy-conflict-started");
    expect(state.world.proxyConflicts[0].intensity).toBe("low");
    //    Norvia stability: 58 -> 53
    expect(getNationStrategicStats(state.world, "norvia").stability).toBe(53);
    //    Solaris AP: 6 -> 3
    expect(state.planning.actionPoints.find((a) => a.nationId === "solaris")!.remaining).toBe(3);

    // G. escalateProxyConflict — Solaris
    //    low -> medium, Norvia stability: 53 -> 48
    const resultG = escalateProxyConflict(state, "solaris", "proxy-g2-acceptance-001");
    state = resultG.state;
    expect(resultG.event.type).toBe("proxy-conflict-escalated");
    expect(state.world.proxyConflicts[0].intensity).toBe("medium");
    expect(getNationStrategicStats(state.world, "norvia").stability).toBe(48);
    //    Solaris AP: 3 -> 1
    expect(state.planning.actionPoints.find((a) => a.nationId === "solaris")!.remaining).toBe(1);

    // H. resolveTurn
    const { state: afterTurn2 } = resolveTurn(state, []);
    state = afterTurn2;
    //    Solaris AP resets: 6
    expect(state.planning.actionPoints.find((a) => a.nationId === "solaris")!.remaining).toBe(6);

    // I. TEST SETUP: set Solaris -> Karsen influence = 40
    state = setNationInfluence(state, "solaris", "karsen", 40);
    //    Diplomacy remains neutral (canonical)

    // J. G2.7: applyRegimePressure — Solaris, Karsen
    //    Solaris->Karsen pressure: 0 -> 20, Karsen stability: 64 -> 59
    const resultJ = applyRegimePressure(state, "solaris", "karsen");
    state = resultJ.state;
    expect(resultJ.event.type).toBe("regime-pressure-applied");
    expect(getNationRegimePressure(state.world, "solaris", "karsen").value).toBe(20);
    expect(getNationStrategicStats(state.world, "karsen").stability).toBe(59);
    //    Solaris AP: 6 -> 3
    expect(state.planning.actionPoints.find((a) => a.nationId === "solaris")!.remaining).toBe(3);

    // K. Final assertions
    //    Solaris -> Norvia influence remains 52
    expect(getNationInfluence(state.world, "solaris", "norvia").value).toBe(52);
    //    Dravos internalSecurity remains 72
    expect(getNationStrategicStats(state.world, "dravos").internalSecurity).toBe(72);
    //    Proxy conflict exists at medium
    expect(state.world.proxyConflicts).toHaveLength(1);
    expect(state.world.proxyConflicts[0].intensity).toBe("medium");
    //    Norvia stability remains 48
    expect(getNationStrategicStats(state.world, "norvia").stability).toBe(48);
    //    Solaris -> Karsen pressure = 20
    expect(getNationRegimePressure(state.world, "solaris", "karsen").value).toBe(20);
    //    Karsen stability = 59
    expect(getNationStrategicStats(state.world, "karsen").stability).toBe(59);
    //    Solaris/Karsen diplomacy remains neutral
    expect(getDiplomaticRelationship(state.world, "solaris", "karsen").status).toBe("neutral");
    //    intelligence network remains established
    const network = state.intelligence.networks.find(
      (n) => n.observerNationId === "solaris" && n.targetNationId === "dravos",
    );
    expect(network?.level).toBe("established");
    //    all successful operation events are exact
    expect(resultB.event.type).toBe("political-influence-cultivated");
    expect(resultD.event.type).toBe("covert-sabotage-conducted");
    expect(resultF.event.type).toBe("proxy-conflict-started");
    expect(resultG.event.type).toBe("proxy-conflict-escalated");
    expect(resultJ.event.type).toBe("regime-pressure-applied");
    //    all effects persist (checked above)
    //    no hidden coupling
    expect(state.world.regionOwnership).toHaveLength(18);
    expect(state.world.nationRegimePressure).toHaveLength(30);

    //    Final state must pass validateGameState
    expect(() => validateGameState(state)).not.toThrow();
  });
});
