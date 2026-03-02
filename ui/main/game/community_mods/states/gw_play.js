/**
 * @copyright (C)COPYRIGHT 2016-2021 Planetary Annihilation Inc. All rights reserved.
 */

// !LOCNS:community_mods

function CommunityModsGW() {
    if (!model.game())
        return;

    var galaxy = model.game().galaxy();

    if (!galaxy)
        return;

    galaxy.pathBetween = function (from, to, noFog) {
        var toExplored = galaxy.stars()[to].explored();

        var neighborsMap = galaxy.neighborsMap();

        var checked = {};

        var worklist = [[from]];

        while (worklist.length > 0) {
            var path = worklist.shift();
            var node = path[path.length - 1];
            var nodeNeighbors = neighborsMap[node];

            checked[node] = true;

            for (var neighbor = 0; neighbor < nodeNeighbors.length; ++neighbor) {
                var other = nodeNeighbors[neighbor];

                if (checked[other])
                    continue; // ignore loop

                if (other === to) {
                    var previous = _.last(path);

                    // prevent pathing through unexplored systems for fog of war

                    var explored = galaxy.stars()[previous].explored() || toExplored;

                    if (!explored && !noFog)
                        continue;

                    path.push(other);

                    return path;
                }

                var otherStar = galaxy.stars()[other];
                var otherVisited = otherStar.history().length > 0;

                var valid = noFog ? otherVisited : otherStar.explored();

                if (valid) {
                    var newPath = _.cloneDeep(path);
                    newPath.push(other);
                    worklist.push(newPath);
                }
            }
        }

        return null;
    };

}

try {
    CommunityModsGW();
}
catch (e) {
    console.trace(JSON.stringify(e));
}
