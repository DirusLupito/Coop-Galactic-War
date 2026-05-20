define([
    'shared/gw_common',
    'shared/gw_inventory',
    'pages/gw_start/gw_dealer'
], function(
    GW,
    GWInventory,
    GWDealer
) {
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

    var buildInventory = function(owner) {
        var done = $.Deferred();
        var loadout = _.isString(owner.loadout) ? owner.loadout : 'gwc_start_vehicle';

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

    var generateUnitSpecsForOwner = function(inventory, tag) {
        var done = $.Deferred();
        var titans = api.content.usingTitans();
        var aiMapLoad = $.get('spec://pa/ai/unit_maps/ai_unit_map.json');
        var aiX1MapLoad = titans ? $.get('spec://pa/ai/unit_maps/ai_unit_map_x1.json') : $.Deferred().resolve([{}]);

        $.when(aiMapLoad, aiX1MapLoad).then(function(aiMapGet, aiX1MapGet) {
            var aiUnitMap = parse(aiMapGet[0]);
            var aiX1UnitMap = parse(aiX1MapGet[0]);
            var playerAIUnitMap = GW.specs.genAIUnitMap(aiUnitMap, tag);
            var playerX1AIUnitMap = titans ? GW.specs.genAIUnitMap(aiX1UnitMap, tag) : {};

            GW.specs.genUnitSpecs(inventory.units(), tag).then(function(playerSpecFiles) {
                var playerFilesClassic = {};
                var playerFilesX1 = {};

                playerFilesClassic['/pa/ai/unit_maps/ai_unit_map.json' + tag] = playerAIUnitMap;
                if (titans) {
                    playerFilesX1['/pa/ai/unit_maps/ai_unit_map_x1.json' + tag] = playerX1AIUnitMap;
                }

                var playerFiles = _.assign({}, playerFilesClassic, playerFilesX1, playerSpecFiles);
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

    var buildUntaggedUnitListFromFiles = function(files) {
        var units = [];

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

        _.forEach(ownerList, function(owner, index) {
            var tag = getPlayerTagGivenIndex(index);

            ownerPromises.push(buildInventory(owner).then(function(inventory) {
                return generateUnitSpecsForOwner(inventory, tag).then(function(files) {
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

            files['/pa/units/unit_list.json'] = buildUntaggedUnitListFromFiles(files);

            done.resolve({
                files: files,
                tag_assignments: assignments
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
