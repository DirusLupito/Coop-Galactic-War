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
    var GWO_CARDS_GRANTING_ADVANCED_TECH = [
        'gwc_enable_air_all',
        'gwc_enable_bots_all',
        'gwc_enable_sea_all',
        'gwc_enable_vehicles_all',
        'gwaio_upgrade_fabricationaircraft',
        'gwaio_upgrade_fabricationbot',
        'gwaio_upgrade_fabricationship',
        'gwaio_upgrade_fabricationvehicle',
        'gwaio_start_hoarder'
    ];

    var isVanillaOwner = function(owner) {
        return !!(owner && (owner.vanilla || owner.loadout === VANILLA_GW_TECH_LOADOUT));
    };

    var getOwnerCommanders = function(owner) {
        var commanders = [];

        if (owner && _.isString(owner.commander)) {
            commanders.push(owner.commander);
        }
        if (owner && _.isArray(owner.commanders)) {
            commanders = commanders.concat(owner.commanders);
        }

        return _.uniq(_.filter(_.map(commanders, stripKnownSpecTag), _.isString));
    };

    var setupGwoTechGlobals = function() {
        if (typeof model !== 'undefined') {
            model.gwoCardsGrantingAdvancedTech = GWO_CARDS_GRANTING_ADVANCED_TECH.slice(0);
        }
    };

    var isGwTechLoadoutId = function(cardId) {
        return _.isString(cardId) && (cardId.indexOf('gwc_start') === 0 || cardId.indexOf('_start_') >= 0);
    };

    var ensureGwoInventoryCompatibility = function(inventory) {
        if (!inventory) {
            return inventory;
        }

        if (!_.isFunction(inventory.aiMods)) {
            inventory.aiMods = ko.observableArray([]);
        }

        if (!_.isFunction(inventory.addAIMods)) {
            inventory.addAIMods = function(aiMods) {
                inventory.aiMods(inventory.aiMods().concat(aiMods || []));
            };
        }

        return inventory;
    };

    var inventoryAIMods = function(inventory) {
        if (!inventory || !_.isFunction(inventory.aiMods)) {
            return [];
        }

        return inventory.aiMods() || [];
    };

    var inventoryHasAIMods = function(inventory) {
        return inventoryAIMods(inventory).length > 0;
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
            if (_.isString(cardId) && !isGwTechLoadoutId(cardId)) {
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

    var getAIPathDestination = function(owner, tag, inventory) {
        if (owner && owner.ai && tag && inventoryHasAIMods(inventory)) {
            return '/pa/ai_gw_tech/' + tag.replace(/^\./, '') + '/';
        }

        return normalizeAIPath(owner);
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

    var getBaseUnitList = function() {
        var done = $.Deferred();

        getFileJSON('/pa/units/unit_list.json').then(function(unitList) {
            done.resolve(unitList && _.isArray(unitList.units) ? unitList.units : []);
        }, function() {
            done.resolve([]);
        });

        return done.promise();
    };

    var loadCard = function(cardId) {
        var done = $.Deferred();

        requireGW(['cards/' + cardId], function(card) {
            if (card) {
                card.id = cardId;
            }
            done.resolve(card);
        }, function(reason) {
            done.reject(reason || ('Unable to load card ' + cardId));
        });

        return done.promise();
    };

    var dealStartCard = function(loadout, inventory) {
        var done = $.Deferred();
        var fakeGalaxy = {
            stars: function() {
                return _.range(0, 12);
            }
        };
        var fakeStar = {
            distance: function() {
                return 1;
            }
        };

        loadCard(loadout).then(function(card) {
            if (!card) {
                done.reject('Unable to load start card ' + loadout);
                return;
            }

            try {
                var context = card.getContext && card.getContext(fakeGalaxy, inventory);
                var deal = card.deal && card.deal(fakeStar, context, inventory);
                var product = { id: loadout };
                var cardParams = deal && deal.params;

                if (cardParams && _.isObject(cardParams)) {
                    _.assign(product, cardParams);
                }

                if (card.keep) {
                    card.keep(deal, context);
                }
                if (card.releaseContext) {
                    card.releaseContext(context);
                }

                done.resolve(product);
            }
            catch (e) {
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
        setupGwoTechGlobals();

        if (isVanillaOwner(owner)) {
            getBaseUnitList().then(function(baseUnits) {
                var vanillaInventory = ensureGwoInventoryCompatibility(new GWInventory());
                vanillaInventory.load({
                    units: _.uniq((baseUnits || []).concat(getOwnerCommanders(owner))),
                    cards: [],
                    tags: {
                        global: {
                            commander: stripKnownSpecTag(owner.commander),
                            playerColor: owner.color
                        }
                    }
                });
                done.resolve(vanillaInventory);
            });
            return done.promise();
        }

        var dealInventory = ensureGwoInventoryCompatibility(new GWInventory());
        dealInventory.setTag('global', 'commander', stripKnownSpecTag(owner.commander));

        dealStartCard(loadout, dealInventory).then(function(startCardProduct) {
            var inventory = ensureGwoInventoryCompatibility(new GWInventory());
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
                var missingOwnerCommanders = _.difference(getOwnerCommanders(owner), inventory.units());
                if (missingOwnerCommanders.length) {
                    inventory.addUnits(missingOwnerCommanders);
                }
                done.resolve(inventory);
            });
        }, function(reason) {
            done.reject(reason);
        });

        return done.promise();
    };

    var generateAIPathFilesForOwner = function(owner, tag, inventory) {
        var done = $.Deferred();
        var aiPath = normalizeAIPath(owner);
        var aiPathDestination = getAIPathDestination(owner, tag, inventory);

        if (aiPath === '/pa/ai/' && aiPathDestination === aiPath && !inventoryHasAIMods(inventory)) {
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
                    result[aiPathDestination + path.slice(aiPath.length)] = json;
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

    var generateAIUnitMapFilesForOwner = function(owner, tag, inventory) {
        var done = $.Deferred();
        var titans = api.content.usingTitans();
        var aiPath = normalizeAIPath(owner);
        var aiPathDestination = getAIPathDestination(owner, tag, inventory);
        var defaultMapPaths = ['/pa/ai/unit_maps/ai_unit_map.json'];

        if (titans) {
            defaultMapPaths.push('/pa/ai/unit_maps/ai_unit_map_x1.json');
        }

        var fallbackMapPathsForAIPath = function() {
            var result = [{
                source: '/pa/ai/unit_maps/ai_unit_map.json',
                destination: aiPathDestination + 'unit_maps/ai_unit_map.json'
            }];

            if (titans) {
                result.push({
                    source: '/pa/ai/unit_maps/ai_unit_map_x1.json',
                    destination: aiPathDestination + 'unit_maps/ai_unit_map_x1.json'
                });
            }

            return result;
        };

        var buildFilesFromMapPaths = function(mapPaths) {
            var filesToProcess = [];

            _.forEach(mapPaths || [], function(mapPath) {
                var path = _.isString(mapPath) ? mapPath : mapPath && mapPath.source;
                var destination = _.isString(mapPath) ? aiPathDestination + mapPath.slice(aiPath.length) : mapPath && mapPath.destination;

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
                    if (destination.indexOf(aiPathDestination) === 0 && aiPathDestination !== aiPath) {
                        result[destination] = aiUnitMap;
                    }
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

    var managerPathForGwoAIMod = function(type) {
        switch (type) {
            case 'fabber':
                return 'fabber_builds/';
            case 'factory':
                return 'factory_builds/';
            case 'platoon':
                return 'platoon_builds/';
            case 'template':
                return 'platoon_templates/';
            default:
                return '';
        }
    };

    var applyGwoAIModsToJSON = function(json, mods) {
        var ops = {
            append: function(mod) {
                _.forEach(json.build_list || [], function(build) {
                    if (build.to_build !== mod.toBuild) {
                        return;
                    }

                    var validMatch = (_.isUndefined(mod.refId) || _.isEqual(build[mod.refId], mod.refValue)) && build[mod.idToMod];

                    if (validMatch && _.isArray(build[mod.idToMod])) {
                        build[mod.idToMod] = build[mod.idToMod].concat(mod.value);
                    }
                    else if (validMatch) {
                        build[mod.idToMod] += mod.value;
                    }
                    else {
                        _.forEach(build.build_conditions || [], function(testArray) {
                            _.forEach(testArray || [], function(test) {
                                if (test[mod.refId] === mod.refValue) {
                                    if (_.isArray(test[mod.idToMod])) {
                                        test[mod.idToMod] = test[mod.idToMod].concat(mod.value);
                                    }
                                    else if (test[mod.idToMod]) {
                                        test[mod.idToMod] += mod.value;
                                    }
                                }
                            });
                        });
                    }
                });
            },
            prepend: function(mod) {
                _.forEach(json.build_list || [], function(build) {
                    if (build.to_build !== mod.toBuild) {
                        return;
                    }

                    var validMatch = (_.isUndefined(mod.refId) || _.isEqual(build[mod.refId], mod.refValue)) && build[mod.idToMod];

                    if (validMatch && _.isArray(build[mod.idToMod])) {
                        build[mod.idToMod] = mod.value.concat(build[mod.idToMod]);
                    }
                    else if (validMatch) {
                        build[mod.idToMod] = mod.value + build[mod.idToMod];
                    }
                    else {
                        _.forEach(build.build_conditions || [], function(testArray) {
                            _.forEach(testArray || [], function(test) {
                                if (test[mod.refId] === mod.refValue) {
                                    if (_.isArray(test[mod.idToMod])) {
                                        test[mod.idToMod] = mod.value.concat(test[mod.idToMod]);
                                    }
                                    else if (test[mod.idToMod]) {
                                        test[mod.idToMod] = mod.value + test[mod.idToMod];
                                    }
                                }
                            });
                        });
                    }
                });
            },
            replace: function(mod) {
                _.forEach(json.build_list || [], function(build) {
                    if (build.to_build !== mod.toBuild) {
                        return;
                    }

                    var validMatch = (_.isUndefined(mod.refId) || _.isEqual(build[mod.refId], mod.refValue)) && build[mod.idToMod];

                    if (validMatch) {
                        build[mod.idToMod] = mod.value;
                    }
                    else {
                        _.forEach(build.build_conditions || [], function(testArray) {
                            _.forEach(testArray || [], function(test) {
                                if (test[mod.refId] === mod.refValue && test[mod.idToMod]) {
                                    test[mod.idToMod] = mod.value;
                                }
                            });
                        });
                    }
                });
            },
            remove: function(mod) {
                _.forEach(json.build_list || [], function(build) {
                    if (build.to_build !== mod.toBuild) {
                        return;
                    }

                    _.forEach(build.build_conditions || [], function(testArray) {
                        _.remove(testArray, function(object) {
                            return _.isEqual(object, mod.value);
                        });
                    });
                });
            },
            new: function(mod) {
                _.forEach(json.build_list || [], function(build) {
                    if (build.to_build !== mod.toBuild) {
                        return;
                    }

                    if (mod.idToMod) {
                        _.forEach(build.build_conditions || [], function(testArray) {
                            testArray.push(mod.value);
                        });
                    }
                    else {
                        build.build_conditions = build.build_conditions || [];
                        build.build_conditions.push(mod.value);
                    }
                });
            },
            squad: function(mod) {
                if (json.platoon_templates && json.platoon_templates[mod.toBuild]) {
                    json.platoon_templates[mod.toBuild].units.push(mod.value);
                }
            }
        };

        _.forEach(mods || [], function(mod) {
            if (mod && ops[mod.op]) {
                ops[mod.op](mod);
            }
        });
    };

    var applyGwoAIManagerMods = function(files, owner, tag, inventory) {
        var done = $.Deferred();
        var aiMods = inventoryAIMods(inventory);

        if (!owner || !owner.ai || !aiMods.length) {
            done.resolve(files);
            return done.promise();
        }

        var aiPathDestination = getAIPathDestination(owner, tag, inventory);
        var loadPromises = [];

        _.forEach(_.filter(aiMods, { op: 'load' }), function(mod) {
            var managerPath = managerPathForGwoAIMod(mod.type);
            if (!managerPath || !_.isString(mod.value)) {
                return;
            }

            loadPromises.push(getFileJSON('/pa/ai_tech/' + managerPath + mod.value).then(function(json) {
                files[aiPathDestination + managerPath + mod.value] = json;
            }, function() {
            }));
        });

        $.when.apply($, loadPromises).always(function() {
            var managerModsByPath = {};

            _.forEach(_.reject(aiMods, { op: 'load' }), function(mod) {
                var managerPath = mod && managerPathForGwoAIMod(mod.type);
                if (!managerPath) {
                    return;
                }

                managerModsByPath[managerPath] = managerModsByPath[managerPath] || [];
                managerModsByPath[managerPath].push(mod);
            });

            _.forEach(files, function(json, path) {
                if (!_.isString(path) || path.indexOf(aiPathDestination) !== 0) {
                    return;
                }

                _.forEach(managerModsByPath, function(mods, managerPath) {
                    if (path.indexOf(aiPathDestination + managerPath) === 0) {
                        applyGwoAIModsToJSON(json, mods);
                    }
                });
            });

            done.resolve(files);
        });

        return done.promise();
    };

    var generateUnitSpecsForOwner = function(inventory, tag, owner) {
        var done = $.Deferred();

        $.when(
            generateAIUnitMapFilesForOwner(owner, tag, inventory),
            generateAIPathFilesForOwner(owner, tag, inventory)
        ).then(function(aiUnitMapFiles, aiPathFiles) {
            GW.specs.genUnitSpecs(inventory.units(), tag).then(function(playerSpecFiles) {
                var playerFiles = _.assign({}, aiPathFiles || {}, aiUnitMapFiles || {}, playerSpecFiles);
                GW.specs.modSpecs(playerFiles, inventory.mods(), tag);
                applyGwoAIManagerMods(playerFiles, owner, tag, inventory).then(function(files) {
                    done.resolve(files);
                });
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

        _.forEach(ownerList, function(owner, index) {
            var vanilla = isVanillaOwner(owner);
            var tag = getPlayerTagGivenIndex(taggedOwnerCount);
            ++taggedOwnerCount;

            ownerPromises.push(buildInventory(owner).then(function(inventory) {
                return generateUnitSpecsForOwner(inventory, tag, owner).then(function(files) {
                    var baseCommander = stripKnownSpecTag(owner.commander);
                    var minionArmies = [];
                    var personality = owner.personality ? _.cloneDeep(owner.personality) : undefined;
                    var aiPathDestination = getAIPathDestination(owner, tag, inventory);

                    if (personality && owner.ai && aiPathDestination !== normalizeAIPath(owner)) {
                        personality.ai_path = aiPathDestination;
                    }

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
                            personality: personality,
                            inventory_mods: vanilla ? [] : _.cloneDeep(inventory.mods()),
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

            getBaseUnitList().then(finish, function() {
                finish([]);
            });
        }, function(reason) {
            done.reject(reason);
        });

        return done.promise();
    };

    return {
        cook: cook
    };
});
