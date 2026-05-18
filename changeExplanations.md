# Coop Galactic War Change Explanations

This document captures how rough-but-working Galactic War coop was introduced, how Galactic War's generated in-memory files work, how reconnect was later fixed, how Continue War ultimately stabilized around full server-process restart, how the galactic war lobby was implemented, and how later UI/UX hardening made campaign coop easier to join, diagnose, and tune.

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
  - `b7e3759` `Removed tag causing gw co-op lobbies to not show up outside of LAN.`
  - `d8591c8` `Fixed an issue where saving and quitting from GW would corrupt co-op player's save.`
  - `7f9543d` `Tech card deletions now apply to co-op players.`
- Campaign lobby/chat UX and dynamic player-count commits:
  - `a70eb09` `Implemented basic lobby controls in co-op GW to address [#6](https://github.com/DirusLupito/Coop-Galactic-War/issues/6).`
  - `5a79c85` `UI improvements, GW now supports variable player counts.`
  - `39af2b8` `Fixed an issue where clients would see default/empty lobby data on join.`
  - `2e5ec38` `Single player galactic war no longer broadcasts a server beacon.`
  - `54430b9` `Host can now kick players.`
  - `8b4ae20` `Co-op player no longer sees controls for things they cannot control.`
- Continue War restart and automatic reconnect commit chain:
  - `c2da1d3` `Continue war from the host now automatically reopens a lobby.`
  - `7039a84` `Co-op players now automatically reconnect with the host when continuing the war.`
  - `36ce3a4` `Fixed an issue where the live game patch wouldn't apply to the co-op players.`
  - `d32e569` `Saving and exiting once again immediately closes the server.`
  - `cddd2ca` `Co-op player no longer sees the continue war button.`
  - `46206f1` `Fixed issue with continue war from GWO FFAs.`
  - `43e243e` `Fixed another issue where co-op players could see the continue war button.`
- Required-mod enforcement and optional-mod isolation for GW coop:
  - `0adc233` `Clients are now rejected from coop servers if they are missing GW affecting mods.`
  - `d129a7a` `Client mods other than GW affecting mods are now isolated to each client.`
- UI/UX improvements and co-op setup hardening:
  - `3e6ea25` `Added new warning screen for missing required mods.`
  - `df48a7d` `Fixed vanilla PA issue where AIs would not be affected by skin mods.`
  - `5b5565e` `Fixed issue where skin mods would not affect AIs for arbitrary mods.`
  - `b70db88` `Fixed issue where coop player's camera would be sent to a wrong location.`
  - `93cd35e` `Partially fixed an issue causing the log to be spammed with file not found errors.`
  - `61b56f8` `Added indicator to show when clients are still connecting.`
  - `61806ca` `Server will now reject players trying to join when the lobby is full.`
  - `aefc22c` `Fixed an issue where some tech cards would cause local skin mods to not apply.`
  - `6ca9bdc` `Fixed stale handlers trapping reconnecting clients in live_game.`
  - `2d36936` `Removed outdated guide information.`
  - `6fa9066` `GW Map loading now gated behind new loading screen.`
  - `6c7308b` `GW Reconnect now applies skin mods just like regular connect.`
  - `43e06fa` `Added a new, more obvious open to coop button.`
  - `8348619` `Slots can be locked to a custom slot cap.`
  - `877149e` `Galactic war now scales in difficulty with more players.`
  - `35de697` `Co-op players can now select and hover their own stars.`
  - `1bb752a` `Added tooltip to the open to coop button.`
- Unshared play:
  - `515e287` `Implemented unshared play.`
- Per-player tech cards:
  - `573cdd5` `Per player tech now locks shared to off.`
  - `9e42412` `Generating a config for unshared is now a referee's responsibility.`
  - `3ba9c65` `Fixed indentation error`
  - `5e14025` `Tech referee now generates .player0, .player1... tags.`
  - `5719b1c` `Tech referee now cooks unit specs for .player0, player1,...`
  - `42cd816` `Co-op player can now build with .playerN tagged units.`
  - `b5c6318` `Added changes from build 124640`
  - `aaca920` `Added explicit steam p2p/local networking choice support.`
  - `84063ab` `Fixed reconnect breaking coop player's ability to build`
  - `d593a47` `Move various gw loading screens to the galactic war folder.`
  - `3d8ec46` `Per player tech cards now properly generate minions for each player.`
  - `4a956a2` `Coop players can now pick their loadout and commander.`
  - `f7b8b02` `Coop players can now pick their own tech cards.`
  - `b2ec283` `Refactored tech card picking to do more client side prediction.`
  - `fd233da` `Coop player now waits until inventory is loaded.`
  - `1b9d952` `Fixed issue where lobby would open with only 1 slot by default.`
  - `f2a5e4b` `Fixed issue with incorrect colors for co-op subcommanders.`
  - `5e00ed8` `Fixed small issue where coop player would see bad inventory.`
  - `f7db6fd` `Optimized network usage for sending GW coop data.`
  - `8281eff` `Fixed an issue where loading a modded save without the mod crashed.`
  - `1ff4ce1` `Fixes for a few issues.`
  - `50a656f` `Added a catch up mechanic so late joiners are still equal to host.`
  - `193a0c1` `Fixed visual issue where host was eternally picking tech cards.`
  - `afd8727` `Added a screen to view other player's loadouts and cards.`
  - `c4f097c` `Removed extraneous inventory button for the local player.`
  - `5351a24` `Added changes from build 124641`
  - `14ca456` `Adjusted difficulty scaling code.`
  - `f48ba07` `Added patcher to gw game for coop games.`
  - `8bf0142` `Per player tech tags are now regenerated with skin mod effects.`
  - `753439a` `Per-player tech card games now unlock loadouts for co-op players.`
  - `791141d` `Copied boss flavor text fix.`
- Post-per-player-tech-card changes:
  - `f303aee` `Client mod gate now shows mods on client missing from server.`
  - `41e8bcc` `Fixed issue #33.`
  - `75e12ba` `Galaxy generation now factors in number of coop players.`
  - `16d2f02` `spawn_unit_on_death specs are now applied even when there is no death_weapon spec.`
  - `bcdfcde` `Fixed an issue with steamp2p connections failing.`
  - `cea37ad` `Cleaned up bad fallback for host/client inference.`
  - `3f4f727` `Comma separates logged reject reason.`
  - `1da19fa` `GW Lobby will no longer try to request config forever.`
  - `f3bd000` `Removed unused parameter in getCoopPlayerTechCardDealCount.`
  - `ddf96c2` `Steam P2P now works with autoreconnect.`
  - `96cc3ee` `Fixed issue where coop players saw different available tech.`

## High-Level Summary

Galactic War coop works by adapting a single-player Galactic War battle into a temporary multiplayer-compatible flow, then extending the same pattern to reconnect, campaign-map coop, and lobby UX hardening.

At a high level, the codebase now does all of the following:

1. Advertises the normally hidden Galactic War battle lobby in the regular multiplayer server browser, while later suppressing solo GW beacons and preserving campaign launch metadata.
2. Maps connected clients into shared human control for the live battle and later syncs campaign-map coop state through snapshots, actions, and persistence.
3. Patches the in-game UI so clients can operate against Galactic War's tagged unit specs such as `.player` and `.ai`, including build, action, tooltip, and reconnect refresh paths.
4. Reconstructs the reconnecting client's Galactic War in-memory file system before allowing it to enter `live_game` again.
5. Keeps GW campaign coop stable across save/load, reconnect, and third-party mod overrides by preserving local campaign state and re-hooking overridden methods when needed.
6. Hardens lobby discovery, slot management, chat/settings UX, and startup sequencing so the coop flow stays visible and does not race memory-file mounts.
7. Implements Continue War as an explicit host-triggered restart protocol (`restart_prepare` + process shutdown + reconnect staging), rather than implicit reconnect-on-disconnect fallbacks.
8. Ensures expected Save-and-Exit semantics by shutting down immediately when host exits in `game_over`, while keeping restart-only behavior isolated to the Continue War path.
9. Gives missing-required-mod failures explicit user-facing gates instead of relying on rejection text that can be lost during scene transitions.
10. Treats campaign-map client loading as a first-class state, using a loading scene and server-side loading indicators before viewers enter `gw_play`.
11. Stores co-op setup intent in GW saves, including intended co-op player count and optional hard slot caps.
12. Uses the saved co-op player count to scale generated Galactic War difficulty through AI economy and enemy minions.
13. Keeps campaign selection local to each player while leaving movement, fighting, exploring, and card decisions host-authoritative.
14. Lets a co-op campaign launch a fight with either shared armies or as separate allied armies, with the default stored in the GW save and the per-battle value controlled from the campaign lobby.
15. Adds a per-player tech-card battle mode by giving each human army its own generated player spec tag, its own unit files, and eventually its own inventory/loadout/card choice lifecycle.
16. Tightens post-merge behavior around required client mod mismatches, co-op galaxy generation, issue #33, and spawned-unit spec tagging.
17. Preserves Steam networking metadata across GW campaign and battle lobby beacons, removes role-guessing from Continue War restart prep, and bounds GW config retry behavior.
18. Reconnects Steam socket Continue War viewers by rediscovering the restarted lobby through the same remote, custom, and LAN beacon sources used by the multiplayer server browser.

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
Of course, viewing it through this sort of lense is a bit of an oversimplification, as the set of possible states which Galactic War can be in $\{X\}$ does not really form a group under the $\oplus$ operation, and $\oplus$ isn't even going to be abelian. Just look at the action of fighting in a system and winning. That's not invertible, so there's no way this is a group :). 

But anyways, back to my abstract algebraic view, this was an approach I despised. I figured that if we could just define a set of operators on the state of galactic war $\{F, G, \ldots\}$, and then just send the operator to each client when the host performed that operation, we could guarantee that the clients would always be in sync with the host, provided we have the same initial conditions (this assumes my set of operators is wholly comprised of deterministic operators, which I figured was true). Basically, we do one big broadcast at the start where the host's state $X$ is sent to all the clients. Then as an example let's represent moving to a system as the operator $F$, and exploring it as the operator $G$. Then all we need to do is send $F$ to the clients when the host moves, and send $G$ to the clients when the host explores, as on the host side we're going from state $X$ to state $F(X)$ to state $G(F(X))$. So all the clients need to do is 

1. track the current state, and 
2. listen for operator broadcasts, and when they receive an operator, apply it to their current state to get the next state.

So in the end everyone winds up in state $G(F(X))$, and we never have to do some outrageously massive $\delta$ broadcast. I am assuming that the cost of sending $\delta$ to the clients as measured by some cost operator (maybe packet size? maybe computation time? IMO a mixture of both) $\|\cdot\|$ satisfies 
$$
\|\delta\| \gg \|F\|
$$
for any and all operators $F$. The only time I broadcast a snapshot is if I detect that somehow a client's state has gotten totally out of sync.

If you tried to read this and thought it was all stupid math gibberish slop I wouldn't be surprised. I just wanted to share my thought process for how I came up with the general idea of keeping the clients in sync with the host. TL;DR do clientside prediction, and only send packets from the host to the clients when the host does something that changes the game state, like moving to a new system or exploring, or fighting, etc.

## Files Most Relevant to This Scope

- [ui/main/game/galactic_war/gw_play/gw_play.js](ui/main/game/galactic_war/gw_play/gw_play.js)
- [ui/main/game/galactic_war/gw_play/gw_play.html](ui/main/game/galactic_war/gw_play/gw_play.html)
- [server-script/states/gw_campaign.js](server-script/states/gw_campaign.js)
- [server-script/main.js](server-script/main.js)
- [generate_mod.py](generate_mod.py)

These are the primary files future contributors should inspect before changing campaign coop synchronization behavior.

## Additional small bugfixes (commits `b7e3759` and `d8591c8`)

### Removed tag causing gw co-op lobbies to not show up outside of LAN.

Very simple change, I just changed the beacon tag from `'GW Co-op'` to `'Testing'` as `'GW Co-op'` is not a tag that exists anywhere else while testing is and seems to (somewhat) fit.

### Fixed an issue where saving and quitting from GW would corrupt co-op player's save.

Another simple fix, I just took the campaign persistence function that was being called on forced and voluntary disconnect from the co-op session and also called it on voluntary saving and quitting of the entire galactic war game.

---

## Campaign Lobby UX and Dynamic Slot Work (Commits `a70eb09`, `5a79c85`, `39af2b8`, plus follow-ups)

This scope introduced a dedicated in-campaign co-op lobby UI in `gw_play`, made campaign party size adjustable, and then fixed several first-load synchronization bugs that caused host-side placeholders/defaults to appear briefly.

## Commit `a70eb09`

This commit introduced the first complete campaign-side lobby/settings/chat surface.

### Server-side changes in [server-script/states/gw_campaign.js](server-script/states/gw_campaign.js)

- Added campaign lobby settings state (`game_name`, `public/friends/hidden`, `tag`) and bouncer integration.
- Added `modify_settings` handler (host-only) to apply settings and rebroadcast control state.
- Added lobby chat support with `chat_message` broadcast and bounded `chat_history` retrieval.
- Extended control payload with `settings` and `require_password` so UI can render canonical lobby settings.

### Client-side changes in [ui/main/game/galactic_war/gw_play/gw_play.js](ui/main/game/galactic_war/gw_play/gw_play.js), [ui/main/game/galactic_war/gw_play/gw_play.html](ui/main/game/galactic_war/gw_play/gw_play.html), and [ui/main/game/galactic_war/gw_play/gw_play.css](ui/main/game/galactic_war/gw_play/gw_play.css)

- Added campaign settings panel (title, privacy mode, optional password).
- Added in-panel campaign chat (history fetch + send).
- Added an initial slot list rendered from `connected_clients` (still fixed-size at this stage).

Effect in practice:

- Campaign sessions could now be configured from inside GW play itself.
- Co-op users could communicate via campaign-local chat.
- UI now had a reliable, server-driven settings/control surface instead of implicit defaults.

## Commit `5a79c85`

This commit evolved the initial lobby into a dynamic, more production-ready flow.

### Major server changes

- `gw_campaign.js`:
  - Added dynamic campaign max-client handling (`max_clients`, `max_clients_limit`) and clamped updates.
  - Included control payload in role messages to improve first-paint synchronization.
  - Exposed max-player values in `modify_settings` responses.
  - Switched campaign max-player limit discovery to launch-arg/env lookup.
- `gw_lobby.js`:
  - Shifted from hardcoded 2-player assumptions to env-driven max player count.
  - Removed mandatory second-player wait in start gating; readiness now depends on creator/system/sim/config readiness.

### Major client changes in `gw_play`

- Chat UI/UX updates:
  - Increased chat width, standardized 13px message text, and added unread/flash visual states.
  - Added timed flash sequence tied to `gwChatFlashActive` and CSS transitions.
- Dynamic slot control updates:
  - Replaced fixed two-slot rendering with `gwCampaignMaxClients`-driven list generation.
  - Added add/remove slot controls and modify_settings wiring for max-client changes.
- Role/control initialization updates:
  - Applied role payload control immediately when present.
  - Added fallback connected-client seeding when control had not arrived yet.

Effect in practice:

- Host could scale campaign lobby slots up/down within configured limits.
- Campaign chat became easier to read and gave clear unread feedback when collapsed.
- Lobby start behavior no longer blocked on an arbitrary two-player assumption.

## Commit `39af2b8`

This commit targeted a first-load desync where users briefly saw default settings and empty slots.

### Core fixes

- `gw_play.js` `applyCampaignLobbyControl` no longer overwrote current UI values when a partial payload omitted keys.
- `gw_play.js` `updateCampaignConnectionState` stopped blindly setting empty control and only applied incoming control when present.
- `gw_campaign.js` added host-presence fallback in connected-client derivation and safer client-name fallback in control mapping.

Effect in practice:

- Most join paths stopped flashing default/empty campaign lobby state before real control data appeared.
- Co-op viewer-side initialization became significantly more stable.

## Another fix: flattened `server_state` payload parsing

A remaining host-only issue persisted: logs showed host name present in server control broadcasts, but host UI still rendered empty slots until any later control-changing action.

Root cause:

- Host `server_state` payloads sometimes delivered control fields directly under `payload.data` instead of nested `data.control`.
- Client init logic only checked `data.client.control`/`data.control`, so initial control apply could be skipped despite valid data being present.

Final fix in [ui/main/game/galactic_war/gw_play/gw_play.js](ui/main/game/galactic_war/gw_play/gw_play.js):

- In `updateCampaignConnectionState`, when nested control is absent but `payload.data` has control-like keys (`connected_clients`, `max_clients`, `settings`, etc.), treat `payload.data` itself as incoming control.

Effect in practice:

- Host slot names/settings now populate correctly on first render without requiring any follow-up interaction (`modify_settings`, player join/leave, etc.).

## Practical lessons from this scope

1. Do not treat missing keys in early control payloads as instructions to reset UI state.
2. Normalize control extraction across nested and flattened payload forms (`client.control`, `control`, and top-level `data` fallback).
3. For lobby UI initialization, first-paint correctness matters as much as eventual consistency; users interpret first frame as authoritative.
4. Role payloads are useful for fast initial hydration, but should still be merged with subsequent full control broadcasts.

---

## Single-Player Beacon Suppression + Campaign Launch Context (Commit `2e5ec38`)

This commit tightens GW lobby visibility behavior so solo Galactic War sessions are no longer published as multiplayer beacons, while preserving campaign-coop lobby metadata when transitioning into `gw_lobby`.

### Server-side campaign context handoff (`server-script/states/gw_campaign.js`)

- Added persistent `access` tracking (`password`, `friends`, `blocked`) in `GWCampaignModel`.
- `updateBouncer` now mirrors incoming access settings into that tracked model state.
- Added `buildGwLobbyLaunchContext(payload)` that packages:
  - `gw_campaign_active`
  - current star
  - campaign lobby settings (`game_name`, `tag`, visibility flags)
  - `max_clients`
  - access control data from bouncer whitelist/blacklist/password
- `launch_gw_battle` now transitions with context:
  - `main.setState(main.states.gw_lobby, msg.client, self.buildGwLobbyLaunchContext(msg.payload))`

### Server-side GW lobby behavior (`server-script/states/gw_lobby.js`)

- `LobbyModel` now accepts a `launchContext` and distinguishes:
  - campaign-coop launch (`gw_campaign_active: true`)
  - solo GW launch (default when no campaign context)
- Added `applyLaunchAccessControl()` to rehydrate password/whitelist/blacklist in `gw_lobby` from campaign context.
- Added `getSessionMaxClients()` so solo GW is forced to `1` client, while campaign-coop can use campaign-defined player limits.
- `updateBeacon()` now explicitly suppresses publishing when:
  - session is solo GW, or
  - lobby is hidden, or
  - lobby is private/friends-only with no friend whitelist
- Beacon payload now mirrors active access/settings:
  - `max_players` uses `server.maxClients`
  - password/whitelist/blacklist/tag/game name come from campaign-derived state

### Client-side launch metadata propagation (`ui/main/game/galactic_war/gw_play/gw_play.js`)

- On battle launch, GW now persists campaign context into battle config:
  - `gw_campaign_active`
  - `gw_campaign_settings` (`game_name`, `tag`, visibility flags, `max_clients`)
- When campaign host launches battle, `launch_gw_battle` now includes that context payload so server-side `gw_campaign` can pass it forward to `gw_lobby`.

### Practical outcome

1. Single-player Galactic War no longer appears in LAN/server-browser listings as a joinable lobby.
2. Campaign-coop launches keep lobby identity and access policy consistent across `gw_campaign` -> `gw_lobby` transition.
3. GW battle lobby beacon publication is now conditional and intentional, instead of always-on.

---

## Commit `54430b9`: `Host can now kick players.`
For this commit, I simply looked at how kicking was done with function `playerMsg_kick(msg)` in `lobby.js` and
basically copied that code over to `gw_campaign` along with the extra CSS/HTML/Client side kick message sending JS code needed. 
Pretty simple to implement.

---

## Commit `7f9543d`: `Tech card deletions now apply to co-op players.`
A quick fix which I applied to `gw_play.js`. I updated `applyCampaignAction` to have a new handler for a new `'discard_card'` action type. This action type was broadcast from the host every time a card was deleted from the `discardHoverCard` function. Inside of that function, I noticed that the card parameter was never used, so I decided to co-opt it for my purposes and use it as the index of the card to be deleted. While the host figured out what card to delete based on what card was being hovered over, the clients would recieve the card index the host derived as part of the action payload, and then when they were simulating the deletion action they would simply use that index from the payload to know what card to delete. On the host side the only change necessary was to add a call to `sendCampaignAction` with the action type set to the new `'discard_card'` type and the payload set to the index of the card to be discarded.

---

## Commit `8b4ae20`: `Co-op player no longer sees controls for things they cannot control.`
During playtesting I came across what is now issue #13: 
```
GWO Re-roll on co-op player side causes a desync. #13
This desync continues even after the re-roll, and seemingly the only way to recover from it is to leave the session, then delete the local GW save, and finally rejoin.
```
My solution was very simple, I decided to hide the UI elements for the controls for acquiring, deleting, and dismissing tech cards on the co-op player's side. Since Galactic War Overhaul reused the dismiss tech UI element, by hiding dismiss tech on the co-op player's side I also wound up hiding the reroll tech button. As a result the co-op player no longer had the ability to click said buggy button and thus the bug could no longer arise. All I had to do was change `gw_play.css` and `gw_play.html`.

---

## Continue War Process-Restart and Auto-Reconnect Stabilization (Commits `c2da1d3`, `7039a84`, `36ce3a4`, `d32e569`, `cddd2ca`, `46206f1`, `43e243e`)

This commit chain introduced, stress-tested, and then hardened the final co-op Continue War architecture that is now merged into `main`.

The key architectural decision was:

- **Do not** try to continue campaign flow by reusing the ended battle server process.
- **Do** treat Continue War as a coordinated full process restart.

### Earlier failed direction: reusing the same process

During early implementation, there was an attempt to implement these changes by reusing the same server process. That is, the server would not be closed, and instead it would just stay open and return to handling the lobby when continue war was pressed.

That approach had many failings and was ultimately fully reverted. Nothing else in the game reuses a single server process for multiple games as far as I know, so it seemed likely that such an approach would be very error prone.

### Final direction: explicit restart protocol

The stable path is now explicit and message-driven:

1. Host clicks Continue War.
2. Server in `game_over` sends `gw_return_to_campaign_restart_prepare` with role/context metadata.
3. Clients transition to restart-loading flow by explicit restart intent.
4. Server performs full shutdown and exits battle process.
5. Host starts fresh `gw_campaign` process; viewers reconnect via normal connect/retry flow.

This makes Continue War intent unambiguous and keeps normal Save-and-Exit behavior separate.

### Commit `c2da1d3`: first end-to-end restart flow

Introduced the initial full restart flow:

- New host-only server message handler in `game_over` to trigger restart.
- `restart_prepare` payload broadcast/direct-send with role and campaign metadata.
- New restart-loading scene (`gw_campaign_restart_loading`) to coordinate host start and viewer reconnect timing.
- Added campaign metadata into game-over client state so UI can determine host/viewer behavior.
- Added initial UI-side role-aware Continue War handling and viewer safeguards.

### Commit `7039a84`: reconnect reliability and callback lifecycle cleanup

Hardened state transitions and cleanup:

- Cleaned callback stacks in `gw_lobby` so creator/server/client disconnect hooks do not leak into later states.
- Reworked `shutdown()` in `gw_lobby` to call full state `exit()` instead of only popping one callback.
- Added connect-time content fallback for GW reconnects in `connect_to_game`.
- Added initial game_over menu filtering and reconnect-path adjustments.

### Commit `36ce3a4`: root cause fix for host-only live-game patch execution

Fixed the patch propagation bug where only host executed `live_game_patch`:

- Previously, merged `live_game.js + live_game_patch.js` was mounted only via `referee.localFiles()` (host-local mount).
- Reconnecting/remote clients restore from replay-config `files`, so they missed the patch.
- Fix: write patched live game script into `battleConfig.files['/ui/main/game/live_game/live_game.js']` as well.

This resolved several downstream symptoms at once:

- co-op clients now process restart packets through patched handler,
- co-op clients no longer show host-only econ/behavior anomalies tied to missing patch logic.

### Commit `d32e569`: remove implicit reconnect fallback and restore Save-and-Exit shutdown

This commit separated restart flow from normal exit flow:

- Added explicit host-disconnect shutdown handling in `game_over` for non-restart exits.
- Removed fallback reconnect-on-disconnect behavior from base `live_game` and `game_over` paths.
- Removed seed-from-game_over fallback in `live_game_patch`.
- Kept restart flow only when explicit restart intent was set.

Result:

- Save-and-Exit once again immediately closes server process.
- Host intentional exit no longer causes viewers to chase a nonexistent resumed session.

### Commit `cddd2ca`: final Continue War button visibility race fix

Addressed a UI ordering race where viewer role metadata could arrive after initial menu generation:

- Cached raw menu payload in `game_over`.
- Rebuilt menu buttons when role metadata arrives from `server_state`.
- Reapplied role filtering on each rebuild.

Result:

- co-op viewer no longer sees Continue War once role metadata is applied,
- host retains control over Continue War action.

### Commit `46206f1`: Continue War for defeated-in-playing (GWO FFA) cases

This commit extended the Continue War restart protocol to work even when the match never transitions to server `game_over`.

What changed:

- Added a host-only `gw_return_to_campaign_restart` handler in `playing.js`.
- Added `beginGwCampaignProcessRestart()` in `playing.js` so restart-prepare + delayed process shutdown can run from `playing` state.
- Added host-disconnect immediate shutdown in co-op GW `playing` state (outside explicit restart mode), so orphaned local battle servers do not linger.
- Added co-op campaign payload (`gw_campaign_active`, `gw_campaign_host_id`, `gw_campaign_role`, settings/access) to `playing.getClientState`, so clients receive role/intent metadata in ongoing matches.
- Updated `live_game_patch.menuReturnToWar` / menu logic to treat defeated-while-playing spectator contexts the same as game-over for Continue War visibility and action routing.

Why this mattered:

- In GWO FFA-style cases, the human side can be eliminated while AI factions keep fighting, so `game_over` never fires for the defeated clients.
- Continue War must still function there, which means restart orchestration and role metadata must exist in `playing`, not only `game_over`.

### Commit `43e243e`: role-driven Continue War filtering in both menu surfaces

This commit fixed a follow-up UI inconsistency where viewer filtering was correct in one panel but not the other.

What changed:

- `game_over.js`: made role/session usage explicit and updated role metadata handling before the `game_over`-only branch, so filtering still updates in defeated-while-playing flows.
- `live_game.js`: persisted `gwCampaignRole` in session and updated it from `server_state` client payload.
- `live_game_menu.js`: filtered Continue War by role and refreshed role from parent `live_game` model while applying menu state.
- `generate_mod.py`: added `ui/main/game/live_game/live_game_menu.js` to copy list so menu filtering changes are actually shipped in generated builds.

Why this mattered:

- Fixing only one panel left the other path stale because role propagation timing and panel data sources were different.
- Shipping pipeline coverage was part of the bug: if `live_game_menu.js` is not included in build copy lists, source fixes can look correct locally but never reach runtime.

### Practical lesson from this chain

For co-op GW Continue War, explicit orchestration beats inference:

1. Use explicit restart messages and role metadata.
2. Keep normal disconnect/exit paths simple and non-reconnecting.
3. Ensure any host-side runtime patch is propagated through replay-config file sources, not only local mounts.
4. Treat UI menu generation as eventually-consistent with role metadata and support rebuilds when authoritative state arrives.
5. If Continue War should exist in defeated-but-not-game-over contexts, implement role/restart logic in `playing` as first-class behavior, not as a `game_over` side effect.
6. For multi-panel UI fixes, verify both data flow and packaging flow (for example `generate_mod.py` copy list), otherwise one panel can remain unfixed at runtime.

---

## GW Required-Mod Enforcement and Optional-Mod Isolation (Commits `0adc233` and `d129a7a`, plus stabilization)

This section documents the full architecture that was added to solve issue #3 class failures:

- hard crashes when players had different client mod sets
- confusion about which mods should be mandatory
- reconnect instability introduced by manifest checks
- host/client disagreements about whether optional visual mods should affect shared GW generated files

The final model is:

1. Required GW-affecting client mods are enforced at connect/campaign/lobby boundaries.
2. Optional non-required client mods are isolated per client.
3. Shared GW battle files are generated from a required-only mod set.
4. Each client then overlays a local `.player` variant so optional local visuals can still work.

### Why this was needed

The original coop architecture synced GW generated memory files from host to clients. That guaranteed parity when everyone had the same setup, but it also caused two different failure classes:

1. If host generated files referenced assets from a client-only optional mod that a viewer did not have, the viewer could crash during battle (for example grenade ammo impact effects).
2. If we over-corrected by forcing everything to a clean shared build, host/client optional visual mods disappeared.

So the hard requirement became:

- enforce only the mods that are truly GW-affecting and must match,
- but keep optional client mods local.

### Major components created for this solution

This is the complete component list that makes the final design work.

#### Component A: Required-mod classifier in connect flow

File: [ui/main/game/connect_to_game/connect_to_game.js](ui/main/game/connect_to_game/connect_to_game.js)

What was created:

- Normalization helpers for identifiers.
- A required-mod classifier that marks a mounted client mod as required when:
  - it contains GW-critical scene keys (`gw_war_over`, `gw_play`, `gw_start`), and
  - its description indicates GW relevance (contains `galactic war`).

Why this exists:

- We needed a deterministic, host-side way to separate GW-affecting mods from optional cosmetics without introducing new mod metadata schema.

#### Component B: Host publication of required mod set

File: [ui/main/game/connect_to_game/connect_to_game.js](ui/main/game/connect_to_game/connect_to_game.js)

What was created:

- `publishRequiredClientMods()` in connect flow.
- Message `set_required_client_mods` carrying:
  - `required_identifiers`
  - `required_names_by_id`
- Session persistence of required identifiers (`gw_required_client_mod_identifiers`) for downstream GW generation decisions.

Why this exists:

- Server states must not guess required mods; host sends authoritative required set for this session.

#### Component C: Server-side required-mod state in campaign and GW lobby

Files:

- [server-script/states/gw_campaign.js](server-script/states/gw_campaign.js)
- [server-script/states/gw_lobby.js](server-script/states/gw_lobby.js)

What was created:

- Normalization and validation helpers.
- Stored required set and display names.
- Pending manifest timeout trackers.
- Pending self-disconnect fallback trackers.
- Per-client manifest receipt/validated state.

Why this exists:

- Both campaign and battle lobby needed identical enforcement semantics, including timeout cleanup on disconnect/exit.

#### Component D: Manifest protocol and enforcement messages

Files:

- [ui/main/game/connect_to_game/connect_to_game.js](ui/main/game/connect_to_game/connect_to_game.js)
- [server-script/states/gw_campaign.js](server-script/states/gw_campaign.js)
- [server-script/states/gw_lobby.js](server-script/states/gw_lobby.js)

What was created:

- `request_client_mod_manifest`
- `client_mod_manifest`
- `required_client_mods_missing`
- `all_client_mods_match`

Why this exists:

- We needed explicit request/response confirmation before entering sensitive GW scenes, and explicit positive completion to release client gating.

#### Component E: Notify-first rejection flow with safe fallback

Files:

- [server-script/states/gw_campaign.js](server-script/states/gw_campaign.js)
- [server-script/states/gw_lobby.js](server-script/states/gw_lobby.js)

What was created:

- On mismatch, server now notifies the client first (`required_client_mods_missing`) and waits for voluntary client disconnect.
- If client does not disconnect in time, server forces reject.

Why this exists:

- Immediate server-side reject races scene transitions and often loses user-facing reason context.

#### Component F: Client-side connect gate and rejection hardening

File: [ui/main/game/connect_to_game/connect_to_game.js](ui/main/game/connect_to_game/connect_to_game.js)

What was created:

- `waitingForClientModMatch` gate.
- Deferred `server_state` handling while waiting for manifest verdict.
- Centralized missing-mod rejection path that avoids retry loops.
- Reconnect-aware bypass of the gate where needed.

Why this exists:

- Prevents redirects/scene transitions before a definitive mod match/mismatch result is available.

#### Component G: Reconnect-aware timeout suppression

Files:

- [server-script/states/gw_campaign.js](server-script/states/gw_campaign.js)
- [server-script/states/gw_lobby.js](server-script/states/gw_lobby.js)

What was created:

- `clientManifestValidatedByClientId` tracking.
- reconnect/validated-client bypass in `requestClientManifest`.

Why this exists:

- Reconnect timing could trigger false manifest-timeout rejects even after prior successful validation.

#### Component H: Two-pass referee generation at launch

File: [ui/main/game/galactic_war/gw_play/gw_play.js](ui/main/game/galactic_war/gw_play/gw_play.js)

What was created:

- `runWithRequiredClientModsOnly(requiredIdentifiers, work)`
- `hireRefereesForLaunch(game, isolateSharedSpecs)`

Behavior:

1. Shared referee pass runs with required-only client mods enabled.
2. Local referee pass runs after restoring full local client mod set.
3. Shared files are used for server-visible config.
4. Local files are used for host-local overlay.

Why this exists:

- This is the core isolation mechanic that preserves mandatory consistency while retaining local optional behavior.

#### Component I: Per-client local overlay during GW lobby mount

File: [ui/main/game/galactic_war/gw_lobby/gw_lobby.js](ui/main/game/galactic_war/gw_lobby/gw_lobby.js)

What was created:

- `buildLocalClientOverlayFiles()` that regenerates local `.player` files using `GW.specs` + local inventory.
- Merge of local overlay files on top of server-shared `gw_config.files` before mount.
- `gwConfigMountInProgress` guard to prevent duplicate mount races.

Why this exists:

- Host-local overlay from `gw_play` alone is not enough; everyone passes through `gw_lobby` mount and would otherwise revert to shared-only files.

Important implementation detail:

- The final local overlay builder intentionally does not invoke `GWReferee` in `gw_lobby`, because that path can trigger community-mod scene hooks and deadlock startup.

### Problems faced and how they were overcome

#### Problem 1: Rejection reason lost during scene redirect

Observed behavior:

- Server rejection could happen while client was transitioning scenes.

Resolution:

- Added notify-first rejection + client-managed fail handling + server fallback timer.

#### Problem 2: Missed manifest verdict due to connect state races

Observed behavior:

- `server_state` could arrive before manifest verdict handling completed.

Resolution:

- Added connect gate (`waitingForClientModMatch`) and deferred server-state processing until `all_client_mods_match` or manifest success.

#### Problem 3: Reconnect loops due to manifest timeout

Observed behavior:

- reconnect clients could hit manifest timeout and then churn through reconnect/game-in-progress loops.

Resolution:

- Added reconnect/validated-client bypass in campaign and gw_lobby manifest request path.

#### Problem 4: Shared file contamination by optional host mods

Observed behavior:

- host-only optional client mods leaked into shared generated files and crashed clients lacking those assets.

Resolution:

- Introduced two-pass generation with required-only shared cook and separate local cook.

#### Problem 5: Host local effects disappearing

Observed behavior:

- host local visuals were overwritten by shared gw_config remount in gw_lobby.

Resolution:

- Added per-client overlay in gw_lobby so each client reapplies local `.player` variant before final mount.

#### Problem 6: Startup deadlock while waiting for gw_config_ready

Observed behavior:

- repeated `request_gw_config` and server "Waiting for all clients to mount GW config before start".
- host logs showed `CommunityModsManager is not defined` from gw_referee community-mod state path.

Resolution:

- Removed gw_lobby dependency on `GWReferee` for local overlay generation.
- Reimplemented local overlay with direct `GW.specs` pipeline and local inventory.

### End-to-end final flow (what runs now)

1. Host enters connect flow and publishes required GW-affecting mod set.
2. Campaign/lobby states store required set and request manifests from non-host clients.
3. Clients send normalized active manifest from mounted client mods.
4. On mismatch, client receives explicit reason and self-fails; on match, server sends `all_client_mods_match`.
5. During co-op host fight launch:
  - shared referee cook runs with required-only mod set,
  - local referee cook runs with full local mod set.
6. Server-visible `gw_config.files` come from shared cook.
7. In gw_lobby, each client builds local `.player` overlay and merges it over shared files.
8. Mounted result is:
  - shared-safe baseline for all required content,
  - local optional overlays per client.

### Final notes on these changes

#### Tradeoffs

1. More moving parts across scenes (`connect_to_game`, `gw_play`, `gw_lobby`, campaign/lobby server states).
2. Increased coupling to CommunityMods behavior and mount timing semantics.
3. Additional per-client generation cost in gw_lobby startup path.

#### Residual risks to monitor

1. Future community-mod hook changes that alter mount timing assumptions.
2. Any new GW scene override that bypasses this documented flow and writes directly to shared config files.

### Guidance for future contributors

If you change this area, verify all four invariants:

1. Missing required GW-affecting mods are rejected with a clear reason.
2. Optional client mods do not contaminate shared files.
3. Host still sees host-local optional visuals.
4. Viewer still sees viewer-local optional visuals without startup deadlock.

Recommended files to inspect first:

- [ui/main/game/connect_to_game/connect_to_game.js](ui/main/game/connect_to_game/connect_to_game.js)
- [server-script/states/gw_campaign.js](server-script/states/gw_campaign.js)
- [server-script/states/gw_lobby.js](server-script/states/gw_lobby.js)
- [ui/main/game/galactic_war/gw_play/gw_play.js](ui/main/game/galactic_war/gw_play/gw_play.js)
- [ui/main/game/galactic_war/gw_lobby/gw_lobby.js](ui/main/game/galactic_war/gw_lobby/gw_lobby.js)
- [ui/main/game/galactic_war/shared/gw_specs.js](ui/main/game/galactic_war/shared/gw_specs.js)
- [generate_mod.py](generate_mod.py)

---

## UI/UX Improvements and Co-op Setup Hardening (Commits `3e6ea25` through `1bb752a`)

This branch continued the same design philosophy as the required-mod work: the host remains authoritative for campaign state, but clients should get clear UI feedback, stable local mounts, and enough local freedom to inspect the campaign map without accidentally mutating the save.

The major themes were:

1. make required-mod failures understandable,
2. make skin/local overlay behavior consistent in lobby and reconnect flows,
3. make campaign joining visibly staged instead of hoping clients enter `gw_play` with usable state,
4. let saves carry co-op setup intent,
5. scale generated GW difficulty from that setup intent,
6. treat star selection as local UI state while keeping campaign actions host-only.

### Required-Mod Warning Gates (`3e6ea25`)

The older missing-required-mod flow depended mostly on connection rejection text. That was fragile because a rejection could race against a scene transition and leave the player with a generic failure or a retry loop.

This commit introduced an explicit required-client-mod gate in three places:

- [ui/main/game/connect_to_game/connect_to_game.js](ui/main/game/connect_to_game/connect_to_game.js)
- [ui/main/game/galactic_war/gw_play/gw_play.js](ui/main/game/galactic_war/gw_play/gw_play.js)
- [ui/main/game/galactic_war/gw_lobby/gw_lobby.js](ui/main/game/galactic_war/gw_lobby/gw_lobby.js)

The client now normalizes missing-mod payloads through helper functions such as `getPayloadObject`, `isMissingRequiredModsPayload`, and `getMissingRequiredModLabels`. This lets the same UI understand both direct responses and nested message payloads.

On the server side, [server-script/states/gw_campaign.js](server-script/states/gw_campaign.js) and [server-script/states/gw_lobby.js](server-script/states/gw_lobby.js) began returning richer rejection payloads:

- `missing`
- `missing_identifiers`
- `required_identifiers`
- `required_names_by_id`
- `requires_acknowledgement`

The client displays the missing mod names, stops normal connect progress, and waits for the player to acknowledge. Acknowledgement sends `required_client_mods_acknowledged`, which lets the server clear its pending self-disconnect timeout. Backing out from the gate deliberately disconnects and routes through the normal failure/transit path.

Important practical detail:

- The manifest wait gate no longer special-cases reconnect by default. Instead, server state is held until either the required-mod gate is dismissed or the mod match succeeds. This prevents a client from being redirected deeper into GW before the mod verdict arrives.

### Skin Mods, Tagged Unit Lists, and Local Overlays (`df48a7d`, `5b5565e`, `93cd35e`, `aefc22c`, `6c7308b`)

These commits refined the optional-client-mod isolation model described above. The important realization was that generated GW files are not limited to `.player` and `.ai` tags. Mods can create arbitrary tagged unit lists, and local skin/effect overlays need to preserve those tags instead of rebuilding only a hard-coded pair.

The local overlay builder in [ui/main/game/galactic_war/gw_lobby/gw_lobby.js](ui/main/game/galactic_war/gw_lobby/gw_lobby.js) now does the following:

1. Discovers every tagged unit list under `/pa/units/unit_list.json*`.
2. Parses stringified file values when necessary.
3. Strips each tag suffix from unit specs before regenerating tagged files.
4. Synthesizes an untagged `/pa/units/unit_list.json` from all discovered tagged lists if the shared payload did not include one.
5. Regenerates local files for every discovered non-player tag.
6. Regenerates `.player` from the shared `.player` unit list when present, otherwise from the local GW inventory.
7. Applies the local inventory mods to the local `.player` files.
8. Merges the local overlay over the shared host files before mounting.

This solved several adjacent problems:

- Vanilla PA skin mods now affect AI-tagged GW units, not only player-tagged units.
- Arbitrary mod-created tags can survive the local overlay pass.
- Missing untagged unit lists are synthesized consistently.
- The logs are less noisy because discovered tag summaries and generated file counts are logged instead of dumping huge file maps.
- If `GW.specs.modSpecs` fails while applying local player inventory mods, the code now still resolves with the generated player files. This keeps local skin mods working even when a tech card targets a file that is not present in the locally generated overlay.

The reconnect path in [ui/main/game/gw_reconnect_loading/gw_reconnect_loading.js](ui/main/game/gw_reconnect_loading/gw_reconnect_loading.js) was then updated to mirror the lobby overlay behavior. Reconnect used to remount the server's replay-config files and enter `live_game`. Now it also builds the local overlay, merges it, mounts the merged file set, calls `api.game.setUnitSpecTag('.player')`, refreshes spec data, and only then enters the live game.

The shared `GW.specs.modSpecs` helper in both `ui/main/game/galactic_war/shared/gw_specs.js` and `ui/main/game/galactic_war/shared/js/gw_specs.js` also gained clearer logging for skipped or invalid mod paths. The function now preserves the original path array instead of mutating it with `reverse()`, and logs the traversed path, remaining path, spec tag, and available file count. This matters because GW card mods often fail because the generated unit universe does not contain the target file, and the old log output was too opaque to diagnose.

### Camera State Is Local (`b70db88`)

Earlier campaign snapshots included the host's galaxy `stageOffset` and `zoom`. That made viewers' cameras jump to the host's camera position whenever a snapshot applied.

This commit removed camera offset and zoom from the snapshot payload and from snapshot application. Selection was still synchronized at this point, but camera framing became local to each client.

This was the first step toward the later rule:

- campaign state is shared,
- camera and viewing context are local UI state.

### Campaign Lobby Loading Indicators (`61b56f8`)

The campaign lobby can show connected clients before those clients have fully loaded into the GW map. Without an indicator, a host could think a viewer was ready when they were still entering the scene.

This commit added server-side client loading tracking in [server-script/states/gw_campaign.js](server-script/states/gw_campaign.js):

- `clientLoading` stores loading state by client id,
- new clients begin as loading,
- disconnected clients are removed from the loading map,
- `set_loading` lets a client report loading completion,
- `connected_clients` entries include `loading`.

On the UI side, [ui/main/game/galactic_war/gw_play/gw_play.js](ui/main/game/galactic_war/gw_play/gw_play.js) maps that field into `gwCampaignSlots`, and [ui/main/game/galactic_war/gw_play/gw_play.html](ui/main/game/galactic_war/gw_play/gw_play.html) displays a small `working.svg` spinner with a "Loading into lobby" tooltip. `gw_play` calls `reportGwCampaignLoading(false)` after startup reaches the map.

Later, `setClientLoading` was tightened so it only broadcasts control updates when the loading value actually changes. That avoids repeated control churn from duplicate loading reports.

### Full Lobby Rejection (`61806ca`)

The campaign server now rejects clients when the campaign lobby is full instead of letting them join if they somehow make a direct connection to the server (like with the connect buttons mod).

The key server helper is `hasRoomForClient(client)` in [server-script/states/gw_campaign.js](server-script/states/gw_campaign.js). It counts connected clients other than the incoming client and compares that count against `maxClients`.

This is intentionally simpler than a reconnect-aware live-game slot model. `gw_campaign` is still a lobby-like state, so the host can add or remove slots there. If a returning viewer cannot fit, the host can make room explicitly.

### Stale Campaign Handlers (`6ca9bdc`)

This commit fixed a nasty reconnect trap caused by stale `gw_campaign` handlers after the server had already moved on to another state.

The campaign model now has an `active` flag:

- set `true` in `enter`,
- checked before processing late connections or lifecycle setup,
- set `false` in `exit`.

`exit` also uses a safer `server.onConnect.pop` check before removing its connect hook. The purpose is to prevent old campaign callbacks from handling late connections after the session has transitioned into `gw_lobby`, `playing`, or another state. Without this, reconnecting clients could be pulled back toward stale campaign behavior and get stuck.

### Campaign Map Loading Scene (`6fa9066`)

Before this branch, viewers could be redirected into `gw_play` before they had an authoritative campaign save. That was especially risky when the local client had no matching save or had stale data from an older session.

This commit added a dedicated scene:

- [ui/main/game/gw_campaign_loading/gw_campaign_loading.html](ui/main/game/gw_campaign_loading/gw_campaign_loading.html)
- [ui/main/game/gw_campaign_loading/gw_campaign_loading.css](ui/main/game/gw_campaign_loading/gw_campaign_loading.css)
- [ui/main/game/gw_campaign_loading/gw_campaign_loading.js](ui/main/game/gw_campaign_loading/gw_campaign_loading.js)

[ui/main/game/connect_to_game/connect_to_game.js](ui/main/game/connect_to_game/connect_to_game.js) now detects `gw_campaign` server state. Hosts are allowed to enter directly after marking their current active GW save as authoritative in session storage. Viewers are routed to `gw_campaign_loading` with the intended `gw_play` target URL.

The loading scene:

1. tracks the client's campaign role,
2. requests `request_gw_campaign_snapshot` when acting as a viewer,
3. retries snapshot requests while waiting,
4. saves the received authoritative `GW.Game`,
5. writes `gw_active_game`,
6. records `gw_campaign_authoritative_game_id`,
7. then enters `gw_play`.

This makes the viewer entry flow explicit: a viewer should not trust local campaign state until the host snapshot has been saved and marked authoritative.

To support this, [server-script/states/gw_campaign.js](server-script/states/gw_campaign.js) exports `getClientState(client)` so the main server hello path can include role information early enough for the loading scene to make decisions.

### More Obvious Open-to-Co-op Entry (`43e06fa`)

This commit added a prominent "Call for Reinforcements!" prompt to the GW map. The old menu item still existed, but the prompt makes the co-op path much harder to miss.

The implementation is intentionally local UI state:

- `canOpenCoopSession` already knows whether the current save can open co-op.
- `openCoopPromptDismissed` lets the player close the prompt.
- `showOpenCoopPrompt` is true when co-op can be opened and the prompt has not been dismissed.
- Clicking the prompt calls the existing `openToCoop`.

The assets `bground_alert_rest_coop.png`, `bground_alert_hover_coop.png`, and `bground_alert_active_coop.png` provide the prompt frame states, with styling in [ui/main/game/galactic_war/gw_play/gw_play.css](ui/main/game/galactic_war/gw_play/gw_play.css).

They were created by the newly added python utility script `recolor.py` which took in the alert pictures for catalyst and halley readiness and recolored them using a gradient and color map.

### Save-Based Co-op Slot Count and Slot Locking (`8348619`)

This commit added a save-level co-op setup contract.

New fields in [ui/main/game/galactic_war/shared/js/gw_game.js](ui/main/game/galactic_war/shared/js/gw_game.js):

- `coopPlayers`
- `coopPlayersSpecified`
- `lockCoopPlayers`

These are persisted through `load` and `save`. The distinction between `coopPlayers` and `coopPlayersSpecified` is intentional:

- `coopPlayers` is the numeric value,
- `coopPlayersSpecified` means the player actually typed a value in the setup field.

That distinction preserves legacy behavior. A blank setup field can still allow the old default "open to co-op with two slots" behavior, while difficulty scaling and explicit slot setup can treat blank as "no explicit co-op player-count intent."

The start screen in [ui/main/game/galactic_war/gw_start/gw_start.html](ui/main/game/galactic_war/gw_start/gw_start.html), [ui/main/game/galactic_war/gw_start/gw_start.css](ui/main/game/galactic_war/gw_start/gw_start.css), and [ui/main/game/galactic_war/gw_start/gw_start.js](ui/main/game/galactic_war/gw_start/gw_start.js) gained:

- a number input for the intended number of co-op slots,
- a checkbox for locking the number of slots,
- tooltip text matching the existing GW setup style,
- `normalizedNewGameCoopPlayers`,
- `newGameCoopPlayersSpecified`,
- regeneration when these setup values change.

When a vanilla GW save is created, the new fields are copied into the `GW.Game`.

The campaign lobby side then applies those saved settings in [ui/main/game/galactic_war/gw_play/gw_play.js](ui/main/game/galactic_war/gw_play/gw_play.js):

- `savedCoopPlayers`
- `savedCoopPlayersSpecified`
- `savedCoopPlayersLocked`
- `buildCampaignLobbySettingsPayload`
- `applySavedCoopSettingsToCampaignLobby`

`applySavedCoopSettingsToCampaignLobby` runs only for the host, only once per campaign session, and only after the campaign connection exists. If neither a player count nor a lock was specified, it marks itself applied and leaves legacy behavior alone.

On the server side, [server-script/states/gw_campaign.js](server-script/states/gw_campaign.js) gained:

- `baseMaxClientsLimit`, sourced from the process/local-server max player limit,
- `maxClientsLimit`, which can be reduced by a save lock,
- `maxClientsLocked`,
- `max_clients_locked` and `max_clients_limit` in control/settings responses.

When the host sends `max_clients_locked`, the server clamps the requested save-based limit against the base server limit. The effective maximum becomes the save's locked maximum, bounded by the server's own configured maximum. The live `maxClients` value is then clamped to the effective limit and copied to `server.maxClients`.

Important modder contract:

- Mods that replace GW creation must set the new `GW.Game` fields themselves before saving. The base game should not silently patch mod-created saves after the fact.

### Co-op Difficulty Scaling (`877149e`)

Difficulty scaling is applied at war generation time in [ui/main/game/galactic_war/gw_start/gw_start.js](ui/main/game/galactic_war/gw_start/gw_start.js), inside the existing AI difficulty ramping block.

The code reads:

```js
var coopPlayers = game.coopPlayersSpecified() ? game.coopPlayers() : 1;
```

That means explicit co-op setup affects generated difficulty, while a blank field keeps solo difficulty scaling even though old co-op slot defaults can still be used later.

AI economy scaling uses:

- `AI_ECON_PER_PLAYER`
- `MAX_AI_ECON_PLAYER_SCALING`

The multiplier is:

```js
1 + ((coopPlayers - 1) * AI_ECON_PER_PLAYER)
```

clamped by `MAX_AI_ECON_PLAYER_SCALING`, then applied to each AI's `econ_rate` after the normal GW distance/difficulty value is computed.

Enemy minion scaling uses:

- `AI_ADDITIONAL_PLAYERS_FOR_MINION`
- `AI_EXTRA_MINIONS_FROM_COOP_SCALING`
- `AI_EXTRA_MINION_DISTANCE_SCALING`
- `MAX_AI_EXTRA_MINIONS_FROM_COOP_SCALING`

The first part is a flat co-op pressure bonus:

```js
Math.floor((coopPlayers - 1) / AI_ADDITIONAL_PLAYERS_FOR_MINION)
    * AI_EXTRA_MINIONS_FROM_COOP_SCALING
```

The second part multiplies that flat bonus by the system's relative distance from the start:

```js
numMinionsToAdd += Math.floor(numMinionsToAdd * distRatio * AI_EXTRA_MINION_DISTANCE_SCALING);
```

This preserves an immediate co-op difficulty bump while still making deeper systems harder instead of plateauing at the same bonus everywhere.

### Independent Viewer Selection and Hover (`35de697`)

Originally the host's selected and hovered star were treated as shared UI state:

- snapshots carried `selectedStar` and `hoverStar`,
- viewers applied those snapshot values,
- host clicks sent `select_star`,
- viewer `canSelect` returned false outside replayed host actions.

That made co-op viewers feel locked to the host's inspection target. It also confused the conceptual model, because selecting a star is not the same thing as moving to that star.

This commit made star selection local:

- snapshots no longer include `selectedStar` or `hoverStar`,
- snapshot application no longer changes the viewer's selection or hover,
- `select_star` replay was removed,
- host clicks no longer send `select_star`,
- viewers are allowed through `canSelect` so they can click visible/reachable systems for inspection.

Movement and campaign actions remain host-authoritative:

- `canMove` still blocks viewers outside replayed host actions,
- `canFight` still blocks viewers,
- `canExplore` still blocks viewers,
- card decisions and battle launch still flow through the existing host action/snapshot system.

The result is that every player can inspect the map independently, while only the host can mutate campaign state.

### Co-op Prompt Tooltip, Viewer Action Button Hiding, and Fresh Host Snapshot Joining (`1bb752a`)

This commit fixed two follow-up UI issues from the independent viewer selection work, and then tightened the loading gate so stale campaign saves cannot be accepted on viewer join.

The first small UX change is on the "Call for Reinforcements!" prompt. The visible prompt button in [ui/main/game/galactic_war/gw_play/gw_play.html](ui/main/game/galactic_war/gw_play/gw_play.html) now has a tooltip:

```text
Launch campaign cooperative session
```

That makes the prompt's purpose clearer without adding more permanent text to the GW map header.

The second fix handles a visual-only bug caused by local viewer selection. After viewers were allowed to select and hover their own stars, they could select a star where the old action-button bindings wanted to show Jump, Fight, Explore, or Load Save. Server-side and client-side action guards still blocked the actual action, but the button could appear under the selected star and imply that the viewer was allowed to act.

The fix adds `canShowCampaignActionButtons` in [ui/main/game/galactic_war/gw_play/gw_play.js](ui/main/game/galactic_war/gw_play/gw_play.js):

```js
return !self.gwCampaignEnabled() || self.isCampaignHost() || self.gwCampaignReplayingAction;
```

That computed value is used in two layers:

- [ui/main/game/galactic_war/gw_play/gw_play.html](ui/main/game/galactic_war/gw_play/gw_play.html) hides the selected-system action cluster for campaign viewers.
- `displayMove`, `displayFight`, `displayLoadSave`, and `displayExplore` also check `canShowCampaignActionButtons()`.

The `gwCampaignReplayingAction` exception is important because viewers still need replayed host actions to run through existing movement/fight/explore code paths internally. The UI is hidden during normal viewer inspection, but host-authored replay remains allowed.

The larger synchronization fix is in the initial campaign loading path. The loading scene from `6fa9066` was correct in principle: viewers should not enter `gw_play` until a host-authored campaign snapshot has been saved locally and marked authoritative. However, the server still had two stale-state escape hatches:

- `attachClientLifecycle` sent the server's cached `lastSnapshot` to a joining/reconnecting viewer.
- `request_gw_campaign_snapshot` also sent cached `lastSnapshot` directly.

That meant a viewer could rejoin after the host had moved while alone, receive the old cached snapshot, save it, and enter `gw_play` at the wrong current star. The viewer's local save was not the real problem; the server was allowing an old cached snapshot to masquerade as the host's current state.

The new rule is stricter:

- For viewer join/reconnect, [server-script/states/gw_campaign.js](server-script/states/gw_campaign.js) no longer sends cached snapshots at all.
- `request_gw_campaign_snapshot` no longer serves `lastSnapshot` to viewers.
- The server instead sends `request_gw_campaign_snapshot_publish` to the live host through `requestSnapshotFromHost`.
- The host handles `request_gw_campaign_snapshot_publish` in `gw_play.js` and calls `sendCampaignSnapshot(reason, true)`.
- The new `force` argument lets that host snapshot bypass the normal cooldown and "only send when a viewer is already visible in control state" guard.

The intended architecture is now explicit: on initial campaign load, a viewer disregards their prior local save and waits for the host's live `GW.Game` state. If the host cannot publish a fresh snapshot, the viewer stays in the loading/retry flow instead of accepting undefined or stale server state.

### Practical Lessons From This Branch

1. Treat user-facing failure states as scenes or gates, not as incidental rejection strings.
2. Distinguish authoritative campaign state from local UI state. Saves, current star, cards, AI ownership, and battle results are shared. Camera, hover, and selected inspection target are local.
3. When mounting GW generated files, assume there may be more than `.player` and `.ai` tags.
4. Reconnect and lobby entry need the same local overlay behavior, otherwise optional local mods will behave differently depending on how the client entered the match.
5. Save-level co-op settings are part of the GW save contract. Mods that replace save creation need to populate those fields explicitly.
6. Never let a viewer enter `gw_play` believing stale local campaign data is authoritative. Gate viewer entry until a fresh host snapshot has been saved and marked authoritative; cached server snapshots are not authoritative for initial viewer load.
7. Keep campaign server state guarded with active/inactive lifecycle flags. Late callbacks after a state transition are a real reconnect hazard.

---

## Unshared Play (Commit `515e287`)

### Implemented unshared play. (`515e287`)

This commit added a second battle-control mode for co-op Galactic War. Before this point, co-op always meant that every connected human client was inserted into the same `.player` army and shared control of that army. Unshared play keeps the same campaign state and the same generated `.player` unit universe, but splits connected humans into separate allied armies at battle launch.

The save-level default is stored on `GW.Game` in [ui/main/game/galactic_war/shared/js/gw_game.js](ui/main/game/galactic_war/shared/js/gw_game.js):

- `sharedByDefault` is a persisted boolean.
- Missing legacy saves default to `true`, preserving the original shared-army behavior.
- New game creation exposes this as the "Share control by default" checkbox in [ui/main/game/galactic_war/gw_start/gw_start.html](ui/main/game/galactic_war/gw_start/gw_start.html) and writes the value in [ui/main/game/galactic_war/gw_start/gw_start.js](ui/main/game/galactic_war/gw_start/gw_start.js).

This is intentionally only a default. The campaign lobby carries the live per-battle value as `shared_control` so players can change their mind from one fight to the next without editing the save. On the UI side, [ui/main/game/galactic_war/gw_play/gw_play.js](ui/main/game/galactic_war/gw_play/gw_play.js) adds `gwCampaignSharedControl`, includes it in `buildCampaignLobbySettingsPayload`, applies it from `gw_campaign_control`, and sends it with the battle launch payload. The host-facing control is the "Share Army" toggle in the host slot row in [ui/main/game/galactic_war/gw_play/gw_play.html](ui/main/game/galactic_war/gw_play/gw_play.html), styled by [ui/main/game/galactic_war/gw_play/gw_play.css](ui/main/game/galactic_war/gw_play/gw_play.css).

On the campaign server, [server-script/states/gw_campaign.js](server-script/states/gw_campaign.js) stores `self.sharedControl`, echoes it in control messages, accepts it through `modify_settings`, and includes it in the launch context passed to `gw_lobby`. The Continue War path also preserves the value through [ui/main/game/galactic_war/gw_play/live_game_patch.js](ui/main/game/galactic_war/gw_play/live_game_patch.js), so a restarted campaign lobby reopens with the same army-control setting.

The actual shared-versus-unshared split happens in [server-script/states/gw_lobby.js](server-script/states/gw_lobby.js), immediately before the server enters `landing`. `startGame()` reads `shared_control` from the battle config or launch context. If it is true, the old behavior remains: all connected human clients are mapped into the existing human army slots. If it is false, `normalizeHumanArmiesForSharedControl(config, connectedClients)` rewrites `config.armies`.

The unshared normalization does the following:

1. Verifies that the config has armies and that connected clients exist.
2. Finds the single non-AI army, which is the normal GW human army template.
3. Refuses to perform the unshared rewrite if there is not exactly one human army, because multiple human armies would indicate a broken GW battle shape rather than a case to silently patch over.
4. Uses the first slot from that human army as the base player slot. PA does not support human players sharing armies with AIs, so there is no need to search for a non-AI slot inside a known-human army.
5. Creates one new army per connected client.
6. Deep-clones the base slot, removes stale `client`, `ai`, and `name` fields, and leaves final client/name assignment to the existing `startGame()` slot-mapping pass.
7. Preserves the template army's `econ_rate`, `spec_tag`, and `alliance_group` so every split player army remains a GW player-side army and stays allied with the others.
8. Replaces the original human army with the generated split armies while preserving the existing AI armies.

The slot-mapping pass after normalization is still important. It assigns the actual connected client objects and display names into whichever human slots exist after the army shape has been finalized. That shared assignment path fixes both modes: shared control gets multiple clients in one army, while unshared control gets one client per newly split army.

Player colors are handled without introducing new unit specs or commander specs. The host army keeps the original faction color pair exactly. Additional player armies derive their primary and secondary RGB colors from the same faction color pair, with each channel randomized within `PLAYER_COLOR_VARIATION_RANGE` and clamped to the valid `0` through `255` RGB range. This makes unshared co-op players visually distinct while still reading as variants of the campaign faction.

All human players still use the same generated `.player` spec tag. That is why unshared play does not need to create or distribute extra commander/unit specs: the split is at the army/control layer, not at the generated-file layer.

Defeat handling also needed to distinguish host defeat from co-op player defeat. In [server-script/states/playing.js](server-script/states/playing.js), `isGwCampaignHostArmy` checks whether a defeated human army contains the campaign host client. In normal Galactic War, a human defeat kills all allied AI subcommanders. In co-op Galactic War, that cleanup only cascades from the host army. If a non-host unshared co-op player dies, only that player's army is defeated; the host, other co-op players, and allied AI subcommanders are left alone. If the host army dies, allied co-op humans and AI subcommanders are defeated as well, preserving the campaign rule that the host commander's death means game over.

### Practical Lesson From This Branch

1. Prefer explicit invariant checks over quiet fallback behavior when normalizing GW battle config. A broken army shape should be logged and stopped at the relevant operation, not converted into a mysterious partially working launch.

---

## Per-Player Tech Cards

Per-player tech cards extend unshared co-op from "separate allied armies using one shared `.player` tech universe" into "separate allied armies where each human can have a different Galactic War inventory." The core technical problem is that Galactic War tech cards are not applied directly to live units. They are applied when `GW.specs.genUnitSpecs` and `GW.specs.modSpecs` generate tagged virtual files before battle launch.

Shared and unshared co-op could use one player-side generated namespace:

- `.player`

Per-player tech needs one namespace per human player:

- host: `.player`
- first joining player: `.player0`
- second joining player: `.player1`
- later players: `.player2`, `.player3`, and so on

The first phase of the branch established the battle-launch architecture needed to make that possible. It moved co-op army preparation out of the server lobby and into client-side referee modules, then taught the battle config, mounted files, lobby assignment, and live-game UI to carry the correct player tag for each connected client.

### Per-Player Tech Forces Unshared Control (`573cdd5`)

Per-player tech cards cannot yet work in a shared army well. PA assigns one `spec_tag` per army, so two players sharing the same army have a hard time simultaneously using different versions of the same unit. If one player has flame Dox and another has vanilla Dox, those two Dox definitions require two different generated spec namespaces.

This commit made that invariant explicit:

- If `per_player_tech_cards` is true, `shared_control` is treated as false.
- The campaign server reports `shared_control` through `effectiveSharedControl()`, so clients see the effective value rather than a stale stored preference.
- `modify_settings` refuses to keep shared control enabled once per-player tech is on.
- The campaign lobby UI disables the "Share Army" toggle when per-player tech is active.
- New game creation disables "Share control by default" while per-player tech is checked and saves `sharedByDefault(false)` for per-player-tech games.
- Battle launch and Continue War restart metadata also force `shared_control: false` whenever `per_player_tech_cards` is true.

This is not just UI convenience. It protects the battle config from an impossible state. A per-player tech game must have separate human armies before it can assign separate tags.

### Co-op Battle Config Preparation Moves Into Referees (`9e42412`)

Before this branch, the server-side `gw_lobby` state was responsible for reshaping the GW battle config for unshared play. That worked for basic unshared armies, but it put gameplay-specific config generation in the wrong place.

The server lobby does not generate Galactic War unit specs. It should assign connected server clients to already-prepared human slots and then hand the config to landing. Per-player tech needs to generate additional memory files and mutate army `spec_tag` fields before the server assigns real clients. That work naturally belongs beside `GWReferee.hire`, where the `.player` and `.ai` file trees already exist.

This commit introduced two launch-time referee modules:

- [ui/main/game/galactic_war/gw_play/gw_coop_referee.js](ui/main/game/galactic_war/gw_play/gw_coop_referee.js)
- [ui/main/game/galactic_war/gw_play/gw_per_player_tech_referee.js](ui/main/game/galactic_war/gw_play/gw_per_player_tech_referee.js)

`gw_coop_referee` took over the army/slot preparation that had lived in [server-script/states/gw_lobby.js](server-script/states/gw_lobby.js):

- shared control: ensure the single human army has enough human slots for all connected clients,
- unshared control: split the one human army into one allied army per connected client,
- preserve player-side `spec_tag`, `econ_rate`, and `alliance_group`,
- randomize additional player army colors near the faction color,
- write `coop_human_armies_ready` so launch can fail clearly if preparation failed.

`gw_per_player_tech_referee` started as a shell, deliberately returning success without changing files yet. The important architecture was the sequencing in [ui/main/game/galactic_war/gw_play/gw_play.js](ui/main/game/galactic_war/gw_play/gw_play.js):

1. Hire the normal GW referee.
2. Build launch options from campaign state.
3. Apply `GWCoopReferee`.
4. Apply `GWPerPlayerTechReferee`.
5. Only then mount files, tag the game, and connect to the battle.

The server lobby was also hardened. Instead of quietly manufacturing missing slots, it now validates that the referee prepared enough human slots and enough human armies. That follows the repo's later rule: broken state should fail with a useful log, not limp into a mysterious partial battle.

`generate_mod.py` was updated to include both new referee files.

### Indentation Cleanup After Referee Sequencing (`3ba9c65`)

This commit was a formatting-only cleanup in [ui/main/game/galactic_war/gw_play/gw_play.js](ui/main/game/galactic_war/gw_play/gw_play.js). It fixed indentation around the newly introduced referee launch flow.

The intended behavior did not change. The value of the commit is practical: launch sequencing in this area is easy to misread because it mixes asynchronous referee generation, local file overlay setup, `stripSystems`, memory-file mounting, and navigation to `connect_to_game`. Keeping the indentation honest makes later changes safer to review.

### Per-Player Tech Referee Assigns Player Tags (`5e14025`)

This commit gave `gw_per_player_tech_referee` its first real job: assign each human army a distinct player tag.

The tag contract is:

```js
index 0 -> '.player'
index 1 -> '.player0'
index 2 -> '.player1'
index 3 -> '.player2'
```

The host keeps `.player` because the base GW referee already generated and modified that namespace. Joining players get numbered tags. The per-player tech referee validates the config before mutating it:

- the battle config must have armies,
- the launch must be active co-op,
- per-player tech must be enabled,
- shared control must already be false,
- connected player count must match human army count,
- referee files, game, inventory, and player commander must exist.

At this stage the referee only changed `army.spec_tag` and recorded:

- `per_player_tech_ready`
- `per_player_tech_tags`

It did not yet cook separate files for `.player0`, `.player1`, etc. That meant this commit established the tag ownership model but did not fully make those tags usable.

The same commit also added broad in-file documentation to `gw_per_player_tech_referee.js` describing the implicit battle config shape. That documentation matters because per-player tech touches `config.files`, `config.armies`, `config.player`, later `config.players`, and server-side slot assignment. Without a formal schema, the branch needed an explicit written contract near the code doing the mutation.

### Per-Player Tech Referee Cooks `.playerN` Specs (`5719b1c`)

After army tags existed, the next problem was that `.player0` and `.player1` had no mounted files behind them. An army can point at `.player0`, but the sim and UI can only use it if `/pa/units/...json.player0`, `/pa/units/unit_list.json.player0`, and the matching AI unit-map files exist.

This commit added `generateUnitSpecsForPlayer(inventory, playerTag)` to `gw_per_player_tech_referee`:

- load base AI unit maps,
- generate tagged AI maps for the player tag,
- call `GW.specs.genUnitSpecs(inventory.units(), playerTag)`,
- apply `GW.specs.modSpecs(playerFiles, inventory.mods(), playerTag)`,
- merge the generated files into `referee.files()` and `config.files`.

At this early point every player tag was generated from the host inventory. That was still enough to prove the file/tag plumbing, but not yet enough for truly separate inventories. Later commits replace that shortcut with each viewer's own stored inventory.

The commit also set each human army commander to the matching tag by stripping `.player` from the base commander and appending the new player tag. This was necessary because the commander spec has to live in the same namespace as that army's `spec_tag`.

On the server side, [server-script/states/gw_lobby.js](server-script/states/gw_lobby.js) changed its human slot collection from raw slots to `{ slot, army }` entries. That let the lobby create each connected client's player config from the army it was actually assigned to. Human commander spawning reads from `config.players[client.id].commander`, so army-level commander changes are not enough by themselves; the client-specific `players` map has to agree.

### Clients Receive And Use Their Own Unit Spec Tag (`42cd816`)

With `.playerN` files generated, each client still needed to enter the battle using the tag assigned to its human army. Before this point, GW co-op clients generally assumed `.player`.

This commit added a deterministic client order in [server-script/states/gw_lobby.js](server-script/states/gw_lobby.js):

- host first,
- then other connected clients.

The same order is used for:

- assigning clients to human slots in `startGame`,
- deciding which human army belongs to a target client,
- sending each client its `unit_spec_tag` in the `gw_config` message.

On the client side:

- [ui/main/game/galactic_war/gw_lobby/gw_lobby.js](ui/main/game/galactic_war/gw_lobby/gw_lobby.js) stores the received tag in `gw_campaign_unit_spec_tag` and calls `api.game.setUnitSpecTag(unitSpecTag)` after mounting memory files.
- reconnect loading reads the same session value and restores that tag when mounting memory files.
- [ui/main/game/live_game/live_game.js](ui/main/game/live_game/live_game.js) stops unconditionally resetting GW co-op clients to `.player` and instead uses the saved campaign unit tag during memory-file restore.

This is the commit where "co-op player can build with `.playerN` tagged units" becomes true for the normal entry path. The generated files existed, the army had the tag, and the client UI/sim lookup tag matched.

The commit message also recorded a known gap: reconnect could still break the co-op player's ability to build. That is expected at this stage because reconnect had only a partial version of the tag restoration and memory-file regeneration story.

### Upstream Build 124640 Integration (`b5c6318`)

This commit imported PA build `124640` changes while the per-player tech branch was in progress. It is not itself a per-player tech feature commit, but it matters because it changed local-host networking setup that the GW battle launch path depends on.

The branch moved away from ad hoc `disable_upnp` and `enable_steam_networking` flags toward a single transport value:

```js
local_host_transport
```

For Galactic War launch, [ui/main/game/galactic_war/gw_play/gw_play.js](ui/main/game/galactic_war/gw_play/gw_play.js) changed the local start params from:

```js
disable_upnp: true
```

to:

```js
local_host_transport: 'TCP'
```

The surrounding platform changes also:

- moved local-server network flag computation into `api.net.transportToNetworkFlags`,
- used `api.net.effectiveLocalHostTransport`,
- replaced the old separate UPnP/Steam P2P settings UI with a unified "Local Host Networking" setting,
- blocked joining Steam-hosted games when the client was not launched through Steam.

For the per-player tech branch, the important practical result is that campaign battle launch continued to request a deterministic local TCP transport while the rest of PA's local-host networking API changed underneath it.

### Explicit Local Host Transport Through GW Launch and Restart (`aaca920`)

Build `124640` changed the local server start contract from scattered query flags into an explicit transport setting. The previous GW code had hardcoded local battle launch toward TCP, but the new platform code expected that value inside the JSON `params` payload passed through `connect_to_game`.

This commit added `getLocalHostTransport()` to the GW play view model. It reads the saved `server.local_host_transport` setting first, falls back to `api.net.effectiveLocalHostTransport()` when available, and otherwise leaves the value undefined rather than inventing a fake transport.

Both campaign launch paths now pass:

```js
params: JSON.stringify({
    local_host_transport: self.getLocalHostTransport()
})
```

The same helper was added to the campaign restart loading scene so Continue War restarts preserve the user's local-host networking choice. This matters for per-player tech because the branch was increasingly dependent on reliable multi-scene transitions: campaign map, restart loading, connect, GW lobby, and live game all have to agree on how the local server is being started.

### Reconnect Restores Each Client's Unit Spec Tag (`84063ab`)

Commit `42cd816` made normal battle entry per-player-tag aware, but reconnect still had the older assumption that a GW co-op client should come back as `.player`. That broke joining players whose armies used `.player0`, `.player1`, or another numbered tag.

This commit fixed reconnect at the server source of truth. [server-script/states/playing.js](server-script/states/playing.js) gained `getReconnectUnitSpecTag(client)`, which locates the reconnecting client's runtime player/army and reads:

```js
player.army.desc.spec_tag
```

The reconnect memory-file message changed from sending only a raw files map to sending:

```js
{
    files: reconnectReplayFiles,
    unit_spec_tag: getReconnectUnitSpecTag(client)
}
```

The reconnect loading scene then reads `msg.files || msg`, persists `msg.unit_spec_tag` into `gw_campaign_unit_spec_tag`, mounts the memory files, and calls `api.game.setUnitSpecTag(unitSpecTag)`.

The fallback to `.player` remains only for a truly missing runtime lookup, and it logs the client name/id. The normal path is no longer a heuristic: reconnect derives the tag from the actual army the server assigned to that player.

### Move GW Loading Screens Under Galactic War (`d593a47`)

This commit moved the three GW-specific staging scenes into the Galactic War folder:

- `gw_campaign_loading`
- `gw_campaign_restart_loading`
- `gw_reconnect_loading`

The files themselves were mostly renamed without logic changes, but the path change is important architecture. These scenes are not general game loading screens; they exist to prepare Galactic War campaign state, memory files, reconnect tags, and restart context.

The updated paths are:

- `coui://ui/main/game/galactic_war/gw_campaign_loading/gw_campaign_loading.html`
- `coui://ui/main/game/galactic_war/gw_campaign_restart_loading/gw_campaign_restart_loading.html`
- `coui://ui/main/game/galactic_war/gw_reconnect_loading/gw_reconnect_loading.html`

[ui/main/game/connect_to_game/connect_to_game.js](ui/main/game/connect_to_game/connect_to_game.js) and [ui/main/game/galactic_war/gw_play/live_game_patch.js](ui/main/game/galactic_war/gw_play/live_game_patch.js) were updated to point at the new scene locations. `generate_mod.py` was updated too, and the guide gained the new subfolder descriptions.

For the per-player tech branch, the practical reason is simple: the branch was adding more GW-only lifecycle scenes, and keeping them inside `galactic_war/` made the ownership boundary clearer.

### Per-Player Tags Also Generate Allied Minions (`3d8ec46`)

The early `.playerN` implementation handled the human armies and commanders, but it missed allied minions/subcommanders that belong to each player's inventory. In Galactic War, minions are part of the player's inventory-derived army shape. If player 1 has their own tech namespace, their allied minions must use that same namespace too.

This commit extended `gw_per_player_tech_referee` so, for each non-host player tag, it adds that player's minions as allied AI armies:

- commander path tagged with the player's tag,
- `spec_tag` set to the player's tag,
- `alliance_group: 1`,
- minion color/economy/personality preserved from inventory data.

At this stage the implementation still used the host inventory for every player and left TODOs noting that real per-player inventories were still needed. Even so, it fixed the important config shape: per-player tech does not only mean "one human commander per player"; it also means all allied player-side forces for that player need matching tagged specs.

### Viewer Loadout and Commander Selection (`4a956a2`)

This is where per-player tech stopped being only a battle-file experiment and became a campaign setup flow.

The save model in [ui/main/game/galactic_war/shared/js/gw_game.js](ui/main/game/galactic_war/shared/js/gw_game.js) gained persisted `coopPlayerInventoryData` plus lookup/update helpers:

- `findCoopPlayerInventoryData(player)`
- `upsertCoopPlayerInventoryData(record)`

Those records store each non-host player's commander, selected start loadout, saved inventory, and identity. The game version was bumped so old saves could be patched into the new shape.

A new scene was added:

- [ui/main/game/galactic_war/gw_coop_per_player_loadout/gw_coop_per_player_loadout.js](ui/main/game/galactic_war/gw_coop_per_player_loadout/gw_coop_per_player_loadout.js)

That scene lets a joining co-op player choose:

- their commander,
- their starting loadout card.

The server campaign state tracks which viewers still need a loadout via `clientRequiresLoadout`, includes `requires_loadout` and `loading_status` in control/snapshot payloads, and accepts `set_player_loadout` from non-host clients. After a loadout is submitted, the server stores the inventory data into the host-authored snapshot and broadcasts `gw_campaign_player_loadout`.

The campaign loading scene routes viewers who require setup into the new loadout scene before they enter `gw_play`. This prevents a viewer from appearing on the campaign map with no usable inventory record.

The per-player tech referee was changed to stop cloning the host inventory for every player. It now loads each connected viewer's stored inventory data, generates that player's tag from that inventory, and assigns that player's commander:

- host keeps the main `game.inventory()`,
- each viewer loads their `coopPlayerInventoryData` record into `GWInventory`,
- `army.player_config.commander` is set to the matching tagged commander,
- minions are generated from the matching player's inventory.

This commit also introduced a shared `gw_start_loadouts` helper so loadout-card presentation can be reused instead of duplicating start-card construction logic.

### Co-op Players Pick Their Own Tech Cards (`f7b8b02`)

After viewers had independent starting inventories, they also needed independent tech acquisition. The host still explores the map and wins fights, but per-player tech means each viewer must receive and resolve their own pending card choices.

The server gained pending-tech-card state on each co-op player inventory record:

```js
pendingTechCards: {
    star: Number,
    cards: Array,
    updatedAt: Number
}
```

The host deals pending cards for viewers and publishes them with `set_player_pending_tech_cards`. The server validates that:

- per-player tech is enabled,
- the target client is connected,
- the target is not the host,
- the target already has an inventory record,
- pending card data has a valid star and card list.

While a viewer has pending cards, the server reports them as loading with `loading_status: 'picking_tech_cards'`. Battle launch is blocked through `hasPendingPlayerSetup()` until all viewer loadouts and pending tech choices are resolved.

On the viewer side, `gw_play` learned to display the pending card list as the active card choice UI when `canChooseCoopTechCards()` is true. The viewer's active inventory is their own co-op inventory record, not the host's inventory. Selecting a card sends a tech-choice message; dismissing a card is allowed through the same card UI flow.

The server initially accepted full updated inventory data from the viewer's choice response, stored it, cleared `pendingTechCards`, and broadcast the resulting record to everyone. Other clients saved the updated co-op inventory data locally so later battle launches could generate the right `.playerN` specs.

This commit made the end-user feature visible: in a per-player tech campaign, each joining player can pick their own rewards instead of inheriting the host's tech card choices.

### Tech Choice Becomes Server-Validated Client Prediction (`b2ec283`)

The first working tech-choice implementation let viewers send back a full mutated inventory after choosing a card. That worked, but it made the client too authoritative over the inventory record and sent more data than necessary.

This commit moved the design closer to the existing campaign action model: the client predicts enough locally for UI responsiveness, but the server applies the authoritative inventory operation and broadcasts the minimal operation to everyone else.

Server-side changes in [server-script/states/gw_campaign.js](server-script/states/gw_campaign.js):

- `choose_player_pending_tech_card` replaces the full-inventory choice submission.
- The server looks up the existing player inventory record.
- It validates the pending star, selected index, duplicate card state, and inventory shape.
- It appends the selected card itself, normalizes inventory tags to the global context, clears `pendingTechCards`, and stores the record.
- It broadcasts `gw_campaign_player_tech_card_choice` with only the client, star, selected index, and timestamp.
- `delete_player_tech_card` performs server-authoritative deletion from the viewer's current tech inventory and broadcasts `gw_campaign_player_tech_card_deleted`.

Client-side changes in [ui/main/game/galactic_war/gw_play/gw_play.js](ui/main/game/galactic_war/gw_play/gw_play.js):

- removed the separate temporary `coopTechChoiceInventory`,
- uses the displayed co-op player inventory as the active tech inventory,
- applies broadcasts locally through `applyCoopPlayerInventoryRecord`,
- supports card deletion as an operation rather than a full record replacement,
- only sends `choose_player_pending_tech_card` with `star` and `selected_card_index`.

This is a better synchronization contract. The server becomes the arbiter of whether the card choice is valid, while clients still update their local saved campaign data from the same operation. It also reduces network payloads by avoiding full inventory records for every tech-card choice.

### Viewer Loading Waits For Prepared Local Inventory (`fd233da`)

After viewers could have their own inventory records, the campaign loading scene had a new race to deal with. A viewer could receive the host snapshot, save it, and enter `gw_play` before their local co-op inventory had been hydrated and had its cards applied. That meant the first render inside `gw_play` could see an incomplete or raw inventory.

This commit added `prepareLocalCoopPlayerInventoryData(game)` to the GW campaign loading scene. The helper only runs for viewers in per-player tech games who already have a loadout. It:

- finds the viewer's `coopPlayerInventoryData` record,
- rejects loading if the record or card list is missing,
- loads the saved inventory into `GWInventory`,
- runs `inventory.applyCards`,
- saves the prepared inventory back into the game record,
- only then allows `GW.manifest.saveGame` and navigation into `gw_play`.

This made viewer entry stricter in the right place. If per-player tech requires a prepared local inventory, loading should wait for that state instead of letting the next scene discover the breakage after UI and battle setup have already started.

### Co-op Lobby Defaults To Two Slots When Count Is Unspecified (`1b9d952`)

This fixed a campaign lobby setup edge case. When a co-op save did not yet have an explicit saved player count, the lobby setup path could pass the raw `savedCoopPlayers()` value through to `max_clients_limit`. In that default state the value could behave like a one-player lobby, causing the lobby to open with only one slot.

The commit added `savedCoopLobbyPlayers()`:

```js
if (!self.savedCoopPlayersSpecified()) {
    return 2;
}
```

Lobby payload generation and saved-setting application now use that helper. The important distinction is between "the save explicitly locked this campaign to N players" and "there is no saved count yet." The latter should still produce a useful co-op lobby, so it defaults to two players.

### Subcommander Colors Use The Player's Inventory Color (`f2a5e4b`)

The first minion-generation pass derived fallback minion colors from the battle army color. That could be wrong for co-op subcommanders because the per-player tech referee mutates and assigns multiple human armies while also loading independent inventories.

This commit made the referee read the owning player's original color from the inventory tag:

```js
inventory.getTag('global', 'playerColor')
```

If that color is missing or invalid, the referee now fails per-player tech generation instead of guessing. When a minion does not provide its own color, its fallback color becomes the owning inventory color:

```js
[playerColor[0], playerColor[1]]
```

That keeps subcommander colors tied to the player's saved Galactic War identity rather than to whatever army color happened to be present after battle config generation.

### Initialize Per-Player Tech State Before Inventory Render (`5e00ed8`)

This was a small but important UI-ordering fix. `gw_play` has multiple computed values that decide which inventory to display: the host campaign inventory or the local co-op player's inventory. Those computed values depend on the per-player tech session state.

Before this commit, a viewer could briefly render with the wrong inventory because `gwCampaignPerPlayerTechCards` had not yet been initialized from the loaded campaign save. The commit added `applyInitialPerPlayerTechStateFromGame()` and calls it immediately during view-model setup.

For a per-player tech campaign, it sets:

- `gwCampaignPerPlayerTechCards(true)`
- `gwCampaignSharedControl(false)`

That means the first inventory render already knows it is in per-player tech mode and uses the co-op player's display inventory instead of briefly falling back to the host/global inventory path.

### Campaign Snapshot Requests Are Coalesced And Cached (`f7db6fd`)

As more viewer setup state moved through campaign snapshots, the network path started doing too much repeated work. Viewers joining, reconnecting, or falling back after an action replay could all ask the host for fresh campaign data.

This commit added two server-side snapshot lifecycle flags:

- `snapshotRequestInFlight`
- `lastSnapshotStale`

The server now coalesces duplicate fresh snapshot requests with `requestFreshSnapshotFromHost`. If a non-stale snapshot is already cached and the viewer does not request a forced refresh, the server sends the cached snapshot immediately instead of asking the host again.

The request payload also gained a reason and force flag:

```js
{
    reason: 'viewer_request',
    force_fresh: false
}
```

Campaign actions from the host mark the cached snapshot stale. Fresh host snapshots clear both `snapshotRequestInFlight` and `lastSnapshotStale`. Viewers still request a forced snapshot for action fallback cases, where deterministic replay is not reliable enough.

On the client side, the older "host notices viewer and sends initial snapshot" helper was removed in favor of the server-mediated request path. The result is a cleaner synchronization model: viewers request campaign state, the server decides whether cached state is good enough, and only one fresh host request is in flight at a time.

### Invalid Modded Faction Saves No Longer Crash Icon Setup (`8281eff`)

This commit handled a defensive-load case around modded Galactic War saves. A save created with a modded faction index can later be opened without the mod installed. In that situation, `GWFactions[factionIndex]` may be missing.

Previously the UI immediately dereferenced `faction.icon`, which could crash campaign loading. The fix logs the invalid faction index and falls back to the normal faction-icon path:

```js
icon || (faction && faction.icon) || defaultFactionIconPath
```

This is intentionally narrow. It does not try to reconstruct the missing modded faction; it prevents a missing optional presentation object from taking down the campaign UI.

### Live Game Resolves Current Per-Player Spec Tags (`1ff4ce1`)

This commit fixed several places where the live-game UI still behaved as though GW co-op meant `.player`. That was good enough for normal Galactic War and shared co-op, but not for per-player tech. A joining player using `.player0` or `.player1` needs the action bar, build bar, build hover, and selection parsing to prefer that player's current tag.

The server now carries `gw_campaign_active` through the lobby and reconnect paths:

- `gw_lobby` exposes it in the control payload,
- reconnect memory files include it,
- `gw_lobby.js` and `gw_reconnect_loading.js` persist it into the `gw_coop_mode` session key.

That fixed a root lifecycle issue: `live_game` could see `gwCoopMode` as false even during an actual co-op Galactic War battle.

The live-game UI then uses the current GW unit tag when resolving specs:

- [ui/main/game/live_game/live_game.js](ui/main/game/live_game/live_game.js) uses `currentGwUnitSpecTag()` for build hover, build item lookup, selection parsing, and item detail aliases.
- [ui/main/game/live_game/live_game_action_bar.js](ui/main/game/live_game/live_game_action_bar.js) resolves selected unit specs through the current GW tag before falling back to `.player` or `.ai`.
- [ui/main/game/live_game/live_game_build_bar.js](ui/main/game/live_game/live_game_build_bar.js) waits for `api.game.getUnitSpecTag()` and the saved session tag, then processes build specs against the resolved tag.

This was especially visible for cost-reduction tech. If a viewer had different build-cost tech from the host, a build bar lookup that fell back to `.player` could show host costs instead of the viewer's `.playerN` costs. After this change, the UI prefers the same tag the client uses for its GW unit files.

The same commit also removed the old special-case that skipped `live_game` scene mods while in GW co-op, and added guide notes reinforcing the branch's state-flow rule: when a state value is missing or unreliable, fix the lifecycle that lost it instead of adding another masking fallback.

### Late Joiners Catch Up To The Host's Tech Deal Count (`50a656f`)

Per-player tech created a fairness problem for players who joined after the host had already earned tech-card rewards. A new viewer could choose a starting loadout, but they would have fewer reward deals than the host and older co-op players.

This commit added a catch-up system based on deal count rather than raw card count. That distinction matters because players can dismiss cards. The goal is not "everyone has exactly the same number of cards"; it is "everyone has been offered the same number of reward deals."

The save model gained two host-side fields:

- `hostTechCardDealCount`
- `hostTechCardDealHistory`

When the host explores and a star deals cards, `recordHostTechCardDeal(starIndex)` records the deal index and star. Viewer records gained `techCardDealCount`, initialized to `0` when their loadout is submitted.

The server uses those counts to detect viewers who are behind:

- `coopPlayerNeedsTechCatchup(record)`
- `requestHostCoopPlayerTechCatchupIfNeeded(client, reason)`
- `requestAllHostCoopPlayerTechCatchups(reason)`

If a viewer is behind and does not already have pending cards, the server marks that viewer as `picking_tech_cards` and asks the host to deal the next missing reward through `gw_campaign_player_tech_catchup_needed`. The host looks up the original deal entry from `hostTechCardDealHistory`, deals cards from that same star, and sends them through the normal pending-card path with the original `dealIndex`.

When the viewer chooses or dismisses the catch-up card, the server advances that viewer's `techCardDealCount` and immediately checks whether another catch-up deal is still needed. This repeats until the viewer has caught up to the host's deal count.

The result is a clean extension of the existing tech-choice protocol. Late joiners do not get arbitrary bonus cards, and the server does not need to invent rewards. It replays the host's historical deal sequence one pending choice at a time.

### Host Is Not Shown As Eternally Picking Tech Cards (`193a0c1`)

The catch-up logic initially treated every client as eligible for pending-tech loading state. That accidentally included the host. Since the host is the source of the campaign's main inventory and tech-deal history, they should not be considered a co-op viewer who needs per-player catch-up.

This commit added `client.id !== self.creatorId` checks in the loading-state paths that force `picking_tech_cards`. The server still evaluates viewer pending cards and catch-up needs, but the host no longer appears stuck in the "picking tech cards" state.

### Co-op Inventory Modal For Viewing Other Players (`afd8727`)

Once each player had their own loadout, tech inventory, and catch-up lifecycle, the campaign lobby needed a way to inspect that state. This commit added an inventory viewer modal to `gw_play`.

Each occupied co-op slot can show an Inventory button when per-player tech is active and the slot has a valid inventory record. The modal displays:

- the player name,
- their selected loadout,
- their visible tech cards,
- a larger detail panel for the selected card.

The implementation validates records before opening the modal so empty or still-loading players show "Waiting for loadout" instead of opening a broken view. It also keeps the modal fresh when inventory records change through loadout submission, tech choices, or local card changes.

The host needed one extra bit of bookkeeping. The host's real inventory is still `game.inventory()`, but the modal reads from `coopPlayerInventoryData` so it can present all players uniformly. `syncHostCoopInventoryRecord(reason)` copies the host's current saved inventory into the host co-op inventory record before snapshots and when cards change.

That makes the viewer screen a read-only presentation layer over the same records battle launch uses, instead of adding a separate display-only inventory model.

### Hide The Other-Player Inventory Button For The Local Player (`c4f097c`)

The inventory modal from the previous commit was meant to inspect other players. The local player's own inventory is already visible in the main Galactic War UI, so showing an extra Inventory button on the local slot was redundant and could be confusing.

This commit added `isLocalGwCampaignClient(client)`, matching by local Uber id first and display name second. Slot generation now sets:

```js
showInventory: client && perPlayerTechCards && !localClient
```

The modal open path also refuses local slots directly. That keeps the slot list focused on what it uniquely provides: checking teammates' loadouts and cards.

### Upstream Build 124641 Integration (`5351a24`)

This commit imported PA build `124641` changes while the per-player tech work was still in flight. Its main effect was removing the old user-facing "local or remote server" choice and simplifying game launch around local servers.

In the GW play path, `useLocalServer` was removed and battle launch now always marks the start params as local:

```js
local: true
```

`allowLoad()` now keys off `game.replayName()` instead of switching between local replay names and remote replay lobby ids. The remote load-save path was removed from this branch's GW launch code.

Outside Galactic War, the start screen, server browser, settings, and save-game browser were updated to match the upstream local-server policy:

- remove the old `server.local` setting UI,
- remove the "Host game locally" choice from server browser,
- gate gameplay on `local_server_available`,
- launch AI skirmish and Galactic War through local server paths.

For the per-player tech branch, the practical consequence is narrower launch state. The branch no longer has to preserve per-player GW setup across both local and remote GW battle start flows.

### Co-op Difficulty Scaling Accounts For Per-Player Tech (`14ca456`)

Earlier co-op difficulty scaling increased AI economy and enemy minions based on player count. Per-player tech changes the balance: each player can have their own tech progression, so the allied side can become significantly stronger than shared-tech co-op.

This commit adjusted the scaling constants and formulas in GW start generation:

- economy bonus is still based on extra co-op players,
- per-player tech multiplies that extra-player economy bonus by `PER_PLAYER_TECH_CARD_ECON_SCALING`,
- minion distance scaling now uses absolute jump distance from the player's start instead of relative distance to the galaxy rim,
- per-player tech multiplies the extra co-op minion count by `PER_PLAYER_TECH_CARD_MINION_SCALING`.

The move from relative to absolute distance is important because relative scaling changes with galaxy size. Absolute jump distance makes the additional minion ramp easier to reason about: every fixed number of jumps adds another chunk of co-op-scaled minions.

### Version 4 Save Patcher Covers All Co-op GW State (`f48ba07`)

The version 4 game patch originally only ensured `coopPlayerInventoryData` existed. By this point, version 4 represented a broader co-op save shape: co-op player count settings, shared-control defaults, per-player tech enablement, inventory records, and host tech-deal history.

This commit expanded the patcher so old saves get all of those observables if they are missing:

- `coopPlayers`
- `coopPlayersSpecified`
- `lockCoopPlayers`
- `sharedByDefault`
- `perPlayerTechCards`
- `coopPlayerInventoryData`
- `hostTechCardDealHistory`
- `hostTechCardDealCount`

It also enforces the key invariant during patching: if `perPlayerTechCards()` is true, `sharedByDefault(false)` is applied. That prevents an old or partially upgraded save from loading into the impossible "per-player tech plus shared army" state.

This patcher matters because the branch evolved the save format over many commits. Loading an older co-op GW save should not depend on exactly which intermediate commit created it.

### Local Overlays Regenerate Per-Player Tags With Client-Side Effects (`8bf0142`)

This commit fixed the interaction between per-player generated tech files and local client-side mods such as skins or effects. The important constraint is that the shared battle files already contain the referee-generated gameplay tags:

- `.player`
- `.player0`
- `.player1`
- later `.playerN` tags

Local overlays should not replace that ownership model. They should regenerate local presentation overlays for the same tags using the correct inventory mods for the player who owns each tag.

The server now builds explicit tag assignments from the prepared battle config:

```js
{
    tag: army.spec_tag,
    client_id: client.id,
    client_name: client.name
}
```

Those assignments are sent in the normal `gw_config` payload and are also stored in the full replay config so reconnect can receive the same mapping through `memory_files`.

The lobby and reconnect loading scenes then use that mapping while building local overlay files:

- `.player` is regenerated from the local campaign inventory,
- `.playerN` tags are matched to their owning co-op player inventory record,
- each tag gets AI unit maps generated for that same tag,
- `GW.specs.modSpecs` is applied with that inventory's mods,
- the resulting local files are merged over the already-refereed shared files.

This is the generic version of the behavior the branch needed. The base/referee files remain authoritative for gameplay ownership, while each client can still apply local modded visuals and effects across the generated per-player tag set.

### Co-op Players Unlock Start Loadouts In Per-Player Tech Games (`753439a`)

Start loadouts are represented as Galactic War cards with ids like `gwc_start...`. In a single-player campaign, when the host encounters or earns a start loadout card, the host's local bank can unlock it. Per-player tech needed the same idea for viewers: if a co-op player is offered a start loadout card, it should unlock for that player instead of being treated like a normal inventory tech card.

This commit introduced normalized `unlockedStartCardIds` on co-op player inventory records. The loadout scene reports the viewer's currently unlocked start cards when submitting their initial loadout, always including the selected loadout card.

The server gained helpers to identify and normalize start loadout cards:

- `isStartLoadoutCardId`
- `normalizeUnlockedStartCardIds`
- `addCoopPlayerUnlockedStartCardId`

It also gained `set_player_unlocked_start_cards` so a viewer can report newly unlocked local loadouts, and `gw_campaign_player_unlocked_start_cards` broadcasts so every client saves the same co-op player record.

Tech-card dealing was updated too. When a star's card list contains start loadout cards, the host records them in the host deal history. For each viewer, the pending-card deal checks whether that player already has the start loadout unlocked. If not, the pending choice can be a one-card start-loadout unlock. Choosing it updates `unlockedStartCardIds`; it does not consume a tech bank slot or get inserted into the normal tech card inventory.

This let viewers unlock new loadouts even in co-op, as before they would have had to play single player to unlock the new loadouts.

### Preserve Existing Boss/System Flavor Text When AI Description Is Missing (`791141d`)

This was a small upstream-style content fix in GW generation. When assigning AI identity to a star, the code always wrote:

```js
star.system().description = ai.description;
```

If `ai.description` was undefined, that overwrote any existing system description with `undefined`. The fix only assigns the AI description when it exists:

```js
if (!_.isUndefined(ai.description)) {
    star.system().description = ai.description;
}
```

This keeps existing boss or system flavor text intact when the AI record does not provide replacement text.

### Practical Lessons From Per-Player Tech Cards

The branch's core model is now consistent:

1. Per-player tech must imply unshared human armies, because a shared army can only have one `spec_tag`.
2. Referees prepare the battle config and generated shared files before the server lobby assigns clients.
3. Each human client receives the tag belonging to their assigned army and carries it through lobby, reconnect, and live game.
4. Co-op player inventories are persisted in the campaign save, not reconstructed from UI state.
5. Server messages describe validated operations whenever possible, rather than accepting full mutated client records.
6. Local overlays are allowed to regenerate the same tags for presentation mods, but the tag ownership comes from the prepared battle config.
7. Fallbacks are only acceptable when the source is genuinely optional; broken propagation should be fixed at the lifecycle point where the value is lost.

---

## Post-Per-Player-Tech-Card Changes

These commits landed after the per-player tech-card branch. This section intentionally skips `78c5f1b` and `081420c`, and covers the remaining post-merge commits.

### Client Mod Gate Reports Both Missing And Extra GW-Affecting Mods (`f303aee`)

The earlier client-mod gate only reported required mods that a joining client was missing. That was not enough for Galactic War co-op, because a client can also have an extra GW-affecting client mod enabled that the host does not have. In that case the client may locally generate or patch files differently from the shared campaign state.

This commit changed the manifest contract. Clients now report:

- all active client mod identifiers,
- active client mods that declare themselves as required/GW-affecting,
- display names for those active required mods.

The server compares the host-published required set against the client's active required set. A mismatch can now be:

- missing on the client,
- extra on the client,
- malformed because the client did not send the required manifest fields.

Both `gw_campaign` and `gw_lobby` gained a `requiredClientModsPublished` flag. That prevents the manifest gate from treating "host has not published required mod data yet" as equivalent to "there are no required mods." Once the host publishes the set, already-connected viewers are asked to resend manifests.

The user-facing gate moved out of `gw_lobby` and `gw_play` into [ui/main/game/connect_to_game/connect_to_game.js](ui/main/game/connect_to_game/connect_to_game.js). That gives one shared connection-time UI for mod mismatches instead of duplicating gate markup and handlers in every GW scene. The gate title changed from "Required Client Mods Missing" to "Client Mod Mismatch" and now shows separate lists for:

- "Missing on this client"
- "Only active on this client"

This keeps the mod check aligned with the required/GW-affecting mod model: everyone should have the same behavior-changing client mods, while purely local presentation mods can still remain local.

### Issue #33: Explicit Win Button Argument (`41e8bcc`)

Per-player tech made `win` require an explicit selected-card index so the viewer tech-choice path could tell the server exactly which pending card was chosen. That changed the function contract, but one debug/hero button in `gw_play.html` still bound directly to `win`.

Knockout click bindings pass the current binding context as an argument when a function is referenced directly. After the function signature changed, clicking that button could pass the wrong value as the selected-card index.

This commit made the binding explicit:

```html
click: function() { win(-1); }
```

`-1` is the existing "no selected card" value. The `lose` button was similarly wrapped as `function() { lose(); }` so the click context is not accidentally passed into it either.

### Galaxy System Generation Includes Co-op Player Count (`75e12ba`)

Co-op difficulty scaling already adjusted AI economy and enemy minions after the galaxy existed, but the generated star systems themselves were still chosen using the vanilla player-count ramp. That meant a larger co-op group could face co-op-scaled armies inside systems whose planet layouts were selected for fewer players.

This commit passes the saved co-op player count into galaxy generation:

```js
coopPlayersForSystemGeneration: coopPlayersForGeneration
```

[ui/main/game/galactic_war/shared/js/gw_galaxy.js](ui/main/game/galactic_war/shared/js/gw_galaxy.js) then adds one system-generation player per extra co-op player:

```js
var coopSystemPlayerBonus = Math.max(0, Math.floor((config.coopPlayersForSystemGeneration || 1) - 1));
var plyrs = Math.min(40, basePlayers + coopSystemPlayerBonus);
```

The cap at `40` is deliberate. The vanilla system template buckets use normal player counts up to that range, and exceeding it can fall into special fallback behavior rather than the intended normal templates.

`generate_mod.py` was updated to copy `gw_galaxy.js`, because the co-op mod package now needs this shared generation file for the new behavior.

### Spawned Units Are Tagged Independently Of Death Weapon Tagging (`16d2f02`)

This fixed the Lob-spawned Dox problem in the primary `shared/js` copy of `gw_specs.js`. The old tagging logic only applied `spawn_unit_on_death` inside the `death_weapon` block. That meant a projectile or transient spec could spawn a unit, but if it did not also have a `death_weapon`, the spawned unit path stayed untagged.

For Galactic War generated specs, that is wrong. `spawn_unit_on_death` is a dependent spec reference just like ammo specs, buildable unit paths, and death weapon ammo paths. If the current generated namespace is `.player`, `.player0`, or `.player1`, the spawned unit reference needs the same tag.

The fix moves the `spawn_unit_on_death` check outside the `death_weapon` branch:

```js
if (_.isString(spec.spawn_unit_on_death)) {
    applyTag(spec, "spawn_unit_on_death");
}
```

This is generic base behavior, not a GWO-specific workaround. Any GW tech system that modifies a unit should also affect copies of that unit spawned through `spawn_unit_on_death`, including Lob-spawned Dox.

## More Cleanup (Commits `bcdfcde` through `f3bd000`)

These commits landed after the spawned-unit tagging fix. They are smaller than the per-player tech branch, but they are important because they tighten protocol boundaries that had become easy to reason about incorrectly.

### Steam P2P Beacon Metadata For GW Campaign States (`bcdfcde`)

This commit fixed Steam P2P connection failures by making the GW campaign server states publish the same Steam networking metadata expected by the normal connection path.

Both [server-script/states/gw_campaign.js](server-script/states/gw_campaign.js) and [server-script/states/gw_lobby.js](server-script/states/gw_lobby.js) already constructed beacon payloads with lobby identity, mode, required content, and sandbox information. The missing pieces were:

```js
steam_networking: !!server.steam_networking_enabled,
steam_id: server.steam_networking_enabled ? server.steam_id : undefined
```

Without those fields, clients discovering or joining through a Steam P2P-capable path could lack the transport identity needed to connect correctly. The fix keeps the beacon conditional: Steam metadata is only advertised when Steam networking is actually enabled.

### Restart Prepare Uses Explicit Per-Client Roles Only (`cea37ad`)

The Continue War restart protocol already had the right design direction: the server should send each client an explicit role, and the UI should not infer host/viewer from loose identity fields. This commit made that rule stricter.

Previously, [ui/main/game/galactic_war/gw_play/live_game_patch.js](ui/main/game/galactic_war/gw_play/live_game_patch.js) still had fallback logic that tried to infer the role from `host_id`, `displayName`, `uberId`, or previously captured game-over client state. That was risky because role identity is not a display concern, and because a fallback can hide the real bug if the restart payload loses its role.

The client now accepts only an explicit `role` value of `host` or `viewer` from `gw_return_to_campaign_restart_prepare`. If that field is missing, it logs a loud error and keeps the current role rather than guessing.

The server-side half changed too. [server-script/states/game_over.js](server-script/states/game_over.js) and [server-script/states/playing.js](server-script/states/playing.js) no longer send a roleless broadcast followed by role-specific direct messages. They now send role-specific restart prep directly to each connected client. This avoids a normal-path roleless message triggering the new error logging.

This preserves the important Continue War split:

- `game_over` handles the normal post-battle restart path,
- `playing` handles defeated-while-still-playing cases such as GWO/FFA,
- the UI consumes the same role-bearing restart message from either server state.

### Mod Mismatch Reason Text Uses Separators (`3f4f727`)

This commit cleaned up the server-generated reason string for required/GW-affecting client mod mismatches.

The visible client mod mismatch gate in [ui/main/game/connect_to_game/connect_to_game.html](ui/main/game/connect_to_game/connect_to_game.html) renders missing and extra mod names as vertical lists from structured identifier arrays. This commit does not change that primary UI.

Instead, it changes the fallback/reason text generated by `buildMissingRequiredModsReason` in both campaign states. Lists like:

```text
missing [Mod A][Mod B]
```

now become:

```text
missing [Mod A], [Mod B]
```

That reason string is still useful in logs, acknowledgement payloads, rejection/fallback flows, and debugging output. Keeping it readable matters even though the main visual gate uses structured fields.

### GW Lobby Config Requests Are Bounded (`1da19fa`)

The GW battle lobby can be entered by clients after the server has already sent the generated GW config. To cover that race, [ui/main/game/galactic_war/gw_lobby/gw_lobby.js](ui/main/game/galactic_war/gw_lobby/gw_lobby.js) explicitly requests `request_gw_config` until the memory files are mounted.

Before this commit, that retry loop was unbounded. If the config never arrived, or if mounting failed permanently, the client could keep requesting forever with no clear error path.

The new behavior keeps the recovery intent but gives it a finite lifecycle:

- retry once per second,
- stop after `GW_CONFIG_MAX_RETRIES`,
- avoid sending duplicate config requests while a mount is already in progress,
- log failed `request_gw_config` responses,
- log memory-file mount failures,
- route the user back through transit with a clear "failed to load Galactic War config" message if the config never mounts.

The retry limit is intentionally generous so slow machines or heavy local overlay generation do not fail during normal operation, while still preventing an infinite silent loop.

### Removed Dead Tech-Deal Count Parameter (`f3bd000`)

This cleanup removed an unused parameter from `getCoopPlayerTechCardDealCount` in [server-script/states/gw_campaign.js](server-script/states/gw_campaign.js).

The helper only reads the co-op player's own inventory record:

```js
self.getCoopPlayerTechCardDealCount = function(record) {
```

Callers still compute the host deal count separately when they need to compare player progress against host progress. Removing the unused parameter makes that separation explicit:

- `getHostTechCardDealCount(game)` answers "how many deals has the host reached?",
- `getCoopPlayerTechCardDealCount(record)` answers "how many deals has this player resolved?",
- comparison logic stays at the call site where both values are meaningful.

This does not change behavior. It prevents future readers from assuming the helper is using the host count as an override or fallback.

### Steam P2P now works with autoreconnect. (`ddf96c2`)

Steam socket servers do not have a stable `steam_id` at the moment Continue War restart prep is sent. Logs showed the server starts with a temporary Steam game-server id and then updates it after the restarted server is already running. That means the old direct reconnect payload can safely preserve TCP/IP host/port, but it cannot safely preserve a Steam socket connection target.

The fix keeps the direct TCP/IP and UPnP path unchanged. If the saved reconnect info has no Steam id, [ui/main/game/galactic_war/gw_campaign_restart_loading/gw_campaign_restart_loading.js](ui/main/game/galactic_war/gw_campaign_restart_loading/gw_campaign_restart_loading.js) restores `game_hostname` and `game_port` and goes straight to `connect_to_game`.

For Steam socket reconnects only, the restart loading scene now rediscovers the restarted lobby using the same sources as the normal multiplayer server browser:

- UberNet remote games through `api.net.requestCurrentGames()`,
- custom server listings through the session `custom_servers_url`,
- LAN lookout beacons through `enable_lan_lookout` and Coherent `update_beacon` / `new_beacon` handlers.

[server-script/states/game_over.js](server-script/states/game_over.js) and [server-script/states/playing.js](server-script/states/playing.js) include the host display name in the existing `gw_return_to_campaign_restart_prepare` payload. The restart loading scene uses that normal beacon field as the matching key:

```js
creator === context.host_name
```

It also requires normal advertised lobby fields: `state === 'lobby'`, `mode === 'FreeForAll'`, `steam_networking === true`, and a present `steam_id`. On match, it fills the same session state that server-browser join uses: blank host/port for Steam, fresh `game_steam_id`, lobby id, uuid, server type, GW setup, game type, mods, password, and then navigates to `connect_to_game`.

This path intentionally does not use custom beacon fields. A tested `gw_restart_token` experiment did not survive into the LAN beacon payload, and nonstandard beacon data has historically been stripped or hidden by the discovery layer. The durable matching data is the normal host display name plus the normal lobby/Steam fields.

The debugging lesson was that "the server browser sees it" does not imply `requestCurrentGames()` sees it. The server browser merges three lists: remote UberNet games, custom server games, and LAN beacons. The off-LAN failure printed `requestCurrentGames()` returning zero while the browser still showed `Custom: local` rows, which meant restart discovery had copied only part of the browser pipeline.

The new logs are deliberately modest but should make future failures diagnosable:

- restart entry includes role, timing, token, and host name,
- direct reconnect logs the chosen host/port,
- Steam discovery logs attempt number, host, and build,
- remote discovery logs `requestCurrentGames` failures and returned game count,
- custom discovery logs custom-list availability, failures, and returned game count,
- LAN/custom/remote candidates log source, lobby id, creator, Steam id, and mode,
- a match logs lobby id, source, and fresh Steam id,
- timeout logs a clear give-up message before returning through transit.

The practical rule from this bug is: when mimicking server-browser behavior, mimic the whole source pipeline before inventing fallback theories. In this repo, LAN, UberNet, and custom-server discovery are distinct feeds that only become one list inside `server_browser.js`.

### Host-Authoritative Star Card Offer Sync (`96cc3ee`)

Galactic War Overhaul exposes a small but useful synchronization mistake in the campaign-map operator model. GWO pre-deals one card onto selectable enemy systems and shows that card in its system information panel as "Available Tech". The real shared game state for this is still the normal Galactic War `star.cardList()`, but GWO also caches a display label on `star.ai().cardName`.

In single-player, this is harmless. In co-op, host and viewer can reveal a new enemy system while both clients have GWO loaded. If both clients run GWO's local pre-deal independently, they can locally roll different cards. The actual reward follows the host's `star.cardList()`, but the viewer's information panel can show a different local prediction, or lose the label after movement sync overwrites the viewer's map star from the campaign game star.

The fix keeps the operator theory intact. We do not send a whole snapshot and we do not ask viewers to rerun the mod's card dealer. Instead, the host emits the existing `sync_star_cards` operator with concrete operands:

```js
{
    star: starIndex,
    cards: star.cardList(),
    extra_card_info: {
        card_name: star.ai().cardName
    }
}
```

`cards` is the actual generic state. `extra_card_info` is optional metadata associated with that card offer. For now the only applied key is `card_name`, because that is the reviewed field needed by GWO's panel. This avoids inventing a GWO-specific "star intel" protocol while also avoiding an arbitrary mod-data tunnel.

The host now observes star `cardList` changes and sends `sync_star_cards` when a mod or the base game changes a star's pending cards. Viewers apply the packet to their campaign game state, then the existing viewer-star sync copies that state into the map/view model. This makes newly revealed GWO systems behave like late-join systems: the host's card offer and display label are the only promise shown to co-op players.
