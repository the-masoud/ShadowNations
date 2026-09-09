import { describe, it, expect } from "vitest";
import { CITY_SECURITY_NORMALIZATION_STEP, normalizeCitySecurity } from "../../src/core/simulation/normalizeCitySecurity.js";
import { CANONICAL_CITIES } from "../../src/core/model/city.js";
import { createInitialGameState } from "../../src/core/model/gameState.js";
import { setCitySecurity } from "../../src/core/simulation/setCitySecurity.js";
import { resolveTurn } from "../../src/core/simulation/resolveTurn.js";
import { resolveCampaignTurn } from "../../src/core/simulation/resolveCampaignTurn.js";
import type { GameState } from "../../src/core/model/gameState.js";

describe("normalizeCitySecurity", () => {
  it("1: CITY_SECURITY_NORMALIZATION_STEP equals 10", () => {
    expect(CITY_SECURITY_NORMALIZATION_STEP).toBe(10);
  });

  it("2: initial canonical GameState normalization returns zero events", () => {
    const state = createInitialGameState();
    const { events } = normalizeCitySecurity(state);
    expect(events).toHaveLength(0);
  });

  it("3: initial canonical normalization returns exact same state reference", () => {
    const state = createInitialGameState();
    const { state: newState, events } = normalizeCitySecurity(state);
    expect(newState).toBe(state);
    expect(events).toHaveLength(0);
  });

  it("4: below base by more than 10 increases exactly 10", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 30);
    const { state: newState, events } = normalizeCitySecurity(state);
    expect(events).toHaveLength(1);
    expect(events[0].previousSecurity).toBe(30);
    expect(events[0].newSecurity).toBe(40);
    expect(events[0].baseSecurity).toBe(65);
    const security = newState.world.citySecurity.find((s) => s.cityId === "solara");
    expect(security!.value).toBe(40);
  });

  it("5: above base by more than 10 decreases exactly 10", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 100);
    const { state: newState, events } = normalizeCitySecurity(state);
    expect(events).toHaveLength(1);
    expect(events[0].previousSecurity).toBe(100);
    expect(events[0].newSecurity).toBe(90);
    expect(events[0].baseSecurity).toBe(65);
    const security = newState.world.citySecurity.find((s) => s.cityId === "solara");
    expect(security!.value).toBe(90);
  });

  it("6: below base by less than 10 snaps exactly to base", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 60);
    const { state: newState, events } = normalizeCitySecurity(state);
    expect(events).toHaveLength(1);
    expect(events[0].previousSecurity).toBe(60);
    expect(events[0].newSecurity).toBe(65);
    expect(events[0].baseSecurity).toBe(65);
    const security = newState.world.citySecurity.find((s) => s.cityId === "solara");
    expect(security!.value).toBe(65);
  });

  it("7: above base by less than 10 snaps exactly to base", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "kragen", 95);
    const { state: newState, events } = normalizeCitySecurity(state);
    expect(events).toHaveLength(1);
    expect(events[0].previousSecurity).toBe(95);
    expect(events[0].newSecurity).toBe(90);
    expect(events[0].baseSecurity).toBe(90);
    const security = newState.world.citySecurity.find((s) => s.cityId === "kragen");
    expect(security!.value).toBe(90);
  });

  it("8: current exactly at base remains unchanged", () => {
    const state = createInitialGameState();
    const { state: newState, events } = normalizeCitySecurity(state);
    expect(events).toHaveLength(0);
    expect(newState).toBe(state);
  });

  it("9: normalization from below never crosses base", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 60);
    const { state: newState } = normalizeCitySecurity(state);
    const security = newState.world.citySecurity.find((s) => s.cityId === "solara");
    expect(security!.value).toBeLessThanOrEqual(65);
  });

  it("10: normalization from above never crosses base", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "kragen", 95);
    const { state: newState } = normalizeCitySecurity(state);
    const security = newState.world.citySecurity.find((s) => s.cityId === "kragen");
    expect(security!.value).toBeGreaterThanOrEqual(90);
  });

  it("11: value 0 moves correctly toward base", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "eirholm", 0);
    const { events } = normalizeCitySecurity(state);
    expect(events).toHaveLength(1);
    expect(events[0].previousSecurity).toBe(0);
    expect(events[0].newSecurity).toBe(10);
    expect(events[0].baseSecurity).toBe(40);
  });

  it("12: value 100 moves correctly toward base", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "kragen", 100);
    const { events } = normalizeCitySecurity(state);
    expect(events).toHaveLength(1);
    expect(events[0].previousSecurity).toBe(100);
    expect(events[0].newSecurity).toBe(90);
    expect(events[0].baseSecurity).toBe(90);
  });

  it("13: one changed City emits exactly one event", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 30);
    const { events } = normalizeCitySecurity(state);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("city-security-normalized");
    expect(events[0].cityId).toBe("solara");
  });

  it("14: event exact type is city-security-normalized", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 30);
    const { events } = normalizeCitySecurity(state);
    expect(events[0].type).toBe("city-security-normalized");
  });

  it("15: event exact fields: turn, cityId, previousSecurity, newSecurity, baseSecurity", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 30);
    const { events } = normalizeCitySecurity(state);
    const e = events[0];
    expect(typeof e.turn).toBe("number");
    expect(typeof e.cityId).toBe("string");
    expect(typeof e.previousSecurity).toBe("number");
    expect(typeof e.newSecurity).toBe("number");
    expect(typeof e.baseSecurity).toBe("number");
    expect(e.cityId).toBe("solara");
    expect(e.previousSecurity).toBe(30);
    expect(e.newSecurity).toBe(40);
    expect(e.baseSecurity).toBe(65);
  });

  it("16: direct normalizeCitySecurity event.turn equals input state.turn", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 30);
    const turn = state.turn;
    const { events } = normalizeCitySecurity(state);
    expect(events[0].turn).toBe(turn);
  });

  it("17: unchanged Cities emit no events", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 30);
    const { events } = normalizeCitySecurity(state);
    expect(events).toHaveLength(1);
    expect(events[0].cityId).toBe("solara");
  });

  it("18: multiple changed Cities all normalize in one call", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 30);
    state = setCitySecurity(state, "kragen", 70);
    state = setCitySecurity(state, "eirholm", 0);
    const { state: newState, events } = normalizeCitySecurity(state);
    expect(events).toHaveLength(3);
    const security = newState.world.citySecurity;
    expect(security.find((s) => s.cityId === "solara")!.value).toBe(40);
    expect(security.find((s) => s.cityId === "kragen")!.value).toBe(80);
    expect(security.find((s) => s.cityId === "eirholm")!.value).toBe(10);
  });

  it("19: multiple events follow CANONICAL_CITIES order", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 30);
    state = setCitySecurity(state, "kragen", 70);
    state = setCitySecurity(state, "eirholm", 0);
    const { events } = normalizeCitySecurity(state);
    const cityIds = events.map((e) => e.cityId);
    const expectedOrder = CANONICAL_CITIES
      .filter((c) => ["solara", "kragen", "eirholm"].includes(c.id))
      .map((c) => c.id);
    expect(cityIds).toEqual(expectedOrder);
  });

  it("20: event canonical order remains correct even if world.citySecurity array is deliberately reordered while still valid", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 30);
    state = setCitySecurity(state, "kragen", 70);
    state = setCitySecurity(state, "eirholm", 0);
    const reorderedSecurity = [
      state.world.citySecurity.find((s) => s.cityId === "eirholm")!,
      state.world.citySecurity.find((s) => s.cityId === "solara")!,
      state.world.citySecurity.find((s) => s.cityId === "kragen")!,
      ...state.world.citySecurity.filter((s) => !["solara", "kragen", "eirholm"].includes(s.cityId)),
    ];
    const reorderedState: GameState = {
      ...state,
      world: { ...state.world, citySecurity: reorderedSecurity },
    };
    const { events } = normalizeCitySecurity(reorderedState);
    const cityIds = events.map((e) => e.cityId);
    const expectedOrder = CANONICAL_CITIES
      .filter((c) => ["solara", "kragen", "eirholm"].includes(c.id))
      .map((c) => c.id);
    expect(cityIds).toEqual(expectedOrder);
  });

  it("21: unrelated City Security values remain unchanged", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 30);
    const originalHelion = state.world.citySecurity.find((s) => s.cityId === "helion")!.value;
    const { state: newState } = normalizeCitySecurity(state);
    const helion = newState.world.citySecurity.find((s) => s.cityId === "helion")!.value;
    expect(helion).toBe(originalHelion);
  });

  it("22: normalization does not mutate input state", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 30);
    const originalValue = state.world.citySecurity.find((s) => s.cityId === "solara")!.value;
    normalizeCitySecurity(state);
    const currentValue = state.world.citySecurity.find((s) => s.cityId === "solara")!.value;
    expect(currentValue).toBe(originalValue);
  });

  it("23: changed normalization returns new state/world/citySecurity array", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 30);
    const { state: newState } = normalizeCitySecurity(state);
    expect(newState).not.toBe(state);
    expect(newState.world).not.toBe(state.world);
    expect(newState.world.citySecurity).not.toBe(state.world.citySecurity);
  });

  it("24: deterministic equal inputs produce deeply equal state/events", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 30);
    const a = normalizeCitySecurity(state);
    const b = normalizeCitySecurity(state);
    expect(a.state).toEqual(b.state);
    expect(a.events).toEqual(b.events);
    expect(a.state).not.toBe(b.state);
    expect(a.events).not.toBe(b.events);
  });

  it("25: direct resolveTurn remains normalization-free even when City Security is away from base", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 30);
    const originalValue = state.world.citySecurity.find((s) => s.cityId === "solara")!.value;
    const { state: nextState, result } = resolveTurn(state, []);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].type).toBe("turn-advanced");
    expect(nextState.world.citySecurity.find((s) => s.cityId === "solara")!.value).toBe(originalValue);
  });

  it("26: resolveCampaignTurn on non-crisis turn performs normalization", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 30);
    const { state: newState, result } = resolveCampaignTurn(state, []);
    expect(result.events[0].type).toBe("turn-advanced");
    expect(result.events[1].type).toBe("city-security-normalized");
    const normEvent = result.events[1] as { cityId: string };
    expect(normEvent.cityId).toBe("solara");
    expect(newState.world.citySecurity.find((s) => s.cityId === "solara")!.value).toBe(40);
  });

  it("27: non-crisis event order is exactly: turn-advanced then city-security-normalized event(s)", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 30);
    state = setCitySecurity(state, "kragen", 70);
    const { result } = resolveCampaignTurn(state, []);
    const types = result.events.map((e) => e.type);
    expect(types).toEqual(["turn-advanced", "city-security-normalized", "city-security-normalized"]);
  });

  it("28: normalization event emitted by resolveCampaignTurn uses nextTurn", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 30);
    const { result } = resolveCampaignTurn(state, []);
    const normEvent = result.events.find((e) => e.type === "city-security-normalized") as { turn: number } | undefined;
    expect(normEvent!.turn).toBe(state.turn + 1);
  });

  it("29: crisis-turn event order is exactly: turn-advanced then normalization event(s) then campaign-crisis-triggered", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 30);
    state = setCitySecurity(state, "kragen", 70);
    state = { ...state, turn: 2 };
    const { state: newStateAfter, result } = resolveCampaignTurn(state, []);
    const types = result.events.map((e) => e.type);
    expect(types).toEqual(["turn-advanced", "city-security-normalized", "city-security-normalized", "campaign-crisis-triggered"]);
    const crisisEvent = result.events.find((e) => e.type === "campaign-crisis-triggered");
    expect(crisisEvent).toBeDefined();
    expect(crisisEvent!.strategicStat).toBe("stability");
    const stability = newStateAfter.world.nationStrategicStats.find((s) => s.nationId === state.playerNationId)!.stability;
    expect(stability).toBeLessThan(72);
  });

  it("30: repeated resolveCampaignTurn calls converge by exactly 10 per turn and stop emitting normalization events after reaching base", () => {
    let state = createInitialGameState();
    state = setCitySecurity(state, "solara", 0);
    let eventsEmitted = 0;
    for (let turn = 1; turn <= 10; turn++) {
      state = { ...state, turn };
      const { state: newState, result } = resolveCampaignTurn(state, []);
      const normEvents = result.events.filter((e) => e.type === "city-security-normalized");
      eventsEmitted += normEvents.length;
      state = newState;
    }
    const finalSecurity = state.world.citySecurity.find((s) => s.cityId === "solara")!.value;
    expect(finalSecurity).toBe(65);
    expect(eventsEmitted).toBe(7);
  });
});