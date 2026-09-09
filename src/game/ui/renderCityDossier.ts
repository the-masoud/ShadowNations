import Phaser from "phaser";
import type { GameState } from "../../core/model/gameState.js";
import type { CityId } from "../../core/model/city.js";
import type { OperationResult } from "../../core/model/operationResult.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import { createCityDossierModel } from "./cityDossierPresentation.js";
import {
  executeCityDossierCommand,
  type CityDossierCommand,
} from "./executeCityDossierCommand.js";

const PANEL_X = 40;
const PANEL_Y = 40;
const PANEL_WIDTH = 640;
const PANEL_HEIGHT = 680;

const HEADER_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: "Arial, sans-serif",
  fontSize: "18px",
  color: "#e2e8f0",
  fontStyle: "bold",
};

const SECTION_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: "Arial, sans-serif",
  fontSize: "11px",
  color: "#7f8da1",
  fontStyle: "bold",
};

const FIELD_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: "Arial, sans-serif",
  fontSize: "12px",
  color: "#c3ccd8",
};

const OP_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: "Arial, sans-serif",
  fontSize: "12px",
  color: "#d7dee8",
  backgroundColor: "#111827",
  padding: { left: 8, right: 8, top: 5, bottom: 5 },
};

const OP_DISABLED_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: "Arial, sans-serif",
  fontSize: "12px",
  color: "#6b7280",
  backgroundColor: "#111827",
  padding: { left: 8, right: 8, top: 5, bottom: 5 },
};

export function renderCityDossier(
  scene: Phaser.Scene,
  state: Readonly<GameState>,
  onOperationExecuted: (result: OperationResult) => void,
): { open: (cityId: CityId) => void; close: () => void } {
  validateGameState(state);

  const container = scene.add.container(0, 0);
  container.setDepth(100);

  const bg = scene.add.rectangle(
    PANEL_X + PANEL_WIDTH / 2,
    PANEL_Y + PANEL_HEIGHT / 2,
    PANEL_WIDTH,
    PANEL_HEIGHT,
    0x0d131d,
    0.95,
  );
  bg.setInteractive();
  container.add(bg);

  const titleText = scene.add
    .text(PANEL_X + PANEL_WIDTH / 2, PANEL_Y + 16, "CITY DOSSIER", HEADER_STYLE)
    .setOrigin(0.5, 0.5);
  container.add(titleText);

  const closeText = scene.add
    .text(PANEL_X + PANEL_WIDTH - 10, PANEL_Y + 10, "CLOSE", {
      fontFamily: "Arial, sans-serif",
      fontSize: "11px",
      color: "#d7dee8",
      backgroundColor: "#111827",
      padding: { left: 8, right: 8, top: 4, bottom: 4 },
    })
    .setOrigin(1, 0)
    .setInteractive({ useHandCursor: true });
  container.add(closeText);

  const cityField = scene.add
    .text(PANEL_X + 16, PANEL_Y + 40, "", FIELD_STYLE)
    .setOrigin(0, 0);
  container.add(cityField);

  const roleField = scene.add
    .text(PANEL_X + 16, PANEL_Y + 58, "", FIELD_STYLE)
    .setOrigin(0, 0);
  container.add(roleField);

  const regionField = scene.add
    .text(PANEL_X + 16, PANEL_Y + 76, "", FIELD_STYLE)
    .setOrigin(0, 0);
  container.add(regionField);

  const controllerField = scene.add
    .text(PANEL_X + 16, PANEL_Y + 94, "", FIELD_STYLE)
    .setOrigin(0, 0);
  container.add(controllerField);

  const securityHeader = scene.add
    .text(PANEL_X + 16, PANEL_Y + 120, "SECURITY", SECTION_STYLE)
    .setOrigin(0, 0);
  container.add(securityHeader);

  const securityField = scene.add
    .text(PANEL_X + 16, PANEL_Y + 138, "", FIELD_STYLE)
    .setOrigin(0, 0);
  container.add(securityField);

  const bandField = scene.add
    .text(PANEL_X + 16, PANEL_Y + 156, "", FIELD_STYLE)
    .setOrigin(0, 0);
  container.add(bandField);

  const intelHeader = scene.add
    .text(PANEL_X + 16, PANEL_Y + 182, "INTELLIGENCE", SECTION_STYLE)
    .setOrigin(0, 0);
  container.add(intelHeader);

  const visibilityField = scene.add
    .text(PANEL_X + 16, PANEL_Y + 200, "", FIELD_STYLE)
    .setOrigin(0, 0);
  container.add(visibilityField);

  const networkField = scene.add
    .text(PANEL_X + 16, PANEL_Y + 218, "", FIELD_STYLE)
    .setOrigin(0, 0);
  container.add(networkField);

  const statsHeader = scene.add
    .text(PANEL_X + 16, PANEL_Y + 244, "TARGET NATION STATS", SECTION_STYLE)
    .setOrigin(0, 0);
  container.add(statsHeader);

  const statAField = scene.add
    .text(PANEL_X + 16, PANEL_Y + 262, "", FIELD_STYLE)
    .setOrigin(0, 0);
  container.add(statAField);

  const statBField = scene.add
    .text(PANEL_X + 16, PANEL_Y + 280, "", FIELD_STYLE)
    .setOrigin(0, 0);
  container.add(statBField);

  const statCField = scene.add
    .text(PANEL_X + 16, PANEL_Y + 298, "", FIELD_STYLE)
    .setOrigin(0, 0);
  container.add(statCField);

  const affectedStatField = scene.add
    .text(PANEL_X + 16, PANEL_Y + 316, "", FIELD_STYLE)
    .setOrigin(0, 0);
  container.add(affectedStatField);

  const agentsHeader = scene.add
    .text(PANEL_X + 16, PANEL_Y + 342, "AGENTS", SECTION_STYLE)
    .setOrigin(0, 0);
  container.add(agentsHeader);

  const agentsField = scene.add
    .text(PANEL_X + 16, PANEL_Y + 360, "", FIELD_STYLE)
    .setOrigin(0, 0);
  container.add(agentsField);

  const opsHeader = scene.add
    .text(PANEL_X + 16, PANEL_Y + 386, "CITY OPERATIONS", SECTION_STYLE)
    .setOrigin(0, 0);
  container.add(opsHeader);

  const opTexts: Phaser.GameObjects.Text[] = [];
  for (let i = 0; i < 3; i++) {
    const text = scene.add
      .text(PANEL_X + 16, PANEL_Y + 404 + i * 32, "", OP_STYLE)
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    container.add(text);
    opTexts.push(text);
  }

  const agentSelectText = scene.add
    .text(PANEL_X + 16, PANEL_Y + 500, "", {
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      color: "#d7dee8",
      backgroundColor: "#111827",
      padding: { left: 8, right: 8, top: 5, bottom: 5 },
    })
    .setOrigin(0, 0.5)
    .setInteractive({ useHandCursor: true });
  container.add(agentSelectText);

  const executeText = scene.add
    .text(PANEL_X + 16, PANEL_Y + 534, "EXECUTE", {
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      color: "#f5f7fa",
      backgroundColor: "#263244",
      fontStyle: "bold",
      padding: { left: 10, right: 10, top: 6, bottom: 6 },
    })
    .setOrigin(0, 0.5)
    .setInteractive({ useHandCursor: true });
  container.add(executeText);

  const statusText = scene.add
    .text(PANEL_X + 16, PANEL_Y + 560, "", {
      fontFamily: "Arial, sans-serif",
      fontSize: "11px",
      color: "#aeb9c7",
      wordWrap: { width: PANEL_WIDTH - 32 },
    })
    .setOrigin(0, 0);
  container.add(statusText);

  let selectedAgentIndex = 0;
  let selectedOpIndex = -1;
  let currentCityId: CityId | null = null;

  function refresh(cityId: CityId): void {
    currentCityId = cityId;
    selectedOpIndex = -1;
    statusText.setText("");

    const model = createCityDossierModel(state, cityId);

    titleText.setText(`CITY DOSSIER \u2014 ${model.cityName.toUpperCase()}`);
    cityField.setText(`CITY: ${model.cityName}`);
    roleField.setText(`ROLE: ${model.cityRole.toUpperCase()}`);
    regionField.setText(`REGION: ${model.regionName} (${model.regionCode})`);
    controllerField.setText(
      `CONTROLLER: ${model.controllerNationName} (${model.controllerNationCode})`,
    );

    if (model.showCurrentSecurity) {
      securityField.setText(`CURRENT: ${model.currentSecurity}`);
    } else {
      securityField.setText("CURRENT: HIDDEN");
    }

    if (model.showBaseSecurity) {
      bandField.setText(
        `BASE: ${model.baseSecurity}  |  BAND: ${model.securityBand}`,
      );
    } else if (model.showBand) {
      bandField.setText(`BAND: ${model.securityBand}`);
    } else {
      bandField.setText("BAND: HIDDEN");
    }

    visibilityField.setText(`VISIBILITY: ${model.visibility.toUpperCase()}`);
    networkField.setText(`NETWORK: ${model.networkLevel.toUpperCase()}`);

    statAField.setText(`STABILITY: ${model.targetNationStability}`);
    statBField.setText(`PUBLIC SUPPORT: ${model.targetNationPublicSupport}`);
    statCField.setText(`INTERNAL SECURITY: ${model.targetNationInternalSecurity}`);
    affectedStatField.setText(`AFFECTED STAT: ${model.affectedStatDisplayName}`);

    if (model.agents.length > 0) {
      if (selectedAgentIndex >= model.agents.length) {
        selectedAgentIndex = 0;
      }
      agentsField.setText(
        model.agents
          .map((a, i) =>
            i === selectedAgentIndex
              ? `[${a.codename.toUpperCase()}]`
              : a.codename.toUpperCase(),
          )
          .join("  "),
      );
      agentSelectText.setText(
        `AGENT: ${model.agents[selectedAgentIndex].codename.toUpperCase()}  (click to cycle)`,
      );
      agentSelectText.setVisible(true);
    } else {
      agentsField.setText("NONE");
      agentSelectText.setVisible(false);
    }

    for (let i = 0; i < 3; i++) {
      const op = model.operations[i];
      opTexts[i].setText(`${op.label}  [${op.actionPointCost} AP]  ${op.targetEffect}`);
      if (op.enabled) {
        opTexts[i].setStyle(OP_STYLE);
        opTexts[i].setBackgroundColor("#111827");
      } else {
        opTexts[i].setStyle(OP_DISABLED_STYLE);
        opTexts[i].setBackgroundColor("#0a0f18");
      }
    }

    executeText.setVisible(model.agents.length > 0);
  }

  agentSelectText.on("pointerdown", () => {
    const model = createCityDossierModel(state, currentCityId!);
    if (model.agents.length > 0) {
      selectedAgentIndex = (selectedAgentIndex + 1) % model.agents.length;
      refresh(currentCityId!);
    }
  });

  for (let i = 0; i < 3; i++) {
    opTexts[i].on("pointerdown", () => {
      const model = createCityDossierModel(state, currentCityId!);
      if (model.operations[i].enabled) {
        selectedOpIndex = i;
        statusText.setText(`SELECTED: ${model.operations[i].label}`);
        for (let j = 0; j < 3; j++) {
          opTexts[j].setBackgroundColor(j === i ? "#263244" : "#111827");
        }
      } else {
        statusText.setText(`DISABLED: ${model.operations[i].disabledReason}`);
      }
    });
  }

  executeText.on("pointerdown", () => {
    if (selectedOpIndex < 0 || currentCityId === null) {
      statusText.setText("SELECT AN OPERATION FIRST");
      return;
    }

    const model = createCityDossierModel(state, currentCityId);
    if (model.agents.length === 0) {
      statusText.setText("NO AGENTS AVAILABLE");
      return;
    }

    const op = model.operations[selectedOpIndex];
    if (!op.enabled) {
      statusText.setText(`DISABLED: ${op.disabledReason}`);
      return;
    }

    const agentId = model.agents[selectedAgentIndex].agentId;

    const command: CityDossierCommand = {
      kind: op.kind,
      cityId: currentCityId,
      agentId,
    };

    statusText.setText("EXECUTING...");

    try {
      const result = executeCityDossierCommand(state, command);
      onOperationExecuted(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      statusText.setText(`ERROR: ${message}`);
    }
  });

  closeText.on("pointerdown", () => {
    container.setVisible(false);
  });

  container.setVisible(false);

  return {
    open: (cityId: CityId) => {
      refresh(cityId);
      container.setVisible(true);
    },
    close: () => {
      container.setVisible(false);
    },
  };
}
