import Phaser from "phaser";
import { createInitialGameState } from "../../core/model/gameState.js";
import { renderStrategicMap } from "../map/renderStrategicMap.js";
import { renderNationRegionUi } from "../ui/renderNationRegionUi.js";
import { renderIntelligenceDashboard } from "../ui/renderIntelligenceDashboard.js";
import { renderConspiracyBoard } from "../ui/renderConspiracyBoard.js";

export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0a0e17");

    const state = createInitialGameState();
    renderStrategicMap(this, state);
    renderNationRegionUi(this, state);
    renderIntelligenceDashboard(this, state);
    renderConspiracyBoard(this, state);
  }
}
