import Phaser from "phaser";

export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });
  }

  create(): void {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#0a0e17");

    this.add
      .text(width / 2, height / 2 - 40, "SHADOW NATIONS", {
        fontFamily: "Arial, sans-serif",
        fontSize: "48px",
        color: "#c0c0c0",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 20, "Intelligence is power.", {
        fontFamily: "Arial, sans-serif",
        fontSize: "22px",
        color: "#6a7a8a",
      })
      .setOrigin(0.5);
  }
}
