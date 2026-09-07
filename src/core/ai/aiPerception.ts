import type { NationId } from "../model/nation.js";
import type { GameState } from "../model/gameState.js";
import type { ProxyConflict } from "../model/proxyConflict.js";
import type { IntelligenceNetworkLevel } from "../model/intelligenceNetwork.js";
import type { IntelligenceVisibility } from "../model/intelligenceVisibility.js";
import type { CounterintelligenceAwarenessLevel } from "../model/counterintelligenceAwareness.js";
import type { DiplomaticStatus } from "../model/diplomaticRelationship.js";
import { getNationById } from "../model/worldState.js";
import { getNationStrategicStats } from "../model/nationStrategicStats.js";
import { getNationActionPoints } from "../model/actionPoints.js";
import { getNationVisibility } from "../model/intelligenceVisibility.js";
import { getNationInfluence } from "../model/nationInfluence.js";
import { getDiplomaticRelationship } from "../model/diplomaticRelationship.js";
import { getNationRegimePressure } from "../model/nationRegimePressure.js";
import { getIntelligenceNetwork } from "../model/intelligenceState.js";
import { getCounterintelligenceAwareness } from "../model/counterintelligenceAwareness.js";
import { validateGameState } from "../simulation/validateGameState.js";

export type AiStrategicStatBand = "low" | "medium" | "high";

export interface AiUnknownStrategicStats {
  readonly kind: "unknown";
}

export interface AiLimitedStrategicStats {
  readonly kind: "limited";
  readonly stability: AiStrategicStatBand;
  readonly publicSupport: AiStrategicStatBand;
  readonly internalSecurity: AiStrategicStatBand;
}

export interface AiExactStrategicStats {
  readonly kind: "exact";
  readonly stability: number;
  readonly publicSupport: number;
  readonly internalSecurity: number;
}

export type AiPerceivedStrategicStats =
  | AiUnknownStrategicStats
  | AiLimitedStrategicStats
  | AiExactStrategicStats;

export interface AiActionPointPerception {
  readonly maximum: number;
  readonly remaining: number;
}

export interface AiForeignNationPerception {
  readonly nationId: NationId;
  readonly visibility: IntelligenceVisibility;
  readonly strategicStats: AiPerceivedStrategicStats;
  readonly diplomaticStatus: DiplomaticStatus;
  readonly observerInfluence: number;
  readonly observerRegimePressure: number;
  readonly intelligenceNetworkLevel: IntelligenceNetworkLevel;
  readonly defensiveAwareness: CounterintelligenceAwarenessLevel;
}

export interface AiPerception {
  readonly observerNationId: NationId;
  readonly turn: number;
  readonly phase: "planning" | "resolution";
  readonly actionPoints: AiActionPointPerception;
  readonly selfStrategicStats: AiExactStrategicStats;
  readonly foreignNations: readonly AiForeignNationPerception[];
  readonly involvedProxyConflicts: readonly ProxyConflict[];
}

function toStatBand(value: number): AiStrategicStatBand {
  if (value <= 33) return "low";
  if (value <= 66) return "medium";
  return "high";
}

export function createAiPerception(
  state: Readonly<GameState>,
  observerNationId: NationId,
): AiPerception {
  getNationById(state.world, observerNationId);
  validateGameState(state);

  const observerStats = getNationStrategicStats(state.world, observerNationId);
  const observerAp = getNationActionPoints(state, observerNationId);

  const selfStrategicStats: AiExactStrategicStats = {
    kind: "exact",
    stability: observerStats.stability,
    publicSupport: observerStats.publicSupport,
    internalSecurity: observerStats.internalSecurity,
  };

  const foreignNations: AiForeignNationPerception[] = [];

  for (const nation of state.world.nations) {
    if (nation.id === observerNationId) continue;

    const visibility = getNationVisibility(
      state,
      observerNationId,
      nation.id,
    );

    const targetStats = getNationStrategicStats(state.world, nation.id);
    const influence = getNationInfluence(
      state.world,
      observerNationId,
      nation.id,
    );
    const diplomacy = getDiplomaticRelationship(
      state.world,
      observerNationId,
      nation.id,
    );
    const regimePressure = getNationRegimePressure(
      state.world,
      observerNationId,
      nation.id,
    );
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

    let strategicStats: AiPerceivedStrategicStats;
    if (visibility === "unknown") {
      strategicStats = { kind: "unknown" };
    } else if (visibility === "limited") {
      strategicStats = {
        kind: "limited",
        stability: toStatBand(targetStats.stability),
        publicSupport: toStatBand(targetStats.publicSupport),
        internalSecurity: toStatBand(targetStats.internalSecurity),
      };
    } else {
      strategicStats = {
        kind: "exact",
        stability: targetStats.stability,
        publicSupport: targetStats.publicSupport,
        internalSecurity: targetStats.internalSecurity,
      };
    }

    foreignNations.push({
      nationId: nation.id,
      visibility,
      strategicStats,
      diplomaticStatus: diplomacy.status,
      observerInfluence: influence.value,
      observerRegimePressure: regimePressure.value,
      intelligenceNetworkLevel: network.level,
      defensiveAwareness: awareness.level,
    });
  }

  const involvedProxyConflicts: ProxyConflict[] = [];
  for (const conflict of state.world.proxyConflicts) {
    if (
      conflict.hostNationId === observerNationId ||
      conflict.nationAId === observerNationId ||
      conflict.nationBId === observerNationId
    ) {
      involvedProxyConflicts.push({
        id: conflict.id,
        hostNationId: conflict.hostNationId,
        nationAId: conflict.nationAId,
        nationBId: conflict.nationBId,
        intensity: conflict.intensity,
      });
    }
  }

  return {
    observerNationId,
    turn: state.turn,
    phase: state.phase,
    actionPoints: {
      maximum: observerAp.maximum,
      remaining: observerAp.remaining,
    },
    selfStrategicStats,
    foreignNations,
    involvedProxyConflicts,
  };
}
