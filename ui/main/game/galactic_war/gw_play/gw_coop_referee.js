define(['shared/gw_coop_player_colors'], function(GWCoopPlayerColors) {

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

    var splitHumanArmiesForUnsharedControl = function(config, playerCount, playerColors) {
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

        var normalizedPlayerColors = GWCoopPlayerColors.normalizePlayerColorPairs(playerCount, playerColors, humanTemplate.color);
        if (normalizedPlayerColors.length !== playerCount) {
            console.log('[GW COOP] Could not normalize a color for every unshared human army.');
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
                // The shared color module preserves the generated host color when valid
                // and repairs every additional pair before army construction.
                color: _.cloneDeep(normalizedPlayerColors[index]),
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
    //
    // Parameters:
    // - Referee: the already-hired GW referee object. This function expects it to expose
    //   a config observable, where referee.config() reads the generated battle
    //   config and referee.config(config) writes the mutated config back for later launch steps.
    //   This config is a map/object. Expected fields used by this referee are:
    //       * armies: an array of army objects. This is the main field this referee mutates.
    //             A human army is any army whose slots do not contain AI slots.
    //       * armies[*].slots: an array of slot objects. Human slots are slots without slot.ai.
    //             In shared control, extra human slots are added to the one human army.
    //       * armies[*].slots[*].ai: true when the slot belongs to an AI. Missing or false means
    //             the slot is treated as human-controllable.
    //       * armies[*].color: the army color pair. In unshared control, the first human army
    //             keeps the original color and later human armies use the pairs resolved by gw_play.
    //       * armies[*].econ_rate: copied from the original human army when manufacturing
    //             separate unshared human armies. A floating-point number.
    //       * armies[*].spec_tag: copied from the original human army when manufacturing
    //             separate unshared human armies. String like '.player' or '.ai0'.
    //       * armies[*].alliance_group: copied from the original human army so split human
    //             armies remain allied. Integer value.
    //       * coop_human_armies_ready: written by this referee as true or false to record
    //             whether co-op human army preparation succeeded. Boolean.
    //
    // - Options: a map/object describing the current launch context. Expected fields are:
    //       * active: true when this is a co-op Galactic War campaign fight; false for normal
    //             single-player GW, where this referee should do nothing and succeed.
    //       * sharedControl: true when all connected humans should share one army; false when
    //             each connected human should get a separate allied army.
    //       * perPlayerTechCards: true when per-player tech is enabled. This referee does not
    //             use it directly, but it comes with the options struct and should imply
    //             sharedControl has already been forced false by earlier code.
    //       * connectedClients: an array of connected campaign clients for this fight. Its
    //             length is the number of human slots/armies this referee prepares.
    //             Each client object within the array has an id, name, role ('host' or 'viewer')
    //             and loading status (loading = true or loading = false).
    //       * playerColors: for unshared control, the preferred resolved color pairs in the
    //             same host-first order that gw_lobby uses to assign clients to armies. The
    //             shared color module repairs malformed or missing pairs before assignment.
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
            console.log('[GW COOP] Co-op referee called without co-op options.');
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
            prepared = splitHumanArmiesForUnsharedControl(config, playerCount, options.playerColors);
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
