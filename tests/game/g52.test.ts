import { describe, it, expect } from "vitest";
import type { NationId } from "../../src/core/model/nation.js";
import {
  createCampaignSetupPresentationModel,
} from "../../src/game/ui/campaignSetupPresentation.js";
import { UnknownNationError } from "../../src/core/model/worldState.js";

describe("campaignSetupPresentation", () => {
  // K — Exact top-level keys
  it("K: exact top-level keys", () => {
    const model = createCampaignSetupPresentationModel("solaris");
    expect(Object.keys(model)).toEqual(["selectedNationId", "nations"]);
  });

  // L — Exact nation keys
  it("L: exact nation keys", () => {
    const model = createCampaignSetupPresentationModel("solaris");
    expect(Object.keys(model.nations[0])).toEqual([
      "nationId",
      "nationName",
      "nationCode",
      "nationColor",
      "stability",
      "publicSupport",
      "internalSecurity",
      "selected",
    ]);
  });

  // M — Canonical initial presentation
  it("M: canonical initial presentation", () => {
    const model = createCampaignSetupPresentationModel("solaris");
    expect(model.selectedNationId).toBe("solaris");
    expect(model.nations.map((n) => n.nationId)).toEqual([
      "solaris",
      "dravos",
      "norvia",
      "veloria",
      "karsen",
      "arkania",
    ]);
    const selectedCount = model.nations.filter((n) => n.selected).length;
    expect(selectedCount).toBe(1);
    expect(model.nations[0].selected).toBe(true);
  });

  // N — Alternate selection
  it("N: alternate selection (dravos)", () => {
    const model = createCampaignSetupPresentationModel("dravos");
    expect(model.selectedNationId).toBe("dravos");
    const selectedCount = model.nations.filter((n) => n.selected).length;
    expect(selectedCount).toBe(1);
    expect(model.nations[1].selected).toBe(true);
    expect(model.nations[0].selected).toBe(false);
  });

  // O — Exact nation colors
  it("O: exact nation colors", () => {
    const expected: Record<string, number> = {
      solaris: 0xd6b450,
      dravos: 0xbf5a5a,
      norvia: 0x5d8fc7,
      veloria: 0x8b6fc0,
      karsen: 0xc47a45,
      arkania: 0x4f9d82,
    };
    const model = createCampaignSetupPresentationModel("solaris");
    for (const nation of model.nations) {
      expect(nation.nationColor).toBe(expected[nation.nationId]);
    }
  });

  // P — Canonical strategic stats
  it("P: canonical strategic stats", () => {
    const expected: Record<string, [number, number, number]> = {
      solaris: [72, 68, 66],
      dravos: [78, 55, 82],
      norvia: [58, 74, 52],
      veloria: [70, 69, 60],
      karsen: [64, 57, 76],
      arkania: [61, 62, 58],
    };
    const model = createCampaignSetupPresentationModel("solaris");
    for (const nation of model.nations) {
      const [stb, sup, sec] = expected[nation.nationId];
      expect(nation.stability).toBe(stb);
      expect(nation.publicSupport).toBe(sup);
      expect(nation.internalSecurity).toBe(sec);
    }
  });

  // Q — Unknown selected nation
  it("Q: unknown selected nation throws UnknownNationError", () => {
    expect(() =>
      createCampaignSetupPresentationModel("unknown" as NationId),
    ).toThrow(UnknownNationError);
  });

  // R — Freshness
  it("R: fresh objects for identical input", () => {
    const a = createCampaignSetupPresentationModel("solaris");
    const b = createCampaignSetupPresentationModel("solaris");
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(a.nations).not.toBe(b.nations);
    for (let i = 0; i < a.nations.length; i++) {
      expect(a.nations[i]).not.toBe(b.nations[i]);
    }
  });
});
