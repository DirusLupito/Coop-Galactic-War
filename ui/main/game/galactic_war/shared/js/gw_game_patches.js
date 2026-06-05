define([], function() {
    var patches = [
        // 0 = Fix bad start card tags
        function(game) {
            var tags = game.inventory().tags();
            var deleteMe = [];
            _.forIn(tags, function(value, context) {
                if (context.startsWith('gwc_start')) {
                    deleteMe.push(context);
                }
            });
            _.forEach(deleteMe, function(badContext) {
                delete tags[badContext];
            });
            game.inventory().applyCards();
        },

        // 1 = Change commander format
        function(game) {
            var commander = game.inventory().getTag('global', 'commander');
            if (commander && commander.UnitSpec)
                game.inventory().setTag('global', 'commander', commander.UnitSpec);

            _.forEach(game.galaxy().stars(), function(star) {
                if (star.ai())
                {
                    var commander = star.ai().commander;
                    if (commander && commander.UnitSpec)
                    {
                        star.ai().commander = commander.UnitSpec;
                        star.ai.valueHasMutated();
                    }
                }
            });

            _.forEach(game.inventory().cards, function(card) {
                if (card.minion && card.minion.commander && card.minion.commander.UnitSpec)
                    card.minion.commander = card.minion.commander.UnitSpec;
            });

            _.forEach(game.inventory().minions(), function(minion) {
                if (minion.commander && minion.commander.UnitSpec)
                    minion.commander = minion.commander.UnitSpec;
            });
        },

        // 2 = Change commander format for AI minions (whoops. forgot to do so in version 1.)
        function(game) {
            _.forEach(game.galaxy().stars(), function(star) {
                if (star.ai())
                {
                    var hasMutated = false;
                    _.forEach(star.ai().minions, function(minion) {
                        if (_.has(minion, ['commander', 'UnitSpec']))
                        {
                            minion.commander = minion.commander.UnitSpec;
                            hasMutated = true;
                        }
                    });

                    if (hasMutated)
                        star.ai.valueHasMutated();
                }
            });
        },

        // 3 = Add co-op GW save state.
        function(game) {
            if (!_.isFunction(game.coopPlayers)) {
                game.coopPlayers = ko.observable(1);
            }

            if (!_.isFunction(game.coopPlayersSpecified)) {
                game.coopPlayersSpecified = ko.observable(true);
            }

            if (!_.isFunction(game.lockCoopPlayers)) {
                game.lockCoopPlayers = ko.observable(false);
            }

            if (!_.isFunction(game.sharedByDefault)) {
                game.sharedByDefault = ko.observable(true);
            }

            if (!_.isFunction(game.perPlayerTechCards)) {
                game.perPlayerTechCards = ko.observable(false);
            }

            // As of version 3, we can't have each player
            // get their own tech cards and be in shared armies.
            if (game.perPlayerTechCards()) {
                game.sharedByDefault(false);
            }

            if (!_.isFunction(game.coopPlayerInventoryData)) {
                game.coopPlayerInventoryData = ko.observableArray([]);
            }

            if (!_.isFunction(game.hostTechCardDealHistory)) {
                game.hostTechCardDealHistory = ko.observableArray([]);
            }

            if (!_.isFunction(game.hostTechCardDealCount)) {
                game.hostTechCardDealCount = ko.observable(game.hostTechCardDealHistory().length);
            }
        },
    ];

    return {
        patch: function(game, targetVersion) {
            while (game.version() !== targetVersion) {
                var version = game.version() || 0;
                var patch = patches[version];
                if (patch) {
                    patch(game);
                    game.version(version + 1);
                }
                else {
                    console.error("Patch not found for version", game.version());
                    break;
                }
            }
        }
    };
});
