import Phaser from "phaser";
import type { GameState } from "../../core/model/gameState.js";
import type { GameEvent } from "../../core/model/gameEvent.js";
import type { CityId } from "../../core/model/city.js";
import { getCityById } from "../../core/model/city.js";
import { getRegionById } from "../../core/model/strategicMap.js";
import { getNationById } from "../../core/model/worldState.js";
import { getRegionOwnership } from "../../core/model/regionOwnership.js";
import { getStrategicMapNationColor } from "../map/strategicMapPresentation.js";
import { getCityVisualEntry, hasCityMap } from "../city/cityVisualCatalog.js";
import { renderCityDossier } from "../ui/renderCityDossier.js";
import {
  COLORS,
  FONT_FAMILY,
  TYPOGRAPHY,
  BUTTON_PADDING,
  drawStandardPanel,
} from "../ui/visualTheme.js";
import {
  appendOperationTimelineEntry,
  type CampaignTimeline,
} from "../replay/campaignTimeline.js";
import { createCampaignTimeline } from "../replay/campaignTimeline.js";

interface CitySceneData {
  readonly state: GameState;
  readonly cityId: CityId;
  readonly pendingTurnEvents?: readonly GameEvent[];
  readonly timeline?: CampaignTimeline;
}

const SIDEBAR_X = 1024;
const SIDEBAR_WIDTH = 256;
const MAP_WIDTH = SIDEBAR_X;
const MAP_HEIGHT = 576;

export class CityScene extends Phaser.Scene {
  private state!: GameState;
  private cityId!: CityId;
  private pendingTurnEvents: readonly GameEvent[] = [];
  private timeline!: CampaignTimeline;
  private mapImage?: Phaser.GameObjects.Image;
  private container!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: "CityScene" });
  }

  init(data: CitySceneData): void {
    this.state = data.state;
    this.cityId = data.cityId;
    this.pendingTurnEvents = data.pendingTurnEvents ? [...data.pendingTurnEvents] : [];
    this.timeline = data.timeline ?? createCampaignTimeline(data.state);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0a0e17");

    const state = this.state;
    const city = getCityById(this.cityId);
    const region = getRegionById(state.world.map, city.regionId);
    const ownership = getRegionOwnership(state.world, city.regionId);
    const nation = getNationById(state.world, ownership.ownerNationId);
    const nationColor = getStrategicMapNationColor(nation.id);

    // Pan/zoom container for the map
    this.container = this.add.container(0, 0);

    // Load and display city map
    if (hasCityMap(this.cityId)) {
      const entry = getCityVisualEntry(this.cityId);
      if (entry) {
        const textureKey = "city-map-" + this.cityId;
        if (this.textures.exists(textureKey)) {
          this.mapImage = this.add.image(MAP_WIDTH / 2, 384, textureKey);
          this.mapImage.setDisplaySize(MAP_WIDTH, MAP_HEIGHT);
          this.container.add(this.mapImage);
          this.setupPanZoom();
        } else {
          this.load.image(textureKey, entry.mapAsset);
          this.load.once("filecomplete-image-" + textureKey, () => {
            this.mapImage = this.add.image(MAP_WIDTH / 2, 384, textureKey);
            this.mapImage.setDisplaySize(MAP_WIDTH, MAP_HEIGHT);
            this.container.add(this.mapImage);
            this.setupPanZoom();
          });
          this.load.start();
        }
      }
    } else {
      // Fallback for cities without maps
      this.drawFallbackCity(city.name);
    }

    // Right sidebar
    const sidebarG = this.add.graphics();
    drawStandardPanel(sidebarG, SIDEBAR_X, 0, SIDEBAR_WIDTH, 768);

    // City title
    this.add
      .text(SIDEBAR_X + 128, 32, city.name.toUpperCase(), {
        fontFamily: FONT_FAMILY,
        fontSize: "18px",
        color: COLORS.titleText,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0);

    // Region info
    this.add
      .text(SIDEBAR_X + 128, 60, `${region.name.toUpperCase()} / ${region.code}`, {
        fontFamily: FONT_FAMILY,
        fontSize: "11px",
        color: COLORS.sectionHeading,
      })
      .setOrigin(0.5, 0);

    // Nation info with color marker
    const nationMarker = this.add.graphics();
    nationMarker.fillStyle(nationColor, 1);
    nationMarker.fillCircle(SIDEBAR_X + 30, 90, 6);
    this.add
      .text(SIDEBAR_X + 44, 90, nation.name.toUpperCase(), {
        fontFamily: FONT_FAMILY,
        fontSize: "11px",
        color: COLORS.secondaryText,
      })
      .setOrigin(0, 0.5);

    // Role badge
    this.add
      .text(SIDEBAR_X + 128, 115, city.role.toUpperCase().replace("-", " "), {
        fontFamily: FONT_FAMILY,
        fontSize: "10px",
        color: COLORS.disabledText,
      })
      .setOrigin(0.5, 0);

    // Divider
    const dividerG = this.add.graphics();
    dividerG.lineStyle(1, COLORS.borderSubtle, 1);
    dividerG.lineBetween(SIDEBAR_X + 16, 140, SIDEBAR_X + 240, 140);

    // City Dossier button
    this.add
      .text(SIDEBAR_X + 128, 160, "CITY DOSSIER", {
        ...TYPOGRAPHY.metadata,
        fontStyle: "bold",
        color: COLORS.buttonPrimaryText,
        backgroundColor: COLORS.buttonPrimaryHex,
        padding: BUTTON_PADDING.sidebarAction,
      })
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.openDossier();
      });

    // Back to Strategic Map button
    this.add
      .text(SIDEBAR_X + 128, 210, "BACK TO STRATEGIC MAP", {
        ...TYPOGRAPHY.metadata,
        fontStyle: "bold",
        color: COLORS.accent,
        backgroundColor: COLORS.surfacePanelHex,
        padding: BUTTON_PADDING.sidebarAction,
      })
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.scene.start("MainScene", {
          state: this.state,
          pendingTurnEvents: [...this.pendingTurnEvents],
          timeline: this.timeline,
        });
      });

    // District labels (decorative)
    const districtY = 280;
    const districts = [
      "GOVERNMENT QUARTER",
      "CENTRAL DISTRICT",
      "SECURITY DISTRICT",
      "INDUSTRIAL EDGE",
      "CIVIC GREEN SPACE",
    ];
    this.add
      .text(SIDEBAR_X + 128, districtY - 16, "DISTRICTS", {
        fontFamily: FONT_FAMILY,
        fontSize: "10px",
        color: COLORS.sectionHeading,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0);

    for (let i = 0; i < districts.length; i++) {
      this.add
        .text(SIDEBAR_X + 20, districtY + 4 + i * 18, districts[i], {
          fontFamily: FONT_FAMILY,
          fontSize: "9px",
          color: COLORS.secondaryText,
        })
        .setOrigin(0, 0);
    }

    // Map instructions
    this.add
      .text(SIDEBAR_X + 128, 420, "SCROLL TO ZOOM\nDRAG TO PAN", {
        fontFamily: FONT_FAMILY,
        fontSize: "9px",
        color: COLORS.disabledText,
        align: "center",
      })
      .setOrigin(0.5, 0);
  }

  private setupPanZoom(): void {
    if (!this.mapImage) return;

    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let mapScale = 1;

    // Scroll to zoom
    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _gos: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      const zoomFactor = dy > 0 ? 0.95 : 1.05;
      mapScale = Phaser.Math.Clamp(mapScale * zoomFactor, 0.5, 2.0);
      this.container.setScale(mapScale);
    });

    // Drag to pan
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.x < SIDEBAR_X) {
        isDragging = true;
        lastPointerX = pointer.x;
        lastPointerY = pointer.y;
      }
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (isDragging && pointer.isDown) {
        const dx = pointer.x - lastPointerX;
        const dy = pointer.y - lastPointerY;
        this.container.x += dx;
        this.container.y += dy;
        lastPointerX = pointer.x;
        lastPointerY = pointer.y;
      }
    });

    this.input.on("pointerup", () => {
      isDragging = false;
    });
  }

  private openDossier(): void {
    const dossierResult = renderCityDossier(this, this.state, (result) => {
      const timeline = appendOperationTimelineEntry(
        this.timeline,
        result.state,
        result.event,
      );
      this.scene.restart({
        state: result.state,
        cityId: this.cityId,
        pendingTurnEvents: [...this.pendingTurnEvents, result.event],
        timeline,
      });
    });
    dossierResult.open(this.cityId);
  }

  private drawFallbackCity(cityName: string): void {
    // Simple placeholder for cities without maps
    const g = this.add.graphics();
    g.fillStyle(0x151b25, 1);
    g.fillRect(0, 0, MAP_WIDTH, 768);

    this.add
      .text(512, 384, `${cityName}\nCITY MAP COMING SOON`, {
        fontFamily: FONT_FAMILY,
        fontSize: "24px",
        color: COLORS.secondaryText,
        align: "center",
      })
      .setOrigin(0.5);
  }
}
