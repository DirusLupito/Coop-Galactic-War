var model;
var handlers = {};

$(document).ready(function () {

    var gwReconnectTarget = $.url().param('target') || 'coui://ui/main/game/live_game/live_game.html';
    var gwReconnectFilesRequested = false;
    var gwReconnectFilesReady = false;

    function requestReconnectMemoryFiles(reason) {
        if (gwReconnectFilesRequested)
            return;

        gwReconnectFilesRequested = true;

        model.send_message('request_memory_files', {
            reason: reason,
            reconnect_to_game_info: model.reconnectToGameInfo && model.reconnectToGameInfo()
        }, function (success, response) {
            if (!success || !(response && response.sent))
                gwReconnectFilesRequested = false;
        });
    }

    function GwReconnectLoadingViewModel() {
        var self = this;

        self.reconnectToGameInfo = ko.observable().extend({ local: 'reconnect_to_game_info' });
        self.pageSubTitle = ko.observable(loc('!LOC:Connecting to server...'));

        self.navToMainMenu = function () {
            var transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
            var transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
            var transitDestination = ko.observable().extend({ session: 'transit_destination' });
            var transitDelay = ko.observable().extend({ session: 'transit_delay' });

            self.reconnectToGameInfo(undefined);
            transitPrimaryMessage(loc('!LOC:Returning to Main Menu'));
            transitSecondaryMessage('');
            transitDestination('coui://ui/main/game/start/start.html');
            transitDelay(0);
            window.location.href = 'coui://ui/main/game/transit/transit.html';
            return;
        };
    }
    model = new GwReconnectLoadingViewModel();

    handlers.login_rejected = function () {
        console.error('GW reconnect login rejected');
        model.navToMainMenu();
    };

    handlers.connection_disconnected = function () {
        console.error('GW reconnect disconnected');
        model.navToMainMenu();
    };

    handlers.server_state = function (msg) {
        var serverGameType = msg
            && msg.data
            && msg.data.client
            && msg.data.client.game_options
            && msg.data.client.game_options.game_type;

        if (msg && msg.url === gwReconnectTarget && serverGameType === 'Galactic War' && !gwReconnectFilesReady) {
            model.pageSubTitle(loc('!LOC:Restoring Galactic War unit specs...'));
            requestReconnectMemoryFiles('gw_reconnect_server_state');
            return;
        }

        if (msg && msg.url && msg.url !== window.location.href) {
            window.location.href = msg.url;
            return;
        }
    };

    handlers.memory_files = function (msg) {
        if (!msg)
            return;

        if (!msg['/pa/units/unit_list.json']) {
            var playerUnitList = msg['/pa/units/unit_list.json.player'];
            var aiUnitList = msg['/pa/units/unit_list.json.ai'];
            var units = (playerUnitList && playerUnitList.units || []).concat(aiUnitList && aiUnitList.units || []);
            msg['/pa/units/unit_list.json'] = { units: units };
        }

        var cookedFiles = _.mapValues(msg, function (value) {
            if (typeof value !== 'string')
                return JSON.stringify(value);
            return value;
        });

        api.file.unmountAllMemoryFiles().always(function () {
            api.file.mountMemoryFiles(cookedFiles).always(function () {
                api.game.setUnitSpecTag('.player');
                gwReconnectFilesReady = true;
                model.pageSubTitle(loc('!LOC:Entering game...'));

                model.send_message('memory_files_received', {}, function (success, response) {
                    window.location.href = gwReconnectTarget;
                });
            });
        });
    };

    if (window.CommunityMods) {
        try {
            CommunityMods();
        } catch (e) {
            console.error(e);
        }
    }

    loadSceneMods('gw_reconnect_loading');
    app.registerWithCoherent(model, handlers);
    ko.applyBindings(model);
    app.hello(handlers.server_state, handlers.connection_disconnected);
});