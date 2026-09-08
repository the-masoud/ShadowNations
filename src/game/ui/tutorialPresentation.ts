export type TutorialStepId =
  | "mission"
  | "map"
  | "intelligence"
  | "operations"
  | "turns";

export interface TutorialStepModel {
  readonly id: TutorialStepId;
  readonly title: string;
  readonly body: string;
}

export interface TutorialPresentationModel {
  readonly stepIndex: number;
  readonly stepCount: number;
  readonly step: TutorialStepModel;
  readonly primaryActionLabel: "NEXT" | "START PLAYING";
}

const TUTORIAL_STEPS: readonly TutorialStepModel[] = [
  {
    id: "mission",
    title: "YOUR MISSION",
    body: "Build influence of at least 75 over every foreign nation to achieve Strategic Hegemony. If your Stability, Public Support, or Internal Security reaches 0, the campaign is lost.",
  },
  {
    id: "map",
    title: "READ THE MAP",
    body: "Select regions on the Strategic Map to inspect ownership and national strategic stats. The right-side panel shows region, nation, territory, and intelligence information.",
  },
  {
    id: "intelligence",
    title: "BUILD INTELLIGENCE",
    body: "Use the Intelligence Dashboard and Conspiracy Board to track visibility, intelligence networks, agents, assets, double agents, and counterintelligence awareness.",
  },
  {
    id: "operations",
    title: "PLAN OPERATIONS",
    body: "Open the Operation Planner to conduct intelligence and political operations. Actions spend Action Points, and each nation begins a new turn with 6 AP.",
  },
  {
    id: "turns",
    title: "ADVANCE THE CAMPAIGN",
    body: "Use END TURN to advance the campaign and review Turn Resolution. Every third new turn triggers a deterministic campaign crisis that reduces one player strategic stat by 5.",
  },
];

export function createTutorialPresentationModel(
  stepIndex: number,
): TutorialPresentationModel {
  if (!Number.isInteger(stepIndex)) {
    throw new RangeError("Tutorial step index must be an integer.");
  }

  if (stepIndex < 0 || stepIndex >= TUTORIAL_STEPS.length) {
    throw new RangeError(
      `Tutorial step index out of range: ${stepIndex}.`,
    );
  }

  return {
    stepIndex,
    stepCount: 5,
    step: { ...TUTORIAL_STEPS[stepIndex] },
    primaryActionLabel: stepIndex === 4 ? "START PLAYING" : "NEXT",
  };
}
