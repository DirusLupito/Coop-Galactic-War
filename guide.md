# Planetary Annihilation TITANS: `ui` + `server-script` Folder Guide

This guide explains what the subfolders generally do, based on reading representative files in each area.

## Scope and approach
- Focused on:
  - `media/ui`
  - `media/server-script`
- For each meaningful code subfolder, I read 1–2 representative files.
- Some folders are asset-only (images, fonts, videos, icons); for those, purpose is inferred from structure/file names.

## Notes:
- This code uses ES5 Javascript, with the Coherent structure.
- Many hidden functions and scenes and styles are used; not everything can be figured out as the actual game's source code is not present.

---

## `ui/` (client UI)

### `ui/main/`
Main Coherent UI app shell and scene system.
- `main.html` loads boot scripts, `main.js`, the `start` game panel, and the `uberbar` panel.
- `main.js` controls splash/intro video flow, layout mode switching (`player` vs `game` panel), and startup setup.

#### `ui/main/atlas/`
Icon atlas scenes used by the engine/UI.
- `icon_atlas/`: strategic icon index and texture list (`icon_atlas.js`).
- `special_icon_atlas/`: command/special icon list (`special_icon_atlas.js`).

#### `ui/main/game/`
All major frontend game scenes/screens.

- `armory/`: in-game store/entitlements/cart and purchase flow UI.
- `building_planets/`: loading/transit panel shown while systems are generated.
- `community_mods/`: community mod browser/manager UI and filters.
- `community_tournaments/`: lightweight shell page that loads remote tournament CSS/JS.
- `connect_to_game/`: connection handshake/retry flow into hosted games.
- `galactic_war/`: full Galactic War campaign UI stack (details below).
- `game_over/`: post-match state, winner/defeat handling, results actions.
- `gamestats/`: timeline/statistics panel and derived stat logic.
- `guide/`: embedded guide/manual page handler with iframe loading.
- `leaderboard/`: ranked ladder/league display and player rating presentation.
- `live_game/`: primary in-match HUD and runtime interaction logic.
- `load_planet/`: system/planet selection, loading, and editor-related loading helpers.
- `matchmaking/`: queue/challenge/penalty state machine for ranked matching.
- `new_game/`: lobby creation setup (slots, AI, colors, econ factor, etc.).
- `replay_browser/`: replay listing/filtering/loading metadata UI.
- `replay_loading/`: replay connect/load bridge and failure/heartbeat handling.
- `save_game_browser/`: save list and load/delete actions.
- `server_browser/`: browse/filter/join custom and public lobbies.
- `settings/`: settings page, keybind grouping, platform-sensitive options.
- `social/`: friends/recent/blocked UI and social tag management.
- `start/`: main menu hub and boot-time storage/session setup.
- `system_editor/`: procedural system editor and planet/system authoring logic.
- `transit/`: generic “moving between scenes” message page with delayed redirect.

##### `ui/main/game/galactic_war/` subfolders
- `cards/`: definitions of GW tech cards/buffs and unlock payloads (e.g., unit unlock lists).
- `gw_lobby/`: campaign battle staging lobby and readiness/config handoff.
- `gw_play/`: campaign star-map play layer and battle progression UI.
- `gw_start/`: campaign creation/start flow, faction/cards/team setup.
- `gw_war_over/`: end-of-campaign summary and archive/restart handling.
- `shared/`: common GW helpers/spec transforms used across GW screens.

#### `ui/main/shared/`
Shared resources used across most scenes.
- `css/`: global/base styles and shared templates (`global.css`, etc.).
- `font/`: bundled UI fonts.
- `ico/`: platform app icons (includes `ico/osx` `.icns` set).
- `img/`: global art assets (buttons, backgrounds, badges, UI elements).
- `js/`: shared utility layer (`api` bridge stubs, helpers, localization, matchmaking/save helpers, etc.).
- `systems/`: bundled `.pas` system/map presets and contributor docs.
- `video/`: intro/cinematic `.webm` assets.
- `default_systems.json`: default starter systems loaded on boot.

#### `ui/main/uberbar/`
Persistent social/chat/party overlay bar.
- `uberbar.js` is a large Knockout view model for users, tags, chat, invites, and presence.

#### `ui/main/_i18n/`
Localization data.
- `locales/` has per-language folders (`en`, `de`, `ru`, `zh-CN`, etc.).
- Files are keyed per scene/domain (e.g., `start.json`, `server_browser.json`, `live_game.json`).

### `ui/mods/`
Legacy UI mod loader instructions.
- `readme.txt` documents `ui_mod_list.js`, `global_mod_list`, `scene_mod_list`, and expected `coui://` paths.

---

## `server-script/` (server/game-state JS)

Server-side Node-style scripts for lobby, state transitions, and simulation coordination.

### Root of `server-script/`
Core orchestration/config files.
- `main.js`: startup flags, server limits, mode toggles, state machine transitions.
- `server_utils.js`: message response/broadcast plumbing and client connection helpers.
- `sim_utils.js`: simulation helper surface.
- `content_manager.js`: required-content validation and client content checks.
- `chat_utils.js`: team/global chat routing with ally/spectator rules.
- `*_config.js` and `droplet_test_*`: test/benchmark/sandbox config presets.

### `server-script/lobby/`
Lobby-only logic modules.
- `color_manager.js`: color reservation/allocation and primary/secondary selection.
- `color_table.js`: color definitions.
- `commander_manager.js`: commander selection/ownership handling.
- `watchdog.js`: lobby watchdog/safety checks.

### `server-script/states/`
Finite-state handlers for the server lifecycle.
- `lobby.js`, `playing.js`, `game_over.js`, `replay.js`, `landing.js`, etc.
- Includes specialized suites: `benchmark*`, `sandbox*`, `neural_net*`, `droplet_test*`, `valgrind*`.
- `playing.js` is the core live-match state: control state, armies/players, diplomacy, surrender/defeat handling, and message handlers.

### `server-script/thirdparty/`
Bundled third-party libraries.
- `lodash.js`, `q.js`, `knockout.js` vendored for server-script usage.

---

## Practical orientation for humans/AI
- If you need **frontend screen behavior**, start in `ui/main/game/<scene>/` and its `.js` file.
- If you need **cross-scene helpers**, check `ui/main/shared/js/`.
- If you need **social overlay behavior**, inspect `ui/main/uberbar/uberbar.js`.
- If you need **server behavior/state flow**, begin with `server-script/main.js`, then `server-script/states/<state>.js`.
- If you need **lobby setup rules**, inspect `server-script/lobby/` modules.

---

## Notes
- This is a general architectural guide, not a strict API contract.
- File names and patterns are stable enough to use as navigation heuristics for new contributors or AI tools.
