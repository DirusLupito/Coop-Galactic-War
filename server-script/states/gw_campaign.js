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
    self.maxClientsLimit = getCampaignMaxPlayersLimit();
    self.maxClients = Math.max(1, Math.min(DEFAULT_GW_CAMPAIGN_PLAYERS, self.maxClientsLimit));

    self.creatorId = creator.id;
    self.creatorName = creator.name;
    self.viewerReconnectTimers = {};
    self.disconnectCleanup = [];
    self.lastSnapshot = undefined;
    self.lastSnapshotSeq = 0;
    self.firstClientModPayload = undefined;
    self.clientModPayloadByIndex = {};
    self.lobbyChatHistory = [];
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

    // Builds the launch context for the gw_lobby state based on the current campaign lobby settings 
    // and an optional payload provided by the host client when they click "Play" from the campaign lobby panel.
    // This will let the in-game lobby know that it's launching from a co-op campaign lobby and apply 
    // any relevant settings or metadata that the host client provided when launching.
    self.buildGwLobbyLaunchContext = function(payload) {
        var data = payload || {};
        var payloadSettings = data.gw_campaign_settings || {};
        var normalizeMountedFilePath = function(filePath, mountPath) {
            if (!_.isString(filePath) || !filePath.length)
                return '';

            var normalizedPath = filePath.replace(/\\/g, '/');
            if (normalizedPath.charAt(0) !== '/')
                normalizedPath = '/' + normalizedPath;

            var normalizedMountPath = _.isString(mountPath) ? mountPath.replace(/\\/g, '/') : '';
            if (normalizedMountPath.length) {
                if (normalizedMountPath.charAt(0) !== '/')
                    normalizedMountPath = '/' + normalizedMountPath;
                if (normalizedMountPath.charAt(normalizedMountPath.length - 1) !== '/')
                    normalizedMountPath += '/';

                if (normalizedPath.indexOf(normalizedMountPath) === 0)
                    return '/' + normalizedPath.substring(normalizedMountPath.length);
            }

            if (normalizedPath.indexOf('/client_mods/') === 0) {
                var modNameSlashIndex = normalizedPath.indexOf('/', '/client_mods/'.length);
                if (modNameSlashIndex >= 0 && modNameSlashIndex + 1 < normalizedPath.length)
                    return normalizedPath.substring(modNameSlashIndex);
            }

            var paIndex = normalizedPath.indexOf('/pa/');
            if (paIndex >= 0)
                return normalizedPath.substring(paIndex);

            return normalizedPath;
        };

        var syncedModIndices = _.chain(_.keys(self.clientModPayloadByIndex || {}))
            .map(function(indexKey) {
                return parseInt(indexKey, 10);
            })
            .filter(function(index) {
                return _.isFinite(index) && index >= 0;
            })
            .sortBy()
            .value();

        var rawSyncedFileCount = 0;
        var syncedFiles = {};
        var syncedFileEncodings = {};
        var remappedFileCount = 0;
        var duplicateCanonicalPathCount = 0;
        var perModSummaries = [];

        _.forEach(syncedModIndices, function(syncedModIndex) {
            var syncedPayload = self.clientModPayloadByIndex[syncedModIndex] || {};
            var rawSyncedFiles = _.isObject(syncedPayload.files) ? syncedPayload.files : {};
            var modRawFileCount = _.keys(rawSyncedFiles).length;
            var modCanonicalFileCount = 0;
            var modRemappedFileCount = 0;

            rawSyncedFileCount += modRawFileCount;

            _.forEach(rawSyncedFiles, function(content, filePath) {
                var normalizedPath = normalizeMountedFilePath(filePath, syncedPayload.mount_path);
                if (!normalizedPath.length)
                    return;

                var fileEncoding = _.isObject(syncedPayload.file_encodings) && _.isString(syncedPayload.file_encodings[filePath])
                    ? syncedPayload.file_encodings[filePath]
                    : '';

                modCanonicalFileCount += 1;
                if (normalizedPath !== filePath) {
                    remappedFileCount += 1;
                    modRemappedFileCount += 1;
                }

                if (_.has(syncedFiles, normalizedPath) && syncedFiles[normalizedPath] !== content)
                    duplicateCanonicalPathCount += 1;

                syncedFiles[normalizedPath] = content;
                if (fileEncoding.length)
                    syncedFileEncodings[normalizedPath] = fileEncoding;
                else
                    delete syncedFileEncodings[normalizedPath];
            });

            perModSummaries.push(
                syncedModIndex
                + ':complete=' + (!!syncedPayload.complete)
                + ':raw=' + modRawFileCount
                + ':canonical=' + modCanonicalFileCount
                + ':remapped=' + modRemappedFileCount
                + ':mount=' + (syncedPayload.mount_path || '')
            );
        });

        var syncedFileCount = _.keys(syncedFiles).length;
        var encodedSyncedFileCount = _.keys(syncedFileEncodings).length;
        var canonicalFileKeys = _.keys(syncedFiles);
        var canonicalClientModsPrefixCount = _.filter(canonicalFileKeys, function(filePath) {
            return _.isString(filePath) && filePath.indexOf('/client_mods/') === 0;
        }).length;
        var canonicalUiPrefixCount = _.filter(canonicalFileKeys, function(filePath) {
            return _.isString(filePath) && filePath.indexOf('/ui/') === 0;
        }).length;
        var canonicalImagesPrefixCount = _.filter(canonicalFileKeys, function(filePath) {
            return _.isString(filePath) && filePath.indexOf('/images/') === 0;
        }).length;

        var expectedCriticalPaths = [
            '/pa/units/land/bot_grenadier/bot_grenadier_ammo_hit.pfx',
            '/pa/units/land/bot_grenadier/bot_grenadier_ammo_trail.pfx',
            '/pa/units/land/bot_support_commander/bot_support_commander_ammo_trail.pfx'
        ];
        var missingCriticalPaths = _.filter(expectedCriticalPaths, function(path) {
            return !_.has(syncedFiles, path);
        });
        var settings = {
            game_name: _.isString(self.settings.game_name) ? self.settings.game_name : 'GW Co-op Campaign',
            tag: _.isString(self.settings.tag) ? self.settings.tag : 'Testing',
            public: _.isBoolean(self.settings.public) ? self.settings.public : true,
            friends: !!self.settings.friends,
            hidden: !!self.settings.hidden
        };

        // Host payload is optional fallback metadata; authoritative values come from self.settings.
        if (!_.isString(settings.game_name) && _.isString(payloadSettings.game_name))
            settings.game_name = payloadSettings.game_name;
        if (!_.isString(settings.tag) && _.isString(payloadSettings.tag))
            settings.tag = payloadSettings.tag;

        console.log('[GW_COOP] gw_campaign buildGwLobbyLaunchContext synced_mod_indices=' + (syncedModIndices.length ? syncedModIndices.join(',') : 'none') + ' raw_synced_file_count=' + rawSyncedFileCount + ' canonical_synced_file_count=' + syncedFileCount + ' encoded_synced_file_count=' + encodedSyncedFileCount + ' remapped_file_count=' + remappedFileCount + ' duplicate_canonical_count=' + duplicateCanonicalPathCount + ' canonical_client_mods_prefix_count=' + canonicalClientModsPrefixCount + ' canonical_ui_prefix_count=' + canonicalUiPrefixCount + ' canonical_images_prefix_count=' + canonicalImagesPrefixCount + ' missing_critical_count=' + missingCriticalPaths.length + ' missing_critical_paths=' + (missingCriticalPaths.length ? missingCriticalPaths.join('|') : 'none') + ' per_mod=' + perModSummaries.join('|'));

        return {
            gw_campaign_active: true,
            current_star: _.isNumber(data.current_star) ? data.current_star : undefined,
            settings: settings,
            max_clients: self.maxClients,
            gw_campaign_synced_client_mod_indices: syncedModIndices,
            gw_campaign_synced_client_files: syncedFiles,
            gw_campaign_synced_client_file_encodings: syncedFileEncodings,
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

        if (_.has(data, 'max_clients')) {
            var connectedCount = self.getConnectedClients().length;
            var requestedMax = parseInt(data.max_clients);
            if (_.isFinite(requestedMax)) {
                requestedMax = Math.floor(requestedMax);
                self.maxClients = Math.max(Math.max(1, connectedCount), Math.min(requestedMax, self.maxClientsLimit));
                server.maxClients = self.maxClients;
            }
        }

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

    self.getClientState = function(client) {
        return {
            role: self.getRoleForClient(client),
            control: self.control
        };
    };

    self.sendRoleToClient = function(client) {
        if (!client || !client.connected)
            return;

        var role = self.getRoleForClient(client);
        console.log('[GW_COOP] gw_campaign sendRole client=' + client.name + ' id=' + client.id + ' role=' + role);

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
            console.log('[GW_COOP] gw_campaign updateControl client=' + client.name + ' id=' + client.id + ' connected=' + client.connected);
            return {
                id: client.id,
                name: client.name || (client.id === self.creatorId ? self.creatorName : 'Player'),
                role: self.getRoleForClient(client)
            };
        });
        self.maxClients = Math.max(1, Math.min(self.maxClients, self.maxClientsLimit));
        self.control.max_clients = self.maxClients;
        self.control.max_clients_limit = self.maxClientsLimit;
        self.control.has_snapshot = !!self.lastSnapshot;
        self.control.snapshot_seq = self.lastSnapshotSeq;
        self.control.settings = _.cloneDeep(self.settings);
        self.control.require_password = !!bouncer.doesGameRequirePassword();

        self.updateBeacon();
        console.log('[GW_COOP] gw_campaign updateControl clients=' + connectedClients.length + ' seq=' + self.lastSnapshotSeq + ' hasSnapshot=' + (!!self.lastSnapshot));
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
                reason: reason || 'sync'
            })
        });
    };

    self.sendClientModDataToClient = function(client, reason) {
        if (!client || !client.connected)
            return;

        if (self.getRoleForClient(client) !== 'viewer')
            return;

        var MAX_PART_CHARS = 60000;
        var keys = _.keys(self.clientModPayloadByIndex);
        if (!keys.length) {
            console.log('[GW_COOP] gw_campaign mod_sync skipped for client=' + client.name + ' id=' + client.id + ' reason=' + (reason || 'join') + ' no_stored_payload');
            return;
        }

        var indexes = _.chain(keys)
            .map(function(key) {
                var parsed = parseInt(key, 10);
                return _.isFinite(parsed) ? parsed : undefined;
            })
            .filter(function(index) {
                return !_.isUndefined(index);
            })
            .sortBy()
            .value();

        _.forEach(indexes, function(index) {
            var stored = self.clientModPayloadByIndex[index];
            if (!stored)
                return;

            var filePaths = _.keys(stored.files || {}).sort();
            var encodedFileCount = _.filter(filePaths, function(filePath) {
                return _.isObject(stored.file_encodings)
                    && _.isString(stored.file_encodings[filePath])
                    && stored.file_encodings[filePath].length;
            }).length;
            var missingFiles = _.isArray(stored.missing_files) ? stored.missing_files : [];
            var sentParts = 0;

            client.message({
                message_type: 'gw_campaign_client_mod_sync',
                payload: {
                    index: index,
                    phase: 'begin',
                    reason: reason || 'join',
                    timestamp: Date.now(),
                    mod: _.cloneDeep(stored.meta),
                    mount_path: stored.mount_path || '',
                    roots: _.cloneDeep(stored.roots || []),
                    file_count: filePaths.length
                }
            });

            _.forEach(filePaths, function(filePath) {
                var rawText = stored.files[filePath];
                if (!_.isString(rawText))
                    rawText = '';
                var fileEncoding = _.isObject(stored.file_encodings) && _.isString(stored.file_encodings[filePath])
                    ? stored.file_encodings[filePath]
                    : '';

                var partCount = Math.max(1, Math.ceil(rawText.length / MAX_PART_CHARS));
                var partIndex;
                for (partIndex = 0; partIndex < partCount; partIndex++) {
                    var startIndex = partIndex * MAX_PART_CHARS;
                    var endIndex = Math.min(rawText.length, startIndex + MAX_PART_CHARS);
                    client.message({
                        message_type: 'gw_campaign_client_mod_sync',
                        payload: {
                            index: index,
                            phase: 'file_part',
                            file_path: filePath,
                            file_part_index: partIndex,
                            file_part_count: partCount,
                            file_encoding: fileEncoding,
                            data: rawText.substring(startIndex, endIndex)
                        }
                    });
                    sentParts += 1;
                }
            });

            _.forEach(missingFiles, function(missingPath) {
                client.message({
                    message_type: 'gw_campaign_client_mod_sync',
                    payload: {
                        index: index,
                        phase: 'file_missing',
                        file_path: missingPath
                    }
                });
            });

            client.message({
                message_type: 'gw_campaign_client_mod_sync',
                payload: {
                    index: index,
                    phase: 'complete',
                    reason: reason || 'join',
                    timestamp: Date.now(),
                    file_count: filePaths.length,
                    missing_file_count: missingFiles.length,
                    sent_part_count: sentParts
                }
            });

            console.log('[GW_COOP] gw_campaign mod_sync sent to client=' + client.name + ' id=' + client.id + ' index=' + index + ' files=' + filePaths.length + ' encoded_files=' + encodedFileCount + ' missing=' + missingFiles.length + ' parts=' + sentParts + ' reason=' + (reason || 'join'));
        });
    };

    self.attachClientLifecycle = function(client, reconnect) {
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
                console.log('[GW_COOP] gw_campaign onDisconnect client=' + client.name + ' id=' + client.id);

                if (client.id === self.creatorId) {
                    console.log('[GW_COOP] gw_campaign creator disconnected, exiting server');
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

        self.updateControl();
        self.sendRoleToClient(client);
        self.sendSnapshotToClient(client, reconnect ? 'reconnect' : 'join');
        self.sendClientModDataToClient(client, reconnect ? 'reconnect' : 'join');
    };

    // Called when the server first enters the gw_campaign state. 
    // Sets up message handlers and connection lifecycle for the campaign lobby.
    self.enter = function() {
        server.maxClients = self.maxClients;
        console.log('[GW_COOP] gw_campaign enter host=' + self.creatorName + ' id=' + self.creatorId);

        // No password by default, but clear any that might be lingering from previous sessions just in case, along with whitelist/blacklist
        // (which would correspond to the friends list unless there's some system I've never heard of before which also sets up
        // white/blacklists for lobbies).
        bouncer.setPassword('');
        bouncer.clearWhitelist();
        bouncer.clearBlacklist();

        var handlers = {
            request_gw_campaign_snapshot: function(msg) {
                console.log('[GW_COOP] request_gw_campaign_snapshot from=' + msg.client.name + ' id=' + msg.client.id);
                self.sendSnapshotToClient(msg.client, 'pull_on_join');
                server.respond(msg).succeed({ has_snapshot: !!self.lastSnapshot });
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
                console.log('[GW_COOP] gw_campaign_snapshot accepted seq=' + self.lastSnapshotSeq + ' from host');

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
                console.log('[GW_COOP] gw_campaign_action type=' + payload.type + ' from host=' + msg.client.name);

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
            gw_campaign_client_mod_payload: function(msg) {
                if (msg.client.id !== self.creatorId)
                    return server.respond(msg).fail('Only host can publish client mod payload');

                var payload = msg.payload || {};
                var index = _.isNumber(payload.index) ? payload.index : -1;
                var phase = _.isString(payload.phase) ? payload.phase : 'single';
                var stored = self.clientModPayloadByIndex[index];
                if (!stored || phase === 'begin' || phase === 'single') {
                    stored = {
                        index: index,
                        phase: phase,
                        meta: undefined,
                        mount_path: '',
                        roots: [],
                        expected_file_count: 0,
                        files: {},
                        file_encodings: {},
                        file_parts: {},
                        missing_files: [],
                        received_part_count: 0,
                        complete: false,
                        started_at: Date.now(),
                        updated_at: Date.now()
                    };
                    self.clientModPayloadByIndex[index] = stored;
                }

                stored.phase = phase;
                stored.updated_at = Date.now();

                var isFirstReceipt = !self.firstClientModPayload;
                if (isFirstReceipt) {
                    self.firstClientModPayload = {
                        from_id: msg.client.id,
                        from_name: msg.client.name,
                        received_at: Date.now(),
                        payload: _.cloneDeep(payload)
                    };

                    var payloadText;
                    try {
                        payloadText = JSON.stringify(payload);
                    }
                    catch (e) {
                        payloadText = '[unserializable]';
                    }

                    console.log('[GW_COOP] gw_campaign first_client_mod_payload from=' + msg.client.name + ' id=' + msg.client.id + ' index=' + index + ' payload=' + payloadText);
                }

                if (phase === 'single' || phase === 'begin') {
                    stored.meta = _.cloneDeep(payload.mod);
                    stored.mount_path = _.isString(payload.mount_path) ? payload.mount_path : stored.mount_path;
                    stored.roots = _.isArray(payload.roots) ? _.cloneDeep(payload.roots) : [];
                    stored.expected_file_count = _.isNumber(payload.file_count) ? payload.file_count : 0;
                    stored.files = {};
                    stored.file_encodings = {};
                    stored.file_parts = {};
                    stored.missing_files = [];
                    stored.received_part_count = 0;
                    stored.complete = (phase === 'single');

                    console.log('[GW_COOP] gw_campaign mod_payload_begin index=' + index + ' expected_files=' + stored.expected_file_count + ' phase=' + phase);
                }

                if (phase === 'file_part') {
                    var filePath = _.isString(payload.file_path) ? payload.file_path : '';
                    var partIndex = _.isNumber(payload.file_part_index) ? payload.file_part_index : -1;
                    var partCount = _.isNumber(payload.file_part_count) ? payload.file_part_count : 0;
                    var fileEncoding = _.isString(payload.file_encoding) ? payload.file_encoding : '';
                    var data = _.isString(payload.data) ? payload.data : '';

                    if (filePath.length && partIndex >= 0 && partCount > 0 && partIndex < partCount) {
                        if (!stored.file_parts[filePath]
                            || stored.file_parts[filePath].part_count !== partCount
                            || stored.file_parts[filePath].file_encoding !== fileEncoding) {
                            stored.file_parts[filePath] = {
                                part_count: partCount,
                                received_count: 0,
                                parts: new Array(partCount),
                                file_encoding: fileEncoding
                            };
                        }

                        var filePartState = stored.file_parts[filePath];
                        if (!_.isString(filePartState.parts[partIndex]))
                            filePartState.received_count += 1;

                        filePartState.parts[partIndex] = data;
                        stored.received_part_count += 1;

                        if (filePartState.received_count >= filePartState.part_count) {
                            stored.files[filePath] = filePartState.parts.join('');
                            if (!_.isObject(stored.file_encodings))
                                stored.file_encodings = {};
                            if (_.isString(filePartState.file_encoding) && filePartState.file_encoding.length)
                                stored.file_encodings[filePath] = filePartState.file_encoding;
                            else
                                delete stored.file_encodings[filePath];
                            delete stored.file_parts[filePath];
                        }
                    }
                }

                if (phase === 'file_missing') {
                    var missingPath = _.isString(payload.file_path) ? payload.file_path : '';
                    if (missingPath.length && stored.missing_files.indexOf(missingPath) === -1)
                        stored.missing_files.push(missingPath);
                }

                if (phase === 'complete') {
                    stored.complete = true;
                    stored.reported_sent_part_count = _.isNumber(payload.sent_part_count) ? payload.sent_part_count : stored.received_part_count;
                    stored.reported_missing_file_count = _.isNumber(payload.missing_file_count) ? payload.missing_file_count : stored.missing_files.length;
                    stored.reported_unserializable_file_count = _.isNumber(payload.unserializable_file_count) ? payload.unserializable_file_count : 0;
                    stored.completed_at = Date.now();

                    var storedFileKeys = _.keys(stored.files);
                    var storedEncodedFileCount = _.filter(storedFileKeys, function(filePath) {
                        return _.isObject(stored.file_encodings)
                            && _.isString(stored.file_encodings[filePath])
                            && stored.file_encodings[filePath].length;
                    }).length;
                    var storedClientModsPrefixCount = _.filter(storedFileKeys, function(filePath) {
                        return _.isString(filePath) && filePath.indexOf('/client_mods/') === 0;
                    }).length;
                    var storedPaPrefixCount = _.filter(storedFileKeys, function(filePath) {
                        return _.isString(filePath) && filePath.indexOf('/pa/') === 0;
                    }).length;

                    console.log('[GW_COOP] gw_campaign mod_payload_complete index=' + index + ' files=' + storedFileKeys.length + ' encoded_files=' + storedEncodedFileCount + ' missing=' + stored.missing_files.length + ' received_parts=' + stored.received_part_count + ' reported_parts=' + stored.reported_sent_part_count + ' mount_path=' + (stored.mount_path || '') + ' stored_client_mods_prefix_count=' + storedClientModsPrefixCount + ' stored_pa_prefix_count=' + storedPaPrefixCount);
                }

                server.respond(msg).succeed({
                    stored: true,
                    first: isFirstReceipt,
                    index: index,
                    phase: phase,
                    file_count: _.keys(stored.files).length,
                    missing_file_count: stored.missing_files.length,
                    complete: stored.complete
                });
            },
            launch_gw_battle: function(msg) {
                if (msg.client.id !== self.creatorId)
                    return server.respond(msg).fail('Only host can launch battle');

                console.log('[GW_COOP] launch_gw_battle by host=' + msg.client.name);
                server.respond(msg).succeed();
                main.setState(main.states.gw_lobby, msg.client, self.buildGwLobbyLaunchContext(msg.payload));
            },
            leave_gw_campaign: function(msg) {
                console.log('[GW_COOP] leave_gw_campaign from=' + msg.client.name + ' id=' + msg.client.id);

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
                    max_clients_limit: self.maxClientsLimit
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
            console.log('[GW_COOP] gw_campaign onConnect client=' + client.name + ' id=' + client.id + ' reconnect=' + !!reconnect);
            self.attachClientLifecycle(client, reconnect);
            return onConnect;
        });

        // The host is already connected when entering from empty state.
        _.forEach(self.getConnectedClients(), function(client) {
            console.log('[GW_COOP] gw_campaign attach existing client=' + client.name + ' id=' + client.id);
            self.attachClientLifecycle(client, false);
        });

        self.updateControl();
    };

    self.exit = function() {
        console.log('[GW_COOP] gw_campaign exit');
        if (self.removeHandlers)
            self.removeHandlers();

        if (server.onConnect.length)
            server.onConnect.pop();

        _.forEach(self.viewerReconnectTimers, function(timeout) {
            clearTimeout(timeout);
        });
        self.viewerReconnectTimers = {};

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

exports.exit = function(newState) {
    if (model)
        model.exit();

    model = undefined;
    return true;
};

main.gameModes.gw_campaign = exports;
