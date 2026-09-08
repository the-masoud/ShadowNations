import type { GameState } from "../../core/model/gameState.js";
import type { NationId } from "../../core/model/nation.js";
import type { AgentId } from "../../core/model/intelligenceAgent.js";
import type { AssetId } from "../../core/model/intelligenceAsset.js";
import type { ProxyConflictId } from "../../core/model/proxyConflict.js";
import type { CovertSabotageObjective } from "../../core/model/covertSabotage.js";
import type { OperationResult } from "../../core/model/operationResult.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import { buildIntelligenceNetwork } from "../../core/simulation/buildIntelligenceNetwork.js";
import { gatherIntelligence } from "../../core/simulation/gatherIntelligence.js";
import { recruitIntelligenceAsset } from "../../core/simulation/recruitIntelligenceAsset.js";
import { runCounterintelligenceSweep } from "../../core/simulation/runCounterintelligenceSweep.js";
import { turnIntelligenceAsset } from "../../core/simulation/turnIntelligenceAsset.js";
import { feedFalseIntelligence } from "../../core/simulation/feedFalseIntelligence.js";
import { cultivatePoliticalInfluence } from "../../core/simulation/cultivatePoliticalInfluence.js";
import { conductDiplomaticOutreach } from "../../core/simulation/conductDiplomaticOutreach.js";
import { stabilizeGovernment } from "../../core/simulation/stabilizeGovernment.js";
import { conductCovertSabotage } from "../../core/simulation/conductCovertSabotage.js";
import { startProxyConflict } from "../../core/simulation/startProxyConflict.js";
import { escalateProxyConflict } from "../../core/simulation/escalateProxyConflict.js";
import { applyRegimePressure } from "../../core/simulation/applyRegimePressure.js";

export type OperationPlannerKind =
  | "build-network"
  | "gather-intelligence"
  | "recruit-asset"
  | "counterintelligence-sweep"
  | "turn-asset"
  | "feed-false-intelligence"
  | "cultivate-influence"
  | "diplomatic-outreach"
  | "stabilize-government"
  | "covert-sabotage"
  | "start-proxy-conflict"
  | "escalate-proxy-conflict"
  | "apply-regime-pressure";

export type OperationPlannerCommand =
  | {
      readonly kind: "build-network";
      readonly targetNationId: NationId;
      readonly agentId: AgentId;
    }
  | {
      readonly kind: "gather-intelligence";
      readonly targetNationId: NationId;
      readonly agentId: AgentId;
    }
  | {
      readonly kind: "recruit-asset";
      readonly targetNationId: NationId;
      readonly agentId: AgentId;
    }
  | {
      readonly kind: "counterintelligence-sweep";
      readonly intruderNationId: NationId;
    }
  | {
      readonly kind: "turn-asset";
      readonly assetId: AssetId;
    }
  | {
      readonly kind: "feed-false-intelligence";
      readonly assetId: AssetId;
    }
  | {
      readonly kind: "cultivate-influence";
      readonly targetNationId: NationId;
    }
  | {
      readonly kind: "diplomatic-outreach";
      readonly targetNationId: NationId;
    }
  | {
      readonly kind: "stabilize-government";
      readonly targetNationId: NationId;
    }
  | {
      readonly kind: "covert-sabotage";
      readonly targetNationId: NationId;
      readonly agentId: AgentId;
      readonly objective: CovertSabotageObjective;
    }
  | {
      readonly kind: "start-proxy-conflict";
      readonly rivalNationId: NationId;
      readonly hostNationId: NationId;
    }
  | {
      readonly kind: "escalate-proxy-conflict";
      readonly conflictId: ProxyConflictId;
    }
  | {
      readonly kind: "apply-regime-pressure";
      readonly targetNationId: NationId;
    };

export function executeOperationPlannerCommand(
  state: Readonly<GameState>,
  command: OperationPlannerCommand,
): OperationResult {
  validateGameState(state);

  const actorNationId = state.playerNationId;

  switch (command.kind) {
    case "build-network":
      return buildIntelligenceNetwork(
        state,
        actorNationId,
        command.targetNationId,
        command.agentId,
      );
    case "gather-intelligence":
      return gatherIntelligence(
        state,
        actorNationId,
        command.targetNationId,
        command.agentId,
      );
    case "recruit-asset": {
      let seq = 1;
      let candidateId = `asset-${actorNationId}-${command.targetNationId}-${seq}`;
      while (state.intelligence.assets.some((a) => a.id === candidateId)) {
        seq++;
        candidateId = `asset-${actorNationId}-${command.targetNationId}-${seq}`;
      }
      return recruitIntelligenceAsset(
        state,
        actorNationId,
        command.targetNationId,
        command.agentId,
        candidateId,
      );
    }
    case "counterintelligence-sweep":
      return runCounterintelligenceSweep(
        state,
        actorNationId,
        command.intruderNationId,
      );
    case "turn-asset":
      return turnIntelligenceAsset(
        state,
        actorNationId,
        command.assetId,
      );
    case "feed-false-intelligence":
      return feedFalseIntelligence(
        state,
        actorNationId,
        command.assetId,
      );
    case "cultivate-influence":
      return cultivatePoliticalInfluence(
        state,
        actorNationId,
        command.targetNationId,
      );
    case "diplomatic-outreach":
      return conductDiplomaticOutreach(
        state,
        actorNationId,
        command.targetNationId,
      );
    case "stabilize-government":
      return stabilizeGovernment(
        state,
        actorNationId,
        command.targetNationId,
      );
    case "covert-sabotage":
      return conductCovertSabotage(
        state,
        actorNationId,
        command.targetNationId,
        command.agentId,
        command.objective,
      );
    case "start-proxy-conflict": {
      let seq = 1;
      let candidateId = `proxy-${actorNationId}-${command.rivalNationId}-${command.hostNationId}-${seq}`;
      while (state.world.proxyConflicts.some((c) => c.id === candidateId)) {
        seq++;
        candidateId = `proxy-${actorNationId}-${command.rivalNationId}-${command.hostNationId}-${seq}`;
      }
      return startProxyConflict(
        state,
        actorNationId,
        command.rivalNationId,
        command.hostNationId,
        candidateId,
      );
    }
    case "escalate-proxy-conflict":
      return escalateProxyConflict(
        state,
        actorNationId,
        command.conflictId,
      );
    case "apply-regime-pressure":
      return applyRegimePressure(
        state,
        actorNationId,
        command.targetNationId,
      );
  }
}
