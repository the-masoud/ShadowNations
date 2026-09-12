import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    this.load.image("city-map-dravik", "/assets/cities/dravik/city-map.png");
    this.load.image("city-map-kragen", "/assets/cities/kragen/city-map.png");
    this.load.image("city-map-raskov", "/assets/cities/raskov/city-map.png");
    this.load.image("city-map-solara", "/assets/cities/solara/city-map.png");
    this.load.image("city-map-aurelis", "/assets/cities/aurelis/city-map.png");
    this.load.image("city-map-helion", "/assets/cities/helion/city-map.png");
  }

  create(): void {
    this.scene.start("CampaignSetupScene");
  }
}
