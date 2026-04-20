var model;

$(document).ready(function () {

    // MTP behavior: currently every mounted client mod is eligible for GW upload.
    // Keep this intentionally broad so transport bugs are easier to spot.
    function gwUploadClassifier(mod) {
        return true;
    }

    function isGWCampaigntargetURL(url) {
        return _.isString(url)
            && url.indexOf('coui://ui/main/game/galactic_war/gw_play/gw_play.html') === 0
            && url.indexOf('gw_campaign=1') !== -1;
    }

    function callAlwaysOrThen(result, onDone, label) {
        try {
            if (result && _.isFunction(result.always))
                return result.always(onDone);

            if (result && _.isFunction(result.then))
                return result.then(onDone, onDone);
        }
        catch (e) {
            console.error('[GW_COOP] connect_to_game async callback failed for ' + label, e);
        }

        onDone();
    }

    function indexByIdentifier(mods) {
        if (_.isFunction(_.keyBy))
            return _.keyBy(mods, 'identifier');
        if (_.isFunction(_.indexBy))
            return _.indexBy(mods, 'identifier');

        return _.reduce(mods, function(result, mod) {
            if (mod && mod.identifier)
                result[mod.identifier] = mod;
            return result;
        }, {});
    }

    // Reuse server-mod transport for GW by staging host client mods into
    // /server_mods and then publishing that staged set as the upload payload.
    function stageClientModsForGWUpload() {
        var deferred = $.Deferred();
        var settled = false;

        var settleOnce = function() {
            if (settled)
                return;
            settled = true;
            deferred.resolve();
        };

        if (!api.mods || !_.isFunction(api.mods.publishServerMods)) {
            settleOnce();
            return deferred.promise();
        }

        var publishStagedServerMods = function() {
            try {
                var result = api.mods.publishServerMods();
                callAlwaysOrThen(result, settleOnce, 'publishServerMods');
            }
            catch (e) {
                console.error('[GW_COOP] connect_to_game publishServerMods threw', e);
                settleOnce();
            }
        };

        var applyServerModsConfig = function(selectedIdentifiers, onDone) {
            var done = _.isFunction(onDone) ? onDone : function() {};

            // Explicit mount order keeps host and peers deterministic when many
            // staged mods are present and avoids relying on filesystem ordering.
            if (window.CommunityModsManager
                && _.isFunction(CommunityModsManager.download)
                && _.isFunction(CommunityModsManager.mountZipMod)
                && typeof JSZip !== 'undefined') {
                try {
                    var configZip = new JSZip();
                    configZip.file('mods.json', JSON.stringify({
                        mount_order: selectedIdentifiers
                    }));

                    var configDataUrl = 'data:application/zip;base64,' + configZip.generate({ type: 'base64' });
                    var configFile = 'gw-coop-server-mods-config.zip';
                    var configMod = {
                        identifier: 'gw-coop-server-mods-config',
                        installedPath: '/download/' + configFile,
                        mountPath: '/server_mods/'
                    };

                    callAlwaysOrThen(CommunityModsManager.download({
                        url: configDataUrl,
                        file: configFile
                    }), function() {
                        callAlwaysOrThen(CommunityModsManager.mountZipMod(configMod, true), function() {
                            done();
                        }, 'CommunityModsManager.mountZipMod(config)');
                    }, 'CommunityModsManager.download(config)');

                    return;
                }
                catch (e) {
                    console.error('[GW_COOP] connect_to_game failed to build forced server mods config zip', e);
                }
            }

            callAlwaysOrThen(api.file.mountMemoryFiles({
                '/server_mods/mods.json': JSON.stringify({
                    mount_order: selectedIdentifiers
                })
            }), function() {
                done();
            }, 'mountMemoryFiles(/server_mods/mods.json fallback)');
        };

        if (!_.isFunction(api.mods.getMounted) || !api.file || !_.isFunction(api.file.mountMemoryFiles)) {
            publishStagedServerMods();
            return deferred.promise();
        }

        api.mods.getMounted('client', true).then(function(clientMods) {
            try {
                var selectedClientMods = _.filter(clientMods || [], gwUploadClassifier);
                var selectedByIdentifier = indexByIdentifier(selectedClientMods);
                var selectedIdentifiers = _.map(selectedClientMods, 'identifier');
                var mountedMemoryFiles = {};

                _.forEach(selectedClientMods, function(mod) {
                    if (!mod || !mod.identifier)
                        return;

                    // Server upload APIs only package server-context mods, so we
                    // synthesize server-context modinfo for each selected client mod.
                    var modInfo = _.cloneDeep(mod);
                    modInfo.context = 'server';
                    mountedMemoryFiles['/server_mods/' + mod.identifier + '/modinfo.json'] = JSON.stringify(modInfo);
                });

                var doPublish = function() {
                    callAlwaysOrThen(api.file.mountMemoryFiles(mountedMemoryFiles), function() {
                        console.log('[GW_COOP] connect_to_game staged client mod metadata files=' + _.size(mountedMemoryFiles));

                        applyServerModsConfig(selectedIdentifiers, function() {
                            if (api.content && _.isFunction(api.content.remount)) {
                                callAlwaysOrThen(api.content.remount(), function() {
                                    publishStagedServerMods();
                                }, 'api.content.remount after staging');
                            }
                            else {
                                publishStagedServerMods();
                            }
                        });
                    }, 'mountMemoryFiles(/server_mods)');
                };

                if (window.CommunityModsManager
                    && _.isFunction(CommunityModsManager.activeClientZipMods)
                    && _.isFunction(CommunityModsManager.mountZipMods)) {
                    // Zip mods can be re-mounted directly into /server_mods. Local
                    // filesystem mods are represented by metadata only at this stage.
                    var clientZipMods = CommunityModsManager.activeClientZipMods() || [];
                    var zipModsToStage = _.chain(clientZipMods)
                        .filter(function(mod) { return !!selectedByIdentifier[mod.identifier]; })
                        .map(function(mod) {
                            return {
                                identifier: mod.identifier,
                                installedPath: mod.installedPath,
                                mountPath: '/server_mods/'
                            };
                        })
                        .value();

                    console.log('[GW_COOP] connect_to_game staging client zip mods into /server_mods count=' + zipModsToStage.length);
                    console.log('[GW_COOP] connect_to_game selected client mods=' + selectedIdentifiers.length + ' zip-stageable=' + zipModsToStage.length);

                    if (zipModsToStage.length > 0)
                        callAlwaysOrThen(CommunityModsManager.mountZipMods(zipModsToStage), doPublish, 'CommunityModsManager.mountZipMods');
                    else
                        doPublish();
                }
                else {
                    console.log('[GW_COOP] connect_to_game CommunityModsManager zip staging unavailable');
                    doPublish();
                }
            }
            catch (e) {
                console.error('[GW_COOP] connect_to_game client->server staging failed', e);
                publishStagedServerMods();
            }
        }, function() {
            console.error('[GW_COOP] connect_to_game failed to enumerate mounted client mods for staging');
            publishStagedServerMods();
        });

        return deferred.promise();
    }

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
        self.gameSteamId = ko.observable().extend({ session: 'game_steam_id' });

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
                steam_id: self.gameSteamId(),
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
            var steamId = self.gameSteamId();
            return api.net.connect(
            {
                host: self.gameHostname(),
                port: self.gamePort(),
                displayName: self.displayName() || 'Player',
                ticket: self.gameTicket(),
                clientData: self.clientData(),
                content: self.gameContent(),
                lobby_id: self.lobbyId(),
                steamId: steamId
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
        // Set by community_mods connect flow while it installs/enables/remounts
        // required client mods; server_state redirects are held until this clears.
        self.clientModsActivating = ko.observable(false);
        self.redirectURL = ko.observable(undefined);

        self.setup = function () {

            console.log('connect_to_game ' + window.location.search );
            api.debug.log( JSON.stringify(self.gameInfo()));

            api.Panel.message('uberbar', 'lobby_info', undefined);
            api.Panel.message('uberbar', 'lobby_status', '');

            var action = $.url().param('action');
            var mode = $.url().param('mode') || 'Config';
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
                    var enableSteamNetworking = $.url().param('enable_steam_networking');
                    if (enableSteamNetworking)
                        parsedParams['enable_steam_networking'] = true;
                    var lobbyEnableSteam = ko.observable().extend({ session: 'lobby_enable_steam_networking' })();
                    if (lobbyEnableSteam)
                        parsedParams['enable_steam_networking'] = true;

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
            } else if ( ! needsJoinGame && ((self.gameHostname() && self.gamePort()) || self.gameSteamId())) {

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

            // Community mods may need a short activation/remount pass before
            // entering gameplay scenes.
            if (model.clientModsActivating && model.clientModsActivating()) {
                return;
            }

// if redirecting to new game lobby check if server mods needs uploading

            var shouldUploadForRedirect = model.needsServerModsUpload()
                && (url == 'coui://ui/main/game/new_game/new_game.html' || isGWCampaigntargetURL(url));

            if (shouldUploadForRedirect) {

                model.needsServerModsUpload(false);
                model.serverModsUploading(true);

                if (isGWCampaigntargetURL(url)) {
                    api.mods.getMounted('client', true).then(function(mods) {
                        var hostMods = mods || [];
                        var classifiedMods = _.filter(hostMods, gwUploadClassifier);
                        console.log('[GW_COOP] connect_to_game classifier selected ' + classifiedMods.length + ' / ' + hostMods.length + ' host CLIENT mods for upload');
                    });
                }

                if (model.gameModIdentifiers().length > 0) {
                    model.pageSubTitle(loc('!LOC:UPLOADING SERVER MODS... PLEASE WAIT'));
                }

                var beginUpload = function() {
                    // GW reuses the same auth-token handshake used by regular
                    // server-mod upload before sending bundled file data.
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
                };

                if (isGWCampaigntargetURL(url))
                    stageClientModsForGWUpload().always(beginUpload);
                else
                    beginUpload();
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
