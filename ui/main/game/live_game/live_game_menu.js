// !LOCNS:live_game
var model;
var handlers = {};

$(document).ready(function () {

    function MenuViewModel() {
        var self = this;

        self.state = ko.observableArray([]);

        // We don't want co-op clients in galactic war to be able to see the "Continue War" option
        // since only the host can continue a war. So we track the campaign role of the client and filter the menu options accordingly.

        self.gwCampaignRole = ko.observable('solo').extend({ session: 'gw_campaign_role' });

        self.applyFilteredState = function(state) {
            self.state(self.filterContinueWarForViewer(state));
        };

        self.refreshRoleAndState = function(state) {
            api.Panel.query(api.Panel.parentId, 'panel.invoke', ['gwCampaignRole']).then(function(role) {
                if (_.isString(role))
                    self.gwCampaignRole(role);

                self.applyFilteredState(state);
            });
        };

        self.filterContinueWarForViewer = function(state) {
            if ((self.gwCampaignRole() || '').toLowerCase() !== 'viewer')
                return state;

            return _.filter(state || [], function(entry) {
                return entry.action !== 'menuReturnToWar';
            });
        };

        self.menuAction = function(action) {
            api.Panel.message(api.Panel.parentId, 'menu.action', action);
        };

        self.active = ko.observable(true);

        self.setup = function () {
            $(window).focus(function() {
                // Note: Wait for a mouse move on active to avoid stale mouse positions.
                var activate = function() {
                    self.active(true);
                    $(window).off('mousemove', activate);
                };
                $(window).on('mousemove', activate);
            });
            $(window).blur(function() { self.active(false); });

            api.Panel.query(api.Panel.parentId, 'panel.invoke', ['menuConfig']).then(function(state) {
                self.refreshRoleAndState(state);
            });

            self.gwCampaignRole.subscribe(function() {
                self.applyFilteredState(self.state());
            });
        };
    }
    model = new MenuViewModel();

    handlers.state = function (payload) {
        console.log('[GW_COOP] live game menu state handler got payload', payload);
        console.log('[GW_COOP] live game menu current gw_campaign_role=' + model.gwCampaignRole());
        model.refreshRoleAndState(payload);
    };

    // inject per scene mods
    if (scene_mod_list['live_game_menu'])
        loadMods(scene_mod_list['live_game_menu']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});
