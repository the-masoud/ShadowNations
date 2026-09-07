export class ProxyConflictValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProxyConflictValidationError";
  }
}

export class UnknownProxyConflictError extends Error {
  constructor(conflictId: string) {
    super(`Unknown proxy conflict: "${conflictId}"`);
    this.name = "UnknownProxyConflictError";
  }
}

export class DuplicateProxyConflictIdError extends Error {
  constructor(conflictId: string) {
    super(`Duplicate proxy conflict ID: "${conflictId}"`);
    this.name = "DuplicateProxyConflictIdError";
  }
}

export class DuplicateProxyConflictError extends Error {
  constructor(hostNationId: string, nationAId: string, nationBId: string) {
    super(
      `Duplicate proxy conflict for host "${hostNationId}" with sponsors "${nationAId}" / "${nationBId}"`,
    );
    this.name = "DuplicateProxyConflictError";
  }
}

export class InvalidProxyConflictParticipantsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidProxyConflictParticipantsError";
  }
}

export class InvalidProxyConflictIdError extends Error {
  constructor(conflictId: string) {
    super(
      `Invalid proxy conflict ID: "${conflictId}" (must be non-empty after trim)`,
    );
    this.name = "InvalidProxyConflictIdError";
  }
}

export class InvalidProxyConflictIntensityError extends Error {
  constructor(intensity: string) {
    super(
      `Invalid proxy conflict intensity: expected "low", "medium", or "high", got "${intensity}"`,
    );
    this.name = "InvalidProxyConflictIntensityError";
  }
}

export class InsufficientProxyConflictInfluenceError extends Error {
  constructor(actorNationId: string, hostNationId: string, required: number, actual: number) {
    super(
      `Insufficient influence for proxy conflict: nation "${actorNationId}" needs ${required} influence on host "${hostNationId}", has ${actual}`,
    );
    this.name = "InsufficientProxyConflictInfluenceError";
  }
}

export class NonHostileProxyConflictRivalryError extends Error {
  constructor(actorNationId: string, rivalNationId: string) {
    super(
      `Cannot start proxy conflict: diplomacy between "${actorNationId}" and "${rivalNationId}" must be hostile`,
    );
    this.name = "NonHostileProxyConflictRivalryError";
  }
}

export class HostTooStableForProxyConflictError extends Error {
  constructor(hostNationId: string, stability: number) {
    super(
      `Cannot start proxy conflict: host "${hostNationId}" stability ${stability} exceeds maximum threshold`,
    );
    this.name = "HostTooStableForProxyConflictError";
  }
}

export class ProxyConflictParticipationError extends Error {
  constructor(actorNationId: string, conflictId: string) {
    super(
      `Nation "${actorNationId}" is not a participant in proxy conflict "${conflictId}"`,
    );
    this.name = "ProxyConflictParticipationError";
  }
}

export class MaximumProxyConflictIntensityError extends Error {
  constructor(conflictId: string) {
    super(
      `Proxy conflict "${conflictId}" is already at maximum intensity`,
    );
    this.name = "MaximumProxyConflictIntensityError";
  }
}
