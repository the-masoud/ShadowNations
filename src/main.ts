import Phaser from "phaser";
import { BootScene } from "./game/scenes/BootScene";
import { CampaignSetupScene } from "./game/scenes/CampaignSetupScene";
import { MainScene } from "./game/scenes/MainScene";
import { CityScene } from "./game/scenes/CityScene";
import { ReplayScene } from "./game/scenes/ReplayScene";
import { GAME_LOGICAL_WIDTH, GAME_LOGICAL_HEIGHT } from "./game/ui/responsiveViewport";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_LOGICAL_WIDTH,
  height: GAME_LOGICAL_HEIGHT,
  parent: "game-container",
  backgroundColor: "#0a0e17",
  scene: [BootScene, CampaignSetupScene, MainScene, CityScene, ReplayScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);
