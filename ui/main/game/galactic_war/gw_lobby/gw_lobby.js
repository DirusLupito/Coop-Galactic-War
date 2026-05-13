// !LOCNS:galactic_war
var model;

$(document).ready(function() {

    // The server control payload decides whether this GW lobby is campaign co-op or solo GW.
    var gwCoopMode = ko.observable(false).extend({ session: 'gw_coop_mode' });
    var gwCampaignUnitSpecTag = ko.observable('.player').extend({ session: 'gw_campaign_unit_spec_tag' });
    var GW_CONFIG_REQUEST_INTERVAL_MS = 1000;
    var GW_CONFIG_MAX_RETRIES = 120;

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

    // In theory this should always be the same, as I see no reason why we'd
    // ever want to change where we pull the unit list from, but in case we do,
    // we need to update this file and this variable together. 
    // ... and probably a billion other things if we ever do something that hair-brained... 
    var UNIT_LIST_PATH = '/pa/units/unit_list.json';

    var parseFileValue = function(value) {
        if (!_.isString(value))
            return value;

        try {
            return parse(value);
        } catch (e) {
            return undefined;
        }
    };

    // Basic idea/what I realized when making this bugfix:
    // We don't actually just have .player or .ai tagged units, 
    // mods can actually create any and all sorts of tagged unit lists, and we want to support them all in the local overlay.
    // So we need to discover all tagged unit lists, parse them, merge them into a single untagged list for the game, 
    // and then regenerate tagged spec files for the local skin mod/effects/ whatever overlay based on the discovered tags.

    var stripUnitTag = function(unit, tag) {
        if (!_.isString(unit) || !tag || unit.slice(-tag.length) !== tag)
            return unit;

        return unit.slice(0, -tag.length);
    };

    var discoverTaggedUnitLists = function(files) {
        var taggedLists = [];

        _.forEach(files || {}, function(value, path) {
            if (!_.isString(path) || path.indexOf(UNIT_LIST_PATH) !== 0)
                return;

            var tag = path.slice(UNIT_LIST_PATH.length);
            if (!tag)
                return;

            var unitList = parseFileValue(value);
            if (!unitList || !_.isArray(unitList.units))
                return;

            taggedLists.push({
                path: path,
                tag: tag,
                units: _.map(unitList.units, function(unit) {
                    return stripUnitTag(unit, tag);
                })
            });
        });

        return taggedLists;
    };

    var findTaggedUnitList = function(taggedUnitLists, tag) {
        var found;

        _.forEach(taggedUnitLists || [], function(taggedList) {
            if (!found && taggedList && taggedList.tag === tag)
                found = taggedList;
        });

        return found;
    };

    var isPerPlayerTechTag = function(tag) {
        return _.isString(tag) && /^\.player\d+$/.test(tag);
    };

    var summarizeTaggedUnitLists = function(taggedUnitLists) {
        return _.map(taggedUnitLists || [], function(taggedList) {
            return {
                tag: taggedList.tag,
                units: taggedList.units.length
            };
        });
    };

    var buildUntaggedUnitListFromTaggedFiles = function(files) {
        var units = [];

        _.forEach(discoverTaggedUnitLists(files), function(taggedList) {
            var unitList = parseFileValue(files[taggedList.path]);
            if (unitList && _.isArray(unitList.units))
                units = units.concat(unitList.units);
        });

        return { units: _.uniq(units) };
    };

    var buildLocalClientOverlayFiles = function(sharedFiles, perPlayerTechTagAssignments) {
        var done = $.Deferred();
        var taggedUnitLists = discoverTaggedUnitLists(sharedFiles);

        var generateTaggedFiles = function(GW, units, tag) {
            var tagDone = $.Deferred();

            if (!tag || !_.isArray(units)) {
                tagDone.resolve({});
                return tagDone.promise();
            }

            GW.specs.genUnitSpecs(units, tag).then(function(specFiles) {
                tagDone.resolve(specFiles || {});
            }, function() {
                tagDone.resolve({});
            });

            return tagDone.promise();
        };

        var getInventoryMods = function(inventory) {
            if (inventory && _.isFunction(inventory.mods)) {
                return inventory.mods();
            }

            return inventory && inventory.mods;
        };

        var getPerPlayerTechTagAssignment = function(tag) {
            var matches = _.filter(perPlayerTechTagAssignments || [], function(assignment) {
                return assignment && assignment.tag === tag;
            });

            if (matches.length !== 1) {
                console.log('[GW COOP] gw_lobby cannot regenerate local overlay for ' + tag + '; expected one tag assignment, found ' + matches.length + '.');
                return undefined;
            }

            return matches[0];
        };

        console.log('[GW COOP] gw_lobby discovered local overlay unit tags ' + JSON.stringify(summarizeTaggedUnitLists(taggedUnitLists)));

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

                    var filesToProcess = [];

                    var generateInventoryOverlayFiles = function(units, mods, tag) {
                        var overlayDone = $.Deferred();

                        if (!_.isString(tag) || !tag.length || !_.isArray(units) || !_.isArray(mods)) {
                            overlayDone.resolve({});
                            return overlayDone.promise();
                        }

                        var playerAIUnitMap = GW.specs.genAIUnitMap(aiUnitMap, tag);
                        var playerX1AIUnitMap = titans ? GW.specs.genAIUnitMap(aiX1UnitMap, tag) : {};

                        generateTaggedFiles(GW, units, tag).then(function(playerSpecFiles) {
                            var playerFilesClassic = {};
                            var playerFilesX1 = {};

                            playerFilesClassic['/pa/ai/unit_maps/ai_unit_map.json' + tag] = playerAIUnitMap;
                            if (titans) {
                                playerFilesX1['/pa/ai/unit_maps/ai_unit_map_x1.json' + tag] = playerX1AIUnitMap;
                            }

                            var playerFiles = _.assign({}, playerFilesClassic, playerFilesX1, playerSpecFiles);

                            try {
                                GW.specs.modSpecs(playerFiles, mods, tag);
                            } catch (e) {
                                var errorText = e && (e.stack || e.message || e.toString && e.toString());
                                console.log('[GW COOP] gw_lobby local overlay modSpecs failed tag=' + tag
                                    + ' error=' + (errorText || JSON.stringify(e))
                                    + ' modCount=' + mods.length
                                    + ' playerFileCount=' + _.keys(playerFiles).length
                                    + ' mods=' + JSON.stringify(mods));
                                overlayDone.resolve(playerFiles);
                                return;
                            }

                            overlayDone.resolve(playerFiles);
                        }, function() {
                            overlayDone.resolve({});
                        });

                        return overlayDone.promise();
                    };

                    _.forEach(taggedUnitLists, function(taggedList) {
                        if (taggedList.tag === '.player') {
                            return;
                        }
                        if (isPerPlayerTechTag(taggedList.tag)) {
                            return;
                        }

                        filesToProcess.push(generateTaggedFiles(GW, taggedList.units, taggedList.tag));
                    });

                    var sharedPlayerUnitList = findTaggedUnitList(taggedUnitLists, '.player');
                    var playerUnits = sharedPlayerUnitList ? sharedPlayerUnitList.units : inventory.units();
                    filesToProcess.push(generateInventoryOverlayFiles(playerUnits, inventory.mods(), '.player'));

                    _.forEach(taggedUnitLists, function(taggedList) {
                        if (!isPerPlayerTechTag(taggedList.tag)) {
                            return;
                        }

                        var tagAssignment = getPerPlayerTechTagAssignment(taggedList.tag);
                        if (!tagAssignment) {
                            return;
                        }

                        if (!_.isFunction(game.findCoopPlayerInventoryData)) {
                            console.log('[GW COOP] gw_lobby cannot regenerate local overlay for ' + taggedList.tag + '; game has no inventory lookup.');
                            return;
                        }

                        var record = game.findCoopPlayerInventoryData({
                            id: tagAssignment.client_id,
                            name: tagAssignment.client_name
                        });

                        if (!record || !record.inventory) {
                            console.log('[GW COOP] gw_lobby cannot regenerate local overlay for ' + taggedList.tag + '; missing inventory data for ' + tagAssignment.client_name + '.');
                            return;
                        }

                        var recordMods = getInventoryMods(record.inventory);
                        if (!_.isArray(recordMods)) {
                            console.log('[GW COOP] gw_lobby cannot regenerate local overlay for ' + taggedList.tag + '; invalid inventory mods for ' + tagAssignment.client_name + '.');
                            return;
                        }

                        console.log('[GW COOP] gw_lobby generating local per-player overlay for tag ' + taggedList.tag);
                        filesToProcess.push(generateInventoryOverlayFiles(taggedList.units, recordMods, taggedList.tag));
                    });

                    $.when.apply($, filesToProcess).then(function() {
                        var localFiles = _.assign.apply(_, [{}].concat(Array.prototype.slice.call(arguments)));
                        console.log('[GW COOP] gw_lobby local overlay files generated count=' + _.keys(localFiles).length);
                        done.resolve(localFiles);
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
        var nextGwCoopMode = !!(control && control.gw_campaign_active);
        if (gwCoopMode() !== nextGwCoopMode) {
            gwCoopMode(nextGwCoopMode);
            console.log('[GW COOP] gw_lobby persisted gw_coop_mode=' + gwCoopMode());
        }

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

        if (!payload.files[UNIT_LIST_PATH])
            payload.files[UNIT_LIST_PATH] = buildUntaggedUnitListFromTaggedFiles(payload.files);

        buildLocalClientOverlayFiles(payload.files, payload.per_player_tech_tag_assignments).always(function(localOverlayFiles) {
            var mergedFiles = _.assign({}, payload.files, _.isObject(localOverlayFiles) ? localOverlayFiles : {});
            console.log('[GW COOP] gw_lobby merging local overlay files', localOverlayFiles, mergedFiles);

            var cookedFiles = _.mapValues(mergedFiles, function(value) {
                if (typeof value !== 'string')
                    return JSON.stringify(value);
                return value;
            });

            var unitSpecTag = (_.isString(payload.unit_spec_tag) && payload.unit_spec_tag.length)
                ? payload.unit_spec_tag
                : '.player';
            gwCampaignUnitSpecTag(unitSpecTag);

            // Do not globally unmount memory files here. Community mod hooks on
            // unmountAllMemoryFiles can trigger broad remount activity and race
            // with GW lobby startup on some machines.
            api.file.mountMemoryFiles(cookedFiles).then(function() {
                model.gwConfigMounted(true);
                model.gwConfigMountInProgress = false;
                console.log('[GW COOP] gw_lobby applying unit spec tag=' + unitSpecTag);
                api.game.setUnitSpecTag(unitSpecTag);
                model.send_message('gw_config_ready', {});
            }, function() {
                model.gwConfigMountInProgress = false;
                console.error('[GW COOP] gw_lobby failed to mount GW config memory files.');
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

    var failGWConfigRequest = function(reason) {
        var transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
        var transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
        var transitDestination = ko.observable().extend({ session: 'transit_destination' });
        var transitDelay = ko.observable().extend({ session: 'transit_delay' });

        console.error('[GW COOP] gw_lobby failed to mount GW config after ' + GW_CONFIG_MAX_RETRIES + ' retries reason=' + reason);
        transitPrimaryMessage(loc('!LOC:FAILED TO LOAD GALACTIC WAR CONFIG'));
        transitSecondaryMessage(loc('!LOC:Returning to Galactic War'));
        transitDestination(model.lastSceneUrl() || 'coui://ui/main/game/galactic_war/gw_play/gw_play.html');
        transitDelay(5000);
        window.location.href = 'coui://ui/main/game/transit/transit.html';
    };

    // Browser-join clients may enter this scene after the server first sent gw_config.
    // Explicitly request the GW config and keep trying briefly until mounted.
    var gwConfigRetryCount = 0;
    var requestGWConfig = function() {
        if (model.gwConfigMounted()) {
            return;
        }

        if (gwConfigRetryCount >= GW_CONFIG_MAX_RETRIES) {
            failGWConfigRequest(model.gwConfigMountInProgress ? 'mount_in_progress' : 'not_mounted');
            return;
        }

        gwConfigRetryCount++;

        if (!model.gwConfigMountInProgress) {
            model.send_message('request_gw_config', {}, function(success, response) {
                if (!success) {
                    console.error('[GW COOP] gw_lobby request_gw_config failed retry=' + gwConfigRetryCount + ' response=' + JSON.stringify(response || {}));
                }
            });
        }

        setTimeout(requestGWConfig, GW_CONFIG_REQUEST_INTERVAL_MS);
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
