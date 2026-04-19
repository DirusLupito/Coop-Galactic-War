/* includes mod rRandomPlanetName by raevn */

var model;
var handlers;

ko.extenders.precision = function (target, precision) {
  //create a writable computed observable to intercept writes to our observable
  var result = ko
    .pureComputed({
      read: target, //always return the original observables value
      write: function (newValue) {
        if (_.isString(newValue)) {
          newValue = newValue.replace(",", ".");

          newValue = parseFloat(newValue);
          if (!isNaN(newValue)) {
            target(newValue);
          }
        }
        var current = target(),
          roundingMultiplier = Math.pow(10, precision),
          newValueAsNum = isNaN(newValue) ? 0 : +newValue,
          valueToWrite =
            Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier;

        //only write if it changed
        if (valueToWrite !== current) {
          target(valueToWrite);
        } else {
          //if the rounded value is the same, but a different value was written, force a notification for the current field
          if (newValue !== current) {
            target.notifySubscribers(valueToWrite);
          }
        }
      },
    })
    .extend({ notify: "always" });

  //initialize with current value to make sure it is rounded appropriately
  result(target());

  //return the new computed observable
  return result;
};

require(["api"], function (api) {
  var USE_DEFAULT = 0;

  function LandingZone(zone) {
    var self = this;

    self.index = ko.observable(zone.index).extend({ numeric: 0 });
    self.minArmies = ko.observable(zone.min).extend({ numeric: 0 });
    self.maxArmies = ko.observable(zone.max).extend({ numeric: 0 });
    self.x = ko.observable(zone.x);
    self.y = ko.observable(zone.y);
    self.z = ko.observable(zone.z);

    self.rulesAsJson = function () {
      return {
        min: self.minArmies(),
        max: self.maxArmies(),
      };
    };

    self.minArmies.subscribe(model.updateCustomLandingZoneRules);
    self.maxArmies.subscribe(model.updateCustomLandingZoneRules);
  }

  function PlanetModel(planet) {
    var self = this;
    self.seed = planet.seed;
    self.radius = planet.radius;
    self.heightRange = planet.heightRange;
    self.waterHeight = planet.waterHeight;
    self.waterDepth = planet.waterDepth;
    self.temperature = planet.temperature;
    self.metalDensity = planet.metalDensity;
    self.metalClusters = planet.metalClusters;
    self.metalSpotLimit = planet.metalSpotLimit;
    self.biomeScale = planet.biomeScale;
    self.biome = planet.biome;
    self.symmetryType = planet.symmetryType || "none";
    self.symmetricalMetal = planet.symmetricalMetal;
    self.symmetricalStarts = planet.symmetricalStarts;
    self.numArmies = planet.numArmies || 2;
    self.landingZonesPerArmy = planet.landingZonesPerArmy || 0;
    self.landingZoneSize = planet.landingZoneSize || 0;
    self.heightAdjustments = planet.heightAdjustments || [];
  }

  function PlanetSpec(spec) {
    var self = this;
    self.name = spec.name;
    self.mass = spec.mass;
    self.position_x = spec.position_x;
    self.position_y = spec.position_y;
    self.velocity_x = spec.velocity_x;
    self.velocity_y = spec.velocity_y;
    self.required_thrust_to_move = spec.required_thrust_to_move;
    self.starting_planet = spec.starting_planet;
    self.respawn = spec.respawn;
    self.start_destroyed = spec.start_destroyed;
    self.min_spawn_delay = spec.min_spawn_delay;
    self.max_spawn_delay = spec.max_spawn_delay;
    self.planetCSG = spec.planetCSG;
    self.metal_spots = spec.metal_spots;
    self.landing_zones = spec.landing_zones;
    self.planet = new PlanetModel(spec.planet);
  }

  function SystemModel(system) {
    var self = this;
    self.name = system.name;
    self.description = system.description;
    self.creator = system.creator;
    self.version = system.version;
    self.planets = [];
    _.forEach(system.planet_specs, function (planet) {
      self.planets.push(new PlanetSpec(planet));
    });
  }

  var defaultSystem = {
    name: "systemTemplate",
    planets: [
      {
        mass: 2500,
        position_x: 0,
        position_y: 0,
        velocity_x: 0,
        velocity_y: 0,
        name: "planet 0",
        required_thrust_to_move: 0,
        starting_planet: true,
        planet: {
          seed: 0,
          radius: 700,
          heightRange: 25,
          waterHeight: 50,
          waterDepth: 100,
          temperature: 50,
          metalDensity: 50,
          metalClusters: 50,
          biome: "earth",
          biomeScale: 50,
        },
      },
    ],
  };

  var templates = [
    {
      name: "earth template",
      mass: 20000,
      required_thrust_to_move: 0,
      planet: {
        seed: 31541,
        radius: 500,
        heightRange: 35,
        waterHeight: 34,
        waterDepth: 100,
        temperature: 50,
        metalDensity: 50,
        metalClusters: 50,
        biome: "earth",
        biomeScale: 50,
      },
    },
    {
      name: "desert template",
      mass: 10000,
      required_thrust_to_move: 0,
      planet: {
        seed: 9756,
        radius: 500,
        heightRange: 35,
        waterHeight: 33,
        waterDepth: 100,
        temperature: 100,
        metalDensity: 50,
        metalClusters: 50,
        biome: "desert",
        biomeScale: 75,
      },
    },
    {
      name: "ice template",
      mass: 10000,
      required_thrust_to_move: 0,
      planet: {
        seed: 14451,
        radius: 500,
        heightRange: 35,
        waterHeight: 34,
        waterDepth: 100,
        temperature: 0,
        metalDensity: 50,
        metalClusters: 50,
        biome: "earth",
        biomeScale: 50,
      },
    },
    {
      name: "tropical template",
      mass: 10000,
      required_thrust_to_move: 0,
      planet: {
        seed: 21542,
        radius: 400,
        heightRange: 35,
        waterHeight: 34,
        waterDepth: 100,
        temperature: 80,
        metalDensity: 50,
        metalClusters: 50,
        biome: "tropical",
        biomeScale: 50,
      },
    },
    {
      name: "metal template",
      mass: 35000,
      required_thrust_to_move: 0,
      planet: {
        seed: 6846,
        radius: 760,
        heightRange: 0,
        waterHeight: 0,
        waterDepth: 100,
        temperature: 50,
        metalDensity: 75,
        metalClusters: 100,
        biome: "metal",
        biomeScale: 50,
      },
    },
    {
      name: "lava template",
      mass: 10000,
      required_thrust_to_move: 0,
      planet: {
        seed: 7846,
        radius: 400,
        heightRange: 35,
        waterHeight: 33,
        waterDepth: 100,
        temperature: 100,
        metalDensity: 75,
        metalClusters: 75,
        biome: "lava",
        biomeScale: 50,
      },
    },
    {
      name: "moon template",
      mass: 5000,
      required_thrust_to_move: 3,
      planet: {
        seed: 78462,
        radius: 250,
        heightRange: 50,
        waterHeight: 0,
        waterDepth: 100,
        temperature: 0,
        metalDensity: 25,
        metalClusters: 25,
        biome: "moon",
        biomeScale: 50,
      },
    },
    {
      name: "gas template",
      mass: 50000,
      required_thrust_to_move: 0,
      planet: {
        seed: 8239,
        radius: 1500,
        heightRange: 0,
        waterHeight: 0,
        waterDepth: 100,
        temperature: 50,
        metalDensity: 0,
        metalClusters: 0,
        biome: "gas",
        biomeScale: 100,
      },
    },

    /* remove sandbox template.  it is useful for developers,
            but it doesn't need to appear for most users. */
    /*{
              name: "sandbox template",
              mass: 5000,
              required_thrust_to_move: 3,
              planet: {
                  seed: 78462,
                  radius: 400,
                  heightRange: 0,
                  waterHeight: 0,
                  temperature: 0,
                  metalDensity: 0,
                  metalClusters: 0,
                  biome: 'sandbox',
                  biomeScale: 50
              }
          },*/
  ];

  function SystemEditorViewModel() {
    var self = this;

    self.keybindFor = function (key) {
      var binding = api.settings.value("keyboard", key);
      if (!binding) return null;

      return binding;
    };

    self.brushMap = ko.observable({});

    self.selectedBrushBiome = ko.observable();
    self.brushBiomes = ko.computed(function () {
      return _.keys(self.brushMap());
    });

    self.selectedBrushGroup = ko.observable();
    self.brushGroups = ko.computed(function () {
      var map = self.brushMap()[self.selectedBrushBiome()];
      if (!map) return [];

      return _.keys(map);
    });
    self.brushGroups.subscribe(function (value) {
      if (value.length) self.selectedBrushGroup(value[0]);
    });

    self.availableBrushes = ko.computed(function () {
      var map = self.brushMap()[self.selectedBrushBiome()];

      if (!map) return null;

      return map[self.selectedBrushGroup()];
    });

    self.biomes = ko.observableArray([
      "earth",
      "desert",
      "lava",
      "metal",
      "moon",
      "tropical",
      "gas",
      "sandbox",
    ]);
    self.selectedBiome = ko.observable(self.biomes()[0]);

    self.selectedBiomeIsGas = ko.computed(function () {
      return self.selectedBiome() == "gas";
    });

    self.selectedBiomeIsNotGas = ko.computed(function () {
      return !self.selectedBiomeIsGas();
    });

    self.setCsgDescription = function (element) {
      if (self.selectedBiome() !== "metal")
        if (element.proj === "BP_LongitudePinch") element.proj = "BP_Bend";

      api.terrain_editor.setCsgDescription(element);
    };

    var start = /[^\/]*$/;
    var end = /[.]json[^\/]*$/;

    var specToTitle = function (csg) {
      if (!csg || !csg.brush_spec) return csg;

      var zeros = /0+(?=\d)/;
      var title = csg.brush_spec;

      title = title.substring(title.search(start), title.search(end));
      title = title.replace(zeros, "");
      title = title.replace(/_/g, " ");
      csg.title = title;
    };

    var specToImage = function (csg) {
      if (!csg || !csg.brush_spec) return "";

      var title = csg.brush_spec;
      title = title.substring(title.search(start), title.search(end));

      var image =
        "coui://ui/main/game/system_editor/img/brushes/" + title + ".png";
      csg.image = image;
    };

    var brushMapRule = ko.computed(function () {
      var fullBrushListPromise = $.get("coui://pa/terrain/brush_list.json")
      //these brushes either crash the game(lava crack 5), or do nothing when selected
      var invalidBrushes = [
        "/pa/terrain/lava/brushes/lava_crack_05.json",
        "/pa/terrain/moon/brushes/crater_compound_01.json",
        "/pa/terrain/lava/brushes/lava_rock_13.json",
        "/pa/terrain/lava/brushes/lava_rock_14.json",
        "/pa/terrain/lava/brushes/lava_rock_15.json",
        "/pa/terrain/lava/brushes/lava_rock_16.json",
        "/pa/terrain/metal/brushes/metal_cap_01.json",
        "/pa/terrain/metal/brushes/metal_cap_02.json",
        "/pa/terrain/metal/brushes/metal_cap_03.json",
        "/pa/terrain/metal/brushes/metal_trench_11.json",
        "/pa/terrain/metal/brushes/metal_trench_12.json",
        "/pa/terrain/metal/brushes/metal_trench_13.json",
        "/pa/terrain/metal/brushes/metal_trench_pit.json",
        "/pa/terrain/metal/brushes/metal_weapon_platforms.json",
    ]
      var process = function (biome) {
        var deferred = $.Deferred();
        var url = "coui://pa/terrain/" + biome + "/" + biome + ".json";
        $.get(url).always(function (contents) {
          var result = [];

          try {
            contents = decode(contents);
            result = contents.brushes;
          } catch (e) {
            console.error("failed to parse biome:" + url);
          }

          deferred.resolve(result);
        });

        return deferred;
      };

      /* don't use the grass biome here  */
      var brush_groups_biomes = [
        "desert",
        "ice",
        "jungle",
        "lava",
        "metal",
        "moon",
        "mountain",
        "sand",
      ];
      
      fullBrushListPromise.then(function(fullBrushList){
        UberUtility.waitForAll(_.map(brush_groups_biomes, process)).then(
          function (list) {
           
            var result = {};


            _.forEach(list, function(biomeBrushList){
              _.map(biomeBrushList, function(brush){
                fullBrushList.brushes = _.filter(fullBrushList.brushes, function(brushSpec){
                  return brushSpec !== brush.brush_spec && !_.contains(invalidBrushes, brushSpec);
                }); 
              })
            })

            //adds in hidden csg brushes
            _.map(fullBrushList.brushes, function(brushSpec){

              var brushObject = {
                brush_spec:brushSpec,
                op: "BO_Add",
                proj: "BP_Bend",
                group: "Hidden",
                scale:[1,1,1]
              }
              
              var needsSubtract = ["crack","pit","trench","crater","sub"]
              for(var i = 0; i< needsSubtract.length;i++){
          
                if(_.includes(brushSpec,needsSubtract[i])){
                  brushObject.op = "BO_Subtract"
                }
                if(_.includes(brushSpec,"add")){
                  brushObject.op = "BO_Add"
                }
              }

              for(var i = 0; i< brush_groups_biomes.length;i++){
                if(brush_groups_biomes[i] == "metal"){brushObject.proj = "BP_LongitudePinch"}
          
                if(_.includes(brushSpec,brush_groups_biomes[i])){
                  list[i].push(brushObject)
                }
                else if(_.includes(brushSpec,"grass") && brush_groups_biomes[i] == "jungle"){list[i].push(brushObject)}
              }

            })
          
            var process = function (element) {
              /* brushes are added to layer zero to indicate a WIP. they should not be used. */
              if (!element) return null;
  
              if (element.layer === 0){ element.layer = 3;};
        
              element.icon = ko.observable(false);
  
              specToImage(element);
              specToTitle(element);

             
              $.get(element.image).done(function(){element.icon(true)}).fail(function(){element.icon(false)})
           
            
  
              return _.omit(element, [
                "bias",
                "biome_distance_range",
                "layer",
                "noise_range",
                "note",
                "scale_variation",
                "threshold",
                "weight",
                "weight_hard",
                "weight_scale",
                "planet_size_range",
                "max_instances",
                "elevation_range",
                "fixed_orient",
                "pole_distance_range",
                "latitude_snap",
                "longitude_snap",
              ]);
            };
  
            _.forEach(list, function (element, index) {
              var brushes = _.compact(_.map(element, process));
              var groups = {};
              _.forEach(brushes, function (brush) {

                var group = brush.group;
                if (!group) brush.group = group = "basic";
  
                if (!groups[group]) groups[group] = [];
  
                groups[group].push(brush);
              });
  
              if (brushes.length) result[brush_groups_biomes[index]] = groups;
            });
  
            self.brushMap(result);
            self.selectedBrushBiome(self.brushBiomes()[0]);
          }
        );
      })
      
    });

    self.system = ko.observable(new SystemModel(defaultSystem));

    self.systemUpdated = function () {
      self.system.valueHasMutated();
      self.saveDirty(true);
    };

    self.planetsInSystemChanged = ko.observable(false);
    self.planetsInSystem = ko.computed(function () {
      return self.system() ? self.system().planets.length : 0;
    });
    self.planetsInSystem.subscribe(function (value) {
      self.planetsInSystemChanged(true);
    });

    self.selectedPlanetIndex = ko.observable(-1);

    self.selectedPlanet = ko.computed(function () {
      if (!self.system() || !self.system().planets) return null;

      return self.system().planets[self.selectedPlanetIndex()];
    });

    self.selectedPlanetStatus = ko.observable();

    self.selectedPlanetIsFullyLoaded = ko.computed(function () {
      return self.selectedPlanetStatus() == "full";
    });

    self.selectedPlanetIsNotPlaceholder = ko.computed(function () {
      return self.selectedPlanetStatus() != "placeholder";
    });

    self.advancedEditMode = ko.observable(false);

    self.standardEditMode = ko.computed(function () {
      return !self.advancedEditMode();
    });

    self.isAdvancedEditing = ko.computed(function () {
      return (
        self.advancedEditMode() &&
        (api.terrain_editor.editingTerrain() ||
          api.terrain_editor.editingMetalSpots() ||
          api.terrain_editor.editingLandingZones())
      );
    });

    self.isNotAdvancedEditing = ko.computed(function () {
      return !self.isAdvancedEditing();
    });

    self.isAdvancedEditing.subscribe(function () {
      self.checkResize();
    });

    self.updatePlanetStatus = function (payload) {
      var index = payload.index;

      if (index != self.selectedPlanetIndex())
        console.error("updatePlanetStatus for different planet");

      self.selectedPlanetStatus(payload.status);

      var editing = payload.editing;

      var editingCsg = editing == "csg";
      var editingMetalSpots = editing == "metal_spots";
      var editingLandingZones = editing == "landing_zones";

      if (editingCsg != api.terrain_editor.editingTerrain())
        api.terrain_editor.editingTerrain(editingCsg);

      if (editingMetalSpots != api.terrain_editor.editingMetalSpots())
        api.terrain_editor.editingMetalSpots(editingMetalSpots);

      if (editingLandingZones != api.terrain_editor.editingLandingZones())
        api.terrain_editor.editingLandingZones(editingLandingZones);

      self.advancedEditMode(editing || self.selectedPlanetIsCustom());

      _.defer(self.checkResize);
    };

    self.showCsgBuildBar = ko.computed(function () {
      return api.terrain_editor.editingTerrain() && self.showPlanetEditor();
    });

    self.selectedCsg = ko.observable(false);

    self.selectedCsgJson = ko.computed(function () {
      return JSON.stringify(self.selectedCsg(), null, 2);
    });

    self.updateCsgFlooded = function () {
      var selectedPlanet = self.selectedCsg();
      if (!selectedPlanet) return;

      engine.call("systemEditor.set_flooded_csg", !selectedPlanet.flooded);
    };

    self.updateCsgMergable = function () {
      var selectedPlanet = self.selectedCsg();
      if (!selectedPlanet) return;

      engine.call("systemEditor.set_mergable_csg", !selectedPlanet.mergeable);
    };

    self.updateCsgPathable = function () {
      var selectedPlanet = self.selectedCsg();
      if (!selectedPlanet) return;

      engine.call("systemEditor.set_pathable_csg", !selectedPlanet.pathable);
    };

    self.updateCsgNoFeatures = function () {
      var selectedPlanet = self.selectedCsg();
      if (!selectedPlanet) return;

      engine.call(
        "systemEditor.set_no_features_csg",
        !selectedPlanet.no_features
      );
    };

    self.updateCsgRotation = function () {};

    self.customLandingZones = ko.computed(function () {
      var planet = self.selectedPlanet();

      if (!planet) {
        return [];
      }

      var landing_zones = planet.landing_zones;

      if (!landing_zones) {
        return [];
      } else if (_.isArray(landing_zones)) {
        landing_zones = { list: planet.landing_zones, rules: [] };
      }

      var rules = landing_zones.rules || [];

      var landingZones = _.map(landing_zones.list, function (element, index) {
        var rule = rules[index] || {};
        var zone = {
          index: index,
          x: element[0],
          y: element[1],
          z: element[2],
          min: rule.min || 2,
          max: rule.max || 32,
        };
        var result = new LandingZone(zone);
        return result;
      });

      return landingZones;
    });

    self.updateCustomLandingZoneRules = function () {
      var rules = _.invoke(model.customLandingZones(), "rulesAsJson");
      return api.terrain_editor.setLandingZoneRules(rules);
    };

    self.handleLandingZoneClick = function (data) {
      var target = { location: { x: data.x(), y: data.y(), z: data.z() } };
      api.camera.lookAt(target, true);
    };

    self.customBrushCount = ko.computed(function () {
      var selectedPlanet = self.selectedPlanet();

      if (!selectedPlanet || !selectedPlanet.planetCSG) {
        return 0;
      }

      return selectedPlanet.planetCSG.length;
    });

    self.customMetalSpotCount = ko.computed(function () {
      var selectedPlanet = self.selectedPlanet();

      if (!selectedPlanet || !selectedPlanet.metal_spots) {
        return 0;
      }

      return selectedPlanet.metal_spots.length;
    });

    self.customLandingZoneCount = ko.computed(function () {
      var selectedPlanet = self.selectedPlanet();

      if (!selectedPlanet || !selectedPlanet.landing_zones) {
        return 0;
      }

      var landing_zones = selectedPlanet.landing_zones;

      return _.isArray(landing_zones)
        ? landing_zones.length
        : (landing_zones && landing_zones.list && landing_zones.list.length) ||
            0;
    });

    self.selectedPlanetIsCustom = ko.computed(function () {
      return (
        self.isAdvancedEditing() ||
        self.customBrushCount() > 0 ||
        self.customMetalSpotCount() > 0 ||
        self.customLandingZoneCount() > 0
      );
    });

    self.selectedPlanetIsCustom.subscribe(function (selectedPlanetIsCustom) {
      self.advancedEditMode(selectedPlanetIsCustom);
    });

    self.screenOffset = function () {
      /* doesn't do anything anymore... it will resize the c++ viewport latter. */
      return -0.5 * $("#editor_controls").width();
    };

    self.showPopUP = ko.observable(false);
    self.popUpPrimaryMsg = ko.observable("test primary msg");
    self.popUpSecondaryMsg = ko.observable("secondary msg");
    self.popUpPrimaryButtonAction = function () {};
    self.popUpSecondaryButtonAction = function () {};
    self.popUpTertiaryButtonAction = function () {};
    self.popUpPrimaryButtonTag = ko.observable("!LOC:Accept");
    self.popUpSecondaryButtonTag = ko.observable("!LOC:Cancel");
    self.popUpTertiaryButtonTag = ko.observable(false);

    self.planets = ko.observableArray([]).extend({ local: "planets" });
    self.systems = ko
      .observableArray([])
      .extend({ db: { local_name: "systems", db_name: "misc" } });

    self.buildBarHoverPlanet = ko.observable({});
    self.showBuildBarHover = ko.observable(false);
    self.buildBarHoverRadiusWidthString = ko.computed(function () {
      if (!jQuery.isEmptyObject(self.buildBarHoverPlanet()))
        return String(self.buildBarHoverPlanet().planet.radius / 20) + "px";
    });
    self.buildBarHoverHeightWidthString = ko.computed(function () {
      if (!jQuery.isEmptyObject(self.buildBarHoverPlanet()))
        return String(self.buildBarHoverPlanet().planet.heightRange) + "px";
    });
    self.buildBarHoverWaterWidthString = ko.computed(function () {
      if (!jQuery.isEmptyObject(self.buildBarHoverPlanet()))
        return String(self.buildBarHoverPlanet().planet.waterHeight) + "px";
    });
    self.buildBarHoverTemperatureWidthString = ko.computed(function () {
      if (!jQuery.isEmptyObject(self.buildBarHoverPlanet()))
        return String(self.buildBarHoverPlanet().planet.temperature) + "px";
    });
    self.defaultTemplates = ko.observableArray(templates);
    self.recentTemplates = ko
      .observableArray([])
      .extend({ local: "recentPlanets" });
    self.buildbarPageSize = ko.computed(function () {
      return Math.floor(($("#page").width() - 140) / 65);
    });
    self.buildBarPage = ko.observable(0);
    self.buildBarPageOffset = ko.observable(0);
    self.buildBarDisplayList = ko.observableArray(self.defaultTemplates());
    self.buildBarDisplayItems = ko.computed(function () {
      var start =
        self.buildBarPage() * self.buildbarPageSize() +
        self.buildBarPageOffset();
      var end = start + self.buildbarPageSize();
      return self.buildBarDisplayList.slice(start, end);
    });

    self.asteroidTemplate = ko.observable({
      name: "asteroid belt",
      mass: 5000,
      required_thrust_to_move: 1,
      planet: {
        seed: 8239,
        radius: 250,
        heightRange: 100,
        waterHeight: 0,
        waterDepth: 100,
        temperature: 50,
        metalDensity: 0,
        metalClusters: 0,
        biome: "asteroid",
        biomeScale: 100,
      },
    });
    self.asteroidTemplateWithMetal = ko.observable({
      name: "asteroid belt",
      mass: 5000,
      required_thrust_to_move: 1,
      planet: {
        seed: 8239,
        radius: 250,
        heightRange: 100,
        waterHeight: 0,
        waterDepth: 100,
        temperature: 50,
        metalDensity: 1,
        metalClusters: 1,
        metalSpotLimit: 5,
        biome: "asteroid",
        biomeScale: 100,
      },
    });
    self.showAstroidBeltPanel = ko.observable(false);

    self.showSystemPanel = ko.observable(true);

    self.shiftBuildListLeft = function () {
      if (self.buildBarPage() === 0) {
        self.buildBarPageOffset(0);
        return;
      }
      self.buildBarPage(self.buildBarPage() - 1);
    };
    self.shiftBuildListRight = function () {
      var end =
        (self.buildBarPage() + 1) * self.buildbarPageSize() +
        self.buildbarPageSize();
      if (end > self.buildBarDisplayList()().length) {
        self.buildBarPageOffset(
          self.buildBarDisplayList()().length -
            (self.buildBarPage() * self.buildbarPageSize() +
              self.buildbarPageSize())
        );
        return;
      }
      self.buildBarPage(self.buildBarPage() + 1);
    };
    self.buildBarModes = ko.observableArray([
      "templates",
      "recent",
      "my_planets",
    ]);
    self.buildBarSelectedMode = ko.observable(self.buildBarModes()[0]);
    self.setBuildBarMode = function (mode) {
      if (mode != self.buildBarSelectedMode()) {
        if (mode === self.buildBarModes()[0]) {
          self.buildBarSelectedMode(self.buildBarModes()[0]);
          self.buildBarDisplayList(self.defaultTemplates);
        }
        if (
          mode === self.buildBarModes()[1] &&
          self.recentTemplates().length > 0
        ) {
          self.buildBarSelectedMode(self.buildBarModes()[1]);
          self.buildBarDisplayList(self.recentTemplates);
        }
        if (mode === self.buildBarModes()[2] && self.planets().length > 0) {
          self.buildBarSelectedMode(self.buildBarModes()[2]);
          self.buildBarDisplayList(self.planets);
        }
      }
      self.buildBarPageOffset(0);
      self.buildBarPage(0);
    };
    self.showTemplates = ko.computed(function () {
      return self.buildBarSelectedMode() === "templates";
    });
    self.showRecent = ko.computed(function () {
      return self.buildBarSelectedMode() === "recent";
    });
    self.showMyPlanets = ko.computed(function () {
      return self.buildBarSelectedMode() === "my_planets";
    });
    self.randomizeNewPlanets = ko.computed(function () {
      return self.buildBarSelectedMode() === "templates";
    });

    self.removeItemFromMyPlanets = function (index) {
      var list = self.planets();
      list.splice(index, 1);
      self.planets(list);

      if (!self.planets().length) self.setBuildBarMode("templates");
    };

    self.imageSourceForPlanet = function (planetSpec) {
      if (
        typeof planetSpec != "undefined" &&
        typeof planetSpec.planet != "undefined"
      ) {
        var s = planetSpec.planet.biome;
        var ice =
          planetSpec.planet.biome === "earth" &&
          planetSpec.planet.temperature <= 33;
        var desert =
          planetSpec.planet.biome === "earth" &&
          planetSpec.planet.temperature >= 75;
        if (ice) s = "ice";
        else if (desert) s = "desert";

        return "coui://ui/main/shared/img/" + s + ".png";
      }
    };
    self.UpdateRecentTemplates = function (planet) {
      var p = new PlanetSpec(planet);
      delete p.position_x;
      delete p.position_y;
      delete p.velocity_x;
      delete p.velocity_y;
      delete p.required_thrust_to_move;
      delete p.starting_planet;
      var i = _.findIndex(self.recentTemplates(), { name: p.name });
      if (i >= 0) {
        if (i > 0) {
          self.recentTemplates.splice(i, 1, self.recentTemplates()[i - 1]);
          self.recentTemplates.splice(i - 1, 1, p);
        }
        return;
      }
      if (self.recentTemplates().length < 10) {
        self.recentTemplates.push(p);
        return;
      }
      self.recentTemplates.pop();
      self.recentTemplates.push(p);
    };

    self.validSelectedPlanet = ko.computed(function () {
      return self.selectedPlanetIndex() >= 0;
    });

    self.paused = ko.observable(true);
    self.simulating = ko.computed(function () {
      return !self.paused();
    });
    self.togglePaused = function () {
      self.paused(!self.paused());
    };
    self.pauseButtonMessage = ko.computed(function () {
      return self.paused() ? "!LOC:SIMULATE" : "!LOC:STOP";
    });
    self.paused.subscribe(function () {
      api.systemEditor.pause(self.paused());
    });

    self.time = ko.observable(0);
    self.formattedTime = ko.computed(function () {
      return UberUtility.createTimeString(self.time());
    });

    self.showControls = ko.observable(true);
    self.hideControls = ko.computed(function () {
      return !self.showControls();
    });
    self.enableControls = ko.computed(function () {
      return self.paused() && self.validSelectedPlanet();
    });

    self.selectedMode = ko.observable("system");
    self.showPlanetEditor = ko.computed(function () {
      return self.selectedMode() === "planet" && self.showControls();
    });
    self.showSystemEditor = ko.computed(function () {
      return self.selectedMode() === "system" && self.showControls();
    });
    self.showBuildBar = ko.computed(function () {
      return self.selectedMode() === "system" && self.paused();
    });

    // Current system definition, in string form.  Used for updating the save state.
    self.currentSystemString = ko.observable("");

    self.loadedPlanet = ko.observable().extend({ session: "loaded_planet" });
    self.loadedSystem = ko.observable().extend({ session: "loaded_system" });

    self.systemName = ko.observable("Gamma System");
    self.systemDescription = ko.observable("");
    self.systemCreator = ko.observable("");
    self.systemVersion = ko.observable("");

    self.systemLoaded = ko.observable(false);

    self.lastSavedSystemName = ko.observable("");
    self.saveDirty = ko.observable(false);
    self.systemName.subscribe(function (value) {
      self.saveDirty(true);
    });
    self.systemDescription.subscribe(function (value) {
      self.saveDirty(true);
    });
    self.systemCreator.subscribe(function (value) {
      self.saveDirty(true);
    });
    self.systemVersion.subscribe(function (value) {
      self.saveDirty(true);
    });

    self.planetName = ko.observable("");
    self.seed = ko.observable(0);
    self.radius = ko.observable(700).extend({ slider: "radius" });
    self.heightRange = ko.observable(50).extend({ slider: "height_range" });
    self.biomeScale = ko.observable(50).extend({ slider: "biome_scale" });
    self.waterHeight = ko.observable(50).extend({ slider: "water_height" });
    self.waterDepth = ko.observable(50).extend({ slider: "water_depth" });
    self.temperature = ko.observable(50).extend({ slider: "temperature" });
    self.metalDensity = ko.observable(50).extend({ slider: "metal_density" });
    self.metalClusters = ko.observable(50).extend({ slider: "metal_clusters" });
    self.radius = ko.observable(700).extend({ slider: "radius" });
    self.heightRange = ko.observable(50).extend({ slider: "height_range" });

    self.heightAdjustments = ko.observableArray([]);

    self.terrainHeight = ko.observable(100);

    self.biomeNoiseScale = ko.observable(50);
    self.biomeHeightBias = ko.observable(100);
    self.biomeTemperatureBias = ko.observable(100);
    self.biomeWaterDistanceBias = ko.observable(100);

    self.metalDensity = ko.observable(50).extend({ slider: "metal_density" });
    self.metalClusters = ko.observable(50).extend({ slider: "metal_clusters" });
    self.metalSpotLimit = ko.observable(-1);

    self.symmetricalMetal = ko.observable(false);
    self.symmetricalStarts = ko.observable(false);

    self.symmetryTypes = ko.observableArray([
      "none",
      "terrain",
      "terrain and CSG",
    ]);
    self.symmetryTypeText = function (type) {
      var text = "";
      if (type === "none") text = "!LOC:NONE";
      else if (type === "terrain") text = "!LOC:TERRAIN";
      else if (type === "terrain and CSG") text = "!LOC:TERRAIN AND CSG";

      return loc(text);
    };
    self.selectedSymmetryType = ko.observable(self.symmetryTypes()[0]);

    self.defaultRadiusRange = { min: 250, max: 1300 };

    self.valueRanges = {
      radius: { min: 250, max: 1300 },
      heightRange: { min: 0, max: 100 },
      biomeScale: { min: 0, max: 100 },
      waterHeight: { min: 0, max: 70 },
      waterDepth: { min: 0, max: 100 },
      temperature: { min: 0, max: 100 },
      metalDensity: { min: 0, max: 100 },
      metalClusters: { min: 0, max: 100 },
      numArmies: { min: 2, max: 10 },
      landingZonesPerArmy: { min: 1, max: 5 },
      landingZoneSize: { min: 50, max: 500 },
      mass: { min: 5000, max: 50000 },
    };

    self.editPlanetMode =
      ko.observable("terrain"); /* modes: 'terrain', 'gameplay' */
    self.showTerrainInfo = ko.computed(function () {
      return (
        (self.editPlanetMode() === "terrain" || self.selectedBiomeIsGas()) &&
        !self.advancedEditMode()
      );
    });
    self.showGameplayInfo = ko.computed(function () {
      return (
        self.editPlanetMode() === "gameplay" &&
        !self.selectedBiomeIsGas() &&
        !self.advancedEditMode()
      );
    });

    self.numArmies = ko.observable(2).extend({ slider: "num_armies" });
    self.numArmies.subscribe(function (value) {
      var clamped = Math.max(2, Math.min(value, 10));
      if (clamped !== value) self.numArmies(clamped);

      engine.call(
        "execute",
        "update_planet_num_armies",
        JSON.stringify({ num_armies: self.numArmies() })
      );
    });

    self.landingZonesPerArmy = ko
      .observable(self.valueRanges.landingZonesPerArmy.min)
      .extend({ slider: "landing_zones_per_army" });
    self.landingZonesPerArmyIsAuto = ko.observable(true);
    self.landingZonesPerArmyIsAuto.subscribe(function (value) {
      if (value) self.landingZonesPerArmy(USE_DEFAULT);
      else if (self.landingZonesPerArmy() === USE_DEFAULT)
        self.landingZonesPerArmy(self.valueRanges.landingZonesPerArmy.min);
      self.updateSliders();
    });

    self.landingZoneSize = ko
      .observable(self.valueRanges.landingZoneSize.min)
      .extend({ slider: "landing_zones_size" });
    self.landingZoneSizeIsAuto = ko.observable(true);
    self.landingZoneSizeIsAuto.subscribe(function (value) {
      var landingZoneSize = self.landingZoneSize();
      if (value) self.landingZoneSize(USE_DEFAULT);
      else if (self.landingZoneSize() === USE_DEFAULT)
        self.landingZoneSize(self.valueRanges.landingZoneSize.min);
      self.updateSliders();
      if (
        self.selectedPlanetIsCustom() &&
        landingZoneSize != self.landingZoneSize()
      ) {
        self.updateLandingZoneSize();
      }
    });

    self.mass = ko.observable(2500).extend({ slider: "mass" });
    self.position_x = ko.observable(15000);
    self.position_y = ko.observable(0);
    self.velocity_x = ko.observable(0);
    self.velocity_y = ko.observable(0);
    self.required_thrust_to_move = ko.observable(0);
    self.enableStartingPlanet = ko.computed(function () {
      return !self.selectedBiomeIsGas();
    });
    self.starting_planet = ko.observable(false);
    self.disableStartingPlanetToggle = ko.computed(function () {
      return (
        self.customLandingZoneCount() ||
        api.terrain_editor.editingLandingZones()
      );
    });
    self.not_starting_planet = ko.computed(function () {
      return !self.starting_planet();
    });
    self.displayOrbit = ko.observable();
    self.sandboxPhysics = ko.observable();

    self.biomeError = ko.computed(function () {
      return "";
    });
    self.waterHeightError = ko.computed(function () {
      return self.waterHeight() > 60 ? "!" : "";
    });
    self.planetUnderConstruction = ko.observable(false);
    self.disableTerrainParameterControls = ko.computed(function () {
      return (
        self.planetUnderConstruction() ||
        api.terrain_editor.editingTerrain() ||
        api.terrain_editor.editingMetalSpots() ||
        self.selectedPlanetIsCustom()
      );
    });

    self.disableUpdatePlanetFull = ko.computed(function () {
      return self.planetUnderConstruction() || self.selectedBiomeIsGas();
    });

    self.disableSymmetryTypes = ko.computed(function () {
      return (
        self.disableTerrainParameterControls() || self.selectedBiomeIsGas()
      );
    });

    self.disableSymmetryCheckboxes = ko.computed(function () {
      return (
        self.disableTerrainParameterControls() ||
        self.selectedSymmetryType() !== "terrain and CSG"
      );
    });

    self.disableNumArmies = ko.computed(function () {
      return !self.starting_planet() || self.planetUnderConstruction();
    });

    self.initSlidersFromLoadedPlanet = function () {
      // deprecated

      self.planetName(self.loadedPlanet().name);
      self.seed(self.loadedPlanet().seed);
      self.radius(self.loadedPlanet().radius);
      self.required_thrust_to_move(self.loadedPlanet().required_thrust_to_move);
      self.heightRange(self.loadedPlanet().heightRange);
      self.biomeScale(self.loadedPlanet().biomeScale);
      self.waterHeight(self.loadedPlanet().waterHeight);
      self.waterDepth(self.loadedPlanet().waterDepth);
      self.temperature(self.loadedPlanet().temperature);
      self.metalDensity(self.loadedPlanet().metalDensity);
      self.metalClusters(self.loadedPlanet().metalClusters);
      self.numArmies(self.loadedPlanet().numArmies);
      self.landingZonesPerArmy(self.loadedPlanet().landingZonesPerArmy);
      self.landingZoneSize(self.loadedPlanet().landingZoneSize);
      self.selectedBiome(self.loadedPlanet().biome);
      self.selectedSymmetryType(self.loadedPlanet().symmetryType);
      self.symmetricalMetal(self.loadedPlanet().symmetricalMetal);
      self.symmetricalStarts(self.loadedPlanet().symmetricalStarts);

      self.landingZonesPerArmyIsAuto(
        self.landingZonesPerArmy() === USE_DEFAULT
      );
      self.landingZoneSizeIsAuto(self.landingZoneSize() === USE_DEFAULT);
    };

    self.ensureStartingPlanet = function () {
      if (!self.systemHasNoStartingPlanet() || !self.planetsInSystemChanged())
        return;

      var possibleStart = _.find(self.system().planets, function (spec) {
        return spec.planet.biome !== "gas";
      });
      if (possibleStart) {
        possibleStart.starting_planet = true;
        self.system.valueHasMutated();
      }

      self.planetsInSystemChanged(false);
    };

    self.planetWithSource = function (planetSpec) {
      var source = planetSpec.source;
      if (source) {
        if (planetSpec.planetCSG) {
          source.brushes = planetSpec.planetCSG;
        }
        if (planetSpec.metal_spots) {
          source.metal_spots = planetSpec.metal_spots;
        }
        if (planetSpec.landing_zones) {
          source.landing_zones = planetSpec.landing_zones;
        }
      } else {
        planetSpec.source = {
          brushes: planetSpec.planetCSG,
          metal_spots: planetSpec.metal_spots,
          landing_zones: planetSpec.landing_zones,
        };
      }
      planetSpec = _.omit(planetSpec, [
        "planetCSG",
        "metal_spots",
        "landing_zone",
      ]);
      return planetSpec;
    };

    self.checkPlanetSource = function (planetSpec) {
      var source = planetSpec.source;

      if (!source) return planetSpec;

      if (!planetSpec.planetCSG && source.brushes)
        planetSpec.planetCSG = source.brushes;

      if (!planetSpec.metal_spots && source.metal_spots)
        planetSpec.metal_spots = source.metal_spots;

      if (!planetSpec.landing_zones && source.landing_zones)
        planetSpec.landing_zones = source.landing_zones;

      delete planetSpec.source;

      return planetSpec;
    };

    self.updateSelectedPlanetSource = function () {
      self.updatePlanetSource(self.selectedPlanet());
      self.systemUpdated();
    };

    self.addPlanet = function (planetSpec, attachToMouse, random, index) {
      if (!planetSpec) return;

      planetSpec = _.clone(planetSpec, true);

      if (attachToMouse) planetSpec.attachToMouse = true;

      var finish = function () {
        self.UpdateRecentTemplates(planetSpec);
        api.systemEditor.addPlanet(planetSpec);
      };

      if (random) {
        api.game.getRandomPlanetName().then(function (name) {
          planetSpec.name = name;
          planetSpec.planet.seed = self.generateRandomSeed();
          finish();
        });
      } else finish();
    };

    self.asteroidLocations = [
      [0, 60000],
      [0, -60000],
      [60000, 0],
      [-60000, 0],
    ];
    self.maxAsteroidCount = function () {
      return self.asteroidLocations.length;
    };

    var DEFAULT_ASTEROID_LIMIT = 3;
    var DEFAULT_STARTING_ASTEROID_COUNT = 3;
    var DEFAULT_MIN_ASTEROID_SPAWN_DELAY = 300;
    var DEFAULT_ASTEROID_SPAWN_VARIANCE = 60;
    var DEFAULT_METAL_SPOTS_ON_ASTEROIDS = false;
    var DEFAULT_ASTEROID_NAME = "O-0";

    self.currentAsteroidLimit = ko
      .observable(DEFAULT_ASTEROID_LIMIT)
      .extend({ numeric: 0 });
    self.startingAsteroidCount = ko
      .observable(DEFAULT_STARTING_ASTEROID_COUNT)
      .extend({ numeric: 0 });
    self.minAsteroidSpawnDelay = ko
      .observable(DEFAULT_MIN_ASTEROID_SPAWN_DELAY)
      .extend({ numeric: 0, positive: true });
    self.asteroidSpawnDelayVariance = ko
      .observable(DEFAULT_ASTEROID_SPAWN_VARIANCE)
      .extend({ numeric: 0, positive: true });
    self.metalSpotsOnAsteroids = ko.observable(
      DEFAULT_METAL_SPOTS_ON_ASTEROIDS
    );

    self.computeSystemAsteroidValues = function (system) {
      if (!system) return;

      var match = _.filter(system.planets, function (element) {
        return element.planet.biome === "asteroid";
      });
      self.currentAsteroidLimit(match.length);

      var starting = _.filter(match, function (element) {
        return !element.start_destroyed;
      });
      self.startingAsteroidCount(starting.length);

      if (!match.length) return;

      var min = match[0].min_spawn_delay;
      var max = match[0].max_spawn_delay;

      _.forEach(match, function (element) {
        min = Math.min(min, element.min_spawn_delay);
        max = Math.max(max, element.max_spawn_delay);
      });

      self.minAsteroidSpawnDelay(min);
      self.asteroidSpawnDelayVariance(max - min);

      var metal = _.any(match, function (element) {
        return element.planet.metalDensity;
      });
      self.metalSpotsOnAsteroids(metal);
    };

    self.startingAsteroidCountOptions = ko.pureComputed(function () {
      var limit = self.currentAsteroidLimit() + 1;
      var result = [];

      _.times(limit, function (n) {
        result.push(n);
      });
      return result;
    });

    self.currentAsteroidCount = ko.pureComputed(function () {
      if (!self.system() || !self.system().planets) return 0;

      var match = _.filter(self.system().planets, function (element) {
        return element.planet.biome === "asteroid";
      });

      return match.length;
    });

    self.createAsteroidPlanetSpec = function (index) {
      if (_.isUndefined(index)) index = self.currentAsteroidCount();

      var position = self.asteroidLocations[index];

      var planetSpec = _.clone(
        self.metalSpotsOnAsteroids()
          ? self.asteroidTemplateWithMetal()
          : self.asteroidTemplate(),
        true
      );

      planetSpec.respawn = true;
      planetSpec.start_destroyed = index >= self.startingAsteroidCount();
      planetSpec.min_spawn_delay = self.minAsteroidSpawnDelay();
      planetSpec.max_spawn_delay =
        self.minAsteroidSpawnDelay() + self.asteroidSpawnDelayVariance();
      planetSpec.position_x = position[0];
      planetSpec.position_y = position[1];
      planetSpec.name = DEFAULT_ASTEROID_NAME + (index + 1);

      return planetSpec;
    };

    self.addAsteroid = function (index) {
      if (self.currentAsteroidCount() >= self.maxAsteroidCount()) return;

      self.addPlanet(self.createAsteroidPlanetSpec(index), false, false);
    };

    self.updateAsteroidSpecs = function () {
      if (!self.showAstroidBeltPanel()) return;

      var targets = [];

      _.forEach(self.system().planets, function (element, index) {
        if (element.planet.biome === "asteroid") targets.push(index);
      });

      var data = [];
      _.forEach(targets, function (element, index) {
        data.push(self.createAsteroidPlanetSpec(index));
      });

      engine.call(
        "execute",
        "update_target_planets",
        JSON.stringify({
          targets: targets,
          data: data,
        })
      );
    };

    self.updateAsteroidsToMatchLimit = function (value) {
      if (_.isUndefined(value)) return;

      var delta = value - self.currentAsteroidCount();
      if (!delta) /* no change required */ return;

      if (delta > 0) {
        /* add more asteroids */

        _.times(delta, function (index) {
          self.addAsteroid(self.currentAsteroidCount() + index);
        });
      } else if (delta < 0) {
        /* remove some asteroids */
        var targets = [];

        _.forEach(self.system().planets, function (element, index) {
          if (element.planet.biome === "asteroid") targets.push(index);
        });
        targets = targets.slice(delta);
        engine.call(
          "execute",
          "remove_target_planets",
          JSON.stringify(targets)
        );
      }
    };

    self.currentAsteroidLimit.subscribe(function (value) {
      if (value < self.startingAsteroidCount())
        self.startingAsteroidCount(value);

      if (self.showAstroidBeltPanel()) self.updateAsteroidsToMatchLimit(value);
    });

    self.showAstroidBeltPanel.subscribe(function (value) {
      if (value) self.updateAsteroidsToMatchLimit(self.currentAsteroidLimit());
    });

    self.startingAsteroidCount.subscribe(self.updateAsteroidSpecs);
    self.minAsteroidSpawnDelay.subscribe(self.updateAsteroidSpecs);
    self.asteroidSpawnDelayVariance.subscribe(self.updateAsteroidSpecs);
    self.metalSpotsOnAsteroids.subscribe(self.updateAsteroidSpecs);

    self.addAsteroidBelt = function () {
      self.showAstroidBeltPanel(true);
      self.showSystemPanel(false);
    };

    self.removeAsteroidBelt = function () {
      self.currentAsteroidLimit(0);
      self.showAstroidBeltPanel(false);
      self.currentAsteroidLimit(DEFAULT_ASTEROID_LIMIT);
      self.startingAsteroidCount(DEFAULT_STARTING_ASTEROID_COUNT);
      self.minAsteroidSpawnDelay(DEFAULT_MIN_ASTEROID_SPAWN_DELAY);
      self.asteroidSpawnDelayVariance(DEFAULT_ASTEROID_SPAWN_VARIANCE);
      self.metalSpotsOnAsteroids(DEFAULT_METAL_SPOTS_ON_ASTEROIDS);
    };

    self.addPlanetFromMyPlanets = function (planetSpec, index) {
      self.waitForPlanetToLoad(planetSpec).then(function (result) {
        self.addPlanet(result, true, false, index);
      });
    };

    self.addPlanetFromBar = function (
      planetSpec,
      attachToMouse,
      random,
      index
    ) {
      if (self.showMyPlanets()) self.addPlanetFromMyPlanets(planetSpec, index);
      else self.addPlanet(planetSpec, attachToMouse, random, index);
    };

    self.removePlanet = function () {
      self.advancedEditMode(false);
      self.system().planets.splice(self.selectedPlanetIndex(), 1);
      engine.call("execute", "remove_planet", JSON.stringify({}));
      self.selectPlanet("sun");
    };

    self.removeAllPlanets = function () {
      self.advancedEditMode(false);
      self.selectPlanet("sun");
      engine.call("execute", "remove_all_planets", JSON.stringify({}));
    };
    self.toggleOrbitDisplay = function () {
      engine.call("execute", "toggle_orbit_display", JSON.stringify({}));
    };
    self.canPreview = ko.computed(function () {
      return _.any(self.system().planets, function (element) {
        return element.planet.biome !== "asteroid";
      });
    });
    self.buildAllPlanets = function () {
      if (!self.canPreview()) return;

      function fn() {
        engine.call("systemEditor.previewAllPlanets");
      }
      setTimeout(fn, 250);
    };

    self.alignCameraToPole = function () {
      api.camera.alignToPole();
    };

    self.cameraLocation = ko.observable({});
    self.cameraX = ko.computed(function () {
      var value = self.cameraLocation().x;
      return value ? value.toFixed(5) : "";
    });
    self.cameraY = ko.computed(function () {
      var value = self.cameraLocation().y;
      return value ? value.toFixed(5) : "";
    });
    self.cameraZ = ko.computed(function () {
      var value = self.cameraLocation().z;
      return value ? value.toFixed(5) : "";
    });
    self.cameraLat = ko.computed(function () {
      var value = self.cameraLocation().lat;
      return value ? value.toFixed(5) : "";
    });
    self.cameraLng = ko.computed(function () {
      var value = self.cameraLocation().long;
      return value ? value.toFixed(5) : "";
    });

    self.mouseLocation = ko.observable({});
    self.mouseX = ko.computed(function () {
      var value = self.mouseLocation().x;
      return value ? value.toFixed(5) : "";
    });
    self.mouseY = ko.computed(function () {
      var value = self.mouseLocation().y;
      return value ? value.toFixed(5) : "";
    });
    self.mouseZ = ko.computed(function () {
      var value = self.mouseLocation().z;
      return value ? value.toFixed(5) : "";
    });
    self.mouseLat = ko.computed(function () {
      var value = self.mouseLocation().lat;
      return value ? value.toFixed(5) : "";
    });
    self.mouseLng = ko.computed(function () {
      var value = self.mouseLocation().long;
      return value ? value.toFixed(5) : "";
    });

    self.transitionInToPlanetEditor = function () {
      if (self.selectedPlanetIsCustom() && !self.selectedPlanetIsFullyLoaded())
        self.previewSelectedPlanet(true);
      self.advancedEditMode(self.selectedPlanetIsCustom());
    };

    self.editSelectedPlanet = function () {
      api.camera.focusPlanet(self.selectedPlanetIndex());
      api.camera.setMode("planet");
    };

    self.transitionOutOfPlanetEditor = function (from_client) {
      if (!from_client) api.camera.setMode("space");
    };

    self.advancedEditDisabled = ko.computed(function () {
      return self.selectedPlanetIndex() == -1 || self.selectedBiomeIsGas();
    });

    self.advancedEditTooltip = ko.computed(function () {
      var tooltip = "!LOC:Preview planet";
      switch (self.selectedPlanetStatus()) {
        case "placeholder":
          tooltip = "!LOC:Preview to copy CSG";
          break;
        case "terrain":
          tooltip = "Preview gameplay to copy metal spots and landing zones";
          break;
        case "full":
          tooltip = "Preview terrain to copy only CSG ";
          break;
      }
      return tooltip;
    });

    self.convertToAdvancedEdit = function () {
      if (self.advancedEditMode() || self.selectedPlanetIndex() == -1) return;

      api.terrain_editor.convertSelectedPlanetToAdvanced();

      self.advancedEditMode(true);
    };

    self.startConfirmAdvancedEdit = function () {
      if (self.advancedEditMode() || self.advancedEditDisabled()) return;

      self.showPopUP(true);
      self.popUpPrimaryMsg(
        "!LOC:Once in Advanced Edit mode, the planet will remain in this mode for future edits."
      );
      self.popUpSecondaryMsg(
        "!LOC:You will not be able to revert back and use standard editing controls."
      );
      self.popUpPrimaryButtonAction = function () {
        self.showPopUP(false);
        self.convertToAdvancedEdit();
      };
      self.popUpSecondaryButtonAction = function () {
        self.showPopUP(false);
      };
      self.popUpPrimaryButtonTag("!LOC:Ok");
      self.popUpSecondaryButtonTag("!LOC:Cancel");
      self.popUpTertiaryButtonTag("");
    };

    self.navBack = function () {
      if (
        self.saveDirty() &&
        self.canSave() &&
        self.lastSavedSystemName() === self.systemName()
      ) {
        self.showPopUP(true);
        self.popUpPrimaryMsg("!LOC:Do you want to save this system?");
        self.popUpSecondaryMsg(
          "!LOC:The system has been changed since it was last saved."
        );
        self.popUpPrimaryButtonAction = function () {
          self.showPopUP(false);
          self.saveSystem();
          self.navBack();
        };
        self.popUpSecondaryButtonAction = function () {
          self.showPopUP(false);
          self.saveDirty(false);
          self.navBack();
        };
        self.popUpTertiaryButtonAction = function () {
          self.showPopUP(false);
        };
        self.popUpPrimaryButtonTag("!LOC:Save");
        self.popUpSecondaryButtonTag("!LOC:Discard");
        self.popUpTertiaryButtonTag("!LOC:Cancel");
      } else if (self.saveDirty() && self.canSave()) {
        self.showPopUP(true);
        self.popUpPrimaryMsg("!LOC:Do you want to save this system?");
        self.popUpSecondaryMsg("!LOC:The system has not been saved.");
        self.popUpPrimaryButtonAction = function () {
          self.showPopUP(false);
          self.saveSystem();
          self.navBack();
        };
        self.popUpSecondaryButtonAction = function () {
          self.showPopUP(false);
          self.saveDirty(false);
          self.navBack();
        };
        self.popUpTertiaryButtonAction = function () {
          self.showPopUP(false);
        };
        self.popUpPrimaryButtonTag("!LOC:Save");
        self.popUpSecondaryButtonTag("!LOC:Discard");
        self.popUpTertiaryButtonTag("!LOC:Cancel");
      } else if (self.saveDirty() && !self.canSave()) {
        self.showPopUP(true);
        self.popUpPrimaryMsg("!LOC:Do you want to save this system?");
        self.popUpSecondaryMsg(
          "!LOC:You will have to fix the system before saving."
        );
        self.popUpPrimaryButtonAction = function () {
          self.showPopUP(false);
          self.saveDirty(false);
          self.navBack();
        };
        self.popUpSecondaryButtonAction = function () {
          self.showPopUP(false);
        };
        self.popUpTertiaryButtonAction = null;
        self.popUpPrimaryButtonTag("!LOC:Discard");
        self.popUpSecondaryButtonTag("!LOC:Cancel");
        self.popUpTertiaryButtonTag("");
      } else {
        engine.call("reset_game_state");

        self.loadedPlanet({});
        self.loadedSystem({});

        engine.call("pop_mouse_constraint_flag");
        window.history.back();
      }
    };

    var minimum_planet_size = 200;

    self.blueprint = function () {
      var bp = {};
      bp.seed = Number(self.seed());
      bp.radius = self.radius()
        ? Number(self.radius())
        : Math.max(Number(self.radius()), minimum_planet_size);
      bp.heightRange = Number(self.heightRange());
      bp.biomeScale = Number(self.biomeScale());
      bp.waterHeight = Number(self.waterHeight());
      bp.waterDepth = Number(self.waterDepth());
      bp.temperature = Number(self.temperature());
      bp.metalDensity = Number(self.metalDensity());
      bp.metalClusters = Number(self.metalClusters());
      bp.metalSpotLimit = Number(-1);
      bp.landingZonesPerArmy = Number(
        self.landingZonesPerArmyIsAuto()
          ? USE_DEFAULT
          : self.landingZonesPerArmy()
      );
      bp.landingZoneSize = Number(
        self.landingZoneSizeIsAuto() ? USE_DEFAULT : self.landingZoneSize()
      );
      bp.biome = self.selectedBiome();
      bp.symmetryType = self.selectedSymmetryType();
      bp.symmetricalMetal = self.symmetricalMetal();
      bp.symmetricalStarts = self.symmetricalStarts();

      bp.heightAdjustments = self.heightAdjustments();

      return bp;
    };

    self.planetSpec = function () {
      var spec = {};
      spec.name = self.planetName();
      spec.mass = Number(self.mass());
      spec.radius = Number(self.radius());
      spec.velocity_x = Number(self.velocity_x());
      spec.velocity_y = Number(self.velocity_y());
      spec.position_x = Number(self.position_x());
      spec.position_y = Number(self.position_y());
      spec.required_thrust_to_move = Number(self.required_thrust_to_move());
      spec.starting_planet = Boolean(
        self.starting_planet() && !self.selectedBiomeIsGas()
      );
      spec.respawn = Boolean(self.selectedBiome() === "asteroid");
      spec.start_destroyed = false;
      spec.planet = self.blueprint();

      if (self.selectedPlanet()) spec.source = self.selectedPlanet().source;

      return spec;
    };

    self.previewSelectedPlanet = function (full) {
      if (!full) full = false;
      engine.call(
        "systemEditor.previewSelectedPlanet",
        self.selectedPlanetIndex(),
        full
      );
    };

    self.previewTerrainSelectedPlanet = function () {
      self.previewSelectedPlanet(false);
    };

    self.previewFullSelectedPlanet = function () {
      self.previewSelectedPlanet(true);
    };

    self.updateSelectedPlanet = function (spec, full) {
      if (!_.isString(spec)) spec = JSON.stringify(spec);

      engine.call(
        "systemEditor.updateSelectedPlanet",
        self.selectedPlanetIndex(),
        full,
        spec
      );
    };

    self.update_planet = function () {
      function fn() {
        self.updateSelectedPlanet(self.planetSpec(), false);
      }

      setTimeout(fn, 250);
    };

    self.update_planet_full = function () {
      function fn() {
        self.updateSelectedPlanet(self.planetSpec(), true);
      }

      setTimeout(fn, 250);
    };

    self.updatePlanetWithRandomSeed = function () {
      self.newRandomSeed();
      self.update_planet();
    };

    self.update_planet_spec = function () {
      self.enforceInputRanges();

      engine.call(
        "execute",
        "update_planet_spec",
        JSON.stringify(self.planetSpec())
      );

      if (self.planetSpec().planet.biome === "gas") self.update_planet();
    };

    self.delayedUpdatePlanetSpec = function () {
      setTimeout(self.update_planet_spec, 50);
    };

    self.update_planet_bp = function () {
      engine.call(
        "execute",
        "update_planet_bp",
        JSON.stringify(self.planetBP())
      );
    };

    self.updateArmyCount = function () {
      engine.call("systemEditor.setNumLandingZoneArmies", self.numArmies());
    };

    self.updateLandingZonePerArmy = function () {
      if (!self.landingZonesPerArmyIsAuto()) self.enforceInputRanges();

      var landingZonesPerArmy = model.landingZonesPerArmy();
      self.selectedPlanet().planet.landingZonesPerArmy = landingZonesPerArmy;
      engine.call("systemEditor.setLandingZonesPerArmy", landingZonesPerArmy);
      self.systemUpdated();
    };

    self.updateLandingZoneSize = function () {
      if (!self.landingZoneSizeIsAuto()) self.enforceInputRanges();

      var landingZoneSize = model.landingZoneSize();
      self.selectedPlanet().planet.landingZoneSize = landingZoneSize;
      engine.call("systemEditor.setLandingZoneSize", landingZoneSize);
      self.systemUpdated();
    };

    self.waitForPlanetToLoad = function (planet_spec) {
      var deferred = $.Deferred();

      UberUtility.waitForAttributeLoad(
        planet_spec,
        "csg_key",
        "planetCSG",
        constants.PLANET_CSG_DATABASE
      ).then(function (first) {
        UberUtility.waitForAttributeLoad(
          first,
          "metal_spots_key",
          "metal_spots",
          constants.PLANET_METAL_SPOTS_DATABASE
        ).then(function (second) {
          UberUtility.waitForAttributeLoad(
            second,
            "landing_zones_key",
            "landing_zones",
            constants.PLANET_LANDING_ZONES_DATABASE
          ).then(function (third) {
            deferred.resolve(third);
          });
        });
      });

      return deferred.promise();
    };

    self.waitForPlanetToSave = function (planet_spec) {
      var deferred = $.Deferred();

      planet_spec = _.omit(planet_spec, "source");

      UberUtility.waitForAttributeSave(
        planet_spec,
        "csg_key",
        "planetCSG",
        constants.PLANET_CSG_DATABASE
      ).then(function (first) {
        UberUtility.waitForAttributeSave(
          first,
          "metal_spots_key",
          "metal_spots",
          constants.PLANET_METAL_SPOTS_DATABASE
        ).then(function (second) {
          UberUtility.waitForAttributeSave(
            second,
            "landing_zones_key",
            "landing_zones",
            constants.PLANET_LANDING_ZONES_DATABASE
          ).then(function (third) {
            deferred.resolve(third);
          });
        });
      });

      return deferred.promise();
    };

    self.savePlanet = function () {
      var list = self.planets();
      var item = self.system().planets[self.selectedPlanetIndex()];

      self.waitForPlanetToSave(item).then(function (result) {
        var index = _.findIndex(list, { name: result.name });
        if (index >= 0) list[index] = result;
        else list.push(result);

        self.loadedPlanet(result);
        self.planets(list);
      });
    };

    self.waitForStrippedSystem = function () {
      var deferred = $.Deferred();
      var system = self.system();

      var array = _.map(system.planets, self.waitForPlanetToSave);

      UberUtility.waitForAll(array).then(function (results) {
        system.planets = results;
        deferred.resolve(system);
      });

      return deferred.promise();
    };

    self.saveSystem = function () {
      self.waitForStrippedSystem().then(function (item) {
        var list = self.systems();
        item.name = self.systemName();
        item.description = self.systemDescription();
        item.creator = self.systemCreator();
        item.version = self.systemVersion();

        var index = _.findIndex(list, { name: item.name });
        if (index >= 0) list[index] = item;
        else list.push(item);

        self.systems(list);
        self.systems.valueHasMutated();

        self.saveDirty(false);
        self.lastSavedSystemName(item.name);
      });
    };

    self.systemAsJson = ko.computed(function () {
      return {
        name: self.systemName(),
        description: self.systemDescription(),
        creator: self.systemCreator(),
        version: self.systemVersion(),
        planets: _.map(self.system().planets, function (planet) {
          return _.cloneDeep(planet);
        }),
      };
    });

    self.exportSystem = function () {
      var suggestedFilename =
        UberUtility.createLocalISODateTimeString() +
        "-" +
        self.systemName().toLowerCase().replace(" ", "_") +
        ".pas";

      api.file.saveDialog(
        suggestedFilename,
        JSON.stringify(self.systemAsJson(), null, 4)
      );
    };

    self.bindAdvancedSlider = function (name, id, sliderStopFunction) {
      var result = $("#slider_" + id).slider({
        range: "max",
        min: self.valueRanges[name].min,
        max: self.valueRanges[name].max,
        value: self[name](),
      });

      result.on("slideStop", function (event) {
        self[name](event.value);
        if (sliderStopFunction) sliderStopFunction();
      });

      self[name].subscribe(function (value) {
        self.advancedSliders[name].slider("setValue", value);
      });

      return result;
    };

    self.bindSliders = function () {
      var bindSlider = function (name, id) {
        var slideFn = function (observable) {
          return function (event, ui) {
            observable(parseFloat($(event.target).val()).toFixed());
            self.update_planet_spec();
          };
        };
        var enabled = ko.observable(true);

        var result = $("#slider_" + (id || name)).slider({
          range: "max",
          min: self.valueRanges[name].min,
          max: self.valueRanges[name].max,
          value: self[name](),
        });

        result.on("slideStop", slideFn(self[name]));

        result.enabled = enabled;
        ko.computed(function () {
          if (!self.sliders) {
            return;
          }

          var enable = enabled();
          var disable = self.disableTerrainParameterControls();
          result.slider(enable && !disable ? "enable" : "disable");
        });
        return result;
      };

      self.sliders = {
        radius: bindSlider("radius"),
        heightRange: bindSlider("heightRange", "height_range"),
        biomeScale: bindSlider("biomeScale", "biome_scale"),
        waterHeight: bindSlider("waterHeight", "water_height"),
        waterDepth: bindSlider("waterDepth", "water_depth"),
        temperature: bindSlider("temperature"),
        metalDensity: bindSlider("metalDensity", "metal_density"),
        metalClusters: bindSlider("metalClusters", "metal_clusters"),
        numArmies: bindSlider("numArmies", "num_armies"),
        landingZonesPerArmy: bindSlider(
          "landingZonesPerArmy",
          "landing_zones_per_army"
        ),
        landingZoneSize: bindSlider("landingZoneSize", "landing_zone_size"),
        mass: bindSlider("mass"),
      };

      self.advancedSliders = {
        landingZoneSize: self.bindAdvancedSlider(
          "landingZoneSize",
          "landing_zone_size_advanced",
          self.updateLandingZoneSize
        ),
      };
    };

    self.loadPlanetCount = ko.observable(0);

    self.systemIsEmpty = ko.computed(function () {
      return !self.system() || !self.planetsInSystem();
    });

    self.systemRadiusIsTooSmall = ko.computed(function () {
      return self.radius() < self.valueRanges.min;
    });

    self.systemRadiusIsTooLarge = ko.computed(function () {
      return self.radius() > self.valueRanges.max;
    });

    self.systemHasNoStartingPlanet = ko.computed(function () {
      if (self.loadPlanetCount()) return false;

      if (self.systemIsEmpty()) return true;

      var has_start = _.any(self.system().planets, function (planet) {
        return planet.starting_planet && planet.biome !== "gas";
      });
      return !has_start;
    });

    self.systemValid = ko.computed(function () {
      var invalid =
        self.systemIsEmpty() ||
        self.systemRadiusIsTooSmall() ||
        self.systemRadiusIsTooLarge() ||
        self.systemHasNoStartingPlanet();
      return !invalid;
    });

    self.canSave = ko.computed(function () {
      return self.systemValid() && !self.planetUnderConstruction();
    });

    self.saveEnabled = ko.computed(function () {
      return self.canSave() && self.saveDirty();
    });

    self.enforceInputRanges = function () {
      _.forIn(self.valueRanges, function (range, name) {
        var observable = self[name];
        var clamped = Math.max(range.min, Math.min(observable(), range.max));
        if (clamped !== observable()) observable(clamped);
      });
    };

    self.updateSliders = function () {
      if (!self.sliders) return;

      _.forIn(self.sliders, function (slider, name) {
        slider.slider("setValue", self[name]());
      });
    };

    self.biomeJsonsObs = ko.observable().extend({ session: "biome_jsons" });
    self.checkBiomeJson = function (biome) {
      if (!self.sliders) return;

      var spec = self.biomeJsonsObs()[biome];
      var radius_range = spec.radius_range;

      if (_.isEmpty(radius_range))
        radius_range = [
          self.defaultRadiusRange.min,
          self.defaultRadiusRange.max,
        ];

      self.valueRanges.radius.min = radius_range[0];
      self.valueRanges.radius.max = radius_range[1];

      self.sliders.radius.data().slider.min = radius_range[0];
      self.sliders.radius.data().slider.max = radius_range[1];
      self.sliders.radius.slider("calculateValue");

      var hasTerrain =
        !_.isBoolean(spec.enable_terrain) || spec.enable_terrain === true;
      self.sliders.heightRange.enabled(hasTerrain);

      // for now we are assuming an terrainless planet is featureless
      self.sliders.metalDensity.enabled(hasTerrain);
      self.sliders.metalClusters.enabled(hasTerrain);

      var hasWater = !_.isEmpty(spec.water);
      self.sliders.waterHeight.enabled(hasWater);
      self.sliders.waterDepth.enabled(hasWater);

      self.updateSliders();
    };

    self.setupPlanet = function () {
      var p = self.selectedPlanet();

      if (!p) return;

      // Round to the nearest integer.  Slider values can come back as 0.99999.
      var fixNumber = function (n) {
        return n ? parseFloat(n.toFixed()) : 0;
      };

      self.planetName(p.name);
      self.seed(fixNumber(p.planet.seed));
      self.radius(fixNumber(p.planet.radius));
      self.heightRange(fixNumber(p.planet.heightRange));
      self.biomeScale(fixNumber(p.planet.biomeScale));
      self.waterHeight(fixNumber(p.planet.waterHeight));
      self.waterDepth(fixNumber(p.planet.waterDepth));
      self.temperature(fixNumber(p.planet.temperature));
      self.metalDensity(p.planet.metalDensity);
      self.metalClusters(p.planet.metalClusters);
      self.selectedBiome(p.planet.biome);
      self.numArmies(fixNumber(p.planet.numArmies));
      self.landingZonesPerArmy(p.planet.landingZonesPerArmy);
      self.landingZonesPerArmyIsAuto(
        self.landingZonesPerArmy() === USE_DEFAULT
      );
      self.landingZoneSize(p.planet.landingZoneSize);
      self.landingZoneSizeIsAuto(self.landingZoneSize() === USE_DEFAULT);
      self.selectedSymmetryType(p.planet.symmetryType);
      self.symmetricalMetal(p.planet.symmetricalMetal);
      self.symmetricalStarts(p.planet.symmetricalStarts);

      self.heightAdjustments(p.planet.heightAdjustments);

      self.mass(fixNumber(p.mass));
      self.position_x(p.position_x);
      self.position_y(p.position_y);
      self.velocity_x(p.velocity_x);
      self.velocity_y(p.velocity_y);
      self.required_thrust_to_move(p.required_thrust_to_move);
      self.starting_planet(p.starting_planet);

      if (self.sliders)
        self.sliders.numArmies.enabled(!self.disableNumArmies());

      if (
        _.isEmpty(self.biomeJsonsObs()) ||
        _.isEmpty(self.biomeJsonsObs()[p.planet.biome])
      ) {
        if (_.isEmpty(self.biomeJsonsObs())) self.biomeJsonsObs({});

        $.get("coui://pa/terrain/" + p.planet.biome + ".json").then(function (
          data
        ) {
          var biomes = self.biomeJsonsObs();
          biomes[p.planet.biome] = decode(data);
          self.biomeJsonsObs(biomes);
          self.checkBiomeJson(p.planet.biome);
        });
      } else self.checkBiomeJson(p.planet.biome);
    };

    self.setSliders = self.setupPlanet;

    self.changeSelectedPlanet = function (index) {
      self.selectedPlanetIndex(index);

      if (index != -1) {
        self.showAstroidBeltPanel(false);
        self.showSystemPanel(false);
      }

      if (
        typeof self.system().planets != "undefined" &&
        self.system().planets.length > -1
      )
        self.setupPlanet();
    };

    self.handleHideControls = function () {
      model.showControls(false);
      engine.call(
        "execute",
        "set_planet_offset",
        JSON.stringify({ x_offset: 0, y_offset: 0 })
      );
    };
    self.handleShowControls = function () {
      model.showControls(true);
      engine.call(
        "execute",
        "set_planet_offset",
        JSON.stringify({ x_offset: sefl.sceenOffset(), y_offset: 0 })
      );
    };
    self.toggleStellarGrid = function () {
      if (self.selectedMode() === "system")
        engine.call("execute", "toggle_stellar_grid", JSON.stringify({}));
    };

    self.newPlanetName = function () {
      api.game.getRandomPlanetName().then(function (name) {
        self.planetName(name);
        self.update_planet_spec();
      });
    };

    var MIN_RANDOM_SEED = 1;
    var MAX_RANDOM_SEED = 4294967295 * 0.45;
    /* uint32 max times an arbitrary fraction.
           the fraction was choosen so that the number display will not coerce the high values into negative numbers.
           once the coercion problem is resolved, we should remove the fraction.
           note: the c++ client will work just fine when you send it negative numbers, but it looks weird. */

    self.generateRandomSeed = function () {
      var min = MIN_RANDOM_SEED,
        max = MAX_RANDOM_SEED;

      return Math.floor(Math.random() * (max - min)) + min;
    };

    self.newRandomSeed = function () {
      self.seed(self.generateRandomSeed());
      self.update_planet_spec();
    };

    self.setStartingPlanet = function (index) {
      engine.call(
        "execute",
        "set_start_planet",
        JSON.stringify({ index: index })
      );
    };

    self.issueCancel = function () {
      engine.call("execute", "cancel", JSON.stringify({}));
    };

    self.handleLoad = function () {
      var loaded = self.loadedSystem();
      if (!_.isEmpty(loaded)) {
        self.loadPlanetCount(loaded.planets.length);

        self.systemName(loaded.name);

        self.systemDescription(loaded.description);

        self.systemCreator(loaded.creator);

        self.systemVersion(loaded.version);

        _.forEach(loaded.planets, function (planet, i) {
          self.checkPlanetSource(planet);
        });

        engine.call("systemEditor.resetSystem", JSON.stringify(loaded));

        self.saveDirty(false);
        self.lastSavedSystemName(self.systemName());

        self.computeSystemAsteroidValues(loaded);
      }
    };

    self.loading = ko.observable(true);

    self.csgPaletteHover = ko.observable();

    self.toggleEditCsg = function () {
      if (self.planetUnderConstruction()) return;

      api.terrain_editor.toggleEditTerrainMode();
    };

    self.toggleEditMetalSpots = function () {
      if (self.planetUnderConstruction()) return;

      api.terrain_editor.toggleEditMetalSpots();
    };

    self.toggleEditLandingZones = function () {
      if (self.planetUnderConstruction()) return;

      // if enabled then disable
      if (api.terrain_editor.editingLandingZones()) {
        api.terrain_editor.toggleEditLandingZones();
      } else {
        var deferred = $.Deferred();

        // if enabling and no metal spots then force generation of custom metal spots

        if (self.customMetalSpotCount() == 0) {
          api.terrain_editor.startEditMetalSpots().then(function () {
            api.terrain_editor.endEditMetalSpots().then(function () {
              deferred.resolve();
            });
          });
        } else {
          deferred.resolve();
        }

        deferred.done(function () {
          if (!self.starting_planet()) {
            self.starting_planet(true);
            self.update_planet_spec();
          }

          api.terrain_editor.toggleEditLandingZones();
        });
      }
    };

    self.advancedLandingZonesDisabled = ko.computed(function () {
      return self.planetUnderConstruction() || !self.starting_planet();
    });

    self.checkResize = function () {
      var $editor_controls = $("#editor_controls");

      var bottom = api.terrain_editor.editingTerrain() ? 300 : 140;

      if ($(window).width() > 2140) bottom = 140;

      var height = $(window).height() - bottom;

      $editor_controls.css("max-height", height);

      $("#div_planet_landing_zones_list").css("max-height", height - 510);
      $("#div_csg_json").css("max-height", height - 490);
    };

    self.selectedCsgKeyCommands = [
      "grab_csg",
      "release_csg",
      "delete_selected",
      "copy_selected",
      "paste",
      "rotate_csg_cw",
      "rotate_csg_ccw",
      "scale_csg_up",
      "scale_csg_down",
      "scale_csg_vertically_up",
      "scale_csg_vertically_down",
      "scale_csg_horizontally_up",
      "scale_csg_horizontally_down",
      "move_csg_up",
      "move_csg_down",
    ];

    self.csgCommands = ko.computed(function () {
      if (!self.selectedCsg()) {
        return [{ key: "", keyBinding: loc("!LOC: SELECT CSG"), title: "" }];
      }

      var result = _.map(self.selectedCsgKeyCommands, function (key) {
        var keyBinding, title;

        if (key == "release_csg") {
          keyBinding = "esc";
          title = "release csg";
        } else {
          keyBinding = api.settings.value("keyboard", key);

          if (!keyBinding) keyBinding = "?";

          title = loc(api.settings.title("keyboard", key));
        }
        return { key: key, keyBinding: "[" + keyBinding + "] ", title: title };
      });

      return result;
    });

    self.handleCsgCommandClick = function (data) {
      if (!data) return;

      var fn = action_sets["terrain editor"][data.key];
      fn();
    };

    self.planetSummary = ko.computed(function () {
      var planets = [
        {
          name: "Sun",
          imageSmall: "coui://ui/main/shared/img/img_system_generic_icon.png",
          isSelected: false,
          index: "sun",
        },
      ];

      var selectedPlanetIndex = self.selectedPlanetIndex();

      var asteroids = false;

      _.forEach(self.system().planets, function (planet, index) {
        var biome = planet.planet.biome;

        var asteroid = biome == "asteroid";
        if (asteroid) index = "asteroid";

        var isSelected = !asteroid && index == selectedPlanetIndex;

        planets.push({
          name: planet.name,
          imageSmall:
            "coui://ui/main/shared/img/planets/small/" + biome + ".png",
          index: index,
          isSelected: isSelected,
        });
      });

      return planets;
    });

    self.selectPlanet = function (index) {
      var isAsteroid = index == "asteroid";

      if (index == "sun" || isAsteroid) {
        api.camera.setMode("space");
        api.camera.lookAt({ location: { x: 0, y: 0, z: 0 } });
        self.showAstroidBeltPanel(!!isAsteroid);
        self.showSystemPanel(!isAsteroid);
        self.showControls(false);
      } else {
        self.showSystemPanel(false);
        api.camera.focusPlanet(index);
        api.camera.setMode("planet");
        self.showAstroidBeltPanel(false);
        self.showControls(true);
      }
    };


    self.setup = function () {
      api.systemEditor.start();

      model.handleLoad();

      model.bindSliders();

      modify_keybinds({ add: ["camera controls", "camera"] });

      Mousetrap.bind("g", model.toggleStellarGrid);
      Mousetrap.bind("esc", model.issueCancel);

      $("input").focus(function () {
        api.game.captureKeyboard(true);
      });
      $("input").blur(function () {
        api.game.releaseKeyboard(true);
      });
      api.game.releaseKeyboard(true);

      api.audio.setMusic("/Music/Music_Planet_Editor");

      $(window).resize(self.checkResize);

      self.checkResize();

      // disable camera scrolling when scrolling long landing zones list
      $("#div_planet_landing_zones_list").hover(
        function () {
          engine.call("game.allowKeyboard", false);
        },
        function () {
          engine.call("game.allowKeyboard", true);
        }
      );
      $("#div_csg_json").hover(
        function () {
          engine.call("game.allowKeyboard", false);
        },
        function () {
          engine.call("game.allowKeyboard", true);
        }
      );
    };

    // Temporary handler for camera mouse button control binding
    // TODO: Update for holodeck use
    $("body").mousedown(function (mdevent) {
      if (mdevent.button === 1) {
        api.systemEditor.beginControlCamera();
        input.capture(this, function (event) {
          var mouseDone = event.type === "mouseup" && mdevent.button === 1;
          var escKey =
            event.type === "keypress" && event.keyCode === keyboard.esc;
          if (mouseDone || escKey) {
            input.release();
            api.systemEditor.endControlCamera();
          }
        });
        mdevent.preventDefault();
        mdevent.stopPropagation();
        return;
      }
    });

    modify_keybinds({ add: ["terrain editor"] });
  }

  $(document).ready(function () {
    model = new SystemEditorViewModel();

    handlers = {};
    handlers.planets_are_ready = function (payload) {
      model.planetUnderConstruction(!payload.ready);

      if (payload.ready) api.terrain_editor.signalPlanetReady();
      model.updatePlanetStatus(payload);
    };

    handlers.planet_csg = function (payload) {
      model.selectedCsg(payload.selected);

      _.defer(model.checkResize);

      var index = payload.index;
      var planetCSG = payload.csgs && payload.csgs.brushes;

      if (model.selectedPlanetIndex() != payload.index) {
        console.error("planet_csg for different planet");
      }

      var planet = model.system().planets[index];

      if (_.isEqual(planet.planetCSG, planetCSG)) return;

      planet.planetCSG = planetCSG;
      model.systemUpdated();
    };

    handlers.planet_metal_spots = function (payload) {
      var index = payload.index;
      var metal_spots = payload.metal_spots;

      if (model.selectedPlanetIndex() != payload.index) {
        console.error("planet_metal_spots for different planet");
      }

      var planet = model.system().planets[index];

      if (_.isEqual(planet.metal_spots, metal_spots)) return;

      planet.metal_spots = metal_spots;
      model.systemUpdated();
    };

    handlers.planet_landing_zones = function (payload) {
      var index = payload.index;
      var landing_zones = payload.landing_zones;

      if (model.selectedPlanetIndex() != payload.index) {
        console.error("planet_landing_zones for different planet");
      }

      var planet = model.system().planets[index];

      if (_.isEqual(planet.landing_zones, landing_zones)) return;

      planet.landing_zones = landing_zones;
      model.systemUpdated();

      model.checkResize();
    };

    handlers.camera_type = function (payload) {
      if (
        payload.camera_type === "planet" &&
        model.selectedMode() != "planet"
      ) {
        model.transitionInToPlanetEditor(true);
        model.selectedMode("planet");
      } else if (
        payload.camera_type === "space" &&
        model.selectedMode() != "system"
      ) {
        model.transitionOutOfPlanetEditor(true);
        model.selectedMode("system");
      }
    };

    handlers.system_blueprint = function (payload) {
      // copy updated source from engine
      _.forEach(payload.system.planet_specs, function (planet, index) {
        var source = planet.source;
        if (source) {
          planet.planetCSG = source.brushes;
          planet.metal_spots = source.metal_spots;
          planet.landing_zones = source.landing_zones;
        }
      });

      // We receive one blueprint update per planet that we add while loading
      if (model.loadPlanetCount()) {
        model.loadPlanetCount(model.loadPlanetCount() - 1);
        if (model.loadPlanetCount()) return;
      }
      var systemJson = JSON.stringify(payload.system);
      var oldString = model.currentSystemString();
      if (systemJson === oldString) return;

      var dirty = !!oldString || _.isEmpty(model.loadedSystem());
      model.currentSystemString(systemJson);
      model.system(new SystemModel(payload.system));
      model.ensureStartingPlanet();
      model.setupPlanet();
      model.saveDirty(dirty);

      handlers.selected_planet_index(payload);
    };

    handlers.selected_planet_index = function (payload) {
      var changed = payload.index != model.selectedPlanetIndex();

      if (changed) model.changeSelectedPlanet(payload.index);

      model.updatePlanetStatus(payload);

      if (
        changed &&
        model.selectedMode() == "planet" &&
        model.selectedPlanetIsCustom() &&
        !model.selectedPlanetIsFullyLoaded()
      )
        model.previewSelectedPlanet(true);
    };

    handlers.selected_planet_editing = function (payload) {
      model.updatePlanetStatus(payload);
    };

    handlers.time = function (payload) {
      model.time(payload.current_time);

      var location = {};
      if (model.selectedMode() == "planet") {
        location = payload.location || {};
        if (_.has(location, "x")) {
          location.lat = (Math.atan2(location.x, location.y) * 180) / Math.PI;
          location.long =
            (Math.atan2(
              location.z,
              Math.sqrt(location.x * location.x + location.y * location.y)
            ) *
              180) /
            Math.PI;
        }
      }

      if (!_.isEqual(model.mouseLocation(), location))
        model.mouseLocation(location);
    };

    handlers.camera_movement = function (payload) {
      var location = {};
      if (model.selectedMode() == "planet") {
        location = payload.location || {};
      }

      if (!_.isEqual(model.cameraLocation(), location))
        model.cameraLocation(location);
    };

    api.camera.injectHandlers(handlers); // allow the camera to run its history stuff that the system editor doesn't care about

    // inject per scene mods
    if (scene_mod_list["system_editor"])
      loadMods(scene_mod_list["system_editor"]);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    model.setup();
  });
});
