var model;
var handlers = {};

$(document).ready(function () {

    var gwReconnectTarget = $.url().param('target') || 'coui://ui/main/game/live_game/live_game.html';
    var gwReconnectFilesRequested = false;
    var gwReconnectFilesReady = false;

    function requestReconnectMemoryFiles(reason) {
        if (gwReconnectFilesRequested)
            return;

        gwReconnectFilesRequested = true;

        model.send_message('request_memory_files', {
            reason: reason,
            reconnect_to_game_info: model.reconnectToGameInfo && model.reconnectToGameInfo()
        }, function (success, response) {
            if (!success || !(response && response.sent)) {
                gwReconnectFilesRequested = false;
            }
        });
    }

    function GwReconnectLoadingViewModel() {
        var self = this;
        self.gwConfigMounted = ko.observable(false);
        self.gwConfigMountInProgress = false;

        self.reconnectToGameInfo = ko.observable().extend({ local: 'reconnect_to_game_info' });
        self.pageSubTitle = ko.observable(loc('!LOC:Connecting to server...'));

        self.navToMainMenu = function () {
            var transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
            var transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
            var transitDestination = ko.observable().extend({ session: 'transit_destination' });
            var transitDelay = ko.observable().extend({ session: 'transit_delay' });

            self.reconnectToGameInfo(undefined);
            transitPrimaryMessage(loc('!LOC:Returning to Main Menu'));
            transitSecondaryMessage('');
            transitDestination('coui://ui/main/game/start/start.html');
            transitDelay(0);
            window.location.href = 'coui://ui/main/game/transit/transit.html';
            return;
        };
    }
    model = new GwReconnectLoadingViewModel();

    handlers.login_rejected = function () {
        console.error('GW reconnect login rejected');
        model.navToMainMenu();
    };

    handlers.connection_disconnected = function () {
        console.error('GW reconnect disconnected');
        model.navToMainMenu();
    };

    handlers.server_state = function (msg) {
        var serverGameType = msg
            && msg.data
            && msg.data.client
            && msg.data.client.game_options
            && msg.data.client.game_options.game_type;

        if (msg && msg.url === gwReconnectTarget && serverGameType === 'Galactic War' && !gwReconnectFilesReady) {
            model.pageSubTitle(loc('!LOC:Restoring Galactic War unit specs...'));
            requestReconnectMemoryFiles('gw_reconnect_server_state');
            return;
        }

        if (msg && msg.url && msg.url !== window.location.href) {
            window.location.href = msg.url;
            return;
        }
    };

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

    var buildLocalClientOverlayFiles = function(sharedFiles) {
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

        console.log('[GW_COOP] gw_reconnect_loading discovered local overlay unit tags ' + JSON.stringify(summarizeTaggedUnitLists(taggedUnitLists)));

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

                    var filesToProcess = [];

                    var playerFileGen = $.Deferred();
                    filesToProcess.push(playerFileGen);

                    _.forEach(taggedUnitLists, function(taggedList) {
                        if (taggedList.tag === '.player')
                            return;

                        filesToProcess.push(generateTaggedFiles(GW, taggedList.units, taggedList.tag));
                    });

                    var sharedPlayerUnitList = findTaggedUnitList(taggedUnitLists, '.player');
                    var playerUnits = sharedPlayerUnitList ? sharedPlayerUnitList.units : inventory.units();

                    generateTaggedFiles(GW, playerUnits, '.player').then(function(playerSpecFiles) {
                        var playerFilesClassic = _.assign({ '/pa/ai/unit_maps/ai_unit_map.json.player': playerAIUnitMap }, playerSpecFiles);
                        var playerFilesX1 = titans ? _.assign({ '/pa/ai/unit_maps/ai_unit_map_x1.json.player': playerX1AIUnitMap }, playerSpecFiles) : {};
                        var playerFiles = _.assign({}, playerFilesClassic, playerFilesX1);

                        try {
                            GW.specs.modSpecs(playerFiles, inventory.mods(), '.player');
                        } catch (e) {
                            var errorText = e && (e.stack || e.message || e.toString && e.toString());
                            console.log('[GW_COOP] gw_reconnect_loading local overlay modSpecs failed error=' + (errorText || JSON.stringify(e))
                                + ' modCount=' + inventory.mods().length
                                + ' playerFileCount=' + _.keys(playerFiles).length
                                + ' mods=' + JSON.stringify(inventory.mods()));
                            playerFileGen.resolve(playerFiles);
                            return;
                        }
                        playerFileGen.resolve(playerFiles);
                    }, function() {
                        playerFileGen.resolve({});
                    });

                    $.when.apply($, filesToProcess).then(function() {
                        var localFiles = _.assign.apply(_, [{}].concat(Array.prototype.slice.call(arguments)));
                        console.log('[GW_COOP] gw_reconnect_loading local overlay files generated count=' + _.keys(localFiles).length);
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

    handlers.memory_files = function (msg) {
        if (!msg)
            return;

        if (model.gwConfigMounted() || model.gwConfigMountInProgress)
            return;

        model.gwConfigMountInProgress = true;
        if (!msg[UNIT_LIST_PATH]) {
            msg[UNIT_LIST_PATH] = buildUntaggedUnitListFromTaggedFiles(msg);
        }

        buildLocalClientOverlayFiles(msg).always(function(localOverlayFiles) {
            var mergedFiles = _.assign({}, msg, _.isObject(localOverlayFiles) ? localOverlayFiles : {});
            console.log('[GW_COOP] gw_reconnect_loading merging local overlay files, total count=' + _.keys(mergedFiles).length);

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
                engine.call('request_spec_data', -1);
                gwReconnectFilesReady = true;
                model.pageSubTitle(loc('!LOC:Entering game...'));
                model.send_message('memory_files_received', {}, function(success, response) {
                    window.location.href = gwReconnectTarget;
                });
            }, function() {
                model.gwConfigMountInProgress = false;
            });
        });
    };

    if (window.CommunityMods) {
        try {
            CommunityMods();
        } catch (e) {
            console.error(e);
        }
    }

    loadSceneMods('gw_reconnect_loading');
    app.registerWithCoherent(model, handlers);
    ko.applyBindings(model);
    app.hello(handlers.server_state, handlers.connection_disconnected);
});
