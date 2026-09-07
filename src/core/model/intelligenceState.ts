import type { Nation } from "./nation.js";
import type { NationId } from "./nation.js";
import type { NationIntelligenceVisibility } from "./intelligenceVisibility.js";
import type { IntelligenceNetwork } from "./intelligenceNetwork.js";
import type { IntelligenceAgent } from "./intelligenceAgent.js";
import type { IntelligenceAsset } from "./intelligenceAsset.js";
import type { CounterintelligenceAwareness } from "./counterintelligenceAwareness.js";
import type { DoubleAgentControl } from "./doubleAgent.js";
import { CANONICAL_AGENTS } from "./intelligenceAgent.js";
import { getNationById } from "./worldState.js";

export interface IntelligenceState {
  readonly nationVisibility: readonly NationIntelligenceVisibility[];
  readonly networks: readonly IntelligenceNetwork[];
  readonly agents: readonly IntelligenceAgent[];
  readonly assets: readonly IntelligenceAsset[];
  readonly counterintelligenceAwareness: readonly CounterintelligenceAwareness[];
  readonly doubleAgents: readonly DoubleAgentControl[];
}

export function createInitialIntelligenceState(
  nations: readonly Nation[],
): IntelligenceState {
  const nationVisibility: NationIntelligenceVisibility[] = [];
  for (const observer of nations) {
    for (const target of nations) {
      nationVisibility.push({
        observerNationId: observer.id,
        targetNationId: target.id,
        visibility: observer.id === target.id ? "known" : "unknown",
      });
    }
  }

  const networks: IntelligenceNetwork[] = [];
  for (const observer of nations) {
    for (const target of nations) {
      if (observer.id === target.id) continue;
      networks.push({
        observerNationId: observer.id,
        targetNationId: target.id,
        level: "none",
      });
    }
  }

  const counterintelligenceAwareness: CounterintelligenceAwareness[] = [];
  for (const defender of nations) {
    for (const intruder of nations) {
      if (defender.id === intruder.id) continue;
      counterintelligenceAwareness.push({
        defenderNationId: defender.id,
        intruderNationId: intruder.id,
        level: "unaware",
      });
    }
  }

  const agents: IntelligenceAgent[] = [...CANONICAL_AGENTS];
  const assets: IntelligenceAsset[] = [];
  const doubleAgents: DoubleAgentControl[] = [];

  return {
    nationVisibility,
    networks,
    agents,
    assets,
    counterintelligenceAwareness,
    doubleAgents,
  };
}

export class SelfIntelligenceNetworkError extends Error {
  constructor(nationId: NationId) {
    super(
      `Self-intelligence network not allowed for nation: "${nationId}"`,
    );
    this.name = "SelfIntelligenceNetworkError";
  }
}

export class MissingIntelligenceNetworkError extends Error {
  constructor(observerNationId: NationId, targetNationId: NationId) {
    super(
      `Missing intelligence network for observer "${observerNationId}" / target "${targetNationId}"`,
    );
    this.name = "MissingIntelligenceNetworkError";
  }
}

export function getIntelligenceNetwork(
  state: Readonly<{ intelligence: IntelligenceState; world: { nations: readonly { id: NationId }[] } }>,
  observerNationId: NationId,
  targetNationId: NationId,
): IntelligenceNetwork {
  getNationById(state.world as any, observerNationId);
  getNationById(state.world as any, targetNationId);

  if (observerNationId === targetNationId) {
    throw new SelfIntelligenceNetworkError(observerNationId);
  }

  const entry = state.intelligence.networks.find(
    (n) =>
      n.observerNationId === observerNationId &&
      n.targetNationId === targetNationId,
  );
  if (!entry) {
    throw new MissingIntelligenceNetworkError(
      observerNationId,
      targetNationId,
    );
  }
  return entry;
}
