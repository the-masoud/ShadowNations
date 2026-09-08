import Phaser from "phaser";
import type { GameState } from "../../core/model/gameState.js";
import type { GameEvent } from "../../core/model/gameEvent.js";
import type { CampaignTimeline } from "../replay/campaignTimeline.js";
import { createInitialGameState } from "../../core/model/gameState.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import {
  createCampaignTimeline,
  appendOperationTimelineEntry,
  appendTurnTimelineEntry,
} from "../replay/campaignTimeline.js";
import { renderStrategicMap } from "../map/renderStrategicMap.js";
import { renderNationRegionUi } from "../ui/renderNationRegionUi.js";
import { renderIntelligenceDashboard } from "../ui/renderIntelligenceDashboard.js";
import { renderConspiracyBoard } from "../ui/renderConspiracyBoard.js";
import { renderOperationPlanner } from "../ui/renderOperationPlanner.js";
import { renderTurnResolution } from "../ui/renderTurnResolution.js";
import { renderSaveLoad } from "../ui/renderSaveLoad.js";
import { renderTimelineLauncher } from "../ui/renderTimelineLauncher.js";
import { renderTutorial } from "../ui/renderTutorial.js";

interface MainSceneData {
  readonly state?: GameState;
  readonly pendingTurnEvents?: readonly GameEvent[];
  readonly showTutorial?: boolean;
  readonly timeline?: CampaignTimeline;
}

export class MainScene extends Phaser.Scene {
  private state!: GameState;
  private pendingTurnEvents: readonly GameEvent[] = [];
  private showTutorial = false;
  private timeline!: CampaignTimeline;

  constructor() {
    super({ key: "MainScene" });
  }

  init(data?: MainSceneData): void {
    const state = data?.state ?? createInitialGameState();
    validateGameState(state);
    this.state = state;
    this.pendingTurnEvents = data?.pendingTurnEvents
      ? [...data.pendingTurnEvents]
      : [];
    this.showTutorial = data?.showTutorial === true;
    if (data?.timeline) {
      this.timeline = data.timeline;
    } else {
      this.timeline = createCampaignTimeline(state);
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0a0e17");

    const state = this.state;
    renderStrategicMap(this, state);
    renderNationRegionUi(this, state);
    renderIntelligenceDashboard(this, state);
    renderConspiracyBoard(this, state);
    renderOperationPlanner(this, state, (result) => {
      const timeline = appendOperationTimelineEntry(
        this.timeline,
        result.state,
        result.event,
      );
      this.scene.restart({
        state: result.state,
        pendingTurnEvents: [
          ...this.pendingTurnEvents,
          result.event,
        ],
        timeline,
      });
    });
    renderTurnResolution(
      this,
      state,
      this.pendingTurnEvents,
      (nextState) => {
        const timeline = appendTurnTimelineEntry(
          this.timeline,
          nextState,
        );
        this.scene.restart({
          state: nextState,
          pendingTurnEvents: [],
          timeline,
        });
      },
    );
    renderSaveLoad(this, state, (loadedState) => {
      this.scene.restart({
        state: loadedState,
        pendingTurnEvents: [],
      });
    });
    renderTimelineLauncher(this, () => {
      this.scene.start("ReplayScene", {
        liveState: this.state,
        pendingTurnEvents: [...this.pendingTurnEvents],
        timeline: this.timeline,
        selectedIndex: this.timeline.entries.length - 1,
      });
    });
    renderTutorial(this, this.showTutorial);
  }
}
