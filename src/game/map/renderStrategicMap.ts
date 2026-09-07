import Phaser from "phaser";
import type { GameState } from "../../core/model/gameState.js";
import { getRegionOwnership } from "../../core/model/regionOwnership.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import {
  getStrategicMapRegionLayout,
  getStrategicMapNationColor,
} from "./strategicMapPresentation.js";

const LEGEND_MARKER_POSITIONS: ReadonlyMap<string, number> = new Map([
  ["solaris", 82],
  ["dravos", 242],
  ["norvia", 402],
  ["veloria", 562],
  ["karsen", 722],
  ["arkania", 882],
]);

const LEGEND_Y = 715;

export function renderStrategicMap(
  scene: Phaser.Scene,
  state: Readonly<GameState>,
): void {
  validateGameState(state);

  const g = scene.add.graphics();

  for (const conn of state.world.map.connections) {
    const a = getStrategicMapRegionLayout(conn.a);
    const b = getStrategicMapRegionLayout(conn.b);
    g.lineStyle(2, 0x344052, 0.85);
    g.lineBetween(a.x, a.y, b.x, b.y);
  }

  for (const region of state.world.map.regions) {
    const layout = getStrategicMapRegionLayout(region.id);
    const ownership = getRegionOwnership(state.world, region.id);
    const color = getStrategicMapNationColor(ownership.ownerNationId);

    g.fillStyle(color, 0.92);
    g.lineStyle(2, 0xe2e8f0, 1);
    g.fillCircle(layout.x, layout.y, 24);
    g.strokeCircle(layout.x, layout.y, 24);
  }

  for (const region of state.world.map.regions) {
    const layout = getStrategicMapRegionLayout(region.id);

    scene.add
      .text(layout.x, layout.y, region.code, {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        color: "#f5f7fa",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
  }

  for (const region of state.world.map.regions) {
    const layout = getStrategicMapRegionLayout(region.id);

    scene.add
      .text(layout.x, layout.y + 34, region.name, {
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        color: "#aeb9c7",
      })
      .setOrigin(0.5);
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
