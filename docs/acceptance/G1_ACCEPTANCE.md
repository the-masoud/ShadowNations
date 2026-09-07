# G1 — Intelligence Core Acceptance

**Date:** 2026-09-07
**Production commit:** 400de61 (G1.6) + uncommitted G1.7 changes
**Repository:** https://github.com/the-masoud/ShadowNations.git

## 1. Baseline Verification

| Check | Result |
|-------|--------|
| `git status` | Clean, `origin/main` synchronized |
| `npm test` | 375 tests PASS (13 files) |
| `npm run build` | PASS — `dist/index.html`, `dist/assets/index-BMb8c0hC.js` |
| Production code diff | NONE |

## 2. Architecture Boundary

`src/core` contains zero forbidden dependencies:

- Phaser: **PASS** — no imports found
- `Math.random()`: **PASS** — no calls found
- `Date.now()`: **PASS** — no calls found
- `localeCompare()`: **PASS** — no calls found
- `Intl.Collator`: **PASS** — no references found
- `document` / `window`: **PASS** — no references found
- `src/game` / `src/ui` imports: **PASS** — none found

## 3. Canonical World Counts

| Item | Count | Expected |
|------|-------|----------|
| Nations | 6 | 6 |
| Regions | 18 | 18 |
| Connections | 30 | 30 |
| Ownership entries | 18 | 18 |

**Nations:** solaris, dravos, norvia, veloria, karsen, arkania

**Regions:** sunreach, auric-basin, helion-coast, ironvale, blackridge, varkesh, northwatch, frostmere, silverplain, velis, meridian, blueharbor, karsk, red-steppe, stonegate, arka, duskfall, eastern-reach

## 4. Action Points & Planning (G1.1)

- `PlanningState` with per-nation `NationActionPoints` (6 per nation)
- `spendActionPoints` immutable transition, planning-phase only
- `resetActionPointsForNewTurn` replenishes AP to maximum
- `resolveTurn` integrates AP reset into turn advancement
- `getNationActionPoints` lookup with explicit error types

## 5. Intelligence Visibility (G1.2)

- 36 entries covering all nation pairs
- Self-pairs always `"known"`, non-self initially `"unknown"`
- Visibility progression: unknown → limited → known
- `setNationVisibility` immutable primitive

## 6. Intelligence Networks (G1.3)

- 30 non-self entries (self-pairs excluded)
- Network levels: none → foothold → established → deep
- `setIntelligenceNetworkLevel` immutable primitive
- `getNextIntelligenceNetworkLevel` progression helper

## 7. Intelligence Agents & Assets (G1.4)

- 12 canonical agents (2 per nation)
- Each agent has fixed `ownerNationId`
- `IntelligenceAssetAccess`: `"limited" | "high"`
- Assets stored in flat list; duplicate IDs rejected
- `addIntelligenceAsset` immutable structural primitive

## 8. Espionage Operations (G1.5)

| Operation | AP Cost | Prerequisites |
|-----------|---------|---------------|
| `buildIntelligenceNetwork` | 2 | non-self target, owned agent |
| `gatherIntelligence` | 1 | non-self target, owned agent, network level |
| `recruitIntelligenceAsset` | 2 | non-self target, owned agent, established/deep network |

All operations:
- Planning-phase only (throw `InvalidPhaseError` in resolution)
- Fail atomically (no partial state changes)
- Return `OperationResult<SpecificEvent>` (G1.7)

## 9. Counterintelligence (G1.6)

| Operation | AP Cost | Prerequisites |
|-----------|---------|---------------|
| `runCounterintelligenceSweep` | 2 | non-self pair |
| `turnIntelligenceAsset` | 3 | identified awareness, unturned asset |
| `feedFalseIntelligence` | 1 | valid double-agent control, degradable visibility |

Awareness levels: unaware → suspected → identified

- Sweep costs AP even when no foreign presence is found
- Turning an asset does not change its original `ownerNationId` or `targetNationId`
- False intelligence degrades visibility: known→limited, limited→unknown

## 10. Turn Event System (G1.7)

Every gameplay operation returns `OperationResult<E>`:
```ts
interface OperationResult<E extends GameEvent> {
  readonly state: GameState;
  readonly event: E;
}
```

Event types emitted:
- `intelligence-network-built`
- `intelligence-gathered`
- `intelligence-asset-recruited`
- `counterintelligence-sweep`
- `intelligence-asset-turned`
- `false-intelligence-fed`
- `turn-advanced` (emitted by `resolveTurn`)

`TurnResult` has `events: readonly GameEvent[]`.

## 11. Test Coverage

| File | Tests | Milestone |
|------|-------|-----------|
| g06.test.ts | 37 | G0.6 — Core State Integrity |
| g11.test.ts | 57 | G1.1 — Action Points & Planning |
| g12.test.ts | 28 | G1.2 — Intelligence Visibility |
| g13.test.ts | 21 | G1.3 — Intelligence Networks |
| g14.test.ts | 14 | G1.4 — Agents & Assets |
| g15.test.ts | 36 | G1.5 — Espionage Operations |
| g16.test.ts | 53 | G1.6 — Counterintelligence |
| g17.test.ts | 36 | G1.7 — Turn Event System |
| gameState.test.ts | 4 | G0.1 — Foundation |
| worldState.test.ts | 19 | G0.3 — World Model |
| regionOwnership.test.ts | 30 | G0.5 — Canonical World Map |
| strategicMap.test.ts | 29 | G0.4 — Strategic Map |
| resolveTurn.test.ts | 11 | G0.2 — Turn Engine |
| **Total** | **375** | |

## 12. Milestones Accepted

| Milestone | Commit | Evidence |
|-----------|--------|----------|
| G0.1 — Foundation | f98b5d0 | Phaser app, createInitialGameState, src/core purity |
| G0.2 — Deterministic Turn Engine | 87496d0 | resolveTurn, InvalidPhaseError, DuplicateOrderError |
| G0.3 — World Model & Nations | 87496d0 | 6 nations, getNationById, validateWorldState |
| G0.4 — Regions & Strategic Map Graph | 83a2f14 | 18 regions, 30 connections, getRegionById, getNeighborRegionIds, validateStrategicMap |
| G0.5 — Canonical World Map | 83a2f14 | 18 ownership entries, getRegionOwnership, validateRegionOwnership |
| G0.6 — Core State Integrity | 76997fe | validateGameState, setRegionOwner immutable transition |
| G1.1 — Action Points & Planning | c95e68c | PlanningState, spendActionPoints, AP reset in resolveTurn |
| G1.2-G1.5 — Intelligence Core | 5ac97f8 | visibility, networks, agents, assets, 3 espionage operations |
| G1.6 — Counterintelligence | 400de61 | awareness, double agents, 3 counterintelligence operations |
| G1.7 — Turn Event System | uncommitted | GameEvent union, OperationResult, TurnAdvancedEvent |

## 13. Dependency Scan

`package.json` production dependencies: **phaser only**
`src/core` does not import phaser — architecture boundary holds.

## 14. No G2+ Systems

No political strategy, AI, UI, or campaign systems exist. Only G0 foundation and G1 intelligence core are implemented.

---

**G1 ACCEPTANCE: PASS**

**NEXT OFFICIAL MILESTONE:**
**G2.1 — Nation Strategic Stats**
