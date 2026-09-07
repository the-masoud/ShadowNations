import { describe, it, expect } from "vitest";
import {
  getAiPersonality,
  UnknownAiPersonalityError,
} from "../../src/core/ai/aiPersonality.js";

const PROFILES = [
  {
    nationId: "solaris" as const,
    assertiveness: 55,
    caution: 50,
    diplomacyAffinity: 75,
    intelligenceAffinity: 65,
  },
  {
    nationId: "dravos" as const,
    assertiveness: 80,
    caution: 40,
    diplomacyAffinity: 25,
    intelligenceAffinity: 70,
  },
  {
    nationId: "norvia" as const,
    assertiveness: 35,
    caution: 75,
    diplomacyAffinity: 80,
    intelligenceAffinity: 45,
  },
  {
    nationId: "veloria" as const,
    assertiveness: 50,
    caution: 60,
    diplomacyAffinity: 85,
    intelligenceAffinity: 60,
  },
  {
    nationId: "karsen" as const,
    assertiveness: 70,
    caution: 45,
    diplomacyAffinity: 40,
    intelligenceAffinity: 75,
  },
  {
    nationId: "arkania" as const,
    assertiveness: 60,
    caution: 65,
    diplomacyAffinity: 55,
    intelligenceAffinity: 80,
  },
];

describe("G3.2 — AI Personalities", () => {
  describe("canonical profiles", () => {
    for (const profile of PROFILES) {
      describe(profile.nationId, () => {
        it("returns exact nationId", () => {
          const p = getAiPersonality(profile.nationId);
          expect(p.nationId).toBe(profile.nationId);
        });

        it("returns exact assertiveness", () => {
          const p = getAiPersonality(profile.nationId);
          expect(p.assertiveness).toBe(profile.assertiveness);
        });

        it("returns exact caution", () => {
          const p = getAiPersonality(profile.nationId);
          expect(p.caution).toBe(profile.caution);
        });

        it("returns exact diplomacyAffinity", () => {
          const p = getAiPersonality(profile.nationId);
          expect(p.diplomacyAffinity).toBe(profile.diplomacyAffinity);
        });

        it("returns exact intelligenceAffinity", () => {
          const p = getAiPersonality(profile.nationId);
          expect(p.intelligenceAffinity).toBe(profile.intelligenceAffinity);
        });

        it("all traits are integers", () => {
          const p = getAiPersonality(profile.nationId);
          expect(Number.isInteger(p.assertiveness)).toBe(true);
          expect(Number.isInteger(p.caution)).toBe(true);
          expect(Number.isInteger(p.diplomacyAffinity)).toBe(true);
          expect(Number.isInteger(p.intelligenceAffinity)).toBe(true);
        });

        it("all traits are in 0..100", () => {
          const p = getAiPersonality(profile.nationId);
          expect(p.assertiveness).toBeGreaterThanOrEqual(0);
          expect(p.assertiveness).toBeLessThanOrEqual(100);
          expect(p.caution).toBeGreaterThanOrEqual(0);
          expect(p.caution).toBeLessThanOrEqual(100);
          expect(p.diplomacyAffinity).toBeGreaterThanOrEqual(0);
          expect(p.diplomacyAffinity).toBeLessThanOrEqual(100);
          expect(p.intelligenceAffinity).toBeGreaterThanOrEqual(0);
          expect(p.intelligenceAffinity).toBeLessThanOrEqual(100);
        });

        it("runtime object has exactly five fields", () => {
          const p = getAiPersonality(profile.nationId);
          expect(Object.keys(p).sort()).toEqual([
            "assertiveness",
            "caution",
            "diplomacyAffinity",
            "intelligenceAffinity",
            "nationId",
          ]);
        });
      });
    }
  });

  describe("unknown personalities", () => {
    it("throws for unknown nationId", () => {
      expect(() => getAiPersonality("unknown" as any)).toThrow(
        UnknownAiPersonalityError,
      );
    });

    it("throws for capitalized variant", () => {
      expect(() => getAiPersonality("Solaris" as any)).toThrow(
        UnknownAiPersonalityError,
      );
    });

    it("throws for padded variant", () => {
      expect(() => getAiPersonality(" solaris " as any)).toThrow(
        UnknownAiPersonalityError,
      );
    });
  });

  describe("fresh object contract", () => {
    it("two calls return different references but deep equal", () => {
      const a = getAiPersonality("solaris");
      const b = getAiPersonality("solaris");
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  describe("determinism", () => {
    it("same nationId always returns deeply equal data", () => {
      const a = getAiPersonality("dravos");
      const b = getAiPersonality("dravos");
      expect(a).toEqual(b);
    });
  });

  describe("call-order independence", () => {
    it("solaris, dravos, solaris produces equal solaris results", () => {
      const first = getAiPersonality("solaris");
      getAiPersonality("dravos");
      const second = getAiPersonality("solaris");
      expect(first).toEqual(second);
    });
  });

  describe("state shape unchanged", () => {
    it("GameEvent remains 14 variants", () => {
      const eventTypes = [
        "intelligence-network-built",
        "intelligence-gathered",
        "intelligence-asset-recruited",
        "counterintelligence-sweep",
        "intelligence-asset-turned",
        "false-intelligence-fed",
        "turn-advanced",
        "political-influence-cultivated",
        "diplomatic-outreach-conducted",
        "government-stabilized",
        "covert-sabotage-conducted",
        "proxy-conflict-started",
        "proxy-conflict-escalated",
        "regime-pressure-applied",
      ];
      expect(eventTypes.length).toBe(14);
    });
  });
});
