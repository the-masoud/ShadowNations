import type { GameEvent } from "../../core/model/gameEvent.js";
import type { TurnResult } from "../../core/model/turnResult.js";

export interface TurnResolutionEventModel {
  readonly type: GameEvent["type"];
  readonly label: string;
}

export interface TurnResolutionPresentationModel {
  readonly previousTurn: number;
  readonly nextTurn: number;
  readonly eventCount: number;
  readonly events: readonly TurnResolutionEventModel[];
}

const EVENT_LABELS: Record<GameEvent["type"], string> = {
  "intelligence-network-built": "INTELLIGENCE NETWORK BUILT",
  "intelligence-gathered": "INTELLIGENCE GATHERED",
  "intelligence-asset-recruited": "INTELLIGENCE ASSET RECRUITED",
  "counterintelligence-sweep": "COUNTERINTELLIGENCE SWEEP",
  "intelligence-asset-turned": "INTELLIGENCE ASSET TURNED",
  "false-intelligence-fed": "FALSE INTELLIGENCE FED",
  "turn-advanced": "TURN ADVANCED",
  "political-influence-cultivated": "POLITICAL INFLUENCE CULTIVATED",
  "diplomatic-outreach-conducted": "DIPLOMATIC OUTREACH CONDUCTED",
  "government-stabilized": "GOVERNMENT STABILIZED",
  "covert-sabotage-conducted": "COVERT SABOTAGE CONDUCTED",
  "proxy-conflict-started": "PROXY CONFLICT STARTED",
  "proxy-conflict-escalated": "PROXY CONFLICT ESCALATED",
  "regime-pressure-applied": "REGIME PRESSURE APPLIED",
};

export function createTurnResolutionPresentationModel(
  pendingEvents: readonly GameEvent[],
  result: Readonly<TurnResult>,
): TurnResolutionPresentationModel {
  const combined: readonly GameEvent[] = [...pendingEvents, ...result.events];
  const events: TurnResolutionEventModel[] = combined.map((e) => ({
    type: e.type,
    label: EVENT_LABELS[e.type],
  }));
  return {
    previousTurn: result.previousTurn,
    nextTurn: result.nextTurn,
    eventCount: combined.length,
    events,
  };
}
