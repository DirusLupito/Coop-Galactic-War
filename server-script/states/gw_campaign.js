var console = require('console'); // temporary workaround
var main = require('main');
var utils = require('utils');
var content_manager = require('content_manager');
var _ = require('thirdparty/lodash');

var MAX_GW_CAMPAIGN_PLAYERS = 2;
var VIEWER_RECONNECT_TIMEOUT = 30 * 1000; // ms

var model;

function GWCampaignModel(creator) {
    var self = this;

    self.creatorId = creator.id;
    self.creatorName = creator.name;
    self.viewerReconnectTimers = {};
    self.lastSnapshot = undefined;
    self.lastSnapshotSeq = 0;

    self.control = {
        host_id: self.creatorId,
        host_name: self.creatorName,
        max_clients: MAX_GW_CAMPAIGN_PLAYERS,
        connected_clients: [],
        has_snapshot: false,
        snapshot_seq: 0
    };

    self.getConnectedClients = function() {
        return _.filter(server.clients, function(client) {
            return client.connected;
        });
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
                host_name: self.creatorName
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
            return {
                id: client.id,
                name: client.name,
                role: self.getRoleForClient(client)
            };
        });
        self.control.has_snapshot = !!self.lastSnapshot;
        self.control.snapshot_seq = self.lastSnapshotSeq;

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

        server.beacon = {
            state: 'lobby',
            uuid: server.uuid(),
            full: connectedClients.length >= server.maxClients,
            started: false,
            players: connectedClients.length,
            creator: self.creatorName,
            max_players: MAX_GW_CAMPAIGN_PLAYERS,
            spectators: 0,
            max_spectators: 0,
            mode: 'FreeForAll',
            mod_names: modsData.names,
            mod_identifiers: modsData.identifiers,
            cheat_config: main.cheats,
            player_names: _.map(connectedClients, function(client) { return client.name; }),
            spectator_names: [],
            require_password: false,
            whitelist: [],
            blacklist: [],
            tag: 'Testing',
            game: {
                system: self.tryGetBeaconSystem(),
                name: 'GW Co-op Campaign'
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
        }

        self.updateControl();
        self.sendRoleToClient(client);
        self.sendSnapshotToClient(client, reconnect ? 'reconnect' : 'join');
    };

    self.enter = function() {
        server.maxClients = MAX_GW_CAMPAIGN_PLAYERS;
        console.log('[GW_COOP] gw_campaign enter host=' + self.creatorName + ' id=' + self.creatorId);

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
            launch_gw_battle: function(msg) {
                if (msg.client.id !== self.creatorId)
                    return server.respond(msg).fail('Only host can launch battle');

                console.log('[GW_COOP] launch_gw_battle by host=' + msg.client.name);
                server.respond(msg).succeed();
                main.setState(main.states.gw_lobby, msg.client);
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
