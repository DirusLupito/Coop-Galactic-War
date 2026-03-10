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