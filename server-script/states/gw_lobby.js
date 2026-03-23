var console = require('console'); // temporary workaround
var main = require('main');
var env = require('env');
var sim_utils = require('sim_utils');
var utils = require('utils');
var file = require('file');
var content_manager = require('content_manager');
var bouncer = require('bouncer');
var _ = require('thirdparty/lodash');
var ko = require('thirdparty/knockout');

console.log('gw_lobby server script: loaded');

var DISCONNECT_TIMEOUT = 0.0; // In ms.
var DEFAULT_GW_PLAYERS = 6;
var getGWMaxPlayers = function() {
    var envIndex = env.indexOf('--max-players');
    if (envIndex !== -1) {
        var envValue = parseInt(env[envIndex + 1]);
        if (_.isFinite(envValue) && envValue > 0)
            return envValue;
    }
    return DEFAULT_GW_PLAYERS;
};
var MAX_GW_PLAYERS = getGWMaxPlayers();

var debugging = false;

function debug_log(object) {
    if (debugging)
        console.log(JSON.stringify(object,null,'\t'));
}

var client_state = {
    control: {}
};

function LobbyModel(creator, launchContext) {
    var self = this;

    self.launchContext = launchContext || {};
    self.campaignActive = !!self.launchContext.gw_campaign_active;
    self.isSingleplayerGW = !self.campaignActive;
    self.beaconSettings = {
        game_name: 'Galactic War',
        tag: 'Testing',
        public: true,
        friends: false,
        hidden: false
    };

    if (self.launchContext.settings) {
        var launchSettings = self.launchContext.settings;
        if (_.isString(launchSettings.game_name))
            self.beaconSettings.game_name = launchSettings.game_name;
        if (_.isString(launchSettings.tag))
            self.beaconSettings.tag = launchSettings.tag;
        if (_.isBoolean(launchSettings.public))
            self.beaconSettings.public = launchSettings.public;
        if (_.has(launchSettings, 'friends'))
            self.beaconSettings.friends = !!launchSettings.friends;
        if (_.has(launchSettings, 'hidden'))
            self.beaconSettings.hidden = !!launchSettings.hidden;
    }

    self.applyLaunchAccessControl = function() {
        var access = self.launchContext.access || {};

        // Rehydrate campaign lobby access settings (password/whitelist/blacklist)
        // so gw_lobby and its beacon continue to mirror gw_campaign visibility.
        bouncer.setPassword(_.isString(access.password) ? access.password : '');
        bouncer.clearWhitelist();
        bouncer.clearBlacklist();

        if (_.isArray(access.friends)) {
            _.forEach(access.friends, function(id) {
                bouncer.addPlayerToWhitelist(id);
            });
        }

        if (_.isArray(access.blocked)) {
            _.forEach(access.blocked, function(id) {
                bouncer.addPlayerToBlacklist(id);
            });
        }
    };

    self.getSessionMaxClients = function() {
        if (self.isSingleplayerGW)
            return 1;

        if (_.isFinite(self.launchContext.max_clients) && self.launchContext.max_clients > 1)
            return Math.floor(self.launchContext.max_clients);

        return Math.max(2, MAX_GW_PLAYERS);
    };

    self.refreshCampaignContextFromConfig = function(config) {
        if (!config || !_.has(config, 'gw_campaign_active'))
            return;

        self.campaignActive = !!config.gw_campaign_active;
        self.isSingleplayerGW = !self.campaignActive;

        // Keep beacon identity aligned if the host provided runtime lobby settings.
        if (config.gw_campaign_settings) {
            var settings = config.gw_campaign_settings;
            if (_.isString(settings.game_name))
                self.beaconSettings.game_name = settings.game_name;
            if (_.isString(settings.tag))
                self.beaconSettings.tag = settings.tag;
            if (_.isBoolean(settings.public))
                self.beaconSettings.public = settings.public;
            if (_.has(settings, 'friends'))
                self.beaconSettings.friends = !!settings.friends;
            if (_.has(settings, 'hidden'))
                self.beaconSettings.hidden = !!settings.hidden;
            if (_.isFinite(settings.max_clients) && settings.max_clients > 0)
                self.launchContext.max_clients = Math.floor(settings.max_clients);
        }

        server.maxClients = self.getSessionMaxClients();
    };

    self.control = ko.observable({
        has_config: false,
        starting: false,
        system_ready: false,
        sim_ready: false
    });

    self.config = ko.observable();

    self.creator = creator.id;
    self.clientConfigReady = {};
    self.creatorReady = ko.observable();
    self.creatorReady.subscribe(function() {
        self.tryStart();
    });
    self.creatorDisconnectTimeout = undefined;

    self.tryStart = function() {
        var connectedClients = _.filter(server.clients, function(client) {
            return client.connected;
        });
        var allConfigReady = _.every(connectedClients, function(client) {
            return !!self.clientConfigReady[client.id];
        });
        var control = self.control();
        var readyToStart = !!self.creatorReady() && !!control.system_ready && !!control.sim_ready && allConfigReady;

        if (readyToStart && !control.starting)
            self.changeControl({ starting: true });
        else if (!readyToStart && control.starting)
            self.changeControl({ starting: false });

        if (!!self.creatorReady() && !allConfigReady)
            console.log('GW - Waiting for all clients to mount GW config before start');
    };

    self.updateBeacon = function() {
        // Never publish or update GW beacons for single-player sessions.
        // This prevents solo campaigns from being exposed as joinable lobbies.
        if (self.isSingleplayerGW) {
            server.beacon = null;
            return;
        }

        // Likewise, even if it is published, but set to either private or friends-only without a friends list, 
        // the beacon would be useless, so we don't publish in that case either.
        var hasFriendsList = bouncer.getWhitelist().length > 0;
        var publish = !self.beaconSettings.hidden && (self.beaconSettings.public || hasFriendsList);
        if (!publish) {
            server.beacon = null;
            return;
        }

        console.log('Updating beacon');
        var connectedClients = _.filter(server.clients, function(client) { return client.connected; });
        var modsData = server.getModsForBeacon();
        var config = self.config();
        var gameSystem = (config && config.system)
            ? utils.getMinimalSystemDescription(config.system)
            : { planets: [] };

        console.log('Connected clients: ' + connectedClients.length);
        server.beacon = {
            state: 'lobby',
            uuid: server.uuid(),
            full: connectedClients.length >= server.maxClients,
            started: !!self.control().starting,
            players: connectedClients.length,
            creator: creator.name,
            max_players: server.maxClients,
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
            tag: self.beaconSettings.tag,
            game: {
                system: gameSystem,
                name: self.beaconSettings.game_name
            },
            required_content: content_manager.getRequiredContent(),
            bounty_mode: false,
            bounty_value: 1.0,
            sandbox: !!(config && config.sandbox)
        };

        debug_log(server.beacon);
    };

    self.clientState = ko.computed(function() {
        if (!_.isEqual(client_state.control, self.control())) {
            client_state.control = self.control();
            server.broadcast({
                message_type: 'control',
                payload: client_state.control
            });
        }

        console.log('clientState', client_state);
        self.updateBeacon();
    });

    self.changeControl = function(updateFlags) {
        self.control(_.assign({}, self.control(), updateFlags));
    };

    var getAIName = (function () {

        var ai_names = _.shuffle(require('ai_names_table').data); /* shuffle returns a new collection */

        return function () {
            var name = ai_names.shift();
            ai_names.push(name);
            return name;
        }
    })();
    var addAINames = function(armies) {
        _.forEach(armies, function(army) {
            _.forEach(army.slots, function(slot) {
                if (slot.ai && !slot.name)
                    slot.name = getAIName();
            });
        });
    };

    self.sendGWConfigToClient = function(client) {
        var config = self.config();
        if (!config || !config.files)
            return;

        var message = {
            message_type: 'gw_config',
            payload: {
                files: config.files
            }
        };

        if (client && client.connected)
            client.message(message);
        else
            server.broadcast(message);

        if (client && client.id)
            self.clientConfigReady[client.id] = false;
        else {
            _.forEach(server.clients, function(c) {
                if (c.connected)
                    self.clientConfigReady[c.id] = false;
            });
        }

        self.tryStart();
    };

    self.startGame = function() {
        var config = self.config();
        var connectedClients = _.filter(server.clients, function(client) {
            return client.connected;
        });

        // Collect all human-controllable slots from non-AI armies.
        var humanSlots = [];
        var firstHumanArmy = null;
        _.forEach(config.armies, function(army) {
            var aiArmy = _.any(army.slots, 'ai');
            if (!aiArmy) {
                if (!firstHumanArmy)
                    firstHumanArmy = army;
                _.forEach(army.slots, function(slot) {
                    if (!slot.ai)
                        humanSlots.push(slot);
                });
            }
        });

        // Ensure enough human slots exist for all connected clients.
        if (firstHumanArmy && humanSlots.length < connectedClients.length) {
            var baseSlot = humanSlots[0] || { name: 'Player' };
            while (humanSlots.length < connectedClients.length) {
                var extraSlot = _.clone(baseSlot);
                delete extraSlot.client;
                delete extraSlot.ai;
                firstHumanArmy.slots.push(extraSlot);
                humanSlots.push(extraSlot);
            }
        }

        // Map connected humans into human slots.
        _.forEach(humanSlots, function(slot, index) {
            if (index < connectedClients.length)
                slot.client = connectedClients[index];
            else
                delete slot.client;
        });

        // Set up the players array for the landing state
        var players = {};
        _.forEach(connectedClients, function(client) {
            players[client.id] = _.clone(config.player);
        });

        console.log('GW - mapped clients to player slots: ' + _.map(connectedClients, function(client) {
            return client.name + ' (' + client.id + ')';
        }).join(', '));

        var landingConfig =
        {
            game:
            {
                system: config.system,
                type: 'Galactic War',
                game_options:
                {
                    game_type: 'Galactic War',
                    sandbox: config.sandbox,
                    eradication_mode: !!config.eradication_mode,
                    eradication_mode_sub_commanders: !!config.eradication_mode_sub_commanders,
                    eradication_mode_factories: !!config.eradication_mode_factories,
                    eradication_mode_fabricators: !!config.eradication_mode_fabricators,
                    bounty_mode: !!config.bounty_mode,
                    bounty_value: _.has(config, 'bounty_value') ? config.bounty_value : 0.5,
                    sudden_death_mode: !!config.sudden_death_mode,
                    land_anywhere: !!config.land_anywhere,
                    shuffle_landing_zones: !!config.shuffle_landing_zones
                }
            },
            armies: config.armies,
            players: players
        };

        addAINames(landingConfig.armies);

        console.log('final gw_lobby data:');
        var logConfig = _.clone(config);
        delete logConfig.files;
        console.log(JSON.stringify(logConfig, null, '\t'));

        config_summary = _.clone(logConfig);
        var client_names = [];
        _.forEach(config_summary.armies, function (army) {
            _.forEach(army.slots, function (slot) {
                if (slot.client) {
                    client_names.push(slot.client.name);
                }
            });
        });
        config_summary.client_names = client_names.join(" ");

        delete config_summary.player;
        delete config_summary.armies;
        delete config_summary.gw.galaxy;
        delete config_summary.gw.inventory;

        server.setReplayConfig(JSON.stringify(config_summary), JSON.stringify(config));

        main.setState(main.states.landing, landingConfig);
    };

    self.control.subscribe(function(control) {
        if (control.starting && control.system_ready && control.sim_ready)
            self.startGame();
    });

    self.validateConfig = function(config) {
        var systemValidationResult = sim_utils.validateSystemConfig(config.system);
        if (_.isString(systemValidationResult))
            return console.error('GW - Invalid configuration', systemValidationResult) && false;
        else
            return systemValidationResult.then (function() {
                if (!config.player || !config.player.commander)
                    return console.error('GW - Invalid player configuration') && false;

                var hasPlayer = false;
                var hasAI = false;
                var invalidArmy = false;
                var invalidAI = false;

                _.forEach(config.armies, function(army) {
                    invalidArmy |= !_.isArray(army.slots) || army.slots.length === 0;
                    if (!invalidArmy) {
                        var ai = _.any(army.slots, 'ai');
                        hasAI |= ai;
                        hasPlayer |= !ai;
                        if (ai) {
                            invalidAI |= _.any(army.slots, function(slot) {
                                if (!slot.ai)
                                    return true;
                                if (!slot.commander) {
                                    invalidAI = true;
                                    return true;
                                }
                                return false;
                            });
                        }
                    }
                });

                if (invalidAI)
                    return console.error('GW - Invalid AI configuration') && false;

                if (invalidArmy || !hasPlayer || !hasAI)
                    return console.error('GW - Invalid army configuration') && false;

                return true;
            });
    };

    self.config.subscribe(function(newConfig) {
        self.refreshCampaignContextFromConfig(newConfig);

        self.changeControl({
            has_config: true,
            system_ready: false,
            sim_ready: false
        });

        if (newConfig.files) {
            var cookedFiles = _.mapValues(newConfig.files, function(value) {
                if (typeof value !== 'string')
                    return JSON.stringify(value);
                else
                    return value;
            });
            file.mountMemoryFiles(cookedFiles);
        }

        sim.shutdown(false);
        sim.systemName = newConfig.system.name;
        sim.planets = newConfig.system.planets;

        self.sendGWConfigToClient();
    });

    var playerMsg = {
        set_config : function(msg, response)
        {
            if (self.control().has_config) {
                return response.fail('Configuration already set');
            }

            self.refreshCampaignContextFromConfig(msg.payload);

            var validResult = self.validateConfig(msg.payload);
            var validResponse = function(valid) {
                if (valid) {
                    self.config(msg.payload);
                    response.succeed();
                }
                else {
                    response.fail('Invalid configuration');
                    _.delay(function() { server.exit(); });
                }
            }

            if (_.isBoolean(validResult))
                validResponse(validResult);
            else
                validResult.then(validResponse);
        },
        set_ready: function(msg, response) {
            self.creatorReady(true);
            response.succeed();
        },
        request_gw_config: function(msg, response) {
            self.sendGWConfigToClient(msg.client);
            response.succeed();
        },
        gw_config_ready: function(msg, response) {
            self.clientConfigReady[msg.client.id] = true;
            self.tryStart();
            response.succeed();
        }
    };
    playerMsg = _.mapValues(playerMsg, function(handler, key) {
        return function(msg) {
            debug_log('playerMsg.' + key);
            var response = server.respond(msg);
            var creatorOnly = key === 'set_config' || key === 'set_ready';
            if (creatorOnly && msg.client.id !== self.creator)
                return response.fail("Invalid message");
            return handler(msg, response);
        };
    });

    var cleanup = [];

    self.enter = function() {
        self.applyLaunchAccessControl();
        server.maxClients = self.getSessionMaxClients();
        self.updateBeacon();

        utils.pushCallback(sim.planets, 'onReady', function (onReady) {
            debug_log('sim.planets.onReady');
            sim.create();
            self.changeControl({ system_ready: true });
            self.tryStart();
            return onReady;
        });
        cleanup.push(function () { sim.planets.onReady.pop(); });

        utils.pushCallback(sim, 'onReady', function (onReady) {
            debug_log('sim.onReady');
            self.changeControl({ sim_ready: true });
            self.tryStart();
            return onReady;
        });
        cleanup.push(function () { sim.onReady.pop(); });

        var removeHandlers = server.setHandlers(playerMsg);
        cleanup.push(function () { removeHandlers(); });
    };

    self.exit = function() {
        _.forEachRight(cleanup, function (c) { c(); });
        cleanup = [];
        // Keep beacon cleared for single-player sessions.
        server.beacon = null;
    };

    utils.pushCallback(creator, 'onDisconnect', function(onDisconnect) {
        self.creatorDisconnectTimeout = setTimeout(function() {
            delete self.creatorDisconnectTimeout;
            console.log('GW - Creator timed out');
            server.exit();
        }, DISCONNECT_TIMEOUT);
        return onDisconnect;
    });

    utils.pushCallback(server, 'onConnect', function (onConnect, client, reconnect) {
        if (client.id === self.creator) {
            if (self.creatorDisconnectTimeout) {
                clearTimeout(self.creatorDisconnectTimeout);
                delete self.creatorDisconnectTimeout;
            }

            self.creatorReady(false);
        }

        self.clientConfigReady[client.id] = false;

        utils.pushCallback(client, 'onDisconnect', function(onDisconnect) {
            delete self.clientConfigReady[client.id];
            self.updateBeacon();
            self.tryStart();
            return onDisconnect;
        });

        self.updateBeacon();
        self.sendGWConfigToClient(client);
        self.tryStart();
        return onConnect;
    });

    self.shutdown = function() {
        server.onConnect.pop();
    };
};

var lobbyModel;

exports.url = 'coui://ui/main/game/galactic_war/gw_lobby/gw_lobby.html';
exports.enter = function (owner, launchContext) {

    if (lobbyModel) {
        lobbyModel.shutdown();
        lobbyModel = undefined;
    }

    lobbyModel = new LobbyModel(owner, launchContext);
    lobbyModel.enter();

    try {
        console.log('GW_Lobby: entering, client_state = ' + JSON.stringify(client_state));
    }
    catch (e) {
        console.log('GW_Lobby: entering, client_state stringify failed', e);
    }

    return client_state;
};

exports.exit = function (newState) {
    if (lobbyModel)
        lobbyModel.exit();

    return true;
};

main.gameModes.gw = exports;
