define([
    'shared/gw_common',
    'shared/gw_inventory',
    'pages/gw_start/gw_dealer'
], function(
    GW,
    GWInventory,
    GWDealer
) {
    var VANILLA_GW_TECH_LOADOUT = 'gwc_start_vanilla';

    var isVanillaOwner = function(owner) {
        return !!(owner && (owner.vanilla || owner.loadout === VANILLA_GW_TECH_LOADOUT));
    };

    var getPlayerTagGivenIndex = function(index) {
        if (index === 0) {
            return '.player';
        }

        return '.player' + (index - 1);
    };

    var stripKnownSpecTag = function(value) {
        if (!_.isString(value)) {
            return value;
        }

        if (value.slice(-'.player'.length) === '.player') {
            return value.slice(0, -'.player'.length);
        }

        var match = value.match(/\.player\d+$/);
        if (match) {
            return value.slice(0, -match[0].length);
        }

        if (value.slice(-'.ai'.length) === '.ai') {
            return value.slice(0, -'.ai'.length);
        }

        return value;
    };

    var normalizeCards = function(cards) {
        var result = [];

        _.forEach(cards || [], function(cardId) {
            if (_.isString(cardId) && cardId.indexOf('gwc_start') !== 0) {
                result.push(cardId);
            }
        });

        return result;
    };

    var normalizeAIPath = function(owner) {
        var aiPath = owner &&
            owner.personality &&
            _.isString(owner.personality.ai_path) &&
            owner.personality.ai_path.length &&
            owner.personality.ai_path ||
            '/pa/ai';

        if (aiPath.charAt(0) !== '/') {
            aiPath = '/' + aiPath;
        }

        if (aiPath.charAt(aiPath.length - 1) !== '/') {
            aiPath = aiPath + '/';
        }

        return aiPath;
    };

    var getFileJSON = function(path) {
        var done = $.Deferred();

        $.get('coui:/' + path).then(function(value) {
            try {
                done.resolve(_.isString(value) ? parse(value) : value);
            } catch (e) {
                done.reject(e);
            }
        }, function(reason) {
            done.reject(reason);
        });

        return done.promise();
    };

    var buildInventory = function(owner) {
        var done = $.Deferred();
        var loadout = _.isString(owner.loadout) ? owner.loadout : 'gwc_start_vehicle';

        if (isVanillaOwner(owner)) {
            var vanillaInventory = new GWInventory();
            vanillaInventory.load({
                cards: [],
                tags: {
                    global: {
                        commander: stripKnownSpecTag(owner.commander),
                        playerColor: owner.color
                    }
                }
            });
            done.resolve(vanillaInventory);
            return done.promise();
        }

        var dealInventory = new GWInventory();
        dealInventory.setTag('global', 'commander', stripKnownSpecTag(owner.commander));

        GWDealer.dealCard({
            id: loadout,
            inventory: dealInventory,
            galaxy: {
                stars: function() {
                    return _.range(0, 12);
                }
            },
            star: {
                distance: function() {
                    return 1;
                }
            }
        }).then(function(startCardProduct) {
            var inventory = new GWInventory();
            var cards = [startCardProduct || { id: loadout }];

            _.forEach(normalizeCards(owner.cards), function(cardId) {
                cards.push({ id: cardId });
            });

            inventory.load({
                cards: cards,
                tags: {
                    global: {
                        commander: stripKnownSpecTag(owner.commander),
                        playerColor: owner.color
                    }
                }
            });

            inventory.applyCards(function() {
                done.resolve(inventory);
            });
        }, function(reason) {
            done.reject(reason);
        });

        return done.promise();
    };

    var generateAIPathFilesForOwner = function(owner, tag) {
        var done = $.Deferred();
        var aiPath = normalizeAIPath(owner);

        if (aiPath === '/pa/ai/') {
            done.resolve({});
            return done.promise();
        }

        api.file.list(aiPath, true).then(function(fileList) {
            var filesToProcess = [];

            _.forEach(fileList || [], function(path) {
                if (!_.isString(path) ||
                    path.indexOf(aiPath) !== 0 ||
                    path.indexOf('/unit_maps/') >= 0 ||
                    path.indexOf('/neural_networks/') >= 0 ||
                    path.slice(-'.json'.length) !== '.json') {
                    return;
                }

                filesToProcess.push(getFileJSON(path).then(function(json) {
                    var result = {};
                    result[path] = json;
                    return result;
                }, function() {
                    return {};
                }));
            });

            if (!filesToProcess.length) {
                done.resolve({});
                return;
            }

            $.when.apply($, filesToProcess).then(function() {
                done.resolve(_.assign.apply(_, [{}].concat(Array.prototype.slice.call(arguments))));
            }, function() {
                done.resolve({});
            });
        }, function() {
            done.resolve({});
        });

        return done.promise();
    };

    var generateAIUnitMapFilesForOwner = function(owner, tag) {
        var done = $.Deferred();
        var titans = api.content.usingTitans();
        var aiPath = normalizeAIPath(owner);
        var defaultMapPaths = ['/pa/ai/unit_maps/ai_unit_map.json'];

        if (titans) {
            defaultMapPaths.push('/pa/ai/unit_maps/ai_unit_map_x1.json');
        }

        var fallbackMapPathsForAIPath = function() {
            var result = [{
                source: '/pa/ai/unit_maps/ai_unit_map.json',
                destination: aiPath + 'unit_maps/ai_unit_map.json'
            }];

            if (titans) {
                result.push({
                    source: '/pa/ai/unit_maps/ai_unit_map_x1.json',
                    destination: aiPath + 'unit_maps/ai_unit_map_x1.json'
                });
            }

            return result;
        };

        var buildFilesFromMapPaths = function(mapPaths) {
            var filesToProcess = [];

            _.forEach(mapPaths || [], function(mapPath) {
                var path = _.isString(mapPath) ? mapPath : mapPath && mapPath.source;
                var destination = _.isString(mapPath) ? mapPath : mapPath && mapPath.destination;

                if (!_.isString(path) ||
                    !_.isString(destination) ||
                    path.indexOf('/unit_maps/') < 0 ||
                    path.slice(-'.json'.length) !== '.json') {
                    return;
                }

                if (!titans && path.slice(-'_x1.json'.length) === '_x1.json') {
                    return;
                }

                filesToProcess.push(getFileJSON(path).then(function(aiUnitMap) {
                    var result = {};
                    result[destination + tag] = GW.specs.genAIUnitMap(aiUnitMap, tag);
                    return result;
                }, function() {
                    return {};
                }));
            });

            if (!filesToProcess.length) {
                done.resolve({});
                return;
            }

            $.when.apply($, filesToProcess).then(function() {
                done.resolve(_.assign.apply(_, [{}].concat(Array.prototype.slice.call(arguments))));
            }, function() {
                done.resolve({});
            });
        };

        if (aiPath === '/pa/ai/') {
            buildFilesFromMapPaths(defaultMapPaths);
            return done.promise();
        }

        api.file.list(aiPath + 'unit_maps/', true).then(function(fileList) {
            var mapPaths = _.filter(fileList || [], function(path) {
                return _.isString(path) && path.slice(-'.json'.length) === '.json';
            });

            if (!mapPaths.length) {
                mapPaths = fallbackMapPathsForAIPath();
            }

            buildFilesFromMapPaths(mapPaths);
        }, function() {
            buildFilesFromMapPaths(fallbackMapPathsForAIPath());
        });

        return done.promise();
    };

    var generateUnitSpecsForOwner = function(inventory, tag, owner) {
        var done = $.Deferred();

        $.when(
            generateAIUnitMapFilesForOwner(owner, tag),
            generateAIPathFilesForOwner(owner, tag)
        ).then(function(aiUnitMapFiles, aiPathFiles) {
            GW.specs.genUnitSpecs(inventory.units(), tag).then(function(playerSpecFiles) {
                var playerFiles = _.assign({}, aiPathFiles || {}, aiUnitMapFiles || {}, playerSpecFiles);
                GW.specs.modSpecs(playerFiles, inventory.mods(), tag);
                done.resolve(playerFiles);
            }, function(reason) {
                done.reject(reason);
            });
        }, function(reason) {
            done.reject(reason);
        });

        return done.promise();
    };

    var buildUntaggedUnitListFromFiles = function(files, baseUnits) {
        var units = _.isArray(baseUnits) ? baseUnits.slice(0) : [];

        _.forEach(files || {}, function(value, path) {
            if (!_.isString(path) || path.indexOf('/pa/units/unit_list.json') !== 0 || path === '/pa/units/unit_list.json') {
                return;
            }

            var unitList = value;
            if (_.isString(unitList)) {
                try {
                    unitList = parse(unitList);
                } catch (e) {
                    unitList = undefined;
                }
            }

            if (unitList && _.isArray(unitList.units)) {
                units = units.concat(unitList.units);
            }
        });

        return { units: _.uniq(units) };
    };

    var cook = function(owners) {
        var done = $.Deferred();
        var ownerList = _.filter(owners || [], function(owner) {
            return owner && _.isString(owner.commander) && _.isArray(owner.color);
        });

        if (!ownerList.length) {
            done.reject('No custom lobby tech owners to cook.');
            return done.promise();
        }

        var ownerPromises = [];
        var taggedOwnerCount = 0;
        var hasVanillaOwner = false;

        _.forEach(ownerList, function(owner, index) {
            var vanilla = isVanillaOwner(owner);
            var tag = '';

            if (vanilla) {
                hasVanillaOwner = true;
            }
            else {
                tag = getPlayerTagGivenIndex(taggedOwnerCount);
                ++taggedOwnerCount;
            }

            ownerPromises.push(buildInventory(owner).then(function(inventory) {
                if (vanilla) {
                    var baseCommander = stripKnownSpecTag(owner.commander);
                    return {
                        files: {},
                        assignment: _.assign({}, owner, {
                            tag: '',
                            commander: baseCommander,
                            inventory_mods: [],
                            minion_armies: []
                        })
                    };
                }

                return generateUnitSpecsForOwner(inventory, tag, owner).then(function(files) {
                    var baseCommander = stripKnownSpecTag(owner.commander);
                    var minionArmies = [];

                    _.forEach(inventory.minions(), function(minion) {
                        minionArmies.push({
                            slots: [{
                                ai: true,
                                name: minion.name || 'Helper',
                                commander: stripKnownSpecTag(minion.commander || baseCommander) + tag
                            }],
                            color: minion.color || owner.color,
                            econ_rate: minion.econ_rate || 1,
                            personality: minion.personality,
                            spec_tag: tag
                        });
                    });

                    return {
                        files: files,
                        assignment: _.assign({}, owner, {
                            tag: tag,
                            commander: baseCommander + tag,
                            inventory_mods: _.cloneDeep(inventory.mods()),
                            minion_armies: minionArmies
                        })
                    };
                });
            }));
        });

        $.when.apply($, ownerPromises).then(function() {
            var cookedOwners = Array.prototype.slice.call(arguments);
            var files = {};
            var assignments = [];

            _.forEach(cookedOwners, function(cookedOwner) {
                _.assign(files, cookedOwner.files || {});
                assignments.push(cookedOwner.assignment);
            });

            var finish = function(baseUnits) {
                files['/pa/units/unit_list.json'] = buildUntaggedUnitListFromFiles(files, baseUnits);

                done.resolve({
                    files: files,
                    tag_assignments: assignments
                });
            };

            if (hasVanillaOwner) {
                getFileJSON('/pa/units/unit_list.json').then(function(unitList) {
                    finish(unitList && _.isArray(unitList.units) ? unitList.units : []);
                }, function() {
                    finish([]);
                });
            }
            else {
                finish([]);
            }
        }, function(reason) {
            done.reject(reason);
        });

        return done.promise();
    };

    return {
        cook: cook
    };
});
