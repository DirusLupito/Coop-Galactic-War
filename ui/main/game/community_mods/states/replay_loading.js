// (C)COPYRIGHT 2016-2021 Planetary Annihilation Inc. All rights reserved.

function CommunityMods() {
    model.gameType = ko.observable().extend({ session: 'game_type' });

    // check for ranked 1v1 loading replay issue

    if (model.gameType() == 'Ladder1v1') {
        model.clearHeartbeat();
        model.config('');

        model.transitDelay(3000);

        model.transitDestination('coui://ui/main/game/start/start.html?startMatchMaking=true');

        model.transitPrimaryMessage("!LOC:CONNECTION TO SERVER FAILED");

        model.transitSecondaryMessage("!LOC:Returning to Main Menu");

        window.location.href = 'coui://ui/main/game/transit/transit.html';
        return;
    }

    model.checkCompanionMods = function (mods) {

        var deferred = $.Deferred();

        CommunityModsManager.companionModIdentifiers(mods);

        var companionMods = CommunityModsManager.companionMods();

        if (companionMods.length > 0) {
            model.pageSubTitle(loc('!LOC:MOUNTING COMPANION MODS... PLEASE WAIT'));
            deferred = CommunityModsManager.activateCompanionMods();
        }
        else
            deferred.resolve();

        return deferred;
    }

    handlers.mods_info = function (payload) {
        if (payload && payload.length > 0 && window.gNoMods) {
            console.error("--nomods");
            model.handleDisconnect();
            return;
        }

        var gameModIdentifiers = _.map(payload, 'identifier');
        model.gameModIdentifiers(gameModIdentifiers);

        model.checkCompanionMods(gameModIdentifiers).always(function (results) {
            model.send_message('send_mods', {}, function (success, response) { });
        });
    }

    handlers.memory_files = function (msg) {
        console.log(msg);
        if (!msg['pa/units/unit_list.json']) {
            var playerUnitList = msg['/pa/units/unit_list.json.player'];
            var aiUnitList = msg['/pa/units/unit_list.json.ai'];

            var units = (playerUnitList && playerUnitList.units || []).concat(aiUnitList && aiUnitList.units || []);

            msg['/pa/units/unit_list.json'] = { units: units };

            console.log('community mods is adding combined unit_list.json');

        }

        api.game.getUnitSpecTag().then(function (tag) {
            if (tag === '') {
                var cookedFiles = _.mapValues(msg, function (value) {
                    if (typeof value !== 'string')
                        return JSON.stringify(value);
                    else
                        return value;
                });

                api.file.unmountAllMemoryFiles().always(function () {

                    api.file.mountMemoryFiles(cookedFiles).always(function () {

                        api.game.setUnitSpecTag('.player');

                        model.send_message('memory_files_received', {}, function (success, response) { });

                    });
                });
            }
        });
    };
}


function CommunityModsSetup() {

    if (!window.CommunityModsManager) {
        console.log('ERROR: community mods manager not loaded.');
    }


    api.file.unmountAllMemoryFiles = function () {
        console.log('Community Mods is preventing unmountAllMemoryFiles');
        sessionStorage.community_mods_reset_required = true;
        return $.Deferred().resolve();
    }

}

try {
    CommunityModsSetup();
}
catch (e) {
    console.trace(JSON.stringify(e));
}
