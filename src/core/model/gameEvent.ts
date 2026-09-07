import type { NationId } from "./nation.js";
import type { AgentId } from "./intelligenceAgent.js";
import type { AssetId, IntelligenceAssetAccess } from "./intelligenceAsset.js";
import type { IntelligenceNetworkLevel } from "./intelligenceNetwork.js";
import type { IntelligenceVisibility } from "./intelligenceVisibility.js";
import type { CounterintelligenceAwarenessLevel } from "./counterintelligenceAwareness.js";
import type { DiplomaticStatus } from "./diplomaticRelationship.js";

export interface IntelligenceNetworkBuiltEvent {
  readonly type: "intelligence-network-built";
  readonly turn: number;
  readonly actorNationId: NationId;
  readonly targetNationId: NationId;
  readonly agentId: AgentId;
  readonly previousLevel: IntelligenceNetworkLevel;
  readonly newLevel: IntelligenceNetworkLevel;
  readonly actionPointCost: number;
}

export interface IntelligenceGatheredEvent {
  readonly type: "intelligence-gathered";
  readonly turn: number;
  readonly actorNationId: NationId;
  readonly targetNationId: NationId;
  readonly agentId: AgentId;
  readonly previousVisibility: IntelligenceVisibility;
  readonly newVisibility: IntelligenceVisibility;
  readonly actionPointCost: number;
}

export interface IntelligenceAssetRecruitedEvent {
  readonly type: "intelligence-asset-recruited";
  readonly turn: number;
  readonly actorNationId: NationId;
  readonly targetNationId: NationId;
  readonly agentId: AgentId;
  readonly assetId: AssetId;
  readonly access: IntelligenceAssetAccess;
  readonly actionPointCost: number;
}

export interface CounterintelligenceSweepEvent {
  readonly type: "counterintelligence-sweep";
  readonly turn: number;
  readonly defenderNationId: NationId;
  readonly intruderNationId: NationId;
  readonly foreignPresenceDetected: boolean;
  readonly previousAwareness: CounterintelligenceAwarenessLevel;
  readonly newAwareness: CounterintelligenceAwarenessLevel;
  readonly actionPointCost: number;
}

export interface IntelligenceAssetTurnedEvent {
  readonly type: "intelligence-asset-turned";
  readonly turn: number;
  readonly defenderNationId: NationId;
  readonly intruderNationId: NationId;
  readonly assetId: AssetId;
  readonly actionPointCost: number;
}

export interface FalseIntelligenceFedEvent {
  readonly type: "false-intelligence-fed";
  readonly turn: number;
  readonly controllerNationId: NationId;
  readonly observerNationId: NationId;
  readonly assetId: AssetId;
  readonly previousVisibility: IntelligenceVisibility;
  readonly newVisibility: IntelligenceVisibility;
  readonly actionPointCost: number;
}

export interface TurnAdvancedEvent {
  readonly type: "turn-advanced";
  readonly turn: number;
  readonly previousTurn: number;
  readonly nextTurn: number;
  readonly processedOrderIds: readonly string[];
}

export interface PoliticalInfluenceCultivatedEvent {
  readonly type: "political-influence-cultivated";
  readonly turn: number;
  readonly actorNationId: NationId;
  readonly targetNationId: NationId;
  readonly previousInfluence: number;
  readonly newInfluence: number;
  readonly actionPointCost: number;
}

export interface DiplomaticOutreachConductedEvent {
  readonly type: "diplomatic-outreach-conducted";
  readonly turn: number;
  readonly actorNationId: NationId;
  readonly targetNationId: NationId;
  readonly previousStatus: DiplomaticStatus;
  readonly newStatus: DiplomaticStatus;
  readonly actionPointCost: number;
}

export interface GovernmentStabilizedEvent {
  readonly type: "government-stabilized";
  readonly turn: number;
  readonly actorNationId: NationId;
  readonly targetNationId: NationId;
  readonly previousStability: number;
  readonly newStability: number;
  readonly actionPointCost: number;
}

export type GameEvent =
  | IntelligenceNetworkBuiltEvent
  | IntelligenceGatheredEvent
  | IntelligenceAssetRecruitedEvent
  | CounterintelligenceSweepEvent
  | IntelligenceAssetTurnedEvent
  | FalseIntelligenceFedEvent
  | TurnAdvancedEvent
  | PoliticalInfluenceCultivatedEvent
  | DiplomaticOutreachConductedEvent
  | GovernmentStabilizedEvent;
