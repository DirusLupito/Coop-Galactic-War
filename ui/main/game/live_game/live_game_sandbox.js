var model;
var handlers = {};

$(document).ready(function () {

    function SandboxViewModel() {
        var self = this;

        self.state = ko.observable({});
        self.unitSpecs = ko.observable({});

        self.sandbox_expanded = ko.observable(false);

        self.pauseSim = function () { self.send_message('control_sim', { paused: true  }); };
        self.playSim =  function () { self.send_message('control_sim', { paused: false }); };

        self.sandbox_stepSim = function () { self.send_message('control_sim', { step: true }); };

        self.sandboxToggleImage = ko.computed(function(){
            return self.sandbox_expanded() ? 'coui://ui/main/shared/img/controls/pin_open.png' : 'coui://ui/main/shared/img/controls/pin_closed.png';
        });

        self.keybindFor = function (key)
        {
            var binding = api.settings.value('keyboard', key);
            if (!binding)
                return null;

            return binding;
        }

        self.sandbox_units = ko.computed(function() {
            if (!self.sandbox_expanded())
                return [];

            // temp

            var unitTypeMapping =
            {
                'UNITTYPE_Debug': -1000000,
                'UNITTYPE_Fabber': -3000,
                'UNITTYPE_Factory': 2000,
                'UNITTYPE_Economy': 3000,
                'UNITTYPE_Mobile': 4000,
                'UNITTYPE_Structure': 500,
                'UNITTYPE_Offense': 1,
                'UNITTYPE_Defense': 1,
                'UNITTYPE_Artillery': 2,
                'UNITTYPE_Scout': 1,
                'UNITTYPE_Heavy': 2,
                'UNITTYPE_Transport': 10,
                'UNITTYPE_SelfDestruct': 9,
                'UNITTYPE_Recon': 50,
                'UNITTYPE_Advanced': 20,
                'UNITTYPE_Important': 1,
                'UNITTYPE_Nuke': 100,
                'UNITTYPE_NukeDefense': 100,
                'UNITTYPE_Bot': -100,
                'UNITTYPE_Land': 200,
                'UNITTYPE_Air': 300,
                'UNITTYPE_Fighter': 2,
                'UNITTYPE_Gunship': 3,
                'UNITTYPE_Bomber': 3,
                'UNITTYPE_Naval': 400,
                'UNITTYPE_Orbital': 800,
                'UNITTYPE_OrbitalDefense': 10,
                'UNITTYPE_LaserPlatform': 100,
                'UNITTYPE_ControlModule': 9000,
                'UNITTYPE_PlanetEngine': 9000,
                'UNITTYPE_Titan': 10000,
                'UNITTYPE_Commander': 100000,
                'UNITTYPE_NoBuild': 1000000,
            }
            var result = _.sortBy(_.map(self.unitSpecs(), function(unit, spec)
            {
                var sort = 100000;

                _.forEach(unit.types, function(type)
                {
                    sort += unitTypeMapping[type] || 0;
                })

                var name = loc(unit.name);

                return({
                    spec: spec,
                    icon: Build.iconForSpecId(spec),
                    name: name,
                    tooltip: name + ' ' + loc(unit.description),
                    sort: sort + unit.unit_name
                });
            }), 'sort');

            return result;
        });
        self.sandbox_unit_hover = ko.observable('');

        self.sandbox_copy_unit = function() {
            engine.call("unit.debug.setSpecId", self.sandbox_unit_hover());
        };
        self.toggleExpanded = function () { self.sandbox_expanded(!self.sandbox_expanded()); };

        self.active = ko.observable(true);

        self.setup = function () {
            $(window).focus(function() { self.active(true); });
            $(window).blur(function() { self.active(false); });

            api.Panel.query(api.Panel.parentId, 'panel.invoke', ['sandboxState']).then(self.state);

            if (_.size(self.unitSpecs()) == 0)
                engine.call('request_spec_data', api.Panel.pageId);
        };
    }
    model = new SandboxViewModel();

    handlers.state = function (payload) {
        model.state(payload);
    };

    handlers.unit_specs = model.unitSpecs;

    // inject per scene mods
    if (scene_mod_list['live_game_sandbox'])
        loadMods(scene_mod_list['live_game_sandbox']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});
