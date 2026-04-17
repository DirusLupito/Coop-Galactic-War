var model;

$(document).ready(function () {

    function isGalacticWarForConnect(payload) {
        var serverGameType = payload
            && payload.data
            && payload.data.client
            && payload.data.client.game_options
            && payload.data.client.game_options.game_type;
        var reconnectGameType = model.reconnectToGameInfo() && model.reconnectToGameInfo().game;

        return serverGameType === 'Galactic War'
            || reconnectGameType === 'GalacticWar'
            || reconnectGameType === 'Galactic War';
    }

    var DEFAULT_CONNECTION_ATTEMPTS = 5;
    var DEFAULT_CONNECT_DELAY = 2;
    var DEFAULT_RETRY_DELAY = 5;

    function ConnectViewModel() {
        var self = this;

        self.displayName = ko.observable().extend({ session: 'displayName' });
        self.uberId = ko.observable().extend({ session: 'uberId' });

        // deprecated and no longer used
        self.joinLocalServer = ko.observable().extend({ session: 'join_local_server' });
        //

        self.serverType = ko.observable().extend({ session: 'game_server_type' });
        self.serverSetup = ko.observable().extend({ session: 'game_server_setup' });

        self.lobbyId = ko.observable().extend({ session: 'lobbyId' });
        self.gameTicket = ko.observable().extend({session: 'gameTicket' });
        self.gameHostname = ko.observable().extend({ session: 'gameHostname' });
        self.gamePort = ko.observable().extend({ session: 'gamePort' });
        self.uberNetRegion = ko.observable().extend({ local: 'uber_net_region' });

        self.gameContent = ko.observable().extend({ session: 'game_content' });
        self.isLocalGame = ko.observable().extend({ session: 'is_local_game' });
        self.gameType = ko.observable().extend({ session: 'game_type' });

        self.connectionAttempts = ko.observable(DEFAULT_CONNECTION_ATTEMPTS).extend({ session: 'connection_attempts' });
        self.connectionRetryDelaySeconds = ko.observable(DEFAULT_RETRY_DELAY).extend({ session: 'connection_retry_delay_seconds' })

        self.isPrivateGame = ko.observable().extend({ session: 'is_private_game' });
        self.privateGamePassword = ko.observable().extend({ session: 'private_game_password' });
        self.uuid = ko.observable('').extend({ session: 'invite_uuid' });

        self.ladderPlayerId = ko.observable('').extend({ session: 'ladder_player_id' });

        self.clientData = ko.computed(function () {
            var result = {
                password: self.privateGamePassword(),
                uberid: self.uberId(),
                uuid: self.uuid(),
            }
// include ticket only for uber servers
            if ( self.serverType() == 'uber' && self.gameType() != 'Ladder1v1' ) {
                result.ticket = self.gameTicket() || 'ticket';
            }
            return result;
        });

        self.gameModIdentifiers = ko.observableArray().extend({ session: 'game_mod_identifiers' });

        self.reconnectToGameInfo = ko.observable().extend({ local: 'reconnect_to_game_info' });
        self.reconnectingToExistingGame = ko.observable(false);

        self.gameInfo = ko.computed( function() {
            var result = {
                uberId: self.uberId(),
                lobby_id: self.lobbyId(),
                content: self.gameContent(),
                uuid: self.uuid(),
                game_hostname: self.gameHostname(),
                game_port: self.gamePort(),
                game_password: self.privateGamePassword(),
                local_game: self.isLocalGame(),
                type: self.serverType(),
                setup: self.serverSetup(),
                game: self.gameType(),
                mods: self.gameModIdentifiers(),
                timestamp: Date.now()
// excludes ticket
            };
            return result;
        });

        self.pageTitle = ko.observable();
        self.pageSubTitle = ko.observable();

        self.fail = function(primary, secondary)
        {
            self.reconnectToGameInfo(false);

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

        self.connecting = ko.observable(false);
        self.cancelling = ko.observable(false);

        self.shouldRetry = function() {
            return !self.cancelling() && self.connectionAttemptsRemaining > 0;
        };

        self.showCancel = ko.observable(false);

        self.cancelTimer = false;

        self.enableCancel = function() {
            if (self.cancelTimer) {
                clearTimeout(self.cancelTimer);
                self.cancelTimer = false;
            }
            self.showCancel(true);
        }

        self.disableCancel = function() {
            self.showCancel(false);
            if (self.cancelTimer) {
                clearTimeout(self.cancelTimer);
                self.cancelTimer = false;
            }
        }
        self.cancel = function() {
            self.cancelling(true);
            self.showCancel(false);
            if (self.connecting()) {
                self.pageSubTitle('');
            } else {
                self.fail(loc("!LOC:CONNECTION TO SERVER CANCELED"));
            }
        }

        self.delayedConnectToGame = function(delay) {
            if (self.isLocalGame())
                self.pageTitle(loc("!LOC:CREATING WORLD SIMULATION"));
            else
                self.pageTitle(loc("!LOC:CONNECTING TO SERVER"));
            self.pageSubTitle('');
            _.delay(self.connectToGame, delay * 1000);
        }

        self.connectToGame = function()
        {
            if (self.connectionAttemptsRemaining != self.connectionAttempts())
                self.pageSubTitle(loc("!LOC:ATTEMPTS REMAINING: __num_attempts_remaining__", { num_attempts_remaining: self.connectionAttemptsRemaining }));
            else
                self.pageSubTitle('');
            self.connectionAttemptsRemaining--;
            self.connecting(true);
            return api.net.connect(
            {
                host: self.gameHostname(),
                port: self.gamePort(),
                displayName: self.displayName() || 'Player',
                ticket: self.gameTicket(),
                clientData: self.clientData(),
                content: self.gameContent(),
                lobby_id: self.lobbyId()
            });
        };

        self.retryConnection = function() {
            self.showCancel(!self.cancelling() && self.gameType() != 'Ladder1v1');
            _.delay(self.connectToGame, self.connectionRetryDelaySeconds() * 1000);
        };

        self.localServerRecommended = ko.observable().extend({ session: 'local_server_recommended' });
        self.offlineNotRecommendedDismissed = ko.observable(false).extend({ session: 'offline_not_recommended_warning_dismissed' });
        self.showOfflineNotRecommended = ko.pureComputed(function() { return self.isLocalGame() && !self.localServerRecommended() && !self.offlineNotRecommendedDismissed(); });
        self.dismissOfflineNotRecommended = function() { self.offlineNotRecommendedDismissed(true); };

        self.needsServerModsUpload = ko.observable(false);
        self.serverModsUploading = ko.observable(false);
        self.needsGwCampaignMod6Upload = ko.observable(false);
        self.gwCampaignMod6Uploading = ko.observable(false);
        self.redirectURL = ko.observable(undefined);

        self.uploadGwCampaignMod6ToServer = function(done) {
            var complete = _.isFunction(done) ? done : function() {};

            var resolveActiveClientMods = function(doneResolve, attempt) {
                var nextAttempt = _.isNumber(attempt) ? attempt : 0;
                var manager = window.CommunityModsManager;
                if (!manager) {
                    if (nextAttempt >= 100) {
                        console.log('[GW_COOP] connect_to_game mod6 upload unavailable: CommunityModsManager missing after wait');
                        doneResolve([]);
                        return;
                    }

                    _.delay(function() {
                        resolveActiveClientMods(doneResolve, nextAttempt + 1);
                    }, 100);
                    return;
                }

                try {
                    if (_.isFunction(manager.activeClientMods)) {
                        doneResolve(manager.activeClientMods() || []);
                        return;
                    }

                    if (_.isFunction(manager.activeClientZipMods)) {
                        doneResolve(manager.activeClientZipMods() || []);
                        return;
                    }
                }
                catch (e) {
                    console.log('[GW_COOP] connect_to_game mod6 upload unavailable: failed to read active client mods');
                }

                doneResolve([]);
            };

            resolveActiveClientMods(function(activeClientMods) {
                if (!_.isArray(activeClientMods))
                    activeClientMods = [];

                var targetIndex = 6;
                var mod = activeClientMods[targetIndex];
                if (!mod) {
                    console.log('[GW_COOP] connect_to_game mod6 upload skipped: mod index ' + targetIndex + ' missing');
                    complete(false);
                    return;
                }

                var mountPath = _.isString(mod.mountPath) ? mod.mountPath : '';
                if (!mountPath.length) {
                    console.log('[GW_COOP] connect_to_game mod6 upload skipped: mountPath missing');
                    complete(false);
                    return;
                }

                if (mountPath.charAt(mountPath.length - 1) !== '/')
                    mountPath += '/';

                var modPayload;
                try {
                    modPayload = JSON.parse(JSON.stringify(mod));
                }
                catch (e) {
                    console.log('[GW_COOP] connect_to_game mod6 upload skipped: metadata unserializable');
                    complete(false);
                    return;
                }

            var relevantRoots = [
                'pa/units/',
                'pa/effects/',
                'pa/terrain/',
                'pa/ammo/'
            ];

            var normalizePathKey = function(path) {
                if (!_.isString(path))
                    return '';

                if (path.length > 1 && path.charAt(path.length - 1) === '/')
                    return path.substring(0, path.length - 1);

                return path;
            };

            var looksLikeFilePath = function(path) {
                var normalized = normalizePathKey(path);
                if (!normalized.length)
                    return false;

                var slashIndex = normalized.lastIndexOf('/');
                var leaf = slashIndex >= 0 ? normalized.substring(slashIndex + 1) : normalized;
                return leaf.indexOf('.') !== -1;
            };

            var listAsDirectory = function(path) {
                var listingDeferred = $.Deferred();
                var slashPath = path.charAt(path.length - 1) === '/' ? path : path + '/';

                var resolveIfDirectory = function(candidatePath, listing) {
                    if (_.isArray(listing)) {
                        listingDeferred.resolve({
                            path: candidatePath,
                            listing: listing
                        });
                        return true;
                    }
                    return false;
                };

                var trySlashPath = function() {
                    if (slashPath === path) {
                        listingDeferred.reject();
                        return;
                    }

                    api.file.list(slashPath, false).then(function(listing) {
                        if (!resolveIfDirectory(slashPath, listing))
                            listingDeferred.reject();
                    }, function() {
                        listingDeferred.reject();
                    });
                };

                api.file.list(path, false).then(function(listing) {
                    if (!resolveIfDirectory(path, listing))
                        trySlashPath();
                }, function() {
                    trySlashPath();
                });

                return listingDeferred.promise();
            };

            var recursiveListFiles = function(rootPath) {
                var deferred = $.Deferred();
                var pendingPaths = [rootPath];
                var queuedPaths = {};
                var visitedDirectories = {};
                var visitedFiles = {};
                var files = [];

                queuedPaths[normalizePathKey(rootPath)] = true;

                var enqueuePath = function(path) {
                    if (!_.isString(path) || !path.length)
                        return;

                    var key = normalizePathKey(path);
                    if (!key.length || queuedPaths[key])
                        return;

                    queuedPaths[key] = true;
                    pendingPaths.push(path);
                };

                var drain = function() {
                    if (!pendingPaths.length) {
                        deferred.resolve(files);
                        return;
                    }

                    var nextPath = pendingPaths.shift();
                    if (!_.isString(nextPath) || !nextPath.length) {
                        drain();
                        return;
                    }

                    if (looksLikeFilePath(nextPath)) {
                        var directFilePath = normalizePathKey(nextPath);
                        if (!visitedFiles[directFilePath]) {
                            visitedFiles[directFilePath] = true;
                            files.push(directFilePath);
                        }
                        drain();
                        return;
                    }

                    listAsDirectory(nextPath).then(function(directoryResult) {
                        var directoryPath = directoryResult.path;
                        var listing = directoryResult.listing;
                        var directoryKey = normalizePathKey(directoryPath);

                        if (visitedDirectories[directoryKey]) {
                            drain();
                            return;
                        }
                        visitedDirectories[directoryKey] = true;

                        _.forEach(listing, function(entryPath) {
                            if (!_.isString(entryPath) || !entryPath.length)
                                return;

                            if (entryPath.charAt(entryPath.length - 1) === '/') {
                                enqueuePath(entryPath);
                                return;
                            }

                            if (looksLikeFilePath(entryPath)) {
                                var listedFilePath = normalizePathKey(entryPath);
                                if (!visitedFiles[listedFilePath]) {
                                    visitedFiles[listedFilePath] = true;
                                    files.push(listedFilePath);
                                }
                                return;
                            }

                            enqueuePath(entryPath);
                        });

                        drain();
                    }, function() {
                        var filePath = normalizePathKey(nextPath);
                        var rootKey = normalizePathKey(rootPath);
                        if (filePath !== rootKey && !visitedFiles[filePath]) {
                            visitedFiles[filePath] = true;
                            files.push(filePath);
                        }
                        drain();
                    });
                };

                drain();
                return deferred.promise();
            };

                var rootFileLists = [];
                var pendingRoots = relevantRoots.length;

                var finalizeSendWithFiles = function(filePaths) {
                    var MAX_PART_CHARS = 60000;
                    var files = _.isArray(filePaths) ? filePaths : [];
                    var totalFiles = files.length;
                    var sentParts = 0;
                    var missingFiles = 0;
                    var unserializableFiles = 0;

                    model.send_message('gw_campaign_client_mod_payload', {
                        index: targetIndex,
                        phase: 'begin',
                        reason: 'connect_to_game_host_startup',
                        timestamp: _.now(),
                        mod: modPayload,
                        mount_path: mountPath,
                        roots: relevantRoots,
                        file_count: totalFiles
                    });

                    var finishSend = function() {
                        model.send_message('gw_campaign_client_mod_payload', {
                            index: targetIndex,
                            phase: 'complete',
                            reason: 'connect_to_game_host_startup',
                            timestamp: _.now(),
                            file_count: totalFiles,
                            missing_file_count: missingFiles,
                            unserializable_file_count: unserializableFiles,
                            sent_part_count: sentParts
                        });

                        console.log('[GW_COOP] connect_to_game mod6 upload complete file_count=' + totalFiles + ' missing=' + missingFiles + ' unserializable=' + unserializableFiles + ' parts=' + sentParts);
                        complete(true);
                    };

                    if (!totalFiles) {
                        finishSend();
                        return;
                    }

                    var cursor = 0;
                    var sendNextFile = function() {
                        if (cursor >= totalFiles) {
                            finishSend();
                            return;
                        }

                        var filePath = files[cursor];
                        cursor += 1;

                        var fileUrl = 'coui:/' + filePath;
                        $.get(fileUrl).done(function(raw) {
                        var rawText = raw;
                        if (!_.isString(rawText)) {
                            try {
                                rawText = JSON.stringify(raw);
                            }
                            catch (e) {
                                rawText = '[unserializable non-string data]';
                                unserializableFiles += 1;
                            }
                        }

                        var partCount = Math.max(1, Math.ceil(rawText.length / MAX_PART_CHARS));
                        var partIndex;
                        for (partIndex = 0; partIndex < partCount; partIndex++) {
                            var startIndex = partIndex * MAX_PART_CHARS;
                            var endIndex = Math.min(rawText.length, startIndex + MAX_PART_CHARS);
                            model.send_message('gw_campaign_client_mod_payload', {
                                index: targetIndex,
                                phase: 'file_part',
                                file_path: filePath,
                                file_part_index: partIndex,
                                file_part_count: partCount,
                                data: rawText.substring(startIndex, endIndex)
                            });
                            sentParts += 1;
                        }
                        }).fail(function() {
                        missingFiles += 1;
                        model.send_message('gw_campaign_client_mod_payload', {
                            index: targetIndex,
                            phase: 'file_missing',
                            file_path: filePath
                        });
                        }).always(function() {
                            if (cursor % 25 === 0 || cursor === totalFiles)
                                console.log('[GW_COOP] connect_to_game mod6 upload progress sent=' + cursor + '/' + totalFiles + ' parts=' + sentParts);

                            _.defer(sendNextFile);
                        });
                    };

                    sendNextFile();
                };

                if (!pendingRoots) {
                    finalizeSendWithFiles([]);
                    return;
                }

                _.forEach(relevantRoots, function(relativeRoot) {
                    var rootPath = mountPath + relativeRoot;
                    recursiveListFiles(rootPath).then(function(filePaths) {
                        rootFileLists.push(filePaths || []);
                        console.log('[GW_COOP] connect_to_game mod6 root=' + rootPath + ' file_count=' + (filePaths ? filePaths.length : 0));
                    }, function() {
                        console.log('[GW_COOP] connect_to_game mod6 root_list_failed=' + rootPath);
                    }).always(function() {
                        pendingRoots -= 1;
                        if (pendingRoots > 0)
                            return;

                        var unique = {};
                        var allFilePaths = [];
                        _.forEach(rootFileLists, function(paths) {
                            _.forEach(paths, function(path) {
                                var normalizedPath = normalizePathKey(path);
                                if (!normalizedPath.length || unique[normalizedPath])
                                    return;

                                unique[normalizedPath] = true;
                                allFilePaths.push(normalizedPath);
                            });
                        });

                        allFilePaths.sort();
                        console.log('[GW_COOP] connect_to_game mod6 total_relevant_files=' + allFilePaths.length);
                        finalizeSendWithFiles(allFilePaths);
                    });
                });
            });
        };

        self.setup = function () {

            console.log('connect_to_game ' + window.location.search );
            api.debug.log( JSON.stringify(self.gameInfo()));

            api.Panel.message('uberbar', 'lobby_info', undefined);
            api.Panel.message('uberbar', 'lobby_status', '');

            var action = $.url().param('action');
            var mode = $.url().param('mode') || 'Config';
            var requestedMode = mode;
            var content = $.url().param('content') || '';
            var replayid = $.url().param('replayid');
            var local = $.url().param('local') === 'true';
            var params = $.url().param('params');
            var loadpath = $.url().param('loadpath');
            var loadtime = $.url().attr().fragment;

            var start = action === 'start';

            // Reconnect flows that navigate to connect_to_game without explicit
            // URL params still need content mounted before api.net.connect.
            // Use saved reconnect context as fallback, and default GW reconnects
            // to PAExpansion1 when no content is explicitly provided.
            if (_.isEmpty(content)) {
                var reconnectInfo = self.reconnectToGameInfo() || {};
                if (_.isString(reconnectInfo.content) && reconnectInfo.content.length)
                    content = reconnectInfo.content;
                else if (reconnectInfo.game === 'GalacticWar' || reconnectInfo.game === 'Galactic War')
                    content = 'PAExpansion1';
            }

            if (loadtime) {
                loadpath = loadpath + "#" + loadtime;
            }

            self.gameContent(content);

            // local parameter overrides
            if (local) {
                self.isLocalGame(true);
                self.serverType('local');
            }
            else if (start) {
                self.isLocalGame(false);
                self.serverType('uber');
            }

            var serverType = self.serverType();
            var gameType = self.gameType();

// reset if not from Ladder1v1
            if (gameType != 'Ladder1v1') {
                self.connectionAttempts(DEFAULT_CONNECTION_ATTEMPTS);
                self.connectionRetryDelaySeconds(DEFAULT_RETRY_DELAY);
            }

            self.connectionAttemptsRemaining = self.connectionAttempts();

// server and game type should be set in all new builds with exception of old mods
// Ladder1v1 games are already joined
            var needsJoinGame = ( serverType == 'uber' && gameType != 'Ladder1v1' ) || ( ! serverType && ! local );

            if (mode && !_.isEmpty(self.gameContent()))
                mode = self.gameContent() + ':' + mode;

            self.needsGwCampaignMod6Upload(start && requestedMode === 'gw_campaign');

            var connectDelay = DEFAULT_CONNECT_DELAY;

            if (start) {
                model.pageTitle(loc("!LOC:STARTING GAME"));
                self.uuid(UberUtility.createHexUUIDString());

                var region = local ? 'Local' : (self.uberNetRegion() || "USCentral");

                var startCall;

                if (replayid !== undefined)
                    startCall = api.net.startReplay(region, mode, replayid);
                else if (loadpath !== undefined) {
 // increase connection attempts and retry delay when loading potentially big saved games
                    self.connectionAttemptsRemaining = 15;
                    self.connectionRetryDelaySeconds(10);
                    startCall = api.net.loadSave(region, mode, loadpath);
                }
                else {
                    if (!local)
                        connectDelay = 0;

                    var parsedParams = params ? JSON.parse(params) : {};
                    var disableUPNP = $.url().param('disable_upnp');
                    if (disableUPNP)
                        parsedParams['disable_upnp'] = true;

                    startCall = api.net.startGame(region, mode, parsedParams);
                    self.needsServerModsUpload(!window.gNoMods);
                }
                startCall.always(function(data) {

                    if (_.isString(data))
                    {
                        try
                        {
                            data = JSON.parse(data);
                        }
                        catch (e)
                        {
                            console.error(e);
                            console.error(data);
                            data = null;
                        }
                    }

                    if (data && data.ErrorCode) {
                        switch (data.ErrorCode) {
                            case 200: { self.fail('Selected region is not valid', 'Please contact support'); } break; /* Message: InvalidRegion */
                            case 201: { self.fail('Region at capacity ', 'Please try again later'); } break; /* Message: RegionAtCapacity */
                            case 202: { self.fail('Server failed to start', 'Please contact support'); } break; /* Message: ServerFailedToStart */
                            default: self.fail('Unknown PlayFab error ' + data.Message + ' (#' + data.ErrorCode + ')', 'Please contact support');
                        }
                        return;
                    } else if (!data || !data.ServerHostname || !data.ServerPort) {
                        if (replayid !== undefined)
                            self.fail(loc("!LOC:FAILED TO START REPLAY"));
                        else if (loadpath !== undefined)
                            self.fail(loc("!LOC:FAILED TO LOAD GAME"));
                        else
                            self.fail(loc("!LOC:FAILED TO START GAME"));
                        return;
                    }

                    self.gameTicket(data.Ticket);
                    self.gameHostname(data.ServerHostname);
                    self.gamePort(data.ServerPort);
                    self.lobbyId(data.LobbyID);
                    self.delayedConnectToGame(connectDelay);
                });
                startCall.fail(function(data) {
                    data = parse(data);
                    self.handleStartError(data);
                });
            } else if ( ! needsJoinGame && self.gameHostname() && self.gamePort()) {

// check for custom servers and manually started local servers
                if (serverType != 'uber' && gameType == 'Waiting' ) {
                    connectDelay = 0;
                    self.needsServerModsUpload(!window.gNoMods);
                }

                self.delayedConnectToGame(connectDelay);

            } else if ( needsJoinGame && self.lobbyId()) {
                // uber servers must resolve via lobbyId to obtain ticket
                self.pageTitle(loc('!LOC:CONNECTING TO SERVER'));
                self.pageSubTitle(loc('!LOC:REQUESTING PERMISSION'));

                self.cancelTimer = setTimeout(self.enableCancel, 10000);

                api.net.joinGame({lobbyId: self.lobbyId()}).done(function (data) {
                    self.isLocalGame(false);
                    self.gameTicket(data.Ticket);
                    self.gameHostname(data.ServerHostname);
                    self.gamePort(data.ServerPort);
                    self.delayedConnectToGame(0);
                }).fail(function (data) {
                    console.error("Unable to join game", self.lobbyId(), data);
                    self.fail(loc("!LOC:FAILED TO GET PERMISSION"));
                }).always(function() {
                    self.disableCancel();
                });
            }  else {
                console.error('failed to join game', self.gameHostname(), self.gamePort());
                self.fail(loc("!LOC:FAILED TO JOIN GAME"));
            }
        }
    }

    model = new ConnectViewModel();

    handlers = {};
    handlers.connection_failed = function (payload) {
        console.error('connection_failed');
        console.error(JSON.stringify(payload));
        model.connecting(false);
        if (model.shouldRetry())
            model.retryConnection();
        else
        {
            if (model.isLocalGame())
                model.fail(loc("!LOC:UNABLE TO ACCESS WORLD SIMULATION"));
            else
                model.fail(loc("!LOC:CONNECTION TO SERVER FAILED"));
        }
    };

    handlers.downloading_mod_data = function(payload) {
        api.debug.log('downloading_mod_data: ' + JSON.stringify(payload));
        if (_.size(payload) > 0) {

            var gameModIdentifiers = _.map(payload, 'identifier');
            model.gameModIdentifiers(gameModIdentifiers);
            model.pageSubTitle(loc('!LOC:DOWNLOADING SERVER MODS'));
        }
    }

    handlers.login_accepted = function (payload) {
        api.debug.log('login_accepted');
// set game info for invites and direct reconnects
        api.debug.log(JSON.stringify(_.omit(model.gameInfo(),'game_password')));
        model.connecting(false);
        model.showCancel(false);

        var previousReconnectToGameInfo = model.reconnectToGameInfo();
        var gameInfo = model.gameInfo();

        if (previousReconnectToGameInfo) {
            gameInfo.game = gameInfo.game || previousReconnectToGameInfo.game;
            gameInfo.setup = gameInfo.setup || previousReconnectToGameInfo.setup;
            gameInfo.mods = (gameInfo.mods && gameInfo.mods.length) ? gameInfo.mods : (previousReconnectToGameInfo.mods || []);
            gameInfo.content = gameInfo.content || previousReconnectToGameInfo.content;
        }

        model.reconnectingToExistingGame(!!previousReconnectToGameInfo
            && previousReconnectToGameInfo.lobby_id === gameInfo.lobby_id
            && previousReconnectToGameInfo.uberId === gameInfo.uberId
            && previousReconnectToGameInfo.uuid === gameInfo.uuid
            && previousReconnectToGameInfo.game_hostname === gameInfo.game_hostname
            && previousReconnectToGameInfo.game_port === gameInfo.game_port);

        model.reconnectToGameInfo(gameInfo);

// can't invite to localhost, replays or resumed games
        if (gameInfo.game_hostname == 'localhost' || gameInfo.setup == 'replay' || gameInfo.setup == 'loadsave') {
            gameInfo = undefined;
        }

        api.Panel.message('uberbar', 'lobby_info', gameInfo);
        api.Panel.message('uberbar', 'lobby_status', '');

        if (model.isLocalGame())
            model.pageTitle(loc("!LOC:ACCESSING WORLD SIMULATION"));
        else
            model.pageTitle(loc('!LOC:LOGIN ACCEPTED'));
        model.pageSubTitle('');
        app.hello(handlers.server_state, handlers.connection_disconnected);

        model.cancelTimer = setTimeout(model.enableCancel, 30000);
    };

    handlers.login_rejected = function (payload) {
        console.error('login_rejected');
        console.error(JSON.stringify(payload));
        model.connecting(false);
        if (model.shouldRetry())
            model.retryConnection();
        else
        {
            if (model.isLocalGame())
                model.fail(loc("!LOC:ACCESS TO WORLD SIMULATION DENIED"));
            else
                model.fail(loc("!LOC:LOGIN TO SERVER REJECTED"));
        }
    };

// will be called once server mods are uploaded

    handlers.mount_mod_file_data = function (payload) {

        if ( !model.serverModsUploading() ) {
            console.error('mount_mod_file_data when not uploading server mods');
            return;
        }

        api.debug.log("server mods uploaded... mounting: " + JSON.stringify(payload));

        if (payload && payload.length > 0) {
            model.pageSubTitle(loc('!LOC:REMOUNTING SERVER MODS'));
        }
        api.mods.mountModFileData().always(function() {
            api.debug.log("server mods mounted " + JSON.stringify(payload));
            model.serverModsUploading(false);
            window.location.href = model.redirectURL();
            return; /* window.location.href will not stop execution. */
       });
    }

    handlers.gw_campaign_client_mod_sync = function(payload) {
        var data = payload || {};
        var phase = _.isString(data.phase) ? data.phase : 'unknown';

        if (phase === 'file_part') {
            console.log('[GW_COOP] connect_to_game gw_campaign_client_mod_sync index=' + data.index + ' phase=file_part file=' + data.file_path + ' part=' + data.file_part_index + '/' + data.file_part_count + ' data=' + (data.data || ''));
            return;
        }

        var payloadText;
        try {
            payloadText = JSON.stringify(data);
        }
        catch (e) {
            payloadText = '[unserializable]';
        }

        console.log('[GW_COOP] connect_to_game gw_campaign_client_mod_sync payload=' + payloadText);
    }

    handlers.server_state = function (payload) {

        var url = payload.url;

        if (url === 'coui://ui/main/game/live_game/live_game.html' && isGalacticWarForConnect(payload)) {
            var stagingUrl = 'coui://ui/main/game/gw_reconnect_loading/gw_reconnect_loading.html?target=' + encodeURIComponent(url);

            url = stagingUrl;
        }

// ignore server state messages not redirecting to a new scene

        if (url !== window.location.href) {

            model.redirectURL(url);

// if we are uploading server mods then ignore server state messages

            if (model.serverModsUploading()) {
                return;
            }

// if we are uploading gw campaign host mod data then ignore server state messages

            if (model.gwCampaignMod6Uploading()) {
                return;
            }

// if redirecting to gw campaign play as host, upload mod6 before redirect

            if (url == 'coui://ui/main/game/galactic_war/gw_play/gw_play.html?gw_campaign=1' && model.needsGwCampaignMod6Upload()) {

                model.needsGwCampaignMod6Upload(false);
                model.gwCampaignMod6Uploading(true);
                model.pageSubTitle(loc('!LOC:UPLOADING GW CO-OP MOD DATA... PLEASE WAIT'));

                model.uploadGwCampaignMod6ToServer(function() {
                    model.gwCampaignMod6Uploading(false);
                    window.location.href = url;
                    return; /* window.location.href will not stop execution. */
                });
                return;
            }

// if redirecting to new game lobby check if server mods needs uploading

            if (url == 'coui://ui/main/game/new_game/new_game.html' && model.needsServerModsUpload()) {

                model.needsServerModsUpload(false);
                model.serverModsUploading(true);

                if (model.gameModIdentifiers().length > 0) {
                    model.pageSubTitle(loc('!LOC:UPLOADING SERVER MODS... PLEASE WAIT'));
                }

// check if authorised to send mod data to server

                model.send_message('mod_data_available', {}, function (success, response) {

                    if (success) {
// upload the server mods
                       api.mods.sendModFileDataToServer(response.auth_token).then(function(data) {
                            api.debug.log('server mods uploaded');
                            api.debug.log(data);
                        });
                    } else {
// uploading of server mods is not allowed
                        window.location.href = url;
                        return; /* window.location.href will not stop execution. */
                   }
                });
            } else {
// not redirecting to new game lobby
                window.location.href = url;
                return; /* window.location.href will not stop execution. */
            }
        }

    };

    handlers.connection_disconnected = function (payload) {
        console.error('disconnected');
        console.error(JSON.stringify(payload));
        if (model.shouldRetry())
            model.retryConnection();
        else
        {
            if (model.isLocalGame())
                model.fail(loc('!LOC:WORLD SIMULATION WENT AWAY'));
            else
                model.fail(loc("!LOC:CONNECTION TO SERVER LOST"));
        }
    };

    handlers.player_id = function(payload)
    {
        model.ladderPlayerId(payload);
    }

    if ( window.CommunityMods ) {
        try {
            CommunityMods();
        } catch ( e ) {
            console.error( e );
        }
    }

    loadSceneMods('connect_to_game');

    // Activates knockout.js
    ko.applyBindings(model);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    model.setup();
});
