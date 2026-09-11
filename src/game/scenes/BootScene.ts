import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    this.load.image("city-map-dravik", "/assets/cities/dravik/city-map.png");
    this.load.image("city-map-kragen", "/assets/cities/kragen/city-map.png");
    this.load.image("city-map-raskov", "/assets/cities/raskov/city-map.png");
  }

  create(): void {
    this.scene.start("CampaignSetupScene");
  }
}
