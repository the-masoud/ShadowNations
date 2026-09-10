import Phaser from "phaser";
import { COLORS, FONT_FAMILY, BUTTON_PADDING } from "./visualTheme.js";

export function renderTimelineLauncher(
  scene: Phaser.Scene,
  onOpen: () => void,
): void {
  scene.add
    .text(200, 24, "TIMELINE", {
      fontFamily: FONT_FAMILY,
      fontSize: "12px",
      color: COLORS.titleText,
      backgroundColor: COLORS.surfacePanelHex,
      padding: BUTTON_PADDING.compact,
    })
    .setOrigin(0, 0)
    .setInteractive({ useHandCursor: true })
    .on("pointerdown", () => {
      onOpen();
    });
}
