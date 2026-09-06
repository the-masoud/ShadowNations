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

## Structure

```
src/core/
  model/          pure data types
    gameState.ts
    nation.ts
    region.ts
    regionOwnership.ts
    strategicMap.ts
    turnOrder.ts
    turnResult.ts
    worldState.ts
  simulation/     pure functions
    resolveTurn.ts
```
