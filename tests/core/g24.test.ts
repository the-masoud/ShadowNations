import { describe, it, expect } from "vitest";
import {
  cultivatePoliticalInfluence,
  CULTIVATE_POLITICAL_INFLUENCE_AP_COST,
  SelfTargetPoliticalOperationError,
  MaximumPoliticalInfluenceError,
} from "../../src/core/simulation/cultivatePoliticalInfluence";
import {
  conductDiplomaticOutreach,
  DIPLOMATIC_OUTREACH_AP_COST,
  InsufficientPoliticalInfluenceError,
  MaximumDiplomaticRelationshipError,
} from "../../src/core/simulation/conductDiplomaticOutreach";
import {
  stabilizeGovernment,
  STABILIZE_GOVERNMENT_AP_COST,
  HostileDiplomaticRelationshipError,
  MaximumNationStabilityError,
} from "../../src/core/simulation/stabilizeGovernment";
import { createInitialGameState } from "../../src/core/model/gameState";
import { getNationInfluence } from "../../src/core/model/nationInfluence";
import { getDiplomaticRelationship } from "../../src/core/model/diplomaticRelationship";
import { getNationStrategicStats } from "../../src/core/model/nationStrategicStats";
import { UnknownNationError } from "../../src/core/model/worldState";
import { InsufficientActionPointsError } from "../../src/core/simulation/spendActionPoints";
import { validateGameState } from "../../src/core/simulation/validateGameState";
import { setNationInfluence } from "../../src/core/simulation/setNationInfluence";
import { setNationStrategicStat } from "../../src/core/simulation/setNationStrategicStat";
import { setDiplomaticStatus } from "../../src/core/simulation/setDiplomaticStatus";
import { resolveTurn } from "../../src/core/simulation/resolveTurn";

function validState() {
  return createInitialGameState();
}

describe("CULTIVATE POLITICAL INFLUENCE", () => {
  it("1. successful Solaris -> Norvia 42 -> 52", () => {
    const state = validState();
    const { state: next } = cultivatePoliticalInfluence(state, "solaris", "norvia");
    const influence = getNationInfluence(next.world, "solaris", "norvia");
    expect(influence.value).toBe(52);
  });

  it("2. exact 2 AP cost", () => {
    const state = validState();
    const { event } = cultivatePoliticalInfluence(state, "solaris", "norvia");
    expect(event.actionPointCost).toBe(CULTIVATE_POLITICAL_INFLUENCE_AP_COST);
  });

  it("3. exact event", () => {
    const state = validState();
    const { event } = cultivatePoliticalInfluence(state, "solaris", "norvia");
    expect(event).toEqual({
      type: "political-influence-cultivated",
      turn: state.turn,
      actorNationId: "solaris",
      targetNationId: "norvia",
      previousInfluence: 42,
      newInfluence: 52,
      actionPointCost: CULTIVATE_POLITICAL_INFLUENCE_AP_COST,
    });
  });

  it("4. 95 -> 100 caps correctly", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "norvia", 95);
    const { state: next } = cultivatePoliticalInfluence(state, "solaris", "norvia");
    const influence = getNationInfluence(next.world, "solaris", "norvia");
    expect(influence.value).toBe(100);
  });

  it("5. 100 fails MaximumPoliticalInfluenceError", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "norvia", 100);
    expect(() => cultivatePoliticalInfluence(state, "solaris", "norvia")).toThrow(
      MaximumPoliticalInfluenceError,
    );
  });

  it("6. maximum failure spends no AP", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "norvia", 100);
    const apBefore = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    try {
      cultivatePoliticalInfluence(state, "solaris", "norvia");
    } catch {
      // expected
    }
    const apAfter = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    expect(apAfter).toBe(apBefore);
  });

  it("7. reverse influence remains unchanged", () => {
    const state = validState();
    const before = getNationInfluence(state.world, "norvia", "solaris").value;
    const { state: next } = cultivatePoliticalInfluence(state, "solaris", "norvia");
    const after = getNationInfluence(next.world, "norvia", "solaris").value;
    expect(after).toBe(before);
  });

  it("8. diplomacy unchanged", () => {
    const state = validState();
    const before = getDiplomaticRelationship(state.world, "solaris", "norvia").status;
    const { state: next } = cultivatePoliticalInfluence(state, "solaris", "norvia");
    const after = getDiplomaticRelationship(next.world, "solaris", "norvia").status;
    expect(after).toBe(before);
  });

  it("9. strategic stats unchanged", () => {
    const state = validState();
    const before = getNationStrategicStats(state.world, "norvia");
    const { state: next } = cultivatePoliticalInfluence(state, "solaris", "norvia");
    const after = getNationStrategicStats(next.world, "norvia");
    expect(after.stability).toBe(before.stability);
    expect(after.publicSupport).toBe(before.publicSupport);
    expect(after.internalSecurity).toBe(before.internalSecurity);
  });

  it("10. unknown actor fails", () => {
    const state = validState();
    expect(() =>
      cultivatePoliticalInfluence(state, "nonexistent", "norvia"),
    ).toThrow(UnknownNationError);
  });

  it("11. unknown target fails", () => {
    const state = validState();
    expect(() =>
      cultivatePoliticalInfluence(state, "solaris", "nonexistent"),
    ).toThrow(UnknownNationError);
  });

  it("12. self target fails", () => {
    const state = validState();
    expect(() =>
      cultivatePoliticalInfluence(state, "solaris", "solaris"),
    ).toThrow(SelfTargetPoliticalOperationError);
  });

  it("13. missing influence fails", () => {
    const state = validState();
    const world = {
      ...state.world,
      nationInfluence: state.world.nationInfluence.filter(
        (e) => !(e.influencerNationId === "solaris" && e.targetNationId === "norvia"),
      ),
    };
    const badState = { ...state, world };
    expect(() =>
      cultivatePoliticalInfluence(badState, "solaris", "norvia"),
    ).toThrow();
  });

  it("14. invalid phase fails", () => {
    const state = validState();
    const badState = { ...state, phase: "resolution" as const };
    expect(() =>
      cultivatePoliticalInfluence(badState, "solaris", "norvia"),
    ).toThrow();
  });

  it("15. insufficient AP fails", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "norvia", 60);
    state = cultivatePoliticalInfluence(state, "solaris", "norvia").state;
    state = cultivatePoliticalInfluence(state, "solaris", "norvia").state;
    state = cultivatePoliticalInfluence(state, "solaris", "norvia").state;
    expect(() =>
      cultivatePoliticalInfluence(state, "solaris", "norvia"),
    ).toThrow(InsufficientActionPointsError);
  });

  it("16. atomic failure preserves original state", () => {
    const state = validState();
    const snapshot = JSON.parse(JSON.stringify(state));
    try {
      cultivatePoliticalInfluence(state, "solaris", "solaris");
    } catch {
      // expected
    }
    expect(state).toEqual(snapshot);
  });
});

describe("CONDUCT DIPLOMATIC OUTREACH", () => {
  it("17. hostile -> neutral", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "dravos", 30);
    const { state: next } = conductDiplomaticOutreach(state, "solaris", "dravos");
    const rel = getDiplomaticRelationship(next.world, "solaris", "dravos");
    expect(rel.status).toBe("neutral");
  });

  it("18. neutral -> friendly", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "dravos", 30);
    state = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    const { state: next } = conductDiplomaticOutreach(state, "solaris", "dravos");
    const rel = getDiplomaticRelationship(next.world, "solaris", "dravos");
    expect(rel.status).toBe("friendly");
  });

  it("19. hostile never skips directly to friendly", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "dravos", 30);
    const { state: next } = conductDiplomaticOutreach(state, "solaris", "dravos");
    const rel = getDiplomaticRelationship(next.world, "solaris", "dravos");
    expect(rel.status).not.toBe("friendly");
  });

  it("20. exact 2 AP cost", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "dravos", 30);
    const { event } = conductDiplomaticOutreach(state, "solaris", "dravos");
    expect(event.actionPointCost).toBe(DIPLOMATIC_OUTREACH_AP_COST);
  });

  it("21. exact event for hostile -> neutral", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "dravos", 30);
    const { event } = conductDiplomaticOutreach(state, "solaris", "dravos");
    expect(event).toEqual({
      type: "diplomatic-outreach-conducted",
      turn: state.turn,
      actorNationId: "solaris",
      targetNationId: "dravos",
      previousStatus: "hostile",
      newStatus: "neutral",
      actionPointCost: DIPLOMATIC_OUTREACH_AP_COST,
    });
  });

  it("22. exact event for neutral -> friendly", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "dravos", 30);
    state = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    const { event } = conductDiplomaticOutreach(state, "solaris", "dravos");
    expect(event).toEqual({
      type: "diplomatic-outreach-conducted",
      turn: state.turn,
      actorNationId: "solaris",
      targetNationId: "dravos",
      previousStatus: "neutral",
      newStatus: "friendly",
      actionPointCost: DIPLOMATIC_OUTREACH_AP_COST,
    });
  });

  it("23. actor influence exactly 30 is sufficient", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "dravos", 30);
    expect(() => conductDiplomaticOutreach(state, "solaris", "dravos")).not.toThrow();
  });

  it("24. actor influence 29 fails", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "dravos", 29);
    expect(() => conductDiplomaticOutreach(state, "solaris", "dravos")).toThrow(
      InsufficientPoliticalInfluenceError,
    );
  });

  it("25. insufficient influence spends no AP", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "dravos", 29);
    const apBefore = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    try {
      conductDiplomaticOutreach(state, "solaris", "dravos");
    } catch {
      // expected
    }
    const apAfter = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    expect(apAfter).toBe(apBefore);
  });

  it("26. friendly status fails MaximumDiplomaticRelationshipError", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "dravos", 30);
    state = setDiplomaticStatus(state, "solaris", "dravos", "friendly");
    expect(() => conductDiplomaticOutreach(state, "solaris", "dravos")).toThrow(
      MaximumDiplomaticRelationshipError,
    );
  });

  it("27. friendly failure spends no AP", () => {
    let state = validState();
    state = setDiplomaticStatus(state, "solaris", "dravos", "friendly");
    const apBefore = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    try {
      conductDiplomaticOutreach(state, "solaris", "dravos");
    } catch {
      // expected
    }
    const apAfter = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    expect(apAfter).toBe(apBefore);
  });

  it("28. influence unchanged", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "dravos", 30);
    const before = getNationInfluence(state.world, "solaris", "dravos").value;
    const { state: next } = conductDiplomaticOutreach(state, "solaris", "dravos");
    const after = getNationInfluence(next.world, "solaris", "dravos").value;
    expect(after).toBe(before);
  });

  it("29. strategic stats unchanged", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "dravos", 30);
    const before = getNationStrategicStats(state.world, "dravos");
    const { state: next } = conductDiplomaticOutreach(state, "solaris", "dravos");
    const after = getNationStrategicStats(next.world, "dravos");
    expect(after.stability).toBe(before.stability);
    expect(after.publicSupport).toBe(before.publicSupport);
    expect(after.internalSecurity).toBe(before.internalSecurity);
  });

  it("30. reverse diplomatic lookup sees same new status", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "dravos", 30);
    const { state: next } = conductDiplomaticOutreach(state, "solaris", "dravos");
    const rel1 = getDiplomaticRelationship(next.world, "solaris", "dravos");
    const rel2 = getDiplomaticRelationship(next.world, "dravos", "solaris");
    expect(rel1).toBe(rel2);
    expect(rel1.status).toBe("neutral");
  });

  it("31. unknown actor fails", () => {
    const state = validState();
    expect(() =>
      conductDiplomaticOutreach(state, "nonexistent", "dravos"),
    ).toThrow(UnknownNationError);
  });

  it("32. unknown target fails", () => {
    const state = validState();
    expect(() =>
      conductDiplomaticOutreach(state, "solaris", "nonexistent"),
    ).toThrow(UnknownNationError);
  });

  it("33. self target fails", () => {
    const state = validState();
    expect(() =>
      conductDiplomaticOutreach(state, "solaris", "solaris"),
    ).toThrow(SelfTargetPoliticalOperationError);
  });

  it("34. missing influence fails", () => {
    const state = validState();
    const world = {
      ...state.world,
      nationInfluence: state.world.nationInfluence.filter(
        (e) => !(e.influencerNationId === "solaris" && e.targetNationId === "dravos"),
      ),
    };
    const badState = { ...state, world };
    expect(() =>
      conductDiplomaticOutreach(badState, "solaris", "dravos"),
    ).toThrow();
  });

  it("35. missing diplomacy fails", () => {
    const state = validState();
    const world = {
      ...state.world,
      diplomaticRelationships: state.world.diplomaticRelationships.filter(
        (r) => !(r.nationAId === "solaris" && r.nationBId === "dravos"),
      ),
    };
    const badState = { ...state, world };
    expect(() =>
      conductDiplomaticOutreach(badState, "solaris", "dravos"),
    ).toThrow();
  });

  it("36. invalid phase fails", () => {
    const state = validState();
    const badState = { ...state, phase: "resolution" as const };
    expect(() =>
      conductDiplomaticOutreach(badState, "solaris", "dravos"),
    ).toThrow();
  });

  it("37. insufficient AP fails", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "dravos", 30);
    state = conductDiplomaticOutreach(state, "solaris", "dravos").state;
    state = setDiplomaticStatus(state, "solaris", "dravos", "hostile");
    state = conductDiplomaticOutreach(state, "solaris", "dravos").state;
    state = setDiplomaticStatus(state, "solaris", "dravos", "hostile");
    state = conductDiplomaticOutreach(state, "solaris", "dravos").state;
    expect(() =>
      conductDiplomaticOutreach(state, "solaris", "dravos"),
    ).toThrow(InsufficientActionPointsError);
  });

  it("38. atomic failure preserves original state", () => {
    const state = validState();
    const snapshot = JSON.parse(JSON.stringify(state));
    try {
      conductDiplomaticOutreach(state, "solaris", "solaris");
    } catch {
      // expected
    }
    expect(state).toEqual(snapshot);
  });
});

describe("STABILIZE GOVERNMENT", () => {
  it("39. stability increases by 5", () => {
    const state = validState();
    const { state: next } = stabilizeGovernment(state, "solaris", "norvia");
    const stats = getNationStrategicStats(next.world, "norvia");
    expect(stats.stability).toBe(63);
  });

  it("40. exact 2 AP cost", () => {
    const state = validState();
    const { event } = stabilizeGovernment(state, "solaris", "norvia");
    expect(event.actionPointCost).toBe(STABILIZE_GOVERNMENT_AP_COST);
  });

  it("41. exact event", () => {
    const state = validState();
    const { event } = stabilizeGovernment(state, "solaris", "norvia");
    expect(event).toEqual({
      type: "government-stabilized",
      turn: state.turn,
      actorNationId: "solaris",
      targetNationId: "norvia",
      previousStability: 58,
      newStability: 63,
      actionPointCost: STABILIZE_GOVERNMENT_AP_COST,
    });
  });

  it("42. stability 95 -> 100", () => {
    let state = validState();
    state = setNationStrategicStat(state, "norvia", "stability", 95);
    const { state: next } = stabilizeGovernment(state, "solaris", "norvia");
    const stats = getNationStrategicStats(next.world, "norvia");
    expect(stats.stability).toBe(100);
  });

  it("43. stability 98 -> 100", () => {
    let state = validState();
    state = setNationStrategicStat(state, "norvia", "stability", 98);
    const { state: next } = stabilizeGovernment(state, "solaris", "norvia");
    const stats = getNationStrategicStats(next.world, "norvia");
    expect(stats.stability).toBe(100);
  });

  it("44. stability 100 fails MaximumNationStabilityError", () => {
    let state = validState();
    state = setNationStrategicStat(state, "norvia", "stability", 100);
    expect(() => stabilizeGovernment(state, "solaris", "norvia")).toThrow(
      MaximumNationStabilityError,
    );
  });

  it("45. maximum failure spends no AP", () => {
    let state = validState();
    state = setNationStrategicStat(state, "norvia", "stability", 100);
    const apBefore = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    try {
      stabilizeGovernment(state, "solaris", "norvia");
    } catch {
      // expected
    }
    const apAfter = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    expect(apAfter).toBe(apBefore);
  });

  it("46. influence exactly 40 is sufficient", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "norvia", 40);
    expect(() => stabilizeGovernment(state, "solaris", "norvia")).not.toThrow();
  });

  it("47. influence 39 fails", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "norvia", 39);
    expect(() => stabilizeGovernment(state, "solaris", "norvia")).toThrow(
      InsufficientPoliticalInfluenceError,
    );
  });

  it("48. insufficient influence spends no AP", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "norvia", 39);
    const apBefore = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    try {
      stabilizeGovernment(state, "solaris", "norvia");
    } catch {
      // expected
    }
    const apAfter = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    expect(apAfter).toBe(apBefore);
  });

  it("49. neutral diplomacy allowed", () => {
    let state = validState();
    state = setDiplomaticStatus(state, "solaris", "norvia", "neutral");
    expect(() => stabilizeGovernment(state, "solaris", "norvia")).not.toThrow();
  });

  it("50. friendly diplomacy allowed", () => {
    const state = validState();
    expect(() => stabilizeGovernment(state, "solaris", "norvia")).not.toThrow();
  });

  it("51. hostile diplomacy fails", () => {
    let state = validState();
    state = setDiplomaticStatus(state, "solaris", "norvia", "hostile");
    expect(() => stabilizeGovernment(state, "solaris", "norvia")).toThrow(
      HostileDiplomaticRelationshipError,
    );
  });

  it("52. hostile failure spends no AP", () => {
    let state = validState();
    state = setDiplomaticStatus(state, "solaris", "norvia", "hostile");
    const apBefore = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    try {
      stabilizeGovernment(state, "solaris", "norvia");
    } catch {
      // expected
    }
    const apAfter = state.planning.actionPoints.find(
      (a) => a.nationId === "solaris",
    )!.remaining;
    expect(apAfter).toBe(apBefore);
  });

  it("53. publicSupport unchanged", () => {
    const state = validState();
    const before = getNationStrategicStats(state.world, "norvia").publicSupport;
    const { state: next } = stabilizeGovernment(state, "solaris", "norvia");
    const after = getNationStrategicStats(next.world, "norvia").publicSupport;
    expect(after).toBe(before);
  });

  it("54. internalSecurity unchanged", () => {
    const state = validState();
    const before = getNationStrategicStats(state.world, "norvia").internalSecurity;
    const { state: next } = stabilizeGovernment(state, "solaris", "norvia");
    const after = getNationStrategicStats(next.world, "norvia").internalSecurity;
    expect(after).toBe(before);
  });

  it("55. influence unchanged", () => {
    const state = validState();
    const before = getNationInfluence(state.world, "solaris", "norvia").value;
    const { state: next } = stabilizeGovernment(state, "solaris", "norvia");
    const after = getNationInfluence(next.world, "solaris", "norvia").value;
    expect(after).toBe(before);
  });

  it("56. diplomacy unchanged", () => {
    const state = validState();
    const before = getDiplomaticRelationship(state.world, "solaris", "norvia").status;
    const { state: next } = stabilizeGovernment(state, "solaris", "norvia");
    const after = getDiplomaticRelationship(next.world, "solaris", "norvia").status;
    expect(after).toBe(before);
  });

  it("57. unknown actor fails", () => {
    const state = validState();
    expect(() =>
      stabilizeGovernment(state, "nonexistent", "norvia"),
    ).toThrow(UnknownNationError);
  });

  it("58. unknown target fails", () => {
    const state = validState();
    expect(() =>
      stabilizeGovernment(state, "solaris", "nonexistent"),
    ).toThrow(UnknownNationError);
  });

  it("59. self target fails", () => {
    const state = validState();
    expect(() =>
      stabilizeGovernment(state, "solaris", "solaris"),
    ).toThrow(SelfTargetPoliticalOperationError);
  });

  it("60. missing influence fails", () => {
    const state = validState();
    const world = {
      ...state.world,
      nationInfluence: state.world.nationInfluence.filter(
        (e) => !(e.influencerNationId === "solaris" && e.targetNationId === "norvia"),
      ),
    };
    const badState = { ...state, world };
    expect(() =>
      stabilizeGovernment(badState, "solaris", "norvia"),
    ).toThrow();
  });

  it("61. missing diplomacy fails", () => {
    const state = validState();
    const world = {
      ...state.world,
      diplomaticRelationships: state.world.diplomaticRelationships.filter(
        (r) => !(r.nationAId === "solaris" && r.nationBId === "norvia"),
      ),
    };
    const badState = { ...state, world };
    expect(() =>
      stabilizeGovernment(badState, "solaris", "norvia"),
    ).toThrow();
  });

  it("62. missing strategic stats fails", () => {
    const state = validState();
    const world = {
      ...state.world,
      nationStrategicStats: state.world.nationStrategicStats.filter(
        (s) => s.nationId !== "norvia",
      ),
    };
    const badState = { ...state, world };
    expect(() =>
      stabilizeGovernment(badState, "solaris", "norvia"),
    ).toThrow();
  });

  it("63. invalid phase fails", () => {
    const state = validState();
    const badState = { ...state, phase: "resolution" as const };
    expect(() =>
      stabilizeGovernment(badState, "solaris", "norvia"),
    ).toThrow();
  });

  it("64. insufficient AP fails", () => {
    let state = validState();
    state = stabilizeGovernment(state, "solaris", "norvia").state;
    state = stabilizeGovernment(state, "solaris", "norvia").state;
    state = stabilizeGovernment(state, "solaris", "norvia").state;
    expect(() =>
      stabilizeGovernment(state, "solaris", "norvia"),
    ).toThrow(InsufficientActionPointsError);
  });

  it("65. atomic failure preserves original state", () => {
    const state = validState();
    const snapshot = JSON.parse(JSON.stringify(state));
    try {
      stabilizeGovernment(state, "solaris", "solaris");
    } catch {
      // expected
    }
    expect(state).toEqual(snapshot);
  });
});

describe("EVENT TESTS", () => {
  it("GameEvent contains political-influence-cultivated", () => {
    const state = validState();
    const { event } = cultivatePoliticalInfluence(state, "solaris", "norvia");
    expect(event.type).toBe("political-influence-cultivated");
  });

  it("GameEvent contains diplomatic-outreach-conducted", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "dravos", 30);
    const { event } = conductDiplomaticOutreach(state, "solaris", "dravos");
    expect(event.type).toBe("diplomatic-outreach-conducted");
  });

  it("GameEvent contains government-stabilized", () => {
    const state = validState();
    const { event } = stabilizeGovernment(state, "solaris", "norvia");
    expect(event.type).toBe("government-stabilized");
  });

  it("repeated cultivate produces deeply equal events from equal states", () => {
    const a = createInitialGameState();
    const b = createInitialGameState();
    const eventA = cultivatePoliticalInfluence(a, "solaris", "norvia").event;
    const eventB = cultivatePoliticalInfluence(b, "solaris", "norvia").event;
    expect(eventA).toEqual(eventB);
  });

  it("repeated outreach produces deeply equal events from equal states", () => {
    const a = createInitialGameState();
    const b = createInitialGameState();
    const eventA = conductDiplomaticOutreach(
      { ...a, world: { ...a.world, nationInfluence: a.world.nationInfluence.map((e) => e.influencerNationId === "solaris" && e.targetNationId === "dravos" ? { ...e, value: 30 } : e) } },
      "solaris",
      "dravos",
    ).event;
    const eventB = conductDiplomaticOutreach(
      { ...b, world: { ...b.world, nationInfluence: b.world.nationInfluence.map((e) => e.influencerNationId === "solaris" && e.targetNationId === "dravos" ? { ...e, value: 30 } : e) } },
      "solaris",
      "dravos",
    ).event;
    expect(eventA).toEqual(eventB);
  });

  it("repeated stabilize produces deeply equal events from equal states", () => {
    const a = createInitialGameState();
    const b = createInitialGameState();
    const eventA = stabilizeGovernment(a, "solaris", "norvia").event;
    const eventB = stabilizeGovernment(b, "solaris", "norvia").event;
    expect(eventA).toEqual(eventB);
  });
});

describe("INTEGRATION SCENARIO", () => {
  it("political vertical slice: Solaris/Norvia", () => {
    let state = validState();

    // 1. cultivatePoliticalInfluence
    const r1 = cultivatePoliticalInfluence(state, "solaris", "norvia");
    state = r1.state;
    expect(getNationInfluence(state.world, "solaris", "norvia").value).toBe(52);
    expect(state.planning.actionPoints.find((a) => a.nationId === "solaris")!.remaining).toBe(4);

    // 2. stabilizeGovernment
    const r2 = stabilizeGovernment(state, "solaris", "norvia");
    state = r2.state;
    expect(getNationStrategicStats(state.world, "norvia").stability).toBe(63);
    expect(state.planning.actionPoints.find((a) => a.nationId === "solaris")!.remaining).toBe(2);

    // 3. another cultivatePoliticalInfluence
    const r3 = cultivatePoliticalInfluence(state, "solaris", "norvia");
    state = r3.state;
    expect(getNationInfluence(state.world, "solaris", "norvia").value).toBe(62);
    expect(state.planning.actionPoints.find((a) => a.nationId === "solaris")!.remaining).toBe(0);

    // 4. another operation must fail
    expect(() => cultivatePoliticalInfluence(state, "solaris", "norvia")).toThrow(
      InsufficientActionPointsError,
    );
    expect(() => stabilizeGovernment(state, "solaris", "norvia")).toThrow(
      InsufficientActionPointsError,
    );
    state = setNationInfluence(state, "solaris", "dravos", 30);
    expect(() => conductDiplomaticOutreach(state, "solaris", "dravos")).toThrow(
      InsufficientActionPointsError,
    );

    // 5. resolveTurn
    const { state: next } = resolveTurn(state, []);
    expect(next.turn).toBe(state.turn + 1);
    expect(next.planning.actionPoints.find((a) => a.nationId === "solaris")!.remaining).toBe(6);
    expect(getNationInfluence(next.world, "solaris", "norvia").value).toBe(62);
    expect(getNationStrategicStats(next.world, "norvia").stability).toBe(63);
    expect(getDiplomaticRelationship(next.world, "solaris", "norvia").status).toBe("friendly");
    expect(() => validateGameState(next)).not.toThrow();
  });
});

describe("DIPLOMATIC OUTREACH INTEGRATION", () => {
  it("Solaris/Dravos hostile -> neutral -> friendly", () => {
    let state = validState();
    state = setNationInfluence(state, "solaris", "dravos", 30);

    // 1. hostile -> neutral
    const r1 = conductDiplomaticOutreach(state, "solaris", "dravos");
    state = r1.state;
    expect(getDiplomaticRelationship(state.world, "solaris", "dravos").status).toBe("neutral");

    // 2. resolveTurn to reset AP
    const { state: next1 } = resolveTurn(state, []);
    state = next1;

    // 3. neutral -> friendly
    const r2 = conductDiplomaticOutreach(state, "solaris", "dravos");
    state = r2.state;
    expect(getDiplomaticRelationship(state.world, "solaris", "dravos").status).toBe("friendly");
  });
});

describe("EXISTING SYSTEM REGRESSION", () => {
  it("TurnOrder pass-only contract", () => {
    const state = validState();
    const { result } = resolveTurn(state, []);
    expect(result.processedOrderIds).toEqual([]);
  });

  it("AP reset after political operations", () => {
    let state = validState();
    state = cultivatePoliticalInfluence(state, "solaris", "norvia").state;
    const { state: next } = resolveTurn(state, []);
    expect(next.planning.actionPoints.find((a) => a.nationId === "solaris")!.remaining).toBe(6);
  });

  it("GameEvent / OperationResult", () => {
    const state = validState();
    const result = cultivatePoliticalInfluence(state, "solaris", "norvia");
    expect(result).toHaveProperty("state");
    expect(result).toHaveProperty("event");
    expect(result.event.type).toBe("political-influence-cultivated");
  });

  it("intelligence operations still work", () => {
    const state = validState();
    expect(state.intelligence).toBeDefined();
    expect(state.intelligence.networks).toHaveLength(30);
  });

  it("NationStrategicStats preserved after political ops", () => {
    const state = validState();
    const { state: next } = cultivatePoliticalInfluence(state, "solaris", "norvia");
    expect(next.world.nationStrategicStats).toHaveLength(6);
  });

  it("NationInfluence directionality preserved", () => {
    const state = validState();
    const { state: next } = cultivatePoliticalInfluence(state, "solaris", "norvia");
    const sn = getNationInfluence(next.world, "solaris", "norvia").value;
    const ns = getNationInfluence(next.world, "norvia", "solaris").value;
    expect(sn).toBe(52);
    expect(ns).toBe(40);
  });

  it("bilateral diplomacy preserved", () => {
    const state = validState();
    const { state: next } = cultivatePoliticalInfluence(state, "solaris", "dravos");
    const rel1 = getDiplomaticRelationship(next.world, "solaris", "dravos");
    const rel2 = getDiplomaticRelationship(next.world, "dravos", "solaris");
    expect(rel1).toBe(rel2);
  });
});
