var model;
var handlers;
var p;

requireGW([
    'require',
    'shared/gw_common',
    'shared/gw_factions',
    'shared/popup',
    'shared/vecmath',
    'pages/gw_play/gw_referee',
    'pages/gw_play/gw_play_nebulae',
    'pages/gw_start/gw_dealer',
], function(
    require,
    GW,
    GWFactions,
    PopUp,
    VMath,
    GWReferee,
    nebulae,
    dealer
) {
    p = PopUp;

    var REQUIRED_CLIENT_MODS_SESSION_KEY = 'gw_required_client_mod_identifiers';

    var normalizeModIdentifier = function(identifier) {
        if (!_.isString(identifier))
            return '';

        var trimmed = identifier.trim();
        if (!trimmed.length)
            return '';

        return trimmed.toLowerCase();
    };

    var readRequiredClientModIdentifiers = function() {
        var raw = sessionStorage.getItem(REQUIRED_CLIENT_MODS_SESSION_KEY);
        if (raw === null)
            return [];

        var parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (e) {
            console.log('[GW_COOP] invalid required client mod session payload in gw_play; defaulting to empty list');
            parsed = [];
        }

        if (!_.isArray(parsed))
            parsed = [];

        var normalized = [];
        var seen = {};
        _.forEach(parsed, function(identifier) {
            var normalizedIdentifier = normalizeModIdentifier(identifier);
            if (!normalizedIdentifier || seen[normalizedIdentifier])
                return;

            seen[normalizedIdentifier] = true;
            normalized.push(normalizedIdentifier);
        });
        console.log('[GW_COOP] read required client mod identifiers for gw_play', normalized);

        return normalized;
    };

    var extractRejectReason = function(payload) {
        if (_.isString(payload))
            return payload;

        if (!payload)
            return '';

        if (_.isString(payload.reason))
            return payload.reason;
        if (_.isString(payload.message))
            return payload.message;
        if (_.isString(payload.payload))
            return payload.payload;

        return '';
    };

    var sendClientModManifestFromScene = function(sceneName) {
        console.log('[GW COOP] sending client mod manifest from ' + sceneName);
        api.mods.getMounted('client', true).then(function(mountedMods) {
            var activeIdentifiers = [];
            var seen = {};

            _.forEach(mountedMods || [], function(mod) {
                var identifier = normalizeModIdentifier(mod && mod.identifier);
                if (!identifier || seen[identifier])
                    return;

                seen[identifier] = true;
                activeIdentifiers.push(identifier);
            });

            model.send_message('client_mod_manifest', {
                active_identifiers: activeIdentifiers
            }, function(success, response) {
                var rejectReason = extractRejectReason(response);
                console.log('[GW COOP] client_mod_manifest from ' + sceneName
                    + ' success=' + !!success
                    + ' active=' + JSON.stringify(activeIdentifiers)
                    + ' response=' + JSON.stringify(response || {}));

                if (_.isString(rejectReason) && rejectReason.indexOf('Missing required mods') === 0 && _.isFunction(model.disconnect))
                    model.disconnect();
            });
        }, function() {
            console.log('[GW COOP] getMounted(client,true) failed in ' + sceneName + '; sending empty manifest');
            model.send_message('client_mod_manifest', {
                active_identifiers: []
            }, function(success, response) {
                var rejectReason = extractRejectReason(response);
                console.log('[GW COOP] empty client_mod_manifest from ' + sceneName
                    + ' success=' + !!success
                    + ' response=' + JSON.stringify(response || {}));

                if (_.isString(rejectReason) && rejectReason.indexOf('Missing required mods') === 0 && _.isFunction(model.disconnect))
                    model.disconnect();
            });
        });
    };

    var buildRequiredLookupWithDependencies = function(requiredIdentifiers, installedClientModsById) {
        var lookup = {};

        var includeIdentifier = function(identifier) {
            var normalizedIdentifier = normalizeModIdentifier(identifier);
            if (!normalizedIdentifier || lookup[normalizedIdentifier])
                return;

            lookup[normalizedIdentifier] = true;

            var installed = installedClientModsById[normalizedIdentifier];
            if (!installed || !_.isArray(installed.dependencies))
                return;

            _.forEach(installed.dependencies, function(dependencyIdentifier) {
                includeIdentifier(dependencyIdentifier);
            });
        };

        _.forEach(requiredIdentifiers || [], function(identifier) {
            includeIdentifier(identifier);
        });

        return lookup;
    };

    var runWithRequiredClientModsOnly = function(requiredIdentifiers, work) {
        console.log('[GW_COOP] restricting client mods for gw_play', requiredIdentifiers);
        var communityModsManager = window.CommunityModsManager;
        var canRestrictClientMods = communityModsManager
            && _.isFunction(communityModsManager.installedMods)
            && communityModsManager.installedMods
            && _.isFunction(communityModsManager.installedMods.valueHasMutated)
            && _.isFunction(communityModsManager.remountClientMods);

        if (!canRestrictClientMods)
            return $.when(work());

        var done = $.Deferred();

        var installedMods = communityModsManager.installedMods();

        if (!_.isArray(installedMods))
            return $.when(work());

        var clientEnabledBefore = {};
        var installedClientModsById = {};

        _.forEach(installedMods, function(mod) {
            if (!mod || mod.context !== 'client')
                return;

            var identifier = normalizeModIdentifier(mod.identifier);
            if (!identifier)
                return;

            clientEnabledBefore[identifier] = !!mod.enabled;
            installedClientModsById[identifier] = mod;
        });

        var requiredLookup = buildRequiredLookupWithDependencies(requiredIdentifiers, installedClientModsById);

        _.forEach(installedMods, function(mod) {
            if (!mod || mod.context !== 'client')
                return;

            var identifier = normalizeModIdentifier(mod.identifier);
            if (!identifier)
                return;

            mod.enabled = !!requiredLookup[identifier];
        });

        communityModsManager.installedMods.valueHasMutated();
        console.log('[GW_COOP] gw_play restricting client mods for shared referee generation required=' + JSON.stringify(_.keys(requiredLookup)));

        communityModsManager.remountClientMods().always(function() {
            $.when(work()).always(function() {
                _.forEach(installedMods, function(mod) {
                    if (!mod || mod.context !== 'client')
                        return;

                    var identifier = normalizeModIdentifier(mod.identifier);
                    if (!identifier || !_.has(clientEnabledBefore, identifier))
                        return;

                    mod.enabled = clientEnabledBefore[identifier];
                });

                communityModsManager.installedMods.valueHasMutated();
                console.log('[GW_COOP] gw_play restoring full client mod set after shared referee generation');

                communityModsManager.remountClientMods().always(function() {
                    done.resolve();
                });
            });
        });

        return done.promise();
    };

    var hireRefereesForLaunch = function(game, isolateSharedSpecs) {
        console.log('[GW_COOP] hiring referees for gw_play launch; isolateSharedSpecs=' + !!isolateSharedSpecs);
        var done = $.Deferred();

        if (!isolateSharedSpecs) {
            GWReferee.hire(game).then(function(referee) {
                done.resolve({
                    sharedReferee: referee,
                    localReferee: undefined
                });
            });
            return done.promise();
        }

        var requiredIdentifiers = readRequiredClientModIdentifiers();

        var sharedReferee;
        var sharedRefereeReady = false;

        runWithRequiredClientModsOnly(requiredIdentifiers, function() {
            return GWReferee.hire(game).then(function(referee) {
                sharedReferee = referee;
                sharedRefereeReady = true;
            });
        }).always(function() {
            if (!sharedRefereeReady) {
                console.log('[GW_COOP] failed to build clean shared referee; aborting launch to avoid contaminated gw_config');
                done.resolve({
                    sharedReferee: undefined,
                    localReferee: undefined
                });
                return;
            }

            GWReferee.hire(game).then(function(localReferee) {
                done.resolve({
                    sharedReferee: sharedReferee,
                    localReferee: localReferee
                });
            });
        });

        return done.promise();
    };

    self.exitGame = function() {
        
        // In the case that the player is in a co-op campaign session, we need to make
        // sure that they save a local copy of their campaign before exiting so they can keep playing in single player mode.
        model.persistCampaignLocalCopy('exit_game').always(function() {
            model.transitPrimaryMessage(loc('!LOC:Returning to Main Menu'));
            model.transitSecondaryMessage('');
            model.transitDestination('coui://ui/main/game/start/start.html');
            model.transitDelay(0);
            window.location.href = 'coui://ui/main/game/transit/transit.html';
        });

        // No need to check if they are actually in a co-op campaign session since persistCampaignLocalCopy's
        // lines:
        // if (!self.gwCampaignEnabled()) {
        //     done.resolve();
        //     return done.promise();
        // }
        // should already handle that case and resolve immediately if they are not in a co-op campaign session.

    };

    // Convenience function for setting up easeljs bitmaps
    // Parameters:
    //   url: image url (or image element).
    //   size: Array specifying image size. (length-2 array)
    //   scale: (optional) Uniform scale.
    //   color: (optional) Apply a color filter. (length-3 array, normalized color space)
    //   noCache: (optional) Don't apply caching.  (Incompatible with color.)
    function createBitmap(params) {
        if (!params.url)
            throw "No URL specified";
        if (!params.size)
            throw "No size specified";

        var result = new createjs.Bitmap(params.url);
        result.x = 0;
        result.y = 0;
        result.regX = params.size[0] / 2;
        result.regY = params.size[1] / 2;

        var scale = params.scale;
        if (scale !== undefined) {
            result.scaleX = scale;
            result.scaleY = scale;
        }

        var color = params.color;
        result.color = ko.observable();
        if (color) {
            if (params.noCache)
                throw "noCache incompatible with color";
            result.color(color);
            var updateFilters = function() {
                var color = result.color();
                result.filters = [];
                if (color)
                    result.filters.push(new createjs.ColorFilter(color[0],color[1],color[2],color.length >= 4 ? color[3] : 1));
            };
            updateFilters();
            result.color.subscribe(function() {
                updateFilters();
                result.updateCache();
            });
        }

        if (params.alpha !== undefined)
            result.alpha = params.alpha;

        if (!params.noCache) {
            // Note: Extra pixel compensates for bad filtering on the edges
            result.cache(-1,-1, params.size[0] + 2, params.size[1] + 2);
            $(result.image).load(function() { result.updateCache(); });
        }
        return result;
    }

    function sortContainer(container) {
        container.sortChildren(function(a, b, options) {
            if (a.z === undefined) {
                if (b.z === undefined)
                    return 0;
                return -1;
            }
            else if (b.z === undefined) {
                return 1;
            }
            return a.z - b.z;
        });
    }

    var cheats = {
        noFog: ko.observable(false),
        jump: function(model, star) {
            var game = model.game();
            model.game().turnState('begin');
            model.player.moveTo(star, function(){
                game.currentStar(star);
            });
        },
        testCards: function(game) {
            var star = game.galaxy().stars()[game.currentStar()];
            require(['pages/gw_start/gw_dealer'], function(GWDealer) {
                GWDealer.allCards().then(function(cards) {
                    _.forEach(cards, function(card) {
                        if (card.id.startsWith('gwc_start')) {
                            api.debug.log('Skipping start card', card.id);
                        }
                        else {
                            api.debug.log('Dealing card', card.id);
                            GWDealer.dealCard({
                                id: card.id,
                                galaxy: game.galaxy(),
                                inventory: game.inventory(),
                                star: star
                            }).then(function(product, deal) {
                                if (product.id === 'gwc_minion') {
                                    // Minions tend to break things.
                                    require(['shared/gw_factions'], function(GWFactions) {
                                        _.forEach(GWFactions, function(faction) {
                                            _.forEach(faction.minions, function(minion) {
                                                var minionStock = _.cloneDeep(product);
                                                minionStock.minion = minion;
                                                api.debug.log(' ', product.id, '%', deal && deal.chance, minionStock);
                                                game.inventory().cards.push(minionStock);
                                                game.inventory().cards.pop();
                                                if (!minionStock.minion.commander) {
                                                    // This will use the player's commander
                                                    return;
                                                }

                                                if (!CommanderUtility.bySpec.getObjectName(minionStock.minion.commander)) {
                                                    console.error('Minion commander unitspec', minionStock.minion.commander, 'invalid');
                                                }
                                            });
                                        });
                                    });
                                }
                                else {
                                    api.debug.log(' ', product.id, '%', deal && deal.chance, product);
                                    game.inventory().cards.push(product)
                                    game.inventory().cards.pop();
                                }
                            });
                        }
                    });
                });
            });
        },
        giveCardId: ko.observable(''),
        giveCard: function(game) {
            var self = this;
            var star = game.galaxy().stars()[game.currentStar()];
            require(['pages/gw_start/gw_dealer'], function(GWDealer) {
                GWDealer.allCards().then(function(cards) {
                    var card = _.find(cards, {id: self.giveCardId()});
                    GWDealer.dealCard({
                        id: card.id,
                        galaxy: game.galaxy(),
                        inventory: game.inventory(),
                        star: star
                    }).then(function(product) {
                        game.inventory().cards.push(product);
                    });
                });
            });
        },
        loadGameText: ko.observable(''),
        loadGame: function(game) {
            var self = this;
            var newGameData;
            try {
                newGameData = JSON.parse(self.loadGameText());
            }
            catch (e) {
                // Load from server log
                var matched = /\] INFO Message from client [^\s-]* : ({.*\"gw\":.*})/.exec(self.loadGameText()).pop();
                var wrapper = JSON.parse(matched).payload;
                newGameData = wrapper.gw;
                if (newGameData) {
                    var currentStar = newGameData.galaxy.stars[newGameData.currentStar];
                    if (!currentStar.system)
                        currentStar.system = wrapper.system;
                }
            }
            newGameData.id = game.id;
            var newGame = new GW.Game();
            newGame.load(newGameData);
            GW.manifest.saveGame(newGame).then(function() {
                location.reload();
            });
        }
    };

    function SystemViewModel(init) {
        var self = this;

        var star = init.star;
        var stage = init.stage;
        var parent = init.galaxy;
        var index = init.index;

        // Initialize
        self.star = star;
        self.coordinates = star.coordinates;
        self.index = index;
        self.neighbors = ko.observableArray([]);
        self.biome = star.biome;
        self.stage = stage;

        self.visited = ko.computed(function() {
            return star.history().length > 0;
        });
        self.selected = ko.observable(false);

        var pos_v = VMath.v3_zero();
        var coordinates = VMath.copy(self.coordinates());
        self.pos = ko.computed(function() {
            parent.applyTransform(coordinates, pos_v);
            return pos_v;
        });

        self.name = ko.computed(function() { return loc(star.system().display_name || star.system().name); });
        self.planets = ko.computed(function() { return star.system().planets; });
        self.description = ko.computed(function() {
            return loc(star.system().description);
        });
        self.html = ko.computed(function() {
            return loc(star.system().html);
        });

        // Set up display
        self.systemDisplay = new createjs.Container();
        ko.computed(function() {
            var p = self.pos();
            var scale = p[2];
            self.systemDisplay.scaleX = scale;
            self.systemDisplay.scaleY = scale;
        });

        self.origin = new createjs.Container();
        ko.computed(function() {
            var newPos = self.pos();
            self.origin.x = newPos[0];
            self.origin.y = newPos[1];
            self.origin.z = newPos[2];
        });
        stage.addChild(self.origin);

        self.origin.addChild(self.systemDisplay);

        self.connected = ko.computed(function() {
            return self.visited() || _.some(self.neighbors(), function(neighbor) { return neighbor.visited(); });
        });
        self.connectTo = function(neighbor) {
            if (neighbor.index === self.index)
                return;

            if (_.some(self.neighbors(), function(n) { return n.index === neighbor.index; }))
                return;

            self.neighbors.push(neighbor);

            var shape = new createjs.Shape();
            ko.computed(function() {
                var p = self.pos();
                var n = neighbor.pos();
                var graphics = shape.graphics;
                graphics.clear();

                var selected = self.selected() || neighbor.selected();
                var isolated = !self.visited() && !neighbor.visited();
                if (isolated && !selected)
                    return;
                var green = self.visited() && neighbor.visited();
                var lineColor = green ? 'rgba(64, 210, 64,0.8)' : 'rgba(255,215,120,0.8)';
                if (selected && isolated)
                    lineColor = 'rgba(144,220,255,0.7)';
                graphics.ss(5).s(lineColor).moveTo(0, 0).lineTo((n[0] - p[0]) * 0.5, (n[1] - p[1]) * 0.5);
            });
            self.origin.addChildAt(shape,0);
        }

        var ownerIcon = createBitmap({
            url: "coui://ui/main/game/galactic_war/shared/img/owner.png",
            size: [240, 240],
            color: [1,1,1],
            scale: 0.7,
            alpha: 0.8
        });
        ownerIcon.visible = false;
        self.ownerColor = ko.observable();
        ko.computed(function() {
            ownerIcon.visible = (self.connected() && !!self.ownerColor()) || cheats.noFog();
            ownerIcon.color(self.ownerColor());
        });
        var scaleOwner = new createjs.Container();
        scaleOwner.addChild(ownerIcon);
        scaleOwner.z = 0;
        self.systemDisplay.addChild(scaleOwner);

        var icon = createBitmap({
            url: "coui://ui/main/game/galactic_war/gw_play/systems/star.png",
            size: [180,180]
        });
        icon.z = 1;
        self.systemDisplay.addChild(icon);

        self.click = ko.observable(0);
        self.systemDisplay.addEventListener("click", function() { self.click(self.click() + 1); });

        self.mouseOver = ko.observable(0);
        self.mouseOut = ko.observable(0);
        self.systemDisplay.addEventListener('rollover', function() { self.mouseOver(self.mouseOver() + 1); });
        self.systemDisplay.addEventListener('rollout', function() { self.mouseOut(self.mouseOver()); });
    }

    function CommanderViewModel(params) {
        var self = this;
        var game = params.game;
        var galaxy = params.galaxy;
        var star = params.star;
        var color = params.color;
        var player = params.player;
        var factionIndex = params.faction;
        var icon = params.icon;
        var iconColor = params.iconColor;

        self.dead = ko.observable(false);
        var isDead = function() { return self.dead(); };
        var scopeComputed = function(fn) {
            return ko.computed(fn, self, { disposeWhen : isDead });
        };

        self.color = ko.observable(color);

        var faction = GWFactions[factionIndex];

        var factionIcon = icon || faction.icon || ('coui://ui/main/game/galactic_war/shared/img/icon_faction_' + factionIndex.toString() + '.png');
        var iconColor = icon ? (iconColor || [1,1,1]) : color;

        self.iconScale = ko.observable(2);
        self.icon = createBitmap({
            url: factionIcon,
            size: [128,128],
            color: icon ? iconColor : color,
            scale: 0.5
        });
        self.icon.z = 0;
        self.container = new createjs.Container();
        self.container.z = Infinity;
        self.container.scaleX = self.iconScale();
        self.container.scaleY = self.iconScale();

        self.offset = new createjs.Container();
        self.offset.x = player ? -16 : 12;
        self.offset.y = player ? 9 : -19;

        self.container.addChild(self.offset);
        self.offset.addChild(self.icon);

        self.currentStar = ko.observable(star);
        self.currentSystem = scopeComputed(function() {
            return galaxy.systems()[self.currentStar()];
        });
        scopeComputed(function() {
            var currentSystem = self.currentSystem();
            if (!currentSystem || !currentSystem.systemDisplay)
                return;

            var container = currentSystem.systemDisplay;
            container.addChild(self.container);
            sortContainer(container);
        });

        self.moveSpeed = ko.observable(0.1/(galaxy.radius() * 1000)); // Galactic Units/ms

        self.destination = ko.observable(game.currentStar());
        self.moving = scopeComputed(function() {
            return self.destination() !== self.currentStar();
        });
        self.arrivalTime = ko.observable(0);
        self.departureTime = ko.observable(0);
        self.moveTo = function(newStar, done) {
            if (self.dead())
                return;

            var fromStar = game.galaxy().stars()[self.currentStar()];
            var toStar = game.galaxy().stars()[newStar];

            self.destination(newStar);

            var distance = VMath.distance_v2(fromStar.coordinates(), toStar.coordinates());
            self.departureTime(_.now());
            var time = distance / self.moveSpeed();
            self.arrivalTime(self.departureTime() + time);

            var trail = [];
            var TRAIL_LENGTH = 40;
            _.times(TRAIL_LENGTH, function(index) {
                var icon = createBitmap({
                    url: 'coui://ui/main/game/galactic_war/shared/img/selection.png',
                    size: [28,28],
                    scale: (1 - (index / TRAIL_LENGTH)) * 0.8 + 0.8,
                    color: color
                });
                icon.z = -index;
                icon.alpha = (1 - index / TRAIL_LENGTH) * 0.05 + 0.1;
                self.offset.addChild(icon);
                trail.push(icon);
            });
            sortContainer(self.offset);

            var TRAIL_DURATION = 100; // Measured in ms

            var curCoords_v = VMath.v3_zero();
            var curPos_v = VMath.v3_zero();
            var updateTransitPos = function() {
                if (self.dead())
                    return;
                var fromCoords = fromStar.coordinates();
                var toCoords = toStar.coordinates();
                var timeOffset = _.now() - self.departureTime();
                var progress = timeOffset / time;
                progress = Math.min(progress, 1.0);
                VMath.lerp_v3_s(fromCoords, toCoords, progress, curCoords_v);
                galaxy.applyTransform(curCoords_v, curPos_v);
                self.container.x = curPos_v[0];
                self.container.y = curPos_v[1];
                self.container.scaleX = curPos_v[2] * self.iconScale();
                self.container.scaleY = curPos_v[2] * self.iconScale();

                _.forEach(trail, function(t, index) {
                    var progress = (timeOffset - (index / TRAIL_LENGTH) * TRAIL_DURATION) / time;
                    if ((progress < 0) || (progress > 1)) {
                        t.visible = false;
                        return;
                    }
                    t.visible = true;
                    VMath.lerp_v3_s(fromCoords, toCoords, progress, curCoords_v);
                    galaxy.applyTransform(curCoords_v, curPos_v);
                    t.x = (curPos_v[0] - self.container.x) / self.container.scaleX;
                    t.y = (curPos_v[1] - self.container.y) / self.container.scaleY;
                });
            };

            galaxy.stage.addChild(self.container);
            updateTransitPos();
            self.container.addEventListener('tick', updateTransitPos);
            // Arrive
            _.delay(function() {
                if (self.dead())
                    return;
                self.currentStar(newStar);
                self.container.x = 0;
                self.container.y = 0;
                self.container.scaleX = self.iconScale();
                self.container.scaleY = self.iconScale();
                self.container.removeAllEventListeners('tick');
                galaxy.sortStage();

                _.forEach(trail, function(t) {
                    self.offset.removeChild(t);
                });
                done();
            }, time + TRAIL_DURATION);
            _.delay(galaxy.sortStage);
        };

        self.shutdown = function() {
            if (self.container && self.container.parent)
                self.container.parent.removeChild(self.container);
            delete self.container;
            self.dead(true);
        };
    }

    function SelectionViewModel(config) {
        var self = this;

        var galaxy = config.galaxy;
        var hover = !!config.hover;
        var iconUrl = config.iconUrl;
        var color = config.color;

        if (!iconUrl) {
            if (hover)
                iconUrl = 'coui://ui/main/game/galactic_war/shared/img/hover.png';
            else
                iconUrl = 'coui://ui/main/game/galactic_war/shared/img/selection.png';
        }

        if (!color) {
            if (hover)
                color = [0.5, 0.9, 1];

            else
                color = [0, 0.8, 1];
        }

        self.visible = ko.observable(true);
        self.star = ko.observable(-1);
        self.system = ko.computed(function() { return self.star() >= 0 ? galaxy.systems()[self.star()] : undefined; });

        var extractor = function(field) {
            return ko.pureComputed(function() {
                var system = self.system();
                if (system) {
                    var ai = system.star.ai();
                    return loc((ai && ai[field]) || system[field]() || '');
                } else {
                    return '';
                }
            });
        };

        self.name = extractor('name');
        self.html = extractor('html');
        self.description = extractor('description');

        self.scale = new createjs.Container();
        self.scale.scaleY = 0.5;
        self.scale.z = -1;
        self.icon = createBitmap({
            url: iconUrl,
            size: [240,240],
            color: color
        });
        self.scale.addChild(self.icon);

        ko.computed(function() {
            var system = self.system();
            var visible = !!system && self.visible();
            if (hover && visible)
                visible = system.mouseOver() !== system.mouseOut();
            self.icon.visible = visible;
            if (self.icon.visible) {
                var container = system.systemDisplay;
                container.addChild(self.scale);
                sortContainer(container);
            }
            else {
                if (self.scale.parent)
                    self.scale.parent.removeChild(self.scale);
            }
        });

        if (!hover) {
            self.icon.addEventListener('tick', function() {
                self.icon.rotation = (_.now() * 0.02) % 360;
            });

            self.system.subscribe(function(oldSystem) {
                if (oldSystem)
                    oldSystem.selected(false);
            }, null, 'beforeChange');
            self.system.subscribe(function() {
                var newSystem = self.system();
                if (newSystem)
                    newSystem.selected(true);
            });
        }
    }

    function GalaxyViewModel(data) {
        var self = this;

        var readValue = function(container, field, fallback) {
            if (!container)
                return fallback;

            var value = container[field];
            if (_.isFunction(value))
                value = value.call(container);

            return _.isUndefined(value) ? fallback : value;
        };

        var stars = readValue(data, 'stars', []);
        var gates = readValue(data, 'gates', []);
        var radiusData = readValue(data, 'radius', [0.2, 0.2]);

        if (!_.isArray(stars))
            stars = [];
        if (!_.isArray(gates))
            gates = [];
        if (!_.isArray(radiusData) || !radiusData.length)
            radiusData = [0.2, 0.2];

        self.systems = ko.observableArray();
        self.addSystem = function(star, index) {
            var result = new SystemViewModel({
                star: star,
                stage: self.stage,
                galaxy: self,
                index: index
            });
            self.systems.push(result);
            return result;
        }

        self.joinSystems = function(first, second) {
            if (first === second) return;
            self.systems()[first].connectTo(self.systems()[second], first < second);
            self.systems()[second].connectTo(self.systems()[first], second < first);
        }

        self.radius = ko.observable(_.max(radiusData));

        self.canvasSize = ko.observable([0,0]);
        self.canvasWidth = ko.computed(function() { return self.canvasSize()[0]; });
        self.canvasHeight = ko.computed(function() { return self.canvasSize()[1]; });
        self.parallax = ko.observable([0,0]);
        self.galaxyTransform = ko.computed(function() {
            var galaxyScale = self.radius() * 6;
            var size = _.map(self.canvasSize(), function(s) { return s * galaxyScale; });

            var parallaxAmount = 0.1;
            var parallax = _.map(self.parallax(), function(p) { return p * parallaxAmount; });

            var aspectRatio = size[0] / size[1];
            aspectRatio /= 16 / 9; // Standard galaxy aspect ratio
            if (size[0] > size[1])
                size = [size[0] / aspectRatio, size[1]];
            else
                size = [size[0], size[1] * aspectRatio];

            var worldView = VMath.m4(
                1, 0, 0, 0,
                0, 0, 0, 0, // Flatten out Z
                0, 1, 0, 0,
                0, 0, 0, 1
            );

            var tilt = 1;
            var tiltMatrix = VMath.m4(
                1, 0, 0, 0,
                0, 1, tilt, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            );

            var shrink = 0.5;
            var pinch = 0.25;
            var zScale = VMath.m4(
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, shrink, shrink + 1,
                0, 0, -pinch, 1
            );
            var proj = VMath.m4_zero();

            VMath.concat_m4(zScale, tiltMatrix, proj);

            var worldViewProj = VMath.m4_zero();
            VMath.concat_m4(proj, worldView, worldViewProj);

            var scale = VMath.m4_scale4(size[0], size[1], 1, 1);
            var offset = VMath.m4_offset4(0.5, 0.5, 0, 1);
            var canvas = VMath.m4_zero();
            VMath.concat_m4(scale, offset, canvas);

            var parallaxMatrix = VMath.m4(
                1, 0, -parallax[0], 0,
                0, 1, -parallax[1], 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            );
            var parallaxCanvas = VMath.m4_zero();
            VMath.concat_m4(parallaxMatrix, canvas, parallaxCanvas);

            var result = VMath.m4_identity();
            VMath.concat_m4(parallaxCanvas, worldViewProj, result);

            return result;
        });
        var applyTransform_temp_v = VMath.v4_zero();
        self.applyTransform = function(coordinates, result) {
            var canvasTransform = self.galaxyTransform();
            VMath.transform_m4_v3(canvasTransform, coordinates, applyTransform_temp_v);
            VMath.project_v4(applyTransform_temp_v, result);
        };

        self.stage = new createjs.Stage("galaxy-map");
        self.stage.enableMouseOver();

        var canvas = document.getElementById("galaxy-map");


        _.forEach(nebulae, function(nebulaSettings) {
            var nebula = createBitmap(_.extend({ nocache: true }, nebulaSettings));
            nebula.regX += nebulaSettings.offset[0];
            nebula.regY += nebulaSettings.offset[1];
            nebula.scaleX *= self.radius() * 6;
            nebula.scaleY *= self.radius() * 6;
            var nebulaCoords_v = VMath.v3(0, nebulaSettings.offset[2], 0);
            var nebulaPos_v = VMath.v3_zero();

            ko.computed(function() {
                self.applyTransform(nebulaCoords_v, nebulaPos_v);
                nebula.x = nebulaPos_v[0];
                nebula.y = nebulaPos_v[1] - self.radius() * 2000;
                nebula.z = nebulaPos_v[2] - 2; // bias to make them render behind everything else
            });
            self.stage.addChild(nebula);
        });

        canvas.addEventListener("mousewheel", MouseWheelHandler, false);
        canvas.addEventListener("DOMMouseScroll", MouseWheelHandler, false);

        self.minZoom = ko.observable(0.2);
        self.maxZoom = ko.observable(0.7);

        self.zoom = ko.observable((function() {
            var minBaseline = 0.167;
            var maxBaseline = 0.275;
            var factor = (self.radius() - minBaseline) / (maxBaseline - minBaseline);

            var zoomForMin = 0.32;
            var zoomForMax = 0.2;
            var startingZoom = (zoomForMax * factor) + (zoomForMin * (1.0 - factor));

            return startingZoom;
        })());

        function MouseWheelHandler(e) {
            var zoomDelta;
            if(Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)))>0)
                zoomDelta = 1.1;
            else
                zoomDelta = 1 / 1.1;
            var stage = self.stage;
            var oldZoom = self.zoom();
            var newZoom = Math.max(self.minZoom(), Math.min(oldZoom * zoomDelta, self.maxZoom()));
            zoomDelta = newZoom / oldZoom;

            stage.x = stage.mouseX + (stage.x - stage.mouseX) * zoomDelta;
            stage.y = stage.mouseY + (stage.y - stage.mouseY) * zoomDelta;
            self.stageOffset([stage.x, stage.y]);
            self.zoom(newZoom);
        }
        ko.computed(function() {
            var zoom = self.zoom();
            var stage = self.stage;

            stage.scaleX = zoom;
            stage.scaleY = zoom;
        });

        self.stageOffset = ko.observable([0,0]);
        $(canvas).mousedown(function(e) {
            e.preventDefault();
            var offset = {
                x : self.stage.x - e.pageX,
                y : self.stage.y - e.pageY
            };
            var moveStage = function(ev) {
                ev.preventDefault();
                self.stage.x = ev.pageX+offset.x;
                self.stage.y = ev.pageY+offset.y;
                self.stageOffset([self.stage.x, self.stage.y]);
            };
            $('body').mousemove(moveStage);
            var stopMoving = function() {
                $('body').off('mousemove', moveStage);
                $('body').off('mouseup', stopMoving);
            };
            $('body').mouseup(stopMoving);
        });

        _.forEach(stars, self.addSystem);

        _.forEach(gates, function(gate) {
            self.joinSystems(gate[0], gate[1]);
        });

        self.sortStage = function() {
            sortContainer(self.stage);
        };
        // Note: Systems don't current change their screen z values.
//        ko.computed(function() {
//            // Mark the dependency on z values
//            _.forEach(self.systems(), function(system) { return system.pos()[2]; });
//            self.sortStage();
//        });
        self.sortStage();

        self.scrollTo = function(coords) {
            var canvasPos = VMath.v3_zero();
            self.applyTransform(coords, canvasPos);
            self.stage.x = self.canvasSize()[0] / 2 - (canvasPos[0] * self.stage.scaleX);
            self.stage.y = self.canvasSize()[1] / 2 - (canvasPos[1] * self.stage.scaleY);
            self.stageOffset([self.stage.x, self.stage.y]);
        };

        self.scrollBy = function(delta) {
            var stage = self.stage;
            stage.x = stage.mouseX + (stage.x - delta[0]);
            stage.y = stage.mouseY + (stage.y - delta[1]);
            self.stageOffset([stage.x, stage.y]);
        }

        var updateStage = function() {
            if (model.hidingUI())
                return;
            var w = self.stage.canvas.width;
            var h = self.stage.canvas.height;
            if (w !== self.canvasWidth() ||
                h !== self.canvasHeight()) {
                self.canvasSize([w, h]);
            }
            self.stage.update();
            window.requestAnimationFrame(updateStage);
        };
        window.requestAnimationFrame(function() {
            self.sortStage();
            updateStage();
        });

        self.restartUpdateLoop = function() {
            updateStage();
        };
    }

    // Constructs a view model for a chat message.
    // Chat messages have a type which controls how they are displayed, and a payload which contains the message text.
    // Also a username for who sent the message, but that is not used for all message types.
    // ES6 would make this look a whole lot more normal...
    function ChatMessageViewModel(name, type, payload) {
        var self = this;
        self.username = ko.observable(name);
        self.type = type; /* 'lobby' | 'server' | 'settings' | 'mod' */
        self.payload = ko.observable(payload);
    }

    function GameViewModel(game, startupBattleResult) {
        var self = this;

        self.useLocalServer = ko.observable().extend({ session: 'use_local_server' });

        // Local join configuration info
        self.isLocalGame = ko.observable().extend({ session: 'is_local_game' });
        self.gameHostname = ko.observable().extend({ session: 'gameHostname' });
        self.gamePort = ko.observable().extend({ session: 'gamePort' });

        // Get session information about the user, his game, environment, and so on
        self.uberId = ko.observable().extend({ session: 'uberId' });
        self.transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
        self.transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
        self.transitDestination = ko.observable().extend({ session: 'transit_destination' });
        self.transitDelay = ko.observable().extend({ session: 'transit_delay' });

        self.gameType = ko.observable().extend({ session: 'game_type' });
        self.gameModIdentifiers = ko.observableArray().extend({ session: 'game_mod_identifiers' });
        self.serverType = ko.observable().extend({ session: 'game_server_type' });
        self.serverSetup = ko.observable().extend({ session: 'game_server_setup' });
        self.displayName = ko.observable().extend({ session: 'displayName' });

        self.gameModIdentifiers(undefined);
        self.gameType('Galactic War');

        self.gwCampaignEnabled = ko.observable(false).extend({ session: 'gw_campaign_enabled' });
        self.gwCampaignRole = ko.observable('solo').extend({ session: 'gw_campaign_role' });
        // Local context written by live_game Continue War restart flow.
        // Host uses this once the fresh gw_campaign server is up to reapply
        // lobby visibility/password/slots from the previous co-op session.
        self.gwCampaignRestartContext = ko.observable().extend({ local: 'gw_campaign_restart_context' });
        self.gwCampaignConnected = ko.observable(false);
        self.gwCampaignControl = ko.observable({});
        self.gwCampaignSnapshotSeq = 0;
        self.gwCampaignApplyingSnapshot = false;
        self.gwCampaignPendingSnapshot = undefined;
        self.gwCampaignReceivedSnapshot = false;
        self.gwCampaignInitialSyncRequested = false;
        self.gwCampaignAppliedSnapshotSeq = 0;
        self.gwCampaignHeartbeatHandle = undefined;
        self.gwCampaignHookWatchHandle = undefined;
        self.gwCampaignLastSnapshotSentAt = 0;
        self.gwCampaignLastSnapshotRequestAt = 0;
        self.gwCampaignSnapshotCooldownMs = 1500;
        self.gwCampaignHydrationInProgress = false;
        self.gwCampaignReplayingAction = false;
        self.gwCampaignOwnerStateDebug = {};
        self.gwCampaignStartupBattleResult = startupBattleResult || null;
        self.gwCampaignStartupResultSent = false;
        self.gwCampaignConnectedClients = ko.observableArray([]);
        self.gwCampaignChatHistoryRequested = false;

        self.showGwChatPanel = ko.observable(true);
        self.showGwSettingsPanel = ko.observable(true);
        self.chatSelected = ko.observable(false);
        self.chatMessages = ko.observableArray([]);
        self.chatDraft = ko.observable('');
        self.gwChatHasUnread = ko.observable(false);
        self.gwChatFlashActive = ko.observable(false);
        self.gwChatFlashTimers = [];

        self.friends = ko.observableArray([]).extend({ session: 'friends' });
        self.visibilityMode = ko.observable('public');
        self.gwLobbyTitle = ko.observable('GW Co-op Campaign');
        self.privateGamePassword = ko.observable('').extend({ session: 'private_game_password' });
        self.passwordInputType = ko.observable('password');
        self.campaignLobbySettingsSync = false;
        // gwCampaignMaxClients is the number of clients that can currently connect to the current campaign session.
        // This can be raised or lowered by the host adding or removing slots in the lobby controls.
        self.gwCampaignMaxClients = ko.observable(2);
        // gwCampaignMaxClientsLimit is the maximum number of clients that can possibly connect to a campaign session. 
        // This is a hard limit that is not allowed to be exceeded, and is used to cap the maximum value of gwCampaignMaxClients.
        self.gwCampaignMaxClientsLimit = ko.observable(6);

        var getQueryParam = function(name) {
            var query = window.location.search || '';
            if (!query.length || query.charAt(0) !== '?')
                return undefined;

            var pairs = query.substring(1).split('&');
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i].split('=');
                if (decodeURIComponent(pair[0] || '') === name)
                    return decodeURIComponent(pair[1] || '');
            }
            return undefined;
        };

        var gwCampaignParam = getQueryParam('gw_campaign');
        if (!_.isUndefined(gwCampaignParam))
            self.gwCampaignEnabled(gwCampaignParam === '1' || gwCampaignParam === 'true');
        else {
            self.gwCampaignEnabled(false);
            self.gwCampaignRole('solo');
        }

        self.isCampaignHost = ko.computed(function() {
            return self.gwCampaignEnabled() && self.gwCampaignRole() === 'host';
        });
        self.isCampaignViewer = ko.computed(function() {
            return self.gwCampaignEnabled() && self.gwCampaignRole() === 'viewer';
        });
        self.gwCampaignActive = ko.computed(function() {
            return self.gwCampaignEnabled() && self.gwCampaignConnected();
        });
        // We only want to show the UI elements for controlling the Co-op campaign's
        // multiplayer lobby if we're actually IN a co-op session. 
        // Singleplayer fellows have absolutely zero use for any of these new UIs and they just take up valuable screen real estate.
        self.showGwCampaignLobbyUi = ko.computed(function() {
            return self.gwCampaignActive();
        });
        self.canEditGwCampaignLobby = ko.computed(function() {
            return self.isCampaignHost();
        });

        // I wanted to make chat flash similar to how PA Chat (the mod) does flashes, 
        // so I figured that I could just lerp 3 times.
        // When a new message comes in, instead of just setting the chat window to green, 
        // I instead have this little function set gwChatFlashActive to true and false
        // to trigger changes in the CSS that cause the chat button to flash.
        // Note that if you want to change the timing or duration of the flashes, 
        // you MUST also change the transition times in the #gw-campaign-chat CSS class to match, 
        // otherwise the flashes will look off. 
        // You should be able to find that class in the file ui\main\game\galactic_war\gw_play\gw_play.css
        self.queueClosedChatFlash = function() {
            _.forEach(self.gwChatFlashTimers, function(timer) {
                clearTimeout(timer);
            });
            self.gwChatFlashTimers = [];

            self.gwChatFlashActive(true);
            self.gwChatFlashTimers.push(setTimeout(function() {
                self.gwChatFlashActive(false);
            }, 200));
            self.gwChatFlashTimers.push(setTimeout(function() {
                self.gwChatFlashActive(true);
            }, 400));
            self.gwChatFlashTimers.push(setTimeout(function() {
                self.gwChatFlashActive(false);
            }, 600));
        };

        self.addCampaignChatMessage = function(playerName, message, markUnread) {
            self.chatMessages.push(new ChatMessageViewModel(playerName, 'lobby', message));
            if (markUnread && !self.showGwChatPanel()) {
                self.gwChatHasUnread(true);
                self.queueClosedChatFlash();
            }
        };

        self.toggleGwChatPanel = function() {
            var opening = !self.showGwChatPanel();
            self.showGwChatPanel(opening);
            if (opening) {
                self.gwChatHasUnread(false);
                self.gwChatFlashActive(false);
            }
        };

        self.toggleGwSettingsPanel = function() {
            self.showGwSettingsPanel(!self.showGwSettingsPanel());
        };

        self.togglePasswordReveal = function() {
            self.passwordInputType(self.passwordInputType() === 'password' ? 'text' : 'password');
        };

        // This will create a knockout computed observable that returns an array representing 
        // the possible campaign slots in a co-op session, and the client information for who is occupying those slots (if anyone).
        self.gwCampaignSlots = ko.computed(function() {
            var connected = _.isArray(self.gwCampaignConnectedClients()) ? self.gwCampaignConnectedClients() : [];
            var maxClients = parseInt(self.gwCampaignMaxClients());
            if (!_.isFinite(maxClients) || maxClients < 1)
                maxClients = 1;

            return _.map(_.range(0, maxClients), function(index) {
                var client = connected[index];
                return {
                    index: index + 1,
                    id: client ? client.id : undefined,
                    name: client ? client.name : loc('!LOC:Empty Slot'),
                    host: !!(client && client.role === 'host'),
                    empty: !client,
                    canRemove: !client && maxClients > 1,
                    canKick: !!(client && client.role !== 'host')
                };
            });
        });

        self.kickGwCampaignClient = function(slot) {
            if (!slot || !slot.canKick || !self.canEditGwCampaignLobby() || !self.gwCampaignActive())
                return;

            self.send_message('kick', { id: slot.id });
        };

        // Helper for checking if we can addi slots to the campaign lobby.
        // Basic process is that we check if the user can even edit the lobby, 
        // and if so, we check if the current number of slots is less than the maximum allowed number of slots.
        self.canAddGwCampaignSlot = ko.computed(function() {
            if (!self.canEditGwCampaignLobby() || !self.gwCampaignActive())
                return false;

            var maxClients = parseInt(self.gwCampaignMaxClients());
            var limit = parseInt(self.gwCampaignMaxClientsLimit());

            if (!_.isFinite(maxClients))
                maxClients = 1;
            if (!_.isFinite(limit) || limit < 1)
                limit = 6;

            return maxClients < limit;
        });

        // Helper for adding a client slot to the campaign lobby. 
        // This will only succeed if canAddGwCampaignSlot returns true.
        self.addGwCampaignSlot = function() {
            if (!self.canAddGwCampaignSlot())
                return;

            var mode = self.visibilityMode();

            self.send_message('modify_settings', {
                game_name: self.gwLobbyTitle(),
                public: mode === 'public',
                friends: mode === 'friends' ? self.friends() : [],
                password: self.privateGamePassword(),
                tag: 'Testing',
                max_clients: parseInt(self.gwCampaignMaxClients()) + 1
            });
        };

        // Helper for removing a client slot from the campaign lobby. 
        // This will only succeed if the slot is empty isn't the last non-host slot.
        // If you want to remove all the slots, you can just quit out of co-op and go
        // back to singpleplayer.
        self.removeGwCampaignSlot = function(slot) {
            if (!slot || !slot.canRemove || !self.canEditGwCampaignLobby() || !self.gwCampaignActive())
                return;

            var mode = self.visibilityMode();

            self.send_message('modify_settings', {
                game_name: self.gwLobbyTitle(),
                public: mode === 'public',
                friends: mode === 'friends' ? self.friends() : [],
                password: self.privateGamePassword(),
                tag: 'Testing',
                max_clients: parseInt(self.gwCampaignMaxClients()) - 1
            });
        };

        // Handles asking the server for the lobby's chat history.
        self.requestCampaignChatHistory = function() {
            // If we're not in a coop campaign or if we've already asked for the chat history, then we don't need to do anything.
            if (!self.gwCampaignActive() || self.gwCampaignChatHistoryRequested)
                return;

            // Ensure we don't spam the server with repeated requests 
            // for the chat history if this function gets called multiple times for some reason.
            self.gwCampaignChatHistoryRequested = true;
            self.send_message('chat_history', {}, function(success, response) {
                if (!success || !response || !response.chat_history)
                    return;
                
                _.forEach(response.chat_history, function(msg) {
                    self.addCampaignChatMessage(msg.player_name, msg.message, false);
                });
            });
        };

        self.sendChat = function() {
            if (!self.gwCampaignActive())
                return;

            var message = self.chatDraft();
            if (!_.isString(message) || !message.trim().length)
                return;

            self.send_message('chat_message', { message: message });

            // Don't forget to clean up a sent message.
            self.chatDraft('');
        };

        self.applyCampaignLobbyControl = function(control) {
            var data = control || {};

            // Some server_state payloads omit control fields; avoid clobbering UI with defaults.
            if (_.has(data, 'connected_clients') && _.isArray(data.connected_clients))
                self.gwCampaignConnectedClients(data.connected_clients);

            if (_.has(data, 'max_clients')) {
                var maxClients = parseInt(data.max_clients);
                if (_.isFinite(maxClients) && maxClients > 0)
                    self.gwCampaignMaxClients(maxClients);
            }

            if (_.has(data, 'max_clients_limit')) {
                var maxClientsLimit = parseInt(data.max_clients_limit);
                if (_.isFinite(maxClientsLimit) && maxClientsLimit > 0)
                    self.gwCampaignMaxClientsLimit(maxClientsLimit);
            }

            if (!_.has(data, 'settings') || !data.settings)
                return;

            var settings = data.settings;
            self.campaignLobbySettingsSync = true;

            if (_.isString(settings.game_name))
                self.gwLobbyTitle(settings.game_name);

            if (_.has(settings, 'friends') || _.has(settings, 'public')) {
                if (settings.friends)
                    self.visibilityMode('friends');
                else if (settings.public)
                    self.visibilityMode('public');
                else
                    self.visibilityMode('private');
            }

            self.campaignLobbySettingsSync = false;
        };

        self.pushCampaignLobbySettings = function() {
            if (!self.canEditGwCampaignLobby() || !self.gwCampaignActive() || self.campaignLobbySettingsSync)
                return;

            var mode = self.visibilityMode();

            // Tag here is 'Testing', but perhaps should not be hardcoded?
            // For beacon visibility, it can be any of 'Testing', 'Casual', 'Competitive', or 'AI Battle'.
            self.send_message('modify_settings', {
                game_name: self.gwLobbyTitle(),
                public: mode === 'public',
                friends: mode === 'friends' ? self.friends() : [],
                password: self.privateGamePassword(),
                tag: 'Testing',
                max_clients: self.gwCampaignMaxClients()
            });
        };

        // Applies one-time restart context after host reconnects to a newly
        // started gw_campaign server process. This keeps co-op lobby settings stable
        // across process-level Continue War restarts.
        self.applyPendingGwCampaignRestartContext = function() {
            var context = self.gwCampaignRestartContext();
            if (!context || !context.pending_reapply)
                return;

            if (!self.isCampaignHost() || !self.gwCampaignConnected())
                return;

            var settings = context.settings || {};
            var access = context.access || {};

            self.send_message('modify_settings', {
                game_name: _.isString(settings.game_name) ? settings.game_name : self.gwLobbyTitle(),
                tag: _.isString(settings.tag) ? settings.tag : 'Testing',
                public: _.isBoolean(settings.public) ? settings.public : true,
                max_clients: _.isFinite(settings.max_clients) ? settings.max_clients : self.gwCampaignMaxClients(),
                password: _.isString(access.password) ? access.password : self.privateGamePassword(),
                friends: _.isArray(access.friends) ? access.friends : [],
                blocked: _.isArray(access.blocked) ? access.blocked : []
            });

            context.pending_reapply = false;
            self.gwCampaignRestartContext(context);
        };

        self.setPrivateGame = function() {
            self.visibilityMode('private');
            self.pushCampaignLobbySettings();
        };

        self.setFriendsOnlyGame = function() {
            self.visibilityMode('friends');
            self.pushCampaignLobbySettings();
        };

        self.setPublicGame = function() {
            self.visibilityMode('public');
            self.pushCampaignLobbySettings();
        };

        self.canOpenCoopSession = ko.computed(function() {
            return !self.gwCampaignActive() && !self.gwCampaignEnabled() && !game.isTutorial();
        });
        self.gwCampaignStatusText = ko.computed(function() {
            if (!self.gwCampaignEnabled())
                return '';
            if (!self.gwCampaignConnected())
                return loc('!LOC:GW Co-op session: connecting...');
            if (self.isCampaignHost())
                return loc('!LOC:GW Co-op session open (Host)');
            if (self.isCampaignViewer())
                return loc('!LOC:GW Co-op session open (Viewer)');
            return loc('!LOC:GW Co-op session open');
        });

        self.openToCoop = function() {
            if (!self.canOpenCoopSession())
                return;

            self.connectFailDestination(window.location.href);

            var params = {
                action: 'start',
                mode: 'gw_campaign',
                content: game.content()
            };

            if (self.useLocalServer()) {
                self.serverType('local');
                params.local = true;
            }
            else {
                self.serverType('uber');
            }

            self.serverSetup('gw_campaign');
            self.gwCampaignEnabled(true);
            window.location.href = 'coui://ui/main/game/connect_to_game/connect_to_game.html?' + $.param(params);
        };

        self.leaveCoopSession = function() {
            if (!self.gwCampaignEnabled())
                return;

            // Ask gw_campaign server state to terminate immediately for host.
            self.send_message('leave_gw_campaign', {});

            // When the player disconnects from a campaign session or if the sessions
            // is closed thereby forcing a disconnect, we save a local copy of the campaign
            // so the co-op player can keep playing even in single player mode.

            // This section handles the voluntary leave case.
            self.persistCampaignLocalCopy('leave_session').always(function() {
                self.transitPrimaryMessage(loc('!LOC:Leaving GW Co-op Session'));
                self.transitSecondaryMessage('');
                self.transitDestination('coui://ui/main/game/galactic_war/gw_play/gw_play.html');
                self.transitDelay(0);
                window.location.href = 'coui://ui/main/game/transit/transit.html';
            });
        };

        self.enrichCampaignGameSystems = function(reason) {
            var gameGalaxy = game && _.isFunction(game.galaxy) ? game.galaxy() : undefined;
            var gameStars = gameGalaxy && _.isFunction(gameGalaxy.stars) ? gameGalaxy.stars() : undefined;
            var viewSystems = self.galaxy && _.isFunction(self.galaxy.systems) ? self.galaxy.systems() : undefined;
            var enrichedSystems = 0;

            if (!_.isArray(gameStars))
                return 0;

            _.forEach(gameStars, function(gameStar, index) {
                if (!gameStar || !_.isFunction(gameStar.system))
                    return;

                if (gameStar.system())
                    return;

                var viewSystem = _.isArray(viewSystems) ? viewSystems[index] : undefined;
                var fallbackSystem = viewSystem && viewSystem.star && _.isFunction(viewSystem.star.system) ? viewSystem.star.system() : undefined;
                if (!fallbackSystem)
                    return;

                gameStar.system(_.cloneDeep(fallbackSystem));
                enrichedSystems += 1;
            });

            if (enrichedSystems > 0)
                console.log('[GW_COOP] enrichCampaignGameSystems reason=' + reason + ' enriched=' + enrichedSystems);

            return enrichedSystems;
        };

        self.persistCampaignLocalCopy = function(reason) {
            var done = $.Deferred();

            if (!self.gwCampaignEnabled()) {
                done.resolve();
                return done.promise();
            }

            self.enrichCampaignGameSystems(reason || 'persist');

            var gameGalaxy = game && _.isFunction(game.galaxy) ? game.galaxy() : undefined;
            if (gameGalaxy && _.isFunction(gameGalaxy.saved))
                gameGalaxy.saved(false);

            var saving = GW.manifest.saveGame(game);
            if (!saving || !_.isFunction(saving.then)) {
                done.resolve();
                return done.promise();
            }

            saving.then(function() {
                console.log('[GW_COOP] persistCampaignLocalCopy saved reason=' + reason);
                done.resolve();
            }, function(err) {
                console.error('[GW_COOP] persistCampaignLocalCopy failed reason=' + reason, err);
                done.resolve();
            });

            return done.promise();
        };

        self.getCampaignSnapshotPayload = function() {
            self.enrichCampaignGameSystems('snapshot_payload');

            var gameSave = game.save();
            var saveStars = gameSave && gameSave.galaxy && gameSave.galaxy.stars;
            var runtimeGalaxy = game && _.isFunction(game.galaxy) ? game.galaxy() : undefined;
            var runtimeStars = runtimeGalaxy && _.isFunction(runtimeGalaxy.stars) ? runtimeGalaxy.stars() : undefined;
            var enrichedSystems = 0;

            if (_.isArray(saveStars) && _.isArray(runtimeStars)) {
                _.forEach(saveStars, function(saveStar, index) {
                    if (!saveStar || saveStar.system)
                        return;

                    var runtimeStar = runtimeStars[index];
                    var runtimeSystem = runtimeStar && _.isFunction(runtimeStar.system) ? runtimeStar.system() : undefined;
                    if (!runtimeSystem)
                        return;

                    saveStar.system = _.cloneDeep(runtimeSystem);
                    enrichedSystems += 1;
                });
            }

            if (enrichedSystems > 0)
                console.log('[GW_COOP] snapshot enriched missing systems=' + enrichedSystems);

            return {
                game: gameSave,
                ui: {
                    selectedStar: self.selection.star(),
                    hoverStar: self.hoverSystem.star(),
                    stageOffset: self.galaxy.stageOffset(),
                    zoom: self.galaxy.zoom(),
                    timestamp: _.now()
                }
            };
        };

        self.sendCampaignSnapshot = function(reason) {
            if (!self.isCampaignHost() || !self.gwCampaignConnected() || self.gwCampaignApplyingSnapshot)
                return;

            var control = self.gwCampaignControl() || {};
            var connectedClients = _.isArray(control.connected_clients) ? control.connected_clients : [];
            var hasViewer = _.some(connectedClients, function(client) {
                return client && client.role === 'viewer';
            });

            // Avoid emitting massive snapshots when host is alone.
            if (!hasViewer)
                return;

            var now = _.now();
            var highPriorityReason = reason === 'viewer_joined' || reason === 'host_role_assigned';
            if (!highPriorityReason && (now - self.gwCampaignLastSnapshotSentAt) < self.gwCampaignSnapshotCooldownMs)
                return;

            self.gwCampaignLastSnapshotSentAt = now;

            self.gwCampaignSnapshotSeq += 1;
            self.send_message('gw_campaign_snapshot', {
                seq: self.gwCampaignSnapshotSeq,
                reason: reason || 'update',
                snapshot: self.getCampaignSnapshotPayload()
            });
        };

        self.requestCampaignSnapshot = function(force) {
            if (!self.gwCampaignActive())
                return;

            if (!force && self.gwCampaignReceivedSnapshot)
                return;

            var now = _.now();
            if ((now - self.gwCampaignLastSnapshotRequestAt) < 500)
                return;

            self.gwCampaignLastSnapshotRequestAt = now;
            self.send_message('request_gw_campaign_snapshot', {});
        };

        self.sendCampaignAction = function(type, payload) {
            if (!self.isCampaignHost() || !self.gwCampaignConnected())
                return;

            self.send_message('gw_campaign_action', {
                type: type,
                payload: payload || {},
                timestamp: _.now()
            });
        };

        self.wrapCampaignOverrideIfNeeded = function(name, actionType, payloadBuilder) {
            var current = self[name];
            if (!_.isFunction(current) || current.__gwCampaignNative || current.__gwCampaignWrapped)
                return;

            var wrapped = function() {
                var args = Array.prototype.slice.call(arguments);

                if (self.isCampaignViewer() && !self.gwCampaignReplayingAction)
                    return;

                if (!self.gwCampaignReplayingAction && self.isCampaignHost() && self.gwCampaignConnected() && actionType) {
                    var payload = payloadBuilder ? payloadBuilder(args) : {};
                    self.sendCampaignAction(actionType, payload || {});
                }

                // Modded explore implementations often bypass sync_star_cards relay.
                if (!self.gwCampaignReplayingAction && self.isCampaignHost() && self.gwCampaignConnected() && name === 'explore') {
                    var exploreStarIndex = game.currentStar();
                    var exploreStars = game.galaxy && game.galaxy().stars ? game.galaxy().stars() : undefined;
                    var exploreStar = _.isArray(exploreStars) ? exploreStars[exploreStarIndex] : undefined;
                    var syncSent = false;
                    var syncCards = function(reason) {
                        if (syncSent)
                            return;

                        syncSent = true;
                        self.sendCampaignAction('sync_star_cards', {
                            star: exploreStarIndex,
                            cards: exploreStar && _.isFunction(exploreStar.cardList) ? exploreStar.cardList() : []
                        });
                        console.log('[GW_COOP] wrapped explore relayed sync_star_cards reason=' + reason + ' star=' + exploreStarIndex);
                    };

                    if (exploreStar && _.isFunction(exploreStar.cardList) && _.isFunction(exploreStar.cardList.subscribe)) {
                        var subscription = exploreStar.cardList.subscribe(function() {
                            syncCards('card_list_update');
                            if (subscription && _.isFunction(subscription.dispose))
                                subscription.dispose();
                        });

                        _.delay(function() {
                            if (subscription && _.isFunction(subscription.dispose))
                                subscription.dispose();
                            syncCards('timeout');
                        }, 2600);
                    }
                    else {
                        _.delay(function() {
                            syncCards('timeout_no_subscription');
                        }, 2600);
                    }
                }

                return current.apply(self, args);
            };

            wrapped.__gwCampaignWrapped = true;
            wrapped.__gwCampaignWrappedName = name;
            wrapped.__gwCampaignWrappedOriginal = current;
            self[name] = wrapped;
            console.log('[GW_COOP] wrapped external override for ' + name + ' to preserve co-op sync');
        };

        self.ensureCampaignCompatibilityHooks = function() {
            self.wrapCampaignOverrideIfNeeded('explore', 'explore', function() {
                return { star: game.currentStar() };
            });

            self.wrapCampaignOverrideIfNeeded('win', 'win_choice', function(args) {
                return { selected_card_index: args[0] };
            });

            self.wrapCampaignOverrideIfNeeded('lose', 'lose_turn', function() {
                return {};
            });
        };

        self.syncViewerStarFromGame = function(starIndex, reason) {
            if (!self.isCampaignViewer())
                return false;

            if (!_.isNumber(starIndex))
                return false;

            var viewSystems = self.galaxy && _.isFunction(self.galaxy.systems) ? self.galaxy.systems() : undefined;
            var gameGalaxy = game && _.isFunction(game.galaxy) ? game.galaxy() : undefined;
            var gameStars = gameGalaxy && _.isFunction(gameGalaxy.stars) ? gameGalaxy.stars() : undefined;

            if (!viewSystems || !gameStars || starIndex < 0 || starIndex >= viewSystems.length || starIndex >= gameStars.length)
                return false;

            var viewSystem = viewSystems[starIndex];
            var viewStar = viewSystem && viewSystem.star;
            var gameStar = gameStars[starIndex];
            if (!viewStar || !gameStar)
                return false;

            var changed = false;
            var copyObservable = function(name, cloneValue) {
                var viewObs = viewStar[name];
                var gameObs = gameStar[name];
                if (!_.isFunction(viewObs) || !_.isFunction(gameObs))
                    return;

                var gameValue = gameObs();
                var nextValue = cloneValue ? _.cloneDeep(gameValue) : gameValue;
                var currentValue = viewObs();
                if (!_.isEqual(currentValue, nextValue)) {
                    viewObs(nextValue);
                    changed = true;
                }
            };

            // These fields drive visited/connected/owner color and system tooltip content.
            copyObservable('history', true);
            copyObservable('explored', false);
            copyObservable('cardList', true);
            copyObservable('ai', true);
            copyObservable('system', true);
            copyObservable('biome', false);
            copyObservable('distance', false);
            copyObservable('coordinates', true);

            if (changed)
                console.log('[GW_COOP] syncViewerStarFromGame star=' + starIndex + ' reason=' + reason);

            return changed;
        };

        self.syncViewerStarsFromGame = function(reason, starsHint) {
            if (!self.isCampaignViewer())
                return;

            var changedCount = 0;
            if (_.isArray(starsHint) && starsHint.length) {
                _.forEach(_.uniq(starsHint), function(starIndex) {
                    if (self.syncViewerStarFromGame(starIndex, reason))
                        changedCount += 1;
                });
            }
            else {
                var totalStars = self.galaxy && _.isFunction(self.galaxy.systems) ? self.galaxy.systems().length : 0;
                _.times(totalStars, function(starIndex) {
                    if (self.syncViewerStarFromGame(starIndex, reason))
                        changedCount += 1;
                });
            }

            if (changedCount > 0)
                console.log('[GW_COOP] syncViewerStarsFromGame reason=' + reason + ' changed=' + changedCount);
        };

        self.getGalaxySignature = function(galaxyData) {
            if (!galaxyData)
                return '';

            var stars = galaxyData.stars;
            if (_.isFunction(stars))
                stars = stars();

            var gates = galaxyData.gates;
            if (_.isFunction(gates))
                gates = gates();

            var origin = galaxyData.origin;
            if (_.isFunction(origin))
                origin = origin();

            if (!_.isArray(stars) || !_.isArray(gates))
                return '';

            var first = stars[0] || {};
            var coords = first.coordinates;
            if (_.isFunction(coords))
                coords = coords();

            var coordSig = _.isArray(coords) ? coords.join(',') : '';
            return [stars.length, gates.length, _.isNumber(origin) ? origin : -1, coordSig].join('|');
        };

        self.applyCampaignSnapshot = function(payload) {
            if (!self.isCampaignViewer() || !payload || !payload.snapshot || !payload.snapshot.game)
                return;

            if (self.gwCampaignHydrationInProgress)
                return;

            if (self.gwCampaignApplyingSnapshot) {
                self.gwCampaignPendingSnapshot = payload;
                return;
            }

            var snapshot = payload.snapshot;
            var ui = snapshot.ui || {};
            var incomingSeq = _.isNumber(payload.seq) ? payload.seq : 0;
            console.log('[GW_COOP] applyCampaignSnapshot start seq=' + incomingSeq + ' applying=' + self.gwCampaignApplyingSnapshot);

            var localGalaxy = game.galaxy && game.galaxy();
            var localSignature = self.getGalaxySignature(localGalaxy);
            var snapshotSignature = self.getGalaxySignature(snapshot.game && snapshot.game.galaxy);

            if (!self.gwCampaignHydrationInProgress && snapshotSignature && localSignature !== snapshotSignature) {
                self.gwCampaignHydrationInProgress = true;
                console.log('[GW_COOP] snapshot galaxy mismatch local=' + localSignature + ' remote=' + snapshotSignature + ', forcing full rehydrate');

                var hydratedGame = new GW.Game();
                hydratedGame.load(snapshot.game).always(function() {
                    GW.manifest.saveGame(hydratedGame).then(function() {
                        self.gwCampaignReceivedSnapshot = true;
                        self.gwCampaignInitialSyncRequested = false;
                        ko.observable().extend({ local: 'gw_active_game' })(hydratedGame.id);
                        window.location.reload();
                    }, function(err) {
                        self.gwCampaignHydrationInProgress = false;
                        console.error('[GW_COOP] failed to save hydrated game', err);
                    });
                });
                return;
            }

            self.gwCampaignApplyingSnapshot = true;
            game.load(snapshot.game).always(function() {
                self.gwCampaignReceivedSnapshot = true;
                self.gwCampaignInitialSyncRequested = false;
                self.syncViewerStarsFromGame('snapshot_seq_' + incomingSeq);
                if (incomingSeq > self.gwCampaignAppliedSnapshotSeq)
                    self.gwCampaignAppliedSnapshotSeq = incomingSeq;

                if (_.isNumber(ui.selectedStar))
                    self.selection.star(ui.selectedStar);

                if (_.isNumber(ui.hoverStar))
                    self.hoverSystem.star(ui.hoverStar);

                if (_.isArray(ui.stageOffset) && ui.stageOffset.length === 2) {
                    self.galaxy.stage.x = ui.stageOffset[0];
                    self.galaxy.stage.y = ui.stageOffset[1];
                    self.galaxy.stageOffset([ui.stageOffset[0], ui.stageOffset[1]]);
                }

                if (_.isNumber(ui.zoom))
                    self.galaxy.zoom(ui.zoom);

                console.log('[GW_COOP] applyCampaignSnapshot done seq=' + incomingSeq + ' currentStar=' + game.currentStar() + ' selected=' + self.selection.star());

                self.gwCampaignApplyingSnapshot = false;

                if (self.gwCampaignPendingSnapshot) {
                    var pendingSnapshot = self.gwCampaignPendingSnapshot;
                    self.gwCampaignPendingSnapshot = undefined;
                    self.applyCampaignSnapshot(pendingSnapshot);
                }
            });
        };

        self.applyCampaignAction = function(action) {
            if (!self.isCampaignViewer() || !action || !action.type)
                return;

            var payload = action.payload || {};
            var currentStarBeforeAction = game.currentStar();
            var currentSystemBeforeAction = _.isNumber(currentStarBeforeAction) ? self.galaxy.systems()[currentStarBeforeAction] : undefined;
            var aiBeforeAction = currentSystemBeforeAction && currentSystemBeforeAction.star && _.isFunction(currentSystemBeforeAction.star.ai) ? currentSystemBeforeAction.star.ai() : undefined;
            var hasCardBeforeAction = currentSystemBeforeAction && currentSystemBeforeAction.star && _.isFunction(currentSystemBeforeAction.star.hasCard) ? currentSystemBeforeAction.star.hasCard() : undefined;
            var historyBeforeAction = currentSystemBeforeAction && currentSystemBeforeAction.star && _.isFunction(currentSystemBeforeAction.star.history) ? (currentSystemBeforeAction.star.history() || []).length : undefined;

            console.log('[GW_COOP] applyCampaignAction recv type=' + action.type + ' currentStar=' + currentStarBeforeAction + ' hasAi=' + !!aiBeforeAction + ' hasCard=' + hasCardBeforeAction + ' history=' + historyBeforeAction);
            self.syncViewerStarsFromGame('before_action_' + action.type, [currentStarBeforeAction]);
            self.gwCampaignReplayingAction = true;

            if (action.type === 'startup_battle_result' && payload && payload.result) {
                if (payload.result === 'win') {
                    game.winTurn().then(function(didWin) {
                        console.log('[GW_COOP] applyCampaignAction startup_battle_result win didWin=' + didWin + ' currentStar=' + game.currentStar());
                        GW.manifest.saveGame(game);
                    });
                }
                else if (payload.result === 'loss') {
                    var didLose = game.loseTurn();
                    if (game.isTutorial())
                        game.turnState(GW.Game.turnStates.begin);
                    console.log('[GW_COOP] applyCampaignAction startup_battle_result loss didLose=' + didLose + ' currentStar=' + game.currentStar());
                    GW.manifest.saveGame(game);
                }

                self.gwCampaignReplayingAction = false;
                return;
            }

            if (action.type === 'select_star' && _.isNumber(payload.star)) {
                self.selection.star(payload.star);
                self.syncViewerStarsFromGame('after_action_select_star', [payload.star, game.currentStar()]);
                self.gwCampaignReplayingAction = false;
                return;
            }

            if (action.type === 'move_to_star' && _.isNumber(payload.star)) {
                self.selection.star(payload.star);
                self.move();
                _.defer(function() {
                    self.syncViewerStarsFromGame('after_action_move_to_star', [payload.star, game.currentStar()]);
                });
                self.gwCampaignReplayingAction = false;
                return;
            }

            if (action.type === 'move_path' && _.isArray(payload.path) && payload.path.length) {
                self.selection.star(payload.destination);
                self.move();
                _.defer(function() {
                    var changedStars = _.isArray(payload.path) ? payload.path.concat([payload.destination, game.currentStar()]) : [payload.destination, game.currentStar()];
                    self.syncViewerStarsFromGame('after_action_move_path', changedStars);
                });
                self.gwCampaignReplayingAction = false;
                return;
            }

            if (action.type === 'explore_begin') {
                self.explore();
                _.defer(function() {
                    self.syncViewerStarsFromGame('after_action_explore_begin', [game.currentStar()]);
                });
                self.gwCampaignReplayingAction = false;
                return;
            }

            if (action.type === 'explore') {
                self.explore();
                _.defer(function() {
                    self.syncViewerStarsFromGame('after_action_explore', [game.currentStar()]);
                });
                self.gwCampaignReplayingAction = false;
                return;
            }

            if (action.type === 'discard_card') {
                self.discardHoverCard(payload.discard_index);
                _.defer(function() {
                    self.syncViewerStarsFromGame('after_action_discard_card', [game.currentStar()]);
                });
                self.gwCampaignReplayingAction = false;
                return;
            }

            if (action.type === 'explore_cards') {
                var stars = game.galaxy().stars();
                var star = _.isNumber(payload.star) ? stars[payload.star] : undefined;
                if (star && _.isFunction(star.cardList) && _.isArray(payload.cards))
                    star.cardList(payload.cards);
                self.scanning(false);
                self.syncViewerStarsFromGame('after_action_explore_cards', [payload.star, game.currentStar()]);
                self.gwCampaignReplayingAction = false;
                return;
            }

            if (action.type === 'sync_star_cards') {
                var syncStars = game.galaxy().stars();
                var syncStar = _.isNumber(payload.star) ? syncStars[payload.star] : undefined;
                if (syncStar && _.isFunction(syncStar.cardList) && _.isArray(payload.cards))
                    syncStar.cardList(payload.cards);
                self.syncViewerStarsFromGame('after_action_sync_star_cards', [payload.star, game.currentStar()]);
                self.gwCampaignReplayingAction = false;
                return;
            }

            if (action.type === 'win_turn') {
                // Viewer can be out of the precise turn micro-state; use snapshot correction instead.
                console.log('[GW_COOP] applyCampaignAction win_turn fallback->snapshot');
                self.requestCampaignSnapshot();
                self.gwCampaignReplayingAction = false;
                return;
            }

            if (action.type === 'win_choice') {
                self.win(payload.selected_card_index);
                _.defer(function() {
                    self.syncViewerStarsFromGame('after_action_win_choice');
                });
                self.gwCampaignReplayingAction = false;
                return;
            }

            if (action.type === 'lose_turn') {
                self.lose();
                _.defer(function() {
                    self.syncViewerStarsFromGame('after_action_lose_turn');
                });
                self.gwCampaignReplayingAction = false;
                return;
            }

            self.gwCampaignReplayingAction = false;
        };

        self.updateCampaignConnectionState = function(payload) {
            if (!payload || payload.state !== 'gw_campaign')
                return;

            console.log('[GW_COOP] server_state gw_campaign url=' + payload.url);
            self.gwCampaignEnabled(true);
            self.gwCampaignConnected(true);

            var data = payload.data || {};
            var clientData = data.client || {};
            var role = clientData.role;
            if (!role && data.host_name && self.displayName() && data.host_name === self.displayName())
                role = 'host';

            if (!role && _.isArray(data.connected_clients) && data.connected_clients.length === 1 && data.connected_clients[0].role === 'host')
                role = 'host';

            if (!role && data.host_name && self.displayName() && data.host_name !== self.displayName())
                role = 'viewer';

            if (role)
                self.gwCampaignRole(role);

            var incomingControl = clientData.control || data.control;

            // In case the server_state payload doesn't nest control under client, 
            // but it does include other campaign lobby fields, treat the top-level data as control to avoid missing important lobby state.
            if (!incomingControl && (
                _.has(data, 'connected_clients') ||
                _.has(data, 'max_clients') ||
                _.has(data, 'max_clients_limit') ||
                _.has(data, 'settings') ||
                _.has(data, 'host_id') ||
                _.has(data, 'host_name')
            )) {
                incomingControl = data;
            }

            if (incomingControl) {
                self.gwCampaignControl(incomingControl);

                // We apply the lobby control settings sent by the server upon connection to ensure our UI reflects the actual state of the campaign lobby,
                // especially in cases where the host might have changed some settings while we were connecting.
                self.applyCampaignLobbyControl(incomingControl);
            }
            self.requestCampaignChatHistory();

            console.log('[GW_COOP] gw_campaign role from server_state=' + (role || '<unchanged>'));

            // In case we are continuing a war and thereby restarting an earlier
            // campaign session, we might already have campaign lobby state that 
            // we want to re-apply after the new session is ready.
            self.applyPendingGwCampaignRestartContext();

            if (self.isCampaignViewer() && !self.gwCampaignReceivedSnapshot && !self.gwCampaignInitialSyncRequested) {
                self.gwCampaignInitialSyncRequested = true;
                self.requestCampaignSnapshot(true);
            }
        };

        self.devMode = ko.observable().extend({ session: 'dev_mode' });
        self.mode = ko.observable(game.mode());
        self.creditsMode = ko.computed(function() {
            return self.mode() === 'credits';
        });

        self.cheats = cheats;

        cheats.noFog(self.creditsMode());

        // Tracked for knowing where we've been for pages that can be accessed in more than one way
        self.lastSceneUrl = ko.observable().extend({ session: 'last_scene_url' });
        self.exitGate = ko.observable($.Deferred());
        self.exitGate().resolve();

        self.connectFailDestination = ko.observable().extend({ session: 'connect_fail_destination' });
        self.connectFailDestination('');

        self.firstMousePosition = ko.observable(); // used for parallax
        var previousHeight = null

        // We don't show the galaxy while the tutorial is launching
        self.launchingTutorialFight = ko.observable(false);

        self.resize = function() {
            self.galaxy.canvasSize([$("#galaxy-map").width(), $("#galaxy-map").height()]);
            previousHeight = $("#galaxy-map").height();
            self.firstMousePosition(null);
        }

        PopUp.mixin(self, $('.popup-container'));

        self.abandonGame = function() {
            self.confirm(['!LOC:Are you sure you want to abandon this Galactic War?','<br/><br/>','!LOC:All progress and Tech will be lost.'], function() {
                GW.manifest.removeGame(game)
                    .then(self.exitGame);
            });
        };

        self.showSideBar = ko.observable(false);

        self.showSettings = ko.observable(false);
        self.showSettings.subscribe(function() {
            var show = self.showSettings();
            if (show) {
                api.panels.settings && api.panels.settings.focus();
            }
            else {
                api.Holodeck.refreshSettings();
            }
            _.delay(api.panels.settings.update);
        });

        self.menuSettings = function() {
            self.showSettings(true);
            // Fixed this reference, although it's possible that making it actually do anything
            // would cause a regression, since nobody noticed it break anything yet anyway.
            // self.showSideBar(false);
        };

        self.game = ko.observable(game);
        self.galaxy = new GalaxyViewModel(game.galaxy());

        var defaultPlayerColor = [ [210,50,44], [51,151,197] ];
        var rawPlayerColor = (game.inventory().getTag('global', 'playerColor') || defaultPlayerColor)[0];
        var playerColor = _.map(rawPlayerColor, function(c) { return c / 255; });
        var playerStar = game.currentStar();
        var playerFaction = game.inventory().getTag('global', 'playerFaction') || 0;

        self.player = new CommanderViewModel({
            game: game,
            galaxy: self.galaxy,
            star: playerStar,
            color: playerColor,
            player: true,
            faction: playerFaction
        });

        _.forEach(self.galaxy.systems(), function(system, star) {
            var bossModel;
            ko.computed(function() {
                var ai = system.star.ai();
                var boss;
                var ownerSource = 'none';
                if (ai && ai.color) {
                    var normalizedColor = _.map(ai.color[0], function(c) { return c / 255; });
                    if (system.connected() || cheats.noFog()) {
                        boss = ai.boss;
                    }
                    system.ownerColor(normalizedColor.concat(3));
                    ownerSource = 'ai';
                }
                else {
                    if (!system.star.hasCard()) {
                        system.ownerColor(self.player.color().concat(3));
                        ownerSource = 'player';
                    }
                    else {
                        system.ownerColor(undefined);
                        ownerSource = 'hidden_card';
                    }
                }

                var owner = system.ownerColor();
                var historyCount = _.isFunction(system.star.history) ? (system.star.history() || []).length : 0;
                var ownerKey = [
                    ownerSource,
                    system.connected() ? 1 : 0,
                    ai ? 1 : 0,
                    system.star.hasCard() ? 1 : 0,
                    historyCount,
                    owner ? owner.join(',') : 'none'
                ].join('|');
                if (self.gwCampaignOwnerStateDebug[star] !== ownerKey) {
                    self.gwCampaignOwnerStateDebug[star] = ownerKey;
                    console.log('[GW_COOP] ownerColorState star=' + star + ' source=' + ownerSource + ' connected=' + system.connected() + ' hasAi=' + !!ai + ' hasCard=' + system.star.hasCard() + ' history=' + historyCount + ' owner=' + (owner ? owner.join(',') : 'none') + ' role=' + self.gwCampaignRole() + ' replay=' + self.gwCampaignReplayingAction);
                }

                if (boss && !bossModel) {
                    bossModel = new CommanderViewModel({
                        game: game,
                        galaxy: self.galaxy,
                        star: star,
                        color: normalizedColor,
                        player: false,
                        faction: ai.faction || 0,
                        icon: ai.icon,
                        iconColor: _.map(ai.iconColor, function(c) { return c / 255.0; })
                    });
                }
                else if (!boss && bossModel) {
                    bossModel.shutdown();
                    bossModel = undefined;
                }
            });
        });

        self.selection = new SelectionViewModel({
            galaxy: self.galaxy,
            hover: false
        });
        self.selection.star(game.currentStar());

        self.showSelectionPlanets = ko.computed(function() {
            return !self.creditsMode() && !self.game().isTutorial();
        });

        self.hoverSystem = new SelectionViewModel({
            galaxy: self.galaxy,
            hover: true
        });

        ko.computed(function() {
            self.hoverSystem.visible(self.selection.star() !== self.hoverSystem.star());
        });
        _.forEach(self.galaxy.systems(), function(system, star) {
            system.mouseOver.subscribe(function() {
                self.hoverSystem.star(star);
            });
        });

        self.battleConfig = ko.observable().extend({ memory: 'gw_battle_config' });

        self.currentStar = ko.computed(function() {
            return game.galaxy().stars()[game.currentStar()];
        });
        self.currentSystem = ko.computed(function() {
            return self.galaxy.systems()[game.currentStar()];
        });

        ko.computed(function() {
            var star = self.selection.star();
            if (star === undefined)
                return;

            var $anchor = $("#selected-system-anchor");

            var where = self.galaxy.systems()[star].pos();
            var offset = self.galaxy.stageOffset();
            var scale = self.galaxy.zoom();
            $anchor.css({
                left: (where[0] * scale + offset[0]) + 'px',
                top: (where[1] * scale + offset[1]) + 'px',
                width: (where[2] * scale) + 'px',
                height: (where[2] * scale) + 'px'
            });
        });

        self.testGameState = function(options, def)
        {
            var curState = self.game().turnState();
            var result = options[curState];
            if (result === undefined)
                result = def;
            if (typeof(result) === 'function')
                result = result();
            return result;
        }

        self.launchingFight = ko.observable(false);

        self.fighting = ko.computed(function()
        {
            return self.testGameState({fight: true}, false);
        });

        self.canFight = ko.computed(function()
        {
            if (self.isCampaignViewer())
                return false;

            if (self.player.moving())
                return false;

            var currentStar = self.currentStar();
            if (!currentStar)
                return false;

            var isBegin = self.game().turnState() === GW.Game.turnStates.begin;

            return (isBegin || self.fighting() && !self.launchingFight()) && !!currentStar.ai();
        });

        self.allowLoad = function()
        {
            var game = self.game();

            var result = self.useLocalServer()
                ? (self.useLocalServer() && game.replayName())
                : (!self.useLocalServer() && game.replayLobbyId());

            return !!result && (!game.replayStar() || game.replayStar() === self.selection.star());
        };

        self.displayFight = ko.computed(function()
        {
            return self.canFight() && !self.allowLoad() && self.selection.star() === self.game().currentStar();
        });

        self.displayLoadSave = ko.computed(function()
        {
            return self.canFight() && self.allowLoad() && self.selection.star() === self.game().currentStar();
        });

        // self.canFight.subscribe(function(newValue)
        // {
        //     if (!newValue)
        //         return;
        //     self.selection.star(game.currentStar());
        // });

        self.driveAccessInProgress = ko.observable(false);

        self.scanning = ko.observable(false);

        self.exploring = ko.computed(function()
        {
            return self.testGameState({explore: true}, false);
        });

        self.canExplore = ko.computed(function()
        {
            if (self.isCampaignViewer())
                return false;

            if (self.player.moving() || self.scanning())
                return false;

            var currentStar = self.currentStar();
            if (!currentStar)
                return false;

            return self.testGameState({begin: function() { return !!currentStar.hasCard() && !currentStar.ai(); }}, false);
        });

        self.displayExplore = ko.computed(function()
        {
            return self.canExplore() && self.selection.star() === game.currentStar();
        });

        // self.canExplore.subscribe(function(newValue)
        // {
        //     if (!newValue)
        //         return;
        //     self.selection.star(game.currentStar());
        // });

        self.canSelectOrMovePrefix = function()
        {
            return self.testGameState(
            {
                begin: function()
                {
                    return !self.canExplore();
                },
                fight: function()
                {
                    return !self.canExplore();
                },
                end: true
            }, false);
        };

        self.canSelect = function(star)
        {
            if (self.isCampaignViewer() && !self.gwCampaignReplayingAction)
                return false;

            var game = self.game();
            var cheats = self.cheats;

            if (game.currentStar() === star)
                return true;

            if (!self.canSelectOrMovePrefix() && !cheats.noFog())
                return false;

            var galaxy = game.galaxy();

            return galaxy.pathBetween(game.currentStar(), star, cheats.noFog());
        };

        self.canMove = ko.computed(function()
        {
            if (self.isCampaignViewer() && !self.gwCampaignReplayingAction)
                return false;

            if (self.player.moving())
                return false;

            var game = self.game();
            var galaxy = game.galaxy();
            var from = game.currentStar();
            var to = self.selection.star();

            if ((to < 0) || (to > galaxy.stars().length))
                return false;

            if (!self.canSelectOrMovePrefix())
                return false;

            if (from === to)
                return false;

            return galaxy.pathBetween(from, to, self.cheats.noFog());
        });

        self.displayMove = ko.computed(function()
        {
            return self.canMove();
        });

        self.moveStep = function(path)
        {
            var star = path[0];
            var system = self.galaxy.systems()[star];
            self.player.moveTo(star, function() {
                var visitedBeforeMove = system.visited();

                if (!system.visited()) {
                    console.log('[GW_COOP] revealSystem trigger star=' + star + ' role=' + self.gwCampaignRole() + ' replay=' + self.gwCampaignReplayingAction);
                    self.revealSystem(system);
                }

                game.move(star);

                // Some viewer replays can miss the internal move mutation. Force minimal sync fallback.
                if (self.isCampaignViewer() && game.currentStar() !== star) {
                    console.log('[GW_COOP] viewer move fallback set currentStar from=' + game.currentStar() + ' to=' + star);
                    game.currentStar(star);
                }

                if (self.isCampaignViewer() && !system.visited() && visitedBeforeMove === false) {
                    var replayStar = game.galaxy().stars()[star];
                    if (replayStar && _.isFunction(replayStar.history)) {
                        var history = replayStar.history() || [];
                        replayStar.history(history.concat([{ coop_replay: true, t: _.now() }]));
                        console.log('[GW_COOP] viewer move fallback marked visited star=' + star);
                    }
                }

                if (self.isCampaignViewer()) {
                    var moveSyncStars = [star, game.currentStar()];
                    if (system && _.isFunction(system.neighbors)) {
                        _.forEach(system.neighbors(), function(neighbor) {
                            if (neighbor && _.isNumber(neighbor.index))
                                moveSyncStars.push(neighbor.index);
                        });
                    }
                    self.syncViewerStarsFromGame('move_step_' + star, moveSyncStars);
                }

                self.driveAccessInProgress(true);
                GW.manifest.saveGame(game).then(function() {
                    self.driveAccessInProgress(false);
                });

               if (system.visited && path.length > 1) {
                    path.shift();
                    self.moveStep(path);
                }
            });
        };

        self.move = function()
        {
            if (self.isCampaignViewer() && !self.gwCampaignReplayingAction)
                return;

            var star = self.selection.star();
            var path = self.game().galaxy().pathBetween(game.currentStar(), star, self.cheats.noFog());

            if (path)
            {
                // Discard the source node.
                path.shift();

                self.sendCampaignAction('move_to_star', { star: star });
                self.moveStep(path);
            }
            else
                console.error("Unable to find path for move command", game.currentStar(), star);

        };

        _.forEach(self.galaxy.systems(), function(system, star)
        {
            system.click.subscribe(function() {
                if (self.canSelect(star)) {
                    self.selection.star(star);
                    self.sendCampaignAction('select_star', { star: star });
                }
            });
        });

        self.explore = function() {
            if (self.isCampaignViewer() && !self.gwCampaignReplayingAction)
                return;

            if (!game || !game.explore())
                return;

            if (!self.gwCampaignReplayingAction)
                self.sendCampaignAction('explore', { star: game.currentStar() });

            self.scanning(true);

            api.audio.playSound('/VO/Computer/gw/board_exploring');

            var star = game.galaxy().stars()[game.currentStar()];

            var dealStarCards = !game.isTutorial() && dealer.chooseCards({
                    inventory: game.inventory(),
                    count: 3,
                    star: star,
                    galaxy: game.galaxy()
                }).then(function(result) {

                var ok = true;

                _.forEach(star.cardList(), function(card) {
                    if (!GW.bank.hasStartCard(card))
                        ok = false;
                });

                if (ok)
                    star.cardList(result);

                if (!self.gwCampaignReplayingAction) {
                    self.sendCampaignAction('sync_star_cards', {
                        star: game.currentStar(),
                        cards: star.cardList()
                    });
                }
            });
            $.when(dealStarCards).then(function() {
                self.driveAccessInProgress(true);
                GW.manifest.saveGame(game).then(function() {
                    self.driveAccessInProgress(false);
                });

                _.delay(function() {
                    self.scanning(false);
                }, 2000);
            });
        };
        self.explore.__gwCampaignNative = true;

        self.dismissTech = function() {
            if (self.isCampaignViewer() && !self.gwCampaignReplayingAction)
                return;

            self.win(-1);
            api.audio.playSound('/VO/Computer/gw/board_tech_dismissed');
        };

        self.win = function(selected_card_index) {
            if (self.isCampaignViewer() && !self.gwCampaignReplayingAction)
                return;

            console.log('[GW_COOP] win start selected=' + selected_card_index + ' role=' + self.gwCampaignRole() + ' replay=' + self.gwCampaignReplayingAction + ' currentStar=' + game.currentStar() + ' turnState=' + game.turnState() + ' gameState=' + game.gameState());

            if (!self.gwCampaignReplayingAction)
                self.sendCampaignAction('win_choice', { selected_card_index: selected_card_index });

            self.exitGate($.Deferred());
            var oldSlots = game.inventory().maxCards() - game.inventory().cards().length;

            var tech_card = self.currentSystemCardList()[selected_card_index];
            var tech_audio = (tech_card && tech_card.audio())
                    ? tech_card.audio().found
                    : null;

            var play_tech_audio = !!tech_card;

            game.winTurn(selected_card_index).then(function(didWin) {
                if (!didWin) {
                    console.error('Failed winning turn', game);
                    console.log('[GW_COOP] win failed role=' + self.gwCampaignRole() + ' replay=' + self.gwCampaignReplayingAction + ' currentStar=' + game.currentStar() + ' turnState=' + game.turnState() + ' gameState=' + game.gameState());
                    return;
                }

                var winStar = game.galaxy().stars()[game.currentStar()];
                var winAi = winStar && _.isFunction(winStar.ai) ? winStar.ai() : undefined;
                var winHasCard = winStar && _.isFunction(winStar.hasCard) ? winStar.hasCard() : undefined;
                var winHistory = winStar && _.isFunction(winStar.history) ? (winStar.history() || []).length : undefined;
                console.log('[GW_COOP] win applied role=' + self.gwCampaignRole() + ' replay=' + self.gwCampaignReplayingAction + ' currentStar=' + game.currentStar() + ' hasAi=' + !!winAi + ' hasCard=' + winHasCard + ' history=' + winHistory + ' turnState=' + game.turnState() + ' gameState=' + game.gameState());

                if (self.isCampaignViewer())
                    self.syncViewerStarsFromGame('win_applied');

                self.maybePlayCaptureSound();
                self.driveAccessInProgress(true);
                var saving = GW.manifest.saveGame(game);
                if (saving) {
                    saving.then(function() {
                        self.driveAccessInProgress(false);
                        if (self.gameOver()) {
                            api.tally.incStatInt('gw_war_victory').always(function() {
                                self.exitGate().resolve();
                            });
                        }
                        else {
                            self.exitGate().resolve();

                            if (play_tech_audio) {
                                if (!tech_audio)
                                    api.audio.playSound('/VO/Computer/gw/board_tech_acquired');
                                else
                                    api.audio.playSound(tech_audio);
                            }
                        }
                    });
                }
            });
        };
        self.win.__gwCampaignNative = true;

        self.lose = function() {
            if (self.isCampaignViewer() && !self.gwCampaignReplayingAction)
                return;

            console.log('[GW_COOP] lose start role=' + self.gwCampaignRole() + ' replay=' + self.gwCampaignReplayingAction + ' currentStar=' + game.currentStar() + ' turnState=' + game.turnState() + ' gameState=' + game.gameState());

            if (!self.gwCampaignReplayingAction)
                self.sendCampaignAction('lose_turn', {});

            self.exitGate($.Deferred());
            if (game.loseTurn()) {
                var loseStar = game.galaxy().stars()[game.currentStar()];
                var loseAi = loseStar && _.isFunction(loseStar.ai) ? loseStar.ai() : undefined;
                var loseHasCard = loseStar && _.isFunction(loseStar.hasCard) ? loseStar.hasCard() : undefined;
                var loseHistory = loseStar && _.isFunction(loseStar.history) ? (loseStar.history() || []).length : undefined;
                console.log('[GW_COOP] lose applied role=' + self.gwCampaignRole() + ' replay=' + self.gwCampaignReplayingAction + ' currentStar=' + game.currentStar() + ' hasAi=' + !!loseAi + ' hasCard=' + loseHasCard + ' history=' + loseHistory + ' turnState=' + game.turnState() + ' gameState=' + game.gameState());

                if (self.isCampaignViewer())
                    self.syncViewerStarsFromGame('lose_applied');

                $.when([
                    GW.manifest.saveGame(game),
                    api.tally.incStatInt('gw_war_loss')
                ]).then(function() {
                    self.exitGate().resolve();
                });
            }
            else {
                console.log('[GW_COOP] lose failed role=' + self.gwCampaignRole() + ' replay=' + self.gwCampaignReplayingAction + ' currentStar=' + game.currentStar() + ' turnState=' + game.turnState() + ' gameState=' + game.gameState());
                self.exitGate().resolve();
            }
        };
        self.lose.__gwCampaignNative = true;

        self.restartFight = function(model, event, cheat) {
            if (self.isCampaignViewer())
                return;

            game.replayName(null);
            game.replayLobbyId(null);
            game.replayStar(null);
            self.fight(model, event, cheat);
        }

        self.fight = function(model, event, cheat) {
            if (self.isCampaignViewer())
                return;

            if (self.launchingFight() || (!self.fighting() && !game.fight())) {
                return;
            }
            var save = GW.manifest.saveGame(game);

            if (cheat)
                return;

            self.launchingFight(true);

            if (!self.launchingTutorialFight())
                api.audio.playSound('/VO/Computer/gw/board_initiating_battle');

            var inventory = game.inventory();
            var oldCommander = inventory.getTag('global', 'commander');
            var tutorialCommander;
            if (self.game().isTutorial()) {
                // ADD TUTORIAL SPECIFIC DATA HERE
                switch (game.currentStar()) {
                    case 0: tutorialCommander = '/pa/units/commanders/tutorial_titan_commander/tutorial_titan_commander.json'; break;
                    default: tutorialCommander = '/pa/units/commanders/tutorial_player_commander/tutorial_player_commander.json'; break;
                }

                inventory.setTag('global', 'commander', tutorialCommander);
                inventory.units().push(tutorialCommander);
            }

            var hireReferee = hireRefereesForLaunch(game, self.gwCampaignActive() && self.isCampaignHost());
            var liveGameScriptLoad = $.get('coui://ui/main/game/live_game/live_game.js');
            var liveGameScriptPatchLoad = $.get('coui://ui/main/game/galactic_war/gw_play/live_game_patch.js');

            $.when(
                save,
                hireReferee,
                liveGameScriptLoad,
                liveGameScriptPatchLoad
            ).always(function(
                saveResult,
                refereeBundle,
                liveGameScriptGet,
                liveGameScriptPatchGet
            ) {
                var patchedLiveGameScript = liveGameScriptGet[0] + liveGameScriptPatchGet[0];

                var referee = refereeBundle && refereeBundle.sharedReferee;
                var localReferee = refereeBundle && refereeBundle.localReferee;

                if (!referee) {
                    console.log('[GW_COOP] failed to hire GW referee for launch');
                    self.launchingFight(false);
                    return;
                }

                var localFiles = {};
                if (localReferee && _.isFunction(localReferee.files)) {
                    var personalizedFiles = localReferee.files();
                    if (_.isObject(personalizedFiles))
                        localFiles = _.cloneDeep(personalizedFiles);
                }
                console.log('[GW_COOP] personalizedFiles for launch', localFiles);

                localFiles['/ui/main/game/live_game/live_game.js'] = patchedLiveGameScript;
                referee.localFiles(localFiles);

                referee.stripSystems();
                referee.mountFiles().always(function()
                {
                    referee.tagGame();

                    // Persist campaign context into the battle config so gw_lobby can
                    // infer whether this launch is solo GW or campaign-coop GW.
                    var battleConfig = referee.config();
                    // localFiles are host-local memory mounts only; include the
                    // patch in config.files so reconnecting/remote clients mount
                    // the same live_game override.
                    battleConfig.files = _.assign({}, battleConfig.files || {}, {
                        '/ui/main/game/live_game/live_game.js': patchedLiveGameScript
                    });
                    battleConfig.gw_campaign_active = !!self.gwCampaignActive();

                    // Mirror current campaign lobby presentation settings so the
                    // battle lobby beacon can continue the same identity.
                    var campaignControl = self.gwCampaignControl() || {};
                    var campaignSettings = campaignControl.settings || {};
                    battleConfig.gw_campaign_settings = {
                        game_name: _.isString(campaignSettings.game_name) ? campaignSettings.game_name : 'GW Co-op Campaign',
                        tag: _.isString(campaignSettings.tag) ? campaignSettings.tag : 'Testing',
                        public: _.isBoolean(campaignSettings.public) ? campaignSettings.public : true,
                        friends: !!campaignSettings.friends,
                        hidden: !!campaignSettings.hidden,
                        max_clients: _.isFinite(campaignControl.max_clients) ? campaignControl.max_clients : undefined
                    };

                    self.battleConfig(battleConfig);

                    // Come back if we fail.
                    self.connectFailDestination(window.location.href);

                    var tutorial = ko.observable().extend({ session: 'current_system_tutorial' });
                    tutorial(model.currentSystem().star.tutorial());

                    // Remove the tutorial commander from the game.  (It's not supposed to persist.)
                    if (tutorialCommander) {
                        inventory.units().pop();
                        game.inventory().setTag('global', 'commander', oldCommander);
                    }

                    var params = {
                        action: 'start',
                        mode: 'gw',
                        content: game.content()
                    };

                    if (self.useLocalServer()) {
                        self.serverType('local');
                        params['local'] = true;
                    }
                    else {
                        self.serverType('uber');
                    }

                    var connect = function() {
                        api.debug.log('start gw: ok');
                        self.serverSetup('game');
                        window.location.href = 'coui://ui/main/game/connect_to_game/connect_to_game.html?' + $.param(params);
                    }

                    if (self.gwCampaignActive() && self.isCampaignHost()) {
                        self.send_message('launch_gw_battle', {
                            current_star: game.currentStar(),
                            gw_campaign_active: true,
                            gw_campaign_settings: battleConfig.gw_campaign_settings
                        });
                        return;
                    }

                    if (!self.allowLoad())
                        connect();
                    else if (self.useLocalServer()) {
                        api.file.listReplays().then(function(replays) {
                            if (_.has(replays, game.replayName())) {
                                var paths = replays[game.replayName()];
                                api.debug.log('local gw loadsave: ok', game.replayName(), paths);
                                self.serverSetup('loadsave');
                                self.serverType('uber');
                                params['mode'] = 'loadsave'
                                params['loadpath'] = paths.replay;
                            } else {
                                /* we could not find a match.  the replay is missing or the data is corrupted. */
                                console.log('loadsave: failed with' + game.replayName());
                            }

                            connect();
                        });
                    }
                    else {
                        api.debug.log('remote gw loadsave: ok');
                        self.serverSetup('loadsave');
                        params['mode'] = 'loadsave'
                        params['replayid'] = game.replayLobbyId();
                        connect();
                    }
                });
            });
        };

        self.cards = ko.observableArray();
        self.hoverCard = ko.observable();
        self.hoverOffset = ko.observable(0);
        var hoverCount = 0;
        self.setHoverCard = function(card, hoverEvent) {
            if (card === self.hoverCard())
                card = undefined;

            ++hoverCount;
            if (!card) {
                // Delay clears for a bit to avoid flashing
                var oldCount = hoverCount;
                _.delay(function() {
                    if (oldCount !== hoverCount)
                        return;
                    self.hoverCard(undefined);
                }, 300);
                return;
            }

            var $block = $(hoverEvent.target);
            if (!$block.is('.one-card'))
                $block = $block.parent('.one-card');
            var left = $block.offset().left + $block.width() / 2;
            self.hoverOffset(left.toString() + 'px');
            self.hoverCard(card);
        };
        self.discardHoverCard = function(card) {
            if (self.isCampaignViewer() && !self.gwCampaignReplayingAction)
                return;

            // Since some earlier programmer was nice enough to have this card
            // variable passed to this function and never actually used, 
            // I shall repurpose it to avoid having to add any more parameters to the function
            // so that it can be used as a discard index in the case that this function
            // is being called from applyCampaignSnapshot to do a clientside discard of a card that was
            // ordered to be discarded from the host.
            if (self.gwCampaignReplayingAction) {
                var discardIndex = parseInt(card);
                if (!isNaN(discardIndex) && discardIndex >= 0 && discardIndex < self.cards().length) {
                    var discard = self.cards()[discardIndex];
                    game.inventory().cards.splice(discardIndex, 1);
                    game.inventory().applyCards(function() {
                        GW.manifest.saveGame(game).then(function() {
                            api.audio.playSound('/VO/Computer/gw/board_tech_deleted');
                        });
                    });
                }

                return;
            }

            var discard = self.hoverCard();
            if (!discard)
                return;
            self.hoverCard(undefined);

            var discardIndex = self.cards().indexOf(discard);

            // Since we didn't return earlier from the if self.gwCampaignReplayingAction block, 
            // this discard is coming from the host. So we have a responsibility
            // to apply the discard on the clientside as well, to keep everyone in sync. 
            self.sendCampaignAction('discard_card', { discard_index: discardIndex });

            if (discardIndex >= 0) {
                game.inventory().cards.splice(discardIndex, 1);

                self.driveAccessInProgress(true);
                game.inventory().applyCards(function() {
                    GW.manifest.saveGame(game).then(function() {
                        self.driveAccessInProgress(false);
                        api.audio.playSound('/VO/Computer/gw/board_tech_deleted');
                    });
                });
            }
        };
        self.updateCards = function()
        {
            var inventory = game.inventory();
            var cards = inventory.cards();
            var cardModels = self.cards();
            var numCards = inventory.maxCards();
            if (numCards < cardModels.length)
                self.cards.splice(numCards, cardModels.length);
            else {
                while (numCards > cardModels.length) {
                    self.cards.push(new CardViewModel(cards[cardModels.length]));
                }
            }

            _.forEach(cardModels, function(cardModel, index) {
                var card = cards[index];
                if (!_.isEqual(card, cardModel.params()))
                    cardModel.params(card);
            });
        };
        // Note: The cards array in the inventory mutates multiple times when
        // some cards are received.  To avoid flashing of the inventory panel,
        // wait a little while before applying changes.
        self.cardsDirty = false;
        self.cardsChanged = function()
        {
            if (self.cardsDirty)
                return;
            self.cardsDirty = true;

            if (!game.busy || !_.isFunction(game.busy.then)) {
                self.cardsDirty = false;
                self.updateCards();
                return;
            }

            game.busy.then(function()
            {
                self.cardsDirty = false;
                self.updateCards();
            });
        };
        game.inventory().cards.subscribe(self.cardsChanged);
        game.inventory().maxCards.subscribe(self.cardsChanged);

        self.updateCards();

        self.currentSystemCardList = ko.computed(function() {
            var currentStar = self.currentStar();
            if (!currentStar || !_.isFunction(currentStar.cardList))
                return null;

            var ok = true;
            var result = _.map(currentStar.cardList(), function(card) {
                if (!card)
                    ok = false;
                return card && new CardViewModel(card);
            });

            return ok ? result : null;
        });
        self.showSystemCard = ko.computed(function() {
            return self.exploring() && self.currentSystemCardList() && !self.scanning();
        });

        self.showSystemCard.subscribe(function() {
            if (self.showDataBankFullWarning()) {
                api.audio.playSound('/VO/Computer/gw/board_tech_banks_full');
            }
        });

        self.currentSystemCardListConditions = ko.observable([]);

        self.currentSystemCardListConditionsRule = ko.computed(function() {

            if (self.driveAccessInProgress())
                return;

            var inventory = game.inventory();

            var list = _.map(self.currentSystemCardList(), function(element) {
                var duplicate = inventory.hasCard(element) && element.visible();
                var fit = inventory.canFitCard(element.params());
                var loadout = element.isLoadout();
                var result = {
                    'duplicate': duplicate,
                    'can_fit': fit,
                    'loadout': loadout,
                    'ok': !duplicate && fit
                };
                return result;
            });

            self.currentSystemCardListConditions(list);
        });

        self.showDataBankFullWarning = ko.observable(false);
        self.showDataBankFullWarningRule = ko.computed(function() {

            if (self.driveAccessInProgress())
                return;

            var inventory = game.inventory();
            if (!inventory.handIsFull())
                return self.showDataBankFullWarning(false);

            var result =  _.any(self.currentSystemCardListConditions(), function(element) {
                return !element.can_fit;
            });

            self.showDataBankFullWarning(result);
        });

        self.inventoryOverflowLeft = ko.observable(false);
        self.inventoryOverflowRight = ko.observable(false);

        self.updateInventoryOverflow = function()
        {
            var $wrapper = $("#inventory .scroll-wrapper");
            var inventoryWidth = $wrapper.innerWidth();
            var containerWidth = $("#inventory .scroll-container").width();
            self.inventoryOverflowLeft($wrapper.scrollLeft() > 0);
            var scrollRight = containerWidth - ($wrapper.scrollLeft() + inventoryWidth);
            self.inventoryOverflowRight(scrollRight > 0);
        };
        self.cards.subscribe(self.updateInventoryOverflow);

        $(window).resize(self.updateInventoryOverflow);
        // Note: This ties the overflow state to the visibility of the cards.

        self.computeInventoryOverflowBusy = false;

        self.computeInventoryOverflow = ko.computed(function()
        {
            var cards = self.cards();
            var visible = _.reduce(cards, function(n, card) { return card.visible(); });
            if (!self.computeInventoryOverflowBusy) {
                self.computeInventoryOverflowBusy = true;
                _.delay(function() {
                    self.updateInventoryOverflow(visible);
                    self.computeInventoryOverflowBusy = false;
                });
            }
        });

        self.gameOver = ko.computed(function()
        {
            if (game.gameState() === GW.Game.gameStates.lost)
                return true;
            if (game.gameState() !== GW.Game.gameStates.won)
                return false;
            if ((game.turnState() !== GW.Game.turnStates.end) && !game.isTutorial())
                return false;
            return true;
        });

        // Default to being centered on the current star's connections
        self.centerOnPlayer = function() {
            var galaxy = game.galaxy();
            var home = game.currentStar();
            var currentStar = self.currentStar();
            if (!currentStar || !_.isFunction(currentStar.coordinates))
                return;

            var coords = currentStar.coordinates();
            var bounds = [coords.slice(0), coords.slice(0)];
            _.forEach(galaxy.stars(), function(star, s) {
                if (s === home || !galaxy.areNeighbors(s, home))
                    return;
                var coords = star.coordinates();
                bounds[0][0] = Math.min(bounds[0][0], coords[0]);
                bounds[0][1] = Math.min(bounds[0][1], coords[1]);
                bounds[1][0] = Math.max(bounds[1][0], coords[0]);
                bounds[1][1] = Math.max(bounds[1][1], coords[1]);
            });

            var center = [
                (bounds[0][0] + bounds[1][0]) / 2,
                (bounds[0][1] + bounds[1][1]) / 2,
                0
            ];
            self.galaxy.scrollTo(center);
        };

        self.centerOnOrigin = function() {
            var galaxy = game.galaxy();
            // center on the galaxy
            self.galaxy.scrollTo([0, 0, 0]);

            // offset to center in whitespace
            var height = $('#inventory').outerHeight();
            self.galaxy.scrollBy([0, height]);
        };

        self.revealSystem = function(system) {
            if (!system) {
                console.log('[GW_COOP] revealSystem skipped: no system role=' + self.gwCampaignRole() + ' replay=' + self.gwCampaignReplayingAction);
                return;
            }

            var newNeighbors = _.filter(system.neighbors(), function(neighbor) { return !neighbor.connected(); });
            var newBoss = _.some(newNeighbors, function(neighbor) {
                return neighbor.star.ai() && neighbor.star.ai().boss;
            });
            var hasAi = !!(system.star.ai && system.star.ai());
            var hasBoss = !!(hasAi && system.star.ai().boss);
            console.log('[GW_COOP] revealSystem role=' + self.gwCampaignRole() + ' replay=' + self.gwCampaignReplayingAction + ' newNeighbors=' + newNeighbors.length + ' hasAi=' + hasAi + ' hasBoss=' + hasBoss);

            if (newBoss) {
                console.log('[GW_COOP] cue board_commander_factionleader_discovered');
                api.audio.playSound('/VO/Computer/gw/board_commander_factionleader_discovered');
            }
            else if (system.star.ai() && !system.star.ai().boss) {
                console.log('[GW_COOP] cue board_commander_discovered');
                api.audio.playSound('/VO/Computer/gw/board_commander_discovered');
            }
        };

        self.introVideoId = ko.observable('Tfg18BseBUY');
        self.showIntro = ko.observable();

        self.hidingUI = ko.computed(function() {
            return self.launchingTutorialFight() || self.showIntro();
        });

        self.maybePlayCaptureSound = function() {
            var currentStar = self.currentStar();
            if (!currentStar) {
                console.log('[GW_COOP] maybePlayCaptureSound no currentStar role=' + self.gwCampaignRole() + ' replay=' + self.gwCampaignReplayingAction);
                return false;
            }

            if (currentStar.ai()) {
                console.log('[GW_COOP] maybePlayCaptureSound blocked: ai present star=' + game.currentStar());
                return false;
            }

            var history = currentStar.history();
            var last = history[history.length - 1];
            if (!last || !last.details || !last.details.win || !last.details.win.ai) {
                console.log('[GW_COOP] maybePlayCaptureSound blocked: no capture history star=' + game.currentStar() + ' history=' + history.length);
                return false;
            }

            console.log('[GW_COOP] cue board_system_capture star=' + game.currentStar() + ' role=' + self.gwCampaignRole() + ' replay=' + self.gwCampaignReplayingAction);
            api.audio.playSound('/VO/Computer/gw/board_system_capture');
            return true;
        };
        self.playEntrySound = function() {
            if (self.showIntro()) {
                return; // Handled by video
            } else if (self.maybePlayCaptureSound())
                return;
            else {
                if (self.game().isTutorial()) {
                    api.audio.playSound('/VO/Computer/Tutorial/Intro');
                } else {
                    api.audio.playSound('/VO/Computer/gw/board_start_online');
                }
            }
        }

        self.handleIntro = function() {
            var wasMusicPaused = $.Deferred();
            self.showIntro.subscribe(function(showIntro) {
                self.galaxy.restartUpdateLoop();
                if (showIntro === true) {
                    wasMusicPaused = api.audio.isMusicPaused();
                    api.audio.pauseMusic(true);
                    api.Panel.message(api.Panel.parentId, 'play_gw_intro');
                    return;
                }
                // Note: showIntro starts as undefined
                if (showIntro !== false)
                    return;
                $("#fade").fadeOut(1000);
                self.playEntrySound();
                wasMusicPaused.then(function(paused) {
                    api.audio.pauseMusic(paused);
                    wasMusicPaused = $.Deferred();
                });
                api.audio.setMusic('/Music/Music_GW_board');
            });
        };

        self.modalBack = function() {
            if (self.showIntro()) {
                self.showIntro(false);
                api.Panel.message(api.Panel.parentId, "finish_video");
            }
            else if (self.showPopUp())
                self.popUpSecondaryButtonAction();
            else
                model.showSideBar(!model.showSideBar());
        }

        self.gameOverCHeck = ko.computed(function()
        {
            if (self.gameOver())
            {
                self.exitGate().then(function()
                {
                    window.location.href = 'coui://ui/main/game/galactic_war/gw_war_over/gw_war_over.html';
                });
            }
        });

        self.hasEnteredGame = ko.observable().extend({ session: 'has_entered_game' });

        self.start = function()
        {
            self.hasEnteredGame(true);

            self.ensureCampaignCompatibilityHooks();
            if (!self.gwCampaignHookWatchHandle) {
                self.gwCampaignHookWatchHandle = setInterval(function() {
                    self.ensureCampaignCompatibilityHooks();
                }, 1000);
            }

            if (self.isCampaignHost() && self.gwCampaignConnected() && self.gwCampaignStartupBattleResult && !self.gwCampaignStartupResultSent) {
                self.gwCampaignStartupResultSent = true;
                console.log('[GW_COOP] host relaying startup_battle_result=' + self.gwCampaignStartupBattleResult);
                self.sendCampaignAction('startup_battle_result', { result: self.gwCampaignStartupBattleResult });
            }

            // Set up resize event for window so we can update the canvas resolution
            $(window).resize(self.resize);
            self.resize();

            self.centerOnOrigin();

            if (!self.gameOver())
            {
                self.handleIntro();
            }

            self.showIntro(self.game().stats().turns() === 1 && !self.game().isTutorial());


            if (self.game().stats().turns() === 1 && self.game().isTutorial()) {
                self.launchingTutorialFight(true);
                self.fight(self, null, false);
                self.game().stats().turns(2); /* the turn counter naturally increments when the player flies to another system */
            }
        };

        self.showSocial = ko.observable(true).extend({ session: 'show_social' });

        self.isUberBarVisible = self.showSocial;

        self.updateSocialVisibility = function()
        {
            api.Panel.message('uberbar', 'visible', { 'value': self.showSocial() });
        }

        self.showSocial.subscribe(self.updateSocialVisibility);

        self.toggleSocial = function()
        {
            self.showSocial(!self.showSocial());
        };

        self.toggleUberBar = self.toggleSocial;

        // Note: This is a fix for games that got into a situation where the
        // game explored a system it wasn't supposed to due to a bug that
        // has been fixed.  (Auto-scanning a system that didn't have a card.)
        if (self.exploring() && !self.currentStar().hasCard()) {
            game.turnState('begin');
        }

        self.unitSpecs = ko.observable({});

        self.setup = function()
        {
            engine.call('request_spec_data', api.Panel.pageId);

            $("body").mousemove(function(event)
            {
                var halfWidth = window.innerWidth / 2;
                var halfHeight = window.innerHeight / 2;
                var pos = [event.pageX - halfWidth, event.pageY - halfHeight];
                if (!self.firstMousePosition())
                {
                    // Use the first mouse movement as an origin to avoid popping.
                    self.firstMousePosition(pos)
                    return;
                }
                VMath._sub_v2(pos, self.firstMousePosition());
                self.galaxy.parallax(pos);
                // Smoothly reset the center of parallax to the origin.
                VMath._mul_v2_s(self.firstMousePosition(), 0.9);
            });

            _.defer(self.updateSocialVisibility);

            if (self.gwCampaignHeartbeatHandle) {
                clearInterval(self.gwCampaignHeartbeatHandle);
                self.gwCampaignHeartbeatHandle = undefined;
            }

            if (self.gwCampaignHookWatchHandle) {
                clearInterval(self.gwCampaignHookWatchHandle);
                self.gwCampaignHookWatchHandle = undefined;
            }
        }

        self.activeGameId = ko.observable().extend({ local: 'gw_active_game' });
    }

    // Start loading the game & document
    var activeGameId = ko.observable().extend({ local: 'gw_active_game'});
    var safeStorageGet = function(storage, key) {
        try {
            return storage && _.isFunction(storage.getItem) ? storage.getItem(key) : undefined;
        }
        catch (e) {
            return undefined;
        }
    };

    var parseStoredValue = function(value) {
        var parsed = value;
        var maxDepth = 4;

        while (maxDepth-- > 0) {
            if (_.isString(parsed)) {
                try {
                    parsed = JSON.parse(parsed);
                    continue;
                }
                catch (e) {
                    return parsed;
                }
            }

            if (parsed && _.isObject(parsed) && _.has(parsed, 'value')) {
                parsed = parsed.value;
                continue;
            }

            break;
        }

        return parsed;
    };

    var isTruthyStorageValue = function(value) {
        if (value === true || value === 1)
            return true;

        if (!_.isString(value))
            return false;

        var normalized = value.toLowerCase();
        return normalized === '1' || normalized === 'true' || normalized === 'yes';
    };

    var gwCampaignMode = (function() {
        var query = window.location.search || '';
        if (!query.length || query.charAt(0) !== '?')
            return false;

        var pairs = query.substring(1).split('&');
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i].split('=');
            if (decodeURIComponent(pair[0] || '') !== 'gw_campaign')
                continue;

            var value = decodeURIComponent(pair[1] || '');
            return value === '1' || value === 'true';
        }

        return false;
    })();

    var gwCampaignReconnectMode = (function() {
        if (gwCampaignMode)
            return true;

        var setup = safeStorageGet(window.sessionStorage, 'game_server_setup');
        if (setup === 'gw_campaign')
            return true;

        var enabled = safeStorageGet(window.sessionStorage, 'gw_campaign_enabled');
        if (isTruthyStorageValue(enabled))
            return true;

        var reconnectInfoRaw = safeStorageGet(window.localStorage, 'reconnect_to_game_info');
        var reconnectInfo = parseStoredValue(reconnectInfoRaw);
        if (reconnectInfo && reconnectInfo.setup === 'gw_campaign')
            return true;

        return false;
    })();

    var gameLoader = GW.manifest.loadGame(activeGameId()).then(function(game) {
        if (game || !gwCampaignReconnectMode)
            return game;

        console.log('[GW_COOP] no local gw_active_game found, creating temporary co-op placeholder reconnectMode=' + gwCampaignReconnectMode + ' queryMode=' + gwCampaignMode);
        return new GW.Game();
    });
    var documentLoader = $(document).ready();

    // We can start when both are ready
    $.when(
        gameLoader,
        documentLoader
    ).then(function(
        game,
        $document
    ) {
        // If the game fails to load, going back is better than getting stuck.
        if (!game) {
            // TODO: Maybe tell the player what's up?
            console.error('Failed loading game');
            self.exitGame();
            return;
        }

        // Ensure active game is now the current game id since tutorials have a new id after
        // the call to GW.manifest.loadGame.
        ko.observable().extend({ local: 'gw_active_game' })(game.id);

        // process any battle results.
        var battleResult = game.lastBattleResult();
        var startupBattleResult = null;
        console.log('[GW_COOP] startup battleResult=' + battleResult + ' currentStar=' + game.currentStar());

        if (battleResult)
        {
            game.lastBattleResult(null);
            startupBattleResult = battleResult;
            if (battleResult === 'win')
                game.winTurn().then(function() {
                    console.log('[GW_COOP] startup battleResult winTurn applied currentStar=' + game.currentStar());
                    GW.manifest.saveGame(game);
                });

            if (battleResult === 'loss') {
                game.loseTurn();
                console.log('[GW_COOP] startup battleResult loseTurn applied currentStar=' + game.currentStar());
                if (game.isTutorial()) {
                    game.turnState(GW.Game.turnStates.begin);
                }
                GW.manifest.saveGame(game);
            }
        }

        model = new GameViewModel(game, startupBattleResult);

        model.setup();

        handlers = {};

        handlers['settings.exit'] = function() {
            model.showSettings(false);
        };

        handlers['panel.invoke'] = function(params) {
            var fn = params[0];
            var args = params.slice(1);
            return model[fn] && model[fn].apply(model, args);
        };

        handlers.finish_video = function(payload) {
            model.showIntro(false);
        };

        handlers.server_state = function(payload) {
            if (payload && payload.url && payload.url !== window.location.href) {
                window.location.href = payload.url;
                return;
            }

            model.updateCampaignConnectionState(payload);
        };

        handlers.gw_campaign_control = function(payload) {
            console.log('[GW_COOP] gw_campaign_control seq=' + (payload && payload.snapshot_seq) + ' hasSnapshot=' + !!(payload && payload.has_snapshot));
            model.gwCampaignControl(payload || {});

            // Any time we get a campaign control message, 
            // we want to re-apply the lobby controls since the campaign state may have changed in a way that affects them.
            model.applyCampaignLobbyControl(model.gwCampaignControl());
            model.requestCampaignChatHistory();

            // In case we restarted the server after continuing the war, 
            // we want to keep the same lobby controls and other information
            // from before the restart.
            model.applyPendingGwCampaignRestartContext();

            if (model.isCampaignHost() && payload && payload.has_snapshot === false) {
                var connectedClients = _.isArray(payload.connected_clients) ? payload.connected_clients : [];
                var hasViewer = _.some(connectedClients, function(client) {
                    return client && client.role === 'viewer';
                });

                if (hasViewer)
                    model.sendCampaignSnapshot('viewer_joined');
            }

            if (model.isCampaignViewer() && payload && payload.has_snapshot && !model.gwCampaignReceivedSnapshot && !model.gwCampaignInitialSyncRequested) {
                model.gwCampaignInitialSyncRequested = true;
                model.requestCampaignSnapshot(true);
            }
        };

        handlers.gw_campaign_role = function(payload) {
            if (!payload || !payload.role)
                return;

            console.log('[GW_COOP] gw_campaign_role=' + payload.role + ' host=' + payload.host_name);
            var previousRole = model.gwCampaignRole();
            model.gwCampaignEnabled(true);
            model.gwCampaignConnected(true);
            model.gwCampaignRole(payload.role);

            // If the payload (which here should be a bit of information containing the player's role and 
            // possibly some information about the host and other clients) contains campaign control information, apply it.  
            // If not, and we don't have any connected clients yet, seed the connected clients with the information from this payload, 
            // since this is likely the first message we're receiving about the campaign session and we don't want
            // to have all our connected clients information be blank until we receive the campaign control message.
            if (payload.control) {
                model.gwCampaignControl(payload.control);
                model.applyCampaignLobbyControl(payload.control);
            }
            else if (!model.gwCampaignConnectedClients().length) {
                var fallbackName = model.displayName() || payload.host_name || loc('!LOC:Player');
                var seeded = [];
                if (payload.role === 'host') {
                    seeded.push({
                        id: payload.host_id,
                        name: payload.host_name || fallbackName,
                        role: 'host'
                    });
                }
                else {
                    seeded.push({
                        id: payload.host_id,
                        name: payload.host_name || loc('!LOC:Host'),
                        role: 'host'
                    });
                    seeded.push({
                        id: model.uberId && _.isFunction(model.uberId) ? model.uberId() : undefined,
                        name: fallbackName,
                        role: 'viewer'
                    });
                }
                model.gwCampaignConnectedClients(seeded);
            }

            if (payload.role === 'viewer' && previousRole !== 'viewer' && !model.gwCampaignReceivedSnapshot && !model.gwCampaignInitialSyncRequested) {
                model.gwCampaignInitialSyncRequested = true;
                model.requestCampaignSnapshot(true);
            }

            // In case we restarted the server after continuing the war, 
            // we want to keep the same lobby controls and other information
            // from before the restart.
            model.applyPendingGwCampaignRestartContext();
        };

        handlers.gw_campaign_snapshot = function(payload) {
            console.log('[GW_COOP] gw_campaign_snapshot recv seq=' + (payload && payload.seq) + ' reason=' + (payload && payload.reason));
            model.applyCampaignSnapshot(payload);
        };

        handlers.request_client_mod_manifest = function() {
            sendClientModManifestFromScene('gw_play');
        };

        handlers.required_client_mods_missing = function(payload) {
            var rejectReason = extractRejectReason(payload);
            console.log('[GW COOP] required_client_mods_missing in gw_play reason=' + rejectReason + ' payload=' + JSON.stringify(payload || {}));

            if (_.isFunction(model.disconnect))
                model.disconnect();
        };

        handlers.all_client_mods_match = function(payload) {
            console.log('[GW COOP] all_client_mods_match in gw_play payload=' + JSON.stringify(payload || {}));
        };

        handlers.gw_campaign_action = function(payload) {
            model.applyCampaignAction(payload);
        };

        // Handles incoming individual chat messages for the campaign chat. 
        handlers.chat_message = function(msg) {
            model.addCampaignChatMessage(msg.player_name, msg.message, true);
        };

        // Handler to update the friends list in the uberbar. 
        handlers.friends = function(payload) {
            // || [] to prevent null.
            model.friends(payload || []);
        };

        handlers.connection_disconnected = function(payload) {
            if (!model.gwCampaignEnabled())
                return;

            var transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
            var transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
            var transitDestination = ko.observable().extend({ session: 'transit_destination' });
            var transitDelay = ko.observable().extend({ session: 'transit_delay' });

            // When the player disconnects from a campaign session or if the sessions
            // is closed thereby forcing a disconnect, we save a local copy of the campaign
            // so the co-op player can keep playing even in single player mode.

            // This section handles the forcible disconnect case.
            model.persistCampaignLocalCopy('disconnect').always(function() {
                transitPrimaryMessage(loc('!LOC:GW Co-op session disconnected'));
                transitSecondaryMessage('');
                transitDestination('coui://ui/main/game/galactic_war/gw_play/gw_play.html');
                transitDelay(3000);
                window.location.href = 'coui://ui/main/game/transit/transit.html';
            });
        };

        handlers.unit_specs = function(payload)
        {
            model.unitSpecs(payload);
        }

        api.Panel.message('uberbar', 'visible', { 'value': false });

       // inject per scene mods
        if (scene_mod_list['gw_play']) {
            loadMods(scene_mod_list['gw_play']);
        }

        // setup send/recv messages and signals
        app.registerWithCoherent(model, handlers);

        if (model.gwCampaignEnabled())
            app.hello(handlers.server_state, handlers.connection_disconnected);

        // When entering the campaign lobby, we want to request the friends list immediately so that 
        // it's populated in the uberbar as soon as possible for the player, since we need to know
        // who friends are if we set up a friends only whitelist.
        api.Panel.message('uberbar', 'request_friends');

        // Activates knockout.js
        ko.applyBindings(model);

        model.start();
    });

});
