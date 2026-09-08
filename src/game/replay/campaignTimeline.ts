import type { GameState } from "../../core/model/gameState.js";
import type { GameEvent } from "../../core/model/gameEvent.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";

export type CampaignTimelineEntryKind =
  | "campaign-start"
  | "operation"
  | "turn";

export interface CampaignTimelineEntry {
  readonly sequence: number;
  readonly kind: CampaignTimelineEntryKind;
  readonly turn: number;
  readonly eventType: GameEvent["type"] | null;
  readonly state: GameState;
}

export interface CampaignTimeline {
  readonly entries: readonly CampaignTimelineEntry[];
}

export function createCampaignTimeline(
  state: Readonly<GameState>,
): CampaignTimeline {
  validateGameState(state);
  return {
    entries: [
      {
        sequence: 1,
        kind: "campaign-start",
        turn: state.turn,
        eventType: null,
        state,
      },
    ],
  };
}

export function appendOperationTimelineEntry(
  timeline: Readonly<CampaignTimeline>,
  state: Readonly<GameState>,
  event: Readonly<GameEvent>,
): CampaignTimeline {
  validateGameState(state);
  if (timeline.entries.length === 0) {
    throw new RangeError(
      "Campaign timeline must contain at least one entry.",
    );
  }
  return {
    entries: [
      ...timeline.entries,
      {
        sequence: timeline.entries.length + 1,
        kind: "operation",
        turn: state.turn,
        eventType: event.type,
        state,
      },
    ],
  };
}

export function appendTurnTimelineEntry(
  timeline: Readonly<CampaignTimeline>,
  state: Readonly<GameState>,
): CampaignTimeline {
  validateGameState(state);
  if (timeline.entries.length === 0) {
    throw new RangeError(
      "Campaign timeline must contain at least one entry.",
    );
  }
  return {
    entries: [
      ...timeline.entries,
      {
        sequence: timeline.entries.length + 1,
        kind: "turn",
        turn: state.turn,
        eventType: null,
        state,
      },
    ],
  };
}
