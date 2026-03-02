// (C)COPYRIGHT 2016-2021 Planetary Annihilation Inc. All rights reserved.

// !LOCNS:community_mods

var communityModsLoaded;

function CommunityMods() {
    if (communityModsLoaded){
        return;
    }

    debuglog("START - CommunityMods() called");
    
    communityModsLoaded = true;

    const palobbyPrivacyUpdated = 1529947594985;

    if (!window.CommunityModsManager)
        return;

    model.communityModsOK = ko.observable(localStorage.getItem('community_mods_ok'));

    model.communityModsOKTimestamp = ko.observable(localStorage.getItem('community_mods_ok_timestamp') || 0);

    model.communityModsPolicyUpdated = ko.computed(function () {
        return model.communityModsOKTimestamp() < palobbyPrivacyUpdated;
    });

    model.communityModsShowMessage = ko.computed(function () {
        return model.communityModsOK() != 'yes' || model.communityModsPolicyUpdated();
    });

    model.communityModsConfirmed = function () {
        console.log('Community Mods OK');
        model.communityModsOK('yes');
        localStorage.setItem('community_mods_ok', 'yes');
        model.communityModsOKTimestamp(Date.now());
        localStorage.setItem('community_mods_ok_timestamp', Date.now());
    }

    model.openPaLobbyPrivacyPolicy = function () {
        engine.call('web.launchPage', 'https://palobby.com/privacy/');
    }

    model.openWebsite = function () {
        engine.call('web.launchPage', 'https://planetaryannihilation.com/');
    }

    model.openPaLobby = function () {
        engine.call('web.launchPage', 'https://palobby.com/');
    }

    model.openLegionExpansion = function () {
        engine.call('web.launchPage', 'https://exodusesports.com/article/legion-expansion-community-faction-mod/');
    }

    $('div.global_message_content').prepend('<div id="community-mods-messages" style="font-size:16px; position: absolute; bottom: 0; display: flex; flex-direction: column"></div>');

    // model.leaderboardReady(true);

    if (!model.updateUrl) {
        model.openNews = function () {
            engine.call('web.launchPage', 'https://planetaryannihilation.com/news/');
        }

        $('div.section_header.update').attr('data-bind', 'visible: showUpdate, click: openNews');
        $('div.section_post').attr('data-bind', 'visible: showUpdate, click: openNews');
    }

    model.showCommunityModsBusy = CommunityModsManager.busy;

    // navigate to community mods

    model.navToCommunityMods = function () {
        window.location.href = 'coui://ui/main/game/community_mods/community-mods.html';
        return;
    }

    model.linkToUnitsDatabase = function () {
        engine.call('web.launchPage', 'https://palobby.com/units/');
    }

    model.linkToGamesBrowser = function () {
        engine.call('web.launchPage', 'https://ggleaderboards.com/lobby/');
    }

    if (!model.openOfficialGuides) {
        model.openOfficialGuides = function () {
            engine.call('web.launchPage', 'https://planetaryannihilation.com/guides/');
        }

        $('#nav-system-designer').before('<div id="nav-official-guides" style="position:relative" class="nav_item nav_item_text btn_std_ix community-nav"><div style="float: right; padding-left: 10px; padding-top: 2px; font-family:\'Glyphicons Halflings\'">&#xe164;</div><div data-bind="click: openOfficialGuides, click_sound: \'default\', rollover_sound: \'default\'">' + loc('!LOC:OFFICIAL GUIDES') + '</div></div>');
    }

    if (!model.openOfficialDiscord) {
        model.openOfficialDiscord = function () {
            engine.call('web.launchPage', 'https://discord.gg/pa');
        }

        $('#nav-system-designer').before('<div id="nav-official-support" style="position:relative" class="nav_item nav_item_text btn_std_ix community-nav"><div style="float: right; padding-left: 10px; padding-top: 2px; font-family:\'Glyphicons Halflings\'">&#xe164;</div><div data-bind="click: openOfficialDiscord, click_sound: \'default\', rollover_sound: \'default\'">' + loc('!LOC:OFFICIAL DISCORD') + '</div></div>');
    }

    if (!model.openOfficialSupport) {
        $('#nav-system-designer').before('<div id="nav-official-support" style="position:relative" class="nav_item nav_item_text btn_std_ix community-nav"><div style="float: right; padding-left: 10px; padding-top: 2px; font-family:\'Glyphicons Halflings\'">&#xe164;</div><div data-bind="click: openOfficialSupport, click_sound: \'default\', rollover_sound: \'default\'">' + loc('!LOC:OFFICIAL SUPPORT') + '</div></div>');
    }

    model.openOfficialSupport = function () {
        engine.call('web.launchPage', 'https://planetaryannihilation.com/support/');
    }

    // $('#nav-discord').remove();

    // if (api.content.usingTitans())
    //     $( '#nav-replays' ).after( '<div id="nav-dedicated-server-replays" style="position:relative" class="nav_item nav_item_text btn_std_ix community-nav"><div style="float: right; padding-left: 10px; padding-top: 2px; font-family:\'Glyphicons Halflings\'">&#xe164;</div><div data-bind="click: openDedicatedServerReplays, click_sound: \'default\', rollover_sound: \'default\'">' + loc('!LOC:BIG GAME REPLAYS')+ '</loc></div></div>' );

    // add community mods menu item (visible once downloaded)

    $('#nav_quit').before('<div id="nav-community-mods" style="position:relative" class="nav_item nav_item_text btn_std_ix community-nav" data-bind="enabled: showCommunityModsBusy, click: navToCommunityMods, click_sound: \'default\', rollover_sound: \'default\'">' + loc('!LOC:COMMUNITY MODS') + ' <img id="community-mods-busy" style="position:absolute;top:10px;right:10px;width:20px;height:20px" class="img_loading_animation small working std" data-bind="visible: showCommunityModsBusy" src="coui://ui/main/shared/img/working.svg""/></div>');

    $('#nav_quit').before('<div id="nav-games-browser" style="position:relative" class="nav_item nav_item_text btn_std_ix community-nav"><div style="float: right; padding-left: 10px; padding-top: 2px; font-family:\'Glyphicons Halflings\'">&#xe164;</div><div data-bind="click: linkToGamesBrowser, click_sound: \'default\', rollover_sound: \'default\'">' + loc('!LOC:WEB GAMES BROWSER') + '</div></div>');

    $('#nav_quit').before('<div id="nav-unit-database" style="position:relative" class="nav_item nav_item_text btn_std_ix community-nav"><div style="float: right; padding-left: 10px; padding-top: 2px; font-family:\'Glyphicons Halflings\'">&#xe164;</div><div data-bind="click: linkToUnitsDatabase, click_sound: \'default\', rollover_sound: \'default\'">' + loc('!LOC:UNIT DATABASE') + '</div></div>');

    // $( '#nav_quit' ).before( '<div id="nav_support" style="position:relative" class="nav_item nav_item_text btn_std_ix community-nav"><div style="float: right; padding-left: 10px; padding-top: 2px; font-family:\'Glyphicons Halflings\'">&#xe164;</div><div data-bind="click: linkToSupportWiki, click_sound: \'default\', rollover_sound: \'default\'">' + loc('!LOC:COMMUNITY SUPPORT') + '</div></div>' );

    if (window.gNoMods) {
        $('#community-mods-messages').prepend('<div class="community-mods-message">' + loc('!LOC:MODS DISABLED BY --NOMODS') + '</div>');
    }

    model.linkToPAMM = function () {
        engine.call('web.launchPage', 'https://wiki.palobby.com/wiki/Obsolete_Planetary_Annihilation_Titans_%26_Classic_PA_Mod_Manager_PAMM');
    }

    model.showRanked = ko.computed(function () {
        return api.content.usingTitans() && !CommunityModsManager.pammDetected();
    });

    model.showLeague = model.showRank; // for backwards compatibility with mods

    if (CommunityModsManager.pammDetected()) {
        $('#community-mods-messages').prepend('<div class="community-mods-message error" data-bind="click: linkToPAMM"><span class="community-mods-text-block">' + loc('!LOC:TO PLAY 1V1 RANKED USE COMMUNITY MODS AND AVOID ISSUES <br />Please follow the wiki instructions to remove PAMM and your filesystem mods') + '</span><span class="community-mods-link-icon">&#xe164;</span></div>');
    }

    if (!localStorage.community_mods_mt_enabled) {
        localStorage.community_mods_mt_enabled = true;
        api.settings.set('server', 'multi_threading', 'ON'); api.settings.save();
    }

    // patch until next update

    // model.ladderSeasonText = ko.computed(function()
    // {
    //     return ['!LOC:Season ends __date__', { date: '2021-10-22 00:00 UTC' }];
    // });

    // model.leagueText = ko.computed(function()
    // {
    //     var league = model.league();

    //     var title = league == 1 ? 'Star': MatchmakingUtility.getTitle(league);

    //     return loc('!LOC:__rank_title__ Rank', { rank_title: title });
    // });

    model.rejoinGame = function () {
        model.showReconnect(false);

        model.gameHostname(null);
        model.gamePort(null);
        model.isLocalGame(false);
        model.serverType('uber');
        model.serverSetup(undefined);

        // try to set game type, mod identifiers and uuid if we have matching reconnect info

        var reconnectToGameInfo = model.reconnectToGameInfo();

        console.log('rejoinGame');
        console.log(JSON.stringify(reconnectToGameInfo));

        var gameType = undefined;
        var mods = undefined;
        var uuid = '';

        if (reconnectToGameInfo && reconnectToGameInfo.lobby_id == model.lobbyId() && reconnectToGameInfo.uberId == model.uberId()) {
            gameType = reconnectToGameInfo.type;
            mods = reconnectToGameInfo.mods;
            uuid = reconnectToGameInfo.uuid;
        }

        model.gameType(gameType);
        model.gameModIdentifiers(mods);
        model.uuid(uuid);

        var params = {
            content: model.reconnectContent(),
        };
        window.location.href = 'coui://ui/main/game/connect_to_game/connect_to_game.html?' + $.param(params);
    };

    var userSystemsChecked = false;

    function checkUserSystems() {
        console.log('Community Mods is checking user systems database');

        var request = indexedDB.open('misc', 1);

        request.onupgradeneeded = function (event) {
            console.log('Community Mods is creating user systems database object store');
            var db = event.target.result;
            db.createObjectStore('misc', { keyPath: 'db_key' });
        };

        request.onsuccess = function (event) {
            var db = event.target.result;

            if (db.objectStoreNames.length == 0) {
                console.log('Community Mods is deleting invalid user systems database with no object store');

                db.close();

                indexedDB.deleteDatabase('misc');

                if (userSystemsChecked) {
                    return;
                }

                userSystemsChecked = true;

                checkUserSystems();

                return;
            }

            var valid = [];

            var systems = localStorage.systems;

            var store = db.transaction(['misc'], 'readonly').objectStore('misc').openCursor().onsuccess = function (event) {
                var cursor = event.target.result;

                if (cursor) {
                    var value = cursor.value;

                    if (value.value) {
                        valid.push(value.db_key);
                    }

                    cursor.continue();
                }
                else {
                    var validCount = valid.length;

                    if (validCount == 0) {
                        console.log('Community Mods is creating empty users systems');

                        DataUtility.addObject('misc', []).then(function (db_key) {
                            if (db_key) {
                                localStorage.systems = db_key;
                            }
                        });

                        return;
                    }
                    else if (validCount == 1) {
                        var db_key = valid[0];

                        if (systems != db_key) {
                            localStorage.systems = db_key;
                            console.log('Community Mods fixed lost user systems database with key ' + db_key);
                        }
                    }
                    else {
                        console.log('Community Mods found multiple keys for user systems database');
                        console.log(JSON.stringify(valid));
                    }
                }
            };

            db.close();
        };
    }

    model.buildVersion(window.gVersion);
    model.buildVersion.valueHasMutated();

    if (model.buildVersionLocal) {
        model.buildVersionLocal(window.gVersion);
        model.buildVersionLocal.valueHasMutated();
    }

    checkUserSystems();
}

function CommunityModsSetup() {
    SPLASH_DELAY_SECONDS = 0;

    debuglog("CommunityModsSetup");

    if (!window.CommunityModsManager) {
        console.log('ERROR: CommunityModsManager not loaded');
    }

    $.holdReady(true);
    var start = Date.now();

    var deferred = $.Deferred();

    model.resetGame = function () {

    }

    debuglog("CommunityModsSetup 2");
    api.file.unmountAllMemoryFiles = function () {
        console.log('Community Mods is preventing unmountAllMemoryFiles');
    }

    // check uberbar once on startup without reload to set timestamps

    if (!sessionStorage['community_mods_started']) {
        api.debug.log('Community Mods startup');
        sessionStorage['community_mods_started'] = true;
        CommunityModsManager.checkUberbar(false);
        CommunityModsManager.checkInstalledMods();
    }

    // this is a backup just in case a reset was not done and bypassed transit

    if (sessionStorage.community_mods_reset_required) {
        // reset required
        CommunityModsManager.resetServerMods().always(function (data) {
            CommunityModsManager.remountClientMods().always(function (data) {
                delete sessionStorage.community_mods_reset_required;
                deferred.resolve();
            });
        });
    }
    else {
        deferred.resolve();
    }

    debuglog("CommunityModsSetup 3");
    deferred.always(function (results) {
        console.log("Community mods setup " + (Date.now() - start) / 1000 + ' seconds to startup ready');

        $.holdReady(false);

        CommunityModsManager.busy2(false);
    });
}

try {
    CommunityModsSetup();
}
catch (e) {
    console.trace(JSON.stringify(e));
    $.holdReady(false);
}
