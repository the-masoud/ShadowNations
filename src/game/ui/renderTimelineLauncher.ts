import Phaser from "phaser";

export function renderTimelineLauncher(
  scene: Phaser.Scene,
  onOpen: () => void,
): void {
  scene.add
    .text(200, 24, "TIMELINE", {
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      color: "#d7dee8",
      backgroundColor: "#111827",
      padding: { left: 10, right: 10, top: 6, bottom: 6 },
    })
    .setOrigin(0, 0)
    .setInteractive({ useHandCursor: true })
    .on("pointerdown", () => {
      onOpen();
    });
}
