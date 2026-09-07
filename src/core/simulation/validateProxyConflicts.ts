import type { WorldState } from "../model/worldState.js";
import type { ProxyConflictIntensity } from "../model/proxyConflict.js";
import { VALID_PROXY_CONFLICT_INTENSITIES } from "../model/proxyConflict.js";
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
  world: Readonly<WorldState>,
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

export function validateProxyConflicts(world: Readonly<WorldState>): void {
  const nationIds = new Set<string>();
  for (const nation of world.nations) {
    nationIds.add(nation.id);
  }

  const seenIds = new Set<string>();
  const seenHostPairs = new Set<string>();

  for (const conflict of world.proxyConflicts) {
    if (conflict.id.trim().length === 0) {
      throw new InvalidProxyConflictIdError(conflict.id);
    }

    if (!nationIds.has(conflict.hostNationId)) {
      throw new ProxyConflictValidationError(
        `Proxy conflict "${conflict.id}" references unknown host nation: "${conflict.hostNationId}"`,
      );
    }

    if (!nationIds.has(conflict.nationAId)) {
      throw new ProxyConflictValidationError(
        `Proxy conflict "${conflict.id}" references unknown nationA: "${conflict.nationAId}"`,
      );
    }

    if (!nationIds.has(conflict.nationBId)) {
      throw new ProxyConflictValidationError(
        `Proxy conflict "${conflict.id}" references unknown nationB: "${conflict.nationBId}"`,
      );
    }

    if (
      conflict.hostNationId === conflict.nationAId ||
      conflict.hostNationId === conflict.nationBId ||
      conflict.nationAId === conflict.nationBId
    ) {
      throw new InvalidProxyConflictParticipantsError(
        `Proxy conflict "${conflict.id}": host, nationA and nationB must all be distinct`,
      );
    }

    const canonical = normalizeSponsorPair(world, conflict.nationAId, conflict.nationBId);
    if (conflict.nationAId !== canonical.a || conflict.nationBId !== canonical.b) {
      throw new ProxyConflictValidationError(
        `Proxy conflict "${conflict.id}": sponsor pair "${conflict.nationAId}" / "${conflict.nationBId}" is not in canonical order`,
      );
    }

    if (!isValidIntensity(conflict.intensity)) {
      throw new InvalidProxyConflictIntensityError(conflict.intensity);
    }

    if (seenIds.has(conflict.id)) {
      throw new DuplicateProxyConflictIdError(conflict.id);
    }
    seenIds.add(conflict.id);

    const hostPairKey = `${conflict.hostNationId}|${conflict.nationAId}|${conflict.nationBId}`;
    const hostPairReverseKey = `${conflict.hostNationId}|${conflict.nationBId}|${conflict.nationAId}`;
    if (seenHostPairs.has(hostPairKey) || seenHostPairs.has(hostPairReverseKey)) {
      throw new DuplicateProxyConflictError(
        conflict.hostNationId,
        conflict.nationAId,
        conflict.nationBId,
      );
    }
    seenHostPairs.add(hostPairKey);
    seenHostPairs.add(hostPairReverseKey);
  }
}
