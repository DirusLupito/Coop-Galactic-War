// !LOCNS:live_game
var model;
var handlers = {};

$(document).ready(function () {

    var start = /[^\/]*$/;  // ^ : start , \/ : '/', $ : end // as wildcard: /*.json
    var end = /[.]json$/;

    function WorldUnitHoverModel(object) {
        var self = this;

        if (!_.isObject(object))
            object = {};

        self.id = ko.observable(object.spec_id);
        self.entity = ko.observable(object.entity);

        self.isFeature = ko.observable(object.is_feature);
        self.name = ko.observable(loc(object.display_name || object.name || '!LOC:Unknown'));

        self.reclaimable = ko.observable(object.reclaimable);
        self.isMetalSpot = ko.observable(object.is_metal_spot);

        self.location = ko.observable(object.location);

        self.locationString = ko.computed(function() {
            var location = self.location();
            if (!location)
                return '';
            return Math.round(location.x) + ', ' + Math.round(location.y) + ', ' + Math.round(location.z);
        });

        self.icon = ko.computed(function () {
            var id = self.id();

            if (id && id.startsWith('/pa/units'))
                return Build.iconForSpecId(id);
            else if (self.isMetalSpot())
                return "coui://ui/main/atlas/icon_atlas/img/strategic_icons/icon_si_metal_splat_02.png";

            return 'img/build_bar/img_blip.png';
        });

        self.operator = ko.observable('');
        self.status = ko.observable('');
        self.showHealth = ko.observable(true);
        self.healthFraction = ko.observable(1.0).extend({ numeric: 5 });

        self.showAmmo = ko.observable(false);
        self.ammoFraction = ko.observable(1.0).extend({ numeric: 2 });
        self.isDead = ko.observable(false);
        self.isAlive = ko.computed(function () { return !self.isDead() });

        self.metalGain = ko.observable(0).extend({ numeric: 2 });
        self.energyGain = ko.observable(0).extend({ numeric: 2 });

        self.energyLoss = ko.observable(0).extend({ numeric: 2 });
        self.metalLoss = ko.observable(0).extend({ numeric: 2 });

        self.energyDelta = ko.computed(function () { return self.energyGain() - self.energyLoss() }).extend({ numeric: 2 });
        self.metalDelta = ko.computed(function () { return self.metalGain() - self.metalLoss() }).extend({ numeric: 2 });

        self.damage = ko.observable(0).extend({ numeric: 2 });
        self.rateOfFire = ko.observable(0).extend({ numeric: 2 });
        self.projectilesPerFire = ko.observable(1).extend({ numeric: 2 });
        self.damagePerSecond = ko.computed(function () {
            return self.damage() * self.rateOfFire() * self.projectilesPerFire();
        }).extend({ numeric: 2 });

        self.primaryColor = ko.observable('');
        self.secondaryColor = ko.observable('');

        self.healthColor = ko.computed(function () {

            if (self.isDead())
                return 'rgb(136,136,136)';

            var r = Math.round((1 - self.healthFraction()) * 255);
            var g = Math.round(Math.min(self.healthFraction() * 2.0, 1.0) * 255);
            var b = 0;

            return 'rgb(' + r + ',' + g + ',' + b + ')';
        });

        self.healthWidthString = ko.computed(function () { return '' + (self.healthFraction() * 100) + '%' });
        self.healthPercentString = ko.computed(function () { return '' + Math.round(self.healthFraction() * 100) + '%' });

        self.ammoWidthString = ko.computed(function () { return '' + (self.ammoFraction() * 100) + '%' });
        self.ammoPercentString = ko.computed(function () { return '' + Math.round(self.ammoFraction() * 100) + '%' });

        self.actionIsAttacking = ko.observable(false);
        self.actionIsBuilding = ko.observable(false);
        self.actionIsReclaiming = ko.observable(false);
        self.actionIsTransport = ko.observable(false);

        self.showAction = ko.computed(function () { return self.actionIsAttacking() || self.actionIsBuilding() || self.actionIsReclaiming() || self.actionIsTransport() });
        self.hideAction = ko.computed(function () { return !self.showAction() });

        self.target = ko.observable(null);

        /* end setup */

        if ((object.blip || object.ghost) || _.isEmpty(object))
            self.showHealth(false);

        self.healthFraction((object && object.health && object.health.max) ? object.health.current / object.health.max : 0);

        self.showAmmo(!_.isUndefined(object.ammo_fraction));

        self.ammoFraction(object && object.ammo_fraction);
        self.isDead(self.healthFraction() <= 0 || self.isFeature());

        if (self.isDead())
            self.healthFraction(object.metal_fraction);

        if (self.isFeature()) {
            self.showHealth(self.reclaimable());
            self.healthFraction(object.current_metal_value / object.total_metal_value);
        } else {

            self.metalGain((object.production && self.isAlive()) ? object.production.metal : 0);
            self.energyGain((object.production && self.isAlive()) ? object.production.energy : 0);

            self.energyLoss((object.consumption && self.isAlive()) ? object.consumption.energy : 0);
            self.metalLoss((object.consumption && self.isAlive()) ? object.consumption.metal : 0);

            var gammaAdjust = function(c) {
              return Math.floor(Math.pow(c, 1/2.2) * 255)
            }

            if (object.army) {
                /* the army info that gets packaged up for us only contains colors -- and in the case of a blip, only the primary color */
                self.primaryColor('rgb(' + gammaAdjust(object.army.primary_color.r) + ',' + gammaAdjust(object.army.primary_color.g) + ',' + gammaAdjust(object.army.primary_color.b) + ')');

                if (object.army.secondary_color) {
                    self.secondaryColor('rgb(' + gammaAdjust(object.army.secondary_color.r) + ',' + gammaAdjust(object.army.secondary_color.g) + ',' + gammaAdjust(object.army.secondary_color.b) + ')');
                } else {
                    self.secondaryColor(self.primaryColor());
                }
            }

            if (object.tool_details && object.tool_details.projectiles_per_fire)
                self.projectilesPerFire(object.tool_details.projectiles_per_fire);

            if (object.tool_details && object.tool_details.ammo)
            {
                self.damage(object.tool_details.ammo.damage);
                self.rateOfFire(object.tool_details.rate_of_fire);
            }
        }

        if (object.tool_details && object.tool_details.target_details) {
            self.target(new WorldUnitHoverModel(object.tool_details.target_details));
        }

        if (self.isAlive() && object.tool_details && object.tool_details.weapon_target) {
            self.actionIsAttacking(true);
            if (object.tool_details.energy)
                self.energyLoss(self.energyLoss() + object.tool_details.energy);
            if (object.tool_details.metal)
                self.metalLoss(self.metalLoss() + object.tool_details.metal);
        }

        if (self.isAlive() && object.tool_details && object.tool_details.build_target) {

            if (object.tool_details.build_target_reclaiming)
                self.actionIsReclaiming(true);
            else
                self.actionIsBuilding(true);

            if (object.tool_details.energy)
                self.energyLoss(self.energyLoss() + object.tool_details.energy);
            if (object.tool_details.metal)
                self.metalLoss(self.metalLoss() + object.tool_details.metal);
        }

        if (self.isAlive() && object.payload_details) {
            self.actionIsTransport(true);
            self.target(new WorldUnitHoverModel(object.payload_details));
        }
    }

    function LiveGameHoverViewModel() {
        var self = this;

        self.worldHoverTarget = ko.observable(new WorldUnitHoverModel({}));
        self.hasWorldHoverTarget = ko.observable(false);
        self.worldHoverTargetIsFeature = ko.observable(false);

    }
    model = new LiveGameHoverViewModel();

    handlers.hover = function (payload) {
        model.hasWorldHoverTarget(!_.isEmpty(payload));
        if (model.hasWorldHoverTarget())
            model.worldHoverTarget(new WorldUnitHoverModel(payload));
    }

    // inject per scene mods
    if (scene_mod_list['live_game_hover'])
        loadMods(scene_mod_list['live_game_hover']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);
});
