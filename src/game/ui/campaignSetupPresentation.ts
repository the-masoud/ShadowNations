import type { NationId } from "../../core/model/nation.js";
import { createInitialWorldState, getNationById } from "../../core/model/worldState.js";
import { getStrategicMapNationColor } from "../map/strategicMapPresentation.js";
import { getNationStrategicStats } from "../../core/model/nationStrategicStats.js";

export interface CampaignSetupNationModel {
  readonly nationId: NationId;
  readonly nationName: string;
  readonly nationCode: string;
  readonly nationColor: number;
  readonly stability: number;
  readonly publicSupport: number;
  readonly internalSecurity: number;
  readonly selected: boolean;
}

export interface CampaignSetupPresentationModel {
  readonly selectedNationId: NationId;
  readonly nations: readonly CampaignSetupNationModel[];
}

export function createCampaignSetupPresentationModel(
  selectedNationId: NationId,
): CampaignSetupPresentationModel {
  const world = createInitialWorldState();
  getNationById(world, selectedNationId);

  const nations: CampaignSetupNationModel[] = world.nations.map(
    (nation) => {
      const stats = getNationStrategicStats(world, nation.id);
      return {
        nationId: nation.id,
        nationName: nation.name,
        nationCode: nation.code,
        nationColor: getStrategicMapNationColor(nation.id),
        stability: stats.stability,
        publicSupport: stats.publicSupport,
        internalSecurity: stats.internalSecurity,
        selected: nation.id === selectedNationId,
      };
    },
  );

  return {
    selectedNationId,
    nations,
  };
}
