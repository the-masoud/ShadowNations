import type { NationId } from "./nation.js";

export type AgentId = string;

export interface IntelligenceAgent {
  readonly id: AgentId;
  readonly ownerNationId: NationId;
  readonly codename: string;
}

export const CANONICAL_AGENTS: readonly IntelligenceAgent[] = [
  { id: "solaris-echo", ownerNationId: "solaris", codename: "Echo" },
  { id: "solaris-orbit", ownerNationId: "solaris", codename: "Orbit" },
  { id: "dravos-raven", ownerNationId: "dravos", codename: "Raven" },
  { id: "dravos-iron", ownerNationId: "dravos", codename: "Iron" },
  { id: "norvia-frost", ownerNationId: "norvia", codename: "Frost" },
  { id: "norvia-lantern", ownerNationId: "norvia", codename: "Lantern" },
  { id: "veloria-silk", ownerNationId: "veloria", codename: "Silk" },
  { id: "veloria-tide", ownerNationId: "veloria", codename: "Tide" },
  { id: "karsen-wolf", ownerNationId: "karsen", codename: "Wolf" },
  { id: "karsen-ember", ownerNationId: "karsen", codename: "Ember" },
  { id: "arkania-dusk", ownerNationId: "arkania", codename: "Dusk" },
  { id: "arkania-sable", ownerNationId: "arkania", codename: "Sable" },
];

export class UnknownIntelligenceAgentError extends Error {
  constructor(agentId: AgentId) {
    super(`Unknown intelligence agent: "${agentId}"`);
    this.name = "UnknownIntelligenceAgentError";
  }
}

export function getIntelligenceAgent(
  state: Readonly<{ intelligence: { agents: readonly IntelligenceAgent[] } }>,
  agentId: AgentId,
): IntelligenceAgent {
  const agent = state.intelligence.agents.find((a) => a.id === agentId);
  if (!agent) {
    throw new UnknownIntelligenceAgentError(agentId);
  }
  return agent;
}
