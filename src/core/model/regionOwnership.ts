import type { Nation, NationId } from "./nation.js";
import type { RegionId } from "./region.js";
import { getRegionById } from "./strategicMap.js";
import type { WorldState } from "./worldState.js";

export interface RegionOwnership {
  readonly regionId: RegionId;
  readonly ownerNationId: NationId;
}

export class MissingRegionOwnershipError extends Error {
  constructor(regionId: RegionId) {
    super(`Missing ownership for region: "${regionId}"`);
    this.name = "MissingRegionOwnershipError";
  }
}

export class OwnershipValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OwnershipValidationError";
  }
}

export function getRegionOwnership(
  world: Readonly<WorldState>,
  regionId: RegionId,
): RegionOwnership {
  getRegionById(world.map, regionId);
  const entry = world.regionOwnership.find((o) => o.regionId === regionId);
  if (!entry) {
    throw new MissingRegionOwnershipError(regionId);
  }
  return entry;
}

export function getRegionOwnerNation(
  world: Readonly<WorldState>,
  regionId: RegionId,
): Nation {
  const ownership = getRegionOwnership(world, regionId);
  return world.nations.find((n) => n.id === ownership.ownerNationId)!;
}

export function getNationOwnedRegionIds(
  world: Readonly<WorldState>,
  nationId: NationId,
): readonly RegionId[] {
  return world.regionOwnership
    .filter((o) => o.ownerNationId === nationId)
    .map((o) => o.regionId);
}

export function validateRegionOwnership(world: Readonly<WorldState>): void {
  const regionIds = new Set(world.map.regions.map((r) => r.id));
  const nationIds = new Set(world.nations.map((n) => n.id));
  const seenRegions = new Set<string>();

  for (const entry of world.regionOwnership) {
    if (seenRegions.has(entry.regionId)) {
      throw new OwnershipValidationError(
        `Duplicate ownership for region: "${entry.regionId}"`,
      );
    }
    seenRegions.add(entry.regionId);

    if (!regionIds.has(entry.regionId)) {
      throw new OwnershipValidationError(
        `Ownership references unknown region: "${entry.regionId}"`,
      );
    }

    if (!nationIds.has(entry.ownerNationId)) {
      throw new OwnershipValidationError(
        `Ownership references unknown nation: "${entry.ownerNationId}" for region "${entry.regionId}"`,
      );
    }
  }

  for (const region of world.map.regions) {
    if (!seenRegions.has(region.id)) {
      throw new OwnershipValidationError(
        `Missing ownership for map region: "${region.id}"`,
      );
    }
  }
}
