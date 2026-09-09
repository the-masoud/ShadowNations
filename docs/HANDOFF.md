# Shadow Nations — Project Handoff

Updated: 2026-09-09

## 1) What this project is

Browser-first 2D geopolitical / intelligence strategy game built with TypeScript, Vite, Phaser 4 and Vitest. No backend, no React. `docs/ROADMAP.md` is the milestone source of truth.

Architectural rule: simulation in `src/core` stays independent of Phaser/browser/UI. Core must not use Phaser, DOM, `window`, `document`, `Math.random()`, `Date.now()`, `localeCompare()`, `Intl.Collator`, hidden mutable globals, or JSON stringify/parse cloning in production core.

Deterministic ID ordering uses:

```ts
const compareIds = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;
```

## 2) Git / repo state

Repo: `https://github.com/the-masoud/ShadowNations`

Accepted `main` baseline at handoff:

`782ab5bf114d3a308d50baba21e3708133ab3b17`

Subject: `feat: add G5.9 city map identity`

`main` is accepted through G5.9 Checkpoint 6.

A separate WIP branch preserves Checkpoint 7 work; see section 8. Do not call CP7 accepted until the browser interaction is visually verified.
## 3) Roadmap status

Completed and accepted:

- G0 Core Foundation
- G1 Intelligence Core
- G2 Political Strategy
- G3 Strategic AI
- G4 Player Experience
- G5.1 Victory / Defeat
- G5.2 Campaign Setup
- G5.3 Events & Crisis
- G5.4 Tutorial
- G5.5 Save / Load
- G5.6 Replay / Timeline
- G5.7 Balance Pass
- G5.8 historical Campaign Acceptance

Current milestone: **G5.9 — Cities & Capitals**.

Next milestone after G5.9: **G5.10 — Extended Campaign Acceptance**.

Then G6 Release:
G6.1 Visual Polish, G6.2 Audio, G6.3 Performance, G6.4 CI/CD, G6.5 GitHub Pages, G6.6 Releases, G6.7 RC, G6.8 v1.0.0.

Historical `docs/acceptance/G5_ACCEPTANCE.md` is immutable; it is the pre-city-extension acceptance baseline.

## 4) Important accepted commits

- G5.1 `e4f79b0910c363b4ccb36285c1c40e177cafe4b4`
- G5.2 `2840de971f8388707329a9f3f22010247478ed09`
- G5.3 `31f6b63a507888fa305f456db396a10408ad56c1`
- G5.4 `a2087a6559d7aee08ead15a334a11f0b2ab01263`
- G5.5 `0a4279a9f44ae1b05eae54d07731aa680274fa05`
- G5.6 `931b6d86be4a0af0e9f57205c57ccfd6b47abb68`
- G5.7 `6e740ece85306c5948bec3109d174996fa77f434`
- G5.8 `247879691c4eccefa2dd2159bcac395f43487a33`
- Roadmap city extension `cf3edde44ce6b0bcae933fd9b3eb05408b679265`
- G5.9 CP1 city catalog `da036d356e62382e958659ef745392017411c4f3`
- G5.9 CP2 city security/save v2 `3379314d136f4d2aa66c5d72fac4f04b367c38f4`
- G5.9 CP3 normalization `1fc57c0d5ae56c4c93f656bb9385d44747876806`
- G5.9 CP4 city operations core `06475c0fa99ae19de1f9b5f122a0b166ab82cbe6`
- G5.9 CP5 city dossier `fc0bda4a470f285ac090c67fa53cf513938a97a2`
- G5.9 CP6 city map identity `782ab5bf114d3a308d50baba21e3708133ab3b17`

## 5) Frozen G5.9 city design

Hierarchy: `Nation → Region → City → Security / Intelligence / Covert Operations`.

Exactly one canonical City per Region, 18 total. Ownership is never stored on City; current owner is derived `city → region → RegionOwnership → Nation`.

City roles:

- `capital`
- `media-hub`
- `security-hub`

Role → strategic stat:

- capital → stability
- media-hub → publicSupport
- security-hub → internalSecurity

Dynamic City Security is `{ cityId, value }`; initial current security equals static `baseSecurity`.
Canonical cities in Region order:

| Region | City | Role | Base security |
|---|---|---|---:|
| sunreach | Solara | capital | 65 |
| auric-basin | Aurelis | media-hub | 55 |
| helion-coast | Helion | security-hub | 75 |
| ironvale | Dravik | capital | 80 |
| blackridge | Kragen | security-hub | 90 |
| varkesh | Raskov | media-hub | 70 |
| northwatch | Norhaven | capital | 50 |
| frostmere | Eirholm | media-hub | 40 |
| silverplain | Argentis | media-hub | 50 |
| velis | Velyra | capital | 60 |
| meridian | Meridia | media-hub | 65 |
| blueharbor | Cerulea | security-hub | 70 |
| karsk | Kharos | capital | 75 |
| red-steppe | Sirok | security-hub | 85 |
| stonegate | Skarhold | security-hub | 60 |
| arka | Arkalis | capital | 60 |
| duskfall | Vespera | security-hub | 70 |
| eastern-reach | Dawnspire | media-hub | 50 |

City security bands:

- 0–25 `BREACHED`
- 26–50 `COMPROMISED`
- 51–75 `GUARDED`
- 76–100 `HARDENED`
End-of-turn normalization: move current City Security toward base by exactly 10, never crossing base. It occurs in `resolveCampaignTurn` after base `resolveTurn` and before campaign crisis. Event chronology is:

`pending operation events → turn-advanced → city-security-normalized (canonical city order) → campaign crisis`.

Three city operations are accepted core behavior:

- **Infiltrate City** — AP 2; foreign; owned agent; visibility LIMITED+; network FOOTHOLD+; security -25 clamp 0; no national stat damage.
- **Urban Disruption** — AP 2; foreign; owned agent; KNOWN; ESTABLISHED+; city security <= 50; role-linked stat -8; post-success city security = `min(base + 25, 100)`.
- **City Black Operation** — AP 3; foreign; owned agent; KNOWN; DEEP; city security <= 25; role-linked stat -15; post-success city security = `min(base + 40, 100)`.

Black-op display labels:

- capital: `BLACK OP — PALACE CRISIS`
- media-hub: `BLACK OP — INFORMATION BLACKOUT`
- security-hub: `BLACK OP — DIRECTORATE BREACH`

Existing Covert Sabotage remains a separate direct-nation operation.

Save format is v2. `SAVE_GAME_VERSION = 2` while the storage key intentionally remains `shadow-nations.save.v1`. v1 loads migrate deterministically by adding canonical City Security. One save slot only. Replay carries City Security.

## 6) Accepted G5.9 UI behavior through CP6

City Dossier is a moderate overlay over the map, not the old planner. It shows city/role/region/controller/security visibility/network/role-linked stat/target stats/player agents and the three city operations.

Fog rules:

- own city: exact current + exact base + band
- foreign UNKNOWN: security hidden
- foreign LIMITED: qualitative band only
- foreign KNOWN: exact current + exact base + band
Strategic map through CP6:

- 18 City nodes in canonical City order, using existing Region coordinates.
- Map always displays City name + Region code, never full Region name.
- capital = star; media-hub = diamond; security-hub = hexagon.
- node fill = current owner nation color.
- security ring uses 1–4 segments from CURRENT City Security band.
- foreign UNKNOWN shows no active security segments.
- no exact security number is printed on map.

Important terminology: **there is currently no illustrated city artwork / city photograph / skyline asset in the game.** The map has symbolic City nodes and the Dossier is graphical UI with text. Do not describe these as “city images.” Full art/polish belongs naturally to G6.1 unless the user explicitly changes scope.

## 7) Test baseline

Accepted CP6 hard gate:

- `1687 passed / 49 files`
- `npm run build` PASS

Tests stay version-controlled and are pushed with milestone work.

Do not repeatedly rerun the full hard gate. Preferred workflow: one static source audit, then exactly one full `npm test` and one `npm run build`. If the agent already ran the explicit hard gate once, independently inspect source rather than rerunning it unless a later repair truly requires a targeted test.

## 8) Current WIP — G5.9 Checkpoint 7

Goal: fix the live UX defect where clicking a City node did not directly open its Dossier, and the fallback `CITY DOSSIER` button overlapped the Intelligence divider.

WIP implementation changes exactly five code/test paths:

- `src/game/map/cityMapInteraction.ts` (new)
- `src/game/map/renderStrategicMap.ts`
- `src/game/ui/renderNationRegionUi.ts`
- `src/game/scenes/MainScene.ts`
- `tests/game/g59CityInteraction.test.ts` (new, exactly 12 tests)
WIP source audit already confirmed:

- `renderStrategicMap` owns all live City hit zones; `renderNationRegionUi` no longer creates map zones.
- each City uses one 56x56 hit zone.
- pointerdown selects exact City and calls `(cityId, regionId)`.
- `MainScene` callback does both `nationRegionController.selectRegion(regionId)` and `dossier.open(cityId)`.
- fallback `CITY DOSSIER` button is at Y=505; `CONTROLLED REGIONS` at Y=478; Intelligence divider begins at Y=520.
- ReplayScene was not modified; without callbacks it remains read-only.
- Core and old Operation Planner were not modified.

Agent-reported CP7 hard gate already passed once:

- `1699 passed / 50 files`
- build PASS

**CP7 is NOT accepted yet** because browser interaction was not visually verified before handoff. Do not silently mark it complete just because tests pass.

The user also clarified a separate expectation: they asked why no “city image” is visible. Current scope has no city artwork. Keep this distinction explicit.

## 9) Exact next action in the new chat

1. Read this file and `docs/ROADMAP.md` first.
2. Check branch/hash/status before editing.
3. Use the WIP branch created for this handoff (see Git section below).
4. Launch the game and visually verify CP7:
   - click **Dravik** directly → Dossier title must be `CITY DOSSIER — DRAVIK`; right panel must show Ironvale / IRO.
   - close and click **Raskov** directly → Dossier title `CITY DOSSIER — RASKOV`; panel Varkesh / VAR.
   - close and use fallback `CITY DOSSIER` button; it must open the City for the selected Region.
5. If that works, close CP7 with an accepted commit on `main` (or merge/cherry-pick the WIP commit) and verify clean `HEAD == origin/main`.
6. If it fails, repair only the CP7 interaction files; do not redesign core/planner/map layout.

Do not add city artwork merely to prove CP7. Artwork is a separate scope decision.
## 10) After CP7

Finish G5.9 with a focused final audit; do not invent extra systems. Confirm Cities & Capitals work coherently across:

- canonical city catalog and ownership derivation
- dynamic City Security + normalization
- save v2 migration
- three City Operations and event chronology
- Dossier visibility rules and disabled reasons
- map identity/fog/security rings
- direct live City interaction
- replay read-only behavior

Then perform **G5.10 Extended Campaign Acceptance** as browser acceptance for the city-extended campaign. It should exercise campaign setup, operations, turn resolution, city normalization, crises, save/load v2, replay/timeline, victory/defeat compatibility, and no regression to historical G5.8 behavior.

Only after G5.10 move to G6.

## 11) Working protocol for coding agents

The assistant is architect/reviewer; coding agents implement bounded checkpoints.

For each checkpoint:

- freeze baseline branch/hash and allowed paths
- specify exact APIs/contracts/test counts
- forbid reset/restore/clean and next-milestone bleed
- agent does one static review + one hard gate
- agent does not stage/commit/push unless explicitly in closure step
- independently audit source before accepting any agent report
- tests passing alone is never sufficient
- commit only exact expected paths
- push and independently verify clean working tree and `HEAD == origin/main`

Do not use implementation loops or broad autorepair after a hard gate. If a gate fails, report `FIX_REQUIRED`, inspect the exact defect, and make a bounded repair.

Line-ending LF→CRLF warnings on Windows are harmless unless content changes unexpectedly.

## 12) Useful local commands

Repo:

`C:\Users\M.Zeynali\Documents\ShadowNations`

Dev server:

```powershell
npm run dev
```

Usually opens at `http://localhost:5173`.

Full gate when explicitly required:

```powershell
npm test
npm run build
```
