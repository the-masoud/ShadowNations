import { describe, it, expect } from "vitest";
import {
  createTutorialPresentationModel,
} from "../../src/game/ui/tutorialPresentation.js";

describe("tutorialPresentation", () => {
  // A — exact top-level keys
  it("A: exact top-level keys", () => {
    const model = createTutorialPresentationModel(0);
    expect(Object.keys(model)).toEqual([
      "stepIndex",
      "stepCount",
      "step",
      "primaryActionLabel",
    ]);
  });

  // B — exact step keys
  it("B: exact step keys", () => {
    const model = createTutorialPresentationModel(0);
    expect(Object.keys(model.step)).toEqual(["id", "title", "body"]);
  });

  // C — five-step canonical order
  it("C: five-step canonical order", () => {
    const ids = ["mission", "map", "intelligence", "operations", "turns"];
    for (let i = 0; i < 5; i++) {
      const model = createTutorialPresentationModel(i);
      expect(model.step.id).toBe(ids[i]);
      expect(model.stepCount).toBe(5);
    }
  });

  // D — exact titles
  it("D: exact titles", () => {
    const titles = [
      "YOUR MISSION",
      "READ THE MAP",
      "BUILD INTELLIGENCE",
      "PLAN OPERATIONS",
      "ADVANCE THE CAMPAIGN",
    ];
    for (let i = 0; i < 5; i++) {
      const model = createTutorialPresentationModel(i);
      expect(model.step.title).toBe(titles[i]);
    }
  });

  // E — exact bodies
  it("E: exact bodies", () => {
    const bodies = [
      "Build influence of at least 75 over every foreign nation to achieve Strategic Hegemony. If your Stability, Public Support, or Internal Security reaches 0, the campaign is lost.",
      "Select regions on the Strategic Map to inspect ownership and national strategic stats. The right-side panel shows region, nation, territory, and intelligence information.",
      "Use the Intelligence Dashboard and Conspiracy Board to track visibility, intelligence networks, agents, assets, double agents, and counterintelligence awareness.",
      "Open the Operation Planner to conduct intelligence and political operations. Actions spend Action Points, and each nation begins a new turn with 6 AP.",
      "Use END TURN to advance the campaign and review Turn Resolution. Every third new turn triggers a deterministic campaign crisis that reduces one player strategic stat by 5.",
    ];
    for (let i = 0; i < 5; i++) {
      const model = createTutorialPresentationModel(i);
      expect(model.step.body).toBe(bodies[i]);
    }
  });

  // F — primary-action labels
  it("F: primary-action labels", () => {
    for (let i = 0; i < 4; i++) {
      const model = createTutorialPresentationModel(i);
      expect(model.primaryActionLabel).toBe("NEXT");
    }
    const finalModel = createTutorialPresentationModel(4);
    expect(finalModel.primaryActionLabel).toBe("START PLAYING");
  });

  // G — negative range validation
  it("G: negative range validation", () => {
    expect(() => createTutorialPresentationModel(-1)).toThrow(
      "Tutorial step index out of range: -1.",
    );
  });

  // H — upper range validation
  it("H: upper range validation", () => {
    expect(() => createTutorialPresentationModel(5)).toThrow(
      "Tutorial step index out of range: 5.",
    );
  });

  // I — non-integer validation
  it("I: non-integer validation", () => {
    expect(() => createTutorialPresentationModel(1.5)).toThrow(
      "Tutorial step index must be an integer.",
    );
  });

  // J — NaN validation
  it("J: NaN validation", () => {
    expect(() => createTutorialPresentationModel(NaN)).toThrow(
      "Tutorial step index must be an integer.",
    );
  });

  // K — positive Infinity validation
  it("K: positive Infinity validation", () => {
    expect(() => createTutorialPresentationModel(Infinity)).toThrow(
      "Tutorial step index must be an integer.",
    );
  });

  // L — freshness
  it("L: freshness", () => {
    const a = createTutorialPresentationModel(2);
    const b = createTutorialPresentationModel(2);
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(a.step).not.toBe(b.step);
  });
});
