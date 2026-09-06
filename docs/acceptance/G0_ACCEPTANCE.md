# G0 — Core Foundation Acceptance

**Date:** 2026-09-06
**Production commit:** 76997fe
**Repository:** https://github.com/the-masoud/ShadowNations.git

## 1. Baseline Verification

| Check | Result |
|-------|--------|
| `git status` | Clean, `origin/main` synchronized |
| `npm test` | 130 tests PASS (6 files) |
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

Comparator uses deterministic lexicographic ordering:
```ts
const compareIds = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;
```

## 3. Canonical World Counts

| Item | Count | Expected |
|------|-------|----------|
| Nations | 6 | 6 |
| Regions | 18 | 18 |
| Connections | 30 | 30 |
| Ownership entries | 18 | 18 |

**Nations:** solaris, dravos, norvia, veloria, karsen, arkania

**Regions:** sunreach, auric-basin, helion-coast, ironvale, blackridge, varkesh, northwatch, frostmere, silverplain, velis, meridian, blueharbor, karsk, red-steppe, stonegate, arka, duskfall, eastern-reach

## 4. Initial GameState

```ts
{
  turn: 1,
  phase: "planning",
  playerNationId: "solaris",
  world: { nations[6], map{regions[18], connections[30]}, regionOwnership[18] }
}
```

`validateGameState(initialState)` → PASS (no throw)

## 5. Validation & Integrity Boundary

### validateGameState
- Rejects: turn < 1, fractional turn, invalid phase, empty playerNationId, unknown player nation, invalid nation/map/ownership collections
- Passes: canonical initial state, repeated initial states remain deterministic

### validateWorldState
- Checks: unique IDs, unique codes, no empty fields

### validateStrategicMap
- Checks: non-empty, unique region IDs/codes, unique connection codes, no self-connections, no unknown region references, BFS connectivity validation

### validateRegionOwnership
- Checks: no duplicate region entries, no unknown region references, no unknown nation references, every map region has exactly one owner

## 6. setRegionOwner Behavior

- **Immutable:** input GameState and WorldState are never mutated
- **No-op:** same-owner transition returns exact original reference (`toBe`)
- **New references:** changed GameState, WorldState, and ownership array are new objects (`not.toBe`)
- **Preserves:** turn, phase, playerNationId, nations reference, map reference, ownership order
- **Fails closed:** unknown region → `UnknownRegionError`, unknown nation → `UnknownNationError`, invalid input → `GameStateValidationError`
- **Post-condition:** transitioned state passes `validateGameState`

## 7. resolveTurn Behavior

- **Deterministic:** sorted order IDs via lexicographic comparator
- **Fail-closed:** validates input state before processing, rejects non-planning phases, rejects duplicate order IDs
- **Mutates only:** turn incremented, phase stays "planning"
- **Preserves:** world reference (shared by reference), playerNationId
- **No-op:** ownership preserved, world not mutated

## 8. Milestones Accepted

| Milestone | Commit | Evidence |
|-----------|--------|----------|
| G0.1 — Foundation | f98b5d0 | Phaser app, createInitialGameState, src/core purity |
| G0.2 — Deterministic Turn Engine | 87496d0 | resolveTurn, InvalidPhaseError, DuplicateOrderError |
| G0.3 — World Model & Nations | 87496d0 | 6 nations, getNationById, validateWorldState |
| G0.4 — Regions & Strategic Map Graph | 83a2f14 | 18 regions, 30 connections, getRegionById, getNeighborRegionIds, validateStrategicMap |
| G0.5 — Canonical World Map | 83a2f14 | 18 ownership entries, getRegionOwnership, validateRegionOwnership |
| G0.6 — Core State Integrity | 76997fe | validateGameState, setRegionOwner immutable transition |

## 9. Dependency Scan

`package.json` production dependencies: **phaser only**
`src/core` does not import phaser — architecture boundary holds.

## 10. No G1 Systems

No gameplay systems (action points, intelligence, diplomacy, AI) are implemented. Only core foundation exists.

---

**G0 ACCEPTANCE: PASS**

**NEXT OFFICIAL MILESTONE:**
**G1.1 — Action Points & Planning**
