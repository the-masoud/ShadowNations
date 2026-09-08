import Phaser from "phaser";
import type { NationId } from "../../core/model/nation.js";
import type { CampaignSetupPresentationModel } from "../ui/campaignSetupPresentation.js";
import { createCampaignGameState } from "../../core/simulation/createCampaignGameState.js";
import { createCampaignSetupPresentationModel } from "../ui/campaignSetupPresentation.js";

const CARD_POSITIONS: readonly { x: number; y: number }[] = [
  { x: 320, y: 260 },
  { x: 640, y: 260 },
  { x: 960, y: 260 },
  { x: 320, y: 450 },
  { x: 640, y: 450 },
  { x: 960, y: 450 },
];

export class CampaignSetupScene extends Phaser.Scene {
  private selectedNationId: NationId = "solaris";

  constructor() {
    super({ key: "CampaignSetupScene" });
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0a0e17");

    this.add
      .text(640, 70, "SHADOW NATIONS", {
        fontFamily: "Arial, sans-serif",
        fontSize: "34px",
        color: "#e2e8f0",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(640, 112, "SELECT YOUR NATION", {
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#8f9caf",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5);

    const model = createCampaignSetupPresentationModel(this.selectedNationId);

    const cardRects: Phaser.GameObjects.Rectangle[] = [];
    const cardStrokes: Phaser.GameObjects.Graphics[] = [];

    for (let i = 0; i < model.nations.length; i++) {
      const nation = model.nations[i];
      const pos = CARD_POSITIONS[i];

      const rect = this.add.rectangle(pos.x, pos.y, 250, 130, 0x111827, 1);
      rect.setInteractive({ useHandCursor: true });
      cardRects.push(rect);

      const stroke = this.add.graphics();
      cardStrokes.push(stroke);

      this.add
        .text(pos.x, pos.y - 28, nation.nationName, {
          fontFamily: "Arial, sans-serif",
          fontSize: "18px",
          color: "#f5f7fa",
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0.5);

      this.add
        .text(pos.x, pos.y - 2, nation.nationCode, {
          fontFamily: "Arial, sans-serif",
          fontSize: "11px",
          color: "#aeb9c7",
        })
        .setOrigin(0.5, 0.5);

      this.add
        .text(
          pos.x,
          pos.y + 34,
          `STB ${nation.stability}   SUP ${nation.publicSupport}   SEC ${nation.internalSecurity}`,
          {
            fontFamily: "Arial, sans-serif",
            fontSize: "11px",
            color: "#8f9caf",
          },
        )
        .setOrigin(0.5, 0.5);
    }

    const summaryText = this.add
      .text(640, 565, `SELECTED: ${model.nations[0].nationName.toUpperCase()} / ${model.nations[0].nationCode}`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#d7dee8",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5);

    const startText = this.add
      .text(640, 640, "START CAMPAIGN", {
        fontFamily: "Arial, sans-serif",
        fontSize: "15px",
        color: "#f5f7fa",
        backgroundColor: "#263244",
        fontStyle: "bold",
        padding: { left: 16, right: 16, top: 10, bottom: 10 },
      })
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });

    startText.on("pointerdown", () => {
      const state = createCampaignGameState({
        playerNationId: this.selectedNationId,
      });
      this.scene.start("MainScene", { state });
    });

    for (let i = 0; i < cardRects.length; i++) {
      const idx = i;
      cardRects[i].on("pointerdown", () => {
        this.selectedNationId = model.nations[idx].nationId;
        const updatedModel = createCampaignSetupPresentationModel(this.selectedNationId);
        this.refreshCards(cardStrokes, updatedModel);
        const selected = updatedModel.nations.find((n) => n.selected)!;
        summaryText.setText(
          `SELECTED: ${selected.nationName.toUpperCase()} / ${selected.nationCode}`,
        );
      });
    }

    this.refreshCards(cardStrokes, model);
  }

  private refreshCards(
    strokes: Phaser.GameObjects.Graphics[],
    model: CampaignSetupPresentationModel,
  ): void {
    for (let i = 0; i < model.nations.length; i++) {
      const nation = model.nations[i];
      const pos = CARD_POSITIONS[i];
      strokes[i].clear();
      if (nation.selected) {
        strokes[i].lineStyle(3, nation.nationColor, 1);
      } else {
        strokes[i].lineStyle(1, 0x334155, 1);
      }
      strokes[i].strokeRect(pos.x - 125, pos.y - 65, 250, 130);
    }
  }
}
