define(function() {

    // In the following code, a color is essentially a type of array containing three integers
    // (R, G, B) which must be in the range 0-255.

    // Controls the range of color variation for player in unshared coop sessions.
    // Each of the R, G, and B color channels can vary from the host's color 
    // (determined by which faction the player belongs to) by at most PLAYER_COLOR_VARIATION_RANGE
    // in either the positive or negative direction.
    var PLAYER_COLOR_VARIATION_RANGE = 35;

    var clampColorChannel = function(value) {
        return Math.max(0, Math.min(255, Math.round(value)));
    };

    var randomizeColorNearFactionColor = function(color) {
        // For every item in the color array, we map it to a new value within 
        // the variation range [color[i] - PLAYER_COLOR_VARIATION_RANGE, color[i] + PLAYER_COLOR_VARIATION_RANGE]
        return _.map(color, function(channel) {
            // Generate our offset in the range [-PLAYER_COLOR_VARIATION_RANGE, PLAYER_COLOR_VARIATION_RANGE]
            var offset = Math.floor(Math.random() * ((PLAYER_COLOR_VARIATION_RANGE * 2) + 1)) - PLAYER_COLOR_VARIATION_RANGE;
            return clampColorChannel(channel + offset);
        });
    };

    var getColorPairForPlayerArmy = function(index, factionColor) {
        // Host always gets the base faction color.
        if (index === 0)
            return _.cloneDeep(factionColor);

        return [
            randomizeColorNearFactionColor(factionColor[0]),
            randomizeColorNearFactionColor(factionColor[1])
        ];
    };

    var armyHasAI = function(army) {
        return !!(army && _.isArray(army.slots) && _.any(army.slots, 'ai'));
    };

    var getConnectedPlayerCount = function(options) {
        var connectedClients = options && options.connectedClients;
        if (_.isArray(connectedClients) && connectedClients.length)
            return connectedClients.length;

        console.log('[GW COOP] Co-op referee cannot prepare human armies without connected clients.');
        return 0;
    };

    var collectHumanArmies = function(config) {
        var humanArmies = [];

        _.forEach(config.armies, function(army) {
            if (!armyHasAI(army))
                humanArmies.push(army);
        });

        return humanArmies;
    };

    var ensureSharedHumanSlots = function(config, playerCount) {
        var humanArmies = collectHumanArmies(config);

        if (humanArmies.length !== 1) {
            console.log('[GW COOP] Expected exactly one human army while preparing shared control, found ' + humanArmies.length + '.');
            return false;
        }

        var humanArmy = humanArmies[0];
        var humanSlots = _.filter(humanArmy.slots || [], function(slot) {
            return slot && !slot.ai;
        });

        if (!humanSlots.length) {
            console.log('[GW COOP] No human slot found while preparing shared control.');
            return false;
        }

        var baseSlot = humanSlots[0];
        while (humanSlots.length < playerCount) {
            var extraSlot = _.cloneDeep(baseSlot);
            delete extraSlot.client;
            delete extraSlot.ai;
            delete extraSlot.name;
            humanArmy.slots.push(extraSlot);
            humanSlots.push(extraSlot);
        }

        return true;
    };

    var splitHumanArmiesForUnsharedControl = function(config, playerCount) {
        var humanArmies = collectHumanArmies(config);

        if (humanArmies.length !== 1) {
            console.log('[GW COOP] Expected exactly one human army while preparing unshared control, found ' + humanArmies.length + '.');
            return false;
        }

        // Figure out which army is the one in normal GW that would be marked
        // as the human player (so we can then use it as a template to create more armies).
        var humanTemplate = humanArmies[0];
        var baseSlot = humanTemplate.slots && humanTemplate.slots[0];

        if (!baseSlot) {
            console.log('[GW COOP] No valid base slot found while preparing unshared control.');
            return false;
        }

        // Create a new army for each connected client.
        var splitArmies = _.map(_.range(0, playerCount), function(index) {
            var slot = _.cloneDeep(baseSlot);
            // Slots will be assigned to specific clients later in startGame() in the gw_lobby server script.
            delete slot.client;
            delete slot.ai;
            delete slot.name;

            return {
                slots: [slot],
                // I assume here that humanTemplate.color is both a valid color and the main faction color.
                color: getColorPairForPlayerArmy(index, humanTemplate.color),
                econ_rate: _.has(humanTemplate, 'econ_rate') ? humanTemplate.econ_rate : 1,
                spec_tag: humanTemplate.spec_tag,
                alliance_group: humanTemplate.alliance_group
            };
        });

        config.armies = _.reduce(config.armies, function(result, army) {
            if (!armyHasAI(army))
                return result.concat(splitArmies);

            result.push(army);
            return result;
        }, []);

        console.log('[GW COOP] prepared unshared control with ' + splitArmies.length + ' allied human armies');
        return true;
    };

    // Takes in the regular singleplayer gw_referee and applies co-op specific logic.
    // In this case that logic ensures that the config is proper, the correct number of slots
    // are allocated for human players, and if applicable, manufactures slots and config changes
    // to support unshared control.
    var apply = function(referee, options) {
        var done = $.Deferred();
        var config = referee && _.isFunction(referee.config) && referee.config();

        if (!config || !_.isArray(config.armies)) {
            console.log('[GW COOP] Co-op referee received invalid battle config.');
            done.resolve(false);
            return done.promise();
        }

        // No options means no co-op.
        if (!options || !options.active) {
            done.resolve(true);
            return done.promise();
        }

        var playerCount = getConnectedPlayerCount(options);
        if (playerCount < 1) {
            console.log('[GW COOP] Co-op referee has no connected players.');
            config.coop_human_armies_ready = false;
            referee.config(config);
            done.resolve(false);
            return done.promise();
        }

        var sharedControl = !!options.sharedControl;
        
        var prepared = false;

        if (sharedControl) {
            prepared = ensureSharedHumanSlots(config, playerCount);
        } else {
            prepared = splitHumanArmiesForUnsharedControl(config, playerCount);
        }
            


        config.coop_human_armies_ready = !!prepared;
        referee.config(config);
        done.resolve(prepared);
        return done.promise();
    };

    return {
        apply: apply
    };
});
