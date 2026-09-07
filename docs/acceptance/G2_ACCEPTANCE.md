# Shadow Nations — G2 Acceptance

## Verdict

G2 ACCEPTANCE: PASS

## G2.1 — Nation Strategic Stats

- `NationStrategicStats` contains exactly `stability`, `publicSupport`, `internalSecurity`.
- Integer 0..100.
- Canonical initial values verified: solaris(72,68,66), dravos(78,55,82), norvia(58,74,52), veloria(70,69,60), karsen(64,57,76), arkania(61,62,58).
- `setNationStrategicStat` is low-level structural primitive; same-value no-op accepted.
- No automatic turn drift.
- Values persist across `resolveTurn`.

## G2.2 — Influence

- `NationInfluence` is directional; entry contains `influencerNationId`, `targetNationId`, `value`.
- Integer 0..100, no self entries, exactly 30 directional entries.
- A→B independent from B→A.
- Canonical initial values unchanged.
- `setNationInfluence` is structural; no automatic drift.

## G2.3 — Diplomacy

- `DiplomaticStatus` is exactly `"friendly"`, `"neutral"`, `"hostile"`.
- Bilateral, exactly 15 relationships, one per unordered pair.
- Canonical storage uses `world.nations` order; no locale/alphabetic sorting.
- Lookup bilaterally; independent from influence; no automatic drift.

## G2.4 — Political Operations

Three accepted operations verified:

| Operation | AP | Requirement | Effect |
|---|---|---|---|
| `cultivatePoliticalInfluence` | 2 | none | influence +10, cap 100 |
| `conductDiplomaticOutreach` | 2 | influence ≥ 30 | hostile→neutral→friendly; friendly blocks |
| `stabilizeGovernment` | 2 | influence ≥ 40, not hostile | stability +5, cap 100 |

- Planning-phase execution.
- OperationResult events.
- Atomic failure; no hidden cross-system effects.

## G2.5 — Covert Sabotage

- Model: `CovertSabotageObjective = "internal-security" | "public-support"`.
- AP cost 2, stat damage 10.
- Requires owned agent, established/deep network.
- Selected stat decreases exactly 10, floors at 0.
- Stability, influence, diplomacy, awareness, network, agents/assets all unchanged.
- Objective runtime validation before `validateGameState(state)`.
- Deterministic event; atomic failure; persistence across `resolveTurn`.

## G2.6 — Proxy Conflicts

- `ProxyConflict`: id, hostNationId, nationAId, nationBId, intensity.
- Intensity: `"low" | "medium" | "high"`.
- `WorldState.proxyConflicts` exists; initial collection empty; distinct per world.
- All participants distinct; sponsors in canonical `world.nations` order.
- Structural primitives `addProxyConflict`, `setProxyConflictIntensity` spend no AP.
- Start (AP=3): influence ≥ 40, hostile diplomacy, host stability ≤ 70, intensity=low, host stability -5.
- Escalation (AP=2): low→medium→high; does NOT re-check original eligibility.
- No combat, no winner, no territory transfer, no automatic resolution.
- Deterministic events; atomic failure; persistence across `resolveTurn`.

## G2.7 — Regime Pressure

- `NationRegimePressure`: sourceNationId, targetNationId, value (integer 0..100).
- Directional, no self entries, exactly 30 entries, all initial values 0.
- Canonical source/target ordering.
- Structural primitive `setNationRegimePressure`: no AP, same-value GameState reference no-op.
- `applyRegimePressure` (AP=3): influence ≥ 40, neutral/hostile succeeds, friendly blocks, pressure +20 (cap 100), stability -5 (floor 0), pressure 100 blocks.
- No influence change, no diplomacy change, no proxy-conflict change, no publicSupport/internalSecurity change, no intelligence change.
- Pressure 100 causes no coup, no regime collapse, no government replacement.
- Deterministic event; atomic failure; persistence across `resolveTurn`.

## Cross-System Vertical Slice

Verified deterministic scenario in `tests/core/g2VerticalSlice.test.ts`:

- G2.4: `cultivatePoliticalInfluence` Solaris→Norvia: 42→52, AP 6→4.
- G2.5: `conductCovertSabotage` Dravos internalSecurity: 82→72, AP 4→2.
- `resolveTurn`: AP resets to 6.
- G2.6: `startProxyConflict` Norvia stability 58→53, AP 6→3; `escalateProxyConflict` low→medium, Norvia 53→48, AP 3→1.
- `resolveTurn`: AP resets to 6.
- G2.7: `applyRegimePressure` Solaris→Karsen: 0→20, Karsen stability 64→59, AP 6→3.
- All effects persist; no hidden coupling; `validateGameState` succeeds.

## Regression

- All G0 tests pass (37 tests).
- All G1 tests pass (248 tests across g11-g17).
- World model, canonical nations, regions, strategic map, ownership, GameState validation, pass-only TurnOrder, AP system, visibility, intelligence networks, agents, assets, espionage operations, counterintelligence awareness, double agents, Turn Event System, resolveTurn all intact.

## Determinism and Core Purity

- 940 tests PASS.
- Build PASS (tsc + vite build).
- Runtime core purity scan: **0** forbidden runtime matches (phaser, Math.random, Date.now, localeCompare, Intl.Collator, document, window).
- No `src/game` or `src/ui` imports in `src/core`.
- No nondeterministic IDs or timestamps in events.

## Scope Audit

- No G3 functionality introduced (no AI perception, AI personalities, AI planning, AI diplomacy, AI espionage, simulation harness).
- No premature military combat, units, battle system, casualties, conflict winner, territory conquest, economy, trade, government types, automatic coup, campaign victory, save/load, replay persistence, backend, or multiplayer.
- Minimal Phaser bootstrap in `src/game` is allowed and unchanged.

## WorldState Final Audit

WorldState contains exactly 8 accepted layers:

1. `nations`
2. `map`
3. `regionOwnership`
4. `nationStrategicStats`
5. `nationInfluence`
6. `diplomaticRelationships`
7. `proxyConflicts`
8. `nationRegimePressure`

No speculative G3 fields present.

## GameEvent Final Audit

- Expected variant count: **14**
- Actual variant count: **14**
- All 14 verified present in `gameEvent.ts` union.
- No accepted variant renamed or removed.
- No additional variant introduced.
- Events contain no timestamp, no generated random ID, no nondeterministic value.

## OperationResult / resolveTurn Audit

- All G2 gameplay operations return `OperationResult<E>` with `{ readonly state: GameState; readonly event: E }`.
- No persistent event history in GameState.
- `resolveTurn` returns `{ state: GameState; result: TurnResult }`.
- `resolveTurn` does NOT return `{ state, events }`.

## Turn Engine Audit

- `TurnOrder` is pass-only: `kind: "pass"`.
- No G2 operation becomes a `TurnOrder`.
- Deterministic resolution; turn increment accepted; AP resets normally.
- `TurnAdvancedEvent` emitted as accepted.
- Strategic state persists unless explicitly changed by gameplay.
- No automatic political/sabotage/proxy/regime simulation.

## Error Contract Audit

Representative error precedence verified:

- **G2.4**: Target-specific lookup failures (UnknownNation, SelfTarget) precede validateGameState; domain failures (InsufficientInfluence, MaximumRelationship, HostileRelationship, MaximumStability) precede AP spending.
- **G2.5**: Objective runtime validation precedes validateGameState; network check after validateGameState; stat floor check precedes AP spending.
- **G2.6**: Participant/distinctness/ID validation precedes lookup; influence/diplomacy/stability checks after validateGameState but before AP spending.
- **G2.7**: Lookup errors (Unknown, Self, Missing) precede validateGameState; domain errors (InsufficientInfluence, FriendlyDiplomacy, MaximumPressure) precede AP spending.
- All dedicated errors remain distinct; no generic catch-all failures replace them.

## Next Official Milestone

G3.1 — AI Perception
