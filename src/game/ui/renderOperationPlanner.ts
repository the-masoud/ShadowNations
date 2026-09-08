import Phaser from "phaser";
import type { GameState } from "../../core/model/gameState.js";
import type { CovertSabotageObjective } from "../../core/model/covertSabotage.js";
import type { OperationResult } from "../../core/model/operationResult.js";
import { validateGameState } from "../../core/simulation/validateGameState.js";
import { createOperationPlannerModel } from "./operationPlannerPresentation.js";
import {
  executeOperationPlannerCommand,
  type OperationPlannerCommand,
} from "./executeOperationPlannerCommand.js";

export function renderOperationPlanner(
  scene: Phaser.Scene,
  state: Readonly<GameState>,
  onOperationExecuted: (result: OperationResult) => void,
): void {
  validateGameState(state);

  const model = createOperationPlannerModel(state);

  if (model.targets.length !== 5) {
    throw new Error(
      `Operation planner requires exactly 5 foreign targets, got ${model.targets.length}`,
    );
  }

  if (model.agents.length < 1) {
    throw new Error("Operation planner requires at least 1 player agent");
  }

  let selectedOperationIndex = 0;
  let selectedTargetIndex = 0;
  let selectedSecondaryIndex = 1;
  let selectedAgentIndex = 0;
  let selectedSabotageObjective: CovertSabotageObjective = "internal-security";
  let selectedTurnableIndex = 0;
  let selectedDoubleIndex = 0;
  let selectedConflictIndex = 0;

  const launcher = scene.add
    .text(800, 24, "OPERATION PLANNER", {
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      color: "#d7dee8",
      backgroundColor: "#111827",
      padding: { left: 10, right: 10, top: 6, bottom: 6 },
    })
    .setOrigin(0, 0)
    .setInteractive({ useHandCursor: true });

  const plannerContainer = scene.add.container(0, 0);

  const bg = scene.add.rectangle(512, 384, 1024, 768, 0x0d131d, 1);
  bg.setInteractive();
  plannerContainer.add(bg);

  const title = scene.add
    .text(512, 38, "OPERATION PLANNER", {
      fontFamily: "Arial, sans-serif",
      fontSize: "26px",
      color: "#e2e8f0",
      fontStyle: "bold",
    })
    .setOrigin(0.5, 0.5);
  plannerContainer.add(title);

  const actorApLine = scene.add
    .text(512, 68, `${model.actorNationName.toUpperCase()} / ${model.actorNationCode}   AP ${model.remainingActionPoints}/${model.maximumActionPoints}`, {
      fontFamily: "Arial, sans-serif",
      fontSize: "11px",
      color: "#aeb9c7",
    })
    .setOrigin(0.5, 0.5);
  plannerContainer.add(actorApLine);

  const operationsHeading = scene.add
    .text(48, 100, "OPERATIONS", {
      fontFamily: "Arial, sans-serif",
      fontSize: "11px",
      color: "#7f8da1",
      fontStyle: "bold",
    })
    .setOrigin(0, 0.5);
  plannerContainer.add(operationsHeading);

  const parametersHeading = scene.add
    .text(560, 100, "PARAMETERS", {
      fontFamily: "Arial, sans-serif",
      fontSize: "11px",
      color: "#7f8da1",
      fontStyle: "bold",
    })
    .setOrigin(0, 0.5);
  plannerContainer.add(parametersHeading);

  const operationTexts: Phaser.GameObjects.Text[] = [];
  for (let i = 0; i < model.operations.length; i++) {
    const op = model.operations[i];
    const text = scene.add
      .text(48, 128 + i * 32, `${op.label}  [${op.actionPointCost} AP]`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        color: "#d7dee8",
        backgroundColor: i === 0 ? "#263244" : "#111827",
        padding: { left: 8, right: 8, top: 5, bottom: 5 },
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });

    text.on("pointerdown", () => {
      selectedOperationIndex = i;
      statusText.setText("READY");
      refreshOperationHighlight();
      refreshParameterText();
    });

    operationTexts.push(text);
    plannerContainer.add(text);
  }

  function refreshOperationHighlight(): void {
    for (let i = 0; i < operationTexts.length; i++) {
      operationTexts[i].setBackgroundColor(
        i === selectedOperationIndex ? "#263244" : "#111827",
      );
    }
  }

  const targetText = scene.add
    .text(560, 160, `TARGET  ${model.targets[selectedTargetIndex].nationCode} / ${model.targets[selectedTargetIndex].nationName.toUpperCase()}`, {
      fontFamily: "Arial, sans-serif",
      fontSize: "13px",
      color: "#e2e8f0",
      backgroundColor: "#111827",
      padding: { left: 10, right: 10, top: 7, bottom: 7 },
    })
    .setOrigin(0, 0.5)
    .setInteractive({ useHandCursor: true });

  targetText.on("pointerdown", () => {
    selectedTargetIndex = (selectedTargetIndex + 1) % model.targets.length;
    refreshParameterText();
  });
  plannerContainer.add(targetText);

  const secondaryText = scene.add
    .text(560, 210, `SECONDARY/HOST  ${model.targets[selectedSecondaryIndex].nationCode} / ${model.targets[selectedSecondaryIndex].nationName.toUpperCase()}`, {
      fontFamily: "Arial, sans-serif",
      fontSize: "13px",
      color: "#e2e8f0",
      backgroundColor: "#111827",
      padding: { left: 10, right: 10, top: 7, bottom: 7 },
    })
    .setOrigin(0, 0.5)
    .setInteractive({ useHandCursor: true });

  secondaryText.on("pointerdown", () => {
    selectedSecondaryIndex = (selectedSecondaryIndex + 1) % model.targets.length;
    refreshParameterText();
  });
  plannerContainer.add(secondaryText);

  const agentText = scene.add
    .text(560, 260, `AGENT  ${model.agents[selectedAgentIndex].codename.toUpperCase()}`, {
      fontFamily: "Arial, sans-serif",
      fontSize: "13px",
      color: "#e2e8f0",
      backgroundColor: "#111827",
      padding: { left: 10, right: 10, top: 7, bottom: 7 },
    })
    .setOrigin(0, 0.5)
    .setInteractive({ useHandCursor: true });

  agentText.on("pointerdown", () => {
    selectedAgentIndex = (selectedAgentIndex + 1) % model.agents.length;
    refreshParameterText();
  });
  plannerContainer.add(agentText);

  const assetText = scene.add
    .text(560, 310, "ASSET  N/A", {
      fontFamily: "Arial, sans-serif",
      fontSize: "13px",
      color: "#e2e8f0",
      backgroundColor: "#111827",
      padding: { left: 10, right: 10, top: 7, bottom: 7 },
    })
    .setOrigin(0, 0.5)
    .setInteractive({ useHandCursor: true });

  assetText.on("pointerdown", () => {
    const kind = model.operations[selectedOperationIndex].kind;
    if (kind === "turn-asset" && model.turnableAssets.length > 0) {
      selectedTurnableIndex = (selectedTurnableIndex + 1) % model.turnableAssets.length;
    } else if (kind === "feed-false-intelligence" && model.controlledDoubleAgents.length > 0) {
      selectedDoubleIndex = (selectedDoubleIndex + 1) % model.controlledDoubleAgents.length;
    }
    refreshParameterText();
  });
  plannerContainer.add(assetText);

  const conflictText = scene.add
    .text(560, 360, model.proxyConflicts.length === 0
      ? "CONFLICT  NONE"
      : `CONFLICT  ${model.proxyConflicts[selectedConflictIndex].conflictId} / ${model.proxyConflicts[selectedConflictIndex].hostNationCode} / ${model.proxyConflicts[selectedConflictIndex].intensity.toUpperCase()}`, {
      fontFamily: "Arial, sans-serif",
      fontSize: "13px",
      color: "#e2e8f0",
      backgroundColor: "#111827",
      padding: { left: 10, right: 10, top: 7, bottom: 7 },
    })
    .setOrigin(0, 0.5)
    .setInteractive({ useHandCursor: true });

  conflictText.on("pointerdown", () => {
    if (model.proxyConflicts.length > 0) {
      selectedConflictIndex = (selectedConflictIndex + 1) % model.proxyConflicts.length;
    }
    refreshParameterText();
  });
  plannerContainer.add(conflictText);

  const objectiveText = scene.add
    .text(560, 410, "OBJECTIVE  INTERNAL SECURITY", {
      fontFamily: "Arial, sans-serif",
      fontSize: "13px",
      color: "#e2e8f0",
      backgroundColor: "#111827",
      padding: { left: 10, right: 10, top: 7, bottom: 7 },
    })
    .setOrigin(0, 0.5)
    .setInteractive({ useHandCursor: true });

  objectiveText.on("pointerdown", () => {
    selectedSabotageObjective =
      selectedSabotageObjective === "internal-security"
        ? "public-support"
        : "internal-security";
    refreshParameterText();
  });
  plannerContainer.add(objectiveText);

  function refreshParameterText(): void {
    const kind = model.operations[selectedOperationIndex].kind;
    const tgt = model.targets[selectedTargetIndex];
    const sec = model.targets[selectedSecondaryIndex];
    const agt = model.agents[selectedAgentIndex];

    targetText.setText(`TARGET  ${tgt.nationCode} / ${tgt.nationName.toUpperCase()}`);
    secondaryText.setText(`SECONDARY/HOST  ${sec.nationCode} / ${sec.nationName.toUpperCase()}`);
    agentText.setText(`AGENT  ${agt.codename.toUpperCase()}`);

    if (kind === "turn-asset") {
      if (model.turnableAssets.length > 0) {
        const asset = model.turnableAssets[selectedTurnableIndex];
        assetText.setText(`TURN ASSET  ${asset.assetId} / ${asset.sourceNationCode}`);
      } else {
        assetText.setText("TURN ASSET  NONE");
      }
    } else if (kind === "feed-false-intelligence") {
      if (model.controlledDoubleAgents.length > 0) {
        const asset = model.controlledDoubleAgents[selectedDoubleIndex];
        assetText.setText(`DOUBLE ASSET  ${asset.assetId} / ${asset.sourceNationCode}`);
      } else {
        assetText.setText("DOUBLE ASSET  NONE");
      }
    } else {
      assetText.setText("ASSET  N/A");
    }

    if (model.proxyConflicts.length === 0) {
      conflictText.setText("CONFLICT  NONE");
    } else {
      const conflict = model.proxyConflicts[selectedConflictIndex];
      conflictText.setText(`CONFLICT  ${conflict.conflictId} / ${conflict.hostNationCode} / ${conflict.intensity.toUpperCase()}`);
    }

    objectiveText.setText(
      selectedSabotageObjective === "internal-security"
        ? "OBJECTIVE  INTERNAL SECURITY"
        : "OBJECTIVE  PUBLIC SUPPORT",
    );
  }

  function buildCommand(): OperationPlannerCommand {
    const kind = model.operations[selectedOperationIndex].kind;
    const tgt = model.targets[selectedTargetIndex];
    const sec = model.targets[selectedSecondaryIndex];
    const agt = model.agents[selectedAgentIndex];

    switch (kind) {
      case "build-network":
        return { kind, targetNationId: tgt.nationId, agentId: agt.agentId };
      case "gather-intelligence":
        return { kind, targetNationId: tgt.nationId, agentId: agt.agentId };
      case "recruit-asset":
        return { kind, targetNationId: tgt.nationId, agentId: agt.agentId };
      case "counterintelligence-sweep":
        return { kind, intruderNationId: tgt.nationId };
      case "turn-asset": {
        if (model.turnableAssets.length === 0) {
          throw new Error("No turnable intelligence asset is available.");
        }
        return { kind, assetId: model.turnableAssets[selectedTurnableIndex].assetId };
      }
      case "feed-false-intelligence": {
        if (model.controlledDoubleAgents.length === 0) {
          throw new Error("No controlled double agent is available.");
        }
        return { kind, assetId: model.controlledDoubleAgents[selectedDoubleIndex].assetId };
      }
      case "cultivate-influence":
        return { kind, targetNationId: tgt.nationId };
      case "diplomatic-outreach":
        return { kind, targetNationId: tgt.nationId };
      case "stabilize-government":
        return { kind, targetNationId: tgt.nationId };
      case "covert-sabotage":
        return { kind, targetNationId: tgt.nationId, agentId: agt.agentId, objective: selectedSabotageObjective };
      case "start-proxy-conflict":
        return { kind, rivalNationId: tgt.nationId, hostNationId: sec.nationId };
      case "escalate-proxy-conflict": {
        if (model.proxyConflicts.length === 0) {
          throw new Error("No player proxy conflict is available.");
        }
        return { kind, conflictId: model.proxyConflicts[selectedConflictIndex].conflictId };
      }
      case "apply-regime-pressure":
        return { kind, targetNationId: tgt.nationId };
    }
  }

  const executeText = scene.add
    .text(560, 470, "EXECUTE OPERATION", {
      fontFamily: "Arial, sans-serif",
      fontSize: "13px",
      color: "#f5f7fa",
      backgroundColor: "#263244",
      fontStyle: "bold",
      padding: { left: 12, right: 12, top: 8, bottom: 8 },
    })
    .setOrigin(0, 0.5)
    .setInteractive({ useHandCursor: true });
  plannerContainer.add(executeText);

  const statusText = scene.add
    .text(560, 520, "READY", {
      fontFamily: "Arial, sans-serif",
      fontSize: "11px",
      color: "#aeb9c7",
      wordWrap: { width: 400 },
    })
    .setOrigin(0, 0);
  plannerContainer.add(statusText);

  executeText.on("pointerdown", () => {
    statusText.setText("READY");
    try {
      const command = buildCommand();
      const result = executeOperationPlannerCommand(state, command);
      onOperationExecuted(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      statusText.setText(`ERROR: ${message}`);
    }
  });

  const closeText = scene.add
    .text(976, 24, "CLOSE", {
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      color: "#d7dee8",
      backgroundColor: "#111827",
      padding: { left: 10, right: 10, top: 6, bottom: 6 },
    })
    .setOrigin(1, 0)
    .setInteractive({ useHandCursor: true });

  closeText.on("pointerdown", () => {
    plannerContainer.setVisible(false);
    launcher.setVisible(true);
  });
  plannerContainer.add(closeText);

  launcher.on("pointerdown", () => {
    launcher.setVisible(false);
    plannerContainer.setVisible(true);
  });

  plannerContainer.setVisible(false);
}
