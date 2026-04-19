// !LOCNS:galactic_war
var model;

$(document).ready(function() {

    // Mark this client session as running through GW coop lobby flow.
    ko.observable(true).extend({ session: 'gw_coop_mode' });

    function GWLobbyViewModel() {
        var self = this;

        self.serverLoading = ko.observable(true);
        self.clientLoading = ko.observable(true);
        self.devMode = ko.observable().extend({ session: 'dev_mode' });
        self.gwConfigMounted = ko.observable(false);
        self.ready = ko.computed(function() {
            return !self.clientLoading() && !self.serverLoading();
        })
        self.ready.subscribe(function() { self.updateReadyState(); });

        self.gameSystemReadyInfo = ko.observable('');
        self.gameSystemReady = ko.computed(function() {
            var result = self.serverLoading() || self.clientLoading();
            if (result)
                self.gameSystemReadyInfo('Planets are building');
            else
                self.gameSystemReadyInfo('');
            return !result;
        });

        self.gameIsNotOkInfo = ko.computed(function() {
            return self.gameSystemReadyInfo();
        });
        self.gameIsNotOk = ko.computed(function() { return !self.gameSystemReady(); });

        // TODO: Remove when planets are generated using the new schema
        self.fixupPlanetConfig = function(system) {

            var planets = system.planets || [];
            for (var p = 0; p < planets.length; ++p)
            {
                var planet = planets[p];
                if (planet.hasOwnProperty('position_x'))
                {
                    planet.position = [planet.position_x, planet.position_y];
                    delete planet.position_x;
                    delete planet.position_y;
                }
                if (planet.hasOwnProperty('velocity_x'))
                {
                    planet.velocity = [planet.velocity_x, planet.velocity_y];
                    delete planet.velocity_x;
                    delete planet.velocity_y;
                }
                if (planet.hasOwnProperty('planet'))
                {
                    planet.generator = planet.planet;
                    delete planet.planet;
                }
            }
            return system;
        }

        self.config = ko.observable('').extend({ memory: 'gw_battle_config' });

        self.lastSceneUrl = ko.observable().extend({ session: 'last_scene_url' });

        self.navBack = function() {
            if (self.lastSceneUrl())
                window.location.href = self.lastSceneUrl();
        };

        self.updateReadyState = function() {
            if (self.ready())
                self.send_message('set_ready', {ready: true});
        };
        self.updateReadyState();

        var $loadingPage = $('#building_planets');
        var baseLoadingUrl = $loadingPage.attr('src');
        var loadingMessages = [
            '!LOC:APPROACHING STAR SYSTEM',
            '!LOC:PREPARE FOR LANDING',
            '!LOC:CONFIGURING LANDING ZONE',
            '!LOC:CALCULATING APPROACH VECTOR'
        ];
        var newLoadingUrl = baseLoadingUrl + '?message=' + encodeURIComponent(_.sample(loadingMessages));
        $loadingPage.attr('src', newLoadingUrl);
    }
    model = new GWLobbyViewModel();
    var GW_SYNCED_ICON_CACHE_BUSTER_KEY = 'gw_campaign_synced_icon_cache_buster';
    var GW_SYNCED_ICON_BASE64_MAP_KEY = 'gw_campaign_synced_icon_base64_map';

    handlers = {};

    handlers.control = function(control) {
        model.serverLoading(!control.sim_ready);
        if (!control.has_config) {
            var config = model.config();
            if (config && typeof config === 'object') {
                config.sandbox = !!model.devMode();
                model.send_message('set_config', config);
            }
        }
    };

    handlers.gw_config = function(payload) {
        if (!payload || !payload.files)
            return;

        var hasValidPngSignature = function(value) {
            return _.isString(value)
                && value.length >= 8
                && value.charCodeAt(0) === 137
                && value.charCodeAt(1) === 80
                && value.charCodeAt(2) === 78
                && value.charCodeAt(3) === 71
                && value.charCodeAt(4) === 13
                && value.charCodeAt(5) === 10
                && value.charCodeAt(6) === 26
                && value.charCodeAt(7) === 10;
        };

        var payloadFileEncodings = _.isObject(payload.file_encodings) ? payload.file_encodings : {};

        var decodePayloadFile = function(rawData, encoding) {
            var text = _.isString(rawData) ? rawData : '';
            var normalizedEncoding = _.isString(encoding) ? encoding.toLowerCase() : '';

            if (normalizedEncoding === 'base64') {
                try {
                    return atob(text);
                }
                catch (e) {
                    console.warn('[GW_COOP] gw_lobby.gw_config failed to decode base64 file reason=' + e);
                    return '';
                }
            }

            return text;
        };

        var payloadFileKeys = _.keys(payload.files);
        var payloadClientModsPrefixCount = _.filter(payloadFileKeys, function(path) {
            return _.isString(path) && path.indexOf('/client_mods/') === 0;
        }).length;
        var payloadPaPrefixCount = _.filter(payloadFileKeys, function(path) {
            return _.isString(path) && path.indexOf('/pa/') === 0;
        }).length;
        var payloadUiPrefixCount = _.filter(payloadFileKeys, function(path) {
            return _.isString(path) && path.indexOf('/ui/') === 0;
        }).length;
        var payloadImagesPrefixCount = _.filter(payloadFileKeys, function(path) {
            return _.isString(path) && path.indexOf('/images/') === 0;
        }).length;

        var hasGrenadierHit = _.has(payload.files, '/pa/units/land/bot_grenadier/bot_grenadier_ammo_hit.pfx');
        var hasGrenadierTrail = _.has(payload.files, '/pa/units/land/bot_grenadier/bot_grenadier_ammo_trail.pfx');
        var hasSupportCommanderTrail = _.has(payload.files, '/pa/units/land/bot_support_commander/bot_support_commander_ammo_trail.pfx');

        if (payloadClientModsPrefixCount) {
            var clientModsSamples = _.take(_.filter(payloadFileKeys, function(path) {
                return _.isString(path) && path.indexOf('/client_mods/') === 0;
            }), 5);
            console.warn('[GW_COOP] gw_lobby.gw_config still has /client_mods/ paths count=' + payloadClientModsPrefixCount + ' samples=' + clientModsSamples.join('|'));
        }

        console.log('[GW_COOP] gw_lobby.gw_config received files=' + payloadFileKeys.length + ' pa_prefix_count=' + payloadPaPrefixCount + ' ui_prefix_count=' + payloadUiPrefixCount + ' images_prefix_count=' + payloadImagesPrefixCount + ' client_mods_prefix_count=' + payloadClientModsPrefixCount + ' has_grenadier_hit=' + hasGrenadierHit + ' has_grenadier_trail=' + hasGrenadierTrail + ' has_support_commander_trail=' + hasSupportCommanderTrail);

        var decodedBase64Count = 0;
        var base64DecodeFailureCount = 0;
        _.forEach(payloadFileKeys, function(path) {
            var encoding = _.isString(payloadFileEncodings[path]) ? payloadFileEncodings[path] : '';
            if (!encoding.length)
                return;

            var decoded = decodePayloadFile(payload.files[path], encoding);
            if (_.isString(decoded) && decoded.length)
                decodedBase64Count += 1;
            else
                base64DecodeFailureCount += 1;

            payload.files[path] = decoded;
        });
        if (decodedBase64Count || base64DecodeFailureCount)
            console.log('[GW_COOP] gw_lobby.gw_config decoded_files=' + decodedBase64Count + ' decode_failures=' + base64DecodeFailureCount);

        if (!payload.files['/pa/units/unit_list.json']) {
            var playerUnitList = payload.files['/pa/units/unit_list.json.player'];
            var aiUnitList = payload.files['/pa/units/unit_list.json.ai'];
            var units = (playerUnitList && playerUnitList.units || []).concat(aiUnitList && aiUnitList.units || []);
            payload.files['/pa/units/unit_list.json'] = { units: units };
        }

        var gwPlayImageAliasCount = 0;
        var modsAliasCount = 0;
        _.forEach(_.keys(payload.files), function(path) {
            if (!_.isString(path))
                return;

            var marker = '/ui/mods/';
            if (path.indexOf(marker) !== 0)
                return;

            var remainder = path.substring(marker.length);
            var modNameSeparator = remainder.indexOf('/');
            if (modNameSeparator < 0 || modNameSeparator + 1 >= remainder.length)
                return;

            var modName = remainder.substring(0, modNameSeparator);
            var modRelativePath = remainder.substring(modNameSeparator + 1);

            var modsAliasPath = '/mods/' + modName + '/' + modRelativePath;
            if (!_.has(payload.files, modsAliasPath)) {
                payload.files[modsAliasPath] = payload.files[path];
                modsAliasCount += 1;
            }

            if (modRelativePath.indexOf('gw_play/img/') !== 0)
                return;

            var aliasPath = '/ui/main/game/galactic_war/' + modRelativePath;
            if (!_.has(payload.files, aliasPath)) {
                payload.files[aliasPath] = payload.files[path];
                gwPlayImageAliasCount += 1;
            }
        });
        if (gwPlayImageAliasCount || modsAliasCount)
            console.log('[GW_COOP] gw_lobby.gw_config applied aliases gw_play_img_count=' + gwPlayImageAliasCount + ' mods_count=' + modsAliasCount);

        var syncedIconBase64Map = {};
        _.forEach(_.keys(payload.files), function(path) {
            if (!_.isString(path)
                || path.indexOf('/ui/mods/') !== 0
                || path.indexOf('/gw_play/img/tech/') < 0
                || !/\.png$/i.test(path))
                return;

            var content = payload.files[path];
            if (!hasValidPngSignature(content))
                return;

            try {
                syncedIconBase64Map[path] = btoa(content);
            }
            catch (e) {
                console.warn('[GW_COOP] gw_lobby.gw_config failed to base64 encode synced icon path=' + path + ' reason=' + e);
            }
        });
        var syncedIconBase64Count = _.keys(syncedIconBase64Map).length;

        var cookedFiles = _.mapValues(payload.files, function(value) {
            if (typeof value !== 'string')
                return JSON.stringify(value);
            return value;
        });

        // Do not globally unmount memory files here. Community mod hooks on
        // unmountAllMemoryFiles can trigger broad remount activity and race
        // with GW lobby startup on some machines.
        api.file.mountMemoryFiles(cookedFiles).then(
            function() {
                try {
                    sessionStorage.setItem(GW_SYNCED_ICON_CACHE_BUSTER_KEY, String(_.now()));
                }
                catch (e) {
                    console.log('[GW_COOP] gw_lobby.gw_config failed to persist icon cache buster');
                }
                try {
                    sessionStorage.setItem(GW_SYNCED_ICON_BASE64_MAP_KEY, JSON.stringify(syncedIconBase64Map));
                }
                catch (e) {
                    console.log('[GW_COOP] gw_lobby.gw_config failed to persist synced icon base64 map');
                }
                console.log('[GW_COOP] gw_lobby.gw_config persisted synced icon base64 entries=' + syncedIconBase64Count);
                console.log('[GW_COOP] gw_lobby.gw_config mountMemoryFiles complete mounted_files=' + _.keys(cookedFiles).length);
                model.gwConfigMounted(true);
                api.game.setUnitSpecTag('.player');
                model.send_message('gw_config_ready', {});
            },
            function(err) {
                console.error('[GW_COOP] gw_lobby.gw_config mountMemoryFiles failed', err);
            }
        );
    };

    handlers.server_state = function(payload) {
        if (payload.url && payload.url !== window.location.href) {
            window.location.href = payload.url;
            return;
        }

        // Accept either a broadcast-style `data.control` or a per-client `data.client.control`.
        var control = null;
        if (payload && payload.data) {
            if (payload.data.control)
                control = payload.data.control;
            else if (payload.data.client && payload.data.client.control)
                control = payload.data.client.control;
        }
        
        if (control)
            handlers.control(control);
        else
            console.log('gw_lobby: server_state missing control payload', payload);
    };

    handlers.connection_disconnected = function(payload) {
        var transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
        var transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
        var transitDestination = ko.observable().extend({ session: 'transit_destination' });
        var transitDelay = ko.observable().extend({ session: 'transit_delay' });

        transitPrimaryMessage(loc('!LOC:CONNECTION TO SERVER LOST'));
        transitSecondaryMessage('');
        transitDestination(model.lastSceneUrl());
        transitDelay(5000);
        window.location.href = 'coui://ui/main/game/transit/transit.html';
    }

    var mergeGwCampaignSyncedSceneMods = function(sceneName) {
        if (!_.isString(sceneName) || !sceneName.length)
            return;

        var mergedCount = 0;
        var key = 'gw_campaign_synced_scene_mods';
        try {
            var raw = sessionStorage.getItem(key);
            if (!raw)
                return;

            var syncedSceneMods = JSON.parse(raw);
            if (!syncedSceneMods || !_.isObject(syncedSceneMods))
                return;

            var sceneUrls = _.isArray(syncedSceneMods[sceneName]) ? syncedSceneMods[sceneName] : [];
            if (!sceneUrls.length)
                return;

            if (!_.isObject(scene_mod_list))
                scene_mod_list = {};

            var existingSceneUrls = _.isArray(scene_mod_list[sceneName]) ? scene_mod_list[sceneName] : [];
            var mergedSceneUrls = _.union(existingSceneUrls, sceneUrls);
            mergedCount = Math.max(0, mergedSceneUrls.length - existingSceneUrls.length);
            scene_mod_list[sceneName] = mergedSceneUrls;
        }
        catch (e) {
            console.log('[GW_COOP] gw_lobby failed to merge synced scene mods scene=' + sceneName);
            return;
        }

        console.log('[GW_COOP] gw_lobby merged synced scene mods scene=' + sceneName + ' added=' + mergedCount + ' total=' + (scene_mod_list[sceneName] ? scene_mod_list[sceneName].length : 0));
    };

    mergeGwCampaignSyncedSceneMods('gw_lobby');

    // inject per scene mods
    if (scene_mod_list['gw_lobby'])
        loadMods(scene_mod_list['gw_lobby']);

    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    app.hello(handlers.server_state, handlers.connection_disconnected);

    // Browser-join clients may enter this scene after the server first sent gw_config.
    // Explicitly request the GW config and keep trying briefly until mounted.
    var requestGWConfig = function() {
        if (!model.gwConfigMounted()) {
            model.send_message('request_gw_config', {});
            setTimeout(requestGWConfig, 1000);
        }
    };
    requestGWConfig();

    var testLoading = function() {
        var worldView = api.getWorldView(0);
        if (worldView) {
            worldView.arePlanetsReady().then(function(ready) {
                model.clientLoading(!ready);
                setTimeout(testLoading, 500);
            });
        }
        else
            setTimeout(testLoading, 500);
    };
    setTimeout(testLoading, 500);
});
