# Core Architecture

## Simulation Determinism Invariant

```
same GameState + same logical orders
= same next GameState + same TurnResult
```

No wall-clock time, random source, Phaser state, or browser state
may influence `src/core` simulation.

## Rules

- `src/core` must never import Phaser, DOM, or browser APIs.
- No `Date.now()`, `Math.random()`, or hidden global state.
- All mutations produce new objects; inputs are never mutated.
- Ordering is deterministic and locale-independent.

## Nation & World

- Nation identity is canonical deterministic domain data.
- Nation metadata (id, name, code) is distinct from future mutable gameplay state.
- World creation cannot depend on runtime environment or randomness.

## Regions & Strategic Map

- Region is immutable canonical geographic identity.
- StrategicMap defines static strategic adjacency.
- Connections represent strategic adjacency only.
- Physical coordinates/polygons are presentation concerns and are not part of G0.4.
- Core graph creation and traversal are environment-independent.

## Region Ownership

- RegionOwnership is mutable-in-concept political game state.
- Ownership is deliberately separate from Region and StrategicMap.
- Initial ownership is canonical campaign setup.
- Generic ownership validation requires exactly one owner per region.
- Future territorial transfer must replace state rather than mutate canonical map data.

## State Integrity Boundary

- GameState must satisfy explicit structural validation.
- Canonical Nation and StrategicMap data are static identity/geography.
- RegionOwnership is mutable-in-concept game state.
- State transitions return replacement state rather than mutate input.
- setRegionOwner is a low-level structural primitive, not a gameplay rule.
- Static world references are preserved when safe.
- No-op transitions are referentially stable.
- Future gameplay systems must authorize actions before using structural transitions.

## Action Points & Planning

- AP is per nation and per planning turn.
- Canonical initial budget is 6 AP per nation.
- 6 is initial configuration, not a structural invariant.
- PlanningState is separate from WorldState.
- AP spending is immutable and planning-phase only.
- spendActionPoints is a structural primitive, not gameplay authorization.
- resolveTurn replenishes remaining AP to maximum for the next turn.
- Future operations will define their AP cost and authorization separately.

## Structure

```
src/core/
  model/          pure data types
    actionPoints.ts
    gameState.ts
    nation.ts
    region.ts
    regionOwnership.ts
    strategicMap.ts
    turnOrder.ts
    turnResult.ts
    worldState.ts
  simulation/     pure functions
    resetActionPointsForNewTurn.ts
    resolveTurn.ts
    setRegionOwner.ts
    spendActionPoints.ts
    validateGameState.ts
    validatePlanningState.ts
```
