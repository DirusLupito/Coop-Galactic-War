// (C)COPYRIGHT 2016-2021 Planetary Annihilation Inc. All rights reserved.

// !LOCNS:community_mods

var communityModsDeferred;

function CommunityMods() {

    model.downloadsStatus = CommunityModsManager.downloadsStatus;
    model.hasDownloads = CommunityModsManager.hasDownloads;

    model.downloadsStyle = ko.computed(function () {
        return { backgroundColor: model.hasDownloads() ? 'rgba(255,255,255,0.1)' : 'transparent' };
    });

    model.downloadStyles = function (download) {
        return { width: download.contribution * 100 + '%', backgroundColor: download.retries ? '#8f0000' : 'transparent' };
    }

    model.downloadProgressStyles = function (download) {
        return { width: download.percent * 100 + '%' };
    }

    $('div.div_panel_bar_background').append('<div id="community-mods-progress" style="margin-top: 0px; width: 70%; margin-left: 15%; text-align: left; height: 15px; font-size: 10px; line-height: 150%; vertical-align: middle;" data-bind="style: downloadsStyle"><!-- ko foreach: downloadsStatus --><div class="download-status" data-bind="style: $root.downloadStyles($data)" style="position: relative; display: inline-block; overflow: hidden;"><div class="download-name" style="position: relative; z-index: 2; background-color: transparent; text-align: center; padding-left: 2px; white-space: nowrap;;" data-bind="text: file"></div><div class="download-progress" style="background-color: #007800; width: 0; height: 100%; position: absolute; top: 0; left: 0; z-index: 1; min-width: 1px;" data-bind="style: $root.downloadProgressStyles($data)"> </div></div><!-- /ko --></div>');

    model.navToDestination = function () {

        // navigate when mods are reset (if requried)

        communityModsDeferred.always(function () {
            window.location.href = model.transitDestination();
            /*
                        model.transitPrimaryMessage('');
                        model.transitSecondaryMessage('');
            */
        });
    };
}

function CommunityModsSetup() {

    const SERVER_MODS_STATUS = loc('!LOC:RESETTING SERVER MODS');
    const CLIENT_MODS_STATUS = loc('!LOC:UPDATING AND REMOUNTING ACTIVE CLIENT MODS');
    const OFFLINE_CLIENT_MODS_STATUS = loc('!LOC:REMOUNTING ACTIVE CLIENT MODS');
    const FILES_STATUS = loc('!LOC:UPDATING COMMUNITY MODS FILES');

    var transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });

    function updateStatus(status) {
        if (model && model.transitSecondaryMessage) {
            model.transitSecondaryMessage(status);
        }
        else {
            transitSecondaryMessage(status);
        }
    }

    var transitDestination = ko.observable().extend({ session: 'transit_destination' });

    // assume not required

    if (!transitDestination()) {
        transitDestination('coui://ui/main/game/start/start.html');
    }

    var lastSceneUrl = ko.observable().extend({ session: 'last_scene_url' });

    if (!window.CommunityModsManager) {
        console.log('ERROR: community mods manager not loaded.');
    }

    communityModsDeferred = $.Deferred();

    var destination = transitDestination() + '';

    var from = lastSceneUrl() + '';

    api.debug.log('transit to ' + destination + ' from ' + from);

    var start = Date.now();

    var downloadOfflineFilesDeferred = CommunityModsManager.downloadOfflineFiles();

    var returningToStart = destination.startsWith('coui://ui/main/game/start/start.html');
    var returningToServerBrowser = destination.startsWith('coui://ui/main/game/server_browser/server_browser.html');

    var leftLiveGame = from.startsWith('coui://ui/main/game/live_game/live_game.html');
    var leftNewGame = from.startsWith('coui://ui/main/game/new_game/new_game.html');

    // we could also do a check for mounted server mods here

    var offlineMode = CommunityModsManager.offlineMode();

    var resetRequired = (returningToStart || returningToServerBrowser || leftNewGame || leftLiveGame) && sessionStorage.community_mods_reset_required;

    if (resetRequired) {
        api.debug.log('resetting server mods');

        updateStatus(SERVER_MODS_STATUS);

        // reset server mods

        CommunityModsManager.resetServerMods().always(function (data) {
            if (offlineMode) {
                updateStatus(OFFLINE_CLIENT_MODS_STATUS);

                CommunityModsManager.remountClientMods().always(function () {
                    communityModsDeferred.resolve();
                });

                return;
            }

            updateStatus(CLIENT_MODS_STATUS);

            // true, true = update zip mods, download client zip mod, remount client mods and download server mod zip

            CommunityModsManager.updateActiveZipMods(true, true).always(function (data) {
                updateStatus(FILES_STATUS);

                downloadOfflineFilesDeferred.always(function (results) {
                    communityModsDeferred.resolve();
                });
            });
        });
    }
    else if (offlineMode) {
        updateStatus(OFFLINE_CLIENT_MODS_STATUS);

        CommunityModsManager.remountClientMods().always(function () {
            communityModsDeferred.resolve();
        });

        return;
    }
    else if (returningToStart) {

        updateStatus(CLIENT_MODS_STATUS);

        // true, true = update zip mods, download client zip mod, remount client mods and download server mod zip

        CommunityModsManager.updateActiveZipMods(true, true).always(function (data) {

            updateStatus(FILES_STATUS);

            downloadOfflineFilesDeferred.always(function (results) {
                communityModsDeferred.resolve();
            });
        });
    }
    else {
        updateStatus(FILES_STATUS);

        downloadOfflineFilesDeferred.always(function (results) {
            communityModsDeferred.resolve();
        });
    }


    communityModsDeferred.always(function (result) {
        console.log((Date.now() - start) / 1000 + ' seconds to transit done');
    });

}

try {
    CommunityModsSetup();
}
catch (e) {
    console.trace(JSON.stringify(e));
}
