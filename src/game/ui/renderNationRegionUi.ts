import Phaser from "phaser";
import type { GameState } from "../../core/model/gameState.js";
import type { RegionId } from "../../core/model/region.js";
import type { CityId } from "../../core/model/city.js";
import { getCityByRegionId } from "../../core/model/city.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import { getStrategicMapRegionLayout } from "../map/strategicMapPresentation.js";
import { createNationRegionPanelModel } from "./nationRegionPresentation.js";

const PANEL_X = 1024;
const PANEL_WIDTH = 256;
const PANEL_HEIGHT = 768;

const SECTION_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: "Arial, sans-serif",
  fontSize: "11px",
  color: "#7f8da1",
  fontStyle: "bold",
};

const DYNAMIC_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: "Arial, sans-serif",
  fontSize: "14px",
  color: "#c3ccd8",
};

export function renderNationRegionUi(
  scene: Phaser.Scene,
  state: Readonly<GameState>,
  onOpenCityDossier?: (cityId: CityId) => void,
): void {
  validateGameState(state);

  const panelG = scene.add.graphics();
  panelG.fillStyle(0x111827, 1);
  panelG.fillRect(PANEL_X, 0, PANEL_WIDTH, PANEL_HEIGHT);
  panelG.lineStyle(2, 0x2f3c4f, 1);
  panelG.lineBetween(PANEL_X, 0, PANEL_X, PANEL_HEIGHT);

  scene.add
    .text(1048, 32, "REGION & NATION", {
      fontFamily: "Arial, sans-serif",
      fontSize: "18px",
      color: "#d7dee8",
      fontStyle: "bold",
    })
    .setOrigin(0, 0.5);

  scene.add.text(1048, 68, "REGION", SECTION_STYLE).setOrigin(0, 0.5);
  scene.add.text(1048, 202, "OWNER NATION", SECTION_STYLE).setOrigin(0, 0.5);
  scene.add.text(1048, 310, "STRATEGIC STATS", SECTION_STYLE).setOrigin(0, 0.5);
  scene.add.text(1048, 454, "TERRITORY", SECTION_STYLE).setOrigin(0, 0.5);

  const regionNameText = scene.add
    .text(1048, 94, "", {
      fontFamily: "Arial, sans-serif",
      fontSize: "22px",
      color: "#f5f7fa",
      fontStyle: "bold",
    })
    .setOrigin(0, 0.5);

  const regionCodeText = scene.add
    .text(1048, 122, "", {
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      color: "#aeb9c7",
    })
    .setOrigin(0, 0.5);

  const neighboringRegionCountText = scene.add
    .text(1048, 150, "", {
      fontFamily: "Arial, sans-serif",
      fontSize: "13px",
      color: "#c3ccd8",
    })
    .setOrigin(0, 0.5);

  const ownerNationNameText = scene.add
    .text(1072, 232, "", {
      fontFamily: "Arial, sans-serif",
      fontSize: "18px",
      color: "#f5f7fa",
      fontStyle: "bold",
    })
    .setOrigin(0, 0.5);

  const ownerNationCodeText = scene.add
    .text(1048, 260, "", {
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      color: "#aeb9c7",
    })
    .setOrigin(0, 0.5);

  const stabilityText = scene.add
    .text(1048, 340, "", DYNAMIC_STYLE)
    .setOrigin(0, 0.5);

  const publicSupportText = scene.add
    .text(1048, 370, "", DYNAMIC_STYLE)
    .setOrigin(0, 0.5);

  const internalSecurityText = scene.add
    .text(1048, 400, "", DYNAMIC_STYLE)
    .setOrigin(0, 0.5);

  const ownedRegionCountText = scene.add
    .text(1048, 484, "", DYNAMIC_STYLE)
    .setOrigin(0, 0.5);

  const ownerMarker = scene.add.graphics();

  const selectionHighlight = scene.add.graphics();

  function selectRegion(regionId: RegionId): void {
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

    const layout = getStrategicMapRegionLayout(regionId);
    selectionHighlight.clear();
    selectionHighlight.lineStyle(3, 0xffffff, 0.95);
    selectionHighlight.strokeCircle(layout.x, layout.y, 30);
  }

  const initialRegionId = state.world.map.regions[0].id;
  let selectedRegionId = initialRegionId;
  selectRegion(initialRegionId);

  let cityDossierText: Phaser.GameObjects.Text | null = null;

  if (onOpenCityDossier) {
    cityDossierText = scene.add
      .text(1048, 520, "CITY DOSSIER", {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        color: "#d7dee8",
        backgroundColor: "#111827",
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });

    cityDossierText.on("pointerdown", () => {
      const city = getCityByRegionId(selectedRegionId);
      onOpenCityDossier(city.id);
    });
  }

  for (const region of state.world.map.regions) {
    const layout = getStrategicMapRegionLayout(region.id);
    const zone = scene.add.zone(layout.x, layout.y, 48, 48);
    zone.setOrigin(0.5);
    zone.setInteractive();
    zone.on("pointerdown", () => {
      selectedRegionId = region.id;
      selectRegion(region.id);
    });
  }
}
