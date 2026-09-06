import type { Region, RegionId } from "./region.js";

const compareIds = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;

const canonicalRegions: readonly Region[] = [
  { id: "sunreach", name: "Sunreach", code: "SUN" },
  { id: "auric-basin", name: "Auric Basin", code: "AUR" },
  { id: "helion-coast", name: "Helion Coast", code: "HEL" },
  { id: "ironvale", name: "Ironvale", code: "IRO" },
  { id: "blackridge", name: "Blackridge", code: "BLK" },
  { id: "varkesh", name: "Varkesh", code: "VAR" },
  { id: "northwatch", name: "Northwatch", code: "NWT" },
  { id: "frostmere", name: "Frostmere", code: "FRO" },
  { id: "silverplain", name: "Silverplain", code: "SIL" },
  { id: "velis", name: "Velis", code: "VLS" },
  { id: "meridian", name: "Meridian", code: "MER" },
  { id: "blueharbor", name: "Blueharbor", code: "BLU" },
  { id: "karsk", name: "Karsk", code: "KSK" },
  { id: "red-steppe", name: "Red Steppe", code: "RST" },
  { id: "stonegate", name: "Stonegate", code: "STG" },
  { id: "arka", name: "Arka", code: "ARK" },
  { id: "duskfall", name: "Duskfall", code: "DSK" },
  { id: "eastern-reach", name: "Eastern Reach", code: "ERE" },
];

const canonicalConnections: readonly RegionConnection[] = [
  { a: "sunreach", b: "auric-basin" },
  { a: "sunreach", b: "northwatch" },
  { a: "auric-basin", b: "helion-coast" },
  { a: "auric-basin", b: "ironvale" },
  { a: "auric-basin", b: "silverplain" },
  { a: "helion-coast", b: "velis" },
  { a: "ironvale", b: "blackridge" },
  { a: "ironvale", b: "silverplain" },
  { a: "blackridge", b: "varkesh" },
  { a: "blackridge", b: "karsk" },
  { a: "varkesh", b: "red-steppe" },
  { a: "northwatch", b: "frostmere" },
  { a: "northwatch", b: "silverplain" },
  { a: "frostmere", b: "stonegate" },
  { a: "silverplain", b: "meridian" },
  { a: "silverplain", b: "velis" },
  { a: "velis", b: "meridian" },
  { a: "velis", b: "blueharbor" },
  { a: "meridian", b: "blueharbor" },
  { a: "meridian", b: "karsk" },
  { a: "meridian", b: "arka" },
  { a: "blueharbor", b: "eastern-reach" },
  { a: "karsk", b: "red-steppe" },
  { a: "karsk", b: "stonegate" },
  { a: "karsk", b: "arka" },
  { a: "red-steppe", b: "duskfall" },
  { a: "stonegate", b: "duskfall" },
  { a: "arka", b: "duskfall" },
  { a: "arka", b: "eastern-reach" },
  { a: "duskfall", b: "eastern-reach" },
];

export interface RegionConnection {
  readonly a: RegionId;
  readonly b: RegionId;
}

export interface StrategicMap {
  readonly regions: readonly Region[];
  readonly connections: readonly RegionConnection[];
}

export class UnknownRegionError extends Error {
  constructor(regionId: RegionId) {
    super(`Unknown region: "${regionId}"`);
    this.name = "UnknownRegionError";
  }
}

export class StrategicMapValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StrategicMapValidationError";
  }
}

function connectionKey(a: RegionId, b: RegionId): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function createInitialStrategicMap(): StrategicMap {
  return {
    regions: [...canonicalRegions],
    connections: [...canonicalConnections],
  };
}

export function getRegionById(
  map: Readonly<StrategicMap>,
  regionId: RegionId,
): Region {
  const region = map.regions.find((r) => r.id === regionId);
  if (!region) {
    throw new UnknownRegionError(regionId);
  }
  return region;
}

export function getNeighborRegionIds(
  map: Readonly<StrategicMap>,
  regionId: RegionId,
): readonly RegionId[] {
  getRegionById(map, regionId);

  const neighbors: RegionId[] = [];
  for (const conn of map.connections) {
    if (conn.a === regionId) {
      neighbors.push(conn.b);
    } else if (conn.b === regionId) {
      neighbors.push(conn.a);
    }
  }
  return neighbors.sort(compareIds);
}

export function validateStrategicMap(map: Readonly<StrategicMap>): void {
  if (map.regions.length === 0) {
    throw new StrategicMapValidationError("Empty region collection");
  }

  const regionIds = new Set<string>();
  const regionCodes = new Set<string>();

  for (const region of map.regions) {
    if (region.id === "") {
      throw new StrategicMapValidationError("Empty region ID");
    }
    if (region.name === "") {
      throw new StrategicMapValidationError(
        `Empty region name for id "${region.id}"`,
      );
    }
    if (region.code === "") {
      throw new StrategicMapValidationError(
        `Empty region code for id "${region.id}"`,
      );
    }
    if (regionIds.has(region.id)) {
      throw new StrategicMapValidationError(
        `Duplicate region ID: "${region.id}"`,
      );
    }
    if (regionCodes.has(region.code)) {
      throw new StrategicMapValidationError(
        `Duplicate region code: "${region.code}" for region "${region.id}"`,
      );
    }
    regionIds.add(region.id);
    regionCodes.add(region.code);
  }

  const seenConnections = new Set<string>();

  for (const conn of map.connections) {
    if (!regionIds.has(conn.a)) {
      throw new StrategicMapValidationError(
        `Connection references unknown region: "${conn.a}"`,
      );
    }
    if (!regionIds.has(conn.b)) {
      throw new StrategicMapValidationError(
        `Connection references unknown region: "${conn.b}"`,
      );
    }
    if (conn.a === conn.b) {
      throw new StrategicMapValidationError(
        `Self-connection at region: "${conn.a}"`,
      );
    }
    const key = connectionKey(conn.a, conn.b);
    if (seenConnections.has(key)) {
      throw new StrategicMapValidationError(
        `Duplicate connection: "${conn.a}" <-> "${conn.b}"`,
      );
    }
    seenConnections.add(key);
  }

  const adjacencyMap = new Map<string, string[]>();
  for (const region of map.regions) {
    adjacencyMap.set(region.id, []);
  }
  for (const conn of map.connections) {
    adjacencyMap.get(conn.a)!.push(conn.b);
    adjacencyMap.get(conn.b)!.push(conn.a);
  }

  const visited = new Set<string>();
  const queue: string[] = [map.regions[0].id];
  visited.add(map.regions[0].id);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of adjacencyMap.get(current)!) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  if (visited.size !== map.regions.length) {
    throw new StrategicMapValidationError("Disconnected graph");
  }
}
