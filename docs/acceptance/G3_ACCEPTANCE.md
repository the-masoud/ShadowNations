# Shadow Nations — G3 Acceptance

## Verdict

G3 ACCEPTANCE: PASS

## Accepted Production Baseline

Date: 2026-09-07

Accepted G3 production HEAD:

317b5f2

Repository:

https://github.com/the-masoud/ShadowNations.git

Tests:

1259 PASS / 27 files

Build:

PASS

Core purity/import:

PASS

## G3.1 — AI Perception

- Derived observer-specific perception, non-persistent GameState.
- Fields: observerNationId, turn, phase, actionPoints, selfStrategicStats, foreignNations, involvedProxyConflicts.
- Self strategic stats are exact numeric values.
- Observer AP is exact.
- Foreign visibility: "unknown", "limited", "known".
- Foreign strategic stats: unknown exposes nothing, limited exposes low/medium/high bands (0-33 low, 34-66 medium, 67-100 high), known exposes exact values.
- Foreign nations preserve world nation order with observer removed.
- Observer-relative fields: diplomaticStatus, observerInfluence, observerRegimePressure, intelligenceNetworkLevel, defensiveAwareness.
- Only observer-involved proxy conflicts exposed.
- No state mutation. No persistence. No randomness.

## G3.2 — AI Personalities

- Static personality configuration, one fixed profile per canonical nation.
- Five fields: nationId, assertiveness, caution, diplomacyAffinity, intelligenceAffinity.
- Trait range: integer 0..100.
- Canonical profiles:

| Nation | assertiveness | caution | diplomacyAffinity | intelligenceAffinity |
|---|---|---|---|---|
| solaris | 55 | 50 | 75 | 65 |
| dravos | 80 | 40 | 25 | 70 |
| norvia | 35 | 75 | 80 | 45 |
| veloria | 50 | 60 | 85 | 60 |
| karsen | 70 | 45 | 40 | 75 |
| arkania | 60 | 65 | 55 | 80 |

- Unknown nation lookup throws `UnknownAiPersonalityError`.
- No planning or action execution in G3.2.

## G3.3 — AI Planning

- Plan shape: `{ observerNationId, turn, domain, targetNationId }`.
- Domains: exactly "diplomacy" | "intelligence".
- Domain scoring: diplomacyScore = diplomacyAffinity + caution; intelligenceScore = intelligenceAffinity + assertiveness. Tie goes to diplomacy.
- Diplomacy target score: hostile=30, neutral=15, friendly=0, plus Math.floor(observerInfluence / 10).
- Intelligence target score: visibility (unknown=30, limited=15, known=0) + network (none=20, foothold=10, established=5, deep=0) + defensive awareness (unaware=0, suspected=10, identified=20).
- Equal target scores preserve first foreignNations order.
- No AP spending. No gameplay operation selection. No state mutation.

## G3.4 — AI Diplomacy

- Decision shape: `{ observerNationId, turn, targetNationId, action }`.
- Four actions: "cultivate-political-influence", "conduct-diplomatic-outreach", "stabilize-government", "pass".
- Plan target is authoritative; no rescoring or target replacement.
- Perception inputs: diplomaticStatus, observerInfluence, strategicStats, remaining AP.
- Hostile/neutral: influence >= 30 → outreach if affordable; otherwise cultivate if affordable; unaffordable preferred → pass.
- Friendly: influence >= 40 and stability known below 100 → stabilize if affordable; otherwise influence < 100 → cultivate if affordable; otherwise pass.
- Decision-only. No AP spending. No GameEvent. No state mutation. No persistence.

## G3.5 — AI Espionage

- Decision shape: `{ observerNationId, turn, targetNationId, action, sabotageObjective }`.
- Five actions: "build-intelligence-network", "gather-intelligence", "counterintelligence-sweep", "conduct-covert-sabotage", "pass".
- sabotageObjective: "internal-security" | "public-support" | null.
- Plan target is authoritative; no rescoring or target replacement.
- Policy precedence: suspected defensive awareness → sweep; weak network (none/foothold) → build; insufficient visibility (unknown/limited) with established/deep → gather; known + established → build; known + deep + exact → sabotage evaluation (internalSecurity > 0 before publicSupport > 0); else → pass.
- No cheaper fallback: unaffordable preferred action returns pass without falling through.
- Only visibility, strategicStats, intelligenceNetworkLevel, defensiveAwareness, remaining AP affect action selection.
- No agentId, assetId, recruit-asset, turn-asset, feed-false-intelligence.
- Decision-only. No AP spending. No state mutation.

## G3.6 — Simulation Harness

- One supplied planning GameState → one derived snapshot.
- Processes every `state.world.nations` entry exactly once in existing order; playerNationId included.
- Per-nation pipeline: createAiPerception → getAiPersonality → createAiPlan → accepted domain-specific decision function.
- Normalized AiSimulationDecision discriminated union on domain: diplomacy (sabotageObjective: null) and intelligence (preserves G3.5 sabotageObjective).
- Plan domain and target are authoritative; no G3.3/G3.4/G3.5 scoring or policy duplicated.
- No gameplay execution. No AP spending. No resolveTurn. No TurnOrder. No GameEvent.
- One call produces one snapshot only; no multi-turn simulation and no persistent AI state.
- Deterministic and non-persistent.

## Canonical Initial AI Snapshot

| Nation | Domain | Target | Action | Sabotage Objective |
|---|---|---|---|---|
| Solaris | diplomacy | Dravos | cultivate-political-influence | null |
| Dravos | intelligence | Solaris | build-intelligence-network | null |
| Norvia | diplomacy | Dravos | cultivate-political-influence | null |
| Veloria | diplomacy | Karsen | conduct-diplomatic-outreach | null |
| Karsen | intelligence | Solaris | build-intelligence-network | null |
| Arkania | intelligence | Solaris | build-intelligence-network | null |

## Determinism and Core Purity

1259 tests PASS

27 test files PASS

build PASS

0 forbidden runtime matches

0 src/game/src/ui imports

G3 remains deterministic. No randomness or wall-clock dependency exists in accepted G3 core AI.

## State and Event Integrity

GameState gained no persistent G3 AI field.

WorldState gained no persistent G3 AI field.

PlanningState unchanged by G3.

IntelligenceState unchanged by G3.

GameEvent remains exactly 14 variants.

No G3 GameEvent exists.

TurnOrder remains pass-only.

No AI decision became a TurnOrder.

## G3 Scope Audit

No automatic AI turns.

No gameplay execution from AI decision layers.

No multi-turn simulation.

No persistent AI memory.

No AI learning.

No randomness.

No G4 renderer/UI implementation.

## Milestones Accepted

| Milestone | Commit |
|---|---|
| G3.1 — AI Perception | c69cc3f |
| G3.2 — AI Personalities | a47c37d |
| G3.3 — AI Planning | 4b8cdd5 |
| G3.4 — AI Diplomacy | 31ee23a |
| G3.5 — AI Espionage | 1b44a13 |
| G3.6 — Simulation Harness | 317b5f2 |

## Next Official Milestone

G4.1 — Strategic Map Renderer

---

**G3 ACCEPTANCE: PASS**

**NEXT OFFICIAL MILESTONE:**
**G4.1 — Strategic Map Renderer**
