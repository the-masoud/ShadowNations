import Phaser from "phaser";
import type { GameState } from "../../core/model/gameState.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import { createIntelligenceDashboardModel } from "./intelligenceDashboardPresentation.js";

const TARGET_ROW_Y: readonly number[] = [610, 642, 674, 706, 738];

export function renderIntelligenceDashboard(
  scene: Phaser.Scene,
  state: Readonly<GameState>,
): void {
  validateGameState(state);

  const model = createIntelligenceDashboardModel(state);

  if (model.targets.length !== 5) {
    throw new Error(
      `Intelligence dashboard requires exactly 5 foreign targets, got ${model.targets.length}`,
    );
  }

  const g = scene.add.graphics();

  g.lineStyle(1, 0x2f3c4f, 1);
  g.lineBetween(1024, 520, 1280, 520);

  scene.add
    .text(1048, 540, "INTELLIGENCE", {
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      color: "#d7dee8",
      fontStyle: "bold",
    })
    .setOrigin(0, 0.5);

  scene.add
    .text(1048, 562, `${model.observerNationName.toUpperCase()} / ${model.observerNationCode}`, {
      fontFamily: "Arial, sans-serif",
      fontSize: "11px",
      color: "#aeb9c7",
    })
    .setOrigin(0, 0.5);

  scene.add
    .text(
      1048,
      580,
      `AGENTS  ${model.agentCount}   ASSETS  ${model.ownedAssetCount}   DOUBLES  ${model.controlledDoubleAgentCount}`,
      {
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
        color: "#c3ccd8",
      },
    )
    .setOrigin(0, 0.5);

  for (let i = 0; i < model.targets.length; i++) {
    const target = model.targets[i];
    const rowY = TARGET_ROW_Y[i];

    g.fillStyle(target.targetColor, 1);
    g.fillCircle(1049, rowY, 5);

    scene.add
      .text(
        1062,
        rowY - 5,
        `${target.targetNationCode}  VIS ${target.visibility.toUpperCase()}  NET ${target.networkLevel.toUpperCase()}`,
        {
          fontFamily: "Arial, sans-serif",
          fontSize: "10px",
          color: "#e2e8f0",
        },
      )
      .setOrigin(0, 0.5);

    scene.add
      .text(
        1062,
        rowY + 8,
        `ASSETS ${target.ownedAssetCount}  CI ${target.defensiveAwareness.toUpperCase()}`,
        {
          fontFamily: "Arial, sans-serif",
          fontSize: "9px",
          color: "#8996a8",
        },
      )
      .setOrigin(0, 0.5);
  }
}
