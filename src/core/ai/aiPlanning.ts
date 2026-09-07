import type { NationId } from "../model/nation.js";
import type { AiPerception } from "./aiPerception.js";
import type { AiPersonality } from "./aiPersonality.js";

export type AiPlanningDomain = "diplomacy" | "intelligence";

export interface AiPlan {
  readonly observerNationId: NationId;
  readonly turn: number;
  readonly domain: AiPlanningDomain;
  readonly targetNationId: NationId;
}

export class AiPlanningObserverMismatchError extends Error {
  constructor(observerNationId: NationId, personalityNationId: NationId) {
    super(
      `Observer mismatch: perception observer "${observerNationId}" does not match personality nation "${personalityNationId}"`,
    );
    this.name = "AiPlanningObserverMismatchError";
  }
}

export class AiPlanningPhaseError extends Error {
  constructor(phase: string) {
    super(
      `Invalid phase for planning: expected "planning", got "${phase}"`,
    );
    this.name = "AiPlanningPhaseError";
  }
}

export class AiPlanningNoTargetError extends Error {
  constructor() {
    super("No foreign nations available for targeting");
    this.name = "AiPlanningNoTargetError";
  }
}

function diplomacyDomainScore(personality: Readonly<AiPersonality>): number {
  return personality.diplomacyAffinity + personality.caution;
}

function intelligenceDomainScore(personality: Readonly<AiPersonality>): number {
  return personality.intelligenceAffinity + personality.assertiveness;
}

function diplomacyTargetScore(target: {
  readonly diplomaticStatus: "friendly" | "neutral" | "hostile";
  readonly observerInfluence: number;
}): number {
  let statusScore: number;
  if (target.diplomaticStatus === "hostile") {
    statusScore = 30;
  } else if (target.diplomaticStatus === "neutral") {
    statusScore = 15;
  } else {
    statusScore = 0;
  }
  return statusScore + Math.floor(target.observerInfluence / 10);
}

function intelligenceTargetScore(target: {
  readonly visibility: "unknown" | "limited" | "known";
  readonly intelligenceNetworkLevel: "none" | "foothold" | "established" | "deep";
  readonly defensiveAwareness: "unaware" | "suspected" | "identified";
}): number {
  let visScore: number;
  if (target.visibility === "unknown") {
    visScore = 30;
  } else if (target.visibility === "limited") {
    visScore = 15;
  } else {
    visScore = 0;
  }

  let netScore: number;
  if (target.intelligenceNetworkLevel === "none") {
    netScore = 20;
  } else if (target.intelligenceNetworkLevel === "foothold") {
    netScore = 10;
  } else if (target.intelligenceNetworkLevel === "established") {
    netScore = 5;
  } else {
    netScore = 0;
  }

  let awareScore: number;
  if (target.defensiveAwareness === "unaware") {
    awareScore = 0;
  } else if (target.defensiveAwareness === "suspected") {
    awareScore = 10;
  } else {
    awareScore = 20;
  }

  return visScore + netScore + awareScore;
}

export function createAiPlan(
  perception: Readonly<AiPerception>,
  personality: Readonly<AiPersonality>,
): AiPlan {
  if (personality.nationId !== perception.observerNationId) {
    throw new AiPlanningObserverMismatchError(
      perception.observerNationId,
      personality.nationId,
    );
  }

  if (perception.phase !== "planning") {
    throw new AiPlanningPhaseError(perception.phase);
  }

  if (perception.foreignNations.length === 0) {
    throw new AiPlanningNoTargetError();
  }

  const dScore = diplomacyDomainScore(personality);
  const iScore = intelligenceDomainScore(personality);
  const domain: AiPlanningDomain =
    dScore >= iScore ? "diplomacy" : "intelligence";

  let bestTargetId = perception.foreignNations[0].nationId;
  let bestScore = -1;

  for (const target of perception.foreignNations) {
    const score =
      domain === "diplomacy"
        ? diplomacyTargetScore(target)
        : intelligenceTargetScore(target);
    if (score > bestScore) {
      bestScore = score;
      bestTargetId = target.nationId;
    }
  }

  return {
    observerNationId: perception.observerNationId,
    turn: perception.turn,
    domain,
    targetNationId: bestTargetId,
  };
}
