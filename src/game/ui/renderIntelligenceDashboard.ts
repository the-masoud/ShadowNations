import Phaser from "phaser";
import type { GameState } from "../../core/model/gameState.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import { createIntelligenceDashboardModel } from "./intelligenceDashboardPresentation.js";
import { COLORS, FONT_FAMILY, drawDivider } from "./visualTheme.js";

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

  drawDivider(g, 1024, 520, 256);

  scene.add
    .text(1048, 540, "INTELLIGENCE", {
      fontFamily: FONT_FAMILY,
      fontSize: "16px",
      color: COLORS.titleText,
      fontStyle: "bold",
    })
    .setOrigin(0, 0.5);

  scene.add
    .text(1048, 562, `${model.observerNationName.toUpperCase()} / ${model.observerNationCode}`, {
      fontFamily: FONT_FAMILY,
      fontSize: "11px",
      color: COLORS.secondaryText,
    })
    .setOrigin(0, 0.5);

  scene.add
    .text(
      1048,
      580,
      `AGENTS  ${model.agentCount}   ASSETS  ${model.ownedAssetCount}   DOUBLES  ${model.controlledDoubleAgentCount}`,
      {
        fontFamily: FONT_FAMILY,
        fontSize: "10px",
        color: COLORS.bodyText,
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
          fontFamily: FONT_FAMILY,
          fontSize: "10px",
          color: COLORS.headerText,
        },
      )
      .setOrigin(0, 0.5);

    scene.add
      .text(
        1062,
        rowY + 8,
        `ASSETS ${target.ownedAssetCount}  CI ${target.defensiveAwareness.toUpperCase()}`,
        {
          fontFamily: FONT_FAMILY,
          fontSize: "9px",
          color: COLORS.mutedText,
        },
      )
      .setOrigin(0, 0.5);
  }
}
