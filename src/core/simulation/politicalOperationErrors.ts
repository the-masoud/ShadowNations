import type { NationId } from "../model/nation.js";

export class SelfTargetPoliticalOperationError extends Error {
  constructor(actorNationId: NationId) {
    super(
      `Self-target political operation not allowed: actor "${actorNationId}" cannot target itself`,
    );
    this.name = "SelfTargetPoliticalOperationError";
  }
}

export class InsufficientPoliticalInfluenceError extends Error {
  constructor(
    actorNationId: NationId,
    targetNationId: NationId,
    required: number,
    available: number,
  ) {
    super(
      `Insufficient political influence for operation from "${actorNationId}" to "${targetNationId}": required ${required}, available ${available}`,
    );
    this.name = "InsufficientPoliticalInfluenceError";
  }
}

export class MaximumPoliticalInfluenceError extends Error {
  constructor(actorNationId: NationId, targetNationId: NationId) {
    super(
      `Political influence already at maximum for pair "${actorNationId}" -> "${targetNationId}"`,
    );
    this.name = "MaximumPoliticalInfluenceError";
  }
}

export class MaximumDiplomaticRelationshipError extends Error {
  constructor(actorNationId: NationId, targetNationId: NationId) {
    super(
      `Diplomatic relationship already at maximum for pair "${actorNationId}" / "${targetNationId}"`,
    );
    this.name = "MaximumDiplomaticRelationshipError";
  }
}

export class HostileDiplomaticRelationshipError extends Error {
  constructor(actorNationId: NationId, targetNationId: NationId) {
    super(
      `Cannot stabilize government with hostile diplomatic relationship between "${actorNationId}" and "${targetNationId}"`,
    );
    this.name = "HostileDiplomaticRelationshipError";
  }
}

export class MaximumNationStabilityError extends Error {
  constructor(nationId: NationId) {
    super(
      `Nation stability already at maximum for nation "${nationId}"`,
    );
    this.name = "MaximumNationStabilityError";
  }
}
