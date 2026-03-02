// (C)COPYRIGHT 2016-2021 Planetary Annihilation Inc. All rights reserved.
// djr
// !LOCNS:community_mods

try {
    if (window.gActiveContent == 'PAExpansion1' && parseInt(window.gBuild) >= 113883) {
        var splash = document.getElementById('img_splash');
        splash.src = "coui://pa/ui/splash/splash.png";
    }
}
catch (e) {
    console.trace(JSON.stringify(e));
}

var COMMUNITY_MODS_TIMEOUT = 180;

var saved_debug_allow_logs = localStorage.debug_allow_logs;

var communityModsTimeout = false;

function communityModsTimedOut() {
    console.error('community mods timeout');

    CommunityModsDone();
}

function resetCommunityModsTimeout(clear) {
    if (communityModsTimeout)
        clearTimeout(communityModsTimeout);

    if (clear)
        communityModsTimeout = false;
    else
        communityModsTimeout = setTimeout(communityModsTimedOut, COMMUNITY_MODS_TIMEOUT * 1000);
}

function CommunityModsDone() {
    debuglog('Community Mods Done');

    var overlay = document.getElementById('splash_overlay');

    if (overlay)
        overlay.classList.add('splash_fading_in');

    if (communityModsTimeout) {
        clearTimeout(communityModsTimeout);
        communityModsTimeout = false;
    }

    api.debug.disableLogging();

    if (saved_debug_allow_logs)
        localStorage.debug_allow_logs = saved_debug_allow_logs;

    $('#game').attr('src', 'coui://ui/main/game/start/start.html');
    $('#uberbar').attr('src', 'coui://ui/main/uberbar/uberbar.html');
}

var downloadQueue = {};

function CommunityMods() {
    try {
        if (!window.CommunityModsManager) {
            CommunityModsDone();
            return;
        }

        model.communityModsStatus = ko.observable('');

        model.downloadsStatus = CommunityModsManager.downloadsStatus;
        model.hasDownloads = CommunityModsManager.hasDownloads;

        model.downloadsStyle = ko.computed(function () {
            return { backgroundColor: model.hasDownloads() ? 'rgba(0,0,0,0.2)' : 'transparent' };
        });

        model.downloadStyles = function (download) {
            return { width: download.contribution * 100 + '%', backgroundColor: download.retries ? '#8f0000' : 'transparent' };
        }

        model.downloadProgressStyles = function (download) {
            return { width: download.percent * 100 + '%' };
        }

        var cmmHideSplash = model.hideSplash;

        model.hideSplash = function () {
            $('#community-mods-status-container').hide();

            debuglog('Community Mods hide splash');

            if (model.splashHidden)
                return;

            model.splashHidden = true;

            var $splash_overlay = $('#splash_overlay');

            // splash img load event not firing causes black screen as splash never fades in
            if (!$splash_overlay.hasClass("splash_fading_in"))
                $splash_overlay.addClass('splash_fading_in')

            $splash_overlay.addClass('splash_start_fade_out');

            $("#img_splash").on('webkitAnimationEnd', function (evt) {
                if (evt.originalEvent.animationName === 'fadeOut') {
                    $(this).off(evt);

                    if (DEV_MODE || model.hasPlayedIntroOnce())
                        setLayoutMode(true);
                }
            });

            if (!DEV_MODE && !model.hasPlayedIntroOnce())
                model.playIntroVideo();
        };

        var cmmPlayVideo = model.playVideo;

        model.playVideo = function (video_url, callback) {
            setLayoutMode(false);

            cmmPlayVideo(video_url, callback);
        }

        $('#splash_overlay').prepend('<div id="community-mods-status-container" style="display: none; position:absolute; bottom: 60px; left: 20%; width: 60%; text-align: center; font-size: 24px;"><div id="community-mods-status" style="margin-bottom: 10px;" data-bind="text: communityModsStatus">LOADING COMMUNITY MODS</div><div id="community-mods-progress" style="text-align: left; height: 15px; font-size: 10px; line-height: 150%; vertical-align: middle;" data-bind="style: downloadsStyle"><!-- ko foreach: downloadsStatus --><div class="download-status" data-bind="style: $root.downloadStyles($data)" style="position: relative; display: inline-block; overflow: hidden;"><div class="download-name" style="position: relative; z-index: 2; background-color: transparent; text-align: center; padding-left: 2px; white-space: nowrap;;" data-bind="text: file"></div><div class="download-progress" style="background-color: #007800; width: 0; height: 100%; position: absolute; top: 0; left: 0; z-index: 1; min-width: 1px;" data-bind="style: $root.downloadProgressStyles($data)"> </div></div><!-- /ko --></div></div>');

        $('#community-mods-status-container').fadeIn();
    }
    catch (e) {
        console.error(e);
    }
}

function CommunityModsSetup() {
    const palobbyPrivacyUpdated = 1549456723125;

    if (!localStorage.getItem('data_storage_model'))
        localStorage.setItem('data_storage_model', '2.0');

    _.forEach(['pachat.zip', 'com.pa.mikeyh.gDisplayRank.zip', 'com.pa.mikeyh.gw-explorer.zip', 'com.pa.mikeyh.public-local-server.zip', 'com.pa.mikeyh.meteors-server.zip', 'com.pa.mikeyh.meteors-client.zip'], function (file) {
        api.download.delete(file);
    });

    var uberName = undefined;

    try {
        uberName = JSON.parse(localStorage.getItem('uberName') || '""');
    }
    catch (e) {
    }

    _.forEach(['com.pa.chat.disableAutoJoin', 'com.pa.chat.colour.self', 'com.pa.chat.disabled', 'community_mods_dev', 'info.nanodesu.alertsManager.excludedUnitSpecAlerts.create', 'info.nanodesu.alertsManager.excludedUnitSpecAlerts.destory', 'info.nanodesu.alertsManager.includedUnitSpecAlerts.create', 'info.nanodesu.alertsManager.includedUnitSpecAlerts.destroy', 'info.nanodesu.alertsManager.jumpKey', 'info.nanodesu.alertsManager.markKey', 'info.nanodesu.alertsManager.showCreatedAlerts', 'info.nanodesu.alertsManager.showDestroyedAlerts', 'info.nanodesu.pastats.autopauseenabled', 'info.nanodesu.pastats.isLocalGame', 'info.nanodesu.pastats.isRanked', 'info.nanodesu.pastats.team_index', 'info.nanodesu.pastats.team', 'info.nanodesu.pastats.version', 'pa_stats_game_link', 'pa_stats_is_local_game', 'pa_stats_is_ranked', 'pa_stats_loaded_planet_json', 'pa_stats_lobbyId', 'pa_stats_req_version', 'pa_stats_show_data_live', 'pa_stats_system', 'pa_stats_wants_to_send', 'alignChatLeft', 'gOptimiseUserTagMap_backupId', 'info.nanodesu.irc.height', 'info.nanodesu.irc.left', 'info.nanodesu.irc.top', 'info.nanodesu.irc.width', 'gPatchServerBrowser_ServerHostname', 'gPatchServerBrowser_ServerPort', 'gPatchServerBrowser_lobbyId', 'gPatchServerBrowser_local', 'gPatchServerBrowser_uberId', 'gUnitSelector_creatorUberId', 'gUnitSelector_gameHostname', 'gUnitSelector_gamePort', 'gUnitSelector_lobbyId', 'fr.mereth.pa.savefilters', 'uienhancements_serverbrowsersettings', 'lastSelectedGame', 'available_mods', 'availableMods', 'installedMods', 'community_mods_permission', 'community_mods_permission_timestamp'], function (key) {
        localStorage.removeItem(key);
    });

    if (uberName) {
        localStorage.removeItem(uberName + '.gOptimiseUserTagMap_backupId');
        localStorage.removeItem(uberName + 'gOptimiseUserTagMap_backupId');
    }

    for (var i = 0; i <= 10; i++) {
        localStorage.removeItem('gOptimiseUserTagMap_backup_' + i);

        localStorage.removeItem('gOptimiseUserTagMap_user_tag_map_backup_' + i);

        if (uberName) {
            localStorage.removeItem(uberName + '.gOptimiseUserTagMap_backup_' + i);
            localStorage.removeItem(uberName + '_gOptimiseUserTagMap_backup_' + i);
        }
    }

    var community_mods_dev = localStorage.getItem('community_mods_dev') == 'yes';

    api.debug.enableLogging();

    $('#game').attr('src', '');
    $('#uberbar').attr('src', '');

    $('#game').css('zIndex', -10999);

    $.holdReady(true);

    delete localStorage.community_mods_offline_mode;
    var offlineMode = false;

    if (!window.CommunityModsManager) {
        debuglog('ERROR: Community mods manager not loaded.');
    }

    $.holdReady(false);

    if (!window.CommunityModsManager) {
        CommunityModsDone();
        return;
    }

    var deferred = $.Deferred();

    try {
        function updateStatus(status) {
            debuglog(status);

            if (model && model.communityModsStatus)
                model.communityModsStatus(status);
        }

        var offlineMode = localStorage.community_mods_offline_mode;

        var start = Date.now();

        resetCommunityModsTimeout();

        // always call even in offline mode to update buildBarImageURLs

        var loadUnitsInfoDeferred = CommunityModsManager.loadUnitsInfo();

        CommunityModsManager.checkInstalledMods().always(function () {
            debuglog("MOOOOOOOOOOO CommunityModsManager.checkInstalledMods");

            CommunityModsManager.uninstallMod('com.pa.chat', false);
            CommunityModsManager.uninstallMod('com.pa.mikeyh.meteors-server', false);
            CommunityModsManager.uninstallMod('com.pa.mikeyh.meteors-client', false);

            // reset timeout with each download progress update

            CommunityModsManager.downloads.subscribe(function (downloadQueueStatus) {
                resetCommunityModsTimeout();
            });

            var downloadOfflineFilesDeferred;

            if (offlineMode)
                downloadOfflineFilesDeferred = $.Deferred().resolve();
            else
                downloadOfflineFilesDeferred = CommunityModsManager.downloadOfflineFiles();

            if (window.gNoMods) {
                updateStatus(loc('!LOC:MODS DISABLED BY --NOMODS'));

                downloadOfflineFilesDeferred.always(function () {
                    clearTimeout(communityModsTimeout);
                    CommunityModsDone();
                });

                return;
            }

            var updateFileSystemModsDeferred = CommunityModsManager.updateFileSystemMods();

            updateStatus(loc('!LOC:CHECKING FILE SYSTEM MODS'));

            updateFileSystemModsDeferred.always(function (results) {
                CommunityModsManager.updateInstalledMods();

                resetCommunityModsTimeout();

                var availalbleDeferred;

                if (offlineMode)
                    availalbleDeferred = $.Deferred().resolve();
                else {
                    updateStatus(loc('!LOC:UPDATING AVAILABLE MODS'));
                    availalbleDeferred = CommunityModsManager.loadAvailableMods();
                }

                // proceed even if we fail loading available mods (may have a cached version)

                availalbleDeferred.always(function (status) {
                    resetCommunityModsTimeout();

                    var classicTutorialInstalled = CommunityModsManager.installedModsIndex()['com.pa.mikeyh.classic-tutorial'];
                    if (classicTutorialInstalled && gActiveContent)
                        CommunityModsManager.uninstallMod('com.pa.mikeyh.classic-tutorial', false);
                    else if (!classicTutorialInstalled && !gActiveContent)
                        CommunityModsManager.installMod('com.pa.mikeyh.classic-tutorial', false);

                    var aiBugFixInstalled = CommunityModsManager.installedModsIndex()['com.pa.quitch.AIBugfixEnhancement'];
                    if (aiBugFixInstalled && !gActiveContent)
                        CommunityModsManager.uninstallMod('com.pa.quitch.AIBugfixEnhancement', false);

                    // Make sure that community chat is installed for all players (will only appear
                    // on second boot)
                    var communityChatInstalled = CommunityModsManager.installedModsIndex()['pachat'];
                    if (!communityChatInstalled){
                        CommunityModsManager.installMod('pachat', false);
                    }


                    if (offlineMode) {
                        resetCommunityModsTimeout();

                        updateStatus(loc('!LOC:MOUNTING CLIENT MODS IN OFFLINE MODE'));

                        CommunityModsManager.resetMods(true, true).always(function () {
                            debuglog((Date.now() - start) / 1000 + ' seconds to main done in offline mode');
                            deferred.resolve();
                        });

                        return;
                    }

                    updateStatus(loc('!LOC:UPDATING ACTIVE MODS'));

                    // update zip mods, download client zip mod, mount client mods and download server mod zip

                    CommunityModsManager.updateActiveZipMods(true, true).always(function (results) {
                        resetCommunityModsTimeout();

                        updateStatus(loc('!LOC:MOUNTING CLIENT MODS'));

                        downloadOfflineFilesDeferred.always(function (results) {
                            deferred.resolve();
                            debuglog((Date.now() - start) / 1000 + ' seconds to main done');

                        }).fail(function (results) {
                            console.error('downloadOfflineFiles failed in main');
                        });

                    }).fail(function (results) {
                        console.error('updateActiveZipMods failed in main');
                    });

                }).fail(function (status) {
                    console.error('loadAvailableMods failed in main with ' + status);
                });

            }).fail(function (results) {
                console.error('updateFileSystemMods failed in main');
            });
        });
    }
    catch (e) {
        debuglog(e);
        console.trace(JSON.stringify(e));
        deferred.resolve();
    }

    deferred.always(function (data) {
        CommunityModsDone();
    });

}

$(document).ready(function (){

    try {
        CommunityModsSetup();
    }
    catch (e) {
        debuglog(e);
        console.trace(JSON.stringify(e));

        CommunityModsDone();
    }
});
