import Phaser from "phaser";
import type { GameState } from "../../core/model/gameState.js";
import type { GameEvent } from "../../core/model/gameEvent.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import { executeTurnResolution } from "./executeTurnResolution.js";
import {
  createTurnResolutionPresentationModel,
} from "./turnResolutionPresentation.js";

export function renderTurnResolution(
  scene: Phaser.Scene,
  state: Readonly<GameState>,
  pendingEvents: readonly GameEvent[],
  onContinue: (nextState: GameState) => void,
): void {
  validateGameState(state);

  const endTurnText = scene.add.text(992, 680, "END TURN", {
    fontFamily: "Arial, sans-serif",
    fontSize: "13px",
    color: "#f5f7fa",
    backgroundColor: "#263244",
    fontStyle: "bold",
    padding: { left: 12, right: 12, top: 8, bottom: 8 },
  });
  endTurnText.setOrigin(1, 0.5);
  endTurnText.setInteractive({ useHandCursor: true });

  const container = scene.add.container(0, 0);
  container.setVisible(false);

  const bg = scene.add.rectangle(640, 384, 1280, 768, 0x0b1019, 1);
  bg.setInteractive();
  container.add(bg);

  const titleText = scene.add.text(640, 70, "TURN RESOLUTION", {
    fontFamily: "Arial, sans-serif",
    fontSize: "28px",
    color: "#e2e8f0",
    fontStyle: "bold",
  });
  titleText.setOrigin(0.5, 0.5);
  container.add(titleText);

  const summaryText = scene.add.text(640, 112, "", {
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    color: "#c3ccd8",
  });
  summaryText.setOrigin(0.5, 0.5);
  container.add(summaryText);

  const eventsHeading = scene.add.text(240, 160, "", {
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    color: "#7f8da1",
    fontStyle: "bold",
  });
  eventsHeading.setOrigin(0, 0.5);
  container.add(eventsHeading);

  const eventTexts: Phaser.GameObjects.Text[] = [];

  const continueText = scene.add.text(640, 700, "CONTINUE", {
    fontFamily: "Arial, sans-serif",
    fontSize: "13px",
    color: "#f5f7fa",
    backgroundColor: "#263244",
    fontStyle: "bold",
    padding: { left: 12, right: 12, top: 8, bottom: 8 },
  });
  continueText.setOrigin(0.5, 0.5);
  continueText.setInteractive({ useHandCursor: true });
  container.add(continueText);

  let resolvedState: GameState | null = null;

  endTurnText.on("pointerdown", () => {
    const execution = executeTurnResolution(state);
    const model = createTurnResolutionPresentationModel(
      pendingEvents,
      execution.result,
    );

    summaryText.setText(
      `TURN ${model.previousTurn} -> TURN ${model.nextTurn}`,
    );
    eventsHeading.setText(`EVENTS  ${model.eventCount}`);

    for (const t of eventTexts) {
      t.destroy();
    }
    eventTexts.length = 0;

    for (let i = 0; i < model.events.length; i++) {
      const idx = String(i + 1).padStart(2, "0");
      const t = scene.add.text(240, 200 + i * 30, `${idx}  ${model.events[i].label}`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        color: "#d7dee8",
      });
      t.setOrigin(0, 0.5);
      container.add(t);
      eventTexts.push(t);
    }

    continueText.setText(`CONTINUE TO TURN ${model.nextTurn}`);

    resolvedState = execution.state;
    endTurnText.setVisible(false);
    container.setVisible(true);
  });

  continueText.on("pointerdown", () => {
    if (resolvedState) {
      onContinue(resolvedState);
    }
  });
}
