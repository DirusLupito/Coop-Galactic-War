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
    var EMERGENCY_GW_PLAYER_COLOR = [[210, 50, 44], [51, 151, 197]];

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
    // host's primary color. Preferred faction colors are used before this list.
    var getCustomGameLobbyPrimaryColorsBySimilarity = function(hostPrimaryColor) {
        var candidates = [];

        _.forEach(getCustomGameLobbyColorTable(), function(color) {
            if (!colorIsAlreadyInCandidates(color, candidates)) {
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

    var getHostColorPair = function(faction, factionColor) {
        if (isValidColorPair(factionColor)) {
            return _.cloneDeep(factionColor);
        }

        console.log('[GW COOP] Saved player color is invalid; using faction color data instead.');

        if (faction && isValidColorPair(faction.color)) {
            return _.cloneDeep(faction.color);
        }

        if (faction
                && _.isArray(faction.coopPlayerColors)
                && isValidColor(faction.coopPlayerColors[0])) {
            console.log('[GW COOP] Faction color pair is invalid; using the co-op palette host primary with the emergency secondary.');
            return [
                _.cloneDeep(faction.coopPlayerColors[0]),
                _.cloneDeep(EMERGENCY_GW_PLAYER_COLOR[1])
            ];
        }

        console.log('[GW COOP] No valid saved or faction player color exists; using the emergency player color.');
        return _.cloneDeep(EMERGENCY_GW_PLAYER_COLOR);
    };

    var getPreferredFactionPrimaryColors = function(faction, hostColorPair) {
        // coopPlayerColors is optional so older third-party factions continue to use
        // the deterministic custom-lobby fallback without changing their definition.
        if (!faction || !_.has(faction, 'coopPlayerColors')) {
            return [];
        }

        if (!_.isArray(faction.coopPlayerColors)) {
            console.log('[GW COOP] Faction co-op player colors must be an array; using custom-lobby fallback colors.');
            return [];
        }

        if (!faction.coopPlayerColors.length) {
            console.log('[GW COOP] Faction co-op player colors are empty; using custom-lobby fallback colors.');
            return [];
        }

        var paletteHostPrimary = faction.coopPlayerColors[0];
        if (!isValidColor(paletteHostPrimary)) {
            console.log('[GW COOP] Faction co-op player host color at index 0 is invalid; the actual host color will be used.');
        } else if (isValidColorPair(faction.color) && !colorsEqual(paletteHostPrimary, faction.color[0])) {
            console.log('[GW COOP] Faction co-op player host color does not match the faction definition primary; the actual host color will be used.');
        }

        var validatedColors = [];
        _.forEach(faction.coopPlayerColors.slice(1), function(color, index) {
            var paletteIndex = index + 1;
            if (!isValidColor(color)) {
                console.log('[GW COOP] Faction co-op player color at index ' + paletteIndex + ' is invalid; skipping it.');
                return;
            }

            // Faction definitions store raw RGB values. Apply the same brightness
            // mutation as custom-lobby colors before assigning or deduplicating them.
            var adjustedColor = adjustCustomGameLobbyColor(color);
            if (colorsEqual(adjustedColor, hostColorPair[0])
                    || colorIsAlreadyInList(adjustedColor, validatedColors)) {
                console.log('[GW COOP] Faction co-op player color at index ' + paletteIndex + ' duplicates an assigned primary after adjustment; skipping it.');
                return;
            }

            validatedColors.push(adjustedColor);
        });

        return validatedColors;
    };

    var buildPlayerColorPairs = function(playerCount, hostColorPair, preferredPrimaryColors) {
        var usedPrimaryColors = [_.cloneDeep(hostColorPair[0])];
        var colorPairs = [_.cloneDeep(hostColorPair)];

        _.forEach(preferredPrimaryColors, function(primaryColor) {
            if (colorPairs.length < playerCount) {
                if (colorIsAlreadyInList(primaryColor, usedPrimaryColors)) {
                    return;
                }

                usedPrimaryColors.push(_.cloneDeep(primaryColor));
                colorPairs.push([
                    _.cloneDeep(primaryColor),
                    _.cloneDeep(hostColorPair[1])
                ]);
            }
        });

        var fallbackPrimaryColors = getCustomGameLobbyPrimaryColorsBySimilarity(hostColorPair[0]);
        _.forEach(fallbackPrimaryColors, function(primaryColor) {
            if (colorPairs.length < playerCount && !colorIsAlreadyInList(primaryColor, usedPrimaryColors)) {
                usedPrimaryColors.push(_.cloneDeep(primaryColor));
                colorPairs.push([
                    _.cloneDeep(primaryColor),
                    _.cloneDeep(hostColorPair[1])
                ]);
            }
        });

        if (colorPairs.length < playerCount) {
            console.log('[GW COOP] Not enough distinct player colors for ' + playerCount + ' player armies; reusing valid colors.');
            var reusablePrimaryColors = _.map(colorPairs.slice(1), function(colorPair) {
                return colorPair[0];
            });
            if (!reusablePrimaryColors.length) {
                reusablePrimaryColors.push(hostColorPair[0]);
            }

            var reuseIndex = 0;
            while (colorPairs.length < playerCount) {
                colorPairs.push([
                    _.cloneDeep(reusablePrimaryColors[reuseIndex % reusablePrimaryColors.length]),
                    _.cloneDeep(hostColorPair[1])
                ]);
                reuseIndex++;
            }
        }

        return colorPairs;
    };

    var resolvePlayerColorPairs = function(playerCount, faction, factionColor) {
        if (!_.isNumber(playerCount) || !_.isFinite(playerCount) || Math.floor(playerCount) !== playerCount || playerCount < 1) {
            console.log('[GW COOP] Cannot resolve player colors for invalid player count ' + playerCount + '.');
            return [];
        }

        var hostColorPair = getHostColorPair(faction, factionColor);
        var preferredPrimaryColors = getPreferredFactionPrimaryColors(faction, hostColorPair);
        return buildPlayerColorPairs(playerCount, hostColorPair, preferredPrimaryColors);
    };

    var normalizePlayerColorPairs = function(playerCount, playerColors, hostColor) {
        if (!_.isNumber(playerCount) || !_.isFinite(playerCount) || Math.floor(playerCount) !== playerCount || playerCount < 1) {
            console.log('[GW COOP] Cannot normalize player colors for invalid player count ' + playerCount + '.');
            return [];
        }

        var hostColorPair;
        if (isValidColorPair(hostColor)) {
            hostColorPair = _.cloneDeep(hostColor);
        } else if (_.isArray(playerColors) && isValidColorPair(playerColors[0])) {
            console.log('[GW COOP] Generated host color is invalid; using the resolved host color instead.');
            hostColorPair = _.cloneDeep(playerColors[0]);
        } else {
            console.log('[GW COOP] Generated and resolved host colors are invalid; using the emergency player color.');
            hostColorPair = _.cloneDeep(EMERGENCY_GW_PLAYER_COLOR);
        }

        if (!_.isArray(playerColors)) {
            console.log('[GW COOP] Resolved player colors are not an array; rebuilding them from fallback colors.');
            playerColors = [];
        } else if (playerColors.length !== playerCount) {
            console.log('[GW COOP] Expected ' + playerCount + ' resolved player color pairs, found ' + playerColors.length + '; rebuilding missing colors from fallback colors.');
        }

        var preferredPrimaryColors = [];
        _.forEach(playerColors.slice(1), function(colorPair, index) {
            var colorIndex = index + 1;
            if (!isValidColorPair(colorPair)) {
                console.log('[GW COOP] Resolved player color pair at index ' + colorIndex + ' is invalid; replacing it with a fallback color.');
                return;
            }

            if (!colorsEqual(colorPair[1], hostColorPair[1])) {
                console.log('[GW COOP] Resolved player color pair at index ' + colorIndex + ' has a different secondary; using the host secondary.');
            }

            var adjustedPrimaryColor = adjustCustomGameLobbyColor(colorPair[0]);
            if (colorsEqual(adjustedPrimaryColor, hostColorPair[0])
                    || colorIsAlreadyInList(adjustedPrimaryColor, preferredPrimaryColors)) {
                console.log('[GW COOP] Resolved player color pair at index ' + colorIndex + ' duplicates an assigned primary after adjustment; replacing it with a fallback color.');
                return;
            }

            preferredPrimaryColors.push(adjustedPrimaryColor);
        });

        return buildPlayerColorPairs(playerCount, hostColorPair, preferredPrimaryColors);
    };

    return {
        resolvePlayerColorPairs: resolvePlayerColorPairs,
        normalizePlayerColorPairs: normalizePlayerColorPairs
    };
});
