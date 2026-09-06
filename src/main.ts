import Phaser from "phaser";
import { BootScene } from "./game/scenes/BootScene";
import { MainScene } from "./game/scenes/MainScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: "game-container",
  backgroundColor: "#0a0e17",
  scene: [BootScene, MainScene],
};

new Phaser.Game(config);
