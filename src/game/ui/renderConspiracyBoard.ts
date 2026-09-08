import Phaser from "phaser";
import type { GameState } from "../../core/model/gameState.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import { createConspiracyBoardModel } from "./conspiracyBoardPresentation.js";
import { getStrategicMapNationColor } from "../map/strategicMapPresentation.js";

const TARGET_POSITIONS: readonly { x: number; y: number }[] = [
  { x: 220, y: 180 },
  { x: 512, y: 145 },
  { x: 804, y: 180 },
  { x: 760, y: 500 },
  { x: 264, y: 500 },
];

function networkLineStyle(level: string): { width: number; alpha: number } {
  switch (level) {
    case "none":
      return { width: 1, alpha: 0.2 };
    case "foothold":
      return { width: 2, alpha: 0.45 };
    case "established":
      return { width: 3, alpha: 0.7 };
    case "deep":
      return { width: 4, alpha: 0.95 };
    default:
      return { width: 1, alpha: 0.2 };
  }
}

export function renderConspiracyBoard(
  scene: Phaser.Scene,
  state: Readonly<GameState>,
): void {
  validateGameState(state);

  const model = createConspiracyBoardModel(state);

  if (model.targets.length !== 5) {
    throw new Error(
      `Conspiracy board requires exactly 5 foreign targets, got ${model.targets.length}`,
    );
  }

  const boardContainer = scene.add.container(0, 0);

  const launcher = scene.add
    .text(24, 24, "CONSPIRACY BOARD", {
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      color: "#d7dee8",
      backgroundColor: "#111827",
      padding: { left: 10, right: 10, top: 6, bottom: 6 },
    })
    .setOrigin(0, 0)
    .setInteractive({ useHandCursor: true });

  launcher.on("pointerdown", () => {
    launcher.setVisible(false);
    boardContainer.setVisible(true);
  });

  const bg = scene.add.rectangle(512, 384, 1024, 768, 0x0b1019, 1);
  bg.setInteractive();
  boardContainer.add(bg);

  const g = scene.add.graphics();
  boardContainer.add(g);

  const playerX = 512;
  const playerY = 360;

  for (let i = 0; i < model.targets.length; i++) {
    const target = model.targets[i];
    const pos = TARGET_POSITIONS[i];
    const style = networkLineStyle(target.networkLevel);
    g.lineStyle(style.width, target.targetColor, style.alpha);
    g.lineBetween(playerX, playerY, pos.x, pos.y);
  }

  const playerColor = getStrategicMapNationColor(model.observerNationId);
  g.fillStyle(0x172033, 1);
  g.fillCircle(playerX, playerY, 52);
  g.lineStyle(3, playerColor, 1);
  g.strokeCircle(playerX, playerY, 52);

  for (let i = 0; i < model.targets.length; i++) {
    const target = model.targets[i];
    const pos = TARGET_POSITIONS[i];
    g.fillStyle(0x121a26, 1);
    g.fillCircle(pos.x, pos.y, 42);
    g.lineStyle(2, target.targetColor, 1);
    g.strokeCircle(pos.x, pos.y, 42);
  }

  const agentCount = model.agents.length;
  for (let i = 0; i < agentCount; i++) {
    const cardCenterX = 512 + (i - (agentCount - 1) / 2) * 180;
    const cardCenterY = 660;
    g.fillStyle(0x151d2a, 1);
    g.fillRect(cardCenterX - 75, cardCenterY - 24, 150, 48);
    g.lineStyle(1, 0x3c4a60, 1);
    g.strokeRect(cardCenterX - 75, cardCenterY - 24, 150, 48);
  }

  const playerCode = scene.add
    .text(playerX, 350, model.observerNationCode, {
      fontFamily: "Arial, sans-serif",
      fontSize: "18px",
      color: "#f5f7fa",
      fontStyle: "bold",
    })
    .setOrigin(0.5, 0.5);
  boardContainer.add(playerCode);

  const playerLabel = scene.add
    .text(playerX, 374, "PLAYER", {
      fontFamily: "Arial, sans-serif",
      fontSize: "10px",
      color: "#8f9caf",
    })
    .setOrigin(0.5, 0.5);
  boardContainer.add(playerLabel);

  for (let i = 0; i < model.targets.length; i++) {
    const target = model.targets[i];
    const pos = TARGET_POSITIONS[i];

    const code = scene.add
      .text(pos.x, pos.y - 7, target.targetNationCode, {
        fontFamily: "Arial, sans-serif",
        fontSize: "15px",
        color: "#f5f7fa",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5);
    boardContainer.add(code);

    const name = scene.add
      .text(pos.x, pos.y + 14, target.targetNationName, {
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
        color: "#aeb9c7",
      })
      .setOrigin(0.5, 0.5);
    boardContainer.add(name);

    const statusLine1 = scene.add
      .text(
        pos.x,
        pos.y + 55,
        `VIS ${target.visibility.toUpperCase()}   NET ${target.networkLevel.toUpperCase()}`,
        {
          fontFamily: "Arial, sans-serif",
          fontSize: "9px",
          color: "#c3ccd8",
        },
      )
      .setOrigin(0.5, 0.5);
    boardContainer.add(statusLine1);

    const statusLine2 = scene.add
      .text(
        pos.x,
        pos.y + 70,
        `ASSETS ${target.ownedAssetCount}   DOUBLES ${target.controlledDoubleAgentCount}`,
        {
          fontFamily: "Arial, sans-serif",
          fontSize: "9px",
          color: "#8996a8",
        },
      )
      .setOrigin(0.5, 0.5);
    boardContainer.add(statusLine2);
  }

  const fieldAgentsHeading = scene.add
    .text(512, 610, "FIELD AGENTS", {
      fontFamily: "Arial, sans-serif",
      fontSize: "11px",
      color: "#7f8da1",
      fontStyle: "bold",
    })
    .setOrigin(0.5, 0.5);
  boardContainer.add(fieldAgentsHeading);

  for (let i = 0; i < agentCount; i++) {
    const agent = model.agents[i];
    const cardCenterX = 512 + (i - (agentCount - 1) / 2) * 180;

    const codename = scene.add
      .text(cardCenterX, 653, agent.codename.toUpperCase(), {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        color: "#e2e8f0",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5);
    boardContainer.add(codename);

    const agentId = scene.add
      .text(cardCenterX, 670, agent.agentId, {
        fontFamily: "Arial, sans-serif",
        fontSize: "9px",
        color: "#8996a8",
      })
      .setOrigin(0.5, 0.5);
    boardContainer.add(agentId);
  }

  const boardTitle = scene.add
    .text(512, 38, "CONSPIRACY BOARD", {
      fontFamily: "Arial, sans-serif",
      fontSize: "26px",
      color: "#e2e8f0",
      fontStyle: "bold",
    })
    .setOrigin(0.5, 0.5);
  boardContainer.add(boardTitle);

  const boardSubtitle = scene.add
    .text(512, 66, "PLAYER INTELLIGENCE NETWORK", {
      fontFamily: "Arial, sans-serif",
      fontSize: "11px",
      color: "#7f8da1",
    })
    .setOrigin(0.5, 0.5);
  boardContainer.add(boardSubtitle);

  const close = scene.add
    .text(976, 24, "CLOSE", {
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      color: "#d7dee8",
      backgroundColor: "#111827",
      padding: { left: 10, right: 10, top: 6, bottom: 6 },
    })
    .setOrigin(1, 0)
    .setInteractive({ useHandCursor: true });

  close.on("pointerdown", () => {
    boardContainer.setVisible(false);
    launcher.setVisible(true);
  });
  boardContainer.add(close);

  boardContainer.setVisible(false);
}
