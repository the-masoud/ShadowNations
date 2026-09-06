import { describe, it, expect } from "vitest";
import {
  validateGameState,
  GameStateValidationError,
} from "../../src/core/simulation/validateGameState";
import { setRegionOwner } from "../../src/core/simulation/setRegionOwner";
import {
  resolveTurn,
} from "../../src/core/simulation/resolveTurn";
import { createInitialGameState } from "../../src/core/model/gameState";
import type { GameState } from "../../src/core/model/gameState";
import {
  UnknownRegionError,
  StrategicMapValidationError,
} from "../../src/core/model/strategicMap";
import { UnknownNationError, WorldValidationError } from "../../src/core/model/worldState";
import {
  OwnershipValidationError,
} from "../../src/core/model/regionOwnership";
import type { TurnOrder } from "../../src/core/model/turnOrder";

function validState(): GameState {
  return createInitialGameState();
}

function passOrder(id: string, nationId = "solaris"): TurnOrder {
  return { id, nationId, kind: "pass" };
}

describe("validateGameState", () => {
  it("1. canonical initial GameState passes validation", () => {
    const state = validState();
    expect(() => validateGameState(state)).not.toThrow();
  });

  it("2. repeated initial states remain deterministic", () => {
    const a = validState();
    const b = validState();
    expect(a).toEqual(b);
    expect(() => validateGameState(a)).not.toThrow();
    expect(() => validateGameState(b)).not.toThrow();
  });

  it("3. turn 0 fails", () => {
    const state = { ...validState(), turn: 0 };
    expect(() => validateGameState(state)).toThrow(GameStateValidationError);
    expect(() => validateGameState(state)).toThrow(
      "Invalid turn: expected >= 1, got 0",
    );
  });

  it("4. negative turn fails", () => {
    const state = { ...validState(), turn: -5 };
    expect(() => validateGameState(state)).toThrow(GameStateValidationError);
    expect(() => validateGameState(state)).toThrow(
      "Invalid turn: expected >= 1, got -5",
    );
  });

  it("5. fractional turn fails", () => {
    const state = { ...validState(), turn: 1.5 };
    expect(() => validateGameState(state)).toThrow(GameStateValidationError);
    expect(() => validateGameState(state)).toThrow(
      "Invalid turn: expected integer, got 1.5",
    );
  });

  it("6. invalid runtime phase fails", () => {
    const state = { ...validState(), phase: "whatever" as never };
    expect(() => validateGameState(state)).toThrow(GameStateValidationError);
    expect(() => validateGameState(state)).toThrow(
      'Invalid phase: expected "planning" or "resolution", got "whatever"',
    );
  });

  it("7. empty playerNationId fails", () => {
    const state = { ...validState(), playerNationId: "" };
    expect(() => validateGameState(state)).toThrow(GameStateValidationError);
    expect(() => validateGameState(state)).toThrow("Empty playerNationId");
  });

  it("8. unknown player nation fails", () => {
    const state = { ...validState(), playerNationId: "nonexistent" };
    expect(() => validateGameState(state)).toThrow(UnknownNationError);
    expect(() => validateGameState(state)).toThrow(
      'Unknown nation: "nonexistent"',
    );
  });

  it("9. invalid nation collection fails", () => {
    const state = validState();
    const badWorld = {
      ...state.world,
      nations: [
        ...state.world.nations,
        { id: "dup", name: "Dup", code: "DUP" },
        { id: "dup", name: "Dup2", code: "DP2" },
      ],
    };
    expect(() =>
      validateGameState({ ...state, world: badWorld }),
    ).toThrow(WorldValidationError);
  });

  it("10. invalid StrategicMap fails", () => {
    const state = validState();
    const badMap = { regions: [], connections: [] };
    expect(() =>
      validateGameState({ ...state, world: { ...state.world, map: badMap } }),
    ).toThrow(StrategicMapValidationError);
  });

  it("11. invalid RegionOwnership fails", () => {
    const state = validState();
    const badOwnership = [
      { regionId: "sunreach", ownerNationId: "solaris" },
      { regionId: "sunreach", ownerNationId: "dravos" },
    ];
    expect(() =>
      validateGameState({
        ...state,
        world: { ...state.world, regionOwnership: badOwnership },
      }),
    ).toThrow(OwnershipValidationError);
  });
});

describe("setRegionOwner", () => {
  it("12. Solaris initially owns sunreach", () => {
    const state = validState();
    const owner = state.world.regionOwnership.find(
      (o) => o.regionId === "sunreach",
    );
    expect(owner?.ownerNationId).toBe("solaris");
  });

  it("13. sunreach can structurally change Solaris -> Dravos", () => {
    const state = validState();
    const next = setRegionOwner(state, "sunreach", "dravos");
    const owner = next.world.regionOwnership.find(
      (o) => o.regionId === "sunreach",
    );
    expect(owner?.ownerNationId).toBe("dravos");
  });

  it("14. changed owner lookup returns Dravos", () => {
    const state = validState();
    const next = setRegionOwner(state, "sunreach", "dravos");
    const owner = next.world.regionOwnership.find(
      (o) => o.regionId === "sunreach",
    );
    expect(owner?.ownerNationId).toBe("dravos");
  });

  it("15. original GameState is unchanged", () => {
    const state = validState();
    const snapshot = JSON.parse(JSON.stringify(state));
    setRegionOwner(state, "sunreach", "dravos");
    expect(state).toEqual(snapshot);
  });

  it("16. original WorldState is unchanged", () => {
    const state = validState();
    const worldSnapshot = JSON.parse(JSON.stringify(state.world));
    setRegionOwner(state, "sunreach", "dravos");
    expect(state.world).toEqual(worldSnapshot);
  });

  it("17. original ownership array is unchanged", () => {
    const state = validState();
    const ownershipSnapshot = JSON.parse(
      JSON.stringify(state.world.regionOwnership),
    );
    setRegionOwner(state, "sunreach", "dravos");
    expect(state.world.regionOwnership).toEqual(ownershipSnapshot);
  });

  it("18. canonical ownership order is preserved", () => {
    const state = validState();
    const next = setRegionOwner(state, "sunreach", "dravos");
    const ids = next.world.regionOwnership.map((o) => o.regionId);
    expect(ids).toEqual(state.world.regionOwnership.map((o) => o.regionId));
  });

  it("19. other ownership entries remain unchanged", () => {
    const state = validState();
    const next = setRegionOwner(state, "sunreach", "dravos");
    for (const entry of state.world.regionOwnership) {
      if (entry.regionId === "sunreach") continue;
      const nextEntry = next.world.regionOwnership.find(
        (o) => o.regionId === entry.regionId,
      );
      expect(nextEntry?.ownerNationId).toBe(entry.ownerNationId);
    }
  });

  it("20. turn remains unchanged", () => {
    const state = validState();
    const next = setRegionOwner(state, "sunreach", "dravos");
    expect(next.turn).toBe(state.turn);
  });

  it("21. phase remains unchanged", () => {
    const state = validState();
    const next = setRegionOwner(state, "sunreach", "dravos");
    expect(next.phase).toBe(state.phase);
  });

  it("22. playerNationId remains unchanged", () => {
    const state = validState();
    const next = setRegionOwner(state, "sunreach", "dravos");
    expect(next.playerNationId).toBe(state.playerNationId);
  });

  it("23. nations reference is preserved", () => {
    const state = validState();
    const next = setRegionOwner(state, "sunreach", "dravos");
    expect(next.world.nations).toBe(state.world.nations);
  });

  it("24. StrategicMap reference is preserved", () => {
    const state = validState();
    const next = setRegionOwner(state, "sunreach", "dravos");
    expect(next.world.map).toBe(state.world.map);
  });

  it("25. changed GameState is a new reference", () => {
    const state = validState();
    const next = setRegionOwner(state, "sunreach", "dravos");
    expect(next).not.toBe(state);
  });

  it("26. changed WorldState is a new reference", () => {
    const state = validState();
    const next = setRegionOwner(state, "sunreach", "dravos");
    expect(next.world).not.toBe(state.world);
  });

  it("27. changed ownership array is a new reference", () => {
    const state = validState();
    const next = setRegionOwner(state, "sunreach", "dravos");
    expect(next.world.regionOwnership).not.toBe(state.world.regionOwnership);
  });

  it("28. same-owner transition returns exact original GameState reference", () => {
    const state = validState();
    const next = setRegionOwner(state, "sunreach", "solaris");
    expect(next).toBe(state);
  });

  it("29. unknown region fails explicitly", () => {
    const state = validState();
    expect(() => setRegionOwner(state, "nonexistent", "dravos")).toThrow(
      UnknownRegionError,
    );
    expect(() => setRegionOwner(state, "nonexistent", "dravos")).toThrow(
      'Unknown region: "nonexistent"',
    );
  });

  it("30. unknown new owner nation fails explicitly", () => {
    const state = validState();
    expect(() => setRegionOwner(state, "sunreach", "nonexistent")).toThrow(
      UnknownNationError,
    );
    expect(() => setRegionOwner(state, "sunreach", "nonexistent")).toThrow(
      'Unknown nation: "nonexistent"',
    );
  });

  it("31. existing region with missing ownership fails explicitly", () => {
    const state = validState();
    const badState: GameState = {
      ...state,
      world: { ...state.world, regionOwnership: [] },
    };
    expect(() => setRegionOwner(badState, "sunreach", "dravos")).toThrow(
      OwnershipValidationError,
    );
  });

  it("32. invalid input GameState fails closed", () => {
    const badState = { ...validState(), turn: 0 };
    expect(() => setRegionOwner(badState, "sunreach", "dravos")).toThrow(
      GameStateValidationError,
    );
  });

  it("33. transitioned state passes validateGameState", () => {
    const state = validState();
    const next = setRegionOwner(state, "sunreach", "dravos");
    expect(() => validateGameState(next)).not.toThrow();
  });
});

describe("resolveTurn integrity", () => {
  it("34. resolveTurn still resolves valid canonical state", () => {
    const state = validState();
    const { state: next, result } = resolveTurn(state, [passOrder("o1")]);
    expect(next.turn).toBe(2);
    expect(result.processedOrderIds).toEqual(["o1"]);
  });

  it("35. resolveTurn rejects malformed GameState", () => {
    const badState = { ...validState(), turn: 0 };
    expect(() => resolveTurn(badState, [])).toThrow(GameStateValidationError);
  });

  it("36. resolveTurn still preserves ownership", () => {
    const state = validState();
    const { state: next } = resolveTurn(state, []);
    expect(next.world.regionOwnership).toEqual(state.world.regionOwnership);
  });

  it("37. resolveTurn still does not mutate world", () => {
    const state = validState();
    const worldSnapshot = JSON.parse(JSON.stringify(state.world));
    resolveTurn(state, []);
    expect(state.world).toEqual(worldSnapshot);
  });
});
