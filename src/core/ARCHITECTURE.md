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

## Diplomacy (G2.3)

- Diplomacy is an objective bilateral WorldState relationship.
- Statuses are: friendly, neutral, hostile.
- Self relationships do not exist.
- Exactly one stored relationship exists per unordered nation pair.
- Pair storage uses canonical world nation order (nationA precedes nationB).
- Diplomacy is separate from directional influence.
- Diplomacy does not automatically change influence or strategic stats.
- setDiplomaticStatus is a low-level structural primitive.
- Diplomacy does not automatically drift across turns.
- Later political systems authorize diplomatic changes.

## Political Operations (G2.4)

- G2.4 contains three gameplay operations.
- Political operations occur immediately in planning phase.
- Operations consume actor AP.
- Structural primitives remain authorization-free.
- Cultivate influence increases directional NationInfluence.
- Diplomatic outreach improves bilateral diplomacy one level.
- Stabilization increases target stability.
- Operations return deterministic domain events.
- No hidden coupling exists.

## Covert Sabotage (G2.5)

- Covert sabotage is one gameplay operation.
- Exactly two objectives: `"internal-security"` and `"public-support"`.
- Owned intelligence agent required.
- Established or deep target network required.
- AP cost: 2.
- Selected stat damage: 10 (floored at 0).
- Stability is NOT affected.
- No random detection.
- No automatic counterintelligence awareness change.
- No influence/diplomacy coupling.
- No proxy conflict/regime pressure behavior.

## Proxy Conflicts (G2.6)

- `proxyConflicts` lives in WorldState.
- Initial collection is empty.
- Conflict has host plus two external sponsors.
- Sponsors stored in canonical `world.nations` order.
- Intensity levels: `low`, `medium`, `high`.
- `startProxyConflict`: creates a new proxy conflict in a host nation.
- `escalateProxyConflict`: increases intensity by one step.
- Start eligibility: influence >= 40, hostile diplomacy, host stability <= 70.
- Escalation does NOT re-check start eligibility.
- Deterministic host stability impact: 5 per operation (floored at 0).
- No combat simulation, no winner model, no automatic resolution.
- Persistence across turns.

## Regime Pressure (G2.7)

- `NationRegimePressure` is directional objective WorldState data.
- 30 non-self directional entries (6×5), initial value 0.
- Integer range 0..100, independent per direction.
- `setNationRegimePressure` is a low-level structural primitive.
- `applyRegimePressure` costs 3 AP, requires influence >= 40.
- Friendly diplomacy blocks regime pressure.
- Pressure increases by 20, capped at 100.
- Target stability decreases by 5, floored at 0.
- Pressure persists across turns with no automatic decay.
- Pressure 100 causes no automatic coup/regime change.
- No automatic proxy escalation or sabotage triggered by pressure.

## AI Perception (G3.1)

- G3 begins with derived observer-specific perception.
- Perception is not persistent GameState.
- Self strategic stats are exact.
- Observer AP is exact.
- Foreign strategic stats are visibility-gated: unknown exposes nothing, limited exposes low/medium/high bands, known exposes exact values.
- Political data is observer-centric (O->T influence, O->T regime pressure, bilateral diplomacy).
- Network data is observer -> target.
- Defensive awareness uses observer as defender.
- Only observer-involved proxy conflicts are exposed.
- Deterministic and read-only.
- No personality, planning, or actions in G3.1.

## AI Personalities (G3.2)

- G3.2 defines static personality configuration.
- Every canonical nation has one fixed profile.
- Four traits: assertiveness, caution, diplomacyAffinity, intelligenceAffinity.
- Trait range is integer 0..100.
- Personality is not GameState.
- Personality is separate from AiPerception.
- Lookup is deterministic.
- No planning, scoring, or action selection exists in G3.2.
- G3.3 is the next planning milestone.

## AI Planning (G3.3)

- G3.3 combines AiPerception + AiPersonality.
- Planning is derived and non-persistent.
- Plan contains observer, turn, domain, target.
- Domains are exactly diplomacy/intelligence.
- Personality chooses domain deterministically.
- Perception chooses target deterministically.
- Diplomacy scoring uses status + observer influence.
- Intelligence scoring uses visibility + network + defensive awareness.
- Canonical order breaks target ties.
- No gameplay operation is selected.
- No AP is spent.
- G3.4 and G3.5 select concrete diplomacy/espionage behavior later.

## AI Diplomacy (G3.4)

- G3.4 consumes AiPerception + diplomacy AiPlan.
- Plan target is authoritative; G3.4 does not rescore or reselect targets.
- Approved actions: cultivate political influence, diplomatic outreach, stabilize government, pass.
- Action selection respects perception boundaries: diplomaticStatus, observerInfluence, strategicStats, remaining AP.
- Stabilization requires perceived evidence that stability is below 100.
- Unknown and limited-high stability do not permit stabilization.
- Accepted G2.4 AP costs are respected; no AP is spent.
- No gameplay operation is executed.
- Decisions are deterministic and non-persistent.
- Regime pressure, proxy conflict behavior, and espionage are outside G3.4.
- G3.5 AI Espionage is the next milestone.

## AI Espionage (G3.5)

- G3.5 consumes AiPerception + intelligence AiPlan.
- Plan target is authoritative; G3.5 does not rescore or reselect targets.
- Decision-only; no gameplay operation is executed and no AP is spent.
- Five approved actions: build-intelligence-network, gather-intelligence, counterintelligence-sweep, conduct-covert-sabotage, pass.
- Policy precedence: suspected defensive awareness → sweep; weak network (none/foothold) → build; insufficient visibility (unknown/limited) with established/deep → gather; known + established → build; known + deep + exact → sabotage evaluation; else → pass.
- AP affordability is checked against accepted operation costs: BUILD_NETWORK=2, GATHER_INTELLIGENCE=1, COUNTERINTELLIGENCE_SWEEP=2, COVERT_SABOTAGE=2.
- No cheaper fallback: unaffordable preferred action returns pass without falling through to another action.
- Action selection insulates only: visibility, strategicStats, intelligenceNetworkLevel, defensiveAwareness, remaining AP.
- Sabotage objective precedence: internalSecurity > 0 wins before publicSupport > 0; stability never affects objective.
- No agent/asset/double-agent selection; no recruitAsset, turnAsset, or feedFalseIntelligence actions.
- Deterministic and non-persistent; no GameState or IntelligenceState mutation.
- G3.6 Simulation Harness is the next milestone.

## Structure

```
src/core/
  ai/             derived AI perception, personalities, planning, diplomacy, and espionage
    aiPerception.ts
    aiPersonality.ts
    aiPlanning.ts
    aiDiplomacy.ts
    aiEspionage.ts
  model/          pure data types
    actionPoints.ts
    counterintelligenceAwareness.ts
    covertSabotage.ts
    diplomaticRelationship.ts
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
    nationRegimePressure.ts
    nationStrategicStats.ts
    operationResult.ts
    proxyConflict.ts
    region.ts
    regionOwnership.ts
    strategicMap.ts
    turnOrder.ts
    turnResult.ts
    worldState.ts
  simulation/     pure functions
    addDoubleAgentControl.ts
    addIntelligenceAsset.ts
    addProxyConflict.ts
    applyRegimePressure.ts
    buildIntelligenceNetwork.ts
    conductCovertSabotage.ts
    conductDiplomaticOutreach.ts
    covertSabotageErrors.ts
    cultivatePoliticalInfluence.ts
    escalateProxyConflict.ts
    feedFalseIntelligence.ts
    gatherIntelligence.ts
    intelligenceErrors.ts
    politicalOperationErrors.ts
    proxyConflictErrors.ts
    recruitIntelligenceAsset.ts
    regimePressureErrors.ts
    resetActionPointsForNewTurn.ts
    resolveTurn.ts
    runCounterintelligenceSweep.ts
    setCounterintelligenceAwareness.ts
    setDiplomaticStatus.ts
    setIntelligenceNetworkLevel.ts
    setNationInfluence.ts
    setNationRegimePressure.ts
    setNationStrategicStat.ts
    setNationVisibility.ts
    setProxyConflictIntensity.ts
    setRegionOwner.ts
    spendActionPoints.ts
    stabilizeGovernment.ts
    startProxyConflict.ts
    turnIntelligenceAsset.ts
    validateGameState.ts
    validateIntelligenceState.ts
    validatePlanningState.ts
    validateProxyConflicts.ts
  tests/core/
    g34.test.ts
    g35.test.ts
```
