# Planetary Annihilation TITANS: `ui` + `server-script` Folder Guide

This guide explains what the subfolders generally do, based on reading representative files in each area.
Additionally, it contains notes for human and AI developers.

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
- `gw_campaign_loading/`: co-op campaign client staging/loading scene before entering `gw_play`.
- `gw_campaign_restart_loading/`: co-op campaign restart staging scene used when returning from a campaign battle.
- `gw_lobby/`: campaign battle staging lobby and readiness/config handoff.
- `gw_play/`: campaign star-map play layer and battle progression UI.
- `gw_reconnect_loading/`: Galactic War reconnect staging scene that prepares mounted content before `live_game`.
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
- When making new changes, ensure that the python script `generate_mod.py` is up to date with all files touched.
- Agents should not run `generate_mod.py`.
- When writing code, do not try to silently succeed and ignore non-critical errors. Consider the following block of code:
```javascript
    var normalizeHumanArmiesForSharedControl = function(config, connectedClients) {
        if (!config || !_.isArray(config.armies))
            return;

        var humanTemplate;
        _.forEach(config.armies, function(army) {
            if (!humanTemplate && !armyHasAI(army))
                humanTemplate = army;
        });

        if (!humanTemplate)
            return;

        var baseSlot = _.find(humanTemplate.slots || [], function(slot) {
            return slot && !slot.ai;
        }) || { name: 'Player' };
        var playerCount = Math.max(1, connectedClients.length);
        var inserted = false;
        var splitArmies = _.map(_.range(0, playerCount), function(index) {
            var slot = _.clone(baseSlot);
            delete slot.client;
            delete slot.ai;

            return {
                slots: [slot],
                color: getColorPairForPlayerArmy(index, humanTemplate.color),
                econ_rate: _.has(humanTemplate, 'econ_rate') ? humanTemplate.econ_rate : 1,
                spec_tag: humanTemplate.spec_tag || '.player',
                alliance_group: humanTemplate.alliance_group || 1
            };
        });

        config.armies = _.reduce(config.armies, function(result, army) {
            if (!armyHasAI(army)) {
                if (!inserted) {
                    result = result.concat(splitArmies);
                    inserted = true;
                }
                return result;
            }

            result.push(army);
            return result;
        }, []);

        console.log('[GW COOP] - unshared control enabled; split humans into ' + splitArmies.length + ' allied armies');
    };
```
- When written this way, the code works, but it silently bypasses a couple of failures in an effort to guarantee that it doesn't crash. Consider the case when `connectedClients` is null. This code will not fail, and instead generate a single army when multiple should have been generated. The source of this strange generate would be harder to track down than if the code had just crashed and printed a message to the log. Similar problems also exist in this snippet, like with `baseSlot` defaulting to `{ name: 'Player' }` if no human slot can be found in what should be a human army. Moreover, this code fails to take into account PA specific knowledge, like how a human army will never have AI slots in it as AIs cannot share armies with human players. A better version of this same code is given below:
```javascript
    var normalizeHumanArmiesForSharedControl = function(config, connectedClients) {
        if (!config || !_.isArray(config.armies)) {
            return;
        }

        if (!connectedClients || !_.isArray(connectedClients) || connectedClients.length === 0) {
            console.log('[GW COOP] No connected clients found.');
            return;
        }

        var humanArmyCount = 0;

        // Figure out which army is the one in normal GW that would be marked
        // as the human player (so we can then use it as a template to create more armies).
        var humanTemplate;
        _.forEach(config.armies, function(army) {
            if (!armyHasAI(army)) {
                humanTemplate = army;
                humanArmyCount++;
            }
        });

        if (humanArmyCount !== 1) {
            console.log('[GW COOP] Expected exactly one human army, found ' + humanArmyCount + '.');
            return;
        }

        if (!humanTemplate) {
            console.log('[GW COOP] No human player template found.');
            return;
        }

        var baseSlot = humanTemplate.slots && humanTemplate.slots[0];

        if (!baseSlot) {
            console.log('[GW COOP] No valid base slot found.');
            return;
        }

        // Create a new army for each connected client.
        var splitArmies = _.map(_.range(0, connectedClients.length), function(index) {
            var slot = _.cloneDeep(baseSlot);
            // Slots will be assigned to specific clients later in startGame().
            delete slot.client;
            delete slot.ai;
            delete slot.name;

            return {
                slots: [slot],
                // I assume here that humanTemplate.color is both a valid color and the main faction color.
                color: getColorPairForPlayerArmy(index, humanTemplate.color),
                econ_rate: _.has(humanTemplate, 'econ_rate') ? humanTemplate.econ_rate : 1,
                spec_tag: humanTemplate.spec_tag || '.player',
                alliance_group: humanTemplate.alliance_group
            };
        });

        config.armies = _.reduce(config.armies, function(result, army) {
            if (!armyHasAI(army)) {
                return result.concat(splitArmies);
            }

            result.push(army);
            return result;
        }, []);

        console.log('[GW COOP] - unshared control enabled; split humans into ' + splitArmies.length + ' allied armies');
    };
```
- In general, the idea of the new version of the code is that crashing with an informative log message is preferable to succeeding in a mysterious way, as such successes can lead to mysterious and difficult to debug issues.
- Related to this, if you are using an LLM, do not "vibecode". LLMs can be used to assist and enhance the development process, but any code generated should be very carefully reviewed before use (honestly the exact same thing is true for human written code. Code in general should be reviewed carefully). It is the responsibility of the developer using the LLM to ensure that the generated code is correct and follows best practices.
