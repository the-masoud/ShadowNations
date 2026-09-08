import type { NationId } from "./nation.js";
import type { AgentId } from "./intelligenceAgent.js";
import type { AssetId, IntelligenceAssetAccess } from "./intelligenceAsset.js";
import type { IntelligenceNetworkLevel } from "./intelligenceNetwork.js";
import type { IntelligenceVisibility } from "./intelligenceVisibility.js";
import type { CounterintelligenceAwarenessLevel } from "./counterintelligenceAwareness.js";
import type { DiplomaticStatus } from "./diplomaticRelationship.js";
import type { CovertSabotageObjective } from "./covertSabotage.js";
import type { ProxyConflictId, ProxyConflictIntensity } from "./proxyConflict.js";
import type { CampaignCrisisKind } from "./campaignCrisis.js";
import type { NationStrategicStatKey } from "./nationStrategicStats.js";

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

export interface CovertSabotageConductedEvent {
  readonly type: "covert-sabotage-conducted";
  readonly turn: number;
  readonly actorNationId: NationId;
  readonly targetNationId: NationId;
  readonly agentId: AgentId;
  readonly objective: CovertSabotageObjective;
  readonly previousValue: number;
  readonly newValue: number;
  readonly actionPointCost: number;
}

export interface ProxyConflictStartedEvent {
  readonly type: "proxy-conflict-started";
  readonly turn: number;
  readonly actorNationId: NationId;
  readonly rivalNationId: NationId;
  readonly hostNationId: NationId;
  readonly conflictId: ProxyConflictId;
  readonly intensity: "low";
  readonly previousHostStability: number;
  readonly newHostStability: number;
  readonly actionPointCost: number;
}

export interface ProxyConflictEscalatedEvent {
  readonly type: "proxy-conflict-escalated";
  readonly turn: number;
  readonly actorNationId: NationId;
  readonly conflictId: ProxyConflictId;
  readonly hostNationId: NationId;
  readonly previousIntensity: ProxyConflictIntensity;
  readonly newIntensity: ProxyConflictIntensity;
  readonly previousHostStability: number;
  readonly newHostStability: number;
  readonly actionPointCost: number;
}

export interface RegimePressureAppliedEvent {
  readonly type: "regime-pressure-applied";
  readonly turn: number;
  readonly actorNationId: NationId;
  readonly targetNationId: NationId;
  readonly previousPressure: number;
  readonly newPressure: number;
  readonly previousStability: number;
  readonly newStability: number;
  readonly actionPointCost: number;
}

export interface CampaignCrisisTriggeredEvent {
  readonly type: "campaign-crisis-triggered";
  readonly turn: number;
  readonly targetNationId: NationId;
  readonly crisis: CampaignCrisisKind;
  readonly strategicStat: NationStrategicStatKey;
  readonly previousValue: number;
  readonly newValue: number;
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
  | GovernmentStabilizedEvent
  | CovertSabotageConductedEvent
  | ProxyConflictStartedEvent
  | ProxyConflictEscalatedEvent
  | RegimePressureAppliedEvent
  | CampaignCrisisTriggeredEvent;
