import type { GameState } from "../model/gameState.js";
import type { NationId } from "../model/nation.js";
import type { DiplomaticStatus } from "../model/diplomaticRelationship.js";
import {
  getDiplomaticRelationship,
  normalizeDiplomaticPair,
  SelfDiplomaticRelationshipError,
  InvalidDiplomaticStatusError,
  VALID_DIPLOMATIC_STATUSES,
} from "../model/diplomaticRelationship.js";
import { UnknownNationError } from "../model/worldState.js";
import { validateGameState } from "./validateGameState.js";

export {
  SelfDiplomaticRelationshipError,
  MissingDiplomaticRelationshipError,
  InvalidDiplomaticStatusError,
} from "../model/diplomaticRelationship.js";

export function setDiplomaticStatus(
  state: Readonly<GameState>,
  firstNationId: NationId,
  secondNationId: NationId,
  status: DiplomaticStatus,
): GameState {
  const firstNation = state.world.nations.find(
    (n) => n.id === firstNationId,
  );
  if (!firstNation) {
    throw new UnknownNationError(firstNationId);
  }

  const secondNation = state.world.nations.find(
    (n) => n.id === secondNationId,
  );
  if (!secondNation) {
    throw new UnknownNationError(secondNationId);
  }

  if (firstNationId === secondNationId) {
    throw new SelfDiplomaticRelationshipError(firstNationId);
  }

  const { nationAId, nationBId } = normalizeDiplomaticPair(
    state.world,
    firstNationId,
    secondNationId,
  );

  const currentEntry = getDiplomaticRelationship(
    state.world,
    firstNationId,
    secondNationId,
  );

  if (!(VALID_DIPLOMATIC_STATUSES as readonly string[]).includes(status)) {
    throw new InvalidDiplomaticStatusError(status);
  }

  validateGameState(state);

  if (currentEntry.status === status) {
    return state;
  }

  const updatedEntry = {
    nationAId,
    nationBId,
    status,
  } as const;

  const newRelationships = state.world.diplomaticRelationships.map((e) =>
    e.nationAId === nationAId && e.nationBId === nationBId ? updatedEntry : e,
  );

  return {
    ...state,
    world: {
      ...state.world,
      diplomaticRelationships: newRelationships,
    },
  };
}
