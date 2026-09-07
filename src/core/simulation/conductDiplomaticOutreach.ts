import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { DiplomaticStatus } from "../model/diplomaticRelationship.js";
import type { OperationResult } from "../model/operationResult.js";
import type { DiplomaticOutreachConductedEvent } from "../model/gameEvent.js";
import { getNationById } from "../model/worldState.js";
import { getNationInfluence } from "../model/nationInfluence.js";
import { getDiplomaticRelationship } from "../model/diplomaticRelationship.js";
import { setDiplomaticStatus } from "./setDiplomaticStatus.js";
import { spendActionPoints } from "./spendActionPoints.js";
import { validateGameState } from "./validateGameState.js";
import { InvalidPhaseError } from "./resolveTurn.js";
import {
  SelfTargetPoliticalOperationError,
  InsufficientPoliticalInfluenceError,
  MaximumDiplomaticRelationshipError,
} from "./politicalOperationErrors.js";

export {
  SelfTargetPoliticalOperationError,
  InsufficientPoliticalInfluenceError,
  MaximumDiplomaticRelationshipError,
} from "./politicalOperationErrors.js";

export const DIPLOMATIC_OUTREACH_AP_COST = 2;
export const DIPLOMATIC_OUTREACH_MINIMUM_INFLUENCE = 30;

function getNextDiplomaticStatus(
  current: DiplomaticStatus,
): DiplomaticStatus {
  if (current === "hostile") return "neutral";
  if (current === "neutral") return "friendly";
  return current;
}

export function conductDiplomaticOutreach(
  state: Readonly<GameState>,
  actorNationId: NationId,
  targetNationId: NationId,
): OperationResult<DiplomaticOutreachConductedEvent> {
  getNationById(state.world, actorNationId);
  getNationById(state.world, targetNationId);

  if (actorNationId === targetNationId) {
    throw new SelfTargetPoliticalOperationError(actorNationId);
  }

  const currentInfluence = getNationInfluence(
    state.world,
    actorNationId,
    targetNationId,
  );

  const currentRelationship = getDiplomaticRelationship(
    state.world,
    actorNationId,
    targetNationId,
  );

  validateGameState(state);

  if (state.phase !== "planning") {
    throw new InvalidPhaseError("planning", state.phase);
  }

  if (currentInfluence.value < DIPLOMATIC_OUTREACH_MINIMUM_INFLUENCE) {
    throw new InsufficientPoliticalInfluenceError(
      actorNationId,
      targetNationId,
      DIPLOMATIC_OUTREACH_MINIMUM_INFLUENCE,
      currentInfluence.value,
    );
  }

  if (currentRelationship.status === "friendly") {
    throw new MaximumDiplomaticRelationshipError(actorNationId, targetNationId);
  }

  const spentState = spendActionPoints(
    state,
    actorNationId,
    DIPLOMATIC_OUTREACH_AP_COST,
  );

  const newStatus = getNextDiplomaticStatus(currentRelationship.status);

  const resultingState = setDiplomaticStatus(
    spentState,
    actorNationId,
    targetNationId,
    newStatus,
  );

  return {
    state: resultingState,
    event: {
      type: "diplomatic-outreach-conducted",
      turn: state.turn,
      actorNationId,
      targetNationId,
      previousStatus: currentRelationship.status,
      newStatus,
      actionPointCost: DIPLOMATIC_OUTREACH_AP_COST,
    },
  };
}
