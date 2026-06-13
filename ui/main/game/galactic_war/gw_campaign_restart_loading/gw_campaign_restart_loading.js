var model;
var handlers;

$(document).ready(function () {

    var ROLE_HOST = 'host';
    var ROLE_VIEWER = 'viewer';
    var DEFAULT_HOST_START_DELAY_MS = 3000;
    var HOST_START_MARGIN_MS = 2000;
    var VIEWER_RECONNECT_MARGIN_MS = 500;
    var RESTART_DISCOVERY_RETRY_MS = 1000;
    var RESTART_DISCOVERY_MAX_ATTEMPTS = 90;
    var RESTART_CUSTOM_DISCOVERY_RETRY_MS = 5000;

    function GwCampaignRestartLoadingViewModel() {
        var self = this;

        self.role = ko.observable(($.url().param('role') || ROLE_VIEWER).toLowerCase());
        self.pageSubTitle = ko.observable(loc('!LOC:Preparing reconnect...'));

        self.gwCampaignRestartContext = ko.observable().extend({ local: 'gw_campaign_restart_context' });
        self.reconnectToGameInfo = ko.observable().extend({ local: 'reconnect_to_game_info' });
        self.gameContent = ko.observable().extend({ session: 'game_content' });

        self.buildVersion = ko.observable().extend({ session: 'build_version' });
        self.uberId = ko.observable().extend({ session: 'uberId' });
        self.lobbyId = ko.observable().extend({ session: 'lobbyId' });
        self.uuid = ko.observable('').extend({ session: 'invite_uuid' });
        self.gameHostname = ko.observable().extend({ session: 'gameHostname' });
        self.gamePort = ko.observable().extend({ session: 'gamePort' });
        self.gameSteamId = ko.observable().extend({ session: 'game_steam_id' });
        self.isLocalGame = ko.observable().extend({ session: 'is_local_game' });
        self.gameType = ko.observable().extend({ session: 'game_type' });
        self.gameModIdentifiers = ko.observableArray().extend({ session: 'game_mod_identifiers' });
        self.privateGamePassword = ko.observable().extend({ session: 'private_game_password' });
        self.customServersUrl = ko.observable().extend({ session: 'custom_servers_url' });
        self.localHostTransportSetting = ko.observable().extend({ setting: { group: 'server', key: 'local_host_transport' } });
        self.serverType = ko.observable().extend({ session: 'game_server_type' });
        self.serverSetup = ko.observable().extend({ session: 'game_server_setup' });
        self.gwCampaignEnabled = ko.observable().extend({ session: 'gw_campaign_enabled' });
        self.connectionAttempts = ko.observable().extend({ session: 'connection_attempts' });
        self.connectionRetryDelaySeconds = ko.observable().extend({ session: 'connection_retry_delay_seconds' });
        self.gwCampaignRestartPending = ko.observable().extend({ local: 'gw_campaign_restart_pending' });

        self.redirectHandle = undefined;
        self.cancelled = false;
        self.discoveryAttempts = 0;
        self.steamDiscoveryContext = undefined;
        self.steamDiscoveryContent = undefined;
        self.lastCustomDiscoveryRequestAt = 0;
        self.loggedMissingCustomServersUrl = false;
        self.lanLookoutEnabled = false;

        self.clearPendingRedirect = function() {
            if (self.redirectHandle) {
                clearTimeout(self.redirectHandle);
                self.redirectHandle = undefined;
            }
        };

        self.getLocalHostTransport = function() {
            if (self.localHostTransportSetting()) {
                return self.localHostTransportSetting();
            }

            if (api.net && _.isFunction(api.net.effectiveLocalHostTransport)) {
                return api.net.effectiveLocalHostTransport();
            }

            return undefined;
        };

        self.normalizeMatchValue = function(value) {
            if (_.isFinite(value)) {
                return String(value);
            }

            if (_.isString(value) && value.length) {
                return value;
            }

            return '';
        };

        self.hasSteamReconnectTarget = function(reconnectInfo) {
            return !!(reconnectInfo && reconnectInfo.steam_id) || !!self.gameSteamId();
        };

        self.restoreDirectReconnectSession = function(reconnectInfo, content) {
            var info = reconnectInfo || {};
            var hostname = info.game_hostname || '';
            var port = info.game_port || '';
            var type = info.type === 'uber' ? 'local' : (info.type || 'local');
            var mods = _.isArray(info.mods) ? info.mods : [];
            var password = info.game_password || info.password || '';

            if (!hostname || !port) {
                console.log('[GW COOP] direct restart reconnect missing host or port hostname=' + hostname + ' port=' + port);
                return false;
            }

            self.lobbyId(info.lobby_id);
            self.uuid(info.uuid || '');
            self.gameHostname(hostname);
            self.gamePort(port);
            self.gameSteamId('');
            self.isLocalGame(!!info.local_game);
            self.serverType(type);
            self.serverSetup('gw_campaign');
            self.gameType('GalacticWar');
            self.gameModIdentifiers(mods);
            self.privateGamePassword(password);
            self.gameContent(content);

            self.reconnectToGameInfo(_.assign({}, info, {
                content: content,
                game_hostname: hostname,
                game_port: port,
                game_password: password,
                type: type,
                setup: 'gw_campaign',
                game: 'GalacticWar',
                mods: mods,
                steam_id: '',
                timestamp: Date.now()
            }));

            return true;
        };

        self.processRestartGameBeacon = function(beacon, region, lobby_id, host, port) {
            try {
                if (!beacon || !beacon.game) {
                    return false;
                }

                if (_.contains(beacon.blacklist, self.uberId())) {
                    return false;
                }

                if (beacon.whitelist && beacon.whitelist.length) {
                    if (!_.contains(beacon.whitelist, self.uberId())) {
                        return false;
                    }
                }

                return {
                    server_type: beacon.server_type,
                    region: region,
                    uuid: beacon.uuid,
                    lobby_id: lobby_id,
                    host: host,
                    port: port,
                    mode: beacon.mode,
                    mod_identifiers: beacon.mod_identifiers,
                    required_content: _.isArray(beacon.required_content) ? beacon.required_content : [],
                    creator: beacon.creator,
                    state: beacon.state,
                    steam_networking: beacon.steam_networking,
                    steam_id: beacon.steam_id
                };
            }
            catch (e) {
                return false;
            }
        };

        self.isRestartedCampaignGameMatch = function(game, context, source) {
            var expectedHostName = self.normalizeMatchValue(context && context.host_name);
            var creator = self.normalizeMatchValue(game && game.creator);

            if (!expectedHostName) {
                console.log('[GW COOP] restart discovery cannot search without host name');
                return false;
            }

            console.log('[GW COOP] restart discovery candidate source=' + source + ' lobby=' + game.lobby_id + ' creator=' + creator + ' steam=' + game.steam_id + ' mode=' + game.mode);

            if (creator !== expectedHostName) {
                return false;
            }

            if (game.state !== 'lobby') {
                return false;
            }

            if (game.mode !== 'GalacticWar') {
                return false;
            }

            if (!game.steam_networking) {
                return false;
            }

            if (!game.steam_id) {
                console.log('[GW COOP] restart discovery found host match before Steam id was ready source=' + source + ' host=' + creator);
                return false;
            }

            return true;
        };

        self.findRestartedCampaignRemoteGame = function(data, context) {
            var games = data && data.Games;
            var buildVersion = self.buildVersion();

            for (var i = 0; i < (games || []).length; i++) {
                try {
                    if (games[i].BuildVersion === buildVersion && games[i].TitleData) {
                        var gameData = JSON.parse(games[i].TitleData);
                        gameData.server_type = 'uber';

                        var game = self.processRestartGameBeacon(gameData, games[i].Region, games[i].LobbyID);
                        if (game && self.isRestartedCampaignGameMatch(game, context, 'uber')) {
                            return game;
                        }
                    }
                }
                catch (e) {
                    console.log('[GW COOP] restart discovery failed to parse TitleData');
                    console.log(games[i].TitleData);
                }
            }

            return undefined;
        };

        self.enableRestartLanLookout = function() {
            if (self.lanLookoutEnabled) {
                return;
            }

            self.lanLookoutEnabled = true;
            engine.call('enable_lan_lookout');
        };

        self.disableRestartLanLookout = function() {
            if (!self.lanLookoutEnabled) {
                return;
            }

            self.lanLookoutEnabled = false;
            engine.call('disable_lan_lookout');
        };

        self.findRestartedCampaignCustomGame = function(games, context) {
            var buildVersion = self.buildVersion();

            for (var i = 0; i < (games || []).length; i++) {
                try {
                    var customGame = games[i];

                    if (customGame.version == buildVersion && customGame.beacon) {
                        var lobbyId = customGame.id;
                        var host = customGame.ip;
                        var port = customGame.port;
                        var gameData = JSON.parse(customGame.beacon);

                        gameData.server_type = 'custom';

                        var region = 'Custom: ' + gameData.region;
                        var game = self.processRestartGameBeacon(gameData, region, lobbyId, host, port);
                        if (game && self.isRestartedCampaignGameMatch(game, context, 'custom')) {
                            return game;
                        }
                    }
                }
                catch (e) {
                    console.log('[GW COOP] restart discovery failed to process custom game');
                    console.log(e);
                }
            }

            return undefined;
        };

        self.findRestartedCampaignLanGame = function(payload, context) {
            if (!payload || !payload.beacon) {
                return undefined;
            }

            var beacon = payload.beacon;
            var uuid = beacon.uuid;

            beacon.server_type = 'local';

            if (payload.version == self.buildVersion()) {
                var game = self.processRestartGameBeacon(beacon, 'Local', uuid, payload.host, payload.port);
                if (game && self.isRestartedCampaignGameMatch(game, context, 'local')) {
                    return game;
                }
            }

            return undefined;
        };

        self.joinRestartedCampaignGame = function(game, content) {
            if (!game) {
                return false;
            }

            if (!game.steam_id) {
                console.log('[GW COOP] restart discovery found matching Steam game before steam_id was ready');
                return false;
            }

            var mods = _.isArray(game.mod_identifiers) ? game.mod_identifiers : [];
            var reconnectInfo = self.reconnectToGameInfo() || {};
            var password = reconnectInfo.game_password || reconnectInfo.password || '';

            self.lobbyId(game.lobby_id);
            self.gameHostname(game.steam_id ? '' : game.host);
            self.gamePort(game.steam_id ? '' : game.port);
            self.isLocalGame(game.server_type == 'local');
            self.uuid(game.uuid);
            self.serverType(game.server_type);
            self.serverSetup('gw_campaign');
            self.gameType('GalacticWar');
            self.gameModIdentifiers(mods);
            self.gameSteamId(game.steam_id || '');
            self.privateGamePassword(password);
            self.gameContent(content);

            self.reconnectToGameInfo({
                uberId: self.uberId(),
                lobby_id: game.lobby_id,
                content: content,
                uuid: game.uuid || '',
                game_hostname: self.gameHostname(),
                game_port: self.gamePort(),
                game_password: password,
                local_game: self.isLocalGame(),
                type: self.serverType(),
                setup: 'gw_campaign',
                game: 'GalacticWar',
                mods: mods,
                steam_id: self.gameSteamId(),
                timestamp: Date.now()
            });

            console.log('[GW COOP] restart discovery matched lobby=' + game.lobby_id + ' source=' + game.server_type + ' steam_id=' + self.gameSteamId());
            return true;
        };

        self.navigateToMatchedRestartedCampaign = function(game, content) {
            if (!game || !self.joinRestartedCampaignGame(game, content)) {
                return false;
            }

            self.cancelled = true;
            self.clearPendingRedirect();
            window.location.href = 'coui://ui/main/game/connect_to_game/connect_to_game.html?content=' + encodeURIComponent(content);
            return true;
        };

        self.handleRestartLanBeacon = function(payload) {
            if (self.cancelled || !self.steamDiscoveryContext) {
                return;
            }

            var match = self.findRestartedCampaignLanGame(payload, self.steamDiscoveryContext);
            self.navigateToMatchedRestartedCampaign(match, self.steamDiscoveryContent);
        };

        self.failRestartDiscovery = function() {
            var transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
            var transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
            var transitDestination = ko.observable().extend({ session: 'transit_destination' });
            var transitDelay = ko.observable().extend({ session: 'transit_delay' });

            self.cancelled = true;
            self.clearPendingRedirect();

            transitPrimaryMessage(loc('!LOC:FAILED TO FIND RESTARTED CO-OP CAMPAIGN'));
            transitSecondaryMessage(loc('!LOC:Returning to Main Menu'));
            transitDestination('coui://ui/main/game/start/start.html');
            transitDelay(5000);
            window.location.href = 'coui://ui/main/game/transit/transit.html';
        };

        self.scheduleRestartDiscoveryRetry = function(context, content) {
            if (self.cancelled) {
                return;
            }

            if (self.discoveryAttempts >= RESTART_DISCOVERY_MAX_ATTEMPTS) {
                console.log('[GW COOP] restart discovery gave up after attempts=' + self.discoveryAttempts);
                self.failRestartDiscovery();
                return;
            }

            self.redirectHandle = setTimeout(function() {
                self.pollForRestartedCampaign(context, content);
            }, RESTART_DISCOVERY_RETRY_MS);
        };

        self.logRestartDiscoveryRequestFailure = function(request, textStatus, errorThrown) {
            var status = textStatus || '';
            var error = errorThrown || '';

            if (request && request.status) {
                status = request.status;
            }

            if (!error && request && request.responseText) {
                error = request.responseText;
            }

            console.log('[GW COOP] restart discovery request failed status=' + status + ' error=' + error);
        };

        self.pollCustomServerGamesForRestartedCampaign = function(context, content) {
            if (self.cancelled) {
                return;
            }

            var url = self.customServersUrl();
            if (!url) {
                if (!self.loggedMissingCustomServersUrl) {
                    console.log('[GW COOP] restart discovery custom server list unavailable');
                    self.loggedMissingCustomServersUrl = true;
                }
                return;
            }

            var now = Date.now();
            if (self.lastCustomDiscoveryRequestAt && now - self.lastCustomDiscoveryRequestAt < RESTART_CUSTOM_DISCOVERY_RETRY_MS) {
                return;
            }

            self.lastCustomDiscoveryRequestAt = now;

            $.getJSON(url)
                .done(function(games) {
                    if (self.cancelled) {
                        return;
                    }

                    console.log('[GW COOP] restart discovery custom response games=' + ((games && games.length) || 0));

                    var match = self.findRestartedCampaignCustomGame(games, context);
                    self.navigateToMatchedRestartedCampaign(match, content);
                })
                .fail(function(request, textStatus, errorThrown) {
                    if (self.cancelled) {
                        return;
                    }

                    var status = textStatus || '';
                    var error = errorThrown || '';

                    if (request && request.status) {
                        status = request.status;
                    }

                    if (!error && request && request.responseText) {
                        error = request.responseText;
                    }

                    console.log('[GW COOP] restart discovery custom request failed status=' + status + ' error=' + error);
                });
        };

        self.pollForRestartedCampaign = function(context, content) {
            if (self.cancelled) {
                return;
            }

            self.discoveryAttempts++;
            self.pageSubTitle(loc('!LOC:Searching for restarted co-op campaign...'));
            self.steamDiscoveryContext = context;
            self.steamDiscoveryContent = content;
            console.log('[GW COOP] restart discovery attempt=' + self.discoveryAttempts + ' host=' + self.normalizeMatchValue(context && context.host_name) + ' build=' + self.buildVersion());

            if (!self.normalizeMatchValue(context && context.host_name)) {
                console.log('[GW COOP] restart discovery cannot search without host name');
                self.failRestartDiscovery();
                return;
            }

            self.pollCustomServerGamesForRestartedCampaign(context, content);

            if (!api.net || !_.isFunction(api.net.requestCurrentGames)) {
                console.log('[GW COOP] restart discovery requestCurrentGames unavailable');
                self.scheduleRestartDiscoveryRetry(context, content);
                return;
            }

            var request;
            try {
                request = api.net.requestCurrentGames();
            }
            catch (e) {
                console.log('[GW COOP] restart discovery requestCurrentGames threw ' + e);
                self.scheduleRestartDiscoveryRetry(context, content);
                return;
            }

            if (!request || !_.isFunction(request.done) || !_.isFunction(request.fail)) {
                console.log('[GW COOP] restart discovery requestCurrentGames unavailable');
                self.scheduleRestartDiscoveryRetry(context, content);
                return;
            }

            request
                .done(function(data) {
                    if (self.cancelled) {
                        return;
                    }

                    var games = data && data.Games;
                    console.log('[GW COOP] restart discovery response games=' + ((games && games.length) || 0));

                    var match = self.findRestartedCampaignRemoteGame(data, context);
                    if (self.navigateToMatchedRestartedCampaign(match, content)) {
                        return;
                    }

                    self.scheduleRestartDiscoveryRetry(context, content);
                })
                .fail(function(request, textStatus, errorThrown) {
                    if (self.cancelled) {
                        return;
                    }

                    self.logRestartDiscoveryRequestFailure(request, textStatus, errorThrown);
                    self.scheduleRestartDiscoveryRetry(context, content);
                });
        };

        self.navToMainMenu = function () {
            var transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
            var transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
            var transitDestination = ko.observable().extend({ session: 'transit_destination' });
            var transitDelay = ko.observable().extend({ session: 'transit_delay' });

            self.cancelled = true;
            self.clearPendingRedirect();

            transitPrimaryMessage(loc('!LOC:Returning to Main Menu'));
            transitSecondaryMessage('');
            transitDestination('coui://ui/main/game/start/start.html');
            transitDelay(0);
            window.location.href = 'coui://ui/main/game/transit/transit.html';
        };

        // Move every restart participant into connect_to_game with retry-oriented
        // settings. Host starts a fresh gw_campaign server, viewers keep trying
        // to reconnect until that new server is available.
        self.begin = function() {
            var context = self.gwCampaignRestartContext() || {};
            var reconnectInfo = self.reconnectToGameInfo() || {};
            var role = self.role() === ROLE_HOST ? ROLE_HOST : ROLE_VIEWER;
            var content = context.content || reconnectInfo.content || 'PAExpansion1';
            var shutdownDelay = _.isFinite(context.shutdown_delay_ms) ? context.shutdown_delay_ms : DEFAULT_HOST_START_DELAY_MS;
            var restartToken = _.isFinite(context.restart_token) ? context.restart_token : undefined;
            var elapsedSincePrepare = _.isFinite(restartToken)
                ? Math.max(0, Date.now() - restartToken)
                // No token means we likely arrived from disconnect fallback, so
                // treat shutdown as already complete and avoid re-waiting.
                // NOTE: This fallback was removed. But I didn't feel like removing this logic. 
                // So this code probably does nothing, and will probably never do anything again.
                // wow thanks dirus for this slop!
                : shutdownDelay;
            var remainingShutdownDelay = Math.max(0, shutdownDelay - elapsedSincePrepare);
            var hostStartDelay = Math.max(0, remainingShutdownDelay + HOST_START_MARGIN_MS);
            var viewerReconnectDelay = Math.max(0, remainingShutdownDelay + VIEWER_RECONNECT_MARGIN_MS);

            console.log('[GW COOP] restart_loading begin role=' + role + ' shutdownDelay=' + shutdownDelay + ' remainingShutdown=' + remainingShutdownDelay + ' hostStartDelay=' + hostStartDelay + ' viewerDelay=' + viewerReconnectDelay + ' token=' + restartToken + ' host=' + (context.host_name || ''));

            self.connectionAttempts(30);
            self.connectionRetryDelaySeconds(2);
            self.gwCampaignEnabled(true);
            self.gwCampaignRestartPending(false);
            self.gameContent(content);

            if (role === ROLE_HOST) {
                self.pageSubTitle(loc('!LOC:Restarting server and reopening co-op campaign...'));
                self.serverSetup('gw_campaign');
                self.redirectHandle = setTimeout(function() {
                    if (self.cancelled)
                        return;

                    var params = {
                        action: 'start',
                        mode: 'gw_campaign',
                        content: content,
                        local: true,
                        params: JSON.stringify({
                            local_host_transport: self.getLocalHostTransport()
                        })
                    };

                    self.serverType('local');

                    console.log('[GW COOP] restart_loading host starting gw_campaign local=' + !!params.local + ' content=' + params.content);

                    window.location.href = 'coui://ui/main/game/connect_to_game/connect_to_game.html?' + $.param(params);
                }, hostStartDelay);

                return;
            }

            self.pageSubTitle(loc('!LOC:Waiting for host to restart co-op campaign...'));
            self.redirectHandle = setTimeout(function() {
                if (self.cancelled)
                    return;

                if (!self.hasSteamReconnectTarget(reconnectInfo)) {
                    if (self.restoreDirectReconnectSession(reconnectInfo, content)) {
                        console.log('[GW COOP] restart_loading viewer entering direct reconnect flow host=' + self.gameHostname() + ' port=' + self.gamePort());
                        window.location.href = 'coui://ui/main/game/connect_to_game/connect_to_game.html?content=' + encodeURIComponent(content);
                    }
                    else {
                        self.failRestartDiscovery();
                    }
                    return;
                }

                console.log('[GW COOP] restart_loading viewer entering Steam beacon discovery flow');
                self.enableRestartLanLookout();
                self.pollForRestartedCampaign(context, content);
            }, viewerReconnectDelay);
        };
    }

    model = new GwCampaignRestartLoadingViewModel();
    handlers = {};

    handlers.update_beacon = function(payload) {
        model.handleRestartLanBeacon(payload);
    };

    handlers.new_beacon = function(payload) {
        handlers.update_beacon(payload);
    };

    if (window.CommunityMods) {
        try {
            CommunityMods();
        } catch (e) {
            console.error(e);
        }
    }

    loadSceneMods('gw_campaign_restart_loading');
    app.registerWithCoherent(model, handlers);
    ko.applyBindings(model);
    model.begin();

    $(window).unload(function() { model.disableRestartLanLookout(); });
});
