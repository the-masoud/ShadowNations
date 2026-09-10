import Phaser from "phaser";
import type { GameState } from "../../core/model/gameState.js";
import type { RegionId } from "../../core/model/region.js";
import type { CityId } from "../../core/model/city.js";
import { getCityByRegionId } from "../../core/model/city.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import { createNationRegionPanelModel } from "./nationRegionPresentation.js";
import { COLORS, FONT_FAMILY, TYPOGRAPHY, BUTTON_PADDING, drawStandardPanel } from "./visualTheme.js";

const PANEL_X = 1024;
const PANEL_WIDTH = 256;
const PANEL_HEIGHT = 768;

export interface NationRegionUiController {
  readonly selectRegion: (regionId: RegionId) => void;
}

export function renderNationRegionUi(
  scene: Phaser.Scene,
  state: Readonly<GameState>,
  onOpenCityDossier?: (cityId: CityId) => void,
): NationRegionUiController {
  validateGameState(state);

  const panelG = scene.add.graphics();
  drawStandardPanel(panelG, PANEL_X, 0, PANEL_WIDTH, PANEL_HEIGHT);

  scene.add
    .text(1048, 32, "REGION & NATION", TYPOGRAPHY.panelTitle)
    .setOrigin(0, 0.5);

  scene.add.text(1048, 68, "REGION", TYPOGRAPHY.sectionHeading).setOrigin(0, 0.5);
  scene.add.text(1048, 202, "OWNER NATION", TYPOGRAPHY.sectionHeading).setOrigin(0, 0.5);
  scene.add.text(1048, 310, "STRATEGIC STATS", TYPOGRAPHY.sectionHeading).setOrigin(0, 0.5);
  scene.add.text(1048, 454, "TERRITORY", TYPOGRAPHY.sectionHeading).setOrigin(0, 0.5);

  const regionNameText = scene.add
    .text(1048, 94, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "22px",
      color: COLORS.primaryText,
      fontStyle: "bold",
    })
    .setOrigin(0, 0.5);

  const regionCodeText = scene.add
    .text(1048, 122, "", TYPOGRAPHY.code)
    .setOrigin(0, 0.5);

  const neighboringRegionCountText = scene.add
    .text(1048, 150, "", TYPOGRAPHY.dynamicValue)
    .setOrigin(0, 0.5);

  const ownerNationNameText = scene.add
    .text(1072, 232, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      color: COLORS.primaryText,
      fontStyle: "bold",
    })
    .setOrigin(0, 0.5);

  const ownerNationCodeText = scene.add
    .text(1048, 260, "", TYPOGRAPHY.code)
    .setOrigin(0, 0.5);

  const stabilityText = scene.add
    .text(1048, 340, "", TYPOGRAPHY.dynamicValue)
    .setOrigin(0, 0.5);

  const publicSupportText = scene.add
    .text(1048, 370, "", TYPOGRAPHY.dynamicValue)
    .setOrigin(0, 0.5);

  const internalSecurityText = scene.add
    .text(1048, 400, "", TYPOGRAPHY.dynamicValue)
    .setOrigin(0, 0.5);

  const ownedRegionCountText = scene.add
    .text(1048, 478, "", TYPOGRAPHY.dynamicValue)
    .setOrigin(0, 0.5);

  const ownerMarker = scene.add.graphics();

  const selectionHighlight = scene.add.graphics();

  let selectedRegionId: RegionId = state.world.map.regions[0].id;

  function selectRegion(regionId: RegionId): void {
    selectedRegionId = regionId;
    const model = createNationRegionPanelModel(state, regionId);

    regionNameText.setText(model.regionName);
    regionCodeText.setText(model.regionCode);
    neighboringRegionCountText.setText(
      `ADJACENT REGIONS  ${model.neighboringRegionCount}`,
    );
    ownerNationNameText.setText(model.ownerNationName);
    ownerNationCodeText.setText(model.ownerNationCode);
    stabilityText.setText(`STABILITY  ${model.stability}`);
    publicSupportText.setText(`PUBLIC SUPPORT  ${model.publicSupport}`);
    internalSecurityText.setText(
      `INTERNAL SECURITY  ${model.internalSecurity}`,
    );
    ownedRegionCountText.setText(
      `CONTROLLED REGIONS  ${model.ownedRegionCount}`,
    );

    ownerMarker.clear();
    ownerMarker.fillStyle(model.ownerColor, 1);
    ownerMarker.fillCircle(1055, 232, 7);

    selectionHighlight.clear();
  }

  selectRegion(selectedRegionId);

  if (onOpenCityDossier) {
    scene.add
      .text(1048, 505, "CITY DOSSIER", {
        ...TYPOGRAPHY.metadata,
        fontStyle: "bold",
        color: COLORS.buttonPrimaryText,
        backgroundColor: COLORS.buttonPrimaryHex,
        padding: BUTTON_PADDING.sidebarAction,
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        const city = getCityByRegionId(selectedRegionId);
        onOpenCityDossier(city.id);
      });
  }

  return { selectRegion };
}
