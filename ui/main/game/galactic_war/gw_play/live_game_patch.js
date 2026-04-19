// !LOCNS:live_game
(function() {
    var patch = function(model, handlers) {
        var activeGameId = ko.observable().extend({ local: 'gw_active_game' });
        var hardcore = ko.observable();
        var tutorial = ko.observable(false);
        var abandonGame = function(doExit) { }; /* replaced after gw game has been loaded. */
        var saveGame = function(name) { }; /* replaced after gw game has been loaded. */
        var exitToPlay = 'coui://ui/main/game/galactic_war/gw_play/gw_play.html';
        var exitToStart = 'coui://ui/main/game/galactic_war/gw_start/gw_start.html';
        var restartLoadingUrl = 'coui://ui/main/game/gw_campaign_restart_loading/gw_campaign_restart_loading.html';
        var exitDestination = ko.observable(exitToPlay);

        // Session/local state used for the co-op GW "Continue War" restart flow.
        // This must work both in game_over and in defeated-while-playing cases
        // (for example GWO FFA scenarios where other factions are still alive).
        var gwCampaignEnabled = ko.observable(false).extend({ session: 'gw_campaign_enabled' });
        var gwCampaignRole = ko.observable('solo').extend({ session: 'gw_campaign_role' });
        var gwCampaignRestartPending = ko.observable(false).extend({ local: 'gw_campaign_restart_pending' });
        var gwCampaignRestartContext = ko.observable().extend({ local: 'gw_campaign_restart_context' });
        var reconnectToGameInfo = ko.observable().extend({ local: 'reconnect_to_game_info' });
        var useLocalServer = ko.observable().extend({ session: 'use_local_server' });
        var gameContent = ko.observable().extend({ session: 'game_content' });
        var connectionAttempts = ko.observable().extend({ session: 'connection_attempts' });
        var connectionRetryDelaySeconds = ko.observable().extend({ session: 'connection_retry_delay_seconds' });
        var uberId = ko.observable().extend({ session: 'uberId' });
        var displayName = ko.observable().extend({ session: 'displayName' });

        var lastGameOverClientState;
        var loadedGwGame;
        var gwCampaignRestartRequestInFlight = false;
        var gwCampaignRestartNavigating = false;

        var isCampaignHost = function() {
            return gwCampaignEnabled() && gwCampaignRole() === 'host';
        };

        // Build host-side reconnect context so host can start a fresh gw_campaign
        // server process with the same campaign/lobby intent after game_over.
        var buildCampaignRestartContext = function() {
            var clientState = lastGameOverClientState || {};
            var settings = _.cloneDeep(clientState.gw_campaign_settings || {});
            var access = _.cloneDeep(clientState.gw_campaign_access || {});
            var reconnectInfo = reconnectToGameInfo() || {};

            return {
                host_id: clientState.gw_campaign_host_id,
                settings: settings,
                access: access,
                content: (_.isFunction(loadedGwGame && loadedGwGame.content) ? loadedGwGame.content() : undefined) || gameContent() || reconnectInfo.content,
                use_local_server: !!useLocalServer(),
                mods: reconnectInfo.mods || []
            };
        };

        // During restart we force clients off live_game immediately, before the
        // server emits SimTerminated. This avoids default live_game disconnect
        // behavior which would force users to the main menu rather than let them
        // reconnect to the new campaign server.
        var navigateForCampaignRestart = function() {
            if (!gwCampaignRestartPending())
                return false;

            if (gwCampaignRestartNavigating)
                return true;

            var context = _.assign({}, buildCampaignRestartContext(), gwCampaignRestartContext() || {});
            var role = gwCampaignRole();

            connectionAttempts(5);
            connectionRetryDelaySeconds(3);

            // Persist context so the restart-loading scene can either launch a
            // fresh gw_campaign (host) or start reconnect retries (viewer).
            context.pending_reapply = (role === 'host');
            gwCampaignRestartContext(context);
            gwCampaignRestartNavigating = true;
            console.log('[GW_COOP] navigateForCampaignRestart role=' + role + ' shutdownDelay=' + context.shutdown_delay_ms);

            // Mark disconnect as user-triggered so live_game native disconnect
            // handlers do not force transit back to main menu.
            if (_.isFunction(model.userTriggeredDisconnect))
                model.userTriggeredDisconnect(true);
            if (_.isFunction(model.disconnect))
                model.disconnect();

            window.location.href = restartLoadingUrl + '?role=' + encodeURIComponent(role || 'viewer');
            return true;
        };

        var deleteSavedGame = function() { };
        var winGame = function() { };
        var loseGame = function() { };

        var hasSavedGame = ko.observable(false);

        requireGW(['require', 'shared/gw_common'], function(require, GW) {
            var gameLoader = GW.manifest.loadGame(activeGameId());
            gameLoader.then(function(game) {
                loadedGwGame = game;
                hardcore(game.hardcore());
                tutorial(game.isTutorial());
                hasSavedGame(!!game.replayName());
                abandonGame = function(doExit) {
                    GW.manifest.removeGame(game)
                        .then(doExit);
                };

                saveGame = function(name, lobby_id) {
                    game.replayName(lobby_id ? null : name);
                    game.replayLobbyId(lobby_id);
                    game.replayStar(game.currentStar());
                    GW.manifest.saveGame(game);
                    hasSavedGame(true);
                };

                deleteSavedGame = function() {
                    /* the game is over, so clear out the replay */
                    game.replayName(null);
                    game.replayLobbyId(null);
                    game.replayStar(null);
                    hasSavedGame(false);
                };

                winGame = function() {

                    // winner so delete saved game

                    deleteSavedGame();
                    game.lastBattleResult('win');
                    return GW.manifest.saveGame(game);
                };

                loseGame = function() {

                    // hardcore loser cannot resume saved games

                    if (hardcore())
                        deleteSavedGame();

                    game.lastBattleResult('loss');
                    return GW.manifest.saveGame(game);
                };
            });
        });

        model.timedOut.subscribe(function() {
            if (model.timedOut())
                exitDestination(exitToPlay);
        });

        var oldNavToMainMenu = model.navToMainMenu;
        model.navToMainMenu = function() {
            if (model.gameOver() || model.timedOut() || !hardcore())
                oldNavToMainMenu();
            else
                abandonGame(oldNavToMainMenu);
        };

        var menuExitToWar = function(settings) {
            var popup = model.gameOver() ? $.when(0) : model.popUp(settings);
            popup.then(function(result) {
                if (result === 0)
                    model.navToMainMenu();
            });
        }
        model.menuAbandonWar = function() {
            menuExitToWar({
                message: '!LOC:Are you sure you want to abandon this Galactic War?[br](All progress and Tech will be lost.)'
            });
        };

        model.navToGalacticWar = function() {
            engine.call('pop_mouse_constraint_flag');
            engine.call("game.allowKeyboard", true);

            model.abandon().always(function() {
                model.userTriggeredDisconnect(true);
                model.disconnect();
                window.location.href = exitToPlay;
            });
        }

        model.menuReturnToWar = function() {
            // Co-op GW game_over uses a coordinated restart path instead
            // of direct navToGalacticWar so all clients can reconnect together.
            // We also allow this when the human side has been defeated but the
            // match has not yet transitioned to server game_over.
            var canUseCampaignRestart = gwCampaignEnabled() && (model.gameOver() || model.isSpectator());
            if (canUseCampaignRestart) {
                if (!isCampaignHost())
                    return;

                if (gwCampaignRestartRequestInFlight)
                    return;

                gwCampaignRestartRequestInFlight = true;
                _.delay(function() {
                    gwCampaignRestartRequestInFlight = false;
                }, 3000);

                gwCampaignRestartContext(buildCampaignRestartContext());
                model.setMessage({
                    message: loc('!LOC:Requesting campaign restart...')
                });
                send_message('gw_return_to_campaign_restart', {});
                return;
            }

            model.navToGalacticWar();
        };

        var send_message = function(message, payload) {
            var m = {};
            if (!_.isUndefined(payload))
                m.payload = payload;
            m.message_type = message;
            engine.call("conn_send_message", JSON.stringify(m));
        };

        model.menuSaveWar = function() {
            if (model.closeMenu)
                model.closeMenu();

            var popup = model.gameOver() ? $.when(0) : model.popUp({ message: '!LOC:Save game?' });
            popup.then(function(result) {
                if (result === 0) {
                    var name = 'GWSave' + activeGameId();
                    var payload = { name: String(name), type: String('gw') };
                    send_message('write_replay', payload);
                    saveGame(name, model.lobbyId());
                }
            });
        };

        /* override default menuExit */
        model.menuExit = function() {
            if (model.closeMenu)
                model.closeMenu();

            var buttons = [
                hardcore() ? '!LOC:Abandon War' : '!LOC:Quit to Main Menu',
                '!LOC:Cancel'
            ];

            if (!hardcore())
                buttons.splice(1, 0, '!LOC:Return to Galactic War');
            model.popUp({
                buttons: buttons,
                message: '!LOC:Quit Game'
            }).then(function(result) {

                if (hardcore())
                    result++;

                switch (result) {
                    case 0: model.navToMainMenu(); break;
                    case 1: model.navToGalacticWar(); break;
                    case 2: /* do nothing */ break;
                }
            });
        };

        /* replacing observable from live_game.js */
        model.menuConfigGenerator(function() {
            var over_string = tutorial() ? '!LOC:Continue Tutorial' : '!LOC:Continue War';
            var exit_string = hardcore() ? '!LOC:Abandon War' : '!LOC:Surrender';
            // In co-op campaign end/defeat flows, only host can continue war.
            // Prefer role from latest server_state metadata, then session role.
            var gameOverClient = lastGameOverClientState || {};
            var campaignContinueContext = !!(gwCampaignEnabled() || gameOverClient.gw_campaign_active);
            var gameOverCampaignActive = campaignContinueContext && (model.gameOver() || model.isSpectator());
            var isViewer = (gameOverClient.gw_campaign_role === 'viewer') || gwCampaignRole() === 'viewer';
            var hideContinueForViewer = gameOverCampaignActive && isViewer;
            var continueAction = gameOverCampaignActive
                ? 'menuReturnToWar'
                : (model.gameOver() ? 'menuReturnToWar' : (hardcore() ? 'menuAbandonWar' : 'menuSurrender'));

            var list = [
                {
                    label: '!LOC:Pause Game',
                    action: 'menuPauseGame'
                },
                {
                    label: '!LOC:Game Stats',
                    action: 'toggleGamestatsPanel'
                },
                {
                    label: '!LOC:Player Guide',
                    action: 'menuTogglePlayerGuide'
                },
                {
                    label: '!LOC:Chrono Cam',
                    action: 'menuToggleChronoCam'
                },
                {
                    label: '!LOC:POV Camera',
                    action: 'menuTogglePOV'
                },
                {
                    label: '!LOC:Game Settings',
                    action: 'menuSettings'
                },
                
                {
                    label: '!LOC:Quit',
                    action: 'menuExit'
                }
            ];

            if (!hideContinueForViewer) {
                list.splice(6, 0, {
                    label: gameOverCampaignActive || model.gameOver() ? over_string : exit_string,
                    action: continueAction,
                    game_over: over_string
                });
            }

            if (model.canSave())
                list.splice(6, 0, {
                    label: 'Save Game ',
                    action: 'menuSaveWar'
                });

            list = _.map(list, function(entry) {
                return {
                    label: loc(entry.label),
                    action: entry.action,
                    game_over: entry.game_over && loc(entry.game_over)
                };
            });
            api.Panel.message('', 'menu_config', list);

            return list;
        });

        // by design, don't show handicaps in GW
        handlers.economy_handicaps = function() {};

        // Server tells all clients to prepare for full server process restart.
        handlers.gw_return_to_campaign_restart_prepare = function(payload) {
            console.log('[GW_COOP] gw_return_to_campaign_restart_prepare received payload=' + JSON.stringify(payload));
            var preparePayload = payload || {};
            var inferredRole = gwCampaignRole();

            // Prefer explicit per-client role from server restart_prepare payload.
            if (_.isString(preparePayload.role) && (preparePayload.role === 'host' || preparePayload.role === 'viewer')) {
                inferredRole = preparePayload.role;
            }
            // Next fallback is role captured from game_over server_state.
            else if (lastGameOverClientState && _.isString(lastGameOverClientState.gw_campaign_role)) {
                inferredRole = lastGameOverClientState.gw_campaign_role;
            }
            else if (!_.isUndefined(preparePayload.host_id)) {
                var hostId = String(preparePayload.host_id);
                var localDisplayName = displayName();
                if (_.isString(localDisplayName) && localDisplayName.length)
                    inferredRole = (String(localDisplayName) === hostId) ? 'host' : 'viewer';
                else {
                    var localUberId = uberId();
                    if (!_.isUndefined(localUberId))
                        inferredRole = (String(localUberId) === hostId) ? 'host' : 'viewer';
                }
            }

            gwCampaignRole(inferredRole);

            console.log('[GW_COOP] restart_prepare received role=' + gwCampaignRole() + ' token=' + preparePayload.restart_token + ' delay=' + preparePayload.shutdown_delay_ms + ' host=' + preparePayload.host_id + ' name=' + displayName());
            gwCampaignEnabled(true);
            gwCampaignRestartRequestInFlight = false;
            gwCampaignRestartPending(true);
            gwCampaignRestartContext(_.assign({}, buildCampaignRestartContext(), preparePayload));
            model.setMessage({
                message: loc('!LOC:Restarting campaign server... reconnecting soon.')
            });

            // Leave live_game immediately so sim shutdown cannot bounce us to
            // main menu before reconnect startup logic runs.
            _.delay(navigateForCampaignRestart, 50);
        };

        var hookTransit = function() {
            // Do not override intentional user exits (quit/main menu paths).
            if (_.isFunction(model.userTriggeredDisconnect) && model.userTriggeredDisconnect())
                return false;

            if (navigateForCampaignRestart())
                return true;

            model.transitSecondaryMessage('Returning to Galactic War');
            model.transitDestination(exitDestination());
            return false;
        };

        // oldSimTerminated and oldConnectionDisconnected handlers will trigger if the server process 
        // goes down before we can navigate away from live_game, so we need to hook them to avoid getting 
        // bounced to the main menu in that case.
        var oldSimTerminated = handlers.sim_terminated;
        handlers.sim_terminated = function(payload) {
            if (hookTransit())
                return;

            oldSimTerminated(payload);
        };

        var oldConnectionDisconnected = handlers.connection_disconnected;
        handlers.connection_disconnected = function(payload) {
            if (hookTransit())
                return;

            oldConnectionDisconnected(payload);
        };

        var oldServerState = handlers.server_state
        handlers.server_state = function(msg) {

            // Capture per-client campaign metadata from both playing and
            // game_over states so defeated clients in still-running matches can
            // still use host-only Continue War restart logic correctly.
            if (msg && msg.data && msg.data.client) {
                var clientData = msg.data.client;

                if (_.has(clientData, 'gw_campaign_active')
                        || _.has(clientData, 'gw_campaign_host_id')
                        || _.has(clientData, 'gw_campaign_settings')
                        || _.has(clientData, 'gw_campaign_access')
                        || _.has(clientData, 'gw_campaign_role')) {
                    lastGameOverClientState = _.assign({}, lastGameOverClientState || {}, clientData);
                }

                if (_.has(clientData, 'gw_campaign_active'))
                    gwCampaignEnabled(!!clientData.gw_campaign_active);

                if (_.isString(clientData.gw_campaign_role))
                    gwCampaignRole(clientData.gw_campaign_role);
            }

            if (msg.data && msg.state && msg.state === 'game_over') {

                var complete;
                if (msg.data.client) {
                    if (msg.data.client.winner)
                        complete = winGame();
                    else if (msg.data.client.loser)
                        complete = loseGame();
                }
                $.when(complete).then(function() {
                    oldServerState(msg);
                });
            }
            else
                oldServerState(msg);
        };
    }

    var oldRegister = app.registerWithCoherent;
    app.registerWithCoherent = function(model, handlers) {
        patch(model, handlers);
        oldRegister.apply(this, arguments);
    }
})();
