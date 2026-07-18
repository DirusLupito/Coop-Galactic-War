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

    var colorsEqual = function(a, b) {
        return !!(a && b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2]);
    };

    var isValidColor = function(color) {
        return _.isArray(color) && color.length === 3 && _.every(color, function(channel) {
            return _.isNumber(channel)
                && _.isFinite(channel)
                && Math.floor(channel) === channel
                && channel >= 0
                && channel <= 255;
        });
    };

    var isValidColorPair = function(colorPair) {
        return _.isArray(colorPair)
            && colorPair.length === 2
            && isValidColor(colorPair[0])
            && isValidColor(colorPair[1]);
    };

    var colorIsAlreadyInList = function(color, colors) {
        return _.some(colors, function(existingColor) {
            return colorsEqual(color, existingColor);
        });
    };

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
        if (!customGameLobbyColorTable) {
            customGameLobbyColorTable = _.map(CUSTOM_GAME_LOBBY_BASE_COLORS, adjustCustomGameLobbyColor);
        }

        return customGameLobbyColorTable;
    };

    var colorDistanceSquared = function(a, b) {
        var red = a[0] - b[0];
        var green = a[1] - b[1];
        var blue = a[2] - b[2];

        return (red * red) + (green * green) + (blue * blue);
    };

    var getCustomGameLobbyPrimaryColorsBySimilarity = function(hostPrimaryColor) {
        var candidates = [];

        _.forEach(getCustomGameLobbyColorTable(), function(color) {
            if (!colorIsAlreadyInList(color, _.map(candidates, 'color'))) {
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

    var getValidatedFactionPrimaryColors = function(faction, factionColor) {
        if (!faction || !isValidColorPair(faction.color)) {
            console.log('[GW COOP] Cannot resolve player colors without a valid faction definition color.');
            return undefined;
        }

        if (!_.isEqual(faction.color, factionColor)) {
            console.log('[GW COOP] Saved player color does not match the active faction definition.');
            return undefined;
        }

        // coopPlayerColors is optional so older third-party factions continue to use
        // the deterministic custom-lobby fallback without changing their definition.
        if (!_.has(faction, 'coopPlayerColors')) {
            return [_.cloneDeep(factionColor[0])];
        }

        if (!_.isArray(faction.coopPlayerColors) || !faction.coopPlayerColors.length) {
            console.log('[GW COOP] Faction co-op player colors must be a non-empty array.');
            return undefined;
        }

        var validatedColors = [];
        var valid = _.every(faction.coopPlayerColors, function(color, index) {
            if (!isValidColor(color)) {
                console.log('[GW COOP] Faction co-op player color at index ' + index + ' is invalid.');
                return false;
            }

            if (colorIsAlreadyInList(color, validatedColors)) {
                console.log('[GW COOP] Faction co-op player color at index ' + index + ' duplicates an earlier color.');
                return false;
            }

            validatedColors.push(_.cloneDeep(color));
            return true;
        });

        if (!valid) {
            return undefined;
        }

        if (!colorsEqual(validatedColors[0], factionColor[0])) {
            console.log('[GW COOP] First faction co-op player color must match the faction primary color.');
            return undefined;
        }

        return validatedColors;
    };

    var resolvePlayerColorPairs = function(playerCount, faction, factionColor) {
        if (!_.isNumber(playerCount) || !_.isFinite(playerCount) || Math.floor(playerCount) !== playerCount || playerCount < 1) {
            console.log('[GW COOP] Cannot resolve player colors for invalid player count ' + playerCount + '.');
            return [];
        }

        if (!isValidColorPair(factionColor)) {
            console.log('[GW COOP] Cannot resolve player colors without a valid saved faction color pair.');
            return [];
        }

        var factionPrimaryColors = getValidatedFactionPrimaryColors(faction, factionColor);
        if (!factionPrimaryColors) {
            return [];
        }

        var usedPrimaryColors = _.cloneDeep(factionPrimaryColors);
        var colorPairs = [_.cloneDeep(factionColor)];

        _.forEach(factionPrimaryColors.slice(1), function(primaryColor) {
            if (colorPairs.length < playerCount) {
                colorPairs.push([
                    _.cloneDeep(primaryColor),
                    _.cloneDeep(factionColor[1])
                ]);
            }
        });

        _.forEach(getCustomGameLobbyPrimaryColorsBySimilarity(factionColor[0]), function(primaryColor) {
            if (colorPairs.length < playerCount && !colorIsAlreadyInList(primaryColor, usedPrimaryColors)) {
                usedPrimaryColors.push(_.cloneDeep(primaryColor));
                colorPairs.push([
                    _.cloneDeep(primaryColor),
                    _.cloneDeep(factionColor[1])
                ]);
            }
        });

        if (colorPairs.length < playerCount) {
            console.log('[GW COOP] Not enough distinct player colors for ' + playerCount + ' player armies.');
        }

        return colorPairs;
    };

    return {
        resolvePlayerColorPairs: resolvePlayerColorPairs
    };
});
