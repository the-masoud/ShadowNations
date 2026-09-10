import Phaser from "phaser";

export const COLORS = {
  appBackground: 0x0a0e17,
  surfacePanel: 0x111827,
  surfacePanelHex: "#111827",
  elevatedSurface: 0x0d131d,
  borderSubtle: 0x2f3c4f,
  borderCard: 0x334155,
  primaryText: "#f5f7fa",
  headerText: "#e2e8f0",
  titleText: "#d7dee8",
  bodyText: "#c3ccd8",
  secondaryText: "#aeb9c7",
  sectionHeading: "#7f8da1",
  tertiaryText: "#8f9caf",
  mutedText: "#8996a8",
  disabledText: "#6b7280",
  accent: "#66aacc",
  accentHover: "#7ab8dd",
  selected: "#66aacc",
  success: "#4f9d82",
  warning: "#cc9933",
  danger: "#cc5555",
  disabled: "#3a4556",
  buttonPrimary: 0x263244,
  buttonPrimaryHex: "#263244",
  buttonPrimaryText: "#f5f7fa",
  overlayFull: 0x0b1019,
  connectionLine: 0x344052,
  nodeStroke: 0xe2e8f0,
  emptyRing: 0x3a4556,
  fallbackBand: 0x666666,
  breachBand: 0xcc5555,
  compromisedBand: 0xcc9933,
  guardedBand: 0x6699aa,
  hardenedBand: 0xddddcc,
} as const;

export const FONT_FAMILY = "Arial, sans-serif";

export const TYPOGRAPHY = {
  screenTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: "28px",
    color: COLORS.titleText,
    fontStyle: "bold" as const,
  },
  sectionHeading: {
    fontFamily: FONT_FAMILY,
    fontSize: "11px",
    color: COLORS.sectionHeading,
    fontStyle: "bold" as const,
  },
  body: {
    fontFamily: FONT_FAMILY,
    fontSize: "14px",
    color: COLORS.bodyText,
  },
  bodyStrong: {
    fontFamily: FONT_FAMILY,
    fontSize: "14px",
    color: COLORS.bodyText,
    fontStyle: "bold" as const,
  },
  metadata: {
    fontFamily: FONT_FAMILY,
    fontSize: "11px",
    color: COLORS.secondaryText,
  },
  button: {
    fontFamily: FONT_FAMILY,
    fontSize: "12px",
    color: COLORS.buttonPrimaryText,
    fontStyle: "bold" as const,
  },
  disabledButton: {
    fontFamily: FONT_FAMILY,
    fontSize: "12px",
    color: COLORS.disabledText,
  },
  panelTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: "18px",
    color: COLORS.titleText,
    fontStyle: "bold" as const,
  },
  code: {
    fontFamily: FONT_FAMILY,
    fontSize: "12px",
    color: COLORS.secondaryText,
  },
  dynamicValue: {
    fontFamily: FONT_FAMILY,
    fontSize: "14px",
    color: COLORS.bodyText,
  },
} as const;

export const SPACING = {
  small: 8,
  medium: 12,
  large: 16,
} as const;

export const PANEL = {
  borderRadius: 0,
  borderWidth: 2,
} as const;

export const BUTTON_PADDING = {
  compact: { left: 10, right: 10, top: 6, bottom: 6 },
  standard: { left: 12, right: 12, top: 8, bottom: 8 },
  comfortable: { left: 16, right: 16, top: 9, bottom: 9 },
  operation: { left: 8, right: 8, top: 5, bottom: 5 },
  tight: { left: 8, right: 8, top: 4, bottom: 4 },
  sidebarAction: { left: 12, right: 12, top: 5, bottom: 5 },
} as const;

export function applyButtonState(
  text: Phaser.GameObjects.Text,
  interactive: boolean,
): void {
  if (interactive) {
    text.setStyle({ color: COLORS.buttonPrimaryText });
    text.setInteractive({ useHandCursor: true });
  } else {
    text.setStyle({ color: COLORS.disabledText });
    text.disableInteractive();
  }
}

export function drawStandardPanel(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  g.fillStyle(COLORS.surfacePanel, 1);
  g.fillRect(x, y, width, height);
  g.lineStyle(PANEL.borderWidth, COLORS.borderSubtle, 1);
  g.lineBetween(x, y, x, y + height);
}

export function drawDivider(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
): void {
  g.lineStyle(1, COLORS.borderSubtle, 1);
  g.lineBetween(x, y, x + width, y);
}
