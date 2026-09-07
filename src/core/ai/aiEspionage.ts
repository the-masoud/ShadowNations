import type { NationId } from "../model/nation.js";
import type { CovertSabotageObjective } from "../model/covertSabotage.js";
import type { AiPerception, AiPerceivedStrategicStats } from "./aiPerception.js";
import type { AiPlan } from "./aiPlanning.js";
import { BUILD_NETWORK_AP_COST } from "../simulation/buildIntelligenceNetwork.js";
import { GATHER_INTELLIGENCE_AP_COST } from "../simulation/gatherIntelligence.js";
import { COUNTERINTELLIGENCE_SWEEP_AP_COST } from "../simulation/runCounterintelligenceSweep.js";
import { COVERT_SABOTAGE_AP_COST } from "../simulation/conductCovertSabotage.js";

export type AiEspionageAction =
  | "build-intelligence-network"
  | "gather-intelligence"
  | "counterintelligence-sweep"
  | "conduct-covert-sabotage"
  | "pass";

export interface AiEspionageDecision {
  readonly observerNationId: NationId;
  readonly turn: number;
  readonly targetNationId: NationId;
  readonly action: AiEspionageAction;
  readonly sabotageObjective: CovertSabotageObjective | null;
}

export class AiEspionagePlanDomainError extends Error {
  constructor(domain: string) {
    super(
      `Invalid plan domain for espionage: expected "intelligence", got "${domain}"`,
    );
    this.name = "AiEspionagePlanDomainError";
  }
}

export class AiEspionageObserverMismatchError extends Error {
  constructor(observerNationId: NationId, planObserverNationId: NationId) {
    super(
      `Observer mismatch: plan observer "${planObserverNationId}" does not match perception observer "${observerNationId}"`,
    );
    this.name = "AiEspionageObserverMismatchError";
  }
}

export class AiEspionageTurnMismatchError extends Error {
  constructor(planTurn: number, perceptionTurn: number) {
    super(
      `Turn mismatch: plan turn ${planTurn} does not match perception turn ${perceptionTurn}`,
    );
    this.name = "AiEspionageTurnMismatchError";
  }
}

export class AiEspionagePhaseError extends Error {
  constructor(phase: string) {
    super(
      `Invalid phase for espionage decision: expected "planning", got "${phase}"`,
    );
    this.name = "AiEspionagePhaseError";
  }
}

export class AiEspionageTargetNotPerceivedError extends Error {
  constructor(targetNationId: NationId) {
    super(
      `Target nation "${targetNationId}" not found in perception foreign nations`,
    );
    this.name = "AiEspionageTargetNotPerceivedError";
  }
}

function selectAction(
  visibility: "unknown" | "limited" | "known",
  strategicStats: AiPerceivedStrategicStats,
  networkLevel: "none" | "foothold" | "established" | "deep",
  defensiveAwareness: "unaware" | "suspected" | "identified",
  remainingAp: number,
): { action: AiEspionageAction; sabotageObjective: CovertSabotageObjective | null } {
  // Rule 1: Suspected defensive awareness
  if (defensiveAwareness === "suspected") {
    if (remainingAp >= COUNTERINTELLIGENCE_SWEEP_AP_COST) {
      return { action: "counterintelligence-sweep", sabotageObjective: null };
    }
    return { action: "pass", sabotageObjective: null };
  }

  // Rule 2: Weak intelligence network
  if (networkLevel === "none" || networkLevel === "foothold") {
    if (remainingAp >= BUILD_NETWORK_AP_COST) {
      return { action: "build-intelligence-network", sabotageObjective: null };
    }
    return { action: "pass", sabotageObjective: null };
  }

  // Rule 3: Insufficient visibility with established/deep network
  if (
    (networkLevel === "established" || networkLevel === "deep") &&
    (visibility === "unknown" || visibility === "limited")
  ) {
    if (remainingAp >= GATHER_INTELLIGENCE_AP_COST) {
      return { action: "gather-intelligence", sabotageObjective: null };
    }
    return { action: "pass", sabotageObjective: null };
  }

  // Rule 4: Known visibility with established network → deepen
  if (visibility === "known" && networkLevel === "established") {
    if (remainingAp >= BUILD_NETWORK_AP_COST) {
      return { action: "build-intelligence-network", sabotageObjective: null };
    }
    return { action: "pass", sabotageObjective: null };
  }

  // Rule 5: Known visibility with deep network + exact stats → sabotage evaluation
  if (
    visibility === "known" &&
    networkLevel === "deep" &&
    strategicStats.kind === "exact"
  ) {
    if (strategicStats.internalSecurity > 0) {
      if (remainingAp >= COVERT_SABOTAGE_AP_COST) {
        return {
          action: "conduct-covert-sabotage",
          sabotageObjective: "internal-security",
        };
      }
      return { action: "pass", sabotageObjective: null };
    }

    if (strategicStats.publicSupport > 0) {
      if (remainingAp >= COVERT_SABOTAGE_AP_COST) {
        return {
          action: "conduct-covert-sabotage",
          sabotageObjective: "public-support",
        };
      }
      return { action: "pass", sabotageObjective: null };
    }

    return { action: "pass", sabotageObjective: null };
  }

  return { action: "pass", sabotageObjective: null };
}

export function createAiEspionageDecision(
  perception: Readonly<AiPerception>,
  plan: Readonly<AiPlan>,
): AiEspionageDecision {
  if (plan.domain !== "intelligence") {
    throw new AiEspionagePlanDomainError(plan.domain);
  }

  if (plan.observerNationId !== perception.observerNationId) {
    throw new AiEspionageObserverMismatchError(
      perception.observerNationId,
      plan.observerNationId,
    );
  }

  if (plan.turn !== perception.turn) {
    throw new AiEspionageTurnMismatchError(plan.turn, perception.turn);
  }

  if (perception.phase !== "planning") {
    throw new AiEspionagePhaseError(perception.phase);
  }

  const target = perception.foreignNations.find(
    (f) => f.nationId === plan.targetNationId,
  );
  if (!target) {
    throw new AiEspionageTargetNotPerceivedError(plan.targetNationId);
  }

  const result = selectAction(
    target.visibility,
    target.strategicStats,
    target.intelligenceNetworkLevel,
    target.defensiveAwareness,
    perception.actionPoints.remaining,
  );

  return {
    observerNationId: perception.observerNationId,
    turn: perception.turn,
    targetNationId: plan.targetNationId,
    action: result.action,
    sabotageObjective: result.sabotageObjective,
  };
}
