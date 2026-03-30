var model;

$(document).ready(function () {

    var ROLE_HOST = 'host';
    var ROLE_VIEWER = 'viewer';
    var DEFAULT_HOST_START_DELAY_MS = 10000;
    var HOST_START_MARGIN_MS = 2000;
    var DEFAULT_VIEWER_RECONNECT_DELAY_MS = 12000;

    function GwCampaignRestartLoadingViewModel() {
        var self = this;

        self.role = ko.observable(($.url().param('role') || ROLE_VIEWER).toLowerCase());
        self.pageSubTitle = ko.observable(loc('!LOC:Preparing reconnect...'));

        self.gwCampaignRestartContext = ko.observable().extend({ local: 'gw_campaign_restart_context' });
        self.reconnectToGameInfo = ko.observable().extend({ local: 'reconnect_to_game_info' });

        self.useLocalServer = ko.observable().extend({ session: 'use_local_server' });
        self.serverType = ko.observable().extend({ session: 'game_server_type' });
        self.serverSetup = ko.observable().extend({ session: 'game_server_setup' });
        self.gwCampaignEnabled = ko.observable().extend({ session: 'gw_campaign_enabled' });
        self.connectionAttempts = ko.observable().extend({ session: 'connection_attempts' });
        self.connectionRetryDelaySeconds = ko.observable().extend({ session: 'connection_retry_delay_seconds' });
        self.gwCampaignRestartPending = ko.observable().extend({ local: 'gw_campaign_restart_pending' });

        self.redirectHandle = undefined;
        self.cancelled = false;

        self.clearPendingRedirect = function() {
            if (self.redirectHandle) {
                clearTimeout(self.redirectHandle);
                self.redirectHandle = undefined;
            }
        };

        self.navToMainMenu = function () {
            var transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
            var transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
            var transitDestination = ko.observable().extend({ session: 'transit_destination' });
            var transitDelay = ko.observable().extend({ session: 'transit_delay' });

            self.cancelled = true;
            self.clearPendingRedirect();

            transitPrimaryMessage(loc('!LOC:Returning to Main Menu'));
            transitSecondaryMessage('');
            transitDestination('coui://ui/main/game/start/start.html');
            transitDelay(0);
            window.location.href = 'coui://ui/main/game/transit/transit.html';
        };

        // Move every restart participant into connect_to_game with retry-oriented
        // settings. Host starts a fresh gw_campaign server, viewers keep trying
        // to reconnect until that new server is available.
        self.begin = function() {
            var context = self.gwCampaignRestartContext() || {};
            var reconnectInfo = self.reconnectToGameInfo() || {};
            var role = self.role() === ROLE_HOST ? ROLE_HOST : ROLE_VIEWER;
            var content = context.content || reconnectInfo.content || 'PAExpansion1';
            var shutdownDelay = _.isFinite(context.shutdown_delay_ms) ? context.shutdown_delay_ms : DEFAULT_HOST_START_DELAY_MS;
            var hostStartDelay = Math.max(DEFAULT_HOST_START_DELAY_MS, shutdownDelay + HOST_START_MARGIN_MS);
            var viewerReconnectDelay = Math.max(DEFAULT_VIEWER_RECONNECT_DELAY_MS, hostStartDelay + 2000);

            console.log('[GW_COOP] restart_loading begin role=' + role + ' shutdownDelay=' + shutdownDelay + ' hostStartDelay=' + hostStartDelay + ' viewerDelay=' + viewerReconnectDelay);

            self.connectionAttempts(30);
            self.connectionRetryDelaySeconds(2);
            self.gwCampaignEnabled(true);
            self.gwCampaignRestartPending(false);

            if (role === ROLE_HOST) {
                self.pageSubTitle(loc('!LOC:Restarting server and reopening co-op campaign...'));
                self.serverSetup('gw_campaign');
                self.redirectHandle = setTimeout(function() {
                    if (self.cancelled)
                        return;

                    var params = {
                        action: 'start',
                        mode: 'gw_campaign',
                        content: content
                    };

                    var useLocal = _.has(context, 'use_local_server')
                        ? !!context.use_local_server
                        : !!self.useLocalServer();

                    if (useLocal) {
                        params.local = true;
                        self.serverType('local');
                    }
                    else
                        self.serverType('uber');

                    console.log('[GW_COOP] restart_loading host starting gw_campaign local=' + !!params.local + ' content=' + params.content);

                    window.location.href = 'coui://ui/main/game/connect_to_game/connect_to_game.html?' + $.param(params);
                }, hostStartDelay);

                return;
            }

            self.pageSubTitle(loc('!LOC:Waiting for host to restart co-op campaign...'));
            self.redirectHandle = setTimeout(function() {
                if (self.cancelled)
                    return;

                // Keep existing connection identity (host/port/lobby where present)
                // but force GW mode so connect_to_game retry logic follows the
                // same reconnect path used for Galactic War transitions.
                self.reconnectToGameInfo(_.assign({}, reconnectInfo, {
                    game: 'GalacticWar',
                    content: content
                }));

                console.log('[GW_COOP] restart_loading viewer entering reconnect flow');

                window.location.href = 'coui://ui/main/game/connect_to_game/connect_to_game.html';
            }, viewerReconnectDelay);
        };
    }

    model = new GwCampaignRestartLoadingViewModel();

    if (window.CommunityMods) {
        try {
            CommunityMods();
        } catch (e) {
            console.error(e);
        }
    }

    loadSceneMods('gw_campaign_restart_loading');
    ko.applyBindings(model);
    model.begin();
});
