import type { GameState } from "../model/gameState.js";
import type { ProxyConflict, ProxyConflictIntensity } from "../model/proxyConflict.js";
import { VALID_PROXY_CONFLICT_INTENSITIES } from "../model/proxyConflict.js";
import { getNationById } from "../model/worldState.js";
import { validateGameState } from "./validateGameState.js";
import {
  InvalidProxyConflictIdError,
  InvalidProxyConflictParticipantsError,
  InvalidProxyConflictIntensityError,
  DuplicateProxyConflictIdError,
  DuplicateProxyConflictError,
  ProxyConflictValidationError,
} from "./proxyConflictErrors.js";

function isValidIntensity(intensity: string): intensity is ProxyConflictIntensity {
  return (VALID_PROXY_CONFLICT_INTENSITIES as readonly string[]).includes(intensity);
}

function normalizeSponsorPair(
  world: { readonly nations: readonly { readonly id: string }[] },
  nationAId: string,
  nationBId: string,
): { a: string; b: string } {
  const indexA = world.nations.findIndex((n) => n.id === nationAId);
  const indexB = world.nations.findIndex((n) => n.id === nationBId);
  if (indexA <= indexB) {
    return { a: nationAId, b: nationBId };
  }
  return { a: nationBId, b: nationAId };
}

export function addProxyConflict(
  state: Readonly<GameState>,
  conflict: ProxyConflict,
): GameState {
  if (conflict.id.trim().length === 0) {
    throw new InvalidProxyConflictIdError(conflict.id);
  }

  getNationById(state.world, conflict.hostNationId);
  getNationById(state.world, conflict.nationAId);
  getNationById(state.world, conflict.nationBId);

  if (
    conflict.hostNationId === conflict.nationAId ||
    conflict.hostNationId === conflict.nationBId ||
    conflict.nationAId === conflict.nationBId
  ) {
    throw new InvalidProxyConflictParticipantsError(
      `Proxy conflict "${conflict.id}": host, nationA and nationB must all be distinct`,
    );
  }

  const canonical = normalizeSponsorPair(state.world, conflict.nationAId, conflict.nationBId);
  if (conflict.nationAId !== canonical.a || conflict.nationBId !== canonical.b) {
    throw new ProxyConflictValidationError(
      `Proxy conflict "${conflict.id}": sponsor pair "${conflict.nationAId}" / "${conflict.nationBId}" is not in canonical order`,
    );
  }

  if (!isValidIntensity(conflict.intensity)) {
    throw new InvalidProxyConflictIntensityError(conflict.intensity);
  }

  if (state.world.proxyConflicts.some((c) => c.id === conflict.id)) {
    throw new DuplicateProxyConflictIdError(conflict.id);
  }

  const hostPairKey = `${conflict.hostNationId}|${conflict.nationAId}|${conflict.nationBId}`;
  const hostPairReverseKey = `${conflict.hostNationId}|${conflict.nationBId}|${conflict.nationAId}`;
  if (
    state.world.proxyConflicts.some((c) => {
      const key = `${c.hostNationId}|${c.nationAId}|${c.nationBId}`;
      const reverseKey = `${c.hostNationId}|${c.nationBId}|${c.nationAId}`;
      return key === hostPairKey || reverseKey === hostPairReverseKey;
    })
  ) {
    throw new DuplicateProxyConflictError(
      conflict.hostNationId,
      conflict.nationAId,
      conflict.nationBId,
    );
  }

  validateGameState(state);

  const newState: GameState = {
    ...state,
    world: {
      ...state.world,
      proxyConflicts: [...state.world.proxyConflicts, conflict],
    },
  };

  validateGameState(newState);

  return newState;
}
