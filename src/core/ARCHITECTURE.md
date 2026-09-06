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

## Structure

```
src/core/
  model/          pure data types
    gameState.ts
    nation.ts
    turnOrder.ts
    turnResult.ts
    worldState.ts
  simulation/     pure functions
    resolveTurn.ts
```
