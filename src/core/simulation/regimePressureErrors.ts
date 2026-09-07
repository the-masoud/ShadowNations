import type { NationId } from "../model/nation.js";

export class FriendlyDiplomaticRelationshipError extends Error {
  constructor(actorNationId: NationId, targetNationId: NationId) {
    super(
      `Cannot apply regime pressure: diplomacy between "${actorNationId}" and "${targetNationId}" must not be friendly`,
    );
    this.name = "FriendlyDiplomaticRelationshipError";
  }
}

export class MaximumNationRegimePressureError extends Error {
  constructor(sourceNationId: NationId, targetNationId: NationId) {
    super(
      `Regime pressure already at maximum for pair "${sourceNationId}" -> "${targetNationId}"`,
    );
    this.name = "MaximumNationRegimePressureError";
  }
}
