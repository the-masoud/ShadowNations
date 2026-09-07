import type { NationId } from "./nation.js";
import type { AssetId } from "./intelligenceAsset.js";

export interface DoubleAgentControl {
  readonly assetId: AssetId;
  readonly controllerNationId: NationId;
}
