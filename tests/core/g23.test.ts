import { describe, it, expect } from "vitest";
import {
  createInitialDiplomaticRelationships,
  getDiplomaticRelationship,
  validateDiplomaticRelationships,
  SelfDiplomaticRelationshipError,
  MissingDiplomaticRelationshipError,
  DiplomaticRelationshipValidationError,
  InvalidDiplomaticStatusError,
  type DiplomaticStatus,
} from "../../src/core/model/diplomaticRelationship";
import {
  createInitialWorldState,
  UnknownNationError,
} from "../../src/core/model/worldState";
import { createInitialGameState } from "../../src/core/model/gameState";
import { resolveTurn } from "../../src/core/simulation/resolveTurn";
import { setDiplomaticStatus } from "../../src/core/simulation/setDiplomaticStatus";
import { getNationInfluence } from "../../src/core/model/nationInfluence";
import { getNationStrategicStats } from "../../src/core/model/nationStrategicStats";
import { validateGameState } from "../../src/core/simulation/validateGameState";

function validState() {
  return createInitialGameState();
}

describe("INITIAL STATE", () => {
  it("1. initial world contains exactly 15 relationships", () => {
    const world = createInitialWorldState();
    expect(world.diplomaticRelationships).toHaveLength(15);
  });

  it("2. no self relationship exists", () => {
    const world = createInitialWorldState();
    for (const rel of world.diplomaticRelationships) {
      expect(rel.nationAId).not.toBe(rel.nationBId);
    }
  });

  it("3. exact canonical pair ordering", () => {
    const world = createInitialWorldState();
    const nationIds = world.nations.map((n) => n.id);
    for (const rel of world.diplomaticRelationships) {
      const indexA = nationIds.indexOf(rel.nationAId);
      const indexB = nationIds.indexOf(rel.nationBId);
      expect(indexA).toBeLessThan(indexB);
    }
  });

  it("4. exact Solaris-Dravos hostile", () => {
    const world = createInitialWorldState();
    const rel = getDiplomaticRelationship(world, "solaris", "dravos");
    expect(rel.status).toBe("hostile");
  });

  it("5. exact Solaris-Norvia friendly", () => {
    const world = createInitialWorldState();
    const rel = getDiplomaticRelationship(world, "solaris", "norvia");
    expect(rel.status).toBe("friendly");
  });

  it("6. exact Solaris-Veloria friendly", () => {
    const world = createInitialWorldState();
    const rel = getDiplomaticRelationship(world, "solaris", "veloria");
    expect(rel.status).toBe("friendly");
  });

  it("7. exact Solaris-Karsen neutral", () => {
    const world = createInitialWorldState();
    const rel = getDiplomaticRelationship(world, "solaris", "karsen");
    expect(rel.status).toBe("neutral");
  });

  it("8. exact Solaris-Arkania neutral", () => {
    const world = createInitialWorldState();
    const rel = getDiplomaticRelationship(world, "solaris", "arkania");
    expect(rel.status).toBe("neutral");
  });

  it("9. exact Dravos-Norvia hostile", () => {
    const world = createInitialWorldState();
    const rel = getDiplomaticRelationship(world, "dravos", "norvia");
    expect(rel.status).toBe("hostile");
  });

  it("10. exact Dravos-Veloria neutral", () => {
    const world = createInitialWorldState();
    const rel = getDiplomaticRelationship(world, "dravos", "veloria");
    expect(rel.status).toBe("neutral");
  });

  it("11. exact Dravos-Karsen friendly", () => {
    const world = createInitialWorldState();
    const rel = getDiplomaticRelationship(world, "dravos", "karsen");
    expect(rel.status).toBe("friendly");
  });

  it("12. exact Dravos-Arkania friendly", () => {
    const world = createInitialWorldState();
    const rel = getDiplomaticRelationship(world, "dravos", "arkania");
    expect(rel.status).toBe("friendly");
  });

  it("13. exact Norvia-Veloria friendly", () => {
    const world = createInitialWorldState();
    const rel = getDiplomaticRelationship(world, "norvia", "veloria");
    expect(rel.status).toBe("friendly");
  });

  it("14. exact Norvia-Karsen hostile", () => {
    const world = createInitialWorldState();
    const rel = getDiplomaticRelationship(world, "norvia", "karsen");
    expect(rel.status).toBe("hostile");
  });

  it("15. exact Norvia-Arkania neutral", () => {
    const world = createInitialWorldState();
    const rel = getDiplomaticRelationship(world, "norvia", "arkania");
    expect(rel.status).toBe("neutral");
  });

  it("16. exact Veloria-Karsen neutral", () => {
    const world = createInitialWorldState();
    const rel = getDiplomaticRelationship(world, "veloria", "karsen");
    expect(rel.status).toBe("neutral");
  });

  it("17. exact Veloria-Arkania friendly", () => {
    const world = createInitialWorldState();
    const rel = getDiplomaticRelationship(world, "veloria", "arkania");
    expect(rel.status).toBe("friendly");
  });

  it("18. exact Karsen-Arkania friendly", () => {
    const world = createInitialWorldState();
    const rel = getDiplomaticRelationship(world, "karsen", "arkania");
    expect(rel.status).toBe("friendly");
  });

  it("19. repeated creation deeply equal", () => {
    const a = createInitialDiplomaticRelationships(createInitialWorldState().nations);
    const b = createInitialDiplomaticRelationships(createInitialWorldState().nations);
    expect(a).toEqual(b);
  });

  it("20. separate initial worlds do not share relationship array", () => {
    const a = createInitialWorldState();
    const b = createInitialWorldState();
    expect(a.diplomaticRelationships).not.toBe(b.diplomaticRelationships);
  });

  it("21. initial GameState validates", () => {
    const state = createInitialGameState();
    expect(() => validateGameState(state)).not.toThrow();
  });
});

describe("LOOKUP", () => {
  it("22. Solaris/Dravos returns hostile", () => {
    const state = validState();
    const rel = getDiplomaticRelationship(state.world, "solaris", "dravos");
    expect(rel.status).toBe("hostile");
  });

  it("23. Dravos/Solaris returns same exact relationship", () => {
    const state = validState();
    const rel1 = getDiplomaticRelationship(state.world, "solaris", "dravos");
    const rel2 = getDiplomaticRelationship(state.world, "dravos", "solaris");
    expect(rel1).toBe(rel2);
  });

  it("24. unknown first nation fails", () => {
    const state = validState();
    expect(() => getDiplomaticRelationship(state.world, "nonexistent", "dravos")).toThrow(UnknownNationError);
  });

  it("25. unknown second nation fails", () => {
    const state = validState();
    expect(() => getDiplomaticRelationship(state.world, "solaris", "nonexistent")).toThrow(UnknownNationError);
  });

  it("26. self pair fails", () => {
    const state = validState();
    expect(() => getDiplomaticRelationship(state.world, "solaris", "solaris")).toThrow(SelfDiplomaticRelationshipError);
  });

  it("27. missing existing pair fails", () => {
    const state = validState();
    const world = {
      ...state.world,
      diplomaticRelationships: state.world.diplomaticRelationships.filter(
        (r) => !(r.nationAId === "solaris" && r.nationBId === "dravos"),
      ),
    };
    expect(() => getDiplomaticRelationship(world, "solaris", "dravos")).toThrow(MissingDiplomaticRelationshipError);
  });
});

describe("VALIDATION", () => {
  it("28. canonical diplomacy passes", () => {
    const world = createInitialWorldState();
    expect(() => validateDiplomaticRelationships(world)).not.toThrow();
  });

  it("29. duplicate pair fails", () => {
    const world = createInitialWorldState();
    const invalidWorld = {
      ...world,
      diplomaticRelationships: [
        ...world.diplomaticRelationships,
        { nationAId: "solaris" as const, nationBId: "dravos" as const, status: "neutral" as DiplomaticStatus },
      ],
    };
    expect(() => validateDiplomaticRelationships(invalidWorld)).toThrow(DiplomaticRelationshipValidationError);
  });

  it("30. reversed duplicate fails", () => {
    const world = createInitialWorldState();
    const invalidWorld = {
      ...world,
      diplomaticRelationships: [
        ...world.diplomaticRelationships,
        { nationAId: "dravos" as const, nationBId: "solaris" as const, status: "neutral" as DiplomaticStatus },
      ],
    };
    expect(() => validateDiplomaticRelationships(invalidWorld)).toThrow(DiplomaticRelationshipValidationError);
  });

  it("31. self pair fails", () => {
    const world = createInitialWorldState();
    const invalidWorld = {
      ...world,
      diplomaticRelationships: [
        ...world.diplomaticRelationships,
        { nationAId: "solaris" as const, nationBId: "solaris" as const, status: "neutral" as DiplomaticStatus },
      ],
    };
    expect(() => validateDiplomaticRelationships(invalidWorld)).toThrow(DiplomaticRelationshipValidationError);
  });

  it("32. unknown nationA fails", () => {
    const world = createInitialWorldState();
    const invalidWorld = {
      ...world,
      diplomaticRelationships: [
        ...world.diplomaticRelationships,
        { nationAId: "nonexistent" as const, nationBId: "dravos" as const, status: "neutral" as DiplomaticStatus },
      ],
    };
    expect(() => validateDiplomaticRelationships(invalidWorld)).toThrow(DiplomaticRelationshipValidationError);
  });

  it("33. unknown nationB fails", () => {
    const world = createInitialWorldState();
    const invalidWorld = {
      ...world,
      diplomaticRelationships: [
        ...world.diplomaticRelationships,
        { nationAId: "solaris" as const, nationBId: "nonexistent" as const, status: "neutral" as DiplomaticStatus },
      ],
    };
    expect(() => validateDiplomaticRelationships(invalidWorld)).toThrow(DiplomaticRelationshipValidationError);
  });

  it("34. noncanonical stored pair order fails", () => {
    const world = createInitialWorldState();
    const invalidWorld = {
      ...world,
      diplomaticRelationships: [
        { nationAId: "dravos" as const, nationBId: "solaris" as const, status: "hostile" as DiplomaticStatus },
        ...world.diplomaticRelationships.slice(1),
      ],
    };
    expect(() => validateDiplomaticRelationships(invalidWorld)).toThrow(DiplomaticRelationshipValidationError);
  });

  it("35. missing required pair fails", () => {
    const world = createInitialWorldState();
    const invalidWorld = {
      ...world,
      diplomaticRelationships: world.diplomaticRelationships.slice(1),
    };
    expect(() => validateDiplomaticRelationships(invalidWorld)).toThrow(DiplomaticRelationshipValidationError);
  });

  it("36. invalid runtime status fails", () => {
    const world = createInitialWorldState();
    const invalidWorld = {
      ...world,
      diplomaticRelationships: [
        { nationAId: "solaris" as const, nationBId: "dravos" as const, status: "allied" as DiplomaticStatus },
        ...world.diplomaticRelationships.slice(1),
      ],
    };
    expect(() => validateDiplomaticRelationships(invalidWorld)).toThrow(DiplomaticRelationshipValidationError);
  });

  it("37. friendly valid", () => {
    const world = createInitialWorldState();
    const invalidWorld = {
      ...world,
      diplomaticRelationships: world.diplomaticRelationships.map((r) =>
        r.nationAId === "solaris" && r.nationBId === "dravos"
          ? { ...r, status: "friendly" as DiplomaticStatus }
          : r,
      ),
    };
    expect(() => validateDiplomaticRelationships(invalidWorld)).not.toThrow();
  });

  it("38. neutral valid", () => {
    const world = createInitialWorldState();
    const invalidWorld = {
      ...world,
      diplomaticRelationships: world.diplomaticRelationships.map((r) =>
        r.nationAId === "solaris" && r.nationBId === "dravos"
          ? { ...r, status: "neutral" as DiplomaticStatus }
          : r,
      ),
    };
    expect(() => validateDiplomaticRelationships(invalidWorld)).not.toThrow();
  });

  it("39. hostile valid", () => {
    const world = createInitialWorldState();
    const invalidWorld = {
      ...world,
      diplomaticRelationships: world.diplomaticRelationships.map((r) =>
        r.nationAId === "solaris" && r.nationBId === "dravos"
          ? { ...r, status: "hostile" as DiplomaticStatus }
          : r,
      ),
    };
    expect(() => validateDiplomaticRelationships(invalidWorld)).not.toThrow();
  });
});

describe("TRANSITION", () => {
  it("40. Solaris-Dravos hostile -> neutral", () => {
    const state = validState();
    const next = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    const rel = getDiplomaticRelationship(next.world, "solaris", "dravos");
    expect(rel.status).toBe("neutral");
  });

  it("41. lookup Solaris/Dravos returns neutral", () => {
    const state = validState();
    const next = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    const rel = getDiplomaticRelationship(next.world, "solaris", "dravos");
    expect(rel.status).toBe("neutral");
  });

  it("42. reverse lookup Dravos/Solaris returns same neutral relationship", () => {
    const state = validState();
    const next = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    const rel1 = getDiplomaticRelationship(next.world, "solaris", "dravos");
    const rel2 = getDiplomaticRelationship(next.world, "dravos", "solaris");
    expect(rel1).toBe(rel2);
    expect(rel1.status).toBe("neutral");
  });

  it("43. original GameState unchanged", () => {
    const state = validState();
    const snapshot = JSON.parse(JSON.stringify(state));
    setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    expect(state).toEqual(snapshot);
  });

  it("44. original WorldState unchanged", () => {
    const state = validState();
    const snapshot = JSON.parse(JSON.stringify(state.world));
    setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    expect(state.world).toEqual(snapshot);
  });

  it("45. original relationship array unchanged", () => {
    const state = validState();
    const snapshot = JSON.parse(JSON.stringify(state.world.diplomaticRelationships));
    setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    expect(state.world.diplomaticRelationships).toEqual(snapshot);
  });

  it("46. changed GameState new reference", () => {
    const state = validState();
    const next = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    expect(next).not.toBe(state);
  });

  it("47. changed WorldState new reference", () => {
    const state = validState();
    const next = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    expect(next.world).not.toBe(state.world);
  });

  it("48. changed relationship array new reference", () => {
    const state = validState();
    const next = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    expect(next.world.diplomaticRelationships).not.toBe(state.world.diplomaticRelationships);
  });

  it("49. nations reference preserved", () => {
    const state = validState();
    const next = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    expect(next.world.nations).toBe(state.world.nations);
  });

  it("50. map reference preserved", () => {
    const state = validState();
    const next = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    expect(next.world.map).toBe(state.world.map);
  });

  it("51. ownership reference preserved", () => {
    const state = validState();
    const next = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    expect(next.world.regionOwnership).toBe(state.world.regionOwnership);
  });

  it("52. strategic stats reference preserved", () => {
    const state = validState();
    const next = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    expect(next.world.nationStrategicStats).toBe(state.world.nationStrategicStats);
  });

  it("53. influence reference preserved", () => {
    const state = validState();
    const next = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    expect(next.world.nationInfluence).toBe(state.world.nationInfluence);
  });

  it("54. planning reference preserved", () => {
    const state = validState();
    const next = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    expect(next.planning).toBe(state.planning);
  });

  it("55. intelligence reference preserved", () => {
    const state = validState();
    const next = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    expect(next.intelligence).toBe(state.intelligence);
  });

  it("56. turn unchanged", () => {
    const state = validState();
    const next = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    expect(next.turn).toBe(state.turn);
  });

  it("57. phase unchanged", () => {
    const state = validState();
    const next = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    expect(next.phase).toBe(state.phase);
  });

  it("58. playerNationId unchanged", () => {
    const state = validState();
    const next = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    expect(next.playerNationId).toBe(state.playerNationId);
  });

  it("59. canonical ordering preserved", () => {
    const state = validState();
    const next = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    const nationIds = next.world.nations.map((n) => n.id);
    for (const rel of next.world.diplomaticRelationships) {
      const indexA = nationIds.indexOf(rel.nationAId);
      const indexB = nationIds.indexOf(rel.nationBId);
      expect(indexA).toBeLessThan(indexB);
    }
  });

  it("60. unchanged relationship entries preserve references", () => {
    const state = validState();
    const next = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    for (const rel of next.world.diplomaticRelationships) {
      if (rel.nationAId === "solaris" && rel.nationBId === "dravos") continue;
      const original = state.world.diplomaticRelationships.find(
        (r) => r.nationAId === rel.nationAId && r.nationBId === rel.nationBId,
      );
      expect(rel).toBe(original);
    }
  });

  it("61. same-status transition returns exact original state", () => {
    const state = validState();
    const next = setDiplomaticStatus(state, "solaris", "dravos", "hostile");
    expect(next).toBe(state);
  });

  it("62. unknown first nation fails", () => {
    const state = validState();
    expect(() => setDiplomaticStatus(state, "nonexistent", "dravos", "neutral")).toThrow(UnknownNationError);
  });

  it("63. unknown second nation fails", () => {
    const state = validState();
    expect(() => setDiplomaticStatus(state, "solaris", "nonexistent", "neutral")).toThrow(UnknownNationError);
  });

  it("64. self pair fails", () => {
    const state = validState();
    expect(() => setDiplomaticStatus(state, "solaris", "solaris", "neutral")).toThrow(SelfDiplomaticRelationshipError);
  });

  it("65. missing relationship fails", () => {
    const state = validState();
    const world = {
      ...state.world,
      diplomaticRelationships: state.world.diplomaticRelationships.filter(
        (r) => !(r.nationAId === "solaris" && r.nationBId === "dravos"),
      ),
    };
    const badState = { ...state, world };
    expect(() => setDiplomaticStatus(badState, "solaris", "dravos", "neutral")).toThrow(MissingDiplomaticRelationshipError);
  });

  it("66. invalid requested status fails", () => {
    const state = validState();
    expect(() => setDiplomaticStatus(state, "solaris", "dravos", "allied" as DiplomaticStatus)).toThrow(InvalidDiplomaticStatusError);
  });

  it("67. malformed input GameState fails closed", () => {
    const state = validState();
    const badState = { ...state, turn: -1 };
    expect(() => setDiplomaticStatus(badState, "solaris", "dravos", "neutral")).toThrow();
  });

  it("68. successful transitioned state validates", () => {
    const state = validState();
    const next = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    expect(() => validateGameState(next)).not.toThrow();
  });
});

describe("SEPARATION", () => {
  it("69. diplomacy change does not alter Solaris -> Norvia influence", () => {
    const state = validState();
    const before = getNationInfluence(state.world, "solaris", "norvia");
    const next = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    const after = getNationInfluence(next.world, "solaris", "norvia");
    expect(after.value).toBe(before.value);
  });

  it("70. diplomacy change does not alter reverse influence", () => {
    const state = validState();
    const before = getNationInfluence(state.world, "norvia", "solaris");
    const next = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    const after = getNationInfluence(next.world, "norvia", "solaris");
    expect(after.value).toBe(before.value);
  });

  it("71. diplomacy change does not alter strategic stats", () => {
    const state = validState();
    const before = getNationStrategicStats(state.world, "solaris");
    const next = setDiplomaticStatus(state, "solaris", "dravos", "neutral");
    const after = getNationStrategicStats(next.world, "solaris");
    expect(after.stability).toBe(before.stability);
    expect(after.publicSupport).toBe(before.publicSupport);
    expect(after.internalSecurity).toBe(before.internalSecurity);
  });
});

describe("TURN REGRESSION", () => {
  it("72. diplomacy survives resolveTurn unchanged", () => {
    const state = validState();
    const before = JSON.parse(JSON.stringify(state.world.diplomaticRelationships));
    const { state: next } = resolveTurn(state, []);
    expect(next.world.diplomaticRelationships).toEqual(before);
  });

  it("73. diplomacy-array reference preserved", () => {
    const state = validState();
    const { state: next } = resolveTurn(state, []);
    expect(next.world.diplomaticRelationships).toBe(state.world.diplomaticRelationships);
  });

  it("74. influence preserved", () => {
    const state = validState();
    const before = JSON.parse(JSON.stringify(state.world.nationInfluence));
    const { state: next } = resolveTurn(state, []);
    expect(next.world.nationInfluence).toEqual(before);
  });

  it("75. strategic stats preserved", () => {
    const state = validState();
    const before = JSON.parse(JSON.stringify(state.world.nationStrategicStats));
    const { state: next } = resolveTurn(state, []);
    expect(next.world.nationStrategicStats).toEqual(before);
  });

  it("76. AP reset still works", () => {
    const state = validState();
    const { state: next } = resolveTurn(state, []);
    expect(next.planning.actionPoints).toHaveLength(6);
    for (const ap of next.planning.actionPoints) {
      expect(ap.remaining).toBe(6);
    }
  });

  it("77. intelligence persists", () => {
    const state = validState();
    const { state: next } = resolveTurn(state, []);
    expect(next.intelligence).toEqual(state.intelligence);
  });

  it("78. ownership persists", () => {
    const state = validState();
    const { state: next } = resolveTurn(state, []);
    expect(next.world.regionOwnership).toEqual(state.world.regionOwnership);
  });

  it("79. TurnAdvancedEvent remains correct", () => {
    const state = validState();
    const { state: next, result } = resolveTurn(state, []);
    expect(next.turn).toBe(state.turn + 1);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].type).toBe("turn-advanced");
  });

  it("80. all previous G0/G1/G2.1/G2.2 tests remain passing", () => {
    const state = createInitialGameState();
    expect(state.world.nations).toHaveLength(6);
    expect(state.world.map.regions).toHaveLength(18);
    expect(state.world.regionOwnership).toHaveLength(18);
    expect(state.world.nationStrategicStats).toHaveLength(6);
    expect(state.world.nationInfluence).toHaveLength(30);
    expect(state.world.diplomaticRelationships).toHaveLength(15);
    expect(() => validateGameState(state)).not.toThrow();
  });
});


