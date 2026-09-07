import type { CovertSabotageObjective } from "../model/covertSabotage.js";

export class InvalidCovertSabotageObjectiveError extends Error {
  constructor(objective: string) {
    super(
      `Invalid covert sabotage objective: expected "internal-security" or "public-support", got "${objective}"`,
    );
    this.name = "InvalidCovertSabotageObjectiveError";
  }
}

export class MinimumCovertSabotageTargetStatError extends Error {
  constructor(
    targetNationId: string,
    objective: CovertSabotageObjective,
  ) {
    super(
      `Cannot sabotage "${objective}" for nation "${targetNationId}": target stat is already at minimum (0)`,
    );
    this.name = "MinimumCovertSabotageTargetStatError";
  }
}
