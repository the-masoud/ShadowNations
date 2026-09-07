import type { RegionId } from "../../core/model/region.js";
import type { NationId } from "../../core/model/nation.js";

export interface StrategicMapRegionLayout {
  readonly regionId: RegionId;
  readonly x: number;
  readonly y: number;
}

export const STRATEGIC_MAP_LAYOUT: readonly StrategicMapRegionLayout[] = [
  { regionId: "sunreach", x: 110, y: 220 },
  { regionId: "auric-basin", x: 230, y: 270 },
  { regionId: "helion-coast", x: 205, y: 410 },
  { regionId: "ironvale", x: 360, y: 230 },
  { regionId: "blackridge", x: 500, y: 205 },
  { regionId: "varkesh", x: 640, y: 175 },
  { regionId: "northwatch", x: 220, y: 120 },
  { regionId: "frostmere", x: 380, y: 105 },
  { regionId: "silverplain", x: 400, y: 335 },
  { regionId: "velis", x: 350, y: 470 },
  { regionId: "meridian", x: 545, y: 385 },
  { regionId: "blueharbor", x: 530, y: 535 },
  { regionId: "karsk", x: 680, y: 320 },
  { regionId: "red-steppe", x: 800, y: 235 },
  { regionId: "stonegate", x: 600, y: 115 },
  { regionId: "arka", x: 720, y: 465 },
  { regionId: "duskfall", x: 860, y: 375 },
  { regionId: "eastern-reach", x: 815, y: 545 },
];

export class MissingStrategicMapLayoutError extends Error {
  constructor(regionId: RegionId) {
    super(`Missing strategic map layout for region: "${regionId}"`);
    this.name = "MissingStrategicMapLayoutError";
  }
}

export class MissingStrategicMapNationColorError extends Error {
  constructor(nationId: NationId) {
    super(`Missing strategic map color for nation: "${nationId}"`);
    this.name = "MissingStrategicMapNationColorError";
  }
}

const NATION_COLORS: ReadonlyMap<NationId, number> = new Map([
  ["solaris", 0xd6b450],
  ["dravos", 0xbf5a5a],
  ["norvia", 0x5d8fc7],
  ["veloria", 0x8b6fc0],
  ["karsen", 0xc47a45],
  ["arkania", 0x4f9d82],
]);

export function getStrategicMapRegionLayout(
  regionId: RegionId,
): StrategicMapRegionLayout {
  const entry = STRATEGIC_MAP_LAYOUT.find((l) => l.regionId === regionId);
  if (!entry) {
    throw new MissingStrategicMapLayoutError(regionId);
  }
  return entry;
}

export function getStrategicMapNationColor(nationId: NationId): number {
  const color = NATION_COLORS.get(nationId);
  if (color === undefined) {
    throw new MissingStrategicMapNationColorError(nationId);
  }
  return color;
}
