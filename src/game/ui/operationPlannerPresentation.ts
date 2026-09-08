import type { NationId } from "../../core/model/nation.js";
import type { AgentId } from "../../core/model/intelligenceAgent.js";
import type { AssetId } from "../../core/model/intelligenceAsset.js";
import type { ProxyConflictId, ProxyConflictIntensity } from "../../core/model/proxyConflict.js";
import type { OperationPlannerKind } from "./executeOperationPlannerCommand.js";
import type { GameState } from "../../core/model/gameState.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import { getNationById } from "../../core/model/worldState.js";
import { getNationActionPoints } from "../../core/model/actionPoints.js";
import { getCounterintelligenceAwareness } from "../../core/model/counterintelligenceAwareness.js";
import { getIntelligenceAsset } from "../../core/model/intelligenceAsset.js";
import { getStrategicMapNationColor } from "../map/strategicMapPresentation.js";
import { BUILD_NETWORK_AP_COST } from "../../core/simulation/buildIntelligenceNetwork.js";
import { GATHER_INTELLIGENCE_AP_COST } from "../../core/simulation/gatherIntelligence.js";
import { RECRUIT_ASSET_AP_COST } from "../../core/simulation/recruitIntelligenceAsset.js";
import { COUNTERINTELLIGENCE_SWEEP_AP_COST } from "../../core/simulation/runCounterintelligenceSweep.js";
import { TURN_ASSET_AP_COST } from "../../core/simulation/turnIntelligenceAsset.js";
import { FEED_FALSE_INTELLIGENCE_AP_COST } from "../../core/simulation/feedFalseIntelligence.js";
import { CULTIVATE_POLITICAL_INFLUENCE_AP_COST } from "../../core/simulation/cultivatePoliticalInfluence.js";
import { DIPLOMATIC_OUTREACH_AP_COST } from "../../core/simulation/conductDiplomaticOutreach.js";
import { STABILIZE_GOVERNMENT_AP_COST } from "../../core/simulation/stabilizeGovernment.js";
import { COVERT_SABOTAGE_AP_COST } from "../../core/simulation/conductCovertSabotage.js";
import { START_PROXY_CONFLICT_AP_COST } from "../../core/simulation/startProxyConflict.js";
import { ESCALATE_PROXY_CONFLICT_AP_COST } from "../../core/simulation/escalateProxyConflict.js";
import { APPLY_REGIME_PRESSURE_AP_COST } from "../../core/simulation/applyRegimePressure.js";

export interface OperationPlannerOperationModel {
  readonly kind: OperationPlannerKind;
  readonly label: string;
  readonly actionPointCost: number;
}

export interface OperationPlannerNationModel {
  readonly nationId: NationId;
  readonly nationName: string;
  readonly nationCode: string;
  readonly nationColor: number;
}

export interface OperationPlannerAgentModel {
  readonly agentId: AgentId;
  readonly codename: string;
}

export interface OperationPlannerAssetModel {
  readonly assetId: AssetId;
  readonly sourceNationId: NationId;
  readonly sourceNationCode: string;
}

export interface OperationPlannerConflictModel {
  readonly conflictId: ProxyConflictId;
  readonly hostNationId: NationId;
  readonly hostNationCode: string;
  readonly intensity: ProxyConflictIntensity;
}

export interface OperationPlannerModel {
  readonly actorNationId: NationId;
  readonly actorNationName: string;
  readonly actorNationCode: string;
  readonly maximumActionPoints: number;
  readonly remainingActionPoints: number;
  readonly operations: readonly OperationPlannerOperationModel[];
  readonly targets: readonly OperationPlannerNationModel[];
  readonly agents: readonly OperationPlannerAgentModel[];
  readonly turnableAssets: readonly OperationPlannerAssetModel[];
  readonly controlledDoubleAgents: readonly OperationPlannerAssetModel[];
  readonly proxyConflicts: readonly OperationPlannerConflictModel[];
}

export function createOperationPlannerModel(
  state: Readonly<GameState>,
): OperationPlannerModel {
  validateGameState(state);

  const actorNationId = state.playerNationId;
  const actorNation = getNationById(state.world, actorNationId);
  const ap = getNationActionPoints(state, actorNationId);

  const operations: OperationPlannerOperationModel[] = [
    { kind: "build-network", label: "BUILD NETWORK", actionPointCost: BUILD_NETWORK_AP_COST },
    { kind: "gather-intelligence", label: "GATHER INTELLIGENCE", actionPointCost: GATHER_INTELLIGENCE_AP_COST },
    { kind: "recruit-asset", label: "RECRUIT ASSET", actionPointCost: RECRUIT_ASSET_AP_COST },
    { kind: "counterintelligence-sweep", label: "COUNTERINTEL SWEEP", actionPointCost: COUNTERINTELLIGENCE_SWEEP_AP_COST },
    { kind: "turn-asset", label: "TURN ASSET", actionPointCost: TURN_ASSET_AP_COST },
    { kind: "feed-false-intelligence", label: "FEED FALSE INTEL", actionPointCost: FEED_FALSE_INTELLIGENCE_AP_COST },
    { kind: "cultivate-influence", label: "CULTIVATE INFLUENCE", actionPointCost: CULTIVATE_POLITICAL_INFLUENCE_AP_COST },
    { kind: "diplomatic-outreach", label: "DIPLOMATIC OUTREACH", actionPointCost: DIPLOMATIC_OUTREACH_AP_COST },
    { kind: "stabilize-government", label: "STABILIZE GOVERNMENT", actionPointCost: STABILIZE_GOVERNMENT_AP_COST },
    { kind: "covert-sabotage", label: "COVERT SABOTAGE", actionPointCost: COVERT_SABOTAGE_AP_COST },
    { kind: "start-proxy-conflict", label: "START PROXY CONFLICT", actionPointCost: START_PROXY_CONFLICT_AP_COST },
    { kind: "escalate-proxy-conflict", label: "ESCALATE PROXY CONFLICT", actionPointCost: ESCALATE_PROXY_CONFLICT_AP_COST },
    { kind: "apply-regime-pressure", label: "APPLY REGIME PRESSURE", actionPointCost: APPLY_REGIME_PRESSURE_AP_COST },
  ];

  const targets: OperationPlannerNationModel[] = [];
  for (const nation of state.world.nations) {
    if (nation.id === actorNationId) continue;
    targets.push({
      nationId: nation.id,
      nationName: nation.name,
      nationCode: nation.code,
      nationColor: getStrategicMapNationColor(nation.id),
    });
  }

  const agents: OperationPlannerAgentModel[] = [];
  for (const agent of state.intelligence.agents) {
    if (agent.ownerNationId === actorNationId) {
      agents.push({
        agentId: agent.id,
        codename: agent.codename,
      });
    }
  }

  const turnableAssets: OperationPlannerAssetModel[] = [];
  for (const asset of state.intelligence.assets) {
    if (asset.targetNationId !== actorNationId) continue;
    if (asset.ownerNationId === actorNationId) continue;
    const awareness = getCounterintelligenceAwareness(
      state,
      actorNationId,
      asset.ownerNationId,
    );
    if (awareness.level !== "identified") continue;
    const alreadyTurned = state.intelligence.doubleAgents.some(
      (d) => d.assetId === asset.id,
    );
    if (alreadyTurned) continue;
    const sourceNation = getNationById(state.world, asset.ownerNationId);
    turnableAssets.push({
      assetId: asset.id,
      sourceNationId: asset.ownerNationId,
      sourceNationCode: sourceNation.code,
    });
  }

  const controlledDoubleAgents: OperationPlannerAssetModel[] = [];
  for (const control of state.intelligence.doubleAgents) {
    if (control.controllerNationId !== actorNationId) continue;
    const asset = getIntelligenceAsset(state, control.assetId);
    const sourceNation = getNationById(state.world, asset.ownerNationId);
    controlledDoubleAgents.push({
      assetId: asset.id,
      sourceNationId: asset.ownerNationId,
      sourceNationCode: sourceNation.code,
    });
  }

  const proxyConflicts: OperationPlannerConflictModel[] = [];
  for (const conflict of state.world.proxyConflicts) {
    if (conflict.nationAId !== actorNationId && conflict.nationBId !== actorNationId) continue;
    const hostNation = getNationById(state.world, conflict.hostNationId);
    proxyConflicts.push({
      conflictId: conflict.id,
      hostNationId: conflict.hostNationId,
      hostNationCode: hostNation.code,
      intensity: conflict.intensity,
    });
  }

  return {
    actorNationId,
    actorNationName: actorNation.name,
    actorNationCode: actorNation.code,
    maximumActionPoints: ap.maximum,
    remainingActionPoints: ap.remaining,
    operations,
    targets,
    agents,
    turnableAssets,
    controlledDoubleAgents,
    proxyConflicts,
  };
}
