# Coop Galactic War Change Explanations

This document captures how rough-but-working Galactic War coop was introduced, how Galactic War's generated in-memory files work, and how reconnect was later fixed.

The intent is to preserve the reasoning behind these changes so future contributors and LLMs can follow the same patterns instead of rediscovering them from scratch.

## Scope

- Original coop-enabling commit chain:
  - `b12ebaf` `Added code to make any galactic war game broadcast a server beacon.`
  - `c6abda3` `GW Lobby now waits for the co op player to join before proceeding.`
  - `6bc1378` `CO-op player is now assigned a human slot with shared control with the host.`
  - `9040d43` `Co-op player can now join game and issue actions`
  - `0ce8884` `Co-op player can now build structures.`
- Reconnect fix commits:
  - `c55f52b` `Co-op player no longer crashes on reconnect.`
  - `49a653b` `Removed GW related reconnect logging.`
- Co-op build and action UI fixes:
  - `acd428d` `Several fixes for Co-op player unit UI.`
  - `e48d3ec` `Removed logging related to build/action UI bugfixes.`
- GW lobby discovery visibility fixes:
  - `bd7227b` `gw lobby beacon now shows up on LAN more consistently.`
  - `8e3b814` `gw lobby is now visible in the server browser`
- Fixing an issue with unmounting memory files in the GW lobby:
  - `9f594ae` `Fixed a race condition that could appear causing a crash on some PCs but not others.`
- Fixing client mod-related crashes:
  - `cf85a22` `Fixed reconnect unmounting potentially essential client mods.`
- Galactic War galaxy map co-op mode and synchronization:
  - `7874487` `Added WIP galactic war campaign multiplayer netcode.`
  - `654d94a` `Fixed an issue where coop player has a UI crash if they have no pre existing GW save.`
  - `3e276f8` `Fixed a bug where tech cards acquired were not immediately visible for Co-op player.`
  - `fde5b17` `Fixed an issue where Co-op player's GW Map view would not update to show system ownership.`
  - `359550e` `Fixed 2 issues, one with reconnect and one with co-op player's system view.`
  - `60438a2` `Fixed the co-op player's copy of the GW save being corrupted.`
  - `cf423b0` `Fixed compatibility with GW affecting mods like GWO.`

## High-Level Summary

Galactic War coop works by adapting a single-player Galactic War battle into a temporary multiplayer-compatible flow.

The implementation does four main things:

1. Advertises the normally hidden Galactic War battle lobby in the regular multiplayer server browser.
2. Holds the GW lobby open until a second client has joined and mounted the same generated GW file set.
3. Maps both connected clients into the same human army before entering landing and playing states.
4. Patches the in-game UI so the second client can operate against Galactic War's tagged unit specs such as `.player` and `.ai`.

The reconnect fix later adds a fifth thing:

5. Reconstructs the reconnecting client's Galactic War in-memory file system before allowing it to enter `live_game` again.

## Original Single-Player Galactic War File Model

The most important fact about Galactic War is that it does not run on the stock file set alone. It generates a virtual file tree at runtime.

Those generated files include paths like:

- `/pa/units/unit_list.json.player`
- `/pa/units/unit_list.json.ai`
- `/pa/units/.../*.json.player`
- `/pa/units/.../*.json.ai`
- `/pa/ai/unit_maps/ai_unit_map.json.player`
- `/pa/ai/unit_maps/ai_unit_map.json.ai`

These files are mounted with `api.file.mountMemoryFiles` on the client and `file.mountMemoryFiles` on the server. They never need to exist on disk.

### Where the files are generated

The generator lives in [ui/main/game/galactic_war/shared/gw_specs.js](ui/main/game/galactic_war/shared/gw_specs.js).

Important functions:

- `genUnitSpecs(units, tag)`:
  - Loads each root unit spec.
  - Recursively follows references like `base_spec`, tool specs, ammo, replacement units, factory initial build specs, death weapons, and spawn-on-death references.
  - Rewrites those references so they point at the tagged namespace.
  - Emits a full tagged spec tree and a matching tagged `unit_list.json`.
- `genAIUnitMap(unitMap, tag)`:
  - Rewrites every referenced `spec_id` in the AI unit map to the tagged namespace.
- `modSpecs(specs, mods, specTag)`:
  - Applies Galactic War card modifications after generation.
  - Supports operations such as `multiply`, `add`, `replace`, `merge`, `push`, `clone`, `tag`, `pull`, and `eval`.

### Where generation is orchestrated

The orchestrator is [ui/main/game/galactic_war/gw_play/gw_referee.js](ui/main/game/galactic_war/gw_play/gw_referee.js).

`generateGameFiles` does the following:

1. Unmounts old memory files first.
2. Loads the base unit list and base AI unit maps from the shipped game content.
3. Generates a complete `.ai` namespace from the base unit list.
4. Generates a `.player` namespace only from the player's GW inventory unlocks.
5. Applies GW inventory mods to the `.player` spec set.
6. Produces tagged AI unit maps for both `.player` and `.ai`.
7. Merges everything into `self.files()`.

### Where the inventory comes from

Galactic War cards and campaign state rebuild the player's effective inventory in:

- [ui/main/game/galactic_war/shared/js/gw_inventory.js](ui/main/game/galactic_war/shared/js/gw_inventory.js)
- [ui/main/game/galactic_war/shared/js/gw_game.js](ui/main/game/galactic_war/shared/js/gw_game.js)

The inventory contains:

- `units`: unlocked player units
- `mods`: spec mutations granted by cards
- `minions`: allied helper commanders and their settings
- `tags`: commander, faction, player color, and other campaign metadata

That inventory is why Galactic War needs generated files at all. Each battle can have a different unit universe.

### How single-player GW launches a battle

The fight path is in [ui/main/game/galactic_war/gw_play/gw_play.js](ui/main/game/galactic_war/gw_play/gw_play.js).

When the player starts a fight:

1. `GWReferee.hire(game)` generates the files and battle config.
2. `referee.mountFiles()` mounts the generated file tree locally.
3. `referee.tagGame()` calls `api.game.setUnitSpecTag('.player')`.
4. The generated battle config is stored in `gw_battle_config`.
5. The UI then transitions to `connect_to_game` and starts the server.

The `gw_battle_config` observable is backed by the knockout `memory` extender in [ui/main/shared/js/ko_utility.js](ui/main/shared/js/ko_utility.js). That makes it scene-persistent client memory, not a server-owned authoritative data store.

### How the generated files affect the battle config

The referee-generated config includes:

- `files`: the full generated in-memory file map
- `armies`: GW battle armies with `spec_tag` values of `.player` or `.ai`
- `player.commander`: explicitly rewritten to a `.player` spec
- AI commanders: explicitly rewritten to `.player` or `.ai` tagged specs based on alliance

That config is what the GW lobby eventually sends to the server.

### Why an untagged unit list is still synthesized

In [ui/main/game/galactic_war/gw_play/gw_referee.js](ui/main/game/galactic_war/gw_play/gw_referee.js), `mountFiles` also creates an untagged `/pa/units/unit_list.json` as the superset of the `.player` and `.ai` unit lists.

That is a compatibility shim for UI systems that still assume an untagged master unit list exists.

## Original Coop Implementation

## Commit `b12ebaf`

This commit made Galactic War visible and joinable from the normal multiplayer browser.

Server-side changes in [server-script/states/gw_lobby.js](server-script/states/gw_lobby.js):

- Added beacon generation so the GW lobby appears in the multiplayer server browser.
- Set `server.maxClients` to `2` for the GW lobby.
- Stopped rejecting a second client from joining the GW lobby.
- Updated the beacon continuously as clients connected or the control state changed.

Client-side changes in [ui/main/game/galactic_war/gw_lobby/gw_lobby.js](ui/main/game/galactic_war/gw_lobby/gw_lobby.js):

- Made the GW lobby UI accept either the broadcast-style control payload or the per-client control payload form.

Effect in practice:

- The hidden single-player GW battle lobby became discoverable in the server browser.
- A second player could now connect to the GW lobby instead of being hard-rejected.
- The GW lobby was still functionally single-player after that point, but the join window existed.

## Commit `c6abda3`

This commit stopped the host from immediately launching the battle before the second player joined.

Changes in [server-script/states/gw_lobby.js](server-script/states/gw_lobby.js):

- Replaced the old `creatorReady -> starting=true` behavior with `tryStart()`.
- `tryStart()` requires:
  - creator ready
  - system ready
  - sim ready
  - at least two connected clients

Effect in practice:

- The GW lobby stopped auto-starting as soon as the host was ready.
- The lobby now behaved like a waiting room for coop.

## Commit `6bc1378`

This commit made the second player part of the human side instead of just a passive observer.

Changes in [server-script/states/gw_lobby.js](server-script/states/gw_lobby.js):

- Rewrote `startGame()`.
- Collected all human-controllable slots from non-AI armies.
- Added extra human slots if not enough existed for all connected clients.
- Assigned connected clients into those human slots.
- Built the `players` table with one cloned GW player config per connected client.

Effect in practice:

- Both clients were inserted into the same human army with shared control.
- So Coop worked by shared control of a single GW side, not by creating two separate campaign factions.

## Commit `9040d43`

This commit solved the next major problem: the joining client needed the host's generated Galactic War files.

Server-side changes in [server-script/states/gw_lobby.js](server-script/states/gw_lobby.js):

- Added `clientConfigReady` tracking.
- Added `sendGWConfigToClient()`.
- Added `request_gw_config` and `gw_config_ready` messages.
- Extended `tryStart()` so the game would not start until every connected client had mounted the GW config.

Client-side changes in [ui/main/game/galactic_war/gw_lobby/gw_lobby.js](ui/main/game/galactic_war/gw_lobby/gw_lobby.js):

- Added a `gw_config` handler that mounts `payload.files` using `api.file.mountMemoryFiles`.
- Added a polling request loop so browser-join clients could request GW config if they missed the original broadcast.
- Sent `gw_config_ready` back to the server after mounting succeeded.

Live game changes:

- Fixed army-id checks that treated army `0` as “no army”.
- Added tagged/untagged spec-resolution fallbacks so action parsing and control worked on the coop client.

Effect in practice:

- The second client now joined with the same generated GW file tree as the host.
- The second client could issue actions once in the live match.
- Building still remained broken due to further spec-tag/UI issues.

## Commit `0ce8884`

This commit fixed structure building and solidified the `.player` tag behavior.

Changes:

- Forced `api.game.setUnitSpecTag('.player')` in the GW lobby and again in live_game.
- Added tagged/untagged build-spec resolution logic to the build bar.
- Added more tagged/untagged resolution logic to action and selection paths.

Files involved:

- [ui/main/game/galactic_war/gw_lobby/gw_lobby.js](ui/main/game/galactic_war/gw_lobby/gw_lobby.js)
- [ui/main/game/live_game/live_game.js](ui/main/game/live_game/live_game.js)
- [ui/main/game/live_game/live_game_build_bar.js](ui/main/game/live_game/live_game_build_bar.js)
- [ui/main/game/live_game/live_game_action_bar.js](ui/main/game/live_game/live_game_action_bar.js)

Effect in practice:

- The coop client could now build structures.
- Tooltips and other unit-info paths still remained fragile because many stock UI paths still assumed an untagged canonical spec namespace.

## Why the Original Reconnect Theory Pointed at Missing Memory Files

Before reconnect was fixed, the most likely failure mode was:

1. A running GW coop match already referenced `.player` and `.ai` specs.
2. A reconnecting client re-entered the match without re-mounting the generated GW file tree.
3. The client then tried to resolve `.player` or `.ai` files that did not exist locally.
4. The client crashed or failed as soon as those tagged unit specs were touched.

That theory was based on two facts:

- save/load and replay restore already had an explicit `memory_files` handshake in [server-script/states/load_save.js](server-script/states/load_save.js) and [ui/main/game/replay_loading/replay_loading.js](ui/main/game/replay_loading/replay_loading.js)
- normal in-progress reconnect in `playing.js` had no equivalent GW-specific memory-file restore mechanism

That theory turned out to be directionally correct, but the final implementation made a few practical choices that are important to preserve.

## Reconnect Fix Implementation

## Commit `c55f52b`

This commit fixed reconnect by adding a dedicated reconnect staging path and an explicit client-requested memory-file restore protocol for live Galactic War matches.

The logging added in this commit was removed one commit later, but the actual behavior remained.

### Server-side: expose a live-match memory-file resend API

Changes in [server-script/states/playing.js](ui/main/game/live_game/live_game.js):

The real server-side behavior added was:

- `getReconnectReplayFiles()`:
  - Reads `server.getFullReplayConfig()`.
  - Returns `fullReplayConfig.files` if present.
- `sendReconnectMemoryFilesToClient(client, reason)`:
  - Sends a `memory_files` message to a specific client.
- New transient message handlers in `exports.enter`:
  - `request_memory_files`
  - `memory_files_received`

Important practical detail:

- The reconnect payload is sourced from `server.getFullReplayConfig().files`, not from `gw_battle_config`, not from a fresh client-side regeneration, and not from the running lobby state.

That means the live match is relying on the full replay config as its authoritative copy of the generated GW file tree.

### Server-side: reconnect does not proactively resend on `onConnect`

This is the biggest practical difference from a naive replay-loading-style model.

The reconnect fix does **not** immediately push GW files during the `server.onConnect` reconnect hook.

Instead, the reconnect hook still mainly does connection accounting and timeout cleanup. The real GW resend happens only when the client explicitly sends `request_memory_files`.

That means the server-side design is:

- keep reconnect cheap and non-blocking at the transport level
- let the client decide when it is in the right scene to restore GW files
- answer that request only for GW matches

### Client-side: intercept the normal live_game redirect

Changes in [ui/main/game/connect_to_game/connect_to_game.js](ui/main/game/connect_to_game/connect_to_game.js):

- Added `isGalacticWarForConnect(payload)`.
- Added `reconnectingToExistingGame` state and logic to preserve reconnect metadata.
- In `handlers.server_state`, if the server tries to redirect directly to `coui://ui/main/game/live_game/live_game.html` for a GW match, the client rewrites that redirect to:
  - `coui://ui/main/game/gw_reconnect_loading/gw_reconnect_loading.html?target=<live_game_url>`

Effect in practice:

- Reconnecting GW clients no longer go straight into `live_game`.
- They are detoured through a small staging scene first.

### Client-side: new GW reconnect staging scene

New files:

- [ui/main/game/gw_reconnect_loading/gw_reconnect_loading.html](ui/main/game/gw_reconnect_loading/gw_reconnect_loading.html)
- [ui/main/game/gw_reconnect_loading/gw_reconnect_loading.css](ui/main/game/gw_reconnect_loading/gw_reconnect_loading.css)
- [ui/main/game/gw_reconnect_loading/gw_reconnect_loading.js](ui/main/game/gw_reconnect_loading/gw_reconnect_loading.js)

Behavior of `gw_reconnect_loading.js`:

1. Wait for `server_state`.
2. If the server wants to send the client to the real `live_game` target, and the match type is `Galactic War`, and GW files have not yet been restored:
   - do not enter `live_game` yet
   - send `request_memory_files`
3. When `memory_files` arrives:
   - synthesize untagged `/pa/units/unit_list.json` if needed from `.player` and `.ai`
   - unmount old memory files
   - mount the incoming GW memory files
   - force `api.game.setUnitSpecTag('.player')`
   - send `memory_files_received`
   - finally redirect to the real `live_game` URL

This means reconnect now has an explicit pre-live-game restore phase.

### Client-side: live_game also gained a `memory_files` handler

Changes in [ui/main/game/live_game/live_game.js](ui/main/game/live_game/live_game.js):

- Added `handlers.memory_files`.
- The handler:
  - synthesizes untagged `/pa/units/unit_list.json` if missing
  - unmounts old memory files
  - mounts the incoming file set
  - forces `api.game.setUnitSpecTag('.player')`
  - calls `engine.call('request_spec_data', -1)`
  - sends `memory_files_received`

This acts as a second safety net.

In practice, the intended reconnect path is the staging scene, but `live_game` is now also capable of consuming a late `memory_files` message directly.

### Why `engine.call('request_spec_data', -1)` matters

This call was added in the live_game `memory_files` handler and is a practical enhancement beyond the earlier theory.

It means the reconnect fix does not only remount the files. It also forces the engine/UI to refresh spec data after the new virtual file tree is present.

That is a strong hint that just mounting the files was not always enough once `live_game` had already started loading UI/model state.

### Why the fix uses replay config instead of regenerating files

This is another important practical choice.

The reconnect fix does not attempt to rebuild the GW file tree from campaign state on reconnect. Instead it reuses the full replay config already stored on the server.

That is safer because:

- the running match already uses that exact file tree
- reconnect should restore the same effective unit universe, not regenerate a potentially different one
- the server already keeps replay config around for other recovery and replay-related flows

## Commit `49a653b`

This follow-up commit removed the temporary debug logging added during reconnect investigation.

It did **not** remove the reconnect mechanism itself.

What remained after `49a653b`:

- `getReconnectReplayFiles()` in `playing.js`
- `sendReconnectMemoryFilesToClient()` in `playing.js`
- `request_memory_files` and `memory_files_received` handlers in `playing.js`
- GW redirect interception in `connect_to_game.js`
- the new `gw_reconnect_loading` scene
- the `live_game` `memory_files` handler

So the stable reconnect design is the behavior from `c55f52b` minus the payload-logging helpers.

## Theory vs Practice: What Changed from the Earlier Analysis

The earlier analysis was broadly correct about the root cause, but the final implementation differs in several important ways.

### Correct prediction: reconnect needed a GW memory-file restore handshake

This part was correct.

The crash really was solved by reintroducing a `memory_files`-style restore path for live Galactic War reconnects.

### Difference 1: restore happens in a new staging scene, not only inside `live_game`

Earlier theory suggested a replay-loading-style handshake before entering the game. The real implementation does exactly that, but by inserting a dedicated reconnect scene:

- [ui/main/game/gw_reconnect_loading/gw_reconnect_loading.js](ui/main/game/gw_reconnect_loading/gw_reconnect_loading.js)

That is more explicit and safer than trying to force all restore logic to happen after `live_game` has already started booting.

### Difference 2: the server does not proactively resend on reconnect

Earlier theory suggested the server might send files as part of reconnect handling. In practice, it does not.

Instead:

- reconnect reaches a stable connected state first
- the staging client requests GW files explicitly
- the server answers only when asked

That is a more pull-based protocol than expected.

### Difference 3: the authoritative source is `server.getFullReplayConfig()`

Earlier theory treated replay-loading as a good template. The final implementation goes further and directly reuses replay config as the source of truth for reconnect too.

That means the working mental model is:

- the generated GW file tree becomes part of the replay/full-match config
- reconnect restoration is effectively replay-config restoration for a live client

### Difference 4: `live_game` itself can now consume `memory_files`

Earlier theory focused on pre-entry restoration. In practice, the final implementation does both:

- staged restoration before live_game
- in-scene restoration support inside `live_game`

That extra handler likely makes the system more resilient to timing or scene-order edge cases.

### Difference 5: spec data is explicitly refreshed after mounting

The earlier analysis focused on missing files and spec tags. The final implementation additionally calls:

- `engine.call('request_spec_data', -1)`

inside `live_game` after mounting.

That is evidence that some reconnect failures were also related to stale spec caches or incomplete spec reloads after the new memory files appeared.

### Difference 6: reconnect metadata preservation in `connect_to_game`

The reconnect fix also preserves and merges previous reconnect info when login is accepted in [ui/main/game/connect_to_game/connect_to_game.js](ui/main/game/connect_to_game/connect_to_game.js).

That was not part of the earlier theory, but it matters because reconnect routing and GW detection may need:

- prior `game` type
- prior `setup`
- prior `mods`
- prior `content`

without depending entirely on the new login payload.

## End-to-End Reconnect Flow After the Fix

For a GW coop reconnect, the effective flow is now:

1. The client reconnects through `connect_to_game`.
2. Login succeeds and reconnect metadata is refreshed.
3. The server tries to redirect the client toward `live_game`.
4. `connect_to_game.js` detects that this is a Galactic War live-game redirect and rewrites it to the GW reconnect staging scene instead.
5. `gw_reconnect_loading.js` waits until it sees the intended `live_game` target for a GW match.
6. The staging scene sends `request_memory_files`.
7. `playing.js` answers with the GW file tree from `server.getFullReplayConfig().files`.
8. The staging scene unmounts old memory files, mounts the restored GW file tree, forces unit spec tag `.player`, acknowledges with `memory_files_received`, and only then enters `live_game`.
9. If a late or repeated `memory_files` message arrives inside `live_game`, `live_game.js` can now consume it too and request fresh spec data from the engine.

This is the main practical pattern to reuse for any future reconnect-safe dynamic-content mode.

## Important Design Lessons

### 1. Dynamic-content game modes need an explicit reconnect restore protocol

If a mode depends on `mountMemoryFiles`, reconnect must restore those files before the normal gameplay scene expects them.

### 2. The server should keep an authoritative copy of the generated file set

For GW, that copy effectively lives inside full replay config. Reconnect succeeds because the server can resend the exact file tree used by the match.

### 3. Scene routing is part of the fix, not just data transport

The `gw_reconnect_loading` scene is not cosmetic. It creates a safe staging area to rebuild virtual files before `live_game` starts touching tagged specs.

### 4. Spec tag restoration and spec cache refresh are both required

Restoring files alone is not enough. The reconnecting client must also restore the active unit spec tag, and in some cases explicitly request fresh spec data.

### 5. Fallback compatibility layers remain important

Synthesizing untagged `/pa/units/unit_list.json` from `.player` and `.ai` remains necessary in reconnect and replay flows because many legacy UI paths still assume an untagged unit list exists.

## Files Most Important for Future Work

If modifying Galactic War coop or reconnect behavior, start with:

- [ui/main/game/galactic_war/shared/gw_specs.js](ui/main/game/galactic_war/shared/gw_specs.js)
- [ui/main/game/galactic_war/gw_play/gw_referee.js](ui/main/game/galactic_war/gw_play/gw_referee.js)
- [ui/main/game/galactic_war/gw_play/gw_play.js](ui/main/game/galactic_war/gw_play/gw_play.js)
- [ui/main/game/galactic_war/gw_lobby/gw_lobby.js](ui/main/game/galactic_war/gw_lobby/gw_lobby.js)
- [server-script/states/gw_lobby.js](server-script/states/gw_lobby.js)
- [server-script/states/playing.js](server-script/states/playing.js)
- [ui/main/game/connect_to_game/connect_to_game.js](ui/main/game/connect_to_game/connect_to_game.js)
- [ui/main/game/gw_reconnect_loading/gw_reconnect_loading.js](ui/main/game/gw_reconnect_loading/gw_reconnect_loading.js)
- [ui/main/game/live_game/live_game.js](ui/main/game/live_game/live_game.js)
- [server-script/states/load_save.js](server-script/states/load_save.js)
- [ui/main/game/replay_loading/replay_loading.js](ui/main/game/replay_loading/replay_loading.js)

---

## Post-Reconnect UI Parity Fixes (Commits `acd428d` and `e48d3ec`)

After reconnect was stabilized, a separate coop-client-only defect cluster remained in live gameplay UI behavior. That work landed in two back-to-back commits:

- `acd428d` `Several fixes for Co-op player unit UI.`
- `e48d3ec` `Removed logging related to build/action UI bugfixes.`

These commits are tightly coupled: the first introduces functional fixes plus targeted diagnostics, and the second removes temporary diagnostics once behavior was validated.

## Problem Profile

The unresolved issue was not “coop cannot control units” in a broad sense. It was narrower and UI-path-specific:

1. Coop client could not ever see build-bar tooltips.
2. Coop client could not issue load/unload commands from the action UI.
3. Coop client hotkey sequences for build selection (category + slot) failed or appeared to do nothing.

Important observation:

- The host could still perform these actions in many cases.
- Core army/control assignment and reconnect transport were already functional. Or put in a not AI slop way, the client could issue commands like pick up a unit, its just that they had to do it with a workaround, as right clicking a unit with a transport unit selected would still work, but the UI buttons and hotkeys for those actions were broken.

That pointed to a client-side spec-lookup and UI data-shape problem, not a primary server authority or control-bits problem.

## Root Cause: Spec-ID Namespace Mismatch Across UI Subsystems

Galactic War coop runs with tagged unit specs (`.player`, `.ai`).

Many legacy UI systems still think in canonical untagged IDs (`.../foo.json`).

The failing behavior came from inconsistent normalization of spec IDs across different code paths:

- Some paths expected tagged IDs and looked up tagged data.
- Some paths expected untagged IDs and looked up untagged data.
- Some had one-way fallback (tagged -> untagged) but not the opposite.
- Some produced untagged references for hotkey/grid lookups while runtime payloads stayed tagged.

Result:

- Data existed, but lookups frequently missed because keys did not match exactly.
- UI then silently dropped behavior (no tooltip payload, missing command enablement, unresolved hotkey selection target).

## Where the Break Happened in Practice

### 1) Tooltip path

In `live_game.js`, build-hover and item-detail maps could receive a tagged ID while the currently indexed entry was only available in a different form.

Without bidirectional aliasing and fallback:

- Hover event carries `unit.json.player`
- details map has only `unit.json`
- lookup misses
- tooltip appears blank or missing

### 2) Action-bar command derivation (load/unload)

In `live_game_action_bar.js`, command availability comes from selected unit specs.

If selection reports one ID form and `unitSpecs` is keyed by another form, unit resolution fails.

When resolution fails, command extraction has nothing to inspect, so `Load`/`Unload` flags may never appear even though selected units support those commands.

### 3) Build-bar/hotkey selection

In `live_game_build_bar.js`, build-list and build-order resolution depended on exact-key hits that were vulnerable to tagged/untagged divergence.

If a hotkey-selected item resolves to one ID form while build structures are indexed in another, the action may look like a transient input stall (brief UI reaction, then no build placement state).

## Additional Compatibility Hazard Identified During Fixing

One mid-fix regression exposed another critical assumption:

- GW lobby remounting of synced memory files must preserve the compatibility untagged `/pa/units/unit_list.json`.

Why this matters:

- Some UI systems still probe the untagged list even in tagged GW modes.
- If remount flow only carries tagged lists and no synthesized untagged superset, unrelated UI queries can degrade in surprising ways.

The fix therefore restored synthesis of untagged unit list from `.player` + `.ai` when missing in GW lobby sync.

## Commit `acd428d`: Functional Fixes + Temporary Diagnostics

This commit fixed behavior by normalizing lookup behavior and hardening mount sequencing, while adding temporary `[GW_COOP]` logs to verify assumptions.

### A) GW lobby sequencing and compatibility restoration

Changes in `ui/main/game/galactic_war/gw_lobby/gw_lobby.js`:

- Removed eager `setUnitSpecTag('.player')` at scene startup.
- On `gw_config` receive:
  - Synthesize untagged `/pa/units/unit_list.json` from tagged lists if absent.
  - Unmount previous memory files before remounting synced GW files.
  - Apply `.player` tag only after mount succeeds.

This ensures the tag points to mounted content and legacy untagged assumptions are still satisfied.

### B) Reconnect staging parity with live-game refresh behavior

Changes in `ui/main/game/gw_reconnect_loading/gw_reconnect_loading.js`:

- After mounting incoming memory files, call `engine.call('request_spec_data', -1)` before transitioning.

That aligns reconnect staging with live-game spec refresh expectations and prevents stale spec cache behavior after remount.

### C) Tooltip and build-item resolution hardening

Changes in `ui/main/game/live_game/live_game.js`:

- `setBuildHover` now resolves across:
  - exact ID
  - tagged variants
  - canonical stripped ID
- `buildItemBySpec` now resolves across the same tagged/untagged combinations.
- Item detail indexing creates richer alias coverage so both tagged and untagged lookups can find the same detail model.

### D) Action-bar selected-unit resolution hardening

Changes in `ui/main/game/live_game/live_game_action_bar.js`:

- `resolveUnitSpec` expanded to robustly bridge tagged and untagged ID forms.
- Resolution order favored practical GW correctness while still supporting canonical fallback behavior.

### E) Build-bar resolution hardening

Changes in `ui/main/game/live_game/live_game_build_bar.js`:

- `resolveBuildSpecId` and `resolveBuildItemId` expanded with canonical+tag fallback paths.
- Added one-time logging guard to avoid repeated spam for the same fallback case.

## Why the “missing grid mapping” logs appeared even when behavior worked

The diagnostics included messages like:

- `[GW_COOP] addBuildInfo missing grid mapping for tagged id=... canonical=...`

This line does **not** mean the game is broken by itself.

It indicates:

1. Build hotkey map (`Build.HotkeyModel.SpecIdToGridMap`) is static and intentionally incomplete.
2. Many tagged specs in GW payloads (especially `.ai`, commander variants, base templates, helper units) are not expected to have dedicated grid entries.
3. The code falls back to `misc` grouping for unmapped entries.

So during a healthy run, it is normal to see many “missing grid mapping” messages for specs that are not intended to occupy a first-class hotkey slot.

In other words: this diagnostic was a visibility aid, not a hard error.

## Commit `e48d3ec`: Logging Cleanup

After validating that tooltip/load-unload/hotkey behavior was fixed, temporary diagnostic logs were removed while preserving functional changes.

What was removed:

- Most `[GW_COOP]` fallback and unresolved logs in live_game, action_bar, build_bar.
- GW lobby sync completeness logs.
- Reconnect staging mount-refresh success log.

What remained:

- The actual fallback logic and ordering.
- The GW lobby remount ordering and untagged unit-list synthesis.
- Reconnect staging spec-data refresh call.

This is the intended lifecycle:

1. Add narrow logs for uncertain assumptions.
2. Confirm runtime behavior and isolate edge cases.
3. Remove high-volume logs once stable.

## Final Technical Summary of the Issue and Resolution

### The issue

A set of coop-client UI features failed because multiple UI subsystems resolved unit specs using inconsistent key namespaces (`tagged` vs `untagged`) and partial fallback logic.

### The fix pattern

1. Normalize spec-ID resolution in every affected client path (tooltip, action-bar, build-bar).
2. Preserve compatibility untagged unit list when remounting synced GW files.
3. Ensure spec cache refresh occurs after reconnect memory-file remount.
4. Validate with temporary scoped diagnostics, then remove noise.

### Why this solved all three symptoms together

Tooltip rendering, command availability, and build hotkey selection all consume different projections of the same underlying unit-spec graph. Once that graph was consistently discoverable from tagged and untagged identifiers, all three features recovered without requiring separate game-rule changes.

## Practical Guidance for Future Similar Bugs

When a dynamic-content mode shows multiple "UI-only" failures at once, check for namespace drift before changing gameplay logic:

1. Verify whether lookups are mixing canonical and mode-tagged spec IDs.
2. Verify whether compatibility aggregate files (like untagged unit lists) are still synthesized after remount operations.
3. Verify whether spec caches are refreshed after memory file updates.
4. Prefer targeted, assumption-check logs with a unique prefix during diagnosis, then remove them after stabilization.

This pair of commits is a concrete template for diagnosing and fixing those conditions.

---

## GW Lobby Discovery Visibility Fixes (Commits `bd7227b` and `8e3b814`)

After reconnect and UI parity were stable, a separate discovery problem remained:

- GW coop lobby beacons were unstable or short-lived in LAN browser visibility.
- GW coop lobby beacons were not visible at all from non-LAN machines through server-browser discovery.
- Direct connect by `ip:port` still worked, proving game hosting and transport were functional.

That symptom profile strongly indicated a beacon publication/ingestion compatibility issue rather than a core networking issue.

## Commit `bd7227b`

This commit made GW beacons significantly more stable on LAN by reducing beacon payload size and matching normal lobby beacon structure more closely.

Changes in [server-script/states/gw_lobby.js](server-script/states/gw_lobby.js):

- Changed `game.system` beacon payload from full `config.system` to:
  - `utils.getMinimalSystemDescription(config.system)`

Effect in practice:

- GW lobby listings stopped disappearing as frequently on LAN.
- Beacon behavior became closer to standard lobbies, which already use minimal system summaries.

Why this helped:

- Full system payloads can be large and noisy.
- Minimal summaries are less likely to hit message-size, parsing, or update-thrashing edge cases in beacon pipelines.

## Commit `8e3b814`

This commit resolved non-LAN server-browser visibility by applying two practical compatibility changes.

### A) GW beacon `mode` changed to a canonical value

In [server-script/states/gw_lobby.js](server-script/states/gw_lobby.js):

- `mode: 'GalacticWar'` was changed to `mode: 'FreeForAll'`.

Observed effect:

- GW lobby became visible through the remote server-browser discovery path.

### B) GW startup no longer forces UPnP disable

In [ui/main/game/galactic_war/gw_play/gw_play.js](ui/main/game/galactic_war/gw_play/gw_play.js):

- Removed forced `disable_upnp: true` from GW game start params.

Observed effect:

- GW startup behavior became consistent with other lobby creation paths.

### C) Mod packaging now includes the changed GW play file

In [generate_mod.py](generate_mod.py):

- Added `ui/main/game/galactic_war/gw_play/gw_play.js` to the explicit copy list.

Why this matters:

- Prevents “changed in source but not shipped in built mod” drift for this critical launch file.

## Most Plausible Explanation for the “FreeForAll fixed remote discovery” behavior

The best current explanation is that non-LAN discovery applies stricter normalization/validation than LAN beacon rendering.

Likely model:

1. LAN browser path consumes local beacons directly and is permissive about custom `mode` values.
2. Non-LAN discovery path (service-backed or community index backed) likely expects canonical mode values (for example `FreeForAll`, `TeamArmies`, `Waiting`) or relies on those values for indexing/filtering.
3. A non-canonical value like `GalacticWar` may be dropped, ignored, or fail indexing in that upstream path.
4. Replacing with `FreeForAll` passes compatibility checks, so the entry becomes discoverable remotely.

This is not proven from service internals, but it matches the observed behavior very closely:

- LAN visibility improved with payload-shape fixes.
- Remote visibility only recovered once the mode string switched to a canonical token.

## Practical Lesson

If a lobby is visible on LAN but not remotely while direct connect still works, suspect beacon schema compatibility in the remote indexing path before suspecting transport.

Specifically validate:

- Beacon field sizes and shape (`game.system` summary vs full object).
- Canonical enum-like fields (`mode`, possibly region/type metadata).
- Packaging/deploy paths so launch-side changes are actually shipped.

---

## Cross-Machine Crash Fix (Commit `9f594ae`)

After the UI parity fixes were stable on some machines, a new severe regression appeared on at least one other machine:

- GW coop startup could crash during/just after lobby handoff into sim creation.
- The crash did not reproduce reliably on every machine.
- The first visible fatal line in the crashing log was often a missing archetype/spec read, for example:
  - `Error opening struct PlanetArchetypeSpec spec "/pa/terrain/sun.json", file failed to load`
- The same file could be present and valid on disk, and non-GW paths could still load normal games.

That profile is a classic race/timing signature, not a literal "file deleted from disk" signature.

## What Changed That Introduced the Risk

The regression window started with commit `acd428d`, specifically in:

- [ui/main/game/galactic_war/gw_lobby/gw_lobby.js](ui/main/game/galactic_war/gw_lobby/gw_lobby.js)

That commit changed GW lobby config mounting from a direct mount to:

1. `api.file.unmountAllMemoryFiles()`
2. then `api.file.mountMemoryFiles(cookedFiles)`

On paper, this looked safe and even hygienic (clear stale memory files, then mount fresh synced GW files). In isolation, that pattern is valid and appears elsewhere in GW/replay flows.

## Why `unmountAllMemoryFiles` Existed in the First Place

This call was not necessarily bad. It came from a legitimate historical pattern used in dynamic-content modes:

1. Avoid stale memory-file overlays from previous scenes.
2. Ensure a clean memory FS before mounting a generated namespace.
3. Keep behavior deterministic when switching between content sets.

That logic appears in existing code such as GW referee generation/mount paths and replay-style restore paths. So the motivation was defensive correctness.

## Why It Became Unsafe in GW Lobby Specifically

In this codebase, `unmountAllMemoryFiles` is not just a low-level file operation. It can be hooked/overridden by community-mod integration logic.

Key point:

- Community mods attach behavior to unmount/remount cycles (for example reloading client-mod mounts after unmount).

So in GW lobby startup, this sequence happened on affected machines:

1. GW lobby receives synced GW memory files.
2. GW lobby calls global `unmountAllMemoryFiles`.
3. Community-mod hook machinery reacts and triggers broader remount/reload activity.
4. GW startup proceeds toward `connection_GameConfig` / `connection_SimCreated` while mount state is still in flux.
5. A spec/archetype request during that window fails transiently (`/pa/terrain/sun.json` in observed logs), causing crash.

Why only some machines:

- Race depends on timing, thread scheduling, IO speed, GPU/driver timing, and mod load behavior.
- Faster or differently loaded machines can miss the bad window entirely.

## Commit `9f594ae` Resolution

Commit `9f594ae` made a minimal, targeted fix in:

- [ui/main/game/galactic_war/gw_lobby/gw_lobby.js](ui/main/game/galactic_war/gw_lobby/gw_lobby.js)

Behavioral change:

- Removed the GW lobby call to `api.file.unmountAllMemoryFiles()`.
- Kept direct `api.file.mountMemoryFiles(cookedFiles)`.
- Kept `.player` spec-tag application and ready signaling.
- Kept untagged `/pa/units/unit_list.json` synthesis compatibility logic introduced earlier.

This preserves all intended GW coop UI fixes while removing the race-prone global unmount trigger in this sensitive startup path.

## Why This Did Not Regress Functional Behavior

No regressions were observed after removing unmount in GW lobby because:

1. The critical functional requirement was mounting the synced GW files and setting `.player` tag.
2. The compatibility requirement (untagged unit list synthesis) stayed intact.
3. The removed step was a cleanliness step, not a gameplay requirement, and in this path it had become actively harmful due to hook side effects.

## Practical Engineering Lesson from `9f594ae`

In this project, treat `unmountAllMemoryFiles` as a high-impact operation with ecosystem side effects, not a purely local cleanup utility.

Before using it in a hot transition path (lobby startup, scene handoff, reconnect staging), verify:

1. Whether community-mod hooks attach additional remount behavior.
2. Whether the path is timing-sensitive around server-state transitions.
3. Whether direct mount/update is sufficient for correctness.

In short: the call was historically reasonable, but context changed. `9f594ae` corrected that context mismatch by removing global unmount from GW lobby sync, which eliminated a machine-dependent startup race.

## Commit `cf85a22`

This follow-up reconnect hardening commit removed a fragile remount sequence that could drop client-mod assets during reconnect restoration.

### What changed

Changes in [ui/main/game/gw_reconnect_loading/gw_reconnect_loading.js](ui/main/game/gw_reconnect_loading/gw_reconnect_loading.js):

- In `handlers.memory_files`, removed the global `api.file.unmountAllMemoryFiles()` call before mounting reconnect GW memory files.
- Kept direct `api.file.mountMemoryFiles(cookedFiles)` followed by:
  - `api.game.setUnitSpecTag('.player')`
  - `engine.call('request_spec_data', -1)`
  - `memory_files_received` ack and transition into `live_game`.

Changes in [ui/main/game/live_game/live_game.js](ui/main/game/live_game/live_game.js):

- In `handlers.memory_files`, removed the global `api.file.unmountAllMemoryFiles()` call.
- Kept direct memory-file mount plus spec-tag/spec-data refresh.

### Why this matters

On reconnect, the coop client can enter memory-file restore paths before all scene-specific client-mod remount assumptions are stable. A global unmount at that point can temporarily drop client-mod-provided assets that GW-generated specs reference.

When that happens, reconnect may appear to succeed until simulation resumes, then crash on missing assets such as:

- `/pa/units/land/bot_grenadier/bot_grenadier_ammo_hit.pfx`

Removing the unmount step preserves currently mounted client-mod assets while still overlaying reconnect GW memory files.

### Practical outcome

- If host and coop player have matching required client mods installed, reconnect now remains stable through unpause.
- If the reconnecting client lacks a required client mod, crash behavior remains expected because required assets are genuinely unavailable.

---

## GW Campaign Co-op Expansion and Stabilization (Commits `7874487` through `cf423b0`)

This phase introduced a second coop architecture layer on top of the earlier live-battle coop work:

1. A dedicated coop-capable Galactic War campaign server state (`gw_campaign`) and entry flow in GW play.
2. Host/viewer campaign-map synchronization while both players remain in the campaign scene.
3. Hardening for reconnect, no-local-save users, session teardown persistence, and compatibility with large GW-overhaul client mods (notably GWO).

This was the most iteration-heavy part of the project so far, because the failure modes were mostly "state drift" issues rather than immediate hard crashes.

## Scope of This Commit Chain

The `7874487 -> cf423b0` chain should be treated as one coherent body of work. Although the commits are split by symptom, they all address one root objective:

- make campaign-map coop deterministic enough that host and viewer see the same campaign state transitions
- preserve local GW save integrity when entering/leaving coop
- keep behavior stable for users with no prior local GW save
- avoid regressions with GW-overhaul mods that replace core GW play methods after scene load

Without all commits in this chain, the feature works only partially.

## What Was Added in the Initial Campaign Co-op Cut (`7874487`)

### Server-side campaign authority state

New file:

- [server-script/states/gw_campaign.js](server-script/states/gw_campaign.js)

Key responsibilities introduced:

- host/viewer role assignment
- control payload broadcast (`gw_campaign_control`)
- snapshot storage and sequencing (`gw_campaign_snapshot`)
- join/reconnect lifecycle handling and viewer reconnect timeout
- lobby beacon publication for campaign sessions
- host-only campaign exit / launch control

Registration change:

- [server-script/main.js](server-script/main.js) now includes `gw_campaign` in the state list.

### Client-side campaign coop UI and session controls

Changes in:

- [ui/main/game/galactic_war/gw_play/gw_play.html](ui/main/game/galactic_war/gw_play/gw_play.html)
- [ui/main/game/galactic_war/gw_play/gw_play.js](ui/main/game/galactic_war/gw_play/gw_play.js)

New user-facing behaviors:

- "Open to Co-op" action for host
- "Leave Co-op Session" action
- header status text showing campaign coop role/connection state
- viewer read-only mode presentation

Early synchronization model in this first cut:

- host periodically pushed campaign snapshots
- viewer applied snapshots to local GW game model
- incremental actions were not yet the primary synchronization mechanism

This first cut established infrastructure but exposed several subtle desync classes in real use.

## Problem Cluster 1: No-local-save Viewer Crashes (`654d94a`)

### Symptom

A viewer with no pre-existing local GW save could crash on campaign scene load/reconnect paths.

### Root issue

Several code paths assumed `GW.manifest.loadGame(activeGameId())` always returns a valid local game for campaign UI binding. That assumption was true for hosts and returning players, but false for first-time viewers or viewers who had no prior galactic war saves.

### Fix direction

The code was hardened to:

- tolerate missing local game at startup
- request/apply host sync state rather than requiring local save bootstrap to already exist
- avoid immediate null-object cascades in computed bindings that expected complete star/system data

## Problem Cluster 2: Cards and Immediate Feedback Lag (`3e276f8`)

### Symptom

- tech cards acquired by host were not immediately visible for viewer
- associated audio cue behavior was not playing

### What made it hard

Snapshot delivery was eventually consistent but not synchronized to the exact point when card lists changed in gameplay flow.

### Initial bad avenue

The early tendency was to rely on more frequent snapshots to catch the missed update window. That reduced some lag but did not eliminate race windows and added complexity/noise.

### Effective fix

`gw_campaign_action` was used as a first-class incremental channel, with explicit action types for:

- selection/movement intent
- explore lifecycle
- card-list synchronization (`sync_star_cards`)
- win/lose turn transitions

Viewer replay guards were added so viewer-local actions are blocked in normal mode but allowed when replaying host actions.

This was the inflection point where campaign coop moved from "snapshot-only correction" to "action-first replay + snapshot correction".

## Problem Cluster 3: Map Ownership/Reveal Drift (`fde5b17`)

### Symptom

Even when action replay logs looked correct, viewer map ownership coloring and reveal status would still diverge from host.

### Root cause (critical)

The campaign UI map model and the loaded game model did not always share the same effective star object references after snapshot/hydration and replay timing.

That means:

- host-driven game state changed
- viewer replay ran
- but map rendering still read stale star observables

### False start that consumed time

Movement replay/path handling was initially suspected as the primary source of ownership drift. While movement timing did matter in some cases, it was not the full root cause for ownership color mismatch.

### Final resolution

Added explicit viewer star bridging utilities in [ui/main/game/galactic_war/gw_play/gw_play.js](ui/main/game/galactic_war/gw_play/gw_play.js):

- `syncViewerStarFromGame`
- `syncViewerStarsFromGame`

These copy ownership-driving observables (`history`, `explored`, `cardList`, `ai`, `system`, and related fields) from runtime game stars into map-view stars after snapshots and high-impact actions.

Result:

- ownership color, reveal state, and map-level metadata updates became consistent with host progression.

## Problem Cluster 4: Missing Flavor Text/Planet Preview + Reconnect Edge (`359550e`)

### Symptoms

- some already-owned systems had missing flavor text/planet preview for viewer
- reconnecting viewers with no save still had a crash path in specific reconnect scenarios

### Root issue

Some snapshot/save stars arrived without complete `star.system` payloads; viewer UI components that depend on system metadata then had nothing to render.

### Fix

Snapshot payload enrichment was added:

- when save stars lacked `system`, data is backfilled from runtime stars before snapshot publication

Reconnect detection was broadened beyond query-param-only mode:

- session/local storage reconnect metadata is parsed safely
- reconnect mode can create a placeholder `new GW.Game()` when no local active game exists

This closed the remaining no-save reconnect crash path and restored system preview rendering.

## Problem Cluster 5: Save Corruption on Session End / Leaving Coop (`60438a2`)

### Symptom

When viewer left coop (or was disconnected), their local GW save would be left corrupted for subsequent single-player use.

### Why this happened

Transit away from coop would happen before local game persistence had a fully enriched, stable campaign object graph.

### Fix

Added explicit persistence workflow before transit/disconnect handoff:

- `enrichCampaignGameSystems(reason)`
- `persistCampaignLocalCopy(reason)`

and invoked it during:

- `leaveCoopSession`
- connection-disconnect handling

This ensures system payloads are enriched and `GW.manifest.saveGame(game)` completes (or at least is attempted) before moving scenes.

## Problem Cluster 6: GWO Compatibility Breakage (`cf423b0`)

### Symptom

With the Galactic War Overhaul mod (and presumably other mods which affected Galactic War) enabled on both host and viewer, movement/ownership/card synchronization regressed.

### Why this was uniquely tricky

GWO does not just tweak data; it replaces core `gw_play` methods after load (for example `model.explore`, `model.win`, and selection/canMove behavior). That can silently overwrite coop wrappers/guards introduced earlier.

### False assumption corrected

At first glance it seemed "both players have same mod, so behavior should stay synchronized." In practice, synchronization still fails if external method replacement bypasses coop relay/replay hooks.

### Fix strategy (without changing GWO)

Implemented runtime compatibility wrappers in [ui/main/game/galactic_war/gw_play/gw_play.js](ui/main/game/galactic_war/gw_play/gw_play.js):

- `wrapCampaignOverrideIfNeeded`
- `ensureCampaignCompatibilityHooks`
- native markers (`__gwCampaignNative`) on coop-owned base methods
- periodic re-hook watcher to catch async post-load overrides

Wrapper behavior preserves:

- viewer input gating outside replay
- host action relay for overridden `explore`/`win`/`lose`
- additional `sync_star_cards` relay for modded explore paths that bypass original card sync timing

This solved the conflict at integration boundaries without modifying GWO itself.

## Key Challenges Across the Whole Chain

1. Most bugs were eventually-consistent state drift, not immediate exceptions.
2. The campaign scene has overlapping models (game model vs map/view model), so "state changed" did not guarantee "UI consumed changed state."
3. Reconnect behavior depends on storage/query/session contexts and could not rely on one signal.
4. Coop hooks could be overwritten at runtime by third-party scene mods loaded after our initialization.

## Most Important False Starts and Why They Were Wrong

1. Snapshot-frequency-first thinking as a universal fix:
It reduced some symptoms but did not address stale model-reference bridging.

2. Treating movement replay as the sole ownership bug source:
Movement path variance existed, but primary ownership drift was stale star observables in map view.

3. Query-parameter-only reconnect detection:
Worked for direct entry but missed reconnect paths where state is carried through storage metadata.

4. Assuming our wrappers persist once installed:
External GW mods can override functions later, requiring active re-hooking.

## Why the Final Architecture Works Better

The chain converged to a hybrid model:

1. Action-first synchronization for low-latency deterministic replay.
2. Snapshot correction as safety net and hydration mechanism.
3. Explicit game->view star synchronization bridge for ownership/reveal rendering.
4. Persistence hardening before transit/disconnect to protect local saves.
5. Runtime compatibility wrapping for post-load mod overrides.

Each layer addresses a different failure class. Removing any single layer reopens at least one historical bug category from this chain.

HUMAN NOTE: In a not AI slop way, I like to view this architecture as being centered around the following idea: Galactic War is like a state machine. We're in some state $X$. Whenever anything changes, its like we apply a function representing that change $F$ to $X$ to get $F(X)$. In the initial phase of this code, what we were doing was measuring $X$, and measuring $F(X)$ and basically computing 
$$
\delta = F(X) \ominus X,
$$
then sending $\delta$ to the client, so then they would do
$$
X \oplus \delta = X \oplus (F(X) \ominus X) = X \ominus X \oplus F(X) = F(X).
$$
Of course, viewing it through this sort of lense is a bit of an oversimplification, as the set of possible states which Galactic War can be in $\{X\}$ does not really form a group under the $\oplus$ operation, and $\oplus$ isn't even going to be abelian. Just look at the action of fighting in a system and winning. That's not invertible :). 

## Files Most Relevant to This Scope

- [ui/main/game/galactic_war/gw_play/gw_play.js](ui/main/game/galactic_war/gw_play/gw_play.js)
- [ui/main/game/galactic_war/gw_play/gw_play.html](ui/main/game/galactic_war/gw_play/gw_play.html)
- [server-script/states/gw_campaign.js](server-script/states/gw_campaign.js)
- [server-script/main.js](server-script/main.js)
- [generate_mod.py](generate_mod.py)

These are the primary files future contributors should inspect before changing campaign coop synchronization behavior.