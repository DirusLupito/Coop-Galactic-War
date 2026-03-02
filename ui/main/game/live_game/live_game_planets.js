// !LOCNS:live_game
var model;
var handlers = {};

$(document).ready(function () {

    self.planetCommanders = []

    function parentInvoke() {
        api.Panel.message(api.Panel.parentId, 'panel.invoke', Array.prototype.slice.call(arguments, 0));
    }

    function parentQuery() {
        return api.Panel.query(api.Panel.parentId, 'panel.invoke', Array.prototype.slice.call(arguments, 0));
    }

    function PlanetsViewModel() {
        var self = this;

        self.PlanetModel = function (parent, config) {
            var self = this;

            _.assign(self, config);

            self.canStart = ko.computed(function() {
                return parent.landing() && self.starting_planet;
            });
            
            self.playerCommanders = ko.observable([]);
            var newCommanders = []
            _.map(model.planetCommanders, function(commander){
                if(self.index == commander.planet){
                    newCommanders.push(commander.color)
                }
            })
            self.playerCommanders(newCommanders)

            if (self.isSun || config.biome == 'gas') {
                self.metalSpotsDesc = '';
            } else if (config.metalSpots == 0) {
                self.metalSpotsDesc = loc('!LOC:No metal');
            } else  {
                self.metalSpotsDesc = loc('!LOC:__metal_spots__ metal', { metal_spots: config.metalSpots } );
            }

        }

        self.state = ko.observable({});
        self.systemName = ko.computed(function() { return loc(self.state().system) || ''; });
        self.celestialViewModels = ko.computed(function() {
            return _.map(self.state().planets, function(planet) { return new self.PlanetModel(self, planet); });
        });
        self.sun = ko.computed(function() {
            return _.find(self.celestialViewModels(), { isSun: true }) || { isSun: true, isSelected: false };
        });
        self.planets = ko.computed(function() {
            return _.filter(self.celestialViewModels(), { isSun: false });
        });
        self.alivePlanets = ko.computed(function() {
            return _.filter(self.planets(), { dead: false });
        });
        self.selectedCelestialIndex = ko.computed({
            read: function() {
                var state = self.state();
                return state.hasOwnProperty('selected') ? state.selected : 0;
            },
            write: function(value) {
                if (value === self.state().selected)
                    return;
                parentInvoke('selectedCelestialIndex', value);
            }
        });
        self.celestialControl = ko.computed(function() { return self.state().control; });
        self.targeting = ko.computed(function() { return self.state().targeting; });
        self.landing = ko.computed(function() { return self.state().landing; });

        self.active = ko.observable(true);

        self.pinCelestialViewModels = ko.observable(false);
        self.everToggledCelestialViewModels = ko.observable(false);
        self.pinCelestialViewModels.subscribe(function() {
            api.Panel.onBodyResize();
            _.delay(api.Panel.onBodyResize);
        });

        self.autoShow = ko.computed(function() {
            return !self.everToggledCelestialViewModels();
        });
        self.showCelestialViewModels = ko.computed(function() {
            return self.pinCelestialViewModels() || self.celestialControl() || self.autoShow();
        });
        self.togglePinCelestialViewModels = function() {
            self.pinCelestialViewModels(!self.showCelestialViewModels());
            self.everToggledCelestialViewModels(true);
        };

        self.toggleImage = ko.computed(function() {
            return self.showCelestialViewModels() ? 'coui://ui/main/shared/img/controls/pin_open.png' : 'coui://ui/main/shared/img/controls/pin_closed.png';
        });

        self.selectSun = function () { parentInvoke('selectSun'); };

        self.planetThrusterString = function(planet, size, threshold) {
            var rValue = '';
            _.forEach(_.range(size), function (index) {
                if(threshold)
                    rValue +=  '<img class="icon_engine_status" src="img/planet_list_panel/icon_engine_status_empty.png" />';
                else {
                    if (planet.active)
                        rValue += '<img class="icon_engine_status" src="img/planet_list_panel/icon_engine_status_active.png" />';
                    else
                        rValue += '<img class="icon_engine_status" src="img/planet_list_panel/icon_engine_status_ready.png" />';
                }
            });
            return rValue;
        };

        self.planetToolTip = function (planet, threshold) {

            if (planet.isSun && !self.systemName())
                return '';
            
            var metalDisplay = planet.metalSpotsDesc;
            
            return '<div class="div_planet_list_item_center">' +
                        '<div class="planet_title"> ' + (planet.isSun ? self.systemName() : loc(planet.name)) + ' </div>' +
                        ( metalDisplay ? '<div class="planet_metal"> ' + metalDisplay + ' </div>': '' ) +
                        ( planet.delta_v_current ? '<div class="engine_detail_cont">' + (self.planetThrusterString(planet.delta_v_current, false)) +
                        (self.planetThrusterString(planet, planet.delta_v_threshold - planet.delta_v_current, true)) +
                        '</div>' : '' ) +
                    '</div>';
        };

        self.showPreview = function (element, planet) {
            var target = {
                    planetIdx: planet
                }, placement = {
                    element: element,
                    alignElement: [.5, 1],
                    alignDeck: [-2/3, 0],
                    offset: [0, 8]
                };
            preview.show(target, placement);
        }
        self.hidePreview = function ( ) {
            preview.hide();
        }

        self.handleClick = function (index) {
            var planet = self.alivePlanets()[index];

            if (!planet)
                return;

            if (!self.celestialControl())
                api.Panel.message(api.Panel.parentId, 'planets.click', planet.index);
            else if (self.targeting() && planet.isValidTarget)
                api.Panel.message(api.Panel.parentId, 'planets.target', planet.index);
        };

        self.setTargetPlanet = function(index) {
            api.Panel.message(api.Panel.parentId, 'planets.target', index);
        };

        self.smashPlanet = function(index) {
            api.Panel.message(api.Panel.parentId, 'planets.smash', index);
        };


        self.cancelMove = function(index) {
            api.Panel.message(api.Panel.parentId, 'planets.cancelMove', index);
        };

        self.firePlanetWeapon = function(index) {
            api.Panel.message(api.Panel.parentId, 'planets.fireweapon', index);
        };

        self.cancelFire = function(index) {
            api.Panel.message(api.Panel.parentId, 'planets.cancelFire', index);
        };

        self.parentQuery = function(){
            return api.Panel.query(api.Panel.parentId, 'panel.invoke', Array.prototype.slice.call(arguments, 0));
        };

        self.lastAlertPerPlanet = {}

        self.createAlerts = ko.computed(function(){
            _.forEach(self.alivePlanets(), function(planet){
                var chosenAlert = 'none'
                if(!self.celestialControl()){
                    if(planet.thrust_control){
                        if(!planet.thrust_active){
                         //create alert for smash planet
                            chosenAlert = 'smashPlanet'
                    
                        }
                        if(planet.thrust_active){
                            //create alert for stop move
                           chosenAlert = 'stopPlanet'
                        }
                    }
                    if(planet.weapon_control && ! planet.thrust_active){
                        if(!planet.weapon_active){
                            //alert for fire weapon
                            chosenAlert = 'fireWeapon'
                        }
                        if(planet.weapon_active){
                            //alert for stop fire
                            chosenAlert = 'stopWeapon'
                        }
                    }
                    if(self.lastAlertPerPlanet[planet.index] == undefined){
                        self.lastAlertPerPlanet[planet.index] = chosenAlert
                    }
                    else{
                        if(self.lastAlertPerPlanet[planet.index] == chosenAlert){
                            return
                        }
                        else{
                            self.lastAlertPerPlanet[planet.index] = chosenAlert
                            self.parentQuery('createCustomSpecialWeaponAlert',chosenAlert,planet)
                        }
                    }
                }
            })
        })

        self.setup = function () {
            $(window).focus(function() { self.active(true); });
            $(window).blur(function() { self.active(false); });
            parentQuery('planetListState').then(self.state);
        };
    }
    model = new PlanetsViewModel();

    handlers.state = function (payload) {
        model.state(payload);
    };

    handlers.playerCommander = function(payload){
        model.planetCommanders = payload;
        _.map(model.planets(), function(planet){
            var playerCommanders = []
            _.map(payload, function(commanderInfo){
                if(planet.index == commanderInfo.planet){
                    playerCommanders.push(commanderInfo.color)
                }
            })
            planet.playerCommanders(playerCommanders)
        })
    }
    // inject per scene mods
    if (scene_mod_list['live_game_planets'])
        loadMods(scene_mod_list['live_game_planets']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});
