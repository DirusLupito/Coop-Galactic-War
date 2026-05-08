var model;
var handlers;

requireGW([
    'shared/gw_common',
    'shared/gw_inventory',
    'shared/gw_start_loadouts',
    'pages/gw_start/gw_dealer'
], function(
    GW,
    GWInventory,
    GWStartLoadouts,
    GWDealer
) {
    $(document).ready(function() {
        var DEFAULT_TARGET = 'coui://ui/main/game/galactic_war/gw_play/gw_play.html?gw_campaign=1';
        var gwCampaignTarget = $.url().param('target') || DEFAULT_TARGET;
        var AUTHORITATIVE_GAME_ID_KEY = 'gw_campaign_authoritative_game_id';

        function UnknownCardViewModel(cardData) {
            var self = this;

            self.id = ko.computed(function() { });
            self.icon = ko.observable();
            self.description = ko.observable('');
            self.activate = function() {};
            self.active = ko.observable(false);
            self.btnClass = ko.observable('btn_std');

            var actualCard = new CardViewModel(cardData);
            actualCard.card.then(function(card) {
                if (!card.hint)
                    return;
                var hint = card.hint(cardData);
                self.icon(hint.icon);
                self.description(hint.description || '');
            });
        }

        function CoopPerPlayerLoadoutViewModel() {
            var self = this;

            self.activeGameId = ko.observable().extend({ local: 'gw_active_game' });
            self.gwCampaignEnabled = ko.observable(true).extend({ session: 'gw_campaign_enabled' });
            self.gwCampaignRole = ko.observable('viewer').extend({ session: 'gw_campaign_role' });
            self.uberId = ko.observable().extend({ session: 'uberId' });
            self.displayName = ko.observable().extend({ session: 'displayName' });
            self.transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
            self.transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
            self.transitDestination = ko.observable().extend({ session: 'transit_destination' });
            self.transitDelay = ko.observable().extend({ session: 'transit_delay' });
            self.submitting = ko.observable(false);
            self.navigating = false;
            self.cancelled = false;

            self.sendMessage = function(messageType, payload, callback) {
                if (_.isFunction(self.send_message))
                    self.send_message(messageType, payload || {}, callback);
            };

            self.commanders = ko.observableArray();
            self.backupCommander = '/pa/units/commanders/raptor_centurion/raptor_centurion.json';
            var preferredCommander = ko.observable().extend({ local: 'preferredCommander_v2' });
            var selectedCommanderIndex = ko.observable(-1);

            self.selectedCommander = ko.computed(function() {
                var index = selectedCommanderIndex();
                if (index >= self.commanders().length || index < 0)
                    return self.backupCommander;

                return self.commanders()[index];
            });

            self.nextCommander = function() {
                selectedCommanderIndex(selectedCommanderIndex() === self.commanders().length - 1 ? 0 : selectedCommanderIndex() + 1);
            };

            self.prevCommander = function() {
                selectedCommanderIndex(selectedCommanderIndex() === 0 ? self.commanders().length - 1 : selectedCommanderIndex() - 1);
            };

            CommanderUtility.afterCommandersLoaded(function() {
                self.commanders(_.filter(CommanderUtility.getKnownCommanders(), function(commander) {
                    return PlayFab.isCommanderOwned(CommanderUtility.bySpec.getObjectName(commander));
                }));

                var commanderIndex = Math.floor(Math.random() * self.commanders().length);
                if (preferredCommander()) {
                    var commander = preferredCommander();
                    if (_.has(commander, 'UnitSpec'))
                        commander = commander.UnitSpec;
                    commanderIndex = _.indexOf(self.commanders(), commander);
                }

                selectedCommanderIndex(Math.max(commanderIndex, 0));
            });

            self.startCards = ko.observableArray();
            self.activeStartCardIndex = ko.observable(0);
            self.activeStartCard = ko.computed(function() {
                return self.startCards()[self.activeStartCardIndex()];
            });

            self.makeUnknown = function(cardData) {
                return new UnknownCardViewModel(cardData);
            };

            self.makeKnown = function(cardData) {
                var card = new CardViewModel(cardData);
                card.active = ko.computed(function() {
                    return self.activeStartCard() === card;
                });
                card.btnClass = ko.computed(function() {
                    return card.active() ? 'card_active' : 'card';
                });
                card.activate = function() {
                    self.activeStartCardIndex(self.startCards().indexOf(card));
                };
                return card;
            };

            self.startCards(GWStartLoadouts.buildStartLoadoutCards({
                bank: GW.bank,
                makeKnown: self.makeKnown,
                makeUnknown: self.makeUnknown
            }));

            self.ready = ko.computed(function() {
                return !!self.activeStartCard() && !!self.activeStartCard().id() && !!self.selectedCommander();
            });

            self.navToMainMenu = function() {
                self.cancelled = true;
                self.gwCampaignEnabled(false);
                self.gwCampaignRole('solo');
                self.sendMessage('leave_gw_campaign', {});

                try {
                    sessionStorage.removeItem(AUTHORITATIVE_GAME_ID_KEY);
                }
                catch (e) {
                }

                self.transitPrimaryMessage(loc('!LOC:Leaving GW Co-op Session'));
                self.transitSecondaryMessage('');
                self.transitDestination('coui://ui/main/game/start/start.html');
                self.transitDelay(0);
                window.location.href = 'coui://ui/main/game/transit/transit.html';
            };

            self.cancel = function() {
                self.navToMainMenu();
            };

            self.finish = function() {
                if (self.navigating || self.cancelled)
                    return;

                self.navigating = true;
                window.location.href = gwCampaignTarget;
            };

            self.saveSnapshot = function(payload) {
                var done = $.Deferred();
                if (!payload || !payload.snapshot || !payload.snapshot.game) {
                    done.resolve(false);
                    return done.promise();
                }

                var hydratedGame = new GW.Game();
                hydratedGame.load(payload.snapshot.game).always(function() {
                    GW.manifest.saveGame(hydratedGame).then(function() {
                        self.activeGameId(hydratedGame.id);
                        try {
                            sessionStorage.setItem(AUTHORITATIVE_GAME_ID_KEY, String(hydratedGame.id));
                        }
                        catch (e) {
                        }
                        done.resolve(true);
                    }, function(err) {
                        console.error('[GW COOP] coop loadout failed to save snapshot', err);
                        done.resolve(false);
                    });
                });

                return done.promise();
            };

            self.buildStartingInventory = function(loadoutCardId, commander, galaxy, star) {
                var result = $.Deferred();
                var dealInventory = new GWInventory();
                dealInventory.setTag('global', 'commander', commander);

                GWDealer.dealCard({
                    id: loadoutCardId,
                    inventory: dealInventory,
                    galaxy: galaxy,
                    star: star
                }).then(function(startCardProduct) {
                    var inventory = new GWInventory();
                    inventory.load({
                        cards: [startCardProduct || { id: loadoutCardId }],
                        tags: {
                            global: {
                                commander: commander
                            }
                        }
                    });
                    inventory.applyCards(function() {
                        var savedInventory = inventory.save();
                        var cards = savedInventory.cards || [];
                        if (!cards.length || cards[0].id !== loadoutCardId || !_.isNumber(savedInventory.maxCards) || savedInventory.maxCards <= cards.length) {
                            console.error('[GW COOP] Co-op loadout inventory did not produce empty tech banks loadout=' + loadoutCardId + ' maxCards=' + savedInventory.maxCards + ' cards=' + JSON.stringify(cards));
                            result.reject('Co-op loadout inventory did not produce empty tech banks.');
                            return;
                        }

                        result.resolve(savedInventory);
                    });
                }, function(err) {
                    result.reject(err);
                });

                return result.promise();
            };

            self.submitLoadout = function() {
                if (!self.ready() || self.submitting()) {
                    return;
                }

                var gameId = self.activeGameId();
                if (!gameId) {
                    console.log('[GW COOP] Cannot submit co-op loadout without active game id.');
                    return;
                }

                self.submitting(true);
                self.sendMessage('set_loading', {
                    loading: true,
                    loading_status: 'picking_loadout'
                });

                GW.manifest.loadGame(gameId).then(function(game) {
                    if (!game) {
                        console.log('[GW COOP] Cannot submit co-op loadout without loaded campaign game.');
                        self.submitting(false);
                        return;
                    }

                    var galaxy = game.galaxy && game.galaxy();
                    var origin = galaxy && _.isFunction(galaxy.origin) ? galaxy.origin() : undefined;
                    var star = galaxy && _.isFunction(galaxy.stars) ? galaxy.stars()[origin] : undefined;
                    if (!galaxy || !star) {
                        console.log('[GW COOP] Cannot submit co-op loadout without campaign galaxy origin.');
                        self.submitting(false);
                        return;
                    }

                    var commander = self.selectedCommander();
                    var loadoutCardId = self.activeStartCard().id();
                    self.buildStartingInventory(loadoutCardId, commander, galaxy, star).then(function(savedInventory) {
                        self.sendMessage('set_player_loadout', {
                            player_id: self.uberId(),
                            player_name: self.displayName(),
                            commander: commander,
                            loadout_card_id: loadoutCardId,
                            inventory: savedInventory,
                            updated_at: _.now()
                        }, function(success, response) {
                            if (!success) {
                                console.log('[GW COOP] set_player_loadout failed response=' + JSON.stringify(response || {}));
                                self.submitting(false);
                            }
                        });
                    }, function(err) {
                        console.error('[GW COOP] Cannot build co-op starting inventory.', err);
                        self.submitting(false);
                    });
                }, function(err) {
                    console.error('[GW COOP] Cannot load campaign game for co-op loadout.', err);
                    self.submitting(false);
                });
            };
        }

        model = new CoopPerPlayerLoadoutViewModel();
        handlers = {};

        handlers.gw_campaign_loadout_complete = function(payload) {
            if (payload && payload.snapshot) {
                console.log('[GW COOP] co-op loadout complete with snapshot.');
                model.saveSnapshot(payload).always(model.finish);
            }
            else {
                console.log('[GW COOP] co-op loadout complete recv without snapshot');
                model.finish();
            }
        };

        handlers.gw_campaign_snapshot = function(payload) {
            console.log('[GW COOP] co-op loadout snapshot recv seq=' + (payload && payload.seq));
            model.saveSnapshot(payload);
        };

        handlers.connection_disconnected = function() {
            if (!model.navigating)
                model.navToMainMenu();
        };

        handlers.login_rejected = function() {
            model.navToMainMenu();
        };

        if (window.CommunityMods) {
            try {
                CommunityMods();
            } catch (e) {
                console.error(e);
            }
        }

        loadSceneMods('gw_coop_per_player_loadout');
        app.registerWithCoherent(model, handlers);
        ko.applyBindings(model);
        app.hello(function(payload) {
            if (payload && payload.data && payload.data.client && payload.data.client.role)
                model.gwCampaignRole(payload.data.client.role);

            model.sendMessage('set_loading', {
                loading: true,
                loading_status: 'picking_loadout'
            });
        }, handlers.connection_disconnected);
    });
});
