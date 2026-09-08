import Phaser from "phaser";
import type { GameState } from "../../core/model/gameState.js";
import type { GameEvent } from "../../core/model/gameEvent.js";
import { createInitialGameState } from "../../core/model/gameState.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import { renderStrategicMap } from "../map/renderStrategicMap.js";
import { renderNationRegionUi } from "../ui/renderNationRegionUi.js";
import { renderIntelligenceDashboard } from "../ui/renderIntelligenceDashboard.js";
import { renderConspiracyBoard } from "../ui/renderConspiracyBoard.js";
import { renderOperationPlanner } from "../ui/renderOperationPlanner.js";
import { renderTurnResolution } from "../ui/renderTurnResolution.js";
import { renderTutorial } from "../ui/renderTutorial.js";

interface MainSceneData {
  readonly state?: GameState;
  readonly pendingTurnEvents?: readonly GameEvent[];
  readonly showTutorial?: boolean;
}

export class MainScene extends Phaser.Scene {
  private state!: GameState;
  private pendingTurnEvents: readonly GameEvent[] = [];
  private showTutorial = false;

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
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0a0e17");

    const state = this.state;
    renderStrategicMap(this, state);
    renderNationRegionUi(this, state);
    renderIntelligenceDashboard(this, state);
    renderConspiracyBoard(this, state);
    renderOperationPlanner(this, state, (result) => {
      this.scene.restart({
        state: result.state,
        pendingTurnEvents: [
          ...this.pendingTurnEvents,
          result.event,
        ],
      });
    });
    renderTurnResolution(
      this,
      state,
      this.pendingTurnEvents,
      (nextState) => {
        this.scene.restart({
          state: nextState,
          pendingTurnEvents: [],
        });
      },
    );
    renderTutorial(this, this.showTutorial);
  }
}
