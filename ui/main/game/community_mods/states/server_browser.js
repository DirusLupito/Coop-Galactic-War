// (C)COPYRIGHT 2016-2021 Planetary Annihilation Inc. All rights reserved.

function CommunityModsSetup() {
    if (!window.CommunityModsManager) {
        console.log('ERROR: community mods manager not loaded.');
    }
}

function CommunityMods() {
    model.gamesFilter = ko.observable({}).extend({ session: 'games_filter' });

    model.gameFilterTimeout = false;

    model.loadGamesFilter = function () {
        var modsurl = gModsUrl;
        $.getJSON(modsurl + 'api/filter').done(function (data) {
            model.gamesFilter(data);
        });

        model.gameFilterTimeout = setTimeout(model.loadGameFilter, 60000);
    }

    model.loadGamesFilter();

    model.filteredGameList = ko.computed({
        read: function () {
            var allGames = model.allGames();
            var filteredGames = [];
            var selectedGameStillVisible = false;
            var cheats_ok = model.showCheatServers();
            var visible = model.visibleLobbyIds();
            var filterRetired = model.filterRetiredGames();

            var gamesFilter = model.gamesFilter();

            _.forEach(allGames, function (game) {
                var retired = false;

                // Check for valid game
                if (!game)
                    return;

                if (!game.max_players && (!game.players && game.mode !== 'Waiting'))
                    retired = true;

                if (model.bountyModeFilter() !== 'any') {
                    if (!!game.bounty_mode && model.bountyModeFilter() === 'notBountyMode') {
                        retired = true;
                        visible[game.lobby_id] = false;
                    }

                    if (!game.bounty_mode && model.bountyModeFilter() === 'bountyMode') {
                        retired = true;
                        visible[game.lobby_id] = false;
                    }
                }

                // Check for valid game state
                var started = game.started;
                if (model.gameStateFilter() !== 'any') {
                    if (model.gameStateFilter() === 'inlobby' && started)
                        retired = true;

                    if (model.gameStateFilter() === 'inprogress' && !started)
                        retired = true;
                }

                var can_play = game.players < game.max_players;
                var can_spectate = game.spectators < game.max_spectators;
                if (model.gameStatusFilter() !== 'any') {
                    if (!can_play && model.gameStatusFilter() === 'canplay')
                        retired = true;
                    if (!can_spectate && model.gameStatusFilter() === 'canspectate')
                        retired = true;
                    if (!can_play && !can_spectate && model.gameStatusFilter() === 'canjoin')
                        retired = true;
                }

                var ffa = game.mode === 'FreeForAll';
                if (model.gameModeFilter() !== 'any') {
                    if (ffa && model.gameModeFilter() === 'teamarmies')
                        retired = true;
                    if (!ffa && model.gameModeFilter() === 'freeforall')
                        retired = true;
                }

                // Check for valid number of planets
                var planets = game.planet_count;
                if (model.planetCountMinFilter() !== 'any')
                    if (planets < Number(model.planetCountMinFilter()))
                        retired = true;

                if (model.planetCountMaxFilter() !== 'any')
                    if (planets > Number(model.planetCountMaxFilter()))
                        retired = true;

                // Check for valid number of players
                var players = game.max_players;
                if (model.playerCountMinFilter() !== 'any')
                    if (players < Number(model.playerCountMinFilter()))
                        retired = true;

                if (model.playerCountMaxFilter() !== 'any')
                    if (players > Number(model.playerCountMaxFilter()))
                        retired = true;

                // Check for lobby tag
                var tag = game.tag;
                if (model.gameTagFilter() !== 'any' && tag !== model.gameTagFilter())
                    retired = true;

                var locked = game.locked;
                if (model.lockedFilter() !== 'any') {
                    if (locked && model.lockedFilter() !== 'locked')
                        retired = true;
                    if (!locked && model.lockedFilter() !== 'open')
                        retired = true;
                }

                // Check for modded servers
                var modded = game.mod_names.length > 0;
                var mod_match;
                var reject_modded_games = model.moddedGameFilter() === 'notModded';
                var reject_normal_games = model.moddedGameFilter() === 'modded';

                if (model.moddedGameFilter() !== 'any') {

                    if (reject_modded_games || reject_normal_games) {
                        if (reject_modded_games && modded)
                            retired = true;

                        if (reject_normal_games && !modded)
                            retired = true;
                    }
                    else {
                        mod_match = _.any(game.mod_names, function (element) {
                            return element === model.moddedGameFilter();
                        });

                        if (!mod_match)
                            retired = true;
                    }
                }

                // Check for cheat servers
                if (game.cheats_enabled && !cheats_ok)
                    retired = true;

                // Check for matching regions
                if (model.regionFilter() !== 'any')
                    if (model.regionFilter() !== game.region)
                        retired = true;

                // Look for games matching the search string
                if (model.searchFilter().length > 0)
                    if (game.searchable.indexOf(model.searchFilter().toUpperCase()) === -1)
                        retired = true;

                var kill = gamesFilter[game.uuid];

                if (kill && kill == game.lobby_id)
                    retired = true;

                game.retired = retired;

                var sortPrefix = '0';

                if (game.sandbox)
                    sortPrefix = '2';
                else if (game.mode == 'Waiting')
                    sortPrefix = '4';
                else if (game.locked)
                    sortPrefix = '3';

                game.sort = sortPrefix + game.timestamp;

                // Is this the currently selected game? If so, we need to retain the selection
                if (model.currentSelectedGame() && game.uuid === model.currentSelectedGame().uuid) {
                    selectedGameStillVisible = true;
                    model.currentSelectedGame(game);
                }

                if (!retired)
                    visible[game.lobby_id] = true;

                if (!retired || !filterRetired && visible[game.lobby_id])
                    filteredGames.push(game);
            });

            model.visibleLobbyIds.valueHasMutated();

            if (!selectedGameStillVisible)
                model.setSelected(null);

            return _.sortBy(filteredGames, 'sort');

        }, deferEvaluation: true
    });

    var cmProcessGameBeaon = model.processGameBeacon;

    if (!model.modIcons)
        model.modIcons = {};

    model.modIcons["com.pa.ferretmaster.bugs"] = { title: 'Bugs Faction', img: 'https://github.com/Ferret-Master/Bug-Faction/blob/main/bugs_icon.png?raw=true'};
    model.modIcons['com.pa.legion-expansion-server'] = { title: 'Legion Expansion', img: 'coui://download/community-mods-legion-icon.png' };
    model.modIcons['com.pa.legion-expansion-server-balance'] = { title: 'Legion Expansion Balance', img: 'coui://download/community-mods-legion-icon.png' };
    model.modIcons['com.pa.legion-expansion-server-master'] = { title: 'Legion Expansion Master', img: 'coui://download/community-mods-legion-icon.png' };
    model.modIcons['pa.mla.unit.addon'] = { title: 'MLA Units Addon', img: 'https://raw.githubusercontent.com/Anonemous2/pa.mla.unit.addon/master/server-browser-icon.png' };

    var usingTitans = api.content.usingTitans();

    model.processGameBeacon = function (beacon, region, lobby_id, host, port) {
        var game = cmProcessGameBeaon(beacon, region, lobby_id, host, port);

        var icons = [];

        if (game.titans) {
            if (!usingTitans)
                icons.push({ title: 'Titans Expansion', img: 'coui://download/community-mods-titans-icon.png' });
        }
        else if (usingTitans)
            icons.push({ title: 'Classic PA', img: 'coui://download/community-mods-classic-icon.png' });

        var mods = game.mod_identifiers;

        var count = mods && mods.length;

        if (count > 0) {
            for (var i = 0; i < count; i++) {
                var identifier = mods[i];

                var icon = model.modIcons[identifier];

                if (icon)
                    icons.push(icon);
            }
        }

        game.icons = icons;

        return game;
    }

    /*
    model.isDedicatedServer = ko.computed(function () {
        var currentSelectedGame = model.currentSelectedGame();

        if (!currentSelectedGame)
            return false;

        return _.startsWith(currentSelectedGame.region.toLowerCase(), 'custom');
    });

    model.openDedicatedServersLink = function () {
        engine.call('web.launchPage', 'https://planetaryannihilation.com/dedicated-server-rules-and-guidelines/');
    }
    */

    $('#game-list div.game').replaceWith('<div class="col-md-3 game"><span data-bind="text: name"></span><div class="game-icons" data-bind="foreach: icons"><img data-bind="attr: { src: img }"/></div>');

    $('#detail-pane-wrapper div.lbl_titans').remove();

    // $('#detail-pane-wrapper div.col-mode').before('<a style="display: none; color: #0f0;" class="col-game-privacy" data-bind="visible: $root.isDedicatedServer, click: $root.openDedicatedServersLink, click_sound: \'default\', rollover_sound: \'default\'">Planetary Annihilation Inc<br />Fast Dedicated Server</a>');

    // $( '#detail-pane-wrapper div.col-mode').before('<div class="col-game-icons" data-bind="foreach: icons"><div><img data-bind="attr: { src: img }"/><span data-bind="text: title"</div></div>');

    //     handlers.update_beacon = function (payload)
    //     {
    //         console.log( payload) ;

    //         if (!payload || !payload.beacon)
    //             return;

    //         var beacon = payload.beacon;
    //         var version = payload.version;
    //         var host = payload.host;
    //         var port = payload.port;

    //         // we now use the uuid as lobby_id

    //         var uuid = beacon.uuid;

    //         beacon.server_type = 'local';

    //         var game = null;

    //         if (payload.version == model.buildVersion())
    //             game = model.processGameBeacon(beacon, 'Local', uuid, host, port);

    //         var currentLanGames = model.lanGameList();

    //         var foundIt = false;

    //         for (var i=0; i<currentLanGames.length; i++)
    //         {
    //             var current = currentLanGames[i];
    //             if (current.host == host && current.port == port)
    //             {
    //                 if (game)
    //                     currentLanGames[i] = game;
    //                 else
    //                     currentLanGames.splice(i);
    //                 foundIt = true;
    //                 break;
    //             }
    //         }

    //         if (!foundIt && game)
    //             currentLanGames.push(game);

    //         model.lanGameList.valueHasMutated();
    //     }

    //     handlers.new_beacon = function (payload)
    //     {
    //         handlers.update_beacon(payload);
    //     }

    //     handlers.lost_beacon = function (payload)
    //     {
    //         // really need to include the port in payload to support multiple servers on LAN

    //         if (!payload || !payload.host)
    //             return;

    //         var host = payload.host;

    //         var currentLanGames = model.lanGameList();

    //         for (var i=0; i<currentLanGames.length; i++)
    //         {
    //             if (currentLanGames[i].host == host)
    //             {
    //                 currentLanGames.splice(i);
    //                 break;
    //             }
    //         }

    //         model.lanGameList(currentLanGames);
    //     }
}

try {
    CommunityModsSetup();
}
catch (e) {
    console.trace(JSON.stringify(e));
}