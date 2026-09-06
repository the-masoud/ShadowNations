import type { Nation, NationId } from "./nation.js";

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
}

export function createInitialWorldState(): WorldState {
  return {
    nations: [
      { id: "solaris", name: "Solaris", code: "SOL" },
      { id: "dravos", name: "Dravos", code: "DRA" },
      { id: "norvia", name: "Norvia", code: "NOR" },
      { id: "veloria", name: "Veloria", code: "VEL" },
      { id: "karsen", name: "Karsen", code: "KAR" },
      { id: "arkania", name: "Arkania", code: "ARK" },
    ],
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
}
