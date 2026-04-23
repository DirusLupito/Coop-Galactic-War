// !LOCNS:galactic_war
var model;

$(document).ready(function() {

    // Mark this client session as running through GW coop lobby flow.
    ko.observable(true).extend({ session: 'gw_coop_mode' });

    var normalizeModIdentifier = function(identifier) {
        if (!_.isString(identifier))
            return '';

        var trimmed = identifier.trim();
        if (!trimmed.length)
            return '';

        return trimmed.toLowerCase();
    };

    var extractRejectReason = function(payload) {
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
    };

    function GWLobbyViewModel() {
        var self = this;

        self.serverLoading = ko.observable(true);
        self.clientLoading = ko.observable(true);
        self.devMode = ko.observable().extend({ session: 'dev_mode' });
        self.gwConfigMounted = ko.observable(false);
        self.gwConfigMountInProgress = false;
        self.ready = ko.computed(function() {
            return !self.clientLoading() && !self.serverLoading();
        })
        self.ready.subscribe(function() { self.updateReadyState(); });

        self.gameSystemReadyInfo = ko.observable('');
        self.gameSystemReady = ko.computed(function() {
            var result = self.serverLoading() || self.clientLoading();
            if (result)
                self.gameSystemReadyInfo('Planets are building');
            else
                self.gameSystemReadyInfo('');
            return !result;
        });

        self.gameIsNotOkInfo = ko.computed(function() {
            return self.gameSystemReadyInfo();
        });
        self.gameIsNotOk = ko.computed(function() { return !self.gameSystemReady(); });

        // TODO: Remove when planets are generated using the new schema
        self.fixupPlanetConfig = function(system) {

            var planets = system.planets || [];
            for (var p = 0; p < planets.length; ++p)
            {
                var planet = planets[p];
                if (planet.hasOwnProperty('position_x'))
                {
                    planet.position = [planet.position_x, planet.position_y];
                    delete planet.position_x;
                    delete planet.position_y;
                }
                if (planet.hasOwnProperty('velocity_x'))
                {
                    planet.velocity = [planet.velocity_x, planet.velocity_y];
                    delete planet.velocity_x;
                    delete planet.velocity_y;
                }
                if (planet.hasOwnProperty('planet'))
                {
                    planet.generator = planet.planet;
                    delete planet.planet;
                }
            }
            return system;
        }

        self.config = ko.observable('').extend({ memory: 'gw_battle_config' });

        self.lastSceneUrl = ko.observable().extend({ session: 'last_scene_url' });

        self.navBack = function() {
            if (self.lastSceneUrl())
                window.location.href = self.lastSceneUrl();
        };

        self.updateReadyState = function() {
            if (self.ready())
                self.send_message('set_ready', {ready: true});
        };
        self.updateReadyState();

        var $loadingPage = $('#building_planets');
        var baseLoadingUrl = $loadingPage.attr('src');
        var loadingMessages = [
            '!LOC:APPROACHING STAR SYSTEM',
            '!LOC:PREPARE FOR LANDING',
            '!LOC:CONFIGURING LANDING ZONE',
            '!LOC:CALCULATING APPROACH VECTOR'
        ];
        var newLoadingUrl = baseLoadingUrl + '?message=' + encodeURIComponent(_.sample(loadingMessages));
        $loadingPage.attr('src', newLoadingUrl);
    }
    model = new GWLobbyViewModel();

    handlers = {};

    var sendClientModManifestFromScene = function(sceneName) {
        console.log('[GW COOP] sending client mod manifest from ' + sceneName);
        api.mods.getMounted('client', true).then(function(mountedMods) {
            var activeIdentifiers = [];
            var seen = {};

            _.forEach(mountedMods || [], function(mod) {
                var identifier = normalizeModIdentifier(mod && mod.identifier);
                if (!identifier || seen[identifier])
                    return;

                seen[identifier] = true;
                activeIdentifiers.push(identifier);
            });

            model.send_message('client_mod_manifest', {
                active_identifiers: activeIdentifiers
            }, function(success, response) {
                var rejectReason = extractRejectReason(response);
                console.log('[GW COOP] client_mod_manifest from ' + sceneName
                    + ' success=' + !!success
                    + ' active=' + JSON.stringify(activeIdentifiers)
                    + ' response=' + JSON.stringify(response || {}));

                if (_.isString(rejectReason) && rejectReason.indexOf('Missing required mods') === 0 && _.isFunction(model.disconnect))
                    model.disconnect();
            });
        }, function() {
            console.log('[GW COOP] getMounted(client,true) failed in ' + sceneName + '; sending empty manifest');
            model.send_message('client_mod_manifest', {
                active_identifiers: []
            }, function(success, response) {
                var rejectReason = extractRejectReason(response);
                console.log('[GW COOP] empty client_mod_manifest from ' + sceneName
                    + ' success=' + !!success
                    + ' response=' + JSON.stringify(response || {}));

                if (_.isString(rejectReason) && rejectReason.indexOf('Missing required mods') === 0 && _.isFunction(model.disconnect))
                    model.disconnect();
            });
        });
    };

    var buildLocalClientOverlayFiles = function() {
        var done = $.Deferred();

        var gameId = ko.observable().extend({ local: 'gw_active_game' })();
        if (!gameId) {
            done.resolve({});
            return done.promise();
        }

        var moduleLoader = _.isFunction(window.requireGW) ? window.requireGW : require;
        moduleLoader(['shared/gw_common'], function(GW) {
            if (!GW || !GW.manifest || !_.isFunction(GW.manifest.loadGame) || !GW.specs) {
                done.resolve({});
                return;
            }

            GW.manifest.loadGame(gameId).then(function(game) {
                if (!game) {
                    done.resolve({});
                    return;
                }

                var inventory = _.isFunction(game.inventory) ? game.inventory() : undefined;
                if (!inventory || !_.isFunction(inventory.units) || !_.isFunction(inventory.mods)) {
                    done.resolve({});
                    return;
                }

                var titans = api.content.usingTitans();
                var aiMapLoad = $.get('spec://pa/ai/unit_maps/ai_unit_map.json');
                var aiX1MapLoad = titans ? $.get('spec://pa/ai/unit_maps/ai_unit_map_x1.json') : $.Deferred().resolve([{}]);

                $.when(aiMapLoad, aiX1MapLoad).then(function(aiMapGet, aiX1MapGet) {
                    var aiUnitMap = parse(aiMapGet[0]);
                    var aiX1UnitMap = parse(aiX1MapGet[0]);
                    var playerAIUnitMap = GW.specs.genAIUnitMap(aiUnitMap, '.player');
                    var playerX1AIUnitMap = titans ? GW.specs.genAIUnitMap(aiX1UnitMap, '.player') : {};

                    GW.specs.genUnitSpecs(inventory.units(), '.player').then(function(playerSpecFiles) {
                        var playerFilesClassic = _.assign({ '/pa/ai/unit_maps/ai_unit_map.json.player': playerAIUnitMap }, playerSpecFiles);
                        var playerFilesX1 = titans ? _.assign({ '/pa/ai/unit_maps/ai_unit_map_x1.json.player': playerX1AIUnitMap }, playerSpecFiles) : {};
                        var playerFiles = _.assign({}, playerFilesClassic, playerFilesX1);

                        try {
                            GW.specs.modSpecs(playerFiles, inventory.mods(), '.player');
                        } catch (e) {
                            console.log('[GW_COOP] gw_lobby local overlay modSpecs failed', e);
                            done.resolve({});
                            return;
                        }
                        console.log('[GW_COOP] gw_lobby local overlay files generated', playerFiles);

                        done.resolve(playerFiles);
                    }, function() {
                        done.resolve({});
                    });
                }, function() {
                    done.resolve({});
                });
            }, function() {
                done.resolve({});
            });
        }, function() {
            done.resolve({});
        });

        return done.promise();
    };

    handlers.control = function(control) {
        model.serverLoading(!control.sim_ready);
        if (!control.has_config) {
            var config = model.config();
            if (config && typeof config === 'object') {
                config.sandbox = !!model.devMode();
                model.send_message('set_config', config);
            }
        }
    };

    handlers.gw_config = function(payload) {
        if (!payload || !payload.files)
            return;

        if (model.gwConfigMounted() || model.gwConfigMountInProgress)
            return;

        model.gwConfigMountInProgress = true;

        if (!payload.files['/pa/units/unit_list.json']) {
            var playerUnitList = payload.files['/pa/units/unit_list.json.player'];
            var aiUnitList = payload.files['/pa/units/unit_list.json.ai'];
            var units = (playerUnitList && playerUnitList.units || []).concat(aiUnitList && aiUnitList.units || []);
            payload.files['/pa/units/unit_list.json'] = { units: units };
        }

        buildLocalClientOverlayFiles().always(function(localOverlayFiles) {
            var mergedFiles = _.assign({}, payload.files, _.isObject(localOverlayFiles) ? localOverlayFiles : {});
            console.log('[GW_COOP] gw_lobby merging local overlay files', localOverlayFiles, mergedFiles);

            var cookedFiles = _.mapValues(mergedFiles, function(value) {
                if (typeof value !== 'string')
                    return JSON.stringify(value);
                return value;
            });

            // Do not globally unmount memory files here. Community mod hooks on
            // unmountAllMemoryFiles can trigger broad remount activity and race
            // with GW lobby startup on some machines.
            api.file.mountMemoryFiles(cookedFiles).then(function() {
                model.gwConfigMounted(true);
                model.gwConfigMountInProgress = false;
                api.game.setUnitSpecTag('.player');
                model.send_message('gw_config_ready', {});
            }, function() {
                model.gwConfigMountInProgress = false;
            });
        });
    };

    handlers.server_state = function(payload) {
        if (payload.url && payload.url !== window.location.href) {
            window.location.href = payload.url;
            return;
        }

        // Accept either a broadcast-style `data.control` or a per-client `data.client.control`.
        var control = null;
        if (payload && payload.data) {
            if (payload.data.control)
                control = payload.data.control;
            else if (payload.data.client && payload.data.client.control)
                control = payload.data.client.control;
        }
        
        if (control)
            handlers.control(control);
        else
            console.log('gw_lobby: server_state missing control payload', payload);
    };

    handlers.request_client_mod_manifest = function() {
        sendClientModManifestFromScene('gw_lobby');
    };

    handlers.required_client_mods_missing = function(payload) {
        var rejectReason = extractRejectReason(payload);
        console.log('[GW COOP] required_client_mods_missing in gw_lobby reason=' + rejectReason + ' payload=' + JSON.stringify(payload || {}));

        if (_.isFunction(model.disconnect))
            model.disconnect();
    };

    handlers.all_client_mods_match = function(payload) {
        console.log('[GW COOP] all_client_mods_match in gw_lobby payload=' + JSON.stringify(payload || {}));
    };

    handlers.connection_disconnected = function(payload) {
        var transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
        var transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
        var transitDestination = ko.observable().extend({ session: 'transit_destination' });
        var transitDelay = ko.observable().extend({ session: 'transit_delay' });

        transitPrimaryMessage(loc('!LOC:CONNECTION TO SERVER LOST'));
        transitSecondaryMessage('');
        transitDestination(model.lastSceneUrl());
        transitDelay(5000);
        window.location.href = 'coui://ui/main/game/transit/transit.html';
    }

    // inject per scene mods
    if (scene_mod_list['gw_lobby'])
        loadMods(scene_mod_list['gw_lobby']);

    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    app.hello(handlers.server_state, handlers.connection_disconnected);

    // Browser-join clients may enter this scene after the server first sent gw_config.
    // Explicitly request the GW config and keep trying briefly until mounted.
    var requestGWConfig = function() {
        if (!model.gwConfigMounted()) {
            model.send_message('request_gw_config', {});
            setTimeout(requestGWConfig, 1000);
        }
    };
    requestGWConfig();

    var testLoading = function() {
        var worldView = api.getWorldView(0);
        if (worldView) {
            worldView.arePlanetsReady().then(function(ready) {
                model.clientLoading(!ready);
                setTimeout(testLoading, 500);
            });
        }
        else
            setTimeout(testLoading, 500);
    };
    setTimeout(testLoading, 500);
});
