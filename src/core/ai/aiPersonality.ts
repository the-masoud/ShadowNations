import type { NationId } from "../model/nation.js";

export interface AiPersonality {
  readonly nationId: NationId;
  readonly assertiveness: number;
  readonly caution: number;
  readonly diplomacyAffinity: number;
  readonly intelligenceAffinity: number;
}

export class UnknownAiPersonalityError extends Error {
  constructor(nationId: NationId) {
    super(`Unknown AI personality for nation: "${nationId}"`);
    this.name = "UnknownAiPersonalityError";
  }
}

export function getAiPersonality(nationId: NationId): AiPersonality {
  switch (nationId) {
    case "solaris":
      return {
        nationId: "solaris",
        assertiveness: 55,
        caution: 50,
        diplomacyAffinity: 75,
        intelligenceAffinity: 65,
      };
    case "dravos":
      return {
        nationId: "dravos",
        assertiveness: 80,
        caution: 40,
        diplomacyAffinity: 25,
        intelligenceAffinity: 70,
      };
    case "norvia":
      return {
        nationId: "norvia",
        assertiveness: 35,
        caution: 75,
        diplomacyAffinity: 80,
        intelligenceAffinity: 45,
      };
    case "veloria":
      return {
        nationId: "veloria",
        assertiveness: 50,
        caution: 60,
        diplomacyAffinity: 85,
        intelligenceAffinity: 60,
      };
    case "karsen":
      return {
        nationId: "karsen",
        assertiveness: 70,
        caution: 45,
        diplomacyAffinity: 40,
        intelligenceAffinity: 75,
      };
    case "arkania":
      return {
        nationId: "arkania",
        assertiveness: 60,
        caution: 65,
        diplomacyAffinity: 55,
        intelligenceAffinity: 80,
      };
    default:
      throw new UnknownAiPersonalityError(nationId);
  }
}
