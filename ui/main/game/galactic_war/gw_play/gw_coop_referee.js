define(function() {

    // In the following code, a color is essentially a type of array containing three integers
    // (R, G, B) which must be in the range 0-255.

    // Mirrors the custom-game lobby color table from server-script/lobby/color_table.js.
    // The lobby table defines the familiar set of possible primary colors from
    // custom-game lobbies. Co-op only uses those primary colors; every generated
    // player keeps the host's secondary color.
    //
    // This copy intentionally keeps the same source colors and brightness adjustment
    // instead of hand-writing the final adjusted values. That makes it easier to
    // compare this table against the server-side original if the lobby palette changes.
    var CUSTOM_GAME_LOBBY_COLOR_BRIGHTNESS_ADJUSTMENT = 14 / 16;
    var CUSTOM_GAME_LOBBY_BASE_COLORS = [
        [142, 107, 68],
        [74, 43, 0],
        [139, 69, 19],
        [255, 0, 0],
        [128, 0, 0],
        [161, 59, 59],
        [255, 120, 47],
        [255, 200, 0],
        [139, 128, 0],
        [255, 255, 0],
        [0, 255, 255],
        [127, 255, 212],
        [70, 70, 70],
        [128, 128, 128],
        [164, 164, 164],
        [215, 215, 215],
        [160, 32, 240],
        [128, 0, 255],
        [75, 0, 130],
        [84, 44, 94],
        [22, 52, 102],
        [59, 54, 182],
        [0, 128, 255],
        [51, 151, 197],
        [100, 149, 237],
        [176, 224, 230],
        [147, 122, 219],
        [54, 78, 102],
        [0, 128, 128],
        [72, 89, 61],
        [50, 184, 50],
        [0, 255, 0],
        [0, 128, 0],
        [0, 255, 128],
        [32, 178, 170],
        [0, 250, 154],
        [124, 252, 0],
        [154, 205, 50],
        [240, 230, 140],
        [255, 255, 224],
        [255, 218, 185],
        [255, 182, 193],
        [255, 160, 122],
        [250, 128, 114],
        [255, 99, 71],
        [255, 69, 0],
        [199, 21, 133],
        [255, 0, 255],
        [218, 112, 214],
        [255, 105, 180]
    ];
    var customGameLobbyColorTable;

    var adjustCustomGameLobbyColor = function(color) {
        var adjusted = _.cloneDeep(color);

        if (adjusted[0] === 255 || adjusted[1] === 255 || adjusted[2] === 255) {
            adjusted = _.map(adjusted, function(channel) {
                return Math.round(channel * CUSTOM_GAME_LOBBY_COLOR_BRIGHTNESS_ADJUSTMENT);
            });
        }

        return adjusted;
    };

    var getCustomGameLobbyColorTable = function() {
        if (customGameLobbyColorTable) {
            return customGameLobbyColorTable;
        }

        customGameLobbyColorTable = _.map(CUSTOM_GAME_LOBBY_BASE_COLORS, adjustCustomGameLobbyColor);
        return customGameLobbyColorTable;
    };

    var colorsEqual = function(a, b) {
        return !!(a && b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2]);
    };

    // Squared RGB distance. We do not need the actual Euclidean distance because
    // this is only used for sorting by similarity, and sqrt would preserve order.
    var colorDistanceSquared = function(a, b) {
        var red = a[0] - b[0];
        var green = a[1] - b[1];
        var blue = a[2] - b[2];

        return (red * red) + (green * green) + (blue * blue);
    };

    var colorIsAlreadyInCandidates = function(color, candidates) {
        return _.some(candidates, function(candidate) {
            return colorsEqual(color, candidate.color);
        });
    };

    // Sort custom-lobby primary colors from most similar to least similar to the
    // host's primary color. The host still keeps its exact GW faction color.
    // Non-host armies then walk this sorted primary palette in order while all
    // using the host's secondary color. If the exact host primary exists in the
    // custom-game palette, skip it so player 2 does not get the same primary.
    var getCustomGameLobbyPrimaryColorsBySimilarity = function(hostPrimaryColor) {
        var colorTable = getCustomGameLobbyColorTable();
        var candidates = [];

        _.forEach(colorTable, function(color) {
            if (!colorsEqual(color, hostPrimaryColor) && !colorIsAlreadyInCandidates(color, candidates)) {
                candidates.push({
                    color: _.cloneDeep(color),
                    distance: colorDistanceSquared(color, hostPrimaryColor)
                });
            }
        });

        candidates = _.sortBy(candidates, function(candidate) {
            return candidate.distance;
        });

        return _.map(candidates, function(candidate) {
            return candidate.color;
        });
    };

    var getColorPairsForPlayerArmies = function(playerCount, factionColor) {
        var sortedPrimaryColors = getCustomGameLobbyPrimaryColorsBySimilarity(factionColor[0]);
        var colorPairs = [_.cloneDeep(factionColor)];

        if (playerCount - 1 > sortedPrimaryColors.length) {
            console.log('[GW COOP] Not enough custom-game lobby primary colors for ' + playerCount + ' player armies.');
        }

        while (colorPairs.length < playerCount && colorPairs.length - 1 < sortedPrimaryColors.length) {
            colorPairs.push([
                _.cloneDeep(sortedPrimaryColors[colorPairs.length - 1]),
                _.cloneDeep(factionColor[1])
            ]);
        }

        return colorPairs;
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

        var colorPairs = getColorPairsForPlayerArmies(playerCount, humanTemplate.color);

        if (colorPairs.length !== playerCount) {
            console.log('[GW COOP] Expected ' + playerCount + ' player color pairs, found ' + colorPairs.length + '.');
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
                color: colorPairs[index],
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
    //             keeps the original color and later human armies get nearby custom-lobby primaries.
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
