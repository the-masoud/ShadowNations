import Phaser from "phaser";
import type { GameState } from "../../core/model/gameState.js";
import type { CityId } from "../../core/model/city.js";
import type { RegionId } from "../../core/model/region.js";
import {
  getStrategicMapNationColor,
} from "./strategicMapPresentation.js";
import { createCityMapPresentationModel } from "./cityMapPresentation.js";
import type { CityMapRoleShape, CityMapSecurityBand } from "./cityMapPresentation.js";
import {
  createInitialCityMapInteractionState,
  selectCityMapCity,
  hoverCityMapCity,
} from "./cityMapInteraction.js";

const LEGEND_MARKER_POSITIONS: ReadonlyMap<string, number> = new Map([
  ["solaris", 82],
  ["dravos", 242],
  ["norvia", 402],
  ["veloria", 562],
  ["karsen", 722],
  ["arkania", 882],
]);

const LEGEND_Y = 715;

const BAND_COLORS: ReadonlyMap<CityMapSecurityBand, number> = new Map([
  ["BREACHED", 0xcc5555],
  ["COMPROMISED", 0xcc9933],
  ["GUARDED", 0x6699aa],
  ["HARDENED", 0xddddcc],
]);

const NODE_RADIUS = 14;
const RING_RADIUS = 20;
const RING_ARC_DEG = 65;
const RING_GAP_DEG = 10;

const HOVER_RADIUS = 26;
const HOVER_LINE = 1;
const HOVER_COLOR = 0x66aacc;
const HOVER_ALPHA = 0.45;

const SELECTED_RADIUS = 31;
const SELECTED_LINE = 2;
const SELECTED_COLOR = 0x66aacc;
const SELECTED_ALPHA = 0.75;

function drawRoleShape(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  shape: CityMapRoleShape,
  fillColor: number,
): void {
  g.fillStyle(fillColor, 0.92);
  g.lineStyle(2, 0xe2e8f0, 1);

  switch (shape) {
    case "star": {
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI / 2) + (i * Math.PI) / 5;
        const r = i % 2 === 0 ? NODE_RADIUS : NODE_RADIUS * 0.5;
        const px = x + r * Math.cos(angle);
        const py = y - r * Math.sin(angle);
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.fillPath();
      g.strokePath();
      break;
    }
    case "diamond": {
      g.beginPath();
      g.moveTo(x, y - NODE_RADIUS);
      g.lineTo(x + NODE_RADIUS, y);
      g.lineTo(x, y + NODE_RADIUS);
      g.lineTo(x - NODE_RADIUS, y);
      g.closePath();
      g.fillPath();
      g.strokePath();
      break;
    }
    case "hexagon": {
      g.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 6) + (i * Math.PI) / 3;
        const px = x + NODE_RADIUS * Math.cos(angle);
        const py = y - NODE_RADIUS * Math.sin(angle);
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.fillPath();
      g.strokePath();
      break;
    }
  }
}

function drawSecurityRing(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  segments: 0 | 1 | 2 | 3 | 4,
  band: CityMapSecurityBand | null,
): void {
  if (segments === 0) {
    g.lineStyle(1, 0x3a4556, 0.35);
    g.strokeCircle(x, y, RING_RADIUS);
    return;
  }

  const color = band ? (BAND_COLORS.get(band) ?? 0x666666) : 0x666666;
  const totalArc = segments * RING_ARC_DEG + (segments - 1) * RING_GAP_DEG;
  let startAngle = -90 - totalArc / 2;

  for (let i = 0; i < segments; i++) {
    const endAngle = startAngle + RING_ARC_DEG;
    g.lineStyle(3, color, 0.85);
    g.beginPath();
    g.arc(x, y, RING_RADIUS, Phaser.Math.DegToRad(startAngle), Phaser.Math.DegToRad(endAngle), false);
    g.strokePath();
    startAngle = endAngle + RING_GAP_DEG;
  }
}

export function renderStrategicMap(
  scene: Phaser.Scene,
  state: Readonly<GameState>,
  onCitySelected?: (cityId: CityId, regionId: RegionId) => void,
): void {
  const g = scene.add.graphics();
  const nodes = createCityMapPresentationModel(state);

  for (const conn of state.world.map.connections) {
    const aNode = nodes.find((n) => n.regionId === conn.a);
    const bNode = nodes.find((n) => n.regionId === conn.b);
    if (aNode && bNode) {
      g.lineStyle(2, 0x344052, 0.85);
      g.lineBetween(aNode.x, aNode.y, bNode.x, bNode.y);
    }
  }

  for (const node of nodes) {
    drawSecurityRing(g, node.x, node.y, node.securitySegments, node.securityBand);
    drawRoleShape(g, node.x, node.y, node.roleShape, node.ownerColor);
  }

  for (const node of nodes) {
    scene.add
      .text(node.x, node.y - 26, node.cityName, {
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
        color: "#f5f7fa",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    scene.add
      .text(node.x, node.y + 24, node.regionCode, {
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
        color: "#aeb9c7",
      })
      .setOrigin(0.5);
  }

  if (onCitySelected) {
    let interactionState = createInitialCityMapInteractionState();
    const hoverRing = scene.add.graphics();
    const selectedRing = scene.add.graphics();

    function drawSelectedHighlight(cityId: CityId): void {
      selectedRing.clear();
      const node = nodes.find((n) => n.cityId === cityId);
      if (node) {
        selectedRing.lineStyle(SELECTED_LINE, SELECTED_COLOR, SELECTED_ALPHA);
        selectedRing.strokeCircle(node.x, node.y, SELECTED_RADIUS);
      }
    }

    drawSelectedHighlight(interactionState.selectedCityId);

    for (const node of nodes) {
      const zone = scene.add.zone(node.x, node.y, 56, 56);
      zone.setOrigin(0.5);
      zone.setInteractive({ useHandCursor: true });

      zone.on("pointerover", () => {
        interactionState = hoverCityMapCity(interactionState, node.cityId);
        hoverRing.clear();
        hoverRing.lineStyle(HOVER_LINE, HOVER_COLOR, HOVER_ALPHA);
        hoverRing.strokeCircle(node.x, node.y, HOVER_RADIUS);
      });

      zone.on("pointerout", () => {
        interactionState = hoverCityMapCity(interactionState, null);
        hoverRing.clear();
      });

      zone.on("pointerdown", () => {
        interactionState = selectCityMapCity(interactionState, node.cityId);
        drawSelectedHighlight(interactionState.selectedCityId);
        hoverRing.clear();
        onCitySelected(interactionState.selectedCityId, interactionState.selectedRegionId);
      });
    }
  }

  scene.add
    .text(512, 42, "STRATEGIC MAP", {
      fontFamily: "Arial, sans-serif",
      fontSize: "28px",
      color: "#d7dee8",
      fontStyle: "bold",
    })
    .setOrigin(0.5);

  for (const nation of state.world.nations) {
    const color = getStrategicMapNationColor(nation.id);
    const markerX = LEGEND_MARKER_POSITIONS.get(nation.id);
    if (markerX === undefined) {
      throw new Error(
        `Missing legend X position for nation: "${nation.id}"`,
      );
    }

    g.fillStyle(color, 1);
    g.fillCircle(markerX, LEGEND_Y, 7);

    scene.add
      .text(markerX + 14, LEGEND_Y, nation.name.toUpperCase(), {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        color: "#c3ccd8",
      })
      .setOrigin(0, 0.5);
  }
}
