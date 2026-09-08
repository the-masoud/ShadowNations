# Shadow Nations — G5 Acceptance

## Verdict

G5 ACCEPTANCE: PASS

## Accepted G5 Baseline

Date: 2026-09-08

Accepted G5 HEAD:

6e740ece85306c5948bec3109d174996fa77f434

Repository:

https://github.com/the-masoud/ShadowNations.git

Tests:

1484 PASS / 43 files

Build:

PASS

Core purity/import:

PASS

Automated/static acceptance:

PASS

Project-director browser acceptance:

PASS

## G5.1 — Victory / Defeat Conditions

- Campaign outcome remains derived from GameState.
- Strategic Hegemony requires player influence >= 75 over every foreign nation.
- National Collapse occurs when player Stability, Public Support or Internal Security reaches 0.
- Defeat precedence is: stability-collapse, public-support-collapse, internal-security-collapse.
- Defeat overrides simultaneous victory.
- Rules support every valid playerNationId.
- No campaign-outcome field added to GameState.

Exact constants:

```
STRATEGIC_HEGEMONY_INFLUENCE_THRESHOLD = 75
NATIONAL_COLLAPSE_THRESHOLD = 0
```

## G5.2 — Campaign Setup

- Player may select exactly one of six canonical nations: Solaris, Dravos, Norvia, Veloria, Karsen, Arkania.
- Campaign starts at turn 1 in planning phase.
- Every nation starts with 6/6 Action Points.
- Existing playerNationId field represents campaign selection.
- CampaignSetup adds no difficulty, scenario or seed.
- Boot flow enters CampaignSetupScene before MainScene.
- New campaign enters MainScene with showTutorial: true.
- Initial campaign outcome is ongoing for all six nations.

## G5.3 — Events & Crisis System

Exact constants:

```
CAMPAIGN_CRISIS_INTERVAL = 3
CAMPAIGN_CRISIS_IMPACT = 5
```

Deterministic crisis cycle:

- turn 3: stability-shock
- turn 6: public-support-shock
- turn 9: security-shock
- turn 12: stability-shock
- then repeat

- Crisis targets current player nation.
- Crisis reduces exactly one strategic stat by 5.
- Value clamps at 0.
- resolveTurn remains crisis-free.
- Campaign policy exists in resolveCampaignTurn.
- executeTurnResolution uses resolveCampaignTurn(state, []).
- No generated pass orders.
- Crisis event follows base turn events.
- No persistent event/crisis history added to GameState.

GameEvent current accepted variant count: 15

## G5.4 — Tutorial

Exact five tutorial steps:

1. mission
2. map
3. intelligence
4. operations
5. turns

- Tutorial is presentation-only.
- Tutorial appears only on initial new-campaign MainScene entry.
- Tutorial blocks underlying gameplay input while visible.
- Tutorial supports NEXT, START PLAYING and SKIP TUTORIAL.
- showTutorial is transient scene data only.
- Tutorial state is not stored in GameState.
- Tutorial state is not stored in localStorage.
- Operation and turn restarts do not reopen tutorial.
- Loaded campaigns do not reopen tutorial.

## G5.5 — Save / Load

Exact:

```
SAVE_GAME_VERSION = 1
SAVE_GAME_STORAGE_KEY = shadow-nations.save.v1
```

SaveGameEnvelope exact fields:

- version
- state

- Single browser-local save slot.
- Gameplay GameState only is persisted.
- pendingTurnEvents is not saved.
- tutorial state is not saved.
- overlay/selection presentation state is not saved.
- timeline is not saved.
- No event history is saved.
- No auto-save.
- No multiple save slots.
- Invalid/corrupt save data is rejected.
- Loaded GameState is validated.
- Campaign Setup supports LOAD CAMPAIGN.
- Loaded campaigns start without tutorial.
- Loaded pendingTurnEvents is empty.

## G5.6 — Replay / Timeline

Timeline is:

- session-local
- read-only
- outside GameState
- outside SaveGameEnvelope
- outside localStorage

CampaignTimeline exact field: entries

CampaignTimelineEntry exact fields:

- sequence
- kind
- turn
- eventType
- state

Entry kinds exactly:

- campaign-start
- operation
- turn

- Timeline starts with sequence 1.
- Successful operations append operation snapshots.
- Completed turns append turn snapshots.
- Existing historical snapshots remain immutable.
- ReplayScene browses historical GameState snapshots.
- PREVIOUS and NEXT navigate replay snapshots only.
- BACK TO LIVE always restores original liveState.
- Replay cannot modify live campaign state.
- pendingTurnEvents survives replay round-trip.
- Save/Load does not persist timeline.
- Loading a campaign creates a fresh one-entry timeline.
- Browser reload loses timeline history but preserves saved GameState.
- No rewind, restore, undo or branching exists.

## G5.7 — Balance Pass

G5.7 production changes: ZERO

Balance verdict exactly: PASS — NO PRODUCTION TUNING REQUIRED

Accepted balance constants:

```
ACTION_POINTS_PER_TURN = 6
CULTIVATE_POLITICAL_INFLUENCE_AP_COST = 2
POLITICAL_INFLUENCE_GAIN = 10
STRATEGIC_HEGEMONY_INFLUENCE_THRESHOLD = 75
CAMPAIGN_CRISIS_INTERVAL = 3
CAMPAIGN_CRISIS_IMPACT = 5
```

| Nation | Cultivate Operations | Victory Turn | Crises |
|---|---:|---:|---:|
| Solaris | 24 | 8 | 2 |
| Dravos | 24 | 8 | 2 |
| Norvia | 25 | 9 | 3 |
| Veloria | 22 | 8 | 2 |
| Karsen | 25 | 9 | 3 |
| Arkania | 23 | 8 | 2 |

Victory-turn spread: 1

No reference campaign ended in defeat.

All final strategic stats remained above 0.

## State, Turn and Event Integrity

- GameState contains no persistent G5 UI/history field.
- CampaignOutcome is derived.
- Campaign Setup uses existing playerNationId.
- pendingTurnEvents remains transient.
- tutorial state remains transient.
- timeline remains session-local.
- SaveGameEnvelope remains version/state only.
- GameEvent has exactly 15 variants.
- TurnOrder remains pass-only: { id, nationId, kind: "pass" }
- resolveTurn remains campaign-crisis-free.
- resolveCampaignTurn owns campaign-crisis policy.
- No automatic AI gameplay execution was added.

## Save / Replay Boundary

Save: current validated GameState only

Replay timeline: session-local historical GameState snapshots only

- Timeline is not serialized.
- Replay does not modify live state.
- Load resets timeline to one entry.
- Browser reload discards timeline history.
- Browser reload preserves valid localStorage GameState save.

## G5 Vertical Slice Browser Acceptance

1. Campaign Setup displayed all six canonical nations — PASS
2. Missing save returned NO SAVED CAMPAIGN — PASS
3. Corrupt save returned Saved campaign is not valid JSON — PASS
4. Dravos selection updated selected nation — PASS
5. New Dravos campaign opened Tutorial — PASS
6. Tutorial dismissal entered live Dravos campaign — PASS
7. Initial Timeline contained exactly one campaign-start snapshot — PASS
8. Build Network Dravos → Solaris succeeded — PASS
9. Solaris network became FOOTHOLD — PASS
10. Timeline appended INTELLIGENCE NETWORK BUILT snapshot — PASS
11. PREVIOUS displayed historical pre-operation snapshot — PASS
12. Gather Intelligence succeeded — PASS
13. Solaris visibility became LIMITED — PASS
14. Timeline appended INTELLIGENCE GATHERED snapshot — PASS
15. Turn 1 → Turn 2 resolution preserved both operation events before TURN ADVANCED — PASS
16. Turn 2 → Turn 3 resolution displayed exactly: TURN ADVANCED, CAMPAIGN CRISIS — STABILITY SHOCK — PASS
17. Dravos Stability changed from 78 to 73 — PASS
18. Save Campaign succeeded at Turn 3 — PASS
19. Additional Build Network advanced Solaris network from FOOTHOLD to ESTABLISHED — PASS
20. Load Campaign restored saved FOOTHOLD state — PASS
21. Loaded Dravos Stability remained 73 — PASS
22. Load reset Timeline to exactly one Turn-3 campaign-start snapshot — PASS
23. Browser reload returned to Campaign Setup — PASS
24. LOAD CAMPAIGN restored saved Dravos campaign — PASS
25. Tutorial did not reopen after load — PASS
26. Reloaded campaign Timeline contained exactly one Turn-3 campaign-start snapshot — PASS
27. Portrait 390×844 responsive display preserved FIT scaling — PASS
28. Portrait canvas display measured 390×234 — PASS
29. Portrait page had no overflow: scrollWidth 390, scrollHeight 844 — PASS
30. localStorage contained exactly one save key — PASS

## Determinism and Core Boundary

1484 tests PASS

43 test files PASS

build PASS

0 forbidden src/core runtime matches

0 src/core -> src/game imports

0 src/core -> src/ui imports

G5 remains deterministic in accepted core campaign behavior.

No Math.random or wall-clock campaign dependency was introduced.

## G5 Scope Audit

G5 introduced no:

- backend
- React
- database
- multiplayer
- automatic AI gameplay turns
- difficulty system
- scenario system
- dynamic difficulty
- persistent tutorial completion
- multiple save slots
- auto-save
- persistent event history
- rewind
- undo
- timeline branching
- G6 visual-polish implementation
- G6 audio implementation
- G6 performance implementation
- G6 CI/CD implementation
- deployment implementation
- release packaging

## Milestones Accepted

| Milestone | Commit |
|---|---|
| G5.1 — Victory / Defeat Conditions | e4f79b0 |
| G5.2 — Campaign Setup | 2840de9 |
| G5.3 — Events & Crisis System | 31f6b63 |
| G5.4 — Tutorial | a2087a6 |
| G5.5 — Save / Load | 0a4279a |
| G5.6 — Replay / Timeline | 931b6d8 |
| G5.7 — Balance Pass | 6e740ec |

## Next Official Milestone

G6.1 — Visual Polish

---

**G5 ACCEPTANCE: PASS**

**NEXT OFFICIAL MILESTONE:**
**G6.1 — Visual Polish**
