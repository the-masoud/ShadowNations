import Phaser from "phaser";
import { createTutorialPresentationModel } from "./tutorialPresentation.js";

export function renderTutorial(
  scene: Phaser.Scene,
  showTutorial: boolean,
): void {
  if (!showTutorial) {
    return;
  }

  let stepIndex = 0;
  const model = createTutorialPresentationModel(stepIndex);

  const tutorialContainer = scene.add.container(0, 0);

  const bg = scene.add.rectangle(640, 384, 1280, 768, 0x0b1019, 0.96);
  bg.setInteractive();
  tutorialContainer.add(bg);

  const headerText = scene.add.text(640, 72, "FIELD BRIEFING", {
    fontFamily: "Arial, sans-serif",
    fontSize: "28px",
    color: "#e2e8f0",
    fontStyle: "bold",
  });
  headerText.setOrigin(0.5, 0.5);
  tutorialContainer.add(headerText);

  const stepTitleText = scene.add.text(640, 170, model.step.title, {
    fontFamily: "Arial, sans-serif",
    fontSize: "22px",
    color: "#f5f7fa",
    fontStyle: "bold",
  });
  stepTitleText.setOrigin(0.5, 0.5);
  tutorialContainer.add(stepTitleText);

  const stepBodyText = scene.add.text(640, 320, model.step.body, {
    fontFamily: "Arial, sans-serif",
    fontSize: "16px",
    color: "#c3ccd8",
    align: "center",
    wordWrap: { width: 700 },
    lineSpacing: 8,
  });
  stepBodyText.setOrigin(0.5, 0.5);
  tutorialContainer.add(stepBodyText);

  const progressText = scene.add.text(640, 520, `STEP ${model.stepIndex + 1} OF ${model.stepCount}`, {
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    color: "#7f8da1",
    fontStyle: "bold",
  });
  progressText.setOrigin(0.5, 0.5);
  tutorialContainer.add(progressText);

  const primaryActionText = scene.add.text(640, 610, model.primaryActionLabel, {
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    color: "#f5f7fa",
    backgroundColor: "#263244",
    fontStyle: "bold",
    padding: { left: 16, right: 16, top: 9, bottom: 9 },
  });
  primaryActionText.setOrigin(0.5, 0.5);
  primaryActionText.setInteractive({ useHandCursor: true });
  tutorialContainer.add(primaryActionText);

  const skipText = scene.add.text(640, 670, "SKIP TUTORIAL", {
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    color: "#8f9caf",
  });
  skipText.setOrigin(0.5, 0.5);
  skipText.setInteractive({ useHandCursor: true });
  tutorialContainer.add(skipText);

  skipText.on("pointerdown", () => {
    tutorialContainer.setVisible(false);
  });

  primaryActionText.on("pointerdown", () => {
    if (stepIndex < 4) {
      stepIndex++;
      const updated = createTutorialPresentationModel(stepIndex);
      stepTitleText.setText(updated.step.title);
      stepBodyText.setText(updated.step.body);
      progressText.setText(`STEP ${updated.stepIndex + 1} OF ${updated.stepCount}`);
      primaryActionText.setText(updated.primaryActionLabel);
    } else {
      tutorialContainer.setVisible(false);
    }
  });
}
