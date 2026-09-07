import type { NationId } from "../model/nation.js";
import type { CovertSabotageObjective } from "../model/covertSabotage.js";
import type { GameState } from "../model/gameState.js";
import type { AiDiplomaticAction } from "./aiDiplomacy.js";
import type { AiEspionageAction } from "./aiEspionage.js";
import { createAiPerception } from "./aiPerception.js";
import { getAiPersonality } from "./aiPersonality.js";
import { createAiPlan } from "./aiPlanning.js";
import { createAiDiplomacyDecision } from "./aiDiplomacy.js";
import { createAiEspionageDecision } from "./aiEspionage.js";
import { validateGameState } from "../simulation/validateGameState.js";

export type AiSimulationDecision =
  | {
      readonly observerNationId: NationId;
      readonly turn: number;
      readonly domain: "diplomacy";
      readonly targetNationId: NationId;
      readonly action: AiDiplomaticAction;
      readonly sabotageObjective: null;
    }
  | {
      readonly observerNationId: NationId;
      readonly turn: number;
      readonly domain: "intelligence";
      readonly targetNationId: NationId;
      readonly action: AiEspionageAction;
      readonly sabotageObjective: CovertSabotageObjective | null;
    };

export interface AiSimulationSnapshot {
  readonly turn: number;
  readonly phase: "planning";
  readonly decisions: readonly AiSimulationDecision[];
}

export class AiSimulationPhaseError extends Error {
  constructor(phase: string) {
    super(
      `Invalid phase for simulation snapshot: expected "planning", got "${phase}"`,
    );
    this.name = "AiSimulationPhaseError";
  }
}

function normalizeDecision(
  decision: { readonly observerNationId: NationId; readonly turn: number; readonly targetNationId: NationId },
  domain: "diplomacy" | "intelligence",
  action: AiDiplomaticAction | AiEspionageAction,
  sabotageObjective: CovertSabotageObjective | null,
): AiSimulationDecision {
  if (domain === "diplomacy") {
    return {
      observerNationId: decision.observerNationId,
      turn: decision.turn,
      domain: "diplomacy",
      targetNationId: decision.targetNationId,
      action: action as AiDiplomaticAction,
      sabotageObjective: null,
    };
  }
  return {
    observerNationId: decision.observerNationId,
    turn: decision.turn,
    domain: "intelligence",
    targetNationId: decision.targetNationId,
    action: action as AiEspionageAction,
    sabotageObjective,
  };
}

export function createAiSimulationSnapshot(
  state: Readonly<GameState>,
): AiSimulationSnapshot {
  validateGameState(state);

  if (state.phase !== "planning") {
    throw new AiSimulationPhaseError(state.phase);
  }

  const decisions: AiSimulationDecision[] = [];

  for (const nation of state.world.nations) {
    const perception = createAiPerception(state, nation.id);
    const personality = getAiPersonality(nation.id);
    const plan = createAiPlan(perception, personality);

    if (plan.domain === "diplomacy") {
      const decision = createAiDiplomacyDecision(perception, plan);
      decisions.push(
        normalizeDecision(decision, "diplomacy", decision.action, null),
      );
    } else {
      const decision = createAiEspionageDecision(perception, plan);
      decisions.push(
        normalizeDecision(
          decision,
          "intelligence",
          decision.action,
          decision.sabotageObjective,
        ),
      );
    }
  }

  return {
    turn: state.turn,
    phase: "planning",
    decisions,
  };
}
