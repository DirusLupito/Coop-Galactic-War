var model;

$(document).ready(function () {

    var DEFAULT_CONNECTION_ATTEMPTS = 5;
    var DEFAULT_CONNECT_DELAY = 2;
    var DEFAULT_RETRY_DELAY = 5;
    var REQUIRED_GW_SCENE_KEYS = ['gw_war_over', 'gw_play', 'gw_start'];
    var REQUIRED_GW_DESCRIPTION_PHRASE = 'galactic war';

    function isGalacticWarForConnect(payload) {
        var serverGameType = payload
            && payload.data
            && payload.data.client
            && payload.data.client.game_options
            && payload.data.client.game_options.game_type;
        var reconnectInfo = model.reconnectToGameInfo && model.reconnectToGameInfo();
        var reconnectGameType = reconnectInfo && reconnectInfo.game;

        return serverGameType === 'Galactic War'
            || reconnectGameType === 'Galactic War';
    }

    function isGwTechCardsForConnect(payload) {
        var serverGameOptions = payload
            && payload.data
            && payload.data.client
            && payload.data.client.game_options;
        var reconnectInfo = model.reconnectToGameInfo && model.reconnectToGameInfo();

        return !!(serverGameOptions && serverGameOptions.gw_tech_cards_active)
            || !!(reconnectInfo && reconnectInfo.gw_tech_cards_active);
    }

    // Checks if the connect_to_game page is being opened for a GW campaign game
    // by looking to see if the payload state is gw_campaign or if the URL has the gw_campaign=1 parameter.
    function isGwCampaignForConnect(payload) {
        var url = payload && payload.url;

        return (payload && payload.state === 'gw_campaign')
            || (_.isString(url) && url.indexOf('coui://ui/main/game/galactic_war/gw_play/gw_play.html') === 0 && url.indexOf('gw_campaign=1') >= 0);
    }

    function getGwCampaignRoleFromPayload(payload) {
        // ES5 Slop. Evaluate left to right and return falsy if any part of the chain is missing.
        // If the chain is all truthy, return the last value.

        return payload
            && payload.data
            && payload.data.client
            && payload.data.client.role;
    }

    // If the payload contains a role of 'host', or if the URL parameters say both 
    // that this is a GW campaign and that the user is starting the game
    // then this code is being opened by a host of a GW campaign.
    function isGwCampaignHostOpening(payload) {
        var role = getGwCampaignRoleFromPayload(payload);
        if (role === 'host')
            return true;

        console.log('[GW COOP] did not find host role in payload: ' + role);
        return $.url().param('action') === 'start'
            && $.url().param('mode') === 'gw_campaign';
    }

    // Used to set some flags in sessionStorage so that the host's UI can bypass
    // the campaign loading process and directly open the authoritative GW campaign lobby and game UI.
    // Specifically, gw_play looks at these flags to bypass the normal client campaign loading process.
    function markActiveGwGameAuthoritativeForHost() {
        var activeGameId = ko.observable().extend({ local: 'gw_active_game' })();

        try {
            sessionStorage.setItem('gw_campaign_host_opening', 'true');
        }
        catch (e) {
        }

        if (_.isUndefined(activeGameId) || activeGameId === null)
            return;

        try {
            sessionStorage.setItem('gw_campaign_authoritative_game_id', String(activeGameId));
        }
        catch (e) {
        }
    }

    function normalizeModIdentifier(identifier) {
        if (!_.isString(identifier))
            return '';

        var trimmed = identifier.trim();
        if (!trimmed.length)
            return '';

        return trimmed.toLowerCase();
    }

    function getRequiredGwScenesForMod(mod) {
        var scenes = mod && mod.scenes;
        if (!scenes || !_.isObject(scenes))
            return [];

        return _.filter(REQUIRED_GW_SCENE_KEYS, function(sceneKey) {
            if (!_.has(scenes, sceneKey))
                return false;

            var sceneValue = scenes[sceneKey];
            if (_.isArray(sceneValue))
                return sceneValue.length > 0;

            return !!sceneValue;
        });
    }

    function hasRequiredGwDescription(mod) {
        var description = mod && mod.description;
        if (!_.isString(description))
            return false;

        return description.toLowerCase().indexOf(REQUIRED_GW_DESCRIPTION_PHRASE) !== -1;
    }

    function isRequiredGwClientMod(mod) {
        return getRequiredGwScenesForMod(mod).length > 0
            && hasRequiredGwDescription(mod);
    }

    function extractRejectReason(payload) {
        if (_.isString(payload))
            return payload;

        if (!payload)
            return '';

        if (_.isString(payload.reason))
            return payload.reason;
        if (_.isString(payload.message))
            return payload.message;
        if (_.isString(payload.payload))
            return payload.payload;

        return '';
    }

    function getPayloadObject(payload) {
        if (payload && _.isObject(payload.payload))
            return payload.payload;

        return payload || {};
    }

    function isMissingRequiredModsPayload(payload) {
        var data = getPayloadObject(payload);
        var reason = extractRejectReason(data) || extractRejectReason(payload);

        return (_.isArray(data.missing) && data.missing.length > 0)
            || (_.isArray(data.missing_identifiers) && data.missing_identifiers.length > 0)
            || (_.isArray(data.extra_identifiers) && data.extra_identifiers.length > 0)
            || (_.isString(reason) && reason.indexOf('Missing required mods') === 0)
            || (_.isString(reason) && reason.indexOf('Client mod mismatch') === 0);
    }

    function getModMismatchLabels(identifiers, namesById) {
        var labels = [];
        var seen = {};

        _.forEach(identifiers || [], function(identifier) {
            var normalizedIdentifier = normalizeModIdentifier(identifier);
            if (!normalizedIdentifier || seen[normalizedIdentifier])
                return;

            seen[normalizedIdentifier] = true;
            labels.push(namesById[normalizedIdentifier] || identifier);
        });

        return labels;
    }

    function getMissingRequiredModLabels(payload) {
        var data = getPayloadObject(payload);
        var missingIdentifiers = data.missing_identifiers || data.missing || [];
        var namesById = data.required_names_by_id || {};

        return getModMismatchLabels(missingIdentifiers, namesById);
    }

    function getExtraRequiredModLabels(payload) {
        var data = getPayloadObject(payload);
        var extraIdentifiers = data.extra_identifiers || [];
        var namesById = data.extra_names_by_id || {};

        return getModMismatchLabels(extraIdentifiers, namesById);
    }

    function buildClientModManifest(mountedMods) {
        var activeIdentifiers = [];
        var activeRequiredIdentifiers = [];
        var activeRequiredNamesById = {};
        var seen = {};
        var seenRequired = {};

        _.forEach(mountedMods || [], function(mod) {
            var identifier = normalizeModIdentifier(mod && mod.identifier);
            if (!identifier) {
                console.log('[GW COOP] skipping mounted client mod with missing identifier while building manifest');
                return;
            }

            if (!seen[identifier]) {
                seen[identifier] = true;
                activeIdentifiers.push(identifier);
            }

            if (!isRequiredGwClientMod(mod) || seenRequired[identifier]) {
                return;
            }

            seenRequired[identifier] = true;
            activeRequiredIdentifiers.push(identifier);
            activeRequiredNamesById[identifier] = (_.isString(mod.display_name) && mod.display_name.length)
                ? mod.display_name
                : identifier;
        });

        return {
            active_identifiers: activeIdentifiers,
            active_required_identifiers: activeRequiredIdentifiers,
            active_required_names_by_id: activeRequiredNamesById
        };
    }

    function isGwCoopConnectContext() {
        if (!model)
            return false;

        console.log('[GW COOP] Checking if connect context is for GW Coop; setup=' + model.serverSetup() + ' reconnectInfo=' + JSON.stringify(model.reconnectToGameInfo()));

        var setup = model.serverSetup && model.serverSetup();
        if (setup === 'gw_campaign')
            return true;

        var reconnectInfo = model.reconnectToGameInfo && model.reconnectToGameInfo();
        return reconnectInfo && reconnectInfo.setup === 'gw_campaign';
    }

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
        self.redirectURL = ko.observable(undefined);
        self.requiredClientModGateVisible = ko.observable(false);
        self.requiredClientModGateReason = ko.observable('');
        self.requiredClientModGateMissingMods = ko.observableArray([]);
        self.requiredClientModGateExtraMods = ko.observableArray([]);
        self.requiredClientModGateGoingBack = false;
        self.requiredClientModGateAcknowledged = false;
        self.waitingForClientModMatch = false;
        self.pendingServerStatePayload = undefined;

        self.shouldGateServerStateForClientModMatch = function() {
            return true;
        };

        self.beginClientModMatchWait = function(trigger) {
            if (!self.shouldGateServerStateForClientModMatch()) {
                console.log('[GW COOP] skipping client-mod match wait during reconnect trigger=' + (trigger || 'unknown'));
                return;
            }

            if (self.waitingForClientModMatch)
                return;

            self.waitingForClientModMatch = true;
            self.pendingServerStatePayload = undefined;
            self.pageSubTitle(loc('!LOC:VALIDATING REQUIRED CLIENT MODS'));
            console.log('[GW COOP] begin client-mod match wait trigger=' + (trigger || 'unknown'));
        };

        self.completeClientModMatchWait = function(source) {
            if (!self.waitingForClientModMatch)
                return;

            self.waitingForClientModMatch = false;
            var queuedServerState = self.pendingServerStatePayload;
            self.pendingServerStatePayload = undefined;

            console.log('[GW COOP] complete client-mod match wait source=' + (source || 'unknown') + ' hasQueuedServerState=' + !!queuedServerState);

            if (queuedServerState && !self.requiredClientModGateVisible())
                handlers.server_state(queuedServerState);
        };

        self.disconnectFromServer = function(reason) {
            if (!_.isFunction(self.disconnect)) {
                console.log('[GW COOP] disconnect() unavailable while handling reason=' + (reason || ''));
                return;
            }

            console.log('[GW COOP] disconnecting client from required-mod gate reason=' + (reason || ''));
            try {
                self.disconnect();
            } catch (e) {
                console.error('[GW COOP] disconnect() threw while handling required-mod gate');
                console.error(e);
            }
        };

        self.showRequiredClientModGate = function(payload) {
            if (self.requiredClientModGateAcknowledged) {
                console.log('[GW COOP] ignoring duplicate required client mod gate after acknowledgement');
                return;
            }

            var data = getPayloadObject(payload);
            var reason = extractRejectReason(data) || extractRejectReason(payload);
            var gateReason = _.isString(reason) && reason.length
                ? reason
                : 'Client mod mismatch';
            var missingLabels = getMissingRequiredModLabels(data);
            var extraLabels = getExtraRequiredModLabels(data);

            self.connecting(false);
            self.showCancel(false);
            self.waitingForClientModMatch = true;
            self.requiredClientModGateReason(gateReason);
            self.requiredClientModGateMissingMods(missingLabels);
            self.requiredClientModGateExtraMods(extraLabels);
            self.requiredClientModGateVisible(true);
            self.pageTitle(loc('!LOC:CLIENT MOD MISMATCH'));
            self.pageSubTitle('');

            console.log('[GW COOP] showing required client mod gate reason=' + gateReason
                + ' missing=' + JSON.stringify(missingLabels)
                + ' extra=' + JSON.stringify(extraLabels));
        };

        self.acknowledgeRequiredClientModRisk = function() {
            var reason = self.requiredClientModGateReason();
            self.requiredClientModGateVisible(false);
            self.requiredClientModGateAcknowledged = true;

            model.send_message('required_client_mods_acknowledged', {
                proceed: true,
                reason: reason
            }, function(success, response) {
                console.log('[GW COOP] required_client_mods_acknowledged success=' + !!success + ' response=' + JSON.stringify(response || {}));
            });

            self.completeClientModMatchWait('required_client_mods_acknowledged');
        };

        self.goBackFromRequiredClientModGate = function() {
            var reason = self.requiredClientModGateReason() || loc('!LOC:Client mod mismatch');
            var transitReason = loc('!LOC:Client mod mismatch');
            self.requiredClientModGateGoingBack = true;
            self.requiredClientModGateAcknowledged = true;
            self.requiredClientModGateVisible(false);
            self.cancelling(true);
            self.connectionAttemptsRemaining = 0;
            self.waitingForClientModMatch = false;
            self.pendingServerStatePayload = undefined;

            self.disconnectFromServer(reason);
            self.fail(transitReason);
        };

        self.publishRequiredClientMods = function() {
            console.log('[GW COOP] Publishing required client mods for current game');
            api.mods.getMounted('client', true).then(function(mountedMods) {
                var requiredIdentifiers = [];
                var requiredNamesById = {};
                var seen = {};
                var mountedCount = _.size(mountedMods || []);

                console.log('[GW COOP] mounted client mod count=' + mountedCount);

                _.forEach(mountedMods || [], function(mod) {
                    var identifier = normalizeModIdentifier(mod && mod.identifier);
                    if (!identifier) {
                        console.log('[GW COOP] skipping mounted mod with missing identifier');
                        return;
                    }

                    if (seen[identifier])
                        return;

                    var matchingScenes = getRequiredGwScenesForMod(mod);
                    var hasDescriptionPhrase = hasRequiredGwDescription(mod);

                    if (!matchingScenes.length || !hasDescriptionPhrase) {
                        console.log('[GW COOP] mod not required id=' + identifier
                            + ' matchedScenes=' + JSON.stringify(matchingScenes)
                            + ' hasDescriptionPhrase=' + hasDescriptionPhrase);
                        return;
                    }

                    console.log('[GW COOP] mod required id=' + identifier + ' matchedScenes=' + JSON.stringify(matchingScenes));

                    seen[identifier] = true;
                    requiredIdentifiers.push(identifier);
                    requiredNamesById[identifier] = (_.isString(mod.display_name) && mod.display_name.length)
                        ? mod.display_name
                        : identifier;
                });

                console.log('[GW COOP] Required client mod identifiers: ' + JSON.stringify(requiredIdentifiers));
                console.log('[GW COOP] Required client mod names by ID: ' + JSON.stringify(requiredNamesById));

                sessionStorage.setItem('gw_required_client_mod_identifiers', JSON.stringify(requiredIdentifiers));
                console.log('[GW COOP] persisted required client mod identifiers for GW referee generation');


                // Server enforces host-only writes; non-host clients are ignored.
                model.send_message('set_required_client_mods', {
                    required_identifiers: requiredIdentifiers,
                    required_names_by_id: requiredNamesById
                }, function(success, response) {
                    console.log('[GW COOP] set_required_client_mods success=' + !!success + ' response=' + JSON.stringify(response || {}));
                });
            }, function() {
                console.log('[GW COOP] getMounted(client,true) failed; sending empty required mod list');
                sessionStorage.setItem('gw_required_client_mod_identifiers', JSON.stringify([]));
                model.send_message('set_required_client_mods', {
                    required_identifiers: [],
                    required_names_by_id: {}
                }, function(success, response) {
                    console.log('[GW COOP] set_required_client_mods(empty) success=' + !!success + ' response=' + JSON.stringify(response || {}));
                });
            });
        };

        self.sendClientModManifest = function() {
            console.log('[GW COOP] sendClientModManifest begin setup=' + self.serverSetup() + ' game=' + self.gameType());
            self.requiredClientModGateAcknowledged = false;
            api.mods.getMounted('client', true).then(function(mountedMods) {
                var manifest = buildClientModManifest(mountedMods);

                model.send_message('client_mod_manifest', manifest, function(success, response) {
                    console.log('[GW COOP] client_mod_manifest success=' + !!success
                        + ' active=' + JSON.stringify(manifest.active_identifiers)
                        + ' active_required=' + JSON.stringify(manifest.active_required_identifiers)
                        + ' response=' + JSON.stringify(response || {}));

                    if (isMissingRequiredModsPayload(response)) {
                        self.showRequiredClientModGate(response);
                    }
                    else if (!!success) {
                        self.completeClientModMatchWait('manifest_response_success');
                    }
                });
            }, function() {
                console.log('[GW COOP] getMounted(client,true) failed while building manifest; sending empty manifest');
                model.send_message('client_mod_manifest', {
                    active_identifiers: [],
                    active_required_identifiers: [],
                    active_required_names_by_id: {}
                }, function(success, response) {
                    console.log('[GW COOP] client_mod_manifest(empty) success=' + !!success + ' response=' + JSON.stringify(response || {}));

                    if (isMissingRequiredModsPayload(response)) {
                        self.showRequiredClientModGate(response);
                    }
                    else if (!!success) {
                        self.completeClientModMatchWait('manifest_response_success_empty');
                    }
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
                else if (reconnectInfo.game === 'Galactic War')
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
                self.gameSteamId('');

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
        model.waitingForClientModMatch = false;
        model.pendingServerStatePayload = undefined;
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
        model.requiredClientModGateVisible(false);
        model.requiredClientModGateReason('');
        model.requiredClientModGateMissingMods([]);
        model.requiredClientModGateExtraMods([]);
        model.requiredClientModGateGoingBack = false;
        model.requiredClientModGateAcknowledged = false;
        model.waitingForClientModMatch = false;
        model.pendingServerStatePayload = undefined;

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
        var gwCoopContext = isGwCoopConnectContext();
        console.log('[GW COOP] login_accepted gwCoopContext=' + gwCoopContext + ' setup=' + model.serverSetup() + ' game=' + model.gameType());
        if (gwCoopContext)
            model.publishRequiredClientMods();

        model.cancelTimer = setTimeout(model.enableCancel, 30000);
    };

    handlers.request_client_mod_manifest = function () {
        console.log('[GW COOP] request_client_mod_manifest received in connect_to_game setup=' + model.serverSetup() + ' game=' + model.gameType());
        model.beginClientModMatchWait('request_client_mod_manifest');
        model.sendClientModManifest();
    };

    handlers.all_client_mods_match = function(payload) {
        console.log('[GW COOP] all_client_mods_match received payload=' + JSON.stringify(payload || {}));
        model.completeClientModMatchWait('all_client_mods_match_message');
    };

    handlers.required_client_mods_missing = function(payload) {
        var rejectReason = extractRejectReason(payload);
        console.log('[GW COOP] required_client_mods_missing received reason=' + rejectReason + ' payload=' + JSON.stringify(payload || {}));
        model.showRequiredClientModGate(payload);
    };

    handlers.login_rejected = function (payload) {
        console.error('login_rejected');
        console.error(JSON.stringify(payload));
        model.connecting(false);
        model.waitingForClientModMatch = false;
        model.pendingServerStatePayload = undefined;
        var rejectReason = extractRejectReason(payload);
        var missingRequiredMods = isMissingRequiredModsPayload(payload);

        if (missingRequiredMods) {
            return model.showRequiredClientModGate(payload);
        }

        if (model.shouldRetry())
            model.retryConnection();
        else
        {
            if (_.isString(rejectReason) && rejectReason.length)
                model.fail(rejectReason);
            else if (model.isLocalGame())
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
        if ((model.waitingForClientModMatch || model.requiredClientModGateVisible()) && model.shouldGateServerStateForClientModMatch()) {
            if (payload && payload.url)
                model.pendingServerStatePayload = payload;

            console.log('[GW COOP] deferring server_state while waiting for client-mod match url=' + ((payload && payload.url) || '<none>'));
            return;
        }

        var url = payload.url;

        if (isGwCampaignForConnect(payload)) {
            if (isGwCampaignHostOpening(payload)) {
                markActiveGwGameAuthoritativeForHost();
            }
            else {
                var campaignTarget = url || 'coui://ui/main/game/galactic_war/gw_play/gw_play.html?gw_campaign=1';
                // Clear any stale session flags that might interfere with the campaign loading process. 
                try {
                    sessionStorage.removeItem('gw_campaign_authoritative_game_id');
                    sessionStorage.removeItem('gw_campaign_host_opening');
                }
                catch (e) {
                }
                url = 'coui://ui/main/game/galactic_war/gw_campaign_loading/gw_campaign_loading.html?target=' + encodeURIComponent(campaignTarget);
            }
        }
        else if (url === 'coui://ui/main/game/live_game/live_game.html' && (isGalacticWarForConnect(payload) || isGwTechCardsForConnect(payload))) {
            var stagingUrl = 'coui://ui/main/game/galactic_war/gw_reconnect_loading/gw_reconnect_loading.html?target=' + encodeURIComponent(url);

            url = stagingUrl;
        }

// ignore server state messages not redirecting to a new scene

        if (url !== window.location.href) {

            model.redirectURL(url);

// if we are uploading server mods then ignore server state messages

            if (model.serverModsUploading()) {
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

        if (model.requiredClientModGateGoingBack) {
            console.log('[GW COOP] disconnect after required-mod gate go-back; no retry/redirect');
            return;
        }

        model.waitingForClientModMatch = false;
        model.pendingServerStatePayload = undefined;

        if (isMissingRequiredModsPayload(payload)) {
            return model.showRequiredClientModGate(payload);
        }

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
