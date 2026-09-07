import type { NationId } from "./nation.js";

export type AssetId = string;

export type IntelligenceAssetAccess = "limited" | "high";

export interface IntelligenceAsset {
  readonly id: AssetId;
  readonly ownerNationId: NationId;
  readonly targetNationId: NationId;
  readonly access: IntelligenceAssetAccess;
}

export const VALID_ASSET_ACCESS_VALUES: readonly IntelligenceAssetAccess[] = [
  "limited",
  "high",
];

export class UnknownIntelligenceAssetError extends Error {
  constructor(assetId: AssetId) {
    super(`Unknown intelligence asset: "${assetId}"`);
    this.name = "UnknownIntelligenceAssetError";
  }
}

export function getIntelligenceAsset(
  state: Readonly<{ intelligence: { assets: readonly IntelligenceAsset[] } }>,
  assetId: AssetId,
): IntelligenceAsset {
  const asset = state.intelligence.assets.find((a) => a.id === assetId);
  if (!asset) {
    throw new UnknownIntelligenceAssetError(assetId);
  }
  return asset;
}
