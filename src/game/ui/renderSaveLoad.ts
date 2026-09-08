import Phaser from "phaser";
import type { GameState } from "../../core/model/gameState.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import {
  saveGameState,
  loadGameState,
} from "../save/saveGame.js";

export function renderSaveLoad(
  scene: Phaser.Scene,
  state: Readonly<GameState>,
  onLoad: (loadedState: GameState) => void,
): void {
  validateGameState(state);

  const launcher = scene.add
    .text(680, 24, "SAVE / LOAD", {
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      color: "#d7dee8",
      backgroundColor: "#111827",
      padding: { left: 10, right: 10, top: 6, bottom: 6 },
    })
    .setOrigin(0, 0)
    .setInteractive({ useHandCursor: true });

  const container = scene.add.container(0, 0);

  const bg = scene.add.rectangle(512, 384, 1024, 768, 0x0d131d, 1);
  bg.setInteractive();
  container.add(bg);

  const title = scene.add
    .text(512, 80, "SAVE / LOAD", {
      fontFamily: "Arial, sans-serif",
      fontSize: "26px",
      color: "#e2e8f0",
      fontStyle: "bold",
    })
    .setOrigin(0.5, 0.5);
  container.add(title);

  const saveText = scene.add
    .text(512, 280, "SAVE CAMPAIGN", {
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      color: "#f5f7fa",
      backgroundColor: "#263244",
      fontStyle: "bold",
      padding: { left: 16, right: 16, top: 9, bottom: 9 },
    })
    .setOrigin(0.5, 0.5)
    .setInteractive({ useHandCursor: true });
  container.add(saveText);

  const loadText = scene.add
    .text(512, 360, "LOAD CAMPAIGN", {
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      color: "#f5f7fa",
      backgroundColor: "#263244",
      fontStyle: "bold",
      padding: { left: 16, right: 16, top: 9, bottom: 9 },
    })
    .setOrigin(0.5, 0.5)
    .setInteractive({ useHandCursor: true });
  container.add(loadText);

  const statusText = scene.add
    .text(512, 440, "READY", {
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      color: "#aeb9c7",
    })
    .setOrigin(0.5, 0.5);
  container.add(statusText);

  const policyNote = scene.add
    .text(512, 500, "GAMEPLAY STATE ONLY — TRANSIENT UI STATE IS NOT SAVED", {
      fontFamily: "Arial, sans-serif",
      fontSize: "11px",
      color: "#7f8da1",
    })
    .setOrigin(0.5, 0.5);
  container.add(policyNote);

  const closeText = scene.add
    .text(976, 24, "CLOSE", {
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      color: "#d7dee8",
      backgroundColor: "#111827",
      padding: { left: 10, right: 10, top: 6, bottom: 6 },
    })
    .setOrigin(1, 0)
    .setInteractive({ useHandCursor: true });
  container.add(closeText);

  saveText.on("pointerdown", () => {
    try {
      saveGameState(window.localStorage, state);
      statusText.setText("SAVED");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      statusText.setText(`ERROR: ${message}`);
    }
  });

  loadText.on("pointerdown", () => {
    try {
      const loaded = loadGameState(window.localStorage);
      if (loaded === null) {
        statusText.setText("NO SAVED CAMPAIGN");
      } else {
        onLoad(loaded);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      statusText.setText(`ERROR: ${message}`);
    }
  });

  closeText.on("pointerdown", () => {
    container.setVisible(false);
    launcher.setVisible(true);
  });

  launcher.on("pointerdown", () => {
    launcher.setVisible(false);
    container.setVisible(true);
    statusText.setText("READY");
  });

  container.setVisible(false);
}
