import type { NationId } from "../model/nation.js";
import type { AgentId } from "../model/intelligenceAgent.js";

export class SelfTargetEspionageOperationError extends Error {
  constructor(actorNationId: NationId, targetNationId: NationId) {
    super(
      `Self-target espionage operation not allowed: actor "${actorNationId}" / target "${targetNationId}"`,
    );
    this.name = "SelfTargetEspionageOperationError";
  }
}

export class AgentOwnershipError extends Error {
  constructor(agentId: AgentId, expectedOwnerNationId: NationId) {
    super(
      `Agent "${agentId}" is not owned by nation "${expectedOwnerNationId}"`,
    );
    this.name = "AgentOwnershipError";
  }
}

export class InsufficientIntelligenceNetworkError extends Error {
  constructor(
    observerNationId: NationId,
    targetNationId: NationId,
    required: string,
  ) {
    super(
      `Insufficient intelligence network for observer "${observerNationId}" / target "${targetNationId}": required ${required}`,
    );
    this.name = "InsufficientIntelligenceNetworkError";
  }
}
