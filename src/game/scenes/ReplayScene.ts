import Phaser from "phaser";
import type { GameState } from "../../core/model/gameState.js";
import type { GameEvent } from "../../core/model/gameEvent.js";
import type { CampaignTimeline } from "../replay/campaignTimeline.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import { createTimelinePresentationModel } from "../ui/timelinePresentation.js";
import { renderStrategicMap } from "../map/renderStrategicMap.js";
import { renderNationRegionUi } from "../ui/renderNationRegionUi.js";
import { renderIntelligenceDashboard } from "../ui/renderIntelligenceDashboard.js";

interface ReplaySceneData {
  readonly liveState: GameState;
  readonly pendingTurnEvents: readonly GameEvent[];
  readonly timeline: CampaignTimeline;
  readonly selectedIndex: number;
}

export class ReplayScene extends Phaser.Scene {
  private liveState!: GameState;
  private pendingTurnEvents: readonly GameEvent[] = [];
  private timeline!: CampaignTimeline;
  private selectedIndex = 0;

  constructor() {
    super({ key: "ReplayScene" });
  }

  init(data: ReplaySceneData): void {
    validateGameState(data.liveState);
    createTimelinePresentationModel(
      data.timeline,
      data.selectedIndex,
    );
    this.liveState = data.liveState;
    this.pendingTurnEvents = [...data.pendingTurnEvents];
    this.timeline = data.timeline;
    this.selectedIndex = data.selectedIndex;
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0a0e17");

    const model = createTimelinePresentationModel(
      this.timeline,
      this.selectedIndex,
    );

    const snapshot =
      this.timeline.entries[this.selectedIndex].state;

    renderStrategicMap(this, snapshot);
    renderNationRegionUi(this, snapshot);
    renderIntelligenceDashboard(this, snapshot);

    this.add
      .text(24, 24, "REPLAY / TIMELINE", {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        color: "#f5f7fa",
        backgroundColor: "#263244",
        fontStyle: "bold",
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
      })
      .setOrigin(0, 0);

    const footer = this.add.rectangle(
      512, 708, 1024, 120, 0x0d131d, 1,
    );
    footer.setInteractive();

    this.add
      .text(
        512,
        660,
        `SNAPSHOT ${model.selectedIndex + 1} OF ${model.entryCount}`,
        {
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
          color: "#d7dee8",
          fontStyle: "bold",
        },
      )
      .setOrigin(0.5, 0.5);

    this.add
      .text(
        512,
        684,
        `TURN ${model.entry.turn} — ${model.entry.kindLabel}`,
        {
          fontFamily: "Arial, sans-serif",
          fontSize: "11px",
          color: "#aeb9c7",
        },
      )
      .setOrigin(0.5, 0.5);

    this.add
      .text(512, 706, `EVENT ${model.entry.eventLabel}`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        color: "#aeb9c7",
      })
      .setOrigin(0.5, 0.5);

    const prevText = this.add
      .text(340, 740, "PREVIOUS", {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        color: "#f5f7fa",
        backgroundColor: "#263244",
        fontStyle: "bold",
        padding: { left: 12, right: 12, top: 8, bottom: 8 },
      })
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });

    prevText.on("pointerdown", () => {
      if (!model.canPrevious) {
        return;
      }
      this.scene.restart({
        liveState: this.liveState,
        pendingTurnEvents: [...this.pendingTurnEvents],
        timeline: this.timeline,
        selectedIndex: this.selectedIndex - 1,
      });
    });

    const nextText = this.add
      .text(512, 740, "NEXT", {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        color: "#f5f7fa",
        backgroundColor: "#263244",
        fontStyle: "bold",
        padding: { left: 12, right: 12, top: 8, bottom: 8 },
      })
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });

    nextText.on("pointerdown", () => {
      if (!model.canNext) {
        return;
      }
      this.scene.restart({
        liveState: this.liveState,
        pendingTurnEvents: [...this.pendingTurnEvents],
        timeline: this.timeline,
        selectedIndex: this.selectedIndex + 1,
      });
    });

    const backText = this.add
      .text(690, 740, "BACK TO LIVE", {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        color: "#f5f7fa",
        backgroundColor: "#263244",
        fontStyle: "bold",
        padding: { left: 12, right: 12, top: 8, bottom: 8 },
      })
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });

    backText.on("pointerdown", () => {
      this.scene.start("MainScene", {
        state: this.liveState,
        pendingTurnEvents: [...this.pendingTurnEvents],
        timeline: this.timeline,
      });
    });
  }
}
