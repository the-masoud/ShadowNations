export type RegionId = string;

export interface Region {
  readonly id: RegionId;
  readonly name: string;
  readonly code: string;
}
