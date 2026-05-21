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
    var AI_BIAS_LOG_PREFIX = '[GW TECH AI BIAS] ';
    var AI_BIAS_PRIORITY_MULTIPLIER_PER_SCORE = 3.0;
    var AI_BIAS_COUNT_CAP_MULTIPLIER_PER_SCORE = 3.0;

    var logAIBias = function(message) {
        console.log(AI_BIAS_LOG_PREFIX + message);
    };

    var ownerLogName = function(owner) {
        return owner && (owner.name || owner.player_name || owner.client_name || owner.player_id || owner.owner_key) || 'unknown';
    };

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

    var isUnitSpecPath = function(value) {
        return _.isString(value) && value.indexOf('/pa/units/') === 0 && value.slice(-'.json'.length) === '.json';
    };

    var biasReasonForMod = function(mod) {
        if (!mod || !isUnitSpecPath(mod.file) || !_.isString(mod.path) || !_.isString(mod.op)) {
            return undefined;
        }

        if (mod.file.indexOf('/pa/units/commanders/') === 0) {
            return undefined;
        }

        var path = mod.path.toLowerCase();
        var op = mod.op;
        var value = mod.value;

        if (path === 'unit_types' && op === 'push') {
            if (value === 'UNITTYPE_CmdBuild' || (_.isArray(value) && value.indexOf('UNITTYPE_CmdBuild') >= 0)) {
                return { score: 0.75, reason: 'commander-build' };
            }
            return undefined;
        }

        if ((path.indexOf('build_metal_cost') >= 0 ||
                path.indexOf('build_energy_cost') >= 0 ||
                path.indexOf('factory_cooldown') >= 0) &&
            ((op === 'multiply' && _.isNumber(value) && value < 1) ||
                (op === 'add' && _.isNumber(value) && value < 0) ||
                op === 'replace')) {
            return { score: 1.0, reason: 'cost-or-cooldown' };
        }

        if ((path.indexOf('damage') >= 0 ||
                path.indexOf('splash_damage') >= 0 ||
                path.indexOf('max_health') >= 0 ||
                path.indexOf('health') >= 0 ||
                path.indexOf('max_velocity') >= 0 ||
                path.indexOf('move_speed') >= 0 ||
                path.indexOf('turn_speed') >= 0 ||
                path.indexOf('range') >= 0 ||
                path.indexOf('build_rate') >= 0 ||
                path.indexOf('ammo') >= 0 ||
                path.indexOf('energy') >= 0 ||
                path.indexOf('rate_of_fire') >= 0) &&
            ((op === 'multiply' && _.isNumber(value) && value !== 1) ||
                (op === 'add' && _.isNumber(value) && value !== 0) ||
                op === 'replace' ||
                op === 'merge' ||
                op === 'eval')) {
            return { score: 0.75, reason: 'combat-or-efficiency' };
        }

        return undefined;
    };

    var inventoryTechBiasSourceMods = function(inventory) {
        return _.filter(inventory && _.isFunction(inventory.mods) ? inventory.mods() || [] : [], function(mod) {
            return !!biasReasonForMod(mod);
        });
    };

    var inventoryHasTechBiasSource = function(inventory) {
        return inventoryTechBiasSourceMods(inventory).length > 0;
    };

    var inventoryHasAIManagerInfluence = function(inventory) {
        return inventoryHasAIMods(inventory) || inventoryHasTechBiasSource(inventory);
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
        if (owner && owner.ai && tag && inventoryHasAIManagerInfluence(inventory)) {
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

        if (aiPath === '/pa/ai/' && aiPathDestination === aiPath && !inventoryHasAIManagerInfluence(inventory)) {
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
                    logAIBias('failed-ai-manager-load source=' + path);
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
                logAIBias('ai-manager-copy-failed source=' + aiPath + ' destination=' + aiPathDestination);
                done.resolve({});
            });
        }, function() {
            logAIBias('ai-manager-list-failed source=' + aiPath + ' destination=' + aiPathDestination);
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
            'new': function(mod) {
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

        logAIBias('gwo-ai-mods tag=' + tag +
            ' owner=' + ownerLogName(owner) +
            ' load_mods=' + _.filter(aiMods, { op: 'load' }).length +
            ' patch_mods=' + _.reject(aiMods, { op: 'load' }).length +
            ' destination_ai_path=' + aiPathDestination);

        _.forEach(_.filter(aiMods, { op: 'load' }), function(mod) {
            var managerPath = managerPathForGwoAIMod(mod.type);
            if (!managerPath || !_.isString(mod.value)) {
                logAIBias('invalid-gwo-load-mod tag=' + tag + ' type=' + (mod && mod.type) + ' value=' + (mod && mod.value));
                return;
            }

            loadPromises.push(getFileJSON('/pa/ai_tech/' + managerPath + mod.value).then(function(json) {
                files[aiPathDestination + managerPath + mod.value] = json;
            }, function() {
                logAIBias('failed-gwo-ai-tech-load tag=' + tag + ' path=' + '/pa/ai_tech/' + managerPath + mod.value);
            }));
        });

        $.when.apply($, loadPromises).always(function() {
            var managerModsByPath = {};

            _.forEach(_.reject(aiMods, { op: 'load' }), function(mod) {
                var managerPath = mod && managerPathForGwoAIMod(mod.type);
                if (!managerPath) {
                    logAIBias('invalid-gwo-manager-mod tag=' + tag + ' type=' + (mod && mod.type) + ' op=' + (mod && mod.op));
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

    var collectSpecReferences = function(value, result) {
        if (_.isString(value)) {
            if (isUnitSpecPath(stripKnownSpecTag(value))) {
                result.push(stripKnownSpecTag(value));
            }
            return;
        }

        if (_.isArray(value)) {
            _.forEach(value, function(child) {
                collectSpecReferences(child, result);
            });
            return;
        }

        if (_.isObject(value)) {
            _.forEach(value, function(child) {
                collectSpecReferences(child, result);
            });
        }
    };

    var getSpecFromFiles = function(files, spec, tag) {
        if (!isUnitSpecPath(spec)) {
            return undefined;
        }

        if (files[spec + tag]) {
            return files[spec + tag];
        }

        if (files[spec]) {
            return files[spec];
        }

        return undefined;
    };

    var buildSpecToRootLookup = function(files, inventory, tag) {
        var lookup = {};
        var roots = _.uniq(_.filter(_.map(inventory && _.isFunction(inventory.units) ? inventory.units() : [], stripKnownSpecTag), isUnitSpecPath));

        _.forEach(roots, function(root) {
            var pending = [root];
            var visited = {};

            lookup[root] = lookup[root] || [];
            if (lookup[root].indexOf(root) < 0) {
                lookup[root].push(root);
            }

            while (pending.length) {
                var specId = pending.pop();
                var spec = getSpecFromFiles(files, specId, tag);
                var refs = [];

                if (visited[specId]) {
                    continue;
                }
                visited[specId] = true;

                if (!spec) {
                    continue;
                }

                collectSpecReferences(spec, refs);

                _.forEach(_.uniq(refs), function(ref) {
                    lookup[ref] = lookup[ref] || [];
                    if (lookup[ref].indexOf(root) < 0) {
                        lookup[ref].push(root);
                    }
                    if (!visited[ref] && getSpecFromFiles(files, ref, tag)) {
                        pending.push(ref);
                    }
                });
            }
        });

        return lookup;
    };

    var collectAIUnitMapNames = function(value, key, result, stats) {
        if (_.isArray(value)) {
            _.forEach(value, function(child, index) {
                collectAIUnitMapNames(child, String(index), result, stats);
            });
            return;
        }

        if (!_.isObject(value)) {
            return;
        }

        if (_.isString(value.spec_id)) {
            var specId = stripKnownSpecTag(value.spec_id);
            var name = _.isString(value.name) ? value.name : key;

            if (_.isString(name) && name.length && isUnitSpecPath(specId)) {
                result[specId] = result[specId] || [];
                if (result[specId].indexOf(name) < 0) {
                    result[specId].push(name);
                    ++stats.mappedNames;
                }
            }
        }

        _.forEach(value, function(child, childKey) {
            collectAIUnitMapNames(child, childKey, result, stats);
        });
    };

    var buildSpecToAINameLookup = function(files, aiPathDestination) {
        var result = {};
        var stats = {
            mapFiles: 0,
            mappedNames: 0
        };

        _.forEach(files || {}, function(json, path) {
            if (!_.isString(path) ||
                path.indexOf(aiPathDestination + 'unit_maps/') !== 0 ||
                path.slice(-'.json'.length) !== '.json') {
                return;
            }

            ++stats.mapFiles;
            collectAIUnitMapNames(json, '', result, stats);
        });

        return {
            namesBySpec: result,
            stats: stats
        };
    };

    var specHasUnitType = function(files, spec, tag, unitType) {
        var json = getSpecFromFiles(files, spec, tag);
        return !!(json && _.isArray(json.unit_types) && json.unit_types.indexOf(unitType) >= 0);
    };

    var addTechBuildBias = function(biases, toBuild, spec, score, reason, mod) {
        if (!_.isString(toBuild) || !toBuild.length || !isUnitSpecPath(spec) || !score) {
            return;
        }

        var bias = biases[toBuild];
        if (!bias) {
            bias = biases[toBuild] = {
                toBuild: toBuild,
                specs: [],
                score: 0,
                reasons: {}
            };
        }

        if (bias.specs.indexOf(spec) < 0) {
            bias.specs.push(spec);
        }

        bias.score = Math.min(3.0, bias.score + score);
        bias.reasons[reason] = (bias.reasons[reason] || 0) + 1;
        if (mod && mod.path === 'unit_types') {
            bias.reasons['commander-build-mod'] = (bias.reasons['commander-build-mod'] || 0) + 1;
        }
    };

    var scoreTechBuildBiases = function(files, inventory, tag, aiPathDestination) {
        var sourceMods = inventoryTechBiasSourceMods(inventory);
        var specToRoot = buildSpecToRootLookup(files, inventory, tag);
        var aiLookup = buildSpecToAINameLookup(files, aiPathDestination);
        var biases = {};
        var unmappableSpecs = {};
        var rootsWithoutAIName = {};

        if (!aiLookup.stats.mapFiles) {
            logAIBias('missing-ai-unit-map tag=' + tag + ' ai_path=' + aiPathDestination);
        }

        _.forEach(sourceMods, function(mod) {
            var reason = biasReasonForMod(mod);
            var modSpec = stripKnownSpecTag(mod.file);
            var roots = specToRoot[modSpec] || (isUnitSpecPath(modSpec) ? [modSpec] : []);

            if (!roots.length) {
                unmappableSpecs[modSpec] = true;
                return;
            }

            _.forEach(roots, function(root) {
                var names = aiLookup.namesBySpec[root] || [];

                if (!names.length) {
                    rootsWithoutAIName[root] = true;
                    return;
                }

                _.forEach(names, function(name) {
                    addTechBuildBias(biases, name, root, reason.score, reason.reason, mod);
                });
            });
        });

        return {
            biases: biases,
            sourceMods: sourceMods,
            aiMapStats: aiLookup.stats,
            unmappableSpecs: _.keys(unmappableSpecs),
            rootsWithoutAIName: _.keys(rootsWithoutAIName)
        };
    };

    var isManagerJSONPath = function(path, aiPathDestination) {
        return _.isString(path) &&
            path.indexOf(aiPathDestination) === 0 &&
            (path.indexOf(aiPathDestination + 'fabber_builds/') === 0 ||
                path.indexOf(aiPathDestination + 'factory_builds/') === 0 ||
                path.indexOf(aiPathDestination + 'platoon_builds/') === 0 ||
                path.indexOf(aiPathDestination + 'platoon_templates/') === 0) &&
            path.slice(-'.json'.length) === '.json';
    };

    var biasHasCmdBuildSpec = function(bias, files, tag) {
        return _.some(bias.specs || [], function(spec) {
            return specHasUnitType(files, spec, tag, 'UNITTYPE_CmdBuild');
        });
    };

    var valueMentionsToBuild = function(value, toBuild) {
        if (_.isString(value)) {
            return value === toBuild;
        }

        if (_.isArray(value)) {
            return _.some(value, function(child) {
                return valueMentionsToBuild(child, toBuild);
            });
        }

        if (_.isObject(value)) {
            return _.some(value, function(child) {
                return valueMentionsToBuild(child, toBuild);
            });
        }

        return false;
    };

    var relaxCountCapTest = function(test, bias, stats) {
        var testType = test && test.test_type;

        if (!_.isString(testType) || testType.indexOf('UnitCount') < 0) {
            return false;
        }

        var patched = false;
        var multiplier = 1 + (AI_BIAS_COUNT_CAP_MULTIPLIER_PER_SCORE * bias.score);

        _.forEach(test, function(value, key) {
            var valueMatch = key.match(/^value(\d*)$/);
            var compare;
            var replacement;

            if (!valueMatch || !_.isNumber(value) || value < 0) {
                return;
            }

            compare = test['compare' + valueMatch[1]];
            if (compare !== '<' && compare !== '<=') {
                return;
            }

            replacement = Math.max(value + 1, Math.min(Math.ceil(value * multiplier), value + 9));
            if (replacement !== value) {
                test[key] = replacement;
                ++stats.countCapRelaxations;
                patched = true;
            }
        });

        return patched;
    };

    var relaxMatchingBuildConditionCaps = function(build, bias, stats) {
        var patched = false;

        _.forEach(build.build_conditions || [], function(conditionGroup) {
            if (!valueMentionsToBuild(conditionGroup, bias.toBuild)) {
                return;
            }

            _.forEach(conditionGroup || [], function(test) {
                if (relaxCountCapTest(test, bias, stats)) {
                    patched = true;
                }
            });
        });

        return patched;
    };

    var summarizeBias = function(bias) {
        return bias.toBuild + ':' + Math.round(bias.score * 100) / 100 + ':' + _.keys(bias.reasons).join('|');
    };

    var applyTechBuildBiasesToAIManagerFiles = function(files, owner, tag, inventory) {
        var done = $.Deferred();

        if (!owner || !owner.ai || !inventoryHasTechBiasSource(inventory)) {
            done.resolve(files);
            return done.promise();
        }

        var aiPathDestination = getAIPathDestination(owner, tag, inventory);
        var scoreResult = scoreTechBuildBiases(files, inventory, tag, aiPathDestination);
        var biases = scoreResult.biases;
        var biasList = _.sortBy(_.values(biases), function(bias) {
            return -bias.score;
        });
        var stats = {
            managerFilesScanned: 0,
            managerFilesPatched: 0,
            buildEntriesPatched: 0,
            priorityChanges: 0,
            builderAdditions: 0,
            countCapRelaxations: 0,
            missingBuildEntries: {}
        };

        logAIBias('bias-discovery tag=' + tag +
            ' owner=' + ownerLogName(owner) +
            ' loadout=' + (owner.loadout || '') +
            ' source_mods=' + scoreResult.sourceMods.length +
            ' ai_map_files=' + scoreResult.aiMapStats.mapFiles +
            ' mapped_ai_names=' + scoreResult.aiMapStats.mappedNames +
            ' targets=' + biasList.length +
            ' top=' + _.map(biasList.slice(0, 10), summarizeBias).join(','));

        if (scoreResult.unmappableSpecs.length) {
            logAIBias('unmappable-buffed-specs tag=' + tag + ' count=' + scoreResult.unmappableSpecs.length + ' specs=' + scoreResult.unmappableSpecs.slice(0, 20).join(','));
        }

        if (scoreResult.rootsWithoutAIName.length) {
            logAIBias('buffed-specs-without-ai-name tag=' + tag + ' count=' + scoreResult.rootsWithoutAIName.length + ' specs=' + scoreResult.rootsWithoutAIName.slice(0, 20).join(','));
        }

        if (!biasList.length) {
            done.resolve(files);
            return done.promise();
        }

        _.forEach(biasList, function(bias) {
            stats.missingBuildEntries[bias.toBuild] = true;
        });

        _.forEach(files || {}, function(json, path) {
            var patchedFile = false;

            if (!isManagerJSONPath(path, aiPathDestination)) {
                return;
            }

            ++stats.managerFilesScanned;

            _.forEach(json && json.build_list || [], function(build) {
                var bias = build && biases[build.to_build];
                var oldPriority;
                var newPriority;

                if (!bias) {
                    return;
                }

                delete stats.missingBuildEntries[bias.toBuild];
                ++stats.buildEntriesPatched;

                if (_.isNumber(build.priority)) {
                    oldPriority = build.priority;
                    newPriority = Math.min(Math.round(oldPriority * (1 + (AI_BIAS_PRIORITY_MULTIPLIER_PER_SCORE * bias.score))), oldPriority + 5000);
                    if (newPriority !== oldPriority) {
                        build.priority = newPriority;
                        ++stats.priorityChanges;
                        patchedFile = true;
                    }
                }

                if (_.isArray(build.builders) && biasHasCmdBuildSpec(bias, files, tag) && build.builders.indexOf('Commander') < 0) {
                    build.builders.push('Commander');
                    ++stats.builderAdditions;
                    patchedFile = true;
                }

                if (relaxMatchingBuildConditionCaps(build, bias, stats)) {
                    patchedFile = true;
                }
            });

            if (patchedFile) {
                ++stats.managerFilesPatched;
            }
        });

        var missingTargets = _.keys(stats.missingBuildEntries);
        if (missingTargets.length) {
            logAIBias('targets-without-manager-entry tag=' + tag + ' count=' + missingTargets.length + ' targets=' + missingTargets.slice(0, 20).join(','));
        }

        logAIBias('manager-patch tag=' + tag +
            ' owner=' + ownerLogName(owner) +
            ' scanned=' + stats.managerFilesScanned +
            ' files_patched=' + stats.managerFilesPatched +
            ' entries_patched=' + stats.buildEntriesPatched +
            ' priority_changes=' + stats.priorityChanges +
            ' builder_additions=' + stats.builderAdditions +
            ' count_cap_relaxations=' + stats.countCapRelaxations);

        done.resolve(files);
        return done.promise();
    };

    var generateUnitSpecsForOwner = function(inventory, tag, owner) {
        var done = $.Deferred();
        var aiPath = normalizeAIPath(owner);
        var aiPathDestination = getAIPathDestination(owner, tag, inventory);

        if (owner && owner.ai) {
            logAIBias('owner-summary tag=' + tag +
                ' owner=' + ownerLogName(owner) +
                ' loadout=' + (owner.loadout || '') +
                ' cards=' + (owner.cards || []).join(',') +
                ' source_ai_path=' + aiPath +
                ' destination_ai_path=' + aiPathDestination +
                ' isolated=' + (aiPathDestination !== aiPath) +
                ' explicit_ai_mods=' + inventoryAIMods(inventory).length +
                ' bias_source_mods=' + inventoryTechBiasSourceMods(inventory).length);
        }

        $.when(
            generateAIUnitMapFilesForOwner(owner, tag, inventory),
            generateAIPathFilesForOwner(owner, tag, inventory)
        ).then(function(aiUnitMapFiles, aiPathFiles) {
            GW.specs.genUnitSpecs(inventory.units(), tag).then(function(playerSpecFiles) {
                var playerFiles = _.assign({}, aiPathFiles || {}, aiUnitMapFiles || {}, playerSpecFiles);
                GW.specs.modSpecs(playerFiles, inventory.mods(), tag);
                applyGwoAIManagerMods(playerFiles, owner, tag, inventory).then(function(files) {
                    applyTechBuildBiasesToAIManagerFiles(files, owner, tag, inventory).then(function(biasedFiles) {
                        done.resolve(biasedFiles);
                    });
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
