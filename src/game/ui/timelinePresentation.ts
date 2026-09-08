import type { GameState } from "../../core/model/gameState.js";
import type { GameEvent } from "../../core/model/gameEvent.js";
import type { NationId } from "../../core/model/nation.js";
import { getNationById } from "../../core/model/worldState.js";
import { getNationActionPoints } from "../../core/model/actionPoints.js";
import { getNationStrategicStats } from "../../core/model/nationStrategicStats.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import type {
  CampaignTimeline,
  CampaignTimelineEntryKind,
} from "../replay/campaignTimeline.js";

export interface TimelineEntryPresentationModel {
  readonly sequence: number;
  readonly kind: CampaignTimelineEntryKind;
  readonly kindLabel:
    | "CAMPAIGN START"
    | "OPERATION"
    | "TURN SNAPSHOT";
  readonly turn: number;
  readonly eventType: GameEvent["type"] | null;
  readonly eventLabel: string;
  readonly playerNationId: NationId;
  readonly playerNationName: string;
  readonly playerNationCode: string;
  readonly remainingActionPoints: number;
  readonly maximumActionPoints: number;
  readonly stability: number;
  readonly publicSupport: number;
  readonly internalSecurity: number;
}

export interface TimelinePresentationModel {
  readonly selectedIndex: number;
  readonly entryCount: number;
  readonly canPrevious: boolean;
  readonly canNext: boolean;
  readonly entry: TimelineEntryPresentationModel;
}

function kindToLabel(
  kind: CampaignTimelineEntryKind,
): "CAMPAIGN START" | "OPERATION" | "TURN SNAPSHOT" {
  switch (kind) {
    case "campaign-start":
      return "CAMPAIGN START";
    case "operation":
      return "OPERATION";
    case "turn":
      return "TURN SNAPSHOT";
  }
}

function eventLabel(type: GameEvent["type"] | null): string {
  if (type === null) {
    return "NONE";
  }
  return type.toUpperCase().replaceAll("-", " ");
}

function buildEntry(
  state: GameState,
  sequence: number,
  kind: CampaignTimelineEntryKind,
  eventType: GameEvent["type"] | null,
): TimelineEntryPresentationModel {
  const nation = getNationById(state.world, state.playerNationId);
  const ap = getNationActionPoints(state, state.playerNationId);
  const stats = getNationStrategicStats(
    state.world,
    state.playerNationId,
  );
  return {
    sequence,
    kind,
    kindLabel: kindToLabel(kind),
    turn: state.turn,
    eventType,
    eventLabel: eventLabel(eventType),
    playerNationId: state.playerNationId as NationId,
    playerNationName: nation.name,
    playerNationCode: nation.code,
    remainingActionPoints: ap.remaining,
    maximumActionPoints: ap.maximum,
    stability: stats.stability,
    publicSupport: stats.publicSupport,
    internalSecurity: stats.internalSecurity,
  };
}

export function createTimelinePresentationModel(
  timeline: Readonly<CampaignTimeline>,
  selectedIndex: number,
): TimelinePresentationModel {
  if (!Number.isInteger(selectedIndex)) {
    throw new RangeError(
      "Timeline selected index must be an integer.",
    );
  }

  if (timeline.entries.length === 0) {
    throw new RangeError(
      "Campaign timeline must contain at least one entry.",
    );
  }

  if (selectedIndex < 0 || selectedIndex >= timeline.entries.length) {
    throw new RangeError(
      `Timeline selected index out of range: ${selectedIndex}.`,
    );
  }

  const selected = timeline.entries[selectedIndex];
  validateGameState(selected.state);

  return {
    selectedIndex,
    entryCount: timeline.entries.length,
    canPrevious: selectedIndex > 0,
    canNext: selectedIndex < timeline.entries.length - 1,
    entry: buildEntry(
      selected.state,
      selected.sequence,
      selected.kind,
      selected.eventType,
    ),
  };
}
