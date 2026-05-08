var console = require('console'); // temporary workaround
var main = require('main');
var env = require('env');
var utils = require('utils');
var content_manager = require('content_manager');
var bouncer = require('bouncer');
var _ = require('thirdparty/lodash');

var DEFAULT_GW_CAMPAIGN_PLAYERS = 2;
var DEFAULT_GW_CAMPAIGN_PLAYERS_LIMIT = 6;
var VIEWER_RECONNECT_TIMEOUT = 30 * 1000; // ms
var MAX_LOBBY_CHAT_HISTORY = 100;
var CLIENT_MOD_MANIFEST_TIMEOUT_MS = 60 * 1000; // ms
var CLIENT_MOD_SELF_DISCONNECT_TIMEOUT_MS = 60 * 1000; // ms

// We determine the max players limit for the campaign lobby in a two stage process;
// first we see if the launch option (in steam, --local-server-max-players=N) is present and valid, and if so we use that; 
// otherwise, we fall back to a hardcoded default.
var getCampaignMaxPlayersLimit = function() {
    var envIndex = env.indexOf('--max-players');
    if (envIndex !== -1) {
        var envValue = parseInt(env[envIndex + 1]);
        if (_.isFinite(envValue) && envValue > 0)
            return envValue;
    }
    return DEFAULT_GW_CAMPAIGN_PLAYERS_LIMIT;
};

var model;

function GWCampaignModel(creator) {
    var self = this;
    self.baseMaxClientsLimit = getCampaignMaxPlayersLimit();
    self.maxClientsLimit = self.baseMaxClientsLimit;
    self.maxClientsLocked = false;
    self.maxClients = Math.max(1, Math.min(DEFAULT_GW_CAMPAIGN_PLAYERS, self.maxClientsLimit));
    self.sharedControl = true;
    self.perPlayerTechCards = false;
    self.effectiveSharedControl = function() {
        return self.perPlayerTechCards ? false : self.sharedControl;
    };

    self.creatorId = creator.id;
    self.creatorName = creator.name;
    // Tracks whether the gw_campaign state is active. T
    // his is used to prevent any late-arriving messages or connections from being processed by 
    // gw_campaign handlers after the game has gone somewhere else. Like live_game.
    // So I don't get goddamn stuck reconnecting forever at 1 AM on a monday...
    self.active = false;
    self.viewerReconnectTimers = {};
    self.disconnectCleanup = [];
    self.lastSnapshot = undefined;
    self.lastSnapshotSeq = 0;
    self.lobbyChatHistory = [];
    self.requiredClientModIdentifiers = [];
    self.requiredClientModNamesById = {};
    self.pendingManifestTimeoutByClientId = {};
    self.pendingSelfDisconnectTimeoutByClientId = {};
    self.clientManifestReceivedByClientId = {};
    self.clientManifestValidatedByClientId = {};
    self.clientLoading = {};
    self.clientLoadingStatus = {};
    self.access = {
        password: '',
        friends: [],
        blocked: []
    };

    // Default settings.
    // Note that for now the default tag should be one of 'Testing', 'Casual', 'Competitive', or 'AI Battle'
    // since otherwise for some reason the beacon won't show up outside of a local area network.
    self.settings = {
        game_name: 'GW Co-op Campaign',
        tag: 'Testing',
        public: true,
        friends: false,
        hidden: false
    };

    self.control = {
        host_id: self.creatorId,
        host_name: self.creatorName,
        max_clients: self.maxClients,
        max_clients_limit: self.maxClientsLimit,
        max_clients_locked: self.maxClientsLocked,
        shared_control: self.effectiveSharedControl(),
        per_player_tech_cards: self.perPlayerTechCards,
        connected_clients: [],
        has_snapshot: false,
        snapshot_seq: 0,
        settings: _.cloneDeep(self.settings),
        require_password: false
    };

    // Updates lobby visibility and access
    self.updateBouncer = function(config) {
        var data = config || {};

        if (_.has(data, 'password')) {
            bouncer.setPassword(data.password);
            self.access.password = _.isString(data.password) ? data.password : '';
        }

        if (_.has(data, 'friends')) {
            bouncer.clearWhitelist();
            if (_.isArray(data.friends) && data.friends.length)
                _.forEach(data.friends, function(id) { bouncer.addPlayerToWhitelist(id); });
            self.access.friends = _.isArray(data.friends) ? _.cloneDeep(data.friends) : [];
        }

        if (_.has(data, 'blocked')) {
            bouncer.clearBlacklist();
            if (_.isArray(data.blocked) && data.blocked.length)
                _.forEach(data.blocked, function(id) { bouncer.addPlayerToBlacklist(id); });
            self.access.blocked = _.isArray(data.blocked) ? _.cloneDeep(data.blocked) : [];
        }
    };

    self.normalizeClientModIdentifier = function(identifier) {
        if (!_.isString(identifier))
            return '';

        var trimmed = identifier.trim();
        if (!trimmed.length)
            return '';

        return trimmed.toLowerCase();
    };

    self.normalizeClientModIdentifiers = function(identifiers) {
        var normalized = [];
        var seen = {};

        _.forEach(identifiers || [], function(identifier) {
            var normalizedIdentifier = self.normalizeClientModIdentifier(identifier);
            if (!normalizedIdentifier || seen[normalizedIdentifier])
                return;

            seen[normalizedIdentifier] = true;
            normalized.push(normalizedIdentifier);
        });

        return normalized;
    };

    self.normalizeClientModNamesById = function(namesById, identifiers) {
        var normalizedNames = {};
        _.forEach(identifiers || [], function(identifier) {
            normalizedNames[identifier] = identifier;
        });

        _.forIn(namesById || {}, function(name, key) {
            var normalizedIdentifier = self.normalizeClientModIdentifier(key);
            if (!normalizedIdentifier || identifiers.indexOf(normalizedIdentifier) === -1)
                return;

            if (_.isString(name) && name.length)
                normalizedNames[normalizedIdentifier] = name;
        });

        return normalizedNames;
    };

    self.setRequiredClientModsData = function(requiredIdentifiers, requiredNamesById) {
        var previousRequiredIdentifiers = _.clone(self.requiredClientModIdentifiers);
        self.requiredClientModIdentifiers = self.normalizeClientModIdentifiers(requiredIdentifiers);
        self.requiredClientModNamesById = self.normalizeClientModNamesById(requiredNamesById, self.requiredClientModIdentifiers);

        if (!_.isEqual(previousRequiredIdentifiers, self.requiredClientModIdentifiers))
            self.clientManifestValidatedByClientId = {};

        console.log('[GW COOP] MOD CHECK [gw_campaign] required_identifiers=' + JSON.stringify(self.requiredClientModIdentifiers));

        if (!self.requiredClientModIdentifiers.length)
            self.clearAllPendingManifestTimeouts();
    };

    self.clearPendingSelfDisconnectTimeout = function(clientId) {
        var timeout = self.pendingSelfDisconnectTimeoutByClientId[clientId];
        if (timeout)
            clearTimeout(timeout);

        delete self.pendingSelfDisconnectTimeoutByClientId[clientId];
    };

    self.clearAllPendingSelfDisconnectTimeouts = function() {
        _.forEach(self.pendingSelfDisconnectTimeoutByClientId, function(timeout) {
            clearTimeout(timeout);
        });

        self.pendingSelfDisconnectTimeoutByClientId = {};
    };

    self.clearPendingManifestTimeout = function(clientId) {
        var timeout = self.pendingManifestTimeoutByClientId[clientId];
        if (timeout)
            clearTimeout(timeout);

        delete self.pendingManifestTimeoutByClientId[clientId];
        delete self.clientManifestReceivedByClientId[clientId];
    };

    self.clearAllPendingManifestTimeouts = function() {
        _.forEach(self.pendingManifestTimeoutByClientId, function(timeout) {
            clearTimeout(timeout);
        });

        self.pendingManifestTimeoutByClientId = {};
        self.clientManifestReceivedByClientId = {};
        self.clearAllPendingSelfDisconnectTimeouts();
    };

    self.buildMissingRequiredModsReason = function(missingIdentifiers) {
        if (!missingIdentifiers || !missingIdentifiers.length)
            return 'Missing required mods [client did not report active client mods]';

        return 'Missing required mods ' + _.map(missingIdentifiers, function(identifier) {
            var displayName = self.requiredClientModNamesById && self.requiredClientModNamesById[identifier];
            var label = (_.isString(displayName) && displayName.length)
                ? displayName
                : identifier;

            return '[' + label + ']';
        }).join('');
    };

    self.notifyClientMissingRequiredMods = function(client, missingIdentifiers) {
        if (!client || !client.connected)
            return;

        var rejectReason = self.buildMissingRequiredModsReason(missingIdentifiers);

        self.clearPendingSelfDisconnectTimeout(client.id);

        console.log('[GW COOP] MOD CHECK [gw_campaign] notifying client=' + client.id + ' missing=' + JSON.stringify(missingIdentifiers) + ' reason="' + rejectReason + '"');

        client.message({
            message_type: 'required_client_mods_missing',
            payload: {
                reason: rejectReason,
                missing_identifiers: _.clone(missingIdentifiers || []),
                required_identifiers: _.clone(self.requiredClientModIdentifiers),
                required_names_by_id: _.cloneDeep(self.requiredClientModNamesById)
            }
        });

        self.pendingSelfDisconnectTimeoutByClientId[client.id] = setTimeout(function() {
            if (!client.connected)
                return;

            self.clearPendingSelfDisconnectTimeout(client.id);
            console.warn('[GW COOP] MOD CHECK [gw_campaign] client did not self-disconnect after missing required mod notice; leaving connection open client=' + client.id + ' reason="' + rejectReason + '"');
        }, CLIENT_MOD_SELF_DISCONNECT_TIMEOUT_MS);
    };

    self.requestClientManifest = function(client, reconnect) {
        if (!client || !client.connected) {
            console.log('[GW COOP] MOD CHECK [gw_campaign] skipping manifest request for invalid/disconnected client');
            return;
        }

        if (!self.requiredClientModIdentifiers.length) {
            console.log('[GW COOP] MOD CHECK [gw_campaign] no required client mods set; allowing client=' + client.id + ' without manifest gate');
            return;
        }

        self.clearPendingManifestTimeout(client.id);
        self.clientManifestReceivedByClientId[client.id] = false;

        console.log('[GW COOP] MOD CHECK [gw_campaign] requesting manifest from client=' + client.id + ' reconnect=' + !!reconnect + ' required=' + JSON.stringify(self.requiredClientModIdentifiers));

        client.message({
            message_type: 'request_client_mod_manifest',
            payload: {
                required_identifiers: self.requiredClientModIdentifiers,
                required_names_by_id: self.requiredClientModNamesById
            }
        });

        self.pendingManifestTimeoutByClientId[client.id] = setTimeout(function() {
            if (!client.connected || self.clientManifestReceivedByClientId[client.id])
                return;

            self.clearPendingManifestTimeout(client.id);
            self.clientManifestValidatedByClientId[client.id] = false;
            console.warn('[GW COOP] MOD CHECK [gw_campaign] manifest timeout; leaving connection open client=' + client.id + ' reason="' + self.buildMissingRequiredModsReason() + '"');
        }, CLIENT_MOD_MANIFEST_TIMEOUT_MS);
    };

    // Builds the launch context for the gw_lobby state based on the current campaign lobby settings 
    // and an optional payload provided by the host client when they click "Play" from the campaign lobby panel.
    // This will let the in-game lobby know that it's launching from a co-op campaign lobby and apply 
    // any relevant settings or metadata that the host client provided when launching.
    self.buildGwLobbyLaunchContext = function(payload) {
        var data = payload || {};
        var payloadSettings = data.gw_campaign_settings || {};
        var settings = {
            game_name: _.isString(self.settings.game_name) ? self.settings.game_name : 'GW Co-op Campaign',
            tag: _.isString(self.settings.tag) ? self.settings.tag : 'Testing',
            public: _.isBoolean(self.settings.public) ? self.settings.public : true,
            friends: !!self.settings.friends,
            hidden: !!self.settings.hidden,
            shared_control: self.effectiveSharedControl(),
            per_player_tech_cards: self.perPlayerTechCards
        };

        // Host payload is optional fallback metadata; authoritative values come from self.settings.
        if (!_.isString(settings.game_name) && _.isString(payloadSettings.game_name))
            settings.game_name = payloadSettings.game_name;
        if (!_.isString(settings.tag) && _.isString(payloadSettings.tag))
            settings.tag = payloadSettings.tag;

        return {
            gw_campaign_active: true,
            current_star: _.isNumber(data.current_star) ? data.current_star : undefined,
            settings: settings,
            max_clients: self.maxClients,
            shared_control: self.effectiveSharedControl(),
            per_player_tech_cards: self.perPlayerTechCards,
            required_client_mods: {
                required_identifiers: _.clone(self.requiredClientModIdentifiers),
                required_names_by_id: _.cloneDeep(self.requiredClientModNamesById)
            },
            access: {
                password: _.isString(self.access.password) ? self.access.password : '',
                friends: _.cloneDeep(bouncer.getWhitelist()),
                blocked: _.cloneDeep(bouncer.getBlacklist())
            }
        };
    };

    // Applies specifically settings to the co-op campaign lobby; 
    // that is, the game's title/name, the tag, and what kind
    // of visibility it should have on the beacon.
    // Also the max players setting, which is a bit more involved since it requires validating 
    // the input and also making sure we don't set the max players to be less than the number of currently connected clients.
    self.applySettings = function(config) {
        var data = config || {};

        if (_.isString(data.game_name))
            self.settings.game_name = data.game_name.substring(0, Math.min(data.game_name.length, 128));

        if (_.isString(data.tag))
            self.settings.tag = data.tag;

        if (_.isBoolean(data.public))
            self.settings.public = data.public;

        if (_.has(data, 'per_player_tech_cards'))
            self.perPlayerTechCards = !!data.per_player_tech_cards;

        if (_.has(data, 'shared_control'))
            self.sharedControl = self.perPlayerTechCards ? false : !!data.shared_control;

        if (self.perPlayerTechCards)
            self.sharedControl = false;

        if (_.has(data, 'max_clients_locked')) {
            self.maxClientsLocked = !!data.max_clients_locked;

            if (self.maxClientsLocked) {
                var requestedLimit = parseInt(_.has(data, 'max_clients_limit') ? data.max_clients_limit : data.max_clients);
                if (_.isFinite(requestedLimit) && requestedLimit > 0)
                    self.maxClientsLimit = Math.max(1, Math.min(Math.floor(requestedLimit), self.baseMaxClientsLimit));
                else
                    self.maxClientsLimit = Math.max(1, Math.min(1, self.baseMaxClientsLimit));
            }
            else
                self.maxClientsLimit = self.baseMaxClientsLimit;
        }

        if (_.has(data, 'max_clients')) {
            var connectedCount = self.getConnectedClients().length;
            var requestedMax = parseInt(data.max_clients);
            if (_.isFinite(requestedMax)) {
                requestedMax = Math.floor(requestedMax);
                self.maxClients = Math.max(Math.max(1, connectedCount), Math.min(requestedMax, self.maxClientsLimit));
                server.maxClients = self.maxClients;
            }
        }

        self.maxClients = Math.max(1, Math.min(self.maxClients, self.maxClientsLimit));
        server.maxClients = self.maxClients;

        self.updateBouncer(data);

        var hasFriendsList = bouncer.getWhitelist().length > 0;
        self.settings.friends = hasFriendsList;
        self.settings.hidden = (!self.settings.public && !hasFriendsList);
    };

    self.getConnectedClients = function() {
        var connectedClients = _.filter(server.clients, function(client) {
            return client.connected;
        });

        // We want to make sure the host is always included in the list of 
        // connected clients that gets sent to the UI, even if for some reason their 
        // client object isn't showing up as connected in server.clients 
        // (which is the source of truth for who's connected and who isn't).
        var hostPresent = _.some(connectedClients, function(client) {
            return client && client.id === self.creatorId;
        });

        if (!hostPresent) {
            var hostClient = _.find(server.clients, function(client) {
                return client && client.id === self.creatorId;
            });

            if (hostClient)
                connectedClients.unshift(hostClient);
        }

        return connectedClients;
    };

    self.getRoleForClient = function(client) {
        if (!client)
            return 'viewer';
        return client.id === self.creatorId ? 'host' : 'viewer';
    };

    // Helper to check if a client is allowed to join the lobby based on 
    // how many clients are currently connected compared to the max clients limit.
    // Originally I programmed this so it also took reconnect into account,
    // but since gw_campaign is a lobby state where slots can be added
    // and removed, it means that we no longer need to worry about a scenario
    // where all the slots are full including a slot for a client that crashed
    // and is now trying to reconnect, but can't because the slot is still technically occupied 
    // by their previous connection which means paradoxically that they can't reconnect to their own slot.
    // This is because in gw_campaign, the host is still at a stage where they can just open up more slots.
    self.hasRoomForClient = function(client) {
        if (!client)
            return false;

        var connectedClients = _.filter(server.clients, function(existingClient) {
            return existingClient
                && existingClient.connected
                && existingClient.id !== client.id;
        });

        return connectedClients.length < self.maxClients;
    };

    self.getClientState = function(client) {
        return {
            id: client && client.id,
            name: client && client.name,
            role: self.getRoleForClient(client),
            requires_loadout: self.clientRequiresLoadout(client)
        };
    };

    self.findCoopPlayerInventoryData = function(client) {
        if (!client || !self.lastSnapshot || !self.lastSnapshot.snapshot || !self.lastSnapshot.snapshot.game)
            return undefined;

        var game = self.lastSnapshot.snapshot.game;
        var inventoryData = _.isArray(game.coopPlayerInventoryData) ? game.coopPlayerInventoryData : [];
        var idMatches = _.filter(inventoryData, function(record) {
            return record && !_.isUndefined(record.playerId) && String(record.playerId) === String(client.id);
        });

        if (idMatches.length > 1) {
            console.log('[GW COOP] Expected one inventory data record for client id ' + client.id + ', found ' + idMatches.length + '.');
            return undefined;
        }

        if (idMatches.length === 1)
            return idMatches[0];

        if (_.isString(client.name) && client.name.length) {
            var nameMatches = _.filter(inventoryData, function(record) {
                return record && record.playerName === client.name;
            });

            if (nameMatches.length > 1) {
                console.log('[GW COOP] Expected one inventory data record for client name ' + client.name + ', found ' + nameMatches.length + '.');
                return undefined;
            }

            if (nameMatches.length === 1)
                return nameMatches[0];
        }

        return undefined;
    };

    self.upsertCoopPlayerInventoryData = function(record) {
        if (!record || !self.lastSnapshot || !self.lastSnapshot.snapshot || !self.lastSnapshot.snapshot.game)
            return false;

        var game = self.lastSnapshot.snapshot.game;
        var inventoryData = _.isArray(game.coopPlayerInventoryData) ? game.coopPlayerInventoryData.slice(0) : [];
        var existingIndex = -1;
        var playerId = record.playerId;
        var playerName = record.playerName;

        if (!_.isUndefined(playerId) && playerId !== null) {
            existingIndex = _.findIndex(inventoryData, function(entry) {
                return entry && !_.isUndefined(entry.playerId) && String(entry.playerId) === String(playerId);
            });
        }

        if (existingIndex < 0 && _.isString(playerName) && playerName.length) {
            existingIndex = _.findIndex(inventoryData, function(entry) {
                return entry && entry.playerName === playerName;
            });
        }

        if (existingIndex >= 0)
            inventoryData[existingIndex] = record;
        else
            inventoryData.push(record);

        game.coopPlayerInventoryData = inventoryData;
        return true;
    };

    self.clientRequiresLoadout = function(client) {
        if (!client || client.id === self.creatorId)
            return false;

        if (!self.lastSnapshot || !self.lastSnapshot.snapshot || !self.lastSnapshot.snapshot.game)
            return false;

        var game = self.lastSnapshot.snapshot.game;
        var perPlayerLoadoutsEnabled = self.perPlayerTechCards || !!game.perPlayerTechCards;
        if (!perPlayerLoadoutsEnabled)
            return false;

        return !self.findCoopPlayerInventoryData(client);
    };

    self.coopPlayerHasPendingTechCards = function(record) {
        return !!(record
            && record.pendingTechCards
            && _.isNumber(record.pendingTechCards.star)
            && _.isArray(record.pendingTechCards.cards));
    };

    self.coopInventoryHasCard = function(inventory, cardId) {
        var cards = inventory && _.isArray(inventory.cards) ? inventory.cards : [];
        return _.any(cards, function(card) {
            return card && card.id === cardId && !card.unique;
        });
    };

    self.broadcastCoopPlayerTechCardDeleted = function(client, cardIndex, updatedAt) {
        server.broadcast({
            message_type: 'gw_campaign_player_tech_card_deleted',
            payload: {
                client_id: client.id,
                client_name: client.name,
                card_index: cardIndex,
                updated_at: updatedAt
            }
        });
    };

    self.broadcastCoopPlayerTechCardChoice = function(client, star, selectedCardIndex, updatedAt) {
        server.broadcast({
            message_type: 'gw_campaign_player_tech_card_choice',
            payload: {
                client_id: client.id,
                client_name: client.name,
                selected_card_index: selectedCardIndex,
                star: star,
                updated_at: updatedAt
            }
        });
    };

    self.normalizeCoopPlayerInventoryForOperator = function(inventory) {
        var result = _.cloneDeep(inventory || {});
        var tags = result.tags || {};
        result.tags = {
            global: _.cloneDeep(tags.global || {})
        };
        return result;
    };

    self.hasPendingPlayerSetup = function() {
        if (!self.perPlayerTechCards)
            return false;

        var connectedClients = self.getConnectedClients();
        return _.some(connectedClients, function(client) {
            if (!client || client.id === self.creatorId)
                return false;

            if (self.clientRequiresLoadout(client))
                return true;

            if (self.clientLoading[client.id])
                return true;

            var loadingStatus = self.clientLoadingStatus[client.id] || '';
            if (loadingStatus === 'picking_loadout' || loadingStatus === 'picking_tech_cards')
                return true;

            return self.coopPlayerHasPendingTechCards(self.findCoopPlayerInventoryData(client));
        });
    };

    self.setClientLoading = function(client, loading, loadingStatus) {
        if (!client)
            return;

        // We no longer update control if the loading state for the client hasn't actually
        // gone from false/ambiguous to true or from true to false/ambiguous.
        var nextLoading = !!loading;
        var nextStatus = _.isString(loadingStatus) ? loadingStatus : '';
        if (!nextLoading)
            nextStatus = '';

        if (!nextLoading && self.perPlayerTechCards && self.coopPlayerHasPendingTechCards(self.findCoopPlayerInventoryData(client))) {
            nextLoading = true;
            nextStatus = 'picking_tech_cards';
        }

        if (self.clientLoading[client.id] === nextLoading && self.clientLoadingStatus[client.id] === nextStatus)
            return;

        self.clientLoading[client.id] = nextLoading;
        self.clientLoadingStatus[client.id] = nextStatus;
        self.updateControl();
    };

    self.sendRoleToClient = function(client) {
        if (!client || !client.connected)
            return;

        var role = self.getRoleForClient(client);
        console.log('[GW COOP] gw_campaign sendRole client=' + client.name + ' id=' + client.id + ' role=' + role);

        client.message({
            message_type: 'gw_campaign_role',
            payload: {
                role: role,
                host_id: self.creatorId,
                host_name: self.creatorName,
                control: self.control
            }
        });
    };

    self.broadcastControl = function() {
        server.broadcast({
            message_type: 'gw_campaign_control',
            payload: self.control
        });
    };

    self.updateControl = function() {
        var connectedClients = self.getConnectedClients();
        self.control.connected_clients = _.map(connectedClients, function(client) {
            // Debug, print out name of client that we're sending control info for. 
            // This is helpful to verify that the host is actually included in the list of connected clients 
            // that gets sent to the UI, since the host client object can sometimes be in a weird state where 
            // it's not showing up as connected in server.clients even though the host is definitely connected 
            // and should be included in the list of clients that gets sent to the UI.
            console.log('[GW COOP] gw_campaign updateControl client=' + client.name + ' id=' + client.id + ' connected=' + client.connected);
            var pendingInventoryData = self.findCoopPlayerInventoryData(client);
            var loading = !!self.clientLoading[client.id];
            var loadingStatus = self.clientLoadingStatus[client.id] || '';
            if (self.perPlayerTechCards && self.coopPlayerHasPendingTechCards(pendingInventoryData)) {
                loading = true;
                loadingStatus = 'picking_tech_cards';
            }

            return {
                id: client.id,
                name: client.name || (client.id === self.creatorId ? self.creatorName : 'Player'),
                role: self.getRoleForClient(client),
                loading: loading,
                loading_status: loadingStatus,
                requires_loadout: self.clientRequiresLoadout(client)
            };
        });
        self.maxClients = Math.max(1, Math.min(self.maxClients, self.maxClientsLimit));
        self.control.max_clients = self.maxClients;
        self.control.max_clients_limit = self.maxClientsLimit;
        self.control.max_clients_locked = self.maxClientsLocked;
        self.control.shared_control = self.effectiveSharedControl();
        self.control.per_player_tech_cards = self.perPlayerTechCards;
        self.control.has_snapshot = !!self.lastSnapshot;
        self.control.snapshot_seq = self.lastSnapshotSeq;
        self.control.settings = _.cloneDeep(self.settings);
        self.control.require_password = !!bouncer.doesGameRequirePassword();

        self.updateBeacon();
        console.log('[GW COOP] gw_campaign updateControl clients=' + connectedClients.length + ' seq=' + self.lastSnapshotSeq + ' hasSnapshot=' + (!!self.lastSnapshot));
        self.broadcastControl();

        // Role messages can be missed during panel transitions; resend on every control update.
        _.forEach(connectedClients, function(client) {
            self.sendRoleToClient(client);
        });
    };

    self.tryGetBeaconSystem = function() {
        if (!self.lastSnapshot || !self.lastSnapshot.snapshot || !self.lastSnapshot.snapshot.game)
            return { planets: [] };

        var gameSave = self.lastSnapshot.snapshot.game;
        var galaxy = gameSave.galaxy || {};
        var stars = galaxy.stars || [];

        if (!stars.length)
            return { planets: [] };

        var selectedStar = self.lastSnapshot.snapshot.ui && self.lastSnapshot.snapshot.ui.selectedStar;
        if (!_.isNumber(selectedStar) || selectedStar < 0 || selectedStar >= stars.length)
            selectedStar = gameSave.currentStar;

        if (!_.isNumber(selectedStar) || selectedStar < 0 || selectedStar >= stars.length)
            selectedStar = 0;

        var star = stars[selectedStar] || stars[0];
        var system = star && star.system;
        if (!system)
            return { planets: [] };

        return utils.getMinimalSystemDescription(system);
    };

    self.updateBeacon = function() {
        var connectedClients = self.getConnectedClients();
        var modsData = server.getModsForBeacon();
        var hasFriendsList = bouncer.getWhitelist().length > 0;

        // So if this lobby is PRIVATE in the sense that you don't
        // want anyone to join, or if you're forever alone
        // but mark it as friends only (thereby excluding everyone)
        // then there's no point in publishing it on the beacon since no one can join anyway.
        var publish = self.settings.public || hasFriendsList;

        if (!publish) {
            server.beacon = null;
            return;
        }

        server.beacon = {
            state: 'lobby',
            uuid: server.uuid(),
            full: connectedClients.length >= server.maxClients,
            started: false,
            players: connectedClients.length,
            creator: self.creatorName,
            max_players: self.maxClients,
            spectators: 0,
            max_spectators: 0,
            mode: 'FreeForAll',
            mod_names: modsData.names,
            mod_identifiers: modsData.identifiers,
            cheat_config: main.cheats,
            player_names: _.map(connectedClients, function(client) { return client.name; }),
            spectator_names: [],
            require_password: !!bouncer.doesGameRequirePassword(),
            whitelist: bouncer.getWhitelist(),
            blacklist: bouncer.getBlacklist(),
            tag: self.settings.tag,
            game: {
                system: self.tryGetBeaconSystem(),
                name: self.settings.game_name
            },
            required_content: content_manager.getRequiredContent(),
            bounty_mode: false,
            bounty_value: 1.0,
            sandbox: false
        };
    };

    self.sendSnapshotToClient = function(client, reason) {
        if (!client || !client.connected || !self.lastSnapshot)
            return;

        client.message({
            message_type: 'gw_campaign_snapshot',
            payload: _.assign({}, self.lastSnapshot, {
                reason: reason || 'sync',
                requires_loadout: self.clientRequiresLoadout(client)
            })
        });
    };

    self.requestSnapshotFromHost = function(reason, requester) {
        var host = _.find(self.getConnectedClients(), function(client) {
            return client.id === self.creatorId;
        });

        if (!host || !host.connected)
            return false;

        host.message({
            message_type: 'request_gw_campaign_snapshot_publish',
            payload: {
                reason: reason || 'viewer_request',
                requester_id: requester && requester.id,
                requester_name: requester && requester.name
            }
        });

        return true;
    };

    self.attachClientLifecycle = function(client, reconnect) {
        if (!self.active)
            return;

        if (!client)
            return;

        var reconnectTimer = self.viewerReconnectTimers[client.id];
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            delete self.viewerReconnectTimers[client.id];
        }

        if (!client._gwCampaignDisconnectAttached) {
            client._gwCampaignDisconnectAttached = true;
            client._gwCampaignDisconnectCleanupApplied = false;
            utils.pushCallback(client, 'onDisconnect', function(onDisconnect) {
                console.log('[GW COOP] gw_campaign onDisconnect client=' + client.name + ' id=' + client.id);
                self.clearPendingManifestTimeout(client.id);
                self.clearPendingSelfDisconnectTimeout(client.id);
                delete self.clientLoading[client.id];
                delete self.clientLoadingStatus[client.id];

                if (client.id === self.creatorId) {
                    console.log('[GW COOP] gw_campaign creator disconnected, exiting server');
                    server.exit();
                }
                else {
                    self.viewerReconnectTimers[client.id] = setTimeout(function() {
                        delete self.viewerReconnectTimers[client.id];
                    }, VIEWER_RECONNECT_TIMEOUT);

                    if (_.filter(server.clients, function(c) { return c.connected; }).length === 0)
                        server.exit();
                }

                self.updateControl();
                return onDisconnect;
            });

            // Keep a deterministic cleanup hook so gw_campaign callbacks do not
            // leak into later states (e.g. battle/game_over), which can cause
            // unexpected server.exit() when clients disconnect.
            var removeDisconnectHook = function() {
                if (client._gwCampaignDisconnectCleanupApplied)
                    return;

                client._gwCampaignDisconnectCleanupApplied = true;
                if (client.onDisconnect && _.isFunction(client.onDisconnect.pop))
                    client.onDisconnect.pop();

                client._gwCampaignDisconnectAttached = false;
                delete client._gwCampaignDisconnectCleanup;
            };
            client._gwCampaignDisconnectCleanup = removeDisconnectHook;
            self.disconnectCleanup.push(removeDisconnectHook);
        }

        self.clientLoading[client.id] = true;
        self.clientLoadingStatus[client.id] = '';
        self.updateControl();
        if (client.id !== self.creatorId)
            self.requestClientManifest(client, reconnect);
        self.sendRoleToClient(client);

        if (client.id !== self.creatorId)
            self.requestSnapshotFromHost(reconnect ? 'viewer_reconnect' : 'viewer_joined', client);
    };

    // Called when the server first enters the gw_campaign state. 
    // Sets up message handlers and connection lifecycle for the campaign lobby.
    self.enter = function() {
        self.active = true;
        server.maxClients = self.maxClients;
        console.log('[GW COOP] gw_campaign enter host=' + self.creatorName + ' id=' + self.creatorId);

        // No password by default, but clear any that might be lingering from previous sessions just in case, along with whitelist/blacklist
        // (which would correspond to the friends list unless there's some system I've never heard of before which also sets up
        // white/blacklists for lobbies).
        bouncer.setPassword('');
        bouncer.clearWhitelist();
        bouncer.clearBlacklist();

        self.setRequiredClientModsData([], {});

        var handlers = {
            set_required_client_mods: function(msg) {
                if (msg.client.id !== self.creatorId)
                    return server.respond(msg).fail('Required client mods can only be provided by host');

                var payload = msg.payload || {};
                console.log('[GW COOP] MOD CHECK [gw_campaign] host set_required_client_mods from=' + msg.client.id + ' payload=' + JSON.stringify(payload));
                self.setRequiredClientModsData(payload.required_identifiers, payload.required_names_by_id);
                server.respond(msg).succeed({
                    required_identifiers: self.requiredClientModIdentifiers
                });
            },
            client_mod_manifest: function(msg) {
                if (!self.requiredClientModIdentifiers.length) {
                    console.log('[GW COOP] MOD CHECK [gw_campaign] received manifest from client=' + msg.client.id + ' but no required list is active');
                    return server.respond(msg).succeed({ missing: [] });
                }

                var activeIdentifiers = self.normalizeClientModIdentifiers(msg.payload && msg.payload.active_identifiers);
                var missingIdentifiers = _.filter(self.requiredClientModIdentifiers, function(identifier) {
                    return activeIdentifiers.indexOf(identifier) === -1;
                });

                console.log('[GW COOP] MOD CHECK [gw_campaign] manifest from client=' + msg.client.id
                    + ' active=' + JSON.stringify(activeIdentifiers)
                    + ' missing=' + JSON.stringify(missingIdentifiers)
                    + ' required=' + JSON.stringify(self.requiredClientModIdentifiers));

                self.clearPendingManifestTimeout(msg.client.id);

                if (missingIdentifiers.length) {
                    var rejectReason = self.buildMissingRequiredModsReason(missingIdentifiers);
                    self.clientManifestValidatedByClientId[msg.client.id] = false;
                    server.respond(msg).succeed({
                        missing: missingIdentifiers,
                        missing_identifiers: missingIdentifiers,
                        reason: rejectReason,
                        required_identifiers: _.clone(self.requiredClientModIdentifiers),
                        required_names_by_id: _.cloneDeep(self.requiredClientModNamesById),
                        requires_acknowledgement: true
                    });
                    self.notifyClientMissingRequiredMods(msg.client, missingIdentifiers);
                    return;
                }

                self.clientManifestValidatedByClientId[msg.client.id] = true;
                server.respond(msg).succeed({ missing: [] });

                if (msg.client && msg.client.connected) {
                    console.log('[GW COOP] MOD CHECK [gw_campaign] all_client_mods_match client=' + msg.client.id);
                    msg.client.message({
                        message_type: 'all_client_mods_match',
                        payload: {
                            required_identifiers: _.clone(self.requiredClientModIdentifiers)
                        }
                    });
                }
            },
            required_client_mods_acknowledged: function(msg) {
                self.clearPendingSelfDisconnectTimeout(msg.client.id);
                console.log('[GW COOP] MOD CHECK [gw_campaign] client acknowledged missing required mods client=' + msg.client.id + ' payload=' + JSON.stringify(msg.payload || {}));
                server.respond(msg).succeed();
            },
            request_gw_campaign_snapshot: function(msg) {
                console.log('[GW COOP] request_gw_campaign_snapshot from=' + msg.client.name + ' id=' + msg.client.id);
                var freshSnapshotRequested = false;
                var viewerRequest = msg.client.id !== self.creatorId;

                if (viewerRequest)
                    freshSnapshotRequested = self.requestSnapshotFromHost('viewer_request', msg.client);

                server.respond(msg).succeed({
                    has_snapshot: !viewerRequest && !!self.lastSnapshot,
                    fresh_snapshot_requested: freshSnapshotRequested
                });
            },
            set_loading: function(msg) {
                var payload = msg.payload || {};
                self.setClientLoading(msg.client, payload.loading, payload.loading_status);
                server.respond(msg).succeed();
            },
            set_player_loadout: function(msg) {
                if (msg.client.id === self.creatorId)
                    return server.respond(msg).fail('Host does not submit co-op player loadout through viewer path');

                var snapshotGame = self.lastSnapshot && self.lastSnapshot.snapshot && self.lastSnapshot.snapshot.game;
                var perPlayerLoadoutsEnabled = self.perPlayerTechCards || !!(snapshotGame && snapshotGame.perPlayerTechCards);
                if (!perPlayerLoadoutsEnabled)
                    return server.respond(msg).fail('Per-player loadouts are not enabled');

                var payload = msg.payload || {};
                if (!_.isString(payload.commander) || !_.isString(payload.loadout_card_id) || !payload.inventory)
                    return server.respond(msg).fail('Invalid co-op player loadout');

                if (!_.isArray(payload.inventory.cards) || !payload.inventory.cards.length || payload.inventory.cards[0].id !== payload.loadout_card_id || !_.isNumber(payload.inventory.maxCards) || payload.inventory.maxCards <= payload.inventory.cards.length) {
                    return server.respond(msg).fail('Invalid co-op player loadout inventory: missing starting tech banks');
                }

                var record = {
                    playerId: msg.client.id,
                    playerName: msg.client.name || payload.player_name,
                    commander: payload.commander,
                    loadoutCardId: payload.loadout_card_id,
                    inventory: payload.inventory,
                    updatedAt: payload.updated_at || Date.now()
                };

                if (!self.upsertCoopPlayerInventoryData(record))
                    return server.respond(msg).fail('Failed to store co-op player loadout');

                self.lastSnapshotSeq += 1;
                self.lastSnapshot.seq = self.lastSnapshotSeq;

                server.broadcast({
                    message_type: 'gw_campaign_player_loadout',
                    payload: {
                        client_id: msg.client.id,
                        client_name: msg.client.name,
                        inventory_data: record
                    }
                });

                self.setClientLoading(msg.client, false, '');

                msg.client.message({
                    message_type: 'gw_campaign_loadout_complete',
                    payload: {
                        client_id: msg.client.id,
                        snapshot: self.lastSnapshot.snapshot
                    }
                });

                server.respond(msg).succeed();
            },
            set_player_pending_tech_cards: function(msg) {
                if (msg.client.id !== self.creatorId)
                    return server.respond(msg).fail('Only host can publish co-op player pending tech cards');

                var snapshotGame = self.lastSnapshot && self.lastSnapshot.snapshot && self.lastSnapshot.snapshot.game;
                var perPlayerTechCardsEnabled = self.perPlayerTechCards || !!(snapshotGame && snapshotGame.perPlayerTechCards);
                if (!perPlayerTechCardsEnabled)
                    return server.respond(msg).fail('Per-player tech cards are not enabled');

                if (!snapshotGame)
                    return server.respond(msg).fail('No campaign snapshot for pending tech cards');

                var payload = msg.payload || {};
                if (!_.isArray(payload.players))
                    return server.respond(msg).fail('Invalid co-op pending tech cards payload');

                var updates = [];
                var connectedClients = self.getConnectedClients();
                var validationError;

                _.forEach(payload.players, function(playerPayload) {
                    if (validationError)
                        return;

                    var clientId = playerPayload && playerPayload.client_id;
                    var targetClient = _.find(connectedClients, function(client) {
                        return client && !_.isUndefined(clientId) && String(client.id) === String(clientId);
                    });

                    if (!targetClient) {
                        validationError = 'No connected client for pending tech cards id ' + clientId;
                        return;
                    }

                    if (targetClient.id === self.creatorId) {
                        validationError = 'Host does not receive co-op pending tech cards';
                        return;
                    }

                    var pendingTechCards = playerPayload && playerPayload.pendingTechCards;
                    if (!pendingTechCards || !_.isNumber(pendingTechCards.star) || !_.isArray(pendingTechCards.cards)) {
                        validationError = 'Invalid pending tech cards for client id ' + clientId;
                        return;
                    }

                    var existingRecord = self.findCoopPlayerInventoryData(targetClient);
                    if (!existingRecord) {
                        validationError = 'Missing inventory data for pending tech cards client id ' + clientId;
                        return;
                    }

                    var record = _.assign({}, existingRecord, {
                        playerId: targetClient.id,
                        playerName: targetClient.name || existingRecord.playerName,
                        pendingTechCards: {
                            star: pendingTechCards.star,
                            cards: pendingTechCards.cards,
                            updatedAt: pendingTechCards.updatedAt || Date.now()
                        },
                        updatedAt: Date.now()
                    });

                    updates.push({
                        client: targetClient,
                        record: record
                    });
                });

                if (validationError) {
                    return server.respond(msg).fail(validationError);
                }

                _.forEach(updates, function(update) {
                    self.upsertCoopPlayerInventoryData(update.record);
                });

                self.lastSnapshotSeq += 1;
                self.lastSnapshot.seq = self.lastSnapshotSeq;

                _.forEach(updates, function(update) {
                    server.broadcast({
                        message_type: 'gw_campaign_player_pending_tech_cards',
                        payload: {
                            client_id: update.client.id,
                            client_name: update.client.name,
                            pendingTechCards: update.record.pendingTechCards,
                            updated_at: update.record.updatedAt
                        }
                    });

                    self.setClientLoading(update.client, true, 'picking_tech_cards');
                });

                server.respond(msg).succeed();
            },
            delete_player_tech_card: function(msg) {
                if (msg.client.id === self.creatorId) {
                    return server.respond(msg).fail('Host does not delete co-op player tech cards through viewer path');
                }

                var snapshotGame = self.lastSnapshot && self.lastSnapshot.snapshot && self.lastSnapshot.snapshot.game;
                var perPlayerTechCardsEnabled = self.perPlayerTechCards || !!(snapshotGame && snapshotGame.perPlayerTechCards);
                if (!perPlayerTechCardsEnabled) {
                    return server.respond(msg).fail('Per-player tech cards are not enabled');
                }

                if (!snapshotGame) {
                    return server.respond(msg).fail('No campaign snapshot for tech card deletion');
                }

                var payload = msg.payload || {};
                var cardIndex = payload.card_index;
                if (!_.isNumber(cardIndex)) {
                    return server.respond(msg).fail('Invalid co-op tech card deletion index');
                }

                var existingRecord = self.findCoopPlayerInventoryData(msg.client);
                if (!existingRecord) {
                    return server.respond(msg).fail('Missing co-op player inventory data for tech card deletion');
                }

                if (!self.coopPlayerHasPendingTechCards(existingRecord)) {
                    return server.respond(msg).fail('Co-op tech card deletion requires pending tech cards');
                }

                var inventory = existingRecord.inventory || {};
                if (!_.isArray(inventory.cards)) {
                    return server.respond(msg).fail('Co-op player inventory has no tech cards to delete');
                }

                if (cardIndex < 0 || cardIndex >= inventory.cards.length) {
                    return server.respond(msg).fail('Co-op tech card deletion index is out of range');
                }

                var updatedAt = Date.now();
                var nextRecord = _.cloneDeep(existingRecord);
                nextRecord.inventory.cards.splice(cardIndex, 1);
                nextRecord.inventory = self.normalizeCoopPlayerInventoryForOperator(nextRecord.inventory);
                nextRecord.updatedAt = updatedAt;

                if (!self.upsertCoopPlayerInventoryData(nextRecord)) {
                    return server.respond(msg).fail('Failed to store co-op player tech card deletion');
                }

                self.lastSnapshotSeq += 1;
                self.lastSnapshot.seq = self.lastSnapshotSeq;

                self.broadcastCoopPlayerTechCardDeleted(msg.client, cardIndex, updatedAt);
                server.respond(msg).succeed({ updated_at: updatedAt });
            },
            choose_player_pending_tech_card: function(msg) {
                if (msg.client.id === self.creatorId) {
                    return server.respond(msg).fail('Host does not submit co-op player tech card choices through viewer path');
                }

                var snapshotGame = self.lastSnapshot && self.lastSnapshot.snapshot && self.lastSnapshot.snapshot.game;
                var perPlayerTechCardsEnabled = self.perPlayerTechCards || !!(snapshotGame && snapshotGame.perPlayerTechCards);
                if (!perPlayerTechCardsEnabled) {
                    return server.respond(msg).fail('Per-player tech cards are not enabled');
                }

                if (!snapshotGame) {
                    return server.respond(msg).fail('No campaign snapshot for tech card choice');
                }

                var payload = msg.payload || {};
                var selectedCardIndex = payload.selected_card_index;
                if (!_.isNumber(selectedCardIndex)) {
                    return server.respond(msg).fail('Invalid selected tech card index');
                }

                var existingRecord = self.findCoopPlayerInventoryData(msg.client);
                if (!existingRecord) {
                    return server.respond(msg).fail('Missing co-op player inventory data for tech card choice');
                }

                var pendingTechCards = existingRecord.pendingTechCards;
                if (!pendingTechCards || !_.isNumber(pendingTechCards.star) || !_.isArray(pendingTechCards.cards)) {
                    return server.respond(msg).fail('No pending co-op tech cards for player');
                }

                if (!_.isNumber(payload.star) || payload.star !== pendingTechCards.star) {
                    return server.respond(msg).fail('Co-op tech card choice star does not match pending tech cards');
                }

                if (selectedCardIndex !== -1 && (selectedCardIndex < 0 || selectedCardIndex >= pendingTechCards.cards.length)) {
                    return server.respond(msg).fail('Selected co-op tech card index is out of range');
                }

                if (!existingRecord.inventory || !_.isArray(existingRecord.inventory.cards)) {
                    return server.respond(msg).fail('Invalid co-op player inventory data for tech card choice');
                }

                var selectedCard = selectedCardIndex === -1 ? undefined : pendingTechCards.cards[selectedCardIndex];
                if (selectedCard) {
                    if (self.coopInventoryHasCard(existingRecord.inventory, selectedCard.id)) {
                        return server.respond(msg).fail('Duplicate co-op tech choice card=' + selectedCard.id);
                    }
                }

                var updatedAt = Date.now();
                var record = _.assign({}, _.cloneDeep(existingRecord), {
                    playerId: msg.client.id,
                    playerName: msg.client.name || existingRecord.playerName,
                    updatedAt: updatedAt
                });
                if (selectedCard) {
                    record.inventory.cards.push(selectedCard);
                }
                record.inventory = self.normalizeCoopPlayerInventoryForOperator(record.inventory);
                delete record.pendingTechCards;

                if (!self.upsertCoopPlayerInventoryData(record)) {
                    return server.respond(msg).fail('Failed to store co-op player tech card choice');
                }

                self.lastSnapshotSeq += 1;
                self.lastSnapshot.seq = self.lastSnapshotSeq;

                self.broadcastCoopPlayerTechCardChoice(msg.client, payload.star, selectedCardIndex, updatedAt);
                self.setClientLoading(msg.client, false, '');

                server.respond(msg).succeed({ updated_at: updatedAt });
            },
            gw_campaign_snapshot: function(msg) {
                if (msg.client.id !== self.creatorId)
                    return server.respond(msg).fail('Only host can publish campaign snapshot');

                self.lastSnapshotSeq += 1;
                self.lastSnapshot = {
                    seq: self.lastSnapshotSeq,
                    host_id: msg.client.id,
                    host_name: msg.client.name,
                    snapshot: msg.payload && msg.payload.snapshot ? msg.payload.snapshot : undefined
                };

                self.updateControl();
                console.log('[GW COOP] gw_campaign_snapshot accepted seq=' + self.lastSnapshotSeq + ' from host');

                // Relay to every connected peer except host.
                _.forEach(self.getConnectedClients(), function(client) {
                    if (client.id !== self.creatorId)
                        self.sendSnapshotToClient(client, 'host_push');
                });

                server.respond(msg).succeed({ seq: self.lastSnapshotSeq });
            },
            gw_campaign_action: function(msg) {
                if (msg.client.id !== self.creatorId)
                    return server.respond(msg).fail('Only host can publish campaign actions');

                var payload = msg.payload || {};
                console.log('[GW COOP] gw_campaign_action type=' + payload.type + ' from host=' + msg.client.name);

                _.forEach(self.getConnectedClients(), function(client) {
                    if (client.id === self.creatorId)
                        return;

                    client.message({
                        message_type: 'gw_campaign_action',
                        payload: payload
                    });
                });

                server.respond(msg).succeed();
            },
            launch_gw_battle: function(msg) {
                if (msg.client.id !== self.creatorId)
                    return server.respond(msg).fail('Only host can launch battle');

                if (self.hasPendingPlayerSetup())
                    return server.respond(msg).fail('Cannot launch battle while co-op players are loading or choosing per-player tech');

                console.log('[GW COOP] launch_gw_battle by host=' + msg.client.name);
                server.respond(msg).succeed();
                main.setState(main.states.gw_lobby, msg.client, self.buildGwLobbyLaunchContext(msg.payload));
            },
            leave_gw_campaign: function(msg) {
                console.log('[GW COOP] leave_gw_campaign from=' + msg.client.name + ' id=' + msg.client.id);

                if (msg.client.id === self.creatorId) {
                    server.respond(msg).succeed();
                    server.exit();
                    return;
                }

                // Non-host leave requests are acknowledged; disconnect lifecycle handles cleanup.
                server.respond(msg).succeed();
            },
            // Analog of function playerMsg_kick(msg) in lobby.js.
            kick: function(msg) {
                if (msg.client.id !== self.creatorId)
                    return server.respond(msg).fail('Only host can kick.');

                var payload = msg.payload || {};
                var id = payload.id;
                var targetClient = _.find(server.clients, function(client) {
                    return client && client.id === id;
                });

                if (bouncer.isPlayerMod(id))
                    return server.respond(msg).fail('Mods cannot be kicked.');

                if (!targetClient || !targetClient.connected)
                    return server.respond(msg).fail('Already left');

                // In both lobbies and here, it seems like the blacklist doesn't actually do anything.
                bouncer.addPlayerToBlacklist(id);
                targetClient.kill();

                server.respond(msg).succeed();
            },
            // Handler for when host modifies settings from the lobby panel. 
            // Validates and applies new settings, then updates the lobby and beacon accordingly.
            modify_settings: function(msg) {
                // Only the host is allowed to modify lobby settings
                if (msg.client.id !== self.creatorId)
                    return server.respond(msg).fail('Only host can modify campaign lobby settings');

                // applySettings will validate and apply the new settings, and update the bouncer configuration 
                // (password, whitelist, blacklist) as needed
                self.applySettings(msg.payload || {});

                // updateControl will update the control object that gets sent to clients, and also update the beacon with the new settings
                // Note that by the control object, I am referring to self.control, which is what gets sent to clients in the 
                // gw_campaign_control message and contains the lobby settings that the UI panels use to display lobby info and configure 
                // the join process (e.g. whether a password is required).
                self.updateControl();
                server.respond(msg).succeed({
                    settings: _.cloneDeep(self.settings),
                    max_clients: self.maxClients,
                    max_clients_limit: self.maxClientsLimit,
                    max_clients_locked: self.maxClientsLocked,
                    shared_control: self.effectiveSharedControl(),
                    per_player_tech_cards: self.perPlayerTechCards
                });
            },
            // Handler for chat messages sent by clients in the lobby. 
            // Validates the message, updates the lobby chat history, and broadcasts the message to all clients.
            chat_message: function(msg) {
                // No point in sending an empty message, is there?
                if (!msg.payload || !_.isString(msg.payload.message) || !msg.payload.message.length)
                    return server.respond(msg).fail('Invalid message');

                // Only things we need for a chat message are who the sender is and what they said.
                var payload = {
                    player_name: msg.client.name,
                    message: msg.payload.message
                };

                // Push the message into our array of strings representing the lobby chat history
                // so that new clients can be sent the recent chat history when they join. 
                // 
                // We limit the number of messages we keep around to avoid unbounded memory growth
                // by slicing the array if it exceeds a certain length after pushing the new message.
                self.lobbyChatHistory.push(payload);
                if (self.lobbyChatHistory.length > MAX_LOBBY_CHAT_HISTORY)
                    self.lobbyChatHistory = self.lobbyChatHistory.slice(-MAX_LOBBY_CHAT_HISTORY);

                // Actually tell all the other clients about the new chat message by broadcasting it to everyone 
                // (including the sender, since they can't see their own message until the server acknowledges it and broadcasts it back out).
                server.broadcast({
                    message_type: 'chat_message',
                    payload: payload
                });

                server.respond(msg).succeed();
            },
            // Handler for when a client requests the recent lobby chat history, 
            // which should happen when they first join the lobby and need to be 
            // brought up to speed on what was recently discussed in chat.
            chat_history: function(msg) {
                server.respond(msg).succeed({ chat_history: self.lobbyChatHistory });
            }
        };

        self.removeHandlers = server.setHandlers(handlers);

        utils.pushCallback(server, 'onConnect', function(onConnect, client, reconnect) {
            if (!self.active)
                return onConnect;

            console.log('[GW COOP] gw_campaign onConnect client=' + client.name + ' id=' + client.id + ' reconnect=' + !!reconnect);
            if (!self.hasRoomForClient(client, reconnect)) {
                console.log('[GW COOP] gw_campaign rejecting client=' + client.name + ' id=' + client.id + ' reason=No room');
                server.rejectClient(client, 'No room');
                return onConnect;
            }

            self.attachClientLifecycle(client, reconnect);
            return onConnect;
        });

        // The host is already connected when entering from empty state.
        _.forEach(self.getConnectedClients(), function(client) {
            console.log('[GW COOP] gw_campaign attach existing client=' + client.name + ' id=' + client.id);
            self.attachClientLifecycle(client, false);
        });

        self.updateControl();
    };

    self.exit = function() {
        console.log('[GW COOP] gw_campaign exit');

        // Mark the state as inactive so that any late-arriving connections or messages that somehow slip through the cracks
        // don't get sent through gw_campaign handlers that might still be hanging around.
        self.active = false;
        if (self.removeHandlers)
            self.removeHandlers();

        if (server.onConnect && _.isFunction(server.onConnect.pop))
            server.onConnect.pop();

        _.forEach(self.viewerReconnectTimers, function(timeout) {
            clearTimeout(timeout);
        });
        self.viewerReconnectTimers = {};
        self.clearAllPendingManifestTimeouts();

        _.forEachRight(self.disconnectCleanup, function(removeDisconnectHook) {
            removeDisconnectHook();
        });
        self.disconnectCleanup = [];

        // For safety's sake, we shouldn't assume that every other view
        // is going to clean up all the things it needs proactively, 
        // so for the sake of defensive programming we clean up the bouncer
        // back to its default state when leaving the campaign lobby.
        bouncer.setPassword('');
        bouncer.clearWhitelist();
        bouncer.clearBlacklist();

        server.beacon = null;
    };
}

exports.url = 'coui://ui/main/game/galactic_war/gw_play/gw_play.html?gw_campaign=1';
exports.enter = function(owner) {
    model = new GWCampaignModel(owner);
    model.enter();
    return model.control;
};

// Exported so the main server script can use this client state when sending the hello message.
exports.getClientState = function(client) {
    if (!model || !_.isFunction(model.getClientState))
        return {};

    return model.getClientState(client);
};

exports.exit = function(newState) {
    if (model)
        model.exit();

    model = undefined;
    return true;
};

main.gameModes.gw_campaign = exports;
