export const STRATEGIC_HEGEMONY_INFLUENCE_THRESHOLD = 75;
export const NATIONAL_COLLAPSE_THRESHOLD = 0;

export type CampaignOutcome =
  | {
      readonly status: "ongoing";
    }
  | {
      readonly status: "victory";
      readonly reason: "strategic-hegemony";
    }
  | {
      readonly status: "defeat";
      readonly reason:
        | "stability-collapse"
        | "public-support-collapse"
        | "internal-security-collapse";
    };
