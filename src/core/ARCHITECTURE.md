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

## Intelligence Visibility (G1.2)

- IntelligenceVisibility is `"unknown" | "limited" | "known"`.
- NationIntelligenceVisibility is a (observer, target, visibility) triple.
- 36 entries cover all nation pairs; self-pairs are always `"known"`.
- Missing pair is a data-integrity error.
- Visibility transition is an immutable primitive.

## Intelligence Networks (G1.3)

- IntelligenceNetworkLevel is `"none" | "foothold" | "established" | "deep"`.
- 30 non-self entries; self-pairs are excluded by invariant.
- Network level ordering is strictly forward-only: none → foothold → established → deep.
- getNextIntelligenceNetworkLevel returns same level when already at maximum.
- setIntelligenceNetworkLevel is an immutable transition primitive.

## Intelligence Agents & Assets (G1.4)

- 12 canonical agents, two per nation.
- Each agent has a fixed ownerNationId.
- IntelligenceAssetAccess is `"limited" | "high"`.
- Assets are stored in a flat list; duplicate asset IDs are rejected.
- addIntelligenceAsset is an immutable structural primitive.

## Espionage Operations (G1.5)

- All espionage operations are planning-phase only.
- Self-target espionage is always forbidden.
- All operations require an actor-owned agent.
- AP costs: BUILD_NETWORK=2, GATHER_INTELLIGENCE=1, RECRUIT_ASSET=2.
- Operations fail atomically; no partial state changes on error.
- buildIntelligenceNetwork advances network level by one step.
- gatherIntelligence requires sufficient network level for the desired visibility step.
- recruitIntelligenceAsset requires established or deep network level.
- Operation ordering within a turn is deterministic and idempotent per call.

## Counterintelligence (G1.6)

- Awareness is defender-relative knowledge of foreign presence.
- Levels: unaware / suspected / identified.
- Sweep is deterministic and costs AP even when nothing is discovered.
- DoubleAgentControl is separate from IntelligenceAsset.
- Turning an asset does not change its original owner/target identity.
- False intelligence in G1.6 degrades hostile visibility by one level.
- No fabricated factual reports exist yet.
- Counterintelligence state persists across turns.
- No randomness.

## Event System (G1.7)

- Every gameplay operation returns `OperationResult<E extends GameEvent>`.
- OperationResult contains `{ state: GameState; event: E }`.
- `resolveTurn` emits `TurnAdvancedEvent` in its `TurnResult.events` array.
- TurnResult has `events: readonly GameEvent[]`.
- Events are value objects created at the time of the operation.
- Event `turn` field records the state.turn at the time of operation (not nextTurn).
- `GameEvent` is a discriminated union on the `type` field.
- Operations that fail do not emit events (they throw errors).

## Nation Strategic Stats (G2.1)

- Nation remains immutable identity data.
- NationStrategicStats represents objective mutable national condition.
- Stats are: stability, publicSupport, internalSecurity.
- Values are integer 0..100.
- Stats live in WorldState as `nationStrategicStats`.
- IntelligenceState remains observer-relative knowledge.
- setNationStrategicStat is a low-level structural primitive.
- No automatic drift exists in G2.1.
- Future G2 systems authorize political/stat changes.

## Nation Influence (G2.2)

- Influence is objective directional political leverage.
- Stored in WorldState as `nationInfluence`.
- Values are integer 0..100.
- Self influence does not exist (30 entries for 6 nations).
- A -> B is independent of B -> A (no symmetry enforced).
- Influence does not imply friendship/hostility.
- setNationInfluence is a low-level structural primitive.
- Influence does not automatically change between turns.
- G2.3 will introduce diplomacy separately.
- Later gameplay systems authorize influence changes.

## Structure

```
src/core/
  model/          pure data types
    actionPoints.ts
    counterintelligenceAwareness.ts
    doubleAgent.ts
    gameEvent.ts
    gameState.ts
    intelligenceAgent.ts
    intelligenceAsset.ts
    intelligenceNetwork.ts
    intelligenceState.ts
    intelligenceVisibility.ts
    nation.ts
    nationInfluence.ts
    nationStrategicStats.ts
    operationResult.ts
    region.ts
    regionOwnership.ts
    strategicMap.ts
    turnOrder.ts
    turnResult.ts
    worldState.ts
  simulation/     pure functions
    addDoubleAgentControl.ts
    addIntelligenceAsset.ts
    buildIntelligenceNetwork.ts
    feedFalseIntelligence.ts
    gatherIntelligence.ts
    intelligenceErrors.ts
    recruitIntelligenceAsset.ts
    resetActionPointsForNewTurn.ts
    resolveTurn.ts
    runCounterintelligenceSweep.ts
    setCounterintelligenceAwareness.ts
    setIntelligenceNetworkLevel.ts
    setNationInfluence.ts
    setNationStrategicStat.ts
    setNationVisibility.ts
    setRegionOwner.ts
    spendActionPoints.ts
    turnIntelligenceAsset.ts
    validateGameState.ts
    validateIntelligenceState.ts
    validatePlanningState.ts
```
