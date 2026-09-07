import type { NationId } from "../model/nation.js";
import type { AiPerception, AiPerceivedStrategicStats } from "./aiPerception.js";
import type { AiPlan } from "./aiPlanning.js";
import {
  CULTIVATE_POLITICAL_INFLUENCE_AP_COST,
} from "../simulation/cultivatePoliticalInfluence.js";
import {
  DIPLOMATIC_OUTREACH_AP_COST,
} from "../simulation/conductDiplomaticOutreach.js";
import {
  STABILIZE_GOVERNMENT_AP_COST,
} from "../simulation/stabilizeGovernment.js";

export type AiDiplomaticAction =
  | "cultivate-political-influence"
  | "conduct-diplomatic-outreach"
  | "stabilize-government"
  | "pass";

export interface AiDiplomacyDecision {
  readonly observerNationId: NationId;
  readonly turn: number;
  readonly targetNationId: NationId;
  readonly action: AiDiplomaticAction;
}

export class AiDiplomacyPlanDomainError extends Error {
  constructor(domain: string) {
    super(
      `Invalid plan domain for diplomacy: expected "diplomacy", got "${domain}"`,
    );
    this.name = "AiDiplomacyPlanDomainError";
  }
}

export class AiDiplomacyObserverMismatchError extends Error {
  constructor(observerNationId: NationId, planObserverNationId: NationId) {
    super(
      `Observer mismatch: plan observer "${planObserverNationId}" does not match perception observer "${observerNationId}"`,
    );
    this.name = "AiDiplomacyObserverMismatchError";
  }
}

export class AiDiplomacyTurnMismatchError extends Error {
  constructor(planTurn: number, perceptionTurn: number) {
    super(
      `Turn mismatch: plan turn ${planTurn} does not match perception turn ${perceptionTurn}`,
    );
    this.name = "AiDiplomacyTurnMismatchError";
  }
}

export class AiDiplomacyPhaseError extends Error {
  constructor(phase: string) {
    super(
      `Invalid phase for diplomacy decision: expected "planning", got "${phase}"`,
    );
    this.name = "AiDiplomacyPhaseError";
  }
}

export class AiDiplomacyTargetNotPerceivedError extends Error {
  constructor(targetNationId: NationId) {
    super(
      `Target nation "${targetNationId}" not found in perception foreign nations`,
    );
    this.name = "AiDiplomacyTargetNotPerceivedError";
  }
}

function stabilityKnownBelowMaximum(
  stats: AiPerceivedStrategicStats,
): boolean {
  if (stats.kind === "exact") {
    return stats.stability < 100;
  }
  if (stats.kind === "limited") {
    return stats.stability === "low" || stats.stability === "medium";
  }
  return false;
}

function selectAction(
  diplomaticStatus: "friendly" | "neutral" | "hostile",
  observerInfluence: number,
  strategicStats: AiPerceivedStrategicStats,
  remainingAp: number,
): AiDiplomaticAction {
  if (diplomaticStatus === "hostile") {
    if (observerInfluence >= 30) {
      if (remainingAp >= DIPLOMATIC_OUTREACH_AP_COST) {
        return "conduct-diplomatic-outreach";
      }
      return "pass";
    }
    if (remainingAp >= CULTIVATE_POLITICAL_INFLUENCE_AP_COST) {
      return "cultivate-political-influence";
    }
    return "pass";
  }

  if (diplomaticStatus === "neutral") {
    if (observerInfluence >= 30) {
      if (remainingAp >= DIPLOMATIC_OUTREACH_AP_COST) {
        return "conduct-diplomatic-outreach";
      }
      return "pass";
    }
    if (remainingAp >= CULTIVATE_POLITICAL_INFLUENCE_AP_COST) {
      return "cultivate-political-influence";
    }
    return "pass";
  }

  if (
    observerInfluence >= 40 &&
    stabilityKnownBelowMaximum(strategicStats)
  ) {
    if (remainingAp >= STABILIZE_GOVERNMENT_AP_COST) {
      return "stabilize-government";
    }
    return "pass";
  }

  if (observerInfluence < 100) {
    if (remainingAp >= CULTIVATE_POLITICAL_INFLUENCE_AP_COST) {
      return "cultivate-political-influence";
    }
    return "pass";
  }

  return "pass";
}

export function createAiDiplomacyDecision(
  perception: Readonly<AiPerception>,
  plan: Readonly<AiPlan>,
): AiDiplomacyDecision {
  if (plan.domain !== "diplomacy") {
    throw new AiDiplomacyPlanDomainError(plan.domain);
  }

  if (plan.observerNationId !== perception.observerNationId) {
    throw new AiDiplomacyObserverMismatchError(
      perception.observerNationId,
      plan.observerNationId,
    );
  }

  if (plan.turn !== perception.turn) {
    throw new AiDiplomacyTurnMismatchError(plan.turn, perception.turn);
  }

  if (perception.phase !== "planning") {
    throw new AiDiplomacyPhaseError(perception.phase);
  }

  const target = perception.foreignNations.find(
    (f) => f.nationId === plan.targetNationId,
  );
  if (!target) {
    throw new AiDiplomacyTargetNotPerceivedError(plan.targetNationId);
  }

  const action = selectAction(
    target.diplomaticStatus,
    target.observerInfluence,
    target.strategicStats,
    perception.actionPoints.remaining,
  );

  return {
    observerNationId: perception.observerNationId,
    turn: perception.turn,
    targetNationId: plan.targetNationId,
    action,
  };
}
