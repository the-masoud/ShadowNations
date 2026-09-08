import type { NationId } from "../../core/model/nation.js";
import type { IntelligenceVisibility } from "../../core/model/intelligenceVisibility.js";
import type { IntelligenceNetworkLevel } from "../../core/model/intelligenceNetwork.js";
import type { CounterintelligenceAwarenessLevel } from "../../core/model/counterintelligenceAwareness.js";
import type { GameState } from "../../core/model/gameState.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import { getNationById } from "../../core/model/worldState.js";
import { getNationVisibility } from "../../core/model/intelligenceVisibility.js";
import { getIntelligenceNetwork } from "../../core/model/intelligenceState.js";
import { getCounterintelligenceAwareness } from "../../core/model/counterintelligenceAwareness.js";
import { getStrategicMapNationColor } from "../map/strategicMapPresentation.js";

export interface IntelligenceDashboardTargetModel {
  readonly targetNationId: NationId;
  readonly targetNationName: string;
  readonly targetNationCode: string;
  readonly targetColor: number;
  readonly visibility: IntelligenceVisibility;
  readonly networkLevel: IntelligenceNetworkLevel;
  readonly defensiveAwareness: CounterintelligenceAwarenessLevel;
  readonly ownedAssetCount: number;
}

export interface IntelligenceDashboardModel {
  readonly observerNationId: NationId;
  readonly observerNationName: string;
  readonly observerNationCode: string;
  readonly agentCount: number;
  readonly ownedAssetCount: number;
  readonly controlledDoubleAgentCount: number;
  readonly targets: readonly IntelligenceDashboardTargetModel[];
}

export function createIntelligenceDashboardModel(
  state: Readonly<GameState>,
): IntelligenceDashboardModel {
  validateGameState(state);

  const observerNationId = state.playerNationId;
  const observerNation = getNationById(state.world, observerNationId);

  const agentCount = state.intelligence.agents.filter(
    (a) => a.ownerNationId === observerNationId,
  ).length;

  const ownedAssetCount = state.intelligence.assets.filter(
    (a) => a.ownerNationId === observerNationId,
  ).length;

  const controlledDoubleAgentCount = state.intelligence.doubleAgents.filter(
    (d) => d.controllerNationId === observerNationId,
  ).length;

  const targets: IntelligenceDashboardTargetModel[] = [];

  for (const nation of state.world.nations) {
    if (nation.id === observerNationId) continue;

    const visibility = getNationVisibility(state, observerNationId, nation.id);
    const network = getIntelligenceNetwork(
      state,
      observerNationId,
      nation.id,
    );
    const awareness = getCounterintelligenceAwareness(
      state,
      observerNationId,
      nation.id,
    );

    const ownedAssetCountForTarget = state.intelligence.assets.filter(
      (a) =>
        a.ownerNationId === observerNationId &&
        a.targetNationId === nation.id,
    ).length;

    targets.push({
      targetNationId: nation.id,
      targetNationName: nation.name,
      targetNationCode: nation.code,
      targetColor: getStrategicMapNationColor(nation.id),
      visibility,
      networkLevel: network.level,
      defensiveAwareness: awareness.level,
      ownedAssetCount: ownedAssetCountForTarget,
    });
  }

  return {
    observerNationId,
    observerNationName: observerNation.name,
    observerNationCode: observerNation.code,
    agentCount,
    ownedAssetCount,
    controlledDoubleAgentCount,
    targets,
  };
}
