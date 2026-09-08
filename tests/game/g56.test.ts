import { describe, it, expect } from "vitest";
import { createInitialGameState } from "../../src/core/model/gameState.js";
import { createCampaignGameState } from "../../src/core/simulation/createCampaignGameState.js";
import { cultivatePoliticalInfluence } from "../../src/core/simulation/cultivatePoliticalInfluence.js";
import { resolveCampaignTurn } from "../../src/core/simulation/resolveCampaignTurn.js";
import { getNationActionPoints } from "../../src/core/model/actionPoints.js";
import {
  createCampaignTimeline,
  appendOperationTimelineEntry,
  appendTurnTimelineEntry,
} from "../../src/game/replay/campaignTimeline.js";
import {
  createTimelinePresentationModel,
} from "../../src/game/ui/timelinePresentation.js";

describe("campaignTimeline + timelinePresentation", () => {
  // A — initial timeline keys
  it("A: initial timeline keys", () => {
    const state = createInitialGameState();
    const timeline = createCampaignTimeline(state);
    expect(Object.keys(timeline)).toEqual(["entries"]);
    expect(timeline.entries.length).toBe(1);
  });

  // B — initial entry keys
  it("B: initial entry keys", () => {
    const state = createInitialGameState();
    const timeline = createCampaignTimeline(state);
    expect(Object.keys(timeline.entries[0])).toEqual([
      "sequence",
      "kind",
      "turn",
      "eventType",
      "state",
    ]);
  });

  // C — initial entry semantics
  it("C: initial entry semantics", () => {
    const state = createInitialGameState();
    const timeline = createCampaignTimeline(state);
    const entry = timeline.entries[0];
    expect(entry.sequence).toBe(1);
    expect(entry.kind).toBe("campaign-start");
    expect(entry.turn).toBe(1);
    expect(entry.eventType).toBeNull();
    expect(entry.state).toBe(state);
  });

  // D — real operation append
  it("D: real operation append", () => {
    const state = createInitialGameState();
    const result = cultivatePoliticalInfluence(
      state,
      "solaris",
      "dravos",
    );
    const timeline = createCampaignTimeline(state);
    const updated = appendOperationTimelineEntry(
      timeline,
      result.state,
      result.event,
    );
    expect(updated.entries.length).toBe(2);
    expect(updated.entries[1].sequence).toBe(2);
    expect(updated.entries[1].kind).toBe("operation");
    expect(updated.entries[1].turn).toBe(1);
    expect(updated.entries[1].eventType).toBe(
      "political-influence-cultivated",
    );
    expect(updated.entries[1].state).toBe(result.state);
  });

  // E — multiple operation sequencing
  it("E: multiple operation sequencing", () => {
    const state = createInitialGameState();
    const result1 = cultivatePoliticalInfluence(
      state,
      "solaris",
      "dravos",
    );
    const result2 = cultivatePoliticalInfluence(
      result1.state,
      "solaris",
      "norvia",
    );
    let timeline = createCampaignTimeline(state);
    timeline = appendOperationTimelineEntry(
      timeline,
      result1.state,
      result1.event,
    );
    timeline = appendOperationTimelineEntry(
      timeline,
      result2.state,
      result2.event,
    );
    expect(timeline.entries.map((e) => e.sequence)).toEqual([
      1, 2, 3,
    ]);
    const original = createCampaignTimeline(state);
    expect(original.entries.length).toBe(1);
  });

  // F — turn append
  it("F: turn append", () => {
    const { state: turn2State } = resolveCampaignTurn(
      createInitialGameState(),
      [],
    );
    const initial = createInitialGameState();
    const timeline = createCampaignTimeline(initial);
    const updated = appendTurnTimelineEntry(timeline, turn2State);
    expect(updated.entries.length).toBe(2);
    expect(updated.entries[1].sequence).toBe(2);
    expect(updated.entries[1].kind).toBe("turn");
    expect(updated.entries[1].turn).toBe(2);
    expect(updated.entries[1].eventType).toBeNull();
    expect(updated.entries[1].state).toBe(turn2State);
  });

  // G — append freshness
  it("G: append freshness", () => {
    const state = createInitialGameState();
    const result = cultivatePoliticalInfluence(
      state,
      "solaris",
      "dravos",
    );
    const oldTimeline = createCampaignTimeline(state);
    const newTimeline = appendOperationTimelineEntry(
      oldTimeline,
      result.state,
      result.event,
    );
    expect(newTimeline).not.toBe(oldTimeline);
    expect(newTimeline.entries).not.toBe(oldTimeline.entries);
    expect(newTimeline.entries[0]).toBe(oldTimeline.entries[0]);
    expect(oldTimeline.entries.length).toBe(1);
  });

  // H — historical snapshot preservation
  it("H: historical snapshot preservation", () => {
    const originalState = createInitialGameState();
    const timeline = createCampaignTimeline(originalState);
    const result = cultivatePoliticalInfluence(
      originalState,
      "solaris",
      "dravos",
    );
    const updated = appendOperationTimelineEntry(
      timeline,
      result.state,
      result.event,
    );
    expect(updated.entries[0].state).toBe(originalState);
    const originalAp = getNationActionPoints(
      originalState,
      "solaris",
    );
    expect(originalAp.remaining).toBe(6);
    const opAp = getNationActionPoints(
      result.state,
      "solaris",
    );
    expect(opAp.remaining).toBe(4);
  });

  // I — empty operation timeline
  it("I: empty operation timeline", () => {
    const state = createInitialGameState();
    expect(() =>
      appendOperationTimelineEntry(
        { entries: [] },
        state,
        {
          type: "political-influence-cultivated",
          turn: 1,
          actorNationId: "solaris",
          targetNationId: "dravos",
          previousInfluence: 0,
          newInfluence: 10,
          actionPointCost: 2,
        },
      ),
    ).toThrow("Campaign timeline must contain at least one entry.");
  });

  // J — empty turn timeline
  it("J: empty turn timeline", () => {
    const state = createInitialGameState();
    expect(() =>
      appendTurnTimelineEntry({ entries: [] }, state),
    ).toThrow("Campaign timeline must contain at least one entry.");
  });

  // K — presentation top-level keys
  it("K: presentation top-level keys", () => {
    const state = createInitialGameState();
    const timeline = createCampaignTimeline(state);
    const model = createTimelinePresentationModel(timeline, 0);
    expect(Object.keys(model)).toEqual([
      "selectedIndex",
      "entryCount",
      "canPrevious",
      "canNext",
      "entry",
    ]);
  });

  // L — presentation entry keys
  it("L: presentation entry keys", () => {
    const state = createInitialGameState();
    const timeline = createCampaignTimeline(state);
    const model = createTimelinePresentationModel(timeline, 0);
    expect(Object.keys(model.entry)).toEqual([
      "sequence",
      "kind",
      "kindLabel",
      "turn",
      "eventType",
      "eventLabel",
      "playerNationId",
      "playerNationName",
      "playerNationCode",
      "remainingActionPoints",
      "maximumActionPoints",
      "stability",
      "publicSupport",
      "internalSecurity",
    ]);
  });

  // M — initial presentation values
  it("M: initial presentation values", () => {
    const state = createInitialGameState();
    const timeline = createCampaignTimeline(state);
    const model = createTimelinePresentationModel(timeline, 0);
    expect(model.selectedIndex).toBe(0);
    expect(model.entryCount).toBe(1);
    expect(model.canPrevious).toBe(false);
    expect(model.canNext).toBe(false);
    expect(model.entry.kindLabel).toBe("CAMPAIGN START");
    expect(model.entry.eventLabel).toBe("NONE");
    expect(model.entry.turn).toBe(1);
    expect(model.entry.playerNationId).toBe("solaris");
    expect(model.entry.playerNationName).toBe("Solaris");
    expect(model.entry.playerNationCode).toBe("SOL");
    expect(model.entry.remainingActionPoints).toBe(6);
    expect(model.entry.maximumActionPoints).toBe(6);
    expect(model.entry.stability).toBe(72);
    expect(model.entry.publicSupport).toBe(68);
    expect(model.entry.internalSecurity).toBe(66);
  });

  // N — operation presentation
  it("N: operation presentation", () => {
    const state = createInitialGameState();
    const result = cultivatePoliticalInfluence(
      state,
      "solaris",
      "dravos",
    );
    const timeline = createCampaignTimeline(state);
    const updated = appendOperationTimelineEntry(
      timeline,
      result.state,
      result.event,
    );
    const model = createTimelinePresentationModel(updated, 1);
    expect(model.entry.kindLabel).toBe("OPERATION");
    expect(model.entry.eventLabel).toBe(
      "POLITICAL INFLUENCE CULTIVATED",
    );
    expect(model.entry.turn).toBe(1);
    expect(model.entry.remainingActionPoints).toBe(4);
    expect(model.entry.maximumActionPoints).toBe(6);
  });

  // O — turn presentation
  it("O: turn presentation", () => {
    const { state: turn2State } = resolveCampaignTurn(
      createInitialGameState(),
      [],
    );
    const initial = createInitialGameState();
    const timeline = createCampaignTimeline(initial);
    const updated = appendTurnTimelineEntry(timeline, turn2State);
    const model = createTimelinePresentationModel(updated, 1);
    expect(model.entry.kindLabel).toBe("TURN SNAPSHOT");
    expect(model.entry.eventLabel).toBe("NONE");
    expect(model.entry.turn).toBe(2);
    expect(model.entry.remainingActionPoints).toBe(6);
    expect(model.entry.maximumActionPoints).toBe(6);
  });

  // P — navigation flags
  it("P: navigation flags", () => {
    const state = createInitialGameState();
    const result1 = cultivatePoliticalInfluence(
      state,
      "solaris",
      "dravos",
    );
    const result2 = cultivatePoliticalInfluence(
      result1.state,
      "solaris",
      "norvia",
    );
    let timeline = createCampaignTimeline(state);
    timeline = appendOperationTimelineEntry(
      timeline,
      result1.state,
      result1.event,
    );
    timeline = appendOperationTimelineEntry(
      timeline,
      result2.state,
      result2.event,
    );
    const m0 = createTimelinePresentationModel(timeline, 0);
    expect(m0.canPrevious).toBe(false);
    expect(m0.canNext).toBe(true);
    const m1 = createTimelinePresentationModel(timeline, 1);
    expect(m1.canPrevious).toBe(true);
    expect(m1.canNext).toBe(true);
    const m2 = createTimelinePresentationModel(timeline, 2);
    expect(m2.canPrevious).toBe(true);
    expect(m2.canNext).toBe(false);
  });

  // Q — non-integer selected index
  it("Q: non-integer selected index", () => {
    const state = createInitialGameState();
    const timeline = createCampaignTimeline(state);
    expect(() =>
      createTimelinePresentationModel(timeline, 1.5),
    ).toThrow("Timeline selected index must be an integer.");
  });

  // R — negative selected index
  it("R: negative selected index", () => {
    const state = createInitialGameState();
    const timeline = createCampaignTimeline(state);
    expect(() =>
      createTimelinePresentationModel(timeline, -1),
    ).toThrow("Timeline selected index out of range: -1.");
  });

  // S — upper selected index
  it("S: upper selected index", () => {
    const state = createInitialGameState();
    const timeline = createCampaignTimeline(state);
    expect(() =>
      createTimelinePresentationModel(timeline, 1),
    ).toThrow("Timeline selected index out of range: 1.");
  });

  // T — empty presentation timeline
  it("T: empty presentation timeline", () => {
    expect(() =>
      createTimelinePresentationModel({ entries: [] }, 0),
    ).toThrow("Campaign timeline must contain at least one entry.");
  });

  // U — alternate-player presentation
  it("U: alternate-player presentation", () => {
    const state = createCampaignGameState({
      playerNationId: "dravos",
    });
    const timeline = createCampaignTimeline(state);
    const model = createTimelinePresentationModel(timeline, 0);
    expect(model.entry.playerNationId).toBe("dravos");
    expect(model.entry.playerNationName).toBe("Dravos");
    expect(model.entry.playerNationCode).toBe("DRA");
    expect(model.entry.remainingActionPoints).toBe(6);
    expect(model.entry.maximumActionPoints).toBe(6);
    expect(model.entry.stability).toBe(78);
    expect(model.entry.publicSupport).toBe(55);
    expect(model.entry.internalSecurity).toBe(82);
  });

  // V — loaded-style session start
  it("V: loaded-style session start", () => {
    const state = createCampaignGameState({
      playerNationId: "dravos",
    });
    const turn5State = { ...state, turn: 5 };
    const timeline = createCampaignTimeline(turn5State);
    expect(timeline.entries.length).toBe(1);
    expect(timeline.entries[0].sequence).toBe(1);
    expect(timeline.entries[0].kind).toBe("campaign-start");
    expect(timeline.entries[0].turn).toBe(5);
    expect(timeline.entries[0].state).toBe(turn5State);
  });

  // W — presentation freshness
  it("W: presentation freshness", () => {
    const state = createInitialGameState();
    const timeline = createCampaignTimeline(state);
    const a = createTimelinePresentationModel(timeline, 0);
    const b = createTimelinePresentationModel(timeline, 0);
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(a.entry).not.toBe(b.entry);
  });
});
