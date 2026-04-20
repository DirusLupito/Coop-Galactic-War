// (C)COPYRIGHT 2016-2021 Planetary Annihilation Inc. All rights reserved.

function CommunityMods() {
    var action = $.url().param('action');
    var loadpath = $.url().param('loadpath');

    var start = action === 'start';

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

    model.companionModsChecked = ko.observable(false);
    // Track processed identifiers because required mod lists can arrive in
    // multiple waves during connect/reconnect and we want idempotent handling.
    model.checkedCompanionModIdentifiers = ko.observableArray([]);
    model.checkedClientModIdentifiers = ko.observableArray([]);

    // Bullshit vibecode that shouldn't be necessary but the AI really likes to be super safe...
    // ... and I don't feel like reworking the whole flow to be less safe.
    var normalizeIdentifiers = function (identifiers) {
        return _.chain(identifiers || [])
            .filter(function (identifier) {
                return _.isString(identifier) && identifier.length > 0;
            })
            .uniq()
            .sortBy()
            .value();
    };

    var finishClientModActivation = function () {
        if (ko.isObservable(model.clientModsActivating))
            model.clientModsActivating(false);

        // server_state in base connect_to_game is paused while activation runs.
        // If a redirect already arrived, continue immediately once we're done.
        if (model.redirectURL && _.isString(model.redirectURL()) && model.redirectURL() !== window.location.href) {
            window.location.href = model.redirectURL();
            return;
        }
    };

    // Standard companion-mod path: map required server mod identifiers to
    // declared client companions and activate those companions.
    model.checkCompanionMods = function (companionMods) {
        var deferred = $.Deferred();
        var incomingIdentifiers = normalizeIdentifiers(companionMods);
        var checkedIdentifiers = model.checkedCompanionModIdentifiers();
        var identifiersToCheck = _.difference(incomingIdentifiers, checkedIdentifiers);

        if (identifiersToCheck.length === 0)
            deferred.resolve();
        else {
            model.companionModsChecked(true);
            model.checkedCompanionModIdentifiers(_.union(checkedIdentifiers, identifiersToCheck));

            CommunityModsManager.companionModIdentifiers(_.union(CommunityModsManager.companionModIdentifiers(), identifiersToCheck));

            var companionMods = CommunityModsManager.companionMods();

            if (companionMods.length > 0) {
                model.pageSubTitle(loc('!LOC:MOUNTING COMPANION MODS... PLEASE WAIT'));
                deferred = CommunityModsManager.activateCompanionMods();
            }
            else
                deferred.resolve();
        }

        return deferred;
    }

    // Direct client-mod path for GW transport: if required identifiers are
    // themselves client mods, install/enable them and remount client content.
    model.activateRequiredClientMods = function (requiredMods) {
        var deferred = $.Deferred();

        if (!window.CommunityModsManager) {
            deferred.resolve();
            return deferred;
        }

        var incomingIdentifiers = normalizeIdentifiers(requiredMods);
        var checkedIdentifiers = model.checkedClientModIdentifiers();
        var identifiersToCheck = _.difference(incomingIdentifiers, checkedIdentifiers);

        if (identifiersToCheck.length === 0) {
            deferred.resolve();
            return deferred;
        }

        model.checkedClientModIdentifiers(_.union(checkedIdentifiers, identifiersToCheck));

        CommunityModsManager.ready().always(function () {
            var installedModsIndex = CommunityModsManager.installedModsIndex();
            var availableModsIndex = CommunityModsManager.availableModsIndex();
            var changed = false;

            _.forEach(identifiersToCheck, function (identifier) {
                var installedMod = installedModsIndex[identifier];
                var availableMod = availableModsIndex[identifier];
                var mod = installedMod || availableMod;

                // Ignore non-client identifiers here; they are handled by
                // server-mod download/mount flow elsewhere.
                if (!mod || mod.context !== 'client')
                    return;

                if (!installedMod && _.isFunction(CommunityModsManager.installMod)) {
                    if (CommunityModsManager.installMod(identifier, false)) {
                        changed = true;
                        installedModsIndex = CommunityModsManager.installedModsIndex();
                        installedMod = installedModsIndex[identifier];
                    }
                }

                if (availableMod && _.isFunction(CommunityModsManager.evaluateDependencies)) {
                    var dependencies = CommunityModsManager.evaluateDependencies(availableMod);
                    if (dependencies) {
                        _.forEach(dependencies.needsInstall, function (dependencyIdentifier) {
                            if (_.isFunction(CommunityModsManager.installMod)
                                && CommunityModsManager.installMod(dependencyIdentifier, true)) {
                                changed = true;
                            }
                        });

                        _.forEach(dependencies.needsEnable, function (dependencyIdentifier) {
                            if (_.isFunction(CommunityModsManager.enableMod)
                                && CommunityModsManager.enableMod(dependencyIdentifier, true)) {
                                changed = true;
                            }
                        });
                    }
                }

                if (installedMod && !installedMod.enabled && _.isFunction(CommunityModsManager.enableMod)) {
                    if (CommunityModsManager.enableMod(identifier, false))
                        changed = true;
                }
            });

            if (!changed) {
                // Nothing new to install/enable for this wave.
                deferred.resolve();
                return;
            }

            sessionStorage.community_mods_reset_required = true;
            model.pageSubTitle(loc('!LOC:MOUNTING COMPANION MODS... PLEASE WAIT'));

            var mountResult = _.isFunction(CommunityModsManager.updateActiveZipMods)
                // true,false => remount client mods now, avoid server zip refresh.
                ? CommunityModsManager.updateActiveZipMods(true, false)
                : CommunityModsManager.remountClientMods();

            mountResult.always(function () {
                deferred.resolve();
            });
        });

        return deferred;
    }

    model.ensureClientModsForGame = function (requiredMods) {
        var deferred = $.Deferred();

        // Single gate used by base connect_to_game redirect logic.
        if (ko.isObservable(model.clientModsActivating))
            model.clientModsActivating(true);

        $.when(model.checkCompanionMods(requiredMods), model.activateRequiredClientMods(requiredMods)).always(function () {
            finishClientModActivation();
            deferred.resolve();
        });

        return deferred;
    }

    // patch until next update

    model.fail = function (primary, secondary) {
        model.reconnectToGameInfo(false);

        var connectFailDestination = ko.observable().extend({ session: 'connect_fail_destination' });

        var transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
        var transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
        var transitDestination = ko.observable().extend({ session: 'transit_destination' });
        var transitDelay = ko.observable().extend({ session: 'transit_delay' });

        transitPrimaryMessage(primary);
        transitSecondaryMessage(secondary || loc("!LOC:Returning to Main Menu"));
        transitDestination(connectFailDestination() || 'coui://ui/main/game/start/start.html');
        transitDelay(5000);
        window.location.href = 'coui://ui/main/game/transit/transit.html';
        return; /* window.location.href will not stop execution. */
    };

    model.connectToGame = function () {
        if (model.connectionAttemptsRemaining != model.connectionAttempts())
            model.pageSubTitle(loc("!LOC:ATTEMPTS REMAINING: __num_attempts_remaining__", { num_attempts_remaining: model.connectionAttemptsRemaining }));
        else
            model.pageSubTitle('');
        model.connectionAttemptsRemaining--;
        model.connecting(true);
        return api.net.connect(
            {
                host: model.gameHostname(),
                port: model.gamePort(),
                displayName: model.displayName() || 'Player',
                ticket: model.gameTicket(),
                clientData: model.clientData(),
                content: model.gameContent(),
                lobby_id: model.lobbyId(),
                steamId: model.gameSteamId()
            });
    };

    // patches

    handlers.downloading_mod_data = function (payload) {
        api.debug.log('downloading_mod_data: ' + JSON.stringify(payload));

        if (_.size(payload) > 0) {
            sessionStorage.community_mods_reset_required = true;

            var gameModIdentifiers = _.map(payload, 'identifier');

            var regex = new RegExp(atob('KC4qY3VsdHVyZVwudmcuKnwuKmluc29tbmlhLip8Lipjb3NtaWN3YXIuKnwuKmNvc21pYyB3YXIuKnwuKmljeWNhbG0uKnwuKnJvYm9tb28uKik='), 'gi');

            if (_.any(payload, function (mod) {
                return regex.test(mod.identifier) || regex.test(mod.display_name) || regex.test(mod.author);
            })) {
                model.cancelling(true);
                model.fail(loc("!LOC:CONNECTION TO SERVER FAILED"));
                return;
            }
            console.log("DOWNLOADING");

            model.gameModIdentifiers(gameModIdentifiers);
            model.pageSubTitle(loc('!LOC:DOWNLOADING SERVER MODS'));

            // Kick off companion + direct client activation as soon as required
            // identifiers are known, before gameplay scene redirect proceeds.
            model.ensureClientModsForGame(gameModIdentifiers);
        }
    }
}

function CommunityModsSetup() {
    var MOUNTING_SERVER_MODS_STATUS = loc('!LOC:MOUNTING SERVER MODS');

    sessionStorage.community_mods_reset_required = true;

    if (!window.CommunityModsManager) {
        console.log('ERROR: community mods manager not loaded.');
    }

    // patch until next update

    api.net.startGame = function (region, mode, startParams) {
        var result;

        api.debug.log('api.net.startGame ' + region + ' ' + mode + ' ' + startParams);

        if (region === 'Local' || !region) {
            var prefix = '';
            result = $.when(prefix).then(function (data) {

                api.debug.log(data);
        
                var localMultiThread = ko.observable().extend({ session: 'use_local_server_multi_threading' });
                
                var localDisableUPNP = ko.observable().extend({ session: 'server_disable_upnp' })();
                if (startParams && startParams['disable_upnp'])
                    localDisableUPNP = true;

                var localSteamNetworking = false;
                if (startParams && startParams['enable_steam_networking'])
                    localSteamNetworking = true;
                var lobbyEnableSteam = ko.observable().extend({ session: 'lobby_enable_steam_networking' })();
                if (lobbyEnableSteam)
                    localSteamNetworking = true;

                // If Steam P2P is disabled in settings, force it off
                if (!api.net.enableSteamP2P())
                    localSteamNetworking = false;

                var networkFlags = (localDisableUPNP ? 1 : 0) | (localSteamNetworking ? 2 : 0);
                return engine.asyncCall('localserver.startGame', mode, localMultiThread(), networkFlags, data);
            });
        }
        else
            result = engine.asyncCall('ubernet.startGame', region, mode);

        return result.then(function (rawData) {
            api.debug.log(rawData);
            var data = JSON.parse(rawData);

            if (_.has(data, 'ErrorCode') && data.ErrorCode === 0 && data.Message == 'internal server error') {
                data.ErrorCode = 202;
            }

            return data;
        });
    };

    api.net.startReplay = function (region, mode, replayId) {
        console.log('startReplay2 ' + mode + ' ' + replayId);

        var forwardLoadGame = ko.observable().extend({ session: 'load_game' });
        forwardLoadGame(_.endsWith(mode, 'loadsave'));

        return engine.asyncCall('ubernet.startReplay', region, mode, replayId).then(function (rawData) {
            api.debug.log(rawData);
            return JSON.parse(rawData);
        }, function (rawData) {
            var data = JSON.parse(rawData);

            if (_.has(data, 'ErrorCode') && data.ErrorCode === 0 && data.Message == 'internal server error') {
                data.ErrorCode = 202;
            }

            return data;
        });
    };

    // normal handling

    var oldStartGame = api.net.startGame;

    api.net.startGame = function (region, mode, startParams) {

        // check gNoMods and no server mods for gw

        if (window.gNoMods || mode.substr(-2, 2).toLowerCase() == 'gw') {
            model.gameModIdentifiers([]);
            model.companionModsChecked(true);
            model.needsServerModsUpload(false);
            return oldStartGame(region, mode, startParams);
        }

        var deferred = $.Deferred();

        CommunityModsManager.ready().always(function () {
            var activeServerModIdentifiers = CommunityModsManager.activeServerModIdentifiersToMount();

            var regex = new RegExp(atob('KC4qY3VsdHVyZVwudmcuKnwuKmluc29tbmlhLip8Lipjb3NtaWN3YXIuKnwuKmNvc21pYyB3YXIuKnwuKmljeWNhbG0uKnwuKnJvYm9tb28uKik='), 'gi');

            if (_.any(activeServerModIdentifiers, function (modIdentifier) {
                return regex.test(modIdentifier);
            })) {
                model.fail(loc("!LOC:CONNECTION TO SERVER FAILED"));
                return;
            }

            var hasActiveServerMods = activeServerModIdentifiers.length > 0;

            model.gameModIdentifiers(activeServerModIdentifiers);

            model.checkCompanionMods(activeServerModIdentifiers).always(function (result) {
                if (hasActiveServerMods) {
                    model.pageSubTitle(MOUNTING_SERVER_MODS_STATUS);
                }

                CommunityModsManager.mountServerMods().always(function (result) {
                    oldStartGame(region, mode, startParams).always(function (data) {
                        deferred.resolve(data);
                    }, function (data) {
                        deferred.reject(data);
                    });
                });
            });
        });

        return deferred;
    };

    var oldConnect = api.net.connect;

    api.net.connect = function (params) {
        if (params && (new RegExp(atob('KDEwN1wuMTU1XC44NFwuLit8LipjdWx0dXJlLnZnLip8LippbnNvbW5pYS4qfC4qY29zbWljd2FyLiop'), 'gi')).test(params.host)) {
            model.fail(loc("!LOC:CONNECTION TO SERVER FAILED"));
            return;
        }

        if (window.gNoMods) {
            model.needsServerModsUpload(false);
            return oldConnect(params);
        }

        var serverSetup = model.serverSetup();

        if (serverSetup == 'loadreplay' || serverSetup == 'loadsave')
            return oldConnect(params);

        var deferred = $.Deferred();

        CommunityModsManager.ready().always(function () {
            CommunityModsManager.checkRequiredServerMods(params.host).always(function () {
                var activeServerModIdentifiers = CommunityModsManager.activeServerModIdentifiersToMount();

                var hasActiveServerMods = activeServerModIdentifiers.length > 0;

                var gameType = model.gameType();

                var waitingCustomServer = !gameType || gameType.toLowerCase() == 'waiting';

                if (waitingCustomServer)
                    model.gameModIdentifiers(activeServerModIdentifiers);

                var deferred = $.Deferred();

                // Activate any required client mods before the final connect,
                // so the gameplay scene loads with those mods already mounted.
                model.ensureClientModsForGame(model.gameModIdentifiers()).always(function (result) {
                    // if joining custom server in waiting mode then we need to mount server mods for host

                    if (!waitingCustomServer)
                        return oldConnect(params);
                    else {
                        if (hasActiveServerMods)
                            model.pageSubTitle(MOUNTING_SERVER_MODS_STATUS);

                        CommunityModsManager.mountServerMods().always(function (result) {
                            oldConnect(params).always(function (data) {
                                deferred.resolve(data);
                            }, function (data) {
                                deferred.reject(data);
                            });
                        });
                    }
                });
            });
        });

        return deferred;
    };
}

try {
    CommunityModsSetup();
}
catch (e) {
    console.trace(JSON.stringify(e));
}
