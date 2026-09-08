import type { NationId } from "../../core/model/nation.js";
import type { AgentId } from "../../core/model/intelligenceAgent.js";
import type { IntelligenceVisibility } from "../../core/model/intelligenceVisibility.js";
import type { IntelligenceNetworkLevel } from "../../core/model/intelligenceNetwork.js";
import type { GameState } from "../../core/model/gameState.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import { getNationById } from "../../core/model/worldState.js";
import { getNationVisibility } from "../../core/model/intelligenceVisibility.js";
import { getIntelligenceNetwork } from "../../core/model/intelligenceState.js";
import { getIntelligenceAsset } from "../../core/model/intelligenceAsset.js";
import { getStrategicMapNationColor } from "../map/strategicMapPresentation.js";

export interface ConspiracyBoardAgentModel {
  readonly agentId: AgentId;
  readonly codename: string;
}

export interface ConspiracyBoardTargetModel {
  readonly targetNationId: NationId;
  readonly targetNationName: string;
  readonly targetNationCode: string;
  readonly targetColor: number;
  readonly visibility: IntelligenceVisibility;
  readonly networkLevel: IntelligenceNetworkLevel;
  readonly ownedAssetCount: number;
  readonly controlledDoubleAgentCount: number;
}

export interface ConspiracyBoardModel {
  readonly observerNationId: NationId;
  readonly observerNationName: string;
  readonly observerNationCode: string;
  readonly agents: readonly ConspiracyBoardAgentModel[];
  readonly targets: readonly ConspiracyBoardTargetModel[];
}

export function createConspiracyBoardModel(
  state: Readonly<GameState>,
): ConspiracyBoardModel {
  validateGameState(state);

  const observerNationId = state.playerNationId;
  const observerNation = getNationById(state.world, observerNationId);

  const agents: ConspiracyBoardAgentModel[] = [];
  for (const agent of state.intelligence.agents) {
    if (agent.ownerNationId === observerNationId) {
      agents.push({
        agentId: agent.id,
        codename: agent.codename,
      });
    }
  }

  const targets: ConspiracyBoardTargetModel[] = [];
  for (const nation of state.world.nations) {
    if (nation.id === observerNationId) continue;

    const visibility = getNationVisibility(state, observerNationId, nation.id);
    const network = getIntelligenceNetwork(
      state,
      observerNationId,
      nation.id,
    );

    let ownedAssetCount = 0;
    for (const asset of state.intelligence.assets) {
      if (
        asset.ownerNationId === observerNationId &&
        asset.targetNationId === nation.id
      ) {
        ownedAssetCount++;
      }
    }

    let controlledDoubleAgentCount = 0;
    for (const control of state.intelligence.doubleAgents) {
      if (control.controllerNationId !== observerNationId) continue;
      const asset = getIntelligenceAsset(state, control.assetId);
      if (asset.ownerNationId === nation.id) {
        controlledDoubleAgentCount++;
      }
    }

    targets.push({
      targetNationId: nation.id,
      targetNationName: nation.name,
      targetNationCode: nation.code,
      targetColor: getStrategicMapNationColor(nation.id),
      visibility,
      networkLevel: network.level,
      ownedAssetCount,
      controlledDoubleAgentCount,
    });
  }

  return {
    observerNationId,
    observerNationName: observerNation.name,
    observerNationCode: observerNation.code,
    agents,
    targets,
  };
}
