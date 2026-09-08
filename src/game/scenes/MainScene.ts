import Phaser from "phaser";
import type { GameState } from "../../core/model/gameState.js";
import { createInitialGameState } from "../../core/model/gameState.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import { renderStrategicMap } from "../map/renderStrategicMap.js";
import { renderNationRegionUi } from "../ui/renderNationRegionUi.js";
import { renderIntelligenceDashboard } from "../ui/renderIntelligenceDashboard.js";
import { renderConspiracyBoard } from "../ui/renderConspiracyBoard.js";
import { renderOperationPlanner } from "../ui/renderOperationPlanner.js";

interface MainSceneData {
  readonly state?: GameState;
}

export class MainScene extends Phaser.Scene {
  private state!: GameState;

  constructor() {
    super({ key: "MainScene" });
  }

  init(data?: MainSceneData): void {
    const state = data?.state ?? createInitialGameState();
    validateGameState(state);
    this.state = state;
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0a0e17");

    const state = this.state;
    renderStrategicMap(this, state);
    renderNationRegionUi(this, state);
    renderIntelligenceDashboard(this, state);
    renderConspiracyBoard(this, state);
    renderOperationPlanner(this, state, (result) => {
      this.scene.restart({ state: result.state });
    });
  }
}
