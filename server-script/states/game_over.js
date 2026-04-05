var console = require('console'); // temporary workaround
var main = require('main');
var utils = require('utils');
var _ = require('thirdparty/lodash');
var chat_utils = require('chat_utils');
var content_manager = require('content_manager');

var REPLAY_FILENAME = main.REPLAY_FILENAME;

// Timeout values, in seconds.
var PAUSE_TIMEOUT = 30;
var REPLAY_TIMEOUT = main.REPLAY_TIMEOUT;

var winners = {};
var losers = {};

var duration = 0;
var elapsed = 0;

var cleanup = [];

var markComplete = _.once(function(winners, losers, type, duration, elapsed, winners_units_created, winners_commands_given, losers_units_created, losers_commands_given) { server.markLadderGameComplete(winners, losers, type, duration, elapsed, winners_units_created, winners_commands_given, losers_units_created, losers_commands_given); });

// stored data from playing state. needed if we rewinded back to the playing state.
var players = {};
var armies = [];
var game_options = {};
var diplomaticStates = {};
var client_state;
var gwCampaignRestartRequested = false;

// Delay before shutdown gives all connected clients enough time to receive
// the restart-prepare broadcast and switch into reconnect behavior.
var GW_CAMPAIGN_RESTART_BROADCAST_DELAY_MS = 3000;

function playerMsg_surrender(msg) {
    return server.respond(msg).fail("Game has already ended");
}

function playerMsg_trim_history_and_restart(msg) {

    var allow = (server.clients.length === 1) || !!game_options.sandbox;
    if (!allow)
        return;

    var reject = main.gameMode === "Ladder1v1";
    if (reject)
        return;

    var time = Number(msg.payload.time);
    if (!time || time < 0)
        return;

    main.setState(main.states.playing, {
        players: players,
        armies: armies,
        diplomaticStates: diplomaticStates,
        armyDesc: client_state.armies,
        game_options: game_options,
        ranked: client_state.ranked,
        restart: true,
        restartTime: time /* in seconds */,
        valid_time_range: { min: client_state.control.valid_time_range.min, max: -1 }
    });
}

function playerMsg_controlSim(msg) {
    var response = server.respond(msg);

    var desc = msg.payload;
    if (desc.hasOwnProperty('paused')) {
        sim.paused = !!desc.paused;

        server.broadcast({
            message_type: 'control_state',
            payload: {
                paused: !!desc.paused
            }
        });
        sim.paused = !!desc.paused;
    }

    response.succeed();
}

 var playerMsg_writeReplay = function (msg) {
    var allow_save = (server.clients.length === 1) || !!game_options.sandbox;

    if (allow_save && msg.payload.name)
        server.writeReplay(msg.payload.name, 'replay');
};

// Helper that gates restart behavior to co-op GW battles only so we do not
// alter non-co-op or non-GW game-over behavior.
function isGwCampaignCoopMatch() {
    return !!(game_options && game_options.gw_campaign_active);
}

// IDs can be numeric in some environments and strings in others.
// We normalize both sides to strings before comparing.
function normalizeClientId(id) {
    if (_.isUndefined(id) || id === null)
        return undefined;

    return String(id);
}

function isCampaignHostClient(client) {
    var hostId = normalizeClientId(game_options && game_options.gw_campaign_host_id);
    var clientId = normalizeClientId(client && client.id);

    return !!hostId && !!clientId && hostId === clientId;
}

// Build the payload that tells clients to enter reconnect mode.
// This payload is intentionally host-agnostic enough that both host and viewers
// can use it to coordinate the same restart sequence.
function buildGwCampaignRestartPreparePayload() {
    var settings = _.cloneDeep(game_options && game_options.gw_campaign_settings || {});
    var access = _.cloneDeep(game_options && game_options.gw_campaign_access || {});
    var hostId = normalizeClientId(game_options && game_options.gw_campaign_host_id);

    return {
        host_id: hostId,
        settings: settings,
        access: access,
        shutdown_delay_ms: GW_CAMPAIGN_RESTART_BROADCAST_DELAY_MS,
        // A timestamp token lets clients ignore stale restart-prep messages
        // if they ever receive delayed messages from a previous attempt.
        restart_token: Date.now()
    };
}

// Performs a full server restart for co-op GW:
// 1) broadcast restart prep to all clients
// 2) shut down sim/server process so host can start a fresh campaign server
// 3) clients reconnect through UI-side retry logic
function beginGwCampaignProcessRestart() {
    if (gwCampaignRestartRequested)
        return false;

    gwCampaignRestartRequested = true;
    var preparePayload = buildGwCampaignRestartPreparePayload();

    var broadcastPrepare = function() {
        var recipients = _.map(_.filter(server.clients, function(client) {
            return client && client.connected;
        }), function(client) {
            return client.id;
        });

        console.log('[GW_COOP] sending restart_prepare to connected clients=' + JSON.stringify(recipients));

        server.broadcast({
            message_type: 'gw_return_to_campaign_restart_prepare',
            payload: preparePayload
        });

        // Direct-send to each connected client as a fallback
        // in case some clients miss a broadcast while changing UI state.
        _.forEach(server.clients, function(client) {
            if (!client || !client.connected)
                return;

            var role = isCampaignHostClient(client) ? 'host' : 'viewer';

            client.message({
                message_type: 'gw_return_to_campaign_restart_prepare',
                // Include per-client role so UI never has to infer host/viewer
                // from potentially inconsistent identity fields.
                payload: _.assign({}, preparePayload, {
                    role: role
                })
            });
        });
    };

    // Broadcast the restart preparation message to all clients so 
    // they can begin showing the appropriate UI and reconnect logic for the upcoming restart. 
    broadcastPrepare();

    // Now we delay the process shutdown to give clients enough time to receive the restart message and 
    // switch into reconnect mode before we kill the server. 
    _.delay(function() {
        console.log('[GW_COOP] Executing process-level restart from game_over after delay=' + GW_CAMPAIGN_RESTART_BROADCAST_DELAY_MS + 'ms');
        // Ensure process exits after sim shutdown so clients can reconnect to a
        // newly-started campaign server instead of reusing this ended battle process.
        sim.onShutdown = server.exit;
        sim.shutdown(true);

        // Fallback exit in case shutdown callback does not fire.
        _.delay(server.exit, 5000);
    }, GW_CAMPAIGN_RESTART_BROADCAST_DELAY_MS);

    return true;
}

// Host-only message used by Continue War in co-op GW game_over to trigger a
// full process restart and reconnect flow.
function playerMsg_gwReturnToCampaignRestart(msg) {
    var response = server.respond(msg);

    if (!isGwCampaignCoopMatch())
        return response.fail('Co-op GW restart is only available for co-op GW matches');

    if (!isCampaignHostClient(msg.client))
        return response.fail('Only the co-op host can trigger Continue War restart');

    var started = beginGwCampaignProcessRestart();
    return response.succeed({
        restarting: true,
        already_requested: !started
    });
}

// game over state should still redirect to live_game eg spectator joining
exports.url = 'coui://ui/main/game/live_game/live_game.html';
exports.enter = function (game_over_data)
{
    players = game_over_data.players;
    armies = game_over_data.armies;
    game_options = game_over_data.game_options;
    diplomaticStates = game_over_data.diplomaticStates;
    client_state = game_over_data.client_state;
    gwCampaignRestartRequested = false;

    var GAMEOVER_SHUTDOWN_TIMEOUT = main.GAMEOVER_SHUTDOWN_TIMEOUT;

    var writeReplay = _.once(function() {
        if (REPLAY_FILENAME) {
            var now = new Date();
            switch(REPLAY_FILENAME) {
                case 'UTCTIMESTAMP': REPLAY_FILENAME = now.toISOString().replace(/(T|:)/g, '-') + '-replay'; break;
            }
            server.writeReplay(REPLAY_FILENAME, 'replay');
        } else {
            server.writeReplay();
        }
    });

    // In co-op GW, continuing the war will restart the server,
    // but this means that we also need to think about when to actually
    // shut it down since saving and exiting will also trigger shutdown
    // albeit one that we don't want to restart from. 
    // 
    // Moreover, we delay the shutdown until the end of the restart flow, 
    // which should not happen when players just want to save and exit.
    // So we want to track whether we are in the middle of a co-op restart flow, 
    // and if so, delay the shutdown until the end of that flow.
    // Otherwise we want to shut down immediately on game over if the host saves and exits.
    
    var shutdownForCoopHostDisconnect = _.once(function(reason) {
        if (gwCampaignRestartRequested || !isGwCampaignCoopMatch())
            return;

        console.log('[GW_COOP] game_over host disconnect shutdown reason=' + reason);
        writeReplay();
        sim.onShutdown = server.exit;
        sim.shutdown(true);
    });

    if (isGwCampaignCoopMatch()) {
        var hostId = normalizeClientId(game_options && game_options.gw_campaign_host_id);
        var hostClient = _.find(server.clients, function(client) {
            return client && normalizeClientId(client.id) === hostId;
        });

        if (hostId && hostClient) {
            utils.pushCallback(hostClient, 'onDisconnect', function(onDisconnect) {
                shutdownForCoopHostDisconnect('host_onDisconnect');
                return onDisconnect;
            });

            cleanup.push(function() {
                if (hostClient.onDisconnect && hostClient.onDisconnect.length)
                    hostClient.onDisconnect.pop();
            });
        }
    }

    _.delay(function () {
        sim.paused = true;
    }, PAUSE_TIMEOUT * 1000);


    if (main.keep_alive) {
        setTimeout( function() {
            writeReplay();
        }, REPLAY_TIMEOUT * 1000 );
    } else {

        var timeouts = {
            replayTimeout: null,
            tenMinuteMark: null,
            forceShutdown: null,
            connectionPolling: null
        }

        timeouts.replayTimeout = setTimeout(function () {
            writeReplay();
        }, REPLAY_TIMEOUT * 1000);

        console.log("The server will shut down in " + GAMEOVER_SHUTDOWN_TIMEOUT / 60 + " minutes.");
        timeouts.tenMinuteMark = setTimeout(function () {
            writeReplay();
            server.incrementTitleStatistic("LobbyStillUp10MinsAfterGameOver", 1);
        }, 600 * 1000);

        timeouts.forceShutdown = setTimeout(function () {
            server.incrementTitleStatistic("ForcedServerShutdown", 1);
            _.delay(function () {
                console.log("Game over timeout reached. Server shutting down.");
                writeReplay();
                server.exit();
            }, 10 * 1000);
        }, GAMEOVER_SHUTDOWN_TIMEOUT * 1000);

        timeouts.connectionPolling = setInterval(function () {
            // Co-op restart intentionally disconnects players from the ended
            // battle server before scheduled shutdown. Do not let empty-server
            // polling short-circuit the restart delay window.
            if (gwCampaignRestartRequested)
                return;

            if (!server.connected) {
                writeReplay();
                sim.onShutdown = server.exit;
                sim.shutdown(true);
            }
        }, 1000);

        cleanup.push(function () {
            clearTimeout(timeouts.replayTimeout);
            clearTimeout(timeouts.tenMinuteMark);
            clearTimeout(timeouts.forceShutdown);
            clearInterval(timeouts.connectionPolling);
        });
    }

    function foreach_client_in_army(army_list, f) {
        _.forEach(army_list, function(army) {
            _.forEach(army.players, function(player) {
                f(player.client);
            });
        });
    };

    winners = {};
    var winner_clients = [];
    foreach_client_in_army(game_over_data.winners, function (client) {
        winners[client.id] = true;
        winner_clients.push(client);
    });

    losers = {};
    var loser_clients = [];
    foreach_client_in_army(game_over_data.losers, function (client) {
        losers[client.id] = true;
        loser_clients.push(client);
    });

    var winners_units_created = 0;
    var winners_commands_given = 0;

    _.forEach(game_over_data.winners, function(army)
    {
        var stats = army.sim.stats;

        console.log(JSON.stringify(stats, null, 2));

        winners_units_created = Math.max(winners_units_created, stats.units_created);
        winners_commands_given = Math.max(winners_commands_given, stats.commands_given);
    });

    var losers_units_created = 0;
    var losers_commands_given = 0;

    _.forEach(game_over_data.losers, function(army)
    {
        var stats = army.sim.stats;

        console.log(JSON.stringify(stats, null, 2));

        losers_units_created = Math.max(losers_units_created, stats.units_created);
        losers_commands_given = Math.max(losers_commands_given, stats.commands_given);
    });

    var control = game_over_data.client_state.control;

    duration = control.duration;
    elapsed = control.elapsed;

    if (main.gameMode === "Ladder1v1")
    {
        console.log("Ladder game, marking as complete (" + winner_clients.length + " winner(s), " + loser_clients.length + " loser(s)) Duration: " + duration + " Elapsed: " + elapsed + ' Winners Units Created: ' + winners_units_created + ' Winners Commands Given ' + winners_commands_given + ' Losers Units Created: ' + losers_units_created + ' Losers Commands Given ' + losers_commands_given);

        server.onLadderGameMarkedComplete = function(success) {
            console.log("Ratings updated on server, notifying clients to refresh.");
            server.broadcast({
                message_type: 'rating_updated',
                payload: {
                    'success': success,
                    'game_type': content_manager.getMatchmakingType(),
                }
            });
        };
        if (winner_clients.length + loser_clients.length > 0)
            markComplete(winner_clients, loser_clients, content_manager.getMatchmakingType(), duration, elapsed, winners_units_created, winners_commands_given, losers_units_created, losers_commands_given);
        }

    var transientHandlers = {
        surrender: playerMsg_surrender,
        trim_history_and_restart: playerMsg_trim_history_and_restart,
        control_sim: playerMsg_controlSim,
        write_replay: playerMsg_writeReplay,
        // Host-only co-op GW "Continue War" handler for full process restart.
        gw_return_to_campaign_restart: playerMsg_gwReturnToCampaignRestart
    };
    _.assign(transientHandlers, chat_utils.getChatHandlers(game_over_data.players, { listen_to_spectators: true, ignore_defeated_state: true }));
    cleanup.push(server.setHandlers(transientHandlers));

    return game_over_data.client_state;
};

exports.exit = function(newState) {
    _.forEachRight(cleanup, function(c) { c(); });
    cleanup = [];
    gwCampaignRestartRequested = false;
    return true;
};

exports.getClientState = function(client) {

    var payload =
    {
        duration: duration,
        elapsed: elapsed,
    }

    if (winners[client.id])
        payload.winner = true;
    else if (losers[client.id])
        payload.loser = true;

    // Per-client co-op role metadata is attached at game_over so the live_game
    // UI can hide Continue War for viewers and only allow host-triggered restart.
    payload.gw_campaign_active = isGwCampaignCoopMatch();
    payload.gw_campaign_host_id = normalizeClientId(game_options && game_options.gw_campaign_host_id);
    payload.gw_campaign_settings = _.cloneDeep(game_options && game_options.gw_campaign_settings || {});
    payload.gw_campaign_access = _.cloneDeep(game_options && game_options.gw_campaign_access || {});
    payload.gw_campaign_role = payload.gw_campaign_active
        ? (isCampaignHostClient(client) ? 'host' : 'viewer')
        : 'solo';

    return payload;
};
