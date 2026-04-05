var console = require('console'); // temporary workaround
var main = require('main');
var server = require('server');
var sim = require('sim');
var utils = require('utils');
var _ = require('thirdparty/lodash');
var vec = require('vec');
var chat_utils = require('chat_utils');

var client_state = {
    armies: [],
    zone_radius: 0,
    ranked: false
};
var playing = false;

var players = {};

var armies = [];
var diplomaticStates = {};

var game_options = {};

var forceLandingTimeout;

var cleanup = [];
var cleanupOnEntry = [];
var mapArmies = {};

var FORCE_START_TIMEOUT = 2 * 60 * 1000; /* in ms */
var START_PLAYING_DELAY = 5; /* in seconds */

var debugging = false;

_.assign(module, require('states/playing_shared').import(module));

function debug_log(object) {
    if (debugging)
        console.log(JSON.stringify(object, null, '\t'));
}

function startPlaying() {
    var count = START_PLAYING_DELAY;

    playing = true;

    (function countdownToPlaying() {
        server.broadcastCountdownEvent(count);
        count -= 1;

        if (count > 0)
            _.delay(countdownToPlaying, 1000);
        else {
            main.setState(main.states.playing, {
                players: players,
                armies: armies,
                diplomaticStates: diplomaticStates,
                armyDesc: client_state.armies,
                game_options: game_options,
                ranked: client_state.ranked
            });
        }
    })();
}

var updateArmyStateShared = updateArmyState;
var updateArmyState = function(transmit) {
    updateArmyStateShared(transmit);

    var launchCount = _.reduce(armies, function(sum, army) { return sum + !!army.desc.landing; }, 0);
    if (!launchCount && !playing)
        selectAISpawnsAndStartGame();
};

function assignZones(zones) {
    if (!armies.length)
        return;

    _.forEach(armies, function (army) {
        army.zones = [];
    });

    var army_index = 0;
    _.forEach(zones, function (element) {
        var list = element.positions;
        while (list.length) {
            var army = armies[army_index % armies.length];
            army.zones.push({
                position: list.pop(),
                planet_index: element.planet_index,
                radius: element.radius
            });

            army_index = army_index + 1;
        }
    });
}

function selectAISpawnsAndStartGame()
{
    var planetsWithPlayers = {};
    _.forEach(players, function (player)
    {
        planetsWithPlayers[player.spawn.planet_index] = true;
    });

    var withPlayer = function (zone)
    {
        if (planetsWithPlayers[zone.planet_index])
            return true;
    };

    var noPlayers = _.size(players) == 0;

    var aiPlanets = {};

    var withAI = function (zone)
    {
        if (aiPlanets[zone.planet_index])
            return true;
    };

    _.forEach(armies, function (army)
    {
        _.forEach(army.ai, function (ai)
        {
            var zones = [];

            switch (ai.landing_policy)
            {
                default: // fallthrough

                case 'no_restriction':

                    zones = _.reject(army.zones, withAI); // avoid other AI

                    break;

                case 'on_player_planet':

                    zones = _.filter(army.zones, withPlayer); // spawn with players

                    if (_.isEmpty(zones))
                        zones = _.reject(army.zones, withAI); // if no zones on player planet then just avoid other AI

                    break;

                case 'off_player_planet':

                    if (noPlayers)
                        zones = _.reject(army.zones, withAI); // avoid other AI
                    else
                    {
                        zones = _.reject(army.zones, withPlayer); // avoid players
                        zones = _.reject(zones, withAI); // avoid other AI

                        if (_.isEmpty(zones))
                            zones = _.reject(army.zones, withPlayer); // if no zones then just avoid players
                    }

                    break;
            }

// if no zones igore policy

            if (_.isEmpty(zones))
                zones = army.zones;

            ai.spawn = army.sim.aiSpawnLocation(zones);

            aiPlanets[ai.spawn.planet_index] = true;
        });
    });

    startPlaying();
}

function validateSpawnPoint(zones, location, planet_index) {

    return _.any(zones, function (zone) {
        var zoneRadiusSqr = zone.radius * zone.radius;
        var inRadius = game_options.land_anywhere || vec.distSqr3(location, zone.position) <= zoneRadiusSqr;
        return inRadius && planet_index === zone.planet_index;
    });
}

function forcePlayerLanding(player) {
    if (!player)
        return;

    var zone = _.sample(player.army.zones)
    if (!zone)
        return;

    playerMsg_landingLocationSelected({
        client: player.client,
        payload: {
            location: zone.position,
            planet_index: zone.planet_index
        }
    });
}

function playerMsg_landingLocationSelected(msg) {

    var response = server.respond(msg);
    var player = players[msg.client.id];
    if (!msg.payload)
        return response.fail("Invalid message");
    if (player.spawn)
        return response.fail("Player has already selected a landing zone");
    var location = vec.parse3(msg.payload.location);
    if (!location || !validateSpawnPoint(player.army.zones, location, msg.payload.planet_index))
        return response.fail("Invalid spawn point");
    player.spawn = msg.payload;
    var armyDesc = player.army.desc;
    --armyDesc.landing;
    if (!armyDesc.landing)
        delete armyDesc.landing;
    // Note: Due to some legacy code in the client interface,
    // this must be sent as an explicit message
    msg.client.message({
        message_type:'client_state',
        payload: exports.getClientState(msg.client)
    });
    response.succeed();
    updateArmyState(true);
}

function playerMsg_surrender(msg) {
    var response = server.respond(msg);

    var player = players[msg.client.id];
    if (!player)
        return response.fail("Player not found");

    if (player.has_surrendered)
        return response.fail("Player already surrendered");

    if (!player.spawn)
        forcePlayerLanding(player);

    player.has_surrendered = true;
    response.succeed();
}


function forceLanding() {
    forceLandingTimeout = undefined;
    // Pick a random landing for each player if time runs out.
    _.forEach(players, function(player) {
        if (player.spawn)
            return;

        forcePlayerLanding(player);
    });

    if (!playing)
    {
        console.error("forceLanding() did not result in a transition to playing state.  Armies:", JSON.stringify(armies));
        _.forEach(armies, function(army) {
            if (army.desc)
                delete army.desc.landing;
        });
        selectAISpawnsAndStartGame();
    }
}

var MAP_ARMY_NEUTRAL = -1;
var MAP_ARMY_HOSTILE = -2;

function getGameplayArmyCount() {
    // These are the only armies that represent players/AI slots.
    // Special map armies (-1 neutral, -2 hostile) are intentionally excluded.
    return armies.length;
}

function createMapArmy(armyType) {
    var armyDesc;
    if (armyType === MAP_ARMY_NEUTRAL) {
        armyDesc = {
            name: "Neutral Army",
            primary_color: [255, 255, 255],
            secondary_color: [0, 0, 0],
            alliance_group: 0,
            ai: false,
            econ_rate: 1
        };
    }
    else if (armyType === MAP_ARMY_HOSTILE) {
        armyDesc = {
            name: "Hostile Army",
            primary_color: [168, 160, 88],
            secondary_color: [8, 56, 68],
            alliance_group: 0,
            ai: false,
            econ_rate: 1
        };
    }
    else
        return undefined;

    var creationCheck = sim.armies.length;
    sim.armies.push(armyDesc);
    if (creationCheck === sim.armies.length) {
        console.error("Failed creating special map army", armyType);
        return undefined;
    }

    var simArmy = _.last(sim.armies);
    if (!simArmy)
        return undefined;

    return {
        sim: simArmy,
        id: simArmy.id,
        index: simArmy.index,
        special: true
    };
}

function updateMapArmyDiplomacy() {
    var neutralArmy = mapArmies[MAP_ARMY_NEUTRAL];
    var hostileArmy = mapArmies[MAP_ARMY_HOSTILE];

    _.forEach(armies, function (army) {
        if (neutralArmy) {
            // Player armies can attack/reclaim neutral units, but neutral units stay passive.
            sim.setDiplomaticState(army.id, neutralArmy.id, "neutral");
            sim.setDiplomaticState(neutralArmy.id, army.id, "neutral");
        }

        if (hostileArmy) {
            sim.setDiplomaticState(army.id, hostileArmy.id, "hostile");
            sim.setDiplomaticState(hostileArmy.id, army.id, "hostile");
        }
    });

    if (neutralArmy && hostileArmy) {
        // Keep map-only neutral factions non-hostile to each other.
        sim.setDiplomaticState(neutralArmy.id, hostileArmy.id, "allied");
        sim.setDiplomaticState(hostileArmy.id, neutralArmy.id, "allied");
    }
}

function getUnitArmy(armyIndex) {
    if (armyIndex === MAP_ARMY_NEUTRAL || armyIndex === MAP_ARMY_HOSTILE) {
        if (!mapArmies[armyIndex]) {
            mapArmies[armyIndex] = createMapArmy(armyIndex);
            updateMapArmyDiplomacy();
        }
        return mapArmies[armyIndex];
    }

    return armies[armyIndex];
}

function setupPlanets(system) {
    _.forEach(system.planets, function (planet, index) {
        _.forEach(planet.units, function (unit) {
            var armyIndex = _.has(unit, 'army') ? Number(unit.army) : 0;
            if (!_.isFinite(armyIndex))
                armyIndex = 0;

            armyIndex = armyIndex < 0 ? Math.ceil(armyIndex) : Math.floor(armyIndex);

            var army = getUnitArmy(armyIndex);
            if (!army) {
                console.error("Invalid army index for map unit", armyIndex, unit.unit_spec);
                return;
            }

            var hpFraction = _.has(unit, 'hp_fraction') ? Number(unit.hp_fraction) : undefined;
            if (_.isFinite(hpFraction)) {
                if (hpFraction < -1)
                    hpFraction = -1;
                else if (hpFraction > 1)
                    hpFraction = 1;
            }
            else
                hpFraction = undefined;

            spawnUnit({
                army: army,
                spec: unit.unit_spec,
                planet: sim.planets[index],
                position: unit.pos,
                orientation: unit.orient,
                hp_fraction: hpFraction
            });
        });
    });
}

exports.url = 'coui://ui/main/game/live_game/live_game.html';
exports.enter = function(config) {
    mapArmies = {};

    if (main.spectators) {
        if (server.beacon)
            server.beacon.state = 'landing';
    } else {
        server.beacon = undefined;
        server.close("Game in progress");
    }

    var clean_config = _.cloneDeep(config);

    _.forEach(clean_config.armies, function(army)
    {
        _.forEach(army.slots, function(slot)
        {
            var client = slot.client;

            if (client)
            {
                client.debugDesc = '';

                var data = client.data;

                if (data)
                {
                    try
                    {
                        data = JSON.parse(data);
                        if (data.password)
                        {
                            data.password = '';
                            client.data = JSON.stringify(data);
                        }
                    }
                    catch (e)
                    {

                    }
                }
            }
        })
    });

    _.forEach(clean_config.players, function(player)
    {
        var client = player.client;

        if (client)
        {
            client.debugDesc = '';

            var data = client.data;

            if (data)
            {
                try
                {
                    data = JSON.parse(data);

                    if (data.password)
                    {
                        data.password = '';
                        client.data = JSON.stringify(data);
                    }
                }
                catch (e)
                {

                }
            }
        }
    })

    // store the config in case we want use save/load
    server.setGameConfig(JSON.stringify(clean_config));

    client_state.sim_speed_multiplier = sim.speed;
    client_state.ranked = config.ranked;
    client_state.force_start = config.game.system.force_start;
    game_options = config.game.game_options;


    // Note: It's quite possible this does not have correct semantics.  This is
    // kind of a "hope" for correctness on a server that runs the landing
    // state more than once.
    _.forEachRight(cleanupOnEntry, function(c) { c(); });
    cleanupOnEntry = [];

    initArmyState(config);

    _.forEach(sim.players, function(player) {
        var client = player.client;
        utils.pushCallback(client, 'onDisconnect', function(onDisconnect) {
            updateConnectionState();
            if (!player.spawn)
                forcePlayerLanding(player);

            return onDisconnect;
        });
        cleanup.push(function () { client.onDisconnect.pop(); });

    });
    utils.pushCallback(server, 'onConnect', updateConnectionState);
    cleanup.push(function() { server.onConnect.pop(); });

    console.log("Created", getGameplayArmyCount(), "gameplay armies and", sim.players.length, "players");

    var planet_zones = {};
    var total_zones = 0;
    var force_random = false;

    var processPlanet = function (planet, index) {
        var planetConfig = config.game.system.planets[index];
        var planetRadius = planetConfig.generator.radius;

        var maxZonesPerArmy;
        if (planetConfig.generator.landingZonesPerArmy > 0)
            maxZonesPerArmy = planetConfig.generator.landingZonesPerArmy;
        else
            maxZonesPerArmy = Math.min(Math.ceil(planetRadius / 300), 4);

        var zoneRadius;
        if (planetConfig.generator.landingZoneSize > 0)
            zoneRadius = planetConfig.generator.landingZoneSize;
        else
            zoneRadius = planetRadius / 5;

        var bufferRadius = planetRadius * 0.2;

        if (planetConfig.starting_planet) {
            planet_zones[index] = planet.genMetalAndLandingSpots(maxZonesPerArmy,
                                                                 zoneRadius,
                                                                 bufferRadius,
                                                                 getGameplayArmyCount(),
                                                                 force_random);
            total_zones = total_zones + planet_zones[index].positions.length;
        }
        else
            planet.genMetalSpots();

        if (planet_zones[index])
            planet_zones[index].planet_index = index;
    }

    _.forEach(sim.planets, processPlanet);

    // check that we have enough zones for each army, and regerate if required
    if (total_zones < getGameplayArmyCount())
    {
        planet_zones = {};
        force_random = true;
        _.forEach(sim.planets, processPlanet);
    }

    if (_.isEmpty(planet_zones)) {
        // TODO: This should probably do something a little more graceful.  Or just
        // never fail.
        console.error("Unable to create landing zones.  Aborting.");
        server.exit();
        return;
    }

    if (game_options.shuffle_landing_zones)
        planet_zones = _.shuffle(planet_zones);

    assignZones(planet_zones);

    if (env.indexOf('--debug-landing-zones') < 0) {
        var forceTime = FORCE_START_TIMEOUT;
        if (config.game.system.force_start) {
            forceTime = 100;
        }

        forceLandingTimeout = setTimeout(forceLanding, forceTime);
        cleanup.push(function() {
            if (forceLandingTimeout !== undefined)
                clearTimeout(forceLandingTimeout);
        });
    }

    var transientHandlers = {
        landing_location_selected: playerMsg_landingLocationSelected,
        surrender: playerMsg_surrender
    };
    _.assign(transientHandlers, chat_utils.getChatHandlers(players, { listen_to_spectators: game_options.listen_to_spectators }));

    cleanup.push(server.setHandlers(transientHandlers));
    cleanup.push(server.setHandlers(playerMsg_handlers));

    setupPlanets(config.game.system);

    // Make sure the army state is consistent (handles no-player condition)
    updateArmyState(false);

    sim.paused = false;

    return client_state;
};

exports.exit = function(newState) {
    _.forEachRight(cleanup, function(c) { c(); });
    cleanup = [];
    return true;
};

exports.getClientState = function(client) {
    var player = players[client.id];
    if (!player) { //if there is no player you are a spectator
        return {
            vision_bits: sim.armies.getVisionBits(client),
            game_options: game_options
        };
    }
    var army = player.army;
    return {
        army_id: army.desc.id,
        vision_bits: sim.armies.getVisionBits(client),
        zones: army.zones,
        landing_position: player.spawn,
        game_options: game_options
    };
};
