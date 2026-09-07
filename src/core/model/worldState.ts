import type { Nation, NationId } from "./nation.js";
import type { RegionOwnership } from "./regionOwnership.js";
import { createInitialStrategicMap } from "./strategicMap.js";
import type { StrategicMap } from "./strategicMap.js";
import { createInitialNationStrategicStats, validateNationStrategicStats, type NationStrategicStats } from "./nationStrategicStats.js";
import { createInitialNationInfluence, validateNationInfluence, type NationInfluence } from "./nationInfluence.js";

export class UnknownNationError extends Error {
  constructor(nationId: NationId) {
    super(`Unknown nation: "${nationId}"`);
    this.name = "UnknownNationError";
  }
}

export class WorldValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorldValidationError";
  }
}

export interface WorldState {
  readonly nations: readonly Nation[];
  readonly map: StrategicMap;
  readonly regionOwnership: readonly RegionOwnership[];
  readonly nationStrategicStats: readonly NationStrategicStats[];
  readonly nationInfluence: readonly NationInfluence[];
}

export function createInitialWorldState(): WorldState {
  const nations: readonly Nation[] = [
    { id: "solaris", name: "Solaris", code: "SOL" },
    { id: "dravos", name: "Dravos", code: "DRA" },
    { id: "norvia", name: "Norvia", code: "NOR" },
    { id: "veloria", name: "Veloria", code: "VEL" },
    { id: "karsen", name: "Karsen", code: "KAR" },
    { id: "arkania", name: "Arkania", code: "ARK" },
  ];
  return {
    nations,
    map: createInitialStrategicMap(),
    regionOwnership: [
      { regionId: "sunreach", ownerNationId: "solaris" },
      { regionId: "auric-basin", ownerNationId: "solaris" },
      { regionId: "helion-coast", ownerNationId: "solaris" },
      { regionId: "ironvale", ownerNationId: "dravos" },
      { regionId: "blackridge", ownerNationId: "dravos" },
      { regionId: "varkesh", ownerNationId: "dravos" },
      { regionId: "northwatch", ownerNationId: "norvia" },
      { regionId: "frostmere", ownerNationId: "norvia" },
      { regionId: "silverplain", ownerNationId: "veloria" },
      { regionId: "velis", ownerNationId: "veloria" },
      { regionId: "meridian", ownerNationId: "karsen" },
      { regionId: "blueharbor", ownerNationId: "veloria" },
      { regionId: "karsk", ownerNationId: "karsen" },
      { regionId: "red-steppe", ownerNationId: "karsen" },
      { regionId: "stonegate", ownerNationId: "norvia" },
      { regionId: "arka", ownerNationId: "arkania" },
      { regionId: "duskfall", ownerNationId: "arkania" },
      { regionId: "eastern-reach", ownerNationId: "arkania" },
    ],
    nationStrategicStats: createInitialNationStrategicStats(nations),
    nationInfluence: createInitialNationInfluence(nations),
  };
}

export function getNationById(
  world: Readonly<WorldState>,
  nationId: NationId,
): Nation {
  const nation = world.nations.find((n) => n.id === nationId);
  if (!nation) {
    throw new UnknownNationError(nationId);
  }
  return nation;
}

export function validateWorldState(world: Readonly<WorldState>): void {
  const ids = new Set<string>();
  const codes = new Set<string>();

  for (const nation of world.nations) {
    if (nation.id === "") {
      throw new WorldValidationError("Empty nation ID");
    }
    if (nation.name === "") {
      throw new WorldValidationError(`Empty nation name for id "${nation.id}"`);
    }
    if (nation.code === "") {
      throw new WorldValidationError(`Empty nation code for id "${nation.id}"`);
    }
    if (ids.has(nation.id)) {
      throw new WorldValidationError(`Duplicate nation ID: "${nation.id}"`);
    }
    if (codes.has(nation.code)) {
      throw new WorldValidationError(
        `Duplicate nation code: "${nation.code}" for nation "${nation.id}"`,
      );
    }
    ids.add(nation.id);
    codes.add(nation.code);
  }

  validateNationStrategicStats(world);
  validateNationInfluence(world);
}
