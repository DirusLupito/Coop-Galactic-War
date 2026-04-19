// !LOCNS:galactic_war
var globals = this;

var GW_SYNCED_ICON_CACHE_BUSTER_KEY = 'gw_campaign_synced_icon_cache_buster';
var GW_SYNCED_ICON_BASE64_MAP_KEY = 'gw_campaign_synced_icon_base64_map';

var deriveModsFallbackIconUrl = function(url) {
    if (!_.isString(url) || !url.length)
        return '';

    var queryIndex = url.indexOf('?');
    var pathOnly = queryIndex >= 0 ? url.substring(0, queryIndex) : url;
    var query = queryIndex >= 0 ? url.substring(queryIndex) : '';

    var marker = 'coui://ui/mods/';
    if (pathOnly.indexOf(marker) !== 0)
        return '';

    var remainder = pathOnly.substring(marker.length);
    if (!remainder.length)
        return '';

    return 'coui://mods/' + remainder + query;
};

var normalizeGwSyncedIconPathFromUrl = function(url) {
    if (!_.isString(url) || !url.length)
        return '';

    var queryIndex = url.indexOf('?');
    var pathOnly = queryIndex >= 0 ? url.substring(0, queryIndex) : url;
    if (pathOnly.indexOf('coui://') !== 0)
        return '';

    var couiPath = '/' + pathOnly.substring('coui://'.length);
    if (couiPath.indexOf('/ui/mods/') === 0)
        return couiPath;

    if (couiPath.indexOf('/mods/') === 0) {
        var remainder = couiPath.substring('/mods/'.length);
        var modNameSeparator = remainder.indexOf('/');
        if (modNameSeparator >= 0 && modNameSeparator + 1 < remainder.length) {
            var modName = remainder.substring(0, modNameSeparator);
            var modRelativePath = remainder.substring(modNameSeparator + 1);
            return '/ui/mods/' + modName + '/' + modRelativePath;
        }
    }

    return '';
};

var deriveSyncedIconDataUrl = function(url) {
    var normalizedPath = normalizeGwSyncedIconPathFromUrl(url);
    if (!normalizedPath.length)
        return '';

    try {
        var rawMap = sessionStorage.getItem(GW_SYNCED_ICON_BASE64_MAP_KEY) || '';
        if (!rawMap.length)
            return '';

        var parsedMap = JSON.parse(rawMap);
        if (!parsedMap || !_.isObject(parsedMap))
            return '';

        var base64 = parsedMap[normalizedPath];
        if (!_.isString(base64) || !base64.length)
            return '';

        return 'data:image/png;base64,' + base64;
    }
    catch (e) {
        return '';
    }
};

var applyGwIconCacheBuster = function(url) {
    if (!_.isString(url) || !url.length)
        return url;

    var eligible = url.indexOf('coui://ui/main/game/galactic_war/gw_play/img/tech/') === 0;
    if (!eligible)
        return url;

    if (url.indexOf('gw_sync=') >= 0)
        return url;

    var buster = '';
    try {
        buster = sessionStorage.getItem(GW_SYNCED_ICON_CACHE_BUSTER_KEY) || '';
    }
    catch (e) {
        buster = '';
    }

    if (!buster.length)
        return url;

    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'gw_sync=' + encodeURIComponent(buster);
};

globals.CardViewModel = function(params) {
    var self = this;

    self.params = ko.observable(params);
    self.id = ko.computed(function() {
        var p = self.params();
        return (typeof p === 'object') ? p.id : p;
    });

    self.visible = ko.observable(false);
    self.desc = ko.observable();
    self.locDesc = ko.computed(function() {
        return loc(self.desc());
    });
    self.summary = ko.observable();
    self.icon = ko.observable();
    self.iconPlaceholder = ko.observable(); // Displayed when the icon is empty
    self.audio = ko.observable();

    self.isEmpty = ko.computed(function() { return !self.id(); });
    self.isLoadout = ko.computed(function() { return self.id() && self.id().startsWith('gwc_start'); });

    var loaded = $.Deferred();
    self.card = loaded.promise();

    var loadCard = function(card, data) {
        if (_.isEmpty(card)) {
            self.desc('!LOC:Data Bank holds one Tech. Explore systems to find new Tech.');
            self.summary('!LOC:Empty Data Bank');
            self.icon('coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_empty.png');
            self.iconPlaceholder(undefined);
            self.visible(true);
        }
        else {
            self.desc(card.describe && card.describe(data));
            self.summary(card.summarize && card.summarize(data));
            var iconUrl = card.icon && card.icon(data);
            self.icon(applyGwIconCacheBuster(iconUrl));
            console.log('[GW_COOP] gwt_card icon_probe icon_url=' + self.icon());
            var probeImg = new Image();
            probeImg.onload = function() {
                console.log('[GW_COOP] gwt_card icon_probe image_load_ok icon_url=' + self.icon() + ' width=' + probeImg.naturalWidth + ' height=' + probeImg.naturalHeight);
            };
            probeImg.onerror = function() {
                var failedUrl = self.icon();
                var dataUrlFallback = deriveSyncedIconDataUrl(failedUrl);
                if (_.isString(dataUrlFallback) && dataUrlFallback.length) {
                    console.log('[GW_COOP] gwt_card icon_probe image_load_ok_data_url icon_url=' + failedUrl);
                    self.icon(dataUrlFallback);
                    return;
                }

                var fallbackUrl = deriveModsFallbackIconUrl(failedUrl);
                if (_.isString(fallbackUrl) && fallbackUrl.length && fallbackUrl !== failedUrl) {
                    var fallbackDataUrl = deriveSyncedIconDataUrl(fallbackUrl);
                    if (_.isString(fallbackDataUrl) && fallbackDataUrl.length) {
                        console.log('[GW_COOP] gwt_card icon_probe image_load_ok_data_url icon_url=' + fallbackUrl);
                        self.icon(fallbackDataUrl);
                        return;
                    }

                    var fallbackProbe = new Image();
                    fallbackProbe.onload = function() {
                        console.log('[GW_COOP] gwt_card icon_probe image_load_ok_fallback icon_url=' + fallbackUrl + ' width=' + fallbackProbe.naturalWidth + ' height=' + fallbackProbe.naturalHeight);
                        self.icon(fallbackUrl);
                    };
                    fallbackProbe.onerror = function() {
                        console.log('[GW_COOP] gwt_card icon_probe image_load_error_fallback icon_url=' + fallbackUrl);
                    };
                    fallbackProbe.src = fallbackUrl;
                }

                console.log('[GW_COOP] gwt_card icon_probe image_load_error icon_url=' + failedUrl);
            };
            probeImg.src = self.icon();
            self.iconPlaceholder(!self.icon() && (self.summary() || self.desc()));
            self.audio(card.audio && card.audio(data));
            self.visible((card.visible === true) || !!(card.visible && card.visible(data)));
        }
        loaded.resolve(card);
    };

    var loadToken = 0;
    ko.computed(function() {
        var data = self.params();
        ++loadToken;
        var myToken = loadToken;
        var cardId = self.id();
        if (cardId) {
            requireGW(['cards/' + cardId], function(card) {
                if (loadToken !== myToken)
                    return;
                loadCard(card, data);
            });
        }
        else
            loadCard({}, data);
    });
};
