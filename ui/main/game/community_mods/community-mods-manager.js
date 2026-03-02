// (C)COPYRIGHT 2016-2021 Planetary Annihilation Inc. All rights reserved.

// !LOCNS:community_mods


var cdnURL = gModsUrl;


var communityModManager = function () {
    var self = this;

    const MAX_ACTIVE_DOWNLAODS = window.navigator.platform.toLowerCase() == 'win32' ? 50 : 100;

    const MAX_RETRIES = 2;

    self.useServerModZip = true;

    self.modExcludes = ['com.pa.monty', 'com.pa.monty-client'];

    // lodash 4.x vs lodash 3.x

    self._keyBy = _.keyBy || _.indexBy;

    self._padStart = _.padStart || _.padLeft;

    self.usingTitans = api.content.usingTitans();
    self.usingClassic = !self.usingTitans;

    self.offlineMode = ko.observable(localStorage.community_mods_offline_mode);

    var DOWNLOAD_CONNECT_TIMEOUT = 10 * 1000;
    var DOWNLOAD_TIMEOUT = 30 * 1000;
    var DOWNLOAD_INITIAL_STATUS_TIMEOUT = 2 * 1000;
    var DOWNLOAD_STATUS_TIMEOUT = 0.5 * 1000;

    //var unitListFilename = '/pa/units/unit_list.json';

    var downloadRoot = '/download/';
    var clientModsRoot = '/client_mods/';
    var serverModsRoot = '/server_mods/';

    var validMountRoots = [clientModsRoot, serverModsRoot];

    var clientModIdentifier = 'community-mods-client';
    var serverModIdentifier = 'community-mods-server';
    //var unitsServerModIdentifier = 'community-mods-server-units';

    var clientModDisplayName = 'Community Mods Client';
    var serverModDisplayName = 'Community Mods Server';
    //var unitsServerModDisplayName = 'Community Mods Units';

    var uiModsList = '/ui/mods/ui_mod_list.js';
    var uiModsListForServer = '/ui/mods/ui_mod_list_for_server.js';

    var paUnitListURL = 'coui://pa/units/unit_list.json';
    var paLobbyUnitListURL = cdnURL + 'pa_ex1/units/unit_list.json';

    // zip

    var clientUImodListZipPath = '/' + clientModIdentifier + uiModsList;
    var clientUImodListForServerZipPath = '/' + clientModIdentifier + uiModsListForServer;
    var clientModInfoZipPath = '/' + clientModIdentifier + '/modinfo.json';

    var serverUImodListZipPath = '/' + serverModIdentifier + uiModsList;
    var serverModInfoZipPath = '/' + serverModIdentifier + '/modinfo.json';
    var serverModUnitListPath = '/' + serverModIdentifier + '/pa/units/unit_list.json';
    var serverModNewGamePath = '/' + serverModIdentifier + '/ui/mods/' + serverModIdentifier + '/new_game.js';
    var serverModNewGameURL = 'coui://ui/mods/' + serverModIdentifier + '/new_game.js';
    var serverModAIconfigPath = '/' + serverModIdentifier + 'pa/ai/ai_config.json';

    var clientModZipFilename = clientModIdentifier + '.zip';
    var serverModZipFilename = serverModIdentifier + '.zip';

    var clientResetModZipFilename = clientModIdentifier + '-reset.zip';
    var serverResetModZipFilename = serverModIdentifier + '-reset.zip';

    var clientModZipPath = downloadRoot + clientModZipFilename;
    var serverModZipPath = downloadRoot + serverModZipFilename;

    var clientModNewGamePath = '/' + clientModIdentifier + '/ui/mods/' + clientModIdentifier + '/new_game.js';
    var clientModNewGameURL = 'coui://ui/mods/' + clientModIdentifier + '/new_game.js';

    var clientModGWPlayURL = 'coui://download/community-mods-gw_play.js';

    var clientModLeaderboardURL = 'coui://download/community-mods-leaderboard.js';

    var clientModGameOverURL = 'coui://download/community-mods-game_over.js';

    var clientModLiveGameChatPath = '/' + clientModIdentifier + '/ui/mods/' + clientModIdentifier + '/live_game_chat.js';
    var clientModLiveGameChatURL = 'coui://ui/mods/' + clientModIdentifier + '/live_game_chat.js';

    var clientModLiveGamePath = '/' + clientModIdentifier + '/ui/mods/' + clientModIdentifier + '/live_game.js';
    var clientModLiveGameURL = 'coui://ui/mods/' + clientModIdentifier + '/live_game.js';

    var clientModReplayBrowserURL = 'coui://download/community-mods-replay_browser.js';

    var clientModSystemEditorURL = 'coui://download/community-mods-system_editor.js';

    // mounts

    var clientModPath = clientModsRoot + clientModIdentifier;

    //var clientUImodListPath = clientModPath + uiModsList;
    //var clientUImodListForServerPath = clientModPath + uiModsListForServer;

    var clientModsPath = clientModsRoot + 'mods.json';

    //var clientModInfoPath = clientModPath + '/modinfo.json';

    //

    var serverModPath = serverModsRoot + serverModIdentifier;

    //var serverUImodListPath = serverModPath + uiModsList;

    var serverModsPath = serverModsRoot + 'mods.json';

    //var serverModInfoPath = serverModPath + '/modinfo.json';

    var couiUImodListForServerPath = 'coui:/' + uiModsListForServer;

    // PAMM

    var pammClientModExcludeNew = clientModsRoot + 'com.pa.pamods.pamm/';
    var pammClientModExclude = clientModsRoot + 'PAMM/';
    var pammClientModExcludeOld = clientModsRoot + 'rPAMM/';
    var pammServerModExclude = serverModsRoot + 'com.pa.pamm.server/';

    // session keys

    //var communityModsStartedSessionKey = 'community_mods_started';

    // var cleanLocalStorageKeys =
    //     [
    //         'gOptimiseUserTagMap_backupId',
    //         'info.nanodesu.irc.height', 'info.nanodesu.irc.left', 'info.nanodesu.irc.top', 'info.nanodesu.irc.width',
    //         'gPatchServerBrowser_ServerHostname', 'gPatchServerBrowser_ServerPort', 'gPatchServerBrowser_lobbyId',
    //         'gPatchServerBrowser_local', 'gPatchServerBrowser_uberId',
    //         'gUnitSelector_creatorUberId', 'gUnitSelector_gameHostname', 'gUnitSelector_gamePort', 'gUnitSelector_lobbyId',
    //         'fr.mereth.pa.savefilters', 'uienhancements_serverbrowsersettings',
    //         'lastSelectedGame', 'available_mods', 'availableMods', 'installedMods'
    //     ];

    self.pammDetected = ko.observable(false).extend({ local: 'community_mods_pamm_detected' });

    self.recommendedModIdentifiers = ['com.pa.legion-expansion-server', 'com.pa.quitch.gwaioverhaul', 'com.pa.conundrum.cShareSystems', 'com.exodusesports.tournamentmappack', 'nl.pa.wpmarshall.wpmarshall_map_pack', 'com.pa.grandhomie.maps', 'com.pa.lula-mae.milkyway-skybox', 'pachat', 'com.pa.proeleert.hotbuild2', 'com.pa.trialq.tinfinitebuild'];

    if (self.usingTitans) {
        self.recommendedModIdentifiers.push('com.pa.domdom.laser_unit_effects');
    }else {
        self.recommendedModIdentifiers.push('com.pac.domdom.laser_unit_effects');
        // self.recommendedModIdentifiers.push( 'com.pa.mikeyh.classic-tutorial' );
    }


    // SHARED WITH SERVER

    self.wordsRegEx = /[^ ,.\/<>?;':"\[\]\{}|!@#$%^&*()_+\-=]+/g;

    // english only

    self.ignoreWords = ['all', 'am', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'by', 'can', 'etc', 'for', 'from', 'get', 'gives', 'had', 'have', 'he', 'if', 'in', 'into', 'is', 'it', "it's", 'its', "let's", 'lot', 'made', 'makes', 'may', 'much', 'my', 'no', 'not', 'of', 'on', 'only', 'or', 'so', 'see', 'that', 'the', 'their', 'they', 'this', 'through', 'to', 'up', 'very', 'which', 'while', 'with', "won't", 'you', "you'll", 'your'];

    self.authorsReplace = /(and|or)/g;
    self.authorsRegEx = /[^,;:]+/g;

    self.historicalScenesKeys = ['load_planet'];

    self.categoriesReplace =
    {
        'server': false,
        'client': false,
        'server-mod': false,
        'client-mod': false,
        'map': 'maps',
        'system': 'maps',
        'systems': 'maps',
        'planets': 'maps',
    };

    self.extractWords = function (text) {
        var words = _.words(text.toLowerCase(), self.wordsRegEx);

        _.remove(words, function (word) {
            return word.length == 1 || self.ignoreWords.indexOf(word) != -1;
        });

        return words;
    }

    // process raw mod data for file system mods

    self.processModinfo = function (mod) {
        if (!mod.identifier)
            return false;

        if (!mod.build)
            mod.build = 'Unknown';

        if (!mod.version)
            mod.version = '0.0.0';

        mod.searchable = [];

        if (mod.display_name)
            mod.searchable = mod.searchable.concat(self.extractWords(mod.display_name));
        else
            mod.display_name = mod.identifier;

        mod.sort = mod.display_name.toLowerCase();

        if (mod.description) {
            //             mod.searchable = mod.searchable.concat( self.extractWords( mod.description ) );
        }
        else
            mod.description = '';

        if (mod.category) {
            var keywords = {};

            _.forEach(mod.category, function (category) {
                category = category.toLowerCase();

                var replace = self.categoriesReplace[category];

                if (replace)
                    category = replace;

                if (category)
                    keywords[category] = true;
            });

            mod.searchable = _.union(mod.searchable, _.keys(keywords));

            delete mod.category;
        }

        if (mod.author) {
            var authors = mod.authors;

            if (!authors || authors.length == 0) {

                var authors = mod.author.replace(self.authorsReplace, ',');

                authors = _.words(authors, self.authorsRegEx);

                authors = _.map(authors, function (author) {
                    return _.trim(author);
                });

                mod.authors = authors;
            }
        }
        else
            mod.author = '';

        if (mod.authors) {
            if (mod.authors.length > 0) {
                mod.searchable = _.union(mod.searchable, _.map(authors, function (author) {
                    return author.toLowerCase();
                }));
            }
        }
        else
            mod.authors = [];

        if (!mod.forum)
            mod.forum = '';

        if (!mod.github)
            mod.github = '';

        if (!mod.icon)
            mod.icon = '';

        if (!mod.priority)
            mod.priority = 100;

        if (mod.date) {
            var date = new Date(mod.date);

            if (isNaN(date))
                mod.timestamp = 0;
            else {
                mod.date = date.getFullYear() + '-' + self._padStart(date.getMonth() + 1, 2, '0') + '-' + self._padStart(date.getDate(), 2, '0');
                mod.timestamp = date.getTime();
            }
        }
        else {
            mod.date = 'Unknown';
            mod.timestamp = 0;
        }

        if (!mod.dependencies || !_.isArray(mod.dependencies))
            mod.dependencies = [];

        if (!mod.companions || !_.isArray(mod.companions))
            mod.companions = [];

        var scenes = mod.scenes;

        if (!_.isObject(scenes))
            mod.scenes = scenes = {};

        _.forEach(self.historicalScenesKeys, function (key) {
            var urls = mod[key];

            if (urls && _.isArray(urls)) {
                var existing = scenes[key] || [];

                scenes[key] = _.union(existing, urls);

                delete mod[key];
            }
        });

        if (!_.has(mod, 'framework'))
            mod.framework = false;

        if (mod.product) {
            var products = _.map(mod.product, function (product) {
                return product.toLowerCase();
            });

            mod.searchable = _.union(mod.searchable, products);

            delete mod.product;
        }

        if (!_.has(mod, 'titansOnly'))
            mod.titansOnly = false;

        if (!_.has(mod, 'classicOnly'))
            mod.classicOnly = false;

        mod.classic = mod.classicOnly || (!mod.titansOnly && mod.searchable.indexOf('classic') != -1);
        mod.titans = mod.titansOnly || (!mod.classicOnly && mod.searchable.indexOf('titans') != -1);

        if (!mod.conflicts)
            mod.conflicts = {};

        // installed and enabled are checked in caller

        return mod;
    }

    self.unitExcludes =
    {
        '/pa/units/land/avatar_factory/avatar_factory.json': 'sandbox',
        '/pa/units/land/base_unit/base_unit.json': 'base',
        '/pa/units/air/base_flyer/base_flyer.json': 'base',
        '/pa/units/land/base_bot/base_bot.json': 'base',
        '/pa/units/land/base_structure/base_structure.json': 'base',
        '/pa/units/land/base_vehicle/base_vehicle.json': 'base',
        '/pa/units/orbital/base_orbital/base_orbital.json': 'base',
        '/pa/units/orbital/base_orbital_structure/base_orbital_structure.json': 'base',
        '/pa/units/sea/base_ship/base_ship.json': 'base',
        '/pa/units/land/bot_aa/bot_aa.json': 'unused',
        '/pa/units/land/bot_spider_adv/bot_spider_adv.json': 'unused',
        '/pa/units/orbital/orbital_carrier/orbital_carrier.json': 'unused'
    }

    self.unitPrefixExcludes =
    {
        '/pa/units/commanders/': 'tutorial'
    }

    self.unitMissingBuildBarImages =
    {
        '/pa/units/sea/sea_mine/sea_mine.json': '/pa/units/land/land_mine/land_mine_icon_buildbar.png'
    }

    self.titansUnitExcludes =
        [
            '/pa/units/orbital/deep_space_radar/deep_space_radar.json'
        ]

    self.unitTypeKeywords =
    {
        UNITTYPE_Titan: ['titan'],
        UNITTYPE_Nuke: ['nuke', 'missle'],
        UNITTYPE_NukeDefense: ['nuke', 'missile', 'anti-nuke'],
        UNITTYPE_Advanced: ['advanced'],
        UNITTYPE_Basic: ['basic'],
        UNITTYPE_Teleporter: ['teleporter'],
        UNITTYPE_Factory: ['factory'],
        UNITTYPE_Structure: ['structure'],
        UNITTYPE_Orbital: ['orbital'],
        UNITTYPE_LaserPlatform: ['laser', 'platform'],
        UNITTYPE_Land: ['land'],
        UNITTYPE_Air: ['air'],
        UNITTYPE_Naval: ['naval', 'sea'],
        UNITTYPE_Heavy: ['heavy'],
        UNITTYPE_Mobile: ['mobile'],
        UNITTYPE_Bot: ['bot'],
        UNITTYPE_Tank: ['tank'],
        UNITTYPE_Scout: ['scout', 'recon'],
        UNITTYPE_Fabber: ['fabber', 'builder'],
        UNITTYPE_Recon: ['recon', 'scout'],
        UNITTYPE_Offense: ['offense', 'attack'],
        UNITTYPE_Defense: ['defense', 'defence', 'defend'],
        UNITTYPE_MissileDefense: ['defense', 'defence', 'missle'],
        UNITTYPE_SurfaceDefense: ['defense', 'defence', 'defend'],
        UNITTYPE_Artillery: ['artillery'],
        UNITTYPE_Construction: ['construct', 'builder'],
        UNITTYPE_Economy: ['econonmy'],
        UNITTYPE_EnergyProduction: ['energy', 'economy'],
        UNITTYPE_MetalProduction: ['metal', 'economy'],
        UNITTYPE_SelfDestruct: ['destruct'],
        UNITTYPE_ControlModule: ['catalyst', 'laser', 'deathstar'],
        UNITTYPE_PlanetEngine: ['annihilation', 'planet', 'smash'],
        UNITTYPE_SupportCommander: ['support', 'commander'],
        UNITTYPE_Transport: ['transport'],
        UNITTYPE_Sub: ['sub'],
        UNITTYPE_Bomber: ['bomber'],
        UNITTYPE_CannonBuildable: ['cannon'],
    }

    self.processUnitSpec = function (unitSpec, unit, identifier) {
        var filename = _.last(unit.slice(0, -5).split('/'));

        var searchable = self.extractWords(filename);

        var displayName = unitSpec.infoDisplayName;

        if (!displayName) {
            console.error('no display name for ' + unit + ' ' + identifier);
            return false;
        }

        if (displayName.startsWith('!LOC:'))
            displayName = displayName.substr(5);

        var keywords = self.extractWords(displayName);

        searchable = searchable.concat(keywords);

        var description = unitSpec.infoDescription;

        if (description && description.startsWith('!LOC:'))
            description = description.substr(5);

        if (description) {
            description = description.replace(/(\w)- /, '$1 - ');

            var pos = description.indexOf(' - ');

            if (pos != -1) {
                var prefix = description.substr(0, pos);

                keywords = self.extractWords(prefix);

                searchable = searchable.concat(keywords);
            }
        }
        else
            console.error('no description for ' + unit + ' ' + identifier);

        var unitTypes = unitSpec.unit_types;

        var sort = 9999;

        if (unitTypes) {
            for (var i = 0; i < unitTypes.length; i++) {
                var unitType = unitTypes[i];

                keywords = self.unitTypeKeywords[unitType];

                if (keywords)
                    searchable = searchable.concat(keywords);
            }

            // TODO: fix this sorting crap

            var titan = unitTypes.indexOf('UNITTYPE_Titan') != -1;
            var nuke = unitTypes.indexOf('UNITTYPE_Nuke') != -1 || unitTypes.indexOf('UNITTYPE_NukeDefense') != -1;
            var advanced = unitTypes.indexOf('UNITTYPE_Advanced') != -1;
            var important = unitTypes.indexOf('UNITTYPE_Important') != -1;
            var teleporter = unitTypes.indexOf('UNITTYPE_Teleporter') != -1;
            var factory = unitTypes.indexOf('UNITTYPE_Factory') != -1;
            var structure = unitTypes.indexOf('UNITTYPE_Structure') != -1;
            var orbital = unitTypes.indexOf('UNITTYPE_Orbital') != -1;
            var land = unitTypes.indexOf('UNITTYPE_Land') != -1;
            var air = unitTypes.indexOf('UNITTYPE_Air') != -1;
            var naval = unitTypes.indexOf('UNITTYPE_Naval') != -1;
            var bot = unitTypes.indexOf('UNITTYPE_Bot') != -1;
            var tank = unitTypes.indexOf('UNITTYPE_Tank') != -1;
            var scout = unitTypes.indexOf('UNITTYPE_Scout') != -1;
            var fabber = unitTypes.indexOf('UNITTYPE_Fabber') != -1;
            var recon = unitTypes.indexOf('UNITTYPE_Recon') != -1;
            var offense = unitTypes.indexOf('UNITTYPE_Offense') != -1;
            var heavy = unitTypes.indexOf('UNITTYPE_Heavy') != -1;
            var bomber = unitTypes.indexOf('UNITTYPE_Bomber') != -1;
            var sub = unitTypes.indexOf('UNITTYPE_Sub') != -1;
            var defense = unitTypes.indexOf('UNITTYPE_Defense') != -1 || unitTypes.indexOf('UNITTYPE_AirDefense') != -1 || unitTypes.indexOf('UNITTYPE_MissileDefense') != -1;
            var artillery = unitTypes.indexOf('UNITTYPE_Artillery') != -1;
            var construction = unitTypes.indexOf('UNITTYPE_Construction') != -1;
            var economy = unitTypes.indexOf('UNITTYPE_Economy') != -1;
            var selfDestruct = unitTypes.indexOf('UNITTYPE_SelfDestruct') != -1;
            var controlModule = unitTypes.indexOf('UNITTYPE_ControlModule') != -1;
            var planetEngine = unitTypes.indexOf('UNITTYPE_PlanetEngine') != -1;
            var supportCommander = unitTypes.indexOf('UNITTYPE_SupportCommander') != -1;
            var transport = unitTypes.indexOf('UNITTYPE_Transport') != -1;

            if (titan)
                sort = 100;
            else if (nuke || controlModule || planetEngine)
                sort = 200;
            else if (selfDestruct && advanced)
                sort = 300;
            else if (artillery && advanced && !naval)
                sort = 400;
            else if (advanced)
                sort = 500;
            else if (important)
                sort = 600;
            else if (teleporter)
                sort = 700;
            else if (recon)
                sort = 800;
            else if (structure)
                sort = 900;
            else if (economy)
                sort = 1000;

            if (factory)
                sort = sort + 50;

            if (orbital)
                sort = sort + 10;
            else if (air)
                sort = sort + 20;
            else if (land && tank)
                sort = sort + 30;
            else if (land && bot)
                sort = sort + 40;
            else if (naval)
                sort = sort + 50;

            if (supportCommander)
                ;
            else if (offense && !defense && !heavy && !bomber && !sub && !construction && !scout)
                sort = sort + 1;
            else if (offense && !defense && !sub && !construction && !scout)
                sort = sort + 2;
            else if (artillery)
                sort = sort + 3;
            else if (defense)
                sort = sort + 4;
            else if (sub)
                sort = sort + 5;
            else if (transport || scout || recon)
                sort = sort + 6;
            else if (construction)
                sort = sort + 7;
            else if (fabber)
                sort = sort + 8;
            else if (economy)
                sort = sort + 9;
        }
        else
            console.error('no unit_types for ' + unit + ' ' + identifier);

        searchable = _.uniq(searchable);

        var info = {};

        if (!identifier) {
            info = _.clone(unitSpec);
        }
        else {
            info.unit = unit;
            info.shadow = false;
            info.modIdentifier = false;
        }

        info.infoDisplayName = displayName;
        info.infoDescription = description;
        info.infoUnitTypes = unitTypes;
        info.sort = sort;
        info.searchable = searchable;

        return info;
    }

    // END SHARED WITH SERVER

    self.loadLocalUnitList = function () {
        var url = window.paLobby ? paLobbyUnitListURL : paUnitListURL;

        var deferred = $.getJSON(url).done(function (unitList) {
            if (unitList && unitList.units) {
                var units = unitList.units;

                self.units(units);
            }
        });

        return deferred;
    }

    self.loadUnitsInfo = function () {
        debuglog('loading units info');

        var deferred = $.Deferred();

        var localDeferred = self.loadLocalUnitList();

        self.unitsInfo.ready.always(function (unitsInfo) {
            debuglog('units info DB ready');

            var finished = function () {
                if (self.usingClassic) {
                    var unitsInfo = self.unitsInfo();

                    _.forEach(unitsInfo, function (unitInfo) {
                        var buildBarImageURL = unitInfo.buildBarImageURL;

                        if (unitInfo.titans && !unitInfo.classic) {

                            if (buildBarImageURL.startsWith('coui://pa_ex1'))
                                buildBarImageURL = buildBarImageURL.substr(6);
                            else if (buildBarImageURL.startsWith('coui://pa'))
                                buildBarImageURL = '/pa_ex1' + buildBarImageURL.substr(9);
                            else if (buildBarImageURL.startsWith(cdnURL))
                                buildBarImageURL = buildBarImageURL.substr(cdnURL.length);

                            if (api.content.ownsTitans())
                                buildBarImageURL = 'coui:/' + buildBarImageURL;
                            else
                                buildBarImageURL = cdnURL + buildBarImageURL;

                            unitInfo.buildBarImageURL = buildBarImageURL
                        }
                    });

                    self.unitsInfo.valueHasMutated();
                }

                localDeferred.always(function () {
                    deferred.resolve();
                });
            }

            if (!unitsInfo)
                self.unitsInfo({});

            if (self.offlineMode()) {
                finished();
                return;
            }

            var url = gModsUrl + 'community-mods/units';


            $.getJSON(url).done(function (unitsInfoData) {
                if (unitsInfoData) {
                    self.unitsInfo(unitsInfoData);

                    finished();
                    debuglog("units updated, finish called");
                }
                else {
                    debuglog('loadUnitsInfo empty');
                    finished();
                }

            }).fail(function () {
                debuglog('loadUnitsInfo failed');
                finished();
            });
        });

        return deferred;
    }

    self.loadModUnitSpec = function (unit, identifier, installedPath) {
        var deferred = $.Deferred();

        var unitRelativePath = unit.startsWith('/') ? unit.substr(1) : unit;

        unitSpecURL = 'spec:/' + installedPath + unitRelativePath;

        // for performance only a shallow check of file system mods ignoring base spec... may improve at some point in future

        $.getJSON(unitSpecURL).done(function (unitSpec) {
            deferred.resolve(unitSpec);

        }).fail(function (modUnitSpecError) {
            console.error('missing unit spec ' + unit + ' for ' + identifier);

            deferred.reject(false);
        });

        return deferred;
    }

    self.loadModUnitInfo = function (unit, identifier, installedPath) {

        var deferred = $.Deferred();

        self.loadModUnitSpec(unit, identifier, installedPath, {}).always(function (unitSpec) {
            var unitInfo;

            if (!unitSpec) {
                unitInfo =
                {
                    unit: unit,
                    shadow: false,
                    modIdentifier: identifier,
                    infoDisplayName: unit,
                    infoDescription: '',
                    buildBarImageURL: false,
                    sort: 0,
                    searchable: []
                }
            }
            else {
                unitSpec.modIdentifier = identifier;
                unitSpec.infoDisplayName = unitSpec.display_name;
                unitSpec.infoDescription = unitSpec.description;
                unitSpec.infoUnitTypes = unitSpec.unit_types;

                unitInfo = self.processUnitSpec(unitSpec, unit, identifier);

                unitInfo.buildBarImageURL = 'coui:/' + installedPath + unit.slice(0, -5) + '_icon_buildbar.png';
            }

            unitInfo.classic = false;
            unitInfo.titans = false;

            deferred.resolve(unitInfo);
        });

        return deferred;
    }

    self.loadUnitListInfo = function (units, identifier, installedPath) {
        var deferred = $.Deferred();

        self.unitsInfo.ready.always(function (defaultUnitsInfo) {

            var unitExcludes = self.unitExcludes;

            var unitPrefixExcludes = self.unitPrefixExcludes;

            var unitListInfo = {};

            var requests = {}

            var checkFinished = function () {
                if (_.size(requests) == 0)
                    deferred.resolve(unitListInfo);
            }

            for (var i = 0; i < units.length; i++) {
                var unit = units[i];

                if (unitExcludes[unit])
                    continue;

                var exclude = false;

                for (var prefix in unitPrefixExcludes) {
                    exclude = unit.startsWith(prefix);

                    if (exclude)
                        break;
                }

                if (exclude)
                    continue;

                // for performance if it's a default unit we just use that info for file system mods

                var unitInfo = defaultUnitsInfo[unit];

                if (unitInfo)
                    unitListInfo[unit] = unitInfo;
                else {
                    var request = self.loadModUnitInfo(unit, identifier, installedPath);

                    requests[unit] = request;

                    request.always(function (info) {
                        unitListInfo[info.unit] = info;

                        delete requests[info.unit];

                        checkFinished();
                    });
                }
            }

            // check finished here just in case there were no requests

            checkFinished();
        });

        return deferred;
    }

    self.downloadFailures = ko.observableArray([]).extend({ local: 'mod_download_failures' });

    self.downloads = ko.observableArray([]);

    self.realDownloads = ko.computed(function () {
        return _.filter(self.downloads(), function (download) {
            return !download.isDataURL;
        });
    });

    self.activeDownloadsCount = ko.computed(function () {
        return _.filter(self.downloads(), function (download) {
            return download.started;
        }).length;
    });

    self.inactiveDownloads = ko.computed(function () {
        return _.filter(self.downloads(), function (download) {
            return !download.started;
        });
    });

    self.hasDownloads = ko.computed(function () {
        return self.realDownloads().length > 0;
    });

    self.downloadsIndex = ko.computed(function () {
        return self._keyBy(self.downloads(), 'file');
    });

    self.downloadsTotal = ko.observable(0);
    self.downloadsProgress = ko.observable(0);
    self.downloadsPercent = ko.observable(0);
    self.downloadsStatus = ko.observableArray();

    self.busy2 = ko.observable(true);

    self.busy = ko.computed(function () {
        return self.hasDownloads() || self.busy2();
    });

    self.downloadComplete = function (download) {
        download.active = false;

        _.remove(self.downloads(), { file: download.file });

        self.downloads.valueHasMutated();

        if (download.mod)
            download.mod.downloaded = download.timestamp;

        if (download.mount) {
            self.mountZipMod(download.mod, true).then(function (mod) {
                download.deferred.resolve(download);
            });
        }
        else
            download.deferred.resolve(download);

        self.checkDownloadsQueue();
    }

    self.downloadFailed = function (download) {
        console.error('download failed for ' + (download.isDataURL ? 'data' : download.url) + ' to ' + download.file + ' after ' + (Date.now() - download.started) / 1000 + ' seconds');

        download.active = false;

        var downloadFailure = _.omit(download, ['deferred']);

        self.downloadFailures.push(downloadFailure);

        _.remove(self.downloads(), { file: download.file });

        self.downloads.valueHasMutated();

        download.deferred.reject(download);

        self.checkDownloadsQueue();
    }

    self.setDownloadTimeout = function (download, timeout) {
        download.timeout = setTimeout(function () {
            console.error('download timeout for ' + (download.isDataURL ? 'data' : download.url) + ' to ' + download.file + ' after ' + (Date.now() - download.started) / 1000 + ' seconds');
            api.download.cancel(download.file);
            self.onDownload({ file: download.file, state: 'timeout' });
        }, timeout);
    }

    self.setDownloadProgressTimeout = function (download, timeout) {
        if (download.progressTimeout)
            clearTimeout(download.progressTimeout);

        download.progressTimeout = setTimeout(function () {
            if (api.download.progress)
                api.download.progress(download.file).always(function (status) {
                    self.onDownload(status);
                });
            else
                api.download.status(download.file).always(function (status) {
                    self.onDownload(status);
                });
        }, timeout);
    }

    self.onDownload = function (status) {
        var download = self.downloadsIndex()[status.file];

        var size = status.size;

        var expected = status.expected ? status.expected : size;

        // not ours ???

        if (!download) {
            console.log(status.file + ' ' + status.state + ' ' + status.progress + ' / ' + expected);
            return;
        }

        console.log(status.file + ' ' + status.state + ' ' + status.progress + ' / ' + expected);

        var state = status.state;

        // ignore activated

        if (state == 'activated')
            return;

        if (download.timeout) {
            clearTimeout(download.timeout);
            download.timeout = false;
        }

        if (download.progressTimeout) {
            clearTimeout(download.progressTimeout);
            download.progressTimeout = false;
        }

        var progress = status.progress;

        if (expected && progress && progress > expected) {
            console.error('invalid download progress for ' + status.file);
            /*
                        if ( state == 'downloading' )
                        {
                            state = 'failed';
                        }
            */
        }
        else {
            download.progress = progress;
        }

        if (expected)
            download.size = expected;

        download.state = state;

        download.percent = download.size ? Math.floor(download.progress / download.size * 100) / 100 : 0;

        switch (state) {

            case 'complete':

                debuglog('download ' + download.file + ' completed in ' + (Date.now() - download.started) / 1000 + ' seconds');

            case 'ok':

                download.timestamp = status.timestamp;
                download.md5 = status.md5;

                self.downloadComplete(download);

                break;

            case 'timeout':
            case 'failed':

                if (download.retries >= MAX_RETRIES) {
                    self.downloadFailed(download);
                    return;

                }

                download.retries++;

                console.error('retry #' + download.retries + ' for download ' + (download.url.startsWith('data:') ? 'data' : download.url) + ' to ' + download.file);

                download.state = 'retrying';
                download.progress = 0;

                _.defer(function () {
                    api.download.start(download.url, download.file);
                });

            // no break intended

            case 'downloading':

            // no break intended

            default:

                self.setDownloadTimeout(download, DOWNLOAD_TIMEOUT);

                if (!download.isDataURL) {
                    self.setDownloadProgressTimeout(download, DOWNLOAD_STATUS_TIMEOUT);
                }
        }

        self.downloads.valueHasMutated();
    }

    const modDisables =
        [
            'com.pa.mikeyh.gfactorycanbuildfix',
            'com.pa.mikeyh.gsystemeditorfixes',
            'com.pa.mikeyh.goptimiseusertagmap',
            'com.pa.mikeyh.gunitselector',
            'com.pa.mikeyh.gfasterserverbrowser',
            'com.pa.mikeyh.ggameinvites',
            'com.pa.mikeyh.ggameinvites.client',
            'com.pa.mikeyh.gspectatorchat',
            'com.pa.mikeyh.gchatpromoter',
            'com.pa.mikeyh.gbackspacefix',
            'com.pa.mikeyh.gdisplayrank.client',
            'com.pa.mikeyh.greadyup.client',
            'com.pa.mikeyh.gspectatorcastermode',
            'com.pa.raevn.rmodslist',
            'fr.mereth.pa.savefilters',
            'fr.mereth.pa.twentyfour',
            'fr.mereth.pa.mereth.replay',
            'fr.mereth.pa.startingplanet',
            'com.uberent.pa.mods.stockmods.server.navalredux',
            'com.warren.pa.superlandmines',
            'com.warren.pa.locate_commander',
            'com.pa.warren.strawberry',
            'info.nanodesu.customplanetorigin',
            'com.glassgaming.energypattern',
            'igndox',
            'info.nanodesu.pastats.server.client',
            'info.nanodesu.pastats.server.server',
            'info.nanodesu.pastats',
            'info.nanodesu.pastats.proxy',
            'com.pa.quitch.qaimodcompatibilitypersonalitiespatch',
            'com.pa.n30n.noslash',
            'com.flubbateios.clickylinks',
            'com.flubb.clickylinks',
            'com.pa.someonewhoisnobody.ingamebrowser',
            'com.pa.chat',
            'copyliu.connectlan',
            'com.pa.carn1x.4k-gui-scale',
            'com.wondible.pa.sim_speed',
            'uk.pa.tetccbm',
            'com.pa.quitch.qbotattackfix',
            'com.pa.mikeyh.balance-changes',
            'com.pa.gtc.gw_extended_system_moves',
            'com.pa.mikeyh.gw-explorer',
            'community-chat',
            'com.pa.mikeyh.gdisplayrank',
            // 'com.pa.mikeyh.display-ranks',
            'com.pa.mikeyh.public-local-server',
            // 'com.pa.mikeyh.meteors-client',
            // 'com.pa.mikeyh.meteors-server',
            // 'com.pa.mikeyh.auto-name',
            'com.pa.mikeyh.gautoname',
            // 'com.pa.mikeyh.auto-start-game',
            'com.pa.mikeyh.gautostartgame',
            // 'com.pa.mikeyh.second-pip',
            'om.pa.mikeyh.gsecondpip',
            // 'com.pa.mikeyh.ready-up',
            'com.pa.mikeyh.greadyUp',
            // 'com.pa.mikeyh.lobby-system-preview',
            // 'com.pa.mikeyh.lobby-system-preview-client',
            'com.pa.mikeyh.globbysystempreview',
            'com.pa.mikeyh.globbysystempreview.client',
            // 'com.pa.mikeyh.who-deleted-that',
            'com.pa.mikeyh.gwhodeletedthat',
            // 'com.pa.mikeyh.strip-mining',
            // 'com.pa.mikeyh.strip-mining-classic',
            'com.pa.mikeyh.gstripmining',
            'com.pa.mikeyh.gstripmining-classic',
            // 'com.pa.mikeyh.classic-tutorial',
            'com.s03g.overlordeco',
            'info.nanodesu.covertheline',
            'com.pa.quitch.qlobrangefix',
            'com.pa.quitch.translationframework',
            'com.pa.dissonant.subfactions',
            'com.pa.dissonant.subfactions-client',
            'com.pa.quitch.qbalance',
            'ClassicWater',
            'com.wondible.pa.no_default_system',
            'com.pa.quitch.AIBugfixEnhancement'
        ];

    // calculate multiple values once via subscribe vs computed

    self.realDownloads.subscribe(function (downloads) {

        var total = 0;
        var progress = 0;

        _.forEach(downloads, function (download) {
            if (download.size) {
                total = total + download.size;
            }

            if (download.progress) {
                progress = progress + download.progress;
            }
        });

        var percent = total ? Math.floor(progress / total * 100) / 100 : 0;

        self.downloadsTotal(total);
        self.downloadsProgress(progress);
        self.downloadsPercent(percent);

        var status = _.map(downloads, function (download) {
            var summary = _.pick(download, ['url', 'file', 'progress', 'size', 'percent', 'retries']);

            summary.contribution = total ? download.size / total : 0;

            return summary;
        });

        self.downloadsStatus(status);
    });

    self.checkDownloadsQueue = function () {
        if (self.activeDownloadsCount() >= MAX_ACTIVE_DOWNLAODS)
            return;

        var download = self.inactiveDownloads().pop();

        if (!download)
            return;

        download.started = Date.now();
        download.active = true;

        self.setDownloadTimeout(download, DOWNLOAD_CONNECT_TIMEOUT);

        if (!download.isDataURL) {
            self.setDownloadProgressTimeout(download, DOWNLOAD_INITIAL_STATUS_TIMEOUT);
        }

        api.download.start(download.url, download.file);
    }

    self.download = function (download) {
        var url = download.url;

        var file = download.file;
        var md5 = download.md5;

        debuglog('download ' + file + ' with md5: ' + md5 + ' from ' + (url.startsWith('data:') ? 'data' : url));

        var existing = self.downloadsIndex()[file];

        if (existing) {
            return existing.deferred;
        }

        var deferred = $.Deferred();

        download.isDataURL = url.substr(0, 5) == 'data:';

        download.retries = 0;
        download.progress = 0;
        download.size = download.isDataURL ? _.size(url) : 0;
        download.percent = 0;

        download.state = 'starting';
        download.deferred = deferred;

        var statusDeferred = $.Deferred();

        if (md5) {
            api.download.status(file).always(function (status) {
                var downloaded = status && status.state == 'complete' && status.md5 == md5;

                if (downloaded) {

                    debuglog(file + ' up to date');

                    download.state = 'ok';
                    download.size = status.size;
                    download.percent = 1;
                    download.progress = status.size;

                    download.timestamp = status.timestamp;

                    self.downloadComplete(download);

                    return;
                }

                statusDeferred.reject();
            });
        }
        else {
            statusDeferred.reject();
        }

        statusDeferred.done(function (status) {
            deferred.resolve(download);

        }).fail(function (result) {

            // needs download

            self.downloads.push(download);

            self.checkDownloadsQueue();
        });

        return deferred;
    }

    self.downloadMany = function (downloads) {
        debuglog('downloadMany ' + downloads.length);

        var deferred = $.Deferred();

        var queue = [];

        _.forEach(downloads, function (download) {
            queue.push(self.download(download));
        });

        $.when.apply($, queue).always(function () {
            deferred.resolve(arguments);
        })

        return deferred;
    }

    // units

    self.units = ko.observableArray([]).extend({ local: 'community_mods_units' });

    self.unitsMap = ko.computed(function () {
        var map = self._keyBy(self.units());

        return map;
    });

    self.unitsInfo = ko.observable({}).extend({ db: { local_name: 'communityModsUnitsInfoDB', 'db_name': 'community_mods_units_info' } });

    self.unitList = ko.computed(function () {
        var unitList =
        {
            info: self.unitsInfo(),
            units: self.units()
        }

        return unitList;
    });

    // available mods

    self.availableMods = ko.observableArray().extend({ db: { local_name: 'availableModsDB', 'db_name': 'available_mods' } });

    self.availableModsIndex = ko.computed(function () {
        return self._keyBy(self.availableMods(), 'identifier');
    });

    // installed mods

    // installed mods are handled separately from available mods as they may include file system mods or zip mods no longer available

    self.localInstalledMods = ko.observable(undefined).extend({ local: 'installed_mods' });

    self.installedMods = ko.observableArray([]).extend({ db: { local_name: 'installedModsDB', 'db_name': 'installed_mods' } });

    self.checkInstalledMods = function () {
        debuglog('checking installed mods');

        self.ready().always(function () {
            var installedMods = self.installedMods();

            var localInstalledMods = self.localInstalledMods();

            if (localInstalledMods) {
                debuglog('installed mods migrated from local storage to indexed DB');
                installedMods = localInstalledMods;
                self.installedMods(installedMods);
                delete localStorage.installed_mods;
            }

            if (!installedMods) {
                installedMods = [];
                self.installedMods(installedMods);
            }
        });

        return self.installedMods.ready;
    }

    // databases

    self.ready = function () {
        var deferred = $.Deferred();

        $.when(self.availableMods.ready, self.installedMods.ready, self.unitsInfo.ready).always(function () {
            // allow ko computeds to run

            _.defer(function () {
                console.log('community mods ready');
                deferred.resolve();
            });
        });

        return deferred;
    }
    //
    self.installedFileSystemMods = ko.computed(function (mod) {
        return _.filter(self.installedMods(), function (mod) {

            return !!mod.fileSystem;
        });
    });

    self.installedModsIndex = ko.computed(function () {
        return self._keyBy(self.installedMods(), 'identifier');
    });

    // installed zip mods

    self.installedZipMods = ko.computed(function (mod) {
        return _.filter(self.installedMods(), function (mod) {
            return !mod.fileSystem;
        });
    });

    self.installedZipModsIndex = ko.computed(function () {
        return self._keyBy(self.installedZipMods(), 'identifier');
    });

    // installed client zip mods

    self.installedClientZipMods = ko.computed(function (mod) {
        return _.filter(self.installedZipMods(), function (mod) {
            return mod.context == 'client';
        });
    });

    self.installedClientZipModsIndex = ko.computed(function () {
        return self._keyBy(self.installedClientZipMods(), 'identifier');
    });

    // installed server zip mods

    self.installedServerZipMods = ko.computed(function (mod) {
        return _.filter(self.installedZipMods(), function (mod) {
            return mod.context == 'server';
        });
    });

    self.installedServerZipModsIndex = ko.computed(function () {
        return self._keyBy(self.installedServerZipMods(), 'identifier');
    });

    // active mods

    self.activeMods = ko.computed(function () {
        if (window.gNoMods)
            return [];

        var mods = _.filter(self.installedMods(), function (mod) {
            return mod.enabled;
        });

        return mods;
    })

    // active zip mods

    self.activeZipMods = ko.computed(function () {
        var mods = _.filter(self.activeMods(), function (mod) {
            return !mod.fileSystem;
        });

        return mods;
    })

    // active client mods

    self.activeInstalledClientMods = ko.computed(function () {
        var mods = _.filter(self.activeMods(), function (mod) {
            return mod.context == 'client';
        });

        mods = _.sortBy(mods, 'priority');

        return mods;
    })

    self.activeInstalledClientModsIndex = ko.computed(function () {
        return self._keyBy(self.activeInstalledClientMods(), 'identifier');
    })

    // companion mods

    self.companionModIdentifiers = ko.observableArray([]);

    self.companionMods = ko.computed(function () {

        if (window.gNoMods)
            return [];

        var installedModsIndex = self.installedModsIndex();
        var availableModsIndex = self.availableModsIndex();

        var identifiers = [];
        var missingServerMods = [];

        _.forEach(self.companionModIdentifiers(), function (identifier) {
            if (identifier == 'community-mods-server')
                return true;

            var mod = installedModsIndex[identifier];

            if (!mod)
                mod = availableModsIndex[identifier];

            if (mod) {
                if (mod.companions)
                    identifiers = _.union(identifiers, mod.companions);
            }
            else {
                console.error(identifier + ' server mod not found');
                missingServerMods.push(identifier);
            }
        });

        identifiers = _.difference(identifiers, _.keys(self.activeInstalledClientModsIndex()));

        var missingCompanions = [];
        var companionMods = [];

        _.forEach(identifiers, function (identifier) {
            var mod = installedModsIndex[identifier];

            if (!mod)
                mod = availableModsIndex[identifier];

            if (mod)
                companionMods.push(mod);
            else {
                console.error(identifier + ' companion mod not found');
                missingCompanions.push(identifier);
            }
        });

        return companionMods;
    });

    self.activeClientMods = ko.computed(function () {
        var mods = self.activeInstalledClientMods().concat(self.companionMods());

        mods = _.sortBy(mods, 'priority');

        return mods;
    })

    self.activeClientModIdentifiers = ko.computed(function () {
        var mods = _.map(self.activeClientMods(), function (mod) {
            return mod.identifier;
        });

        return mods;

    });

    self.activeClientModsJson = ko.computed(function () {
        var mods = _.map(self.activeClientMods(), function (mod) {
            return mod.identifier;
        });

        if (mods.length > 0) {
            mods.unshift(clientModIdentifier);
        }

        return JSON.stringify(
            {
                mount_order: mods
            });
    });

    self.activeClientModScenes = ko.computed(function () {
        var scenes = {};

        _.forEach(self.activeClientMods(), function (mod) {
            if (mod.scenes) {
                _.forEach(mod.scenes, function (urls, scene) {
                    var existing = scenes[scene] || [];

                    scenes[scene] = _.union(existing, urls);

                });
            }
        });

        var new_game = scenes.new_game;

        if (!new_game)
            new_game = scenes.new_game = [];

        new_game.push(clientModNewGameURL);


        var leaderboard = scenes.leaderboard;

        if (!leaderboard)
            leaderboard = scenes.leaderboard = [];

        leaderboard.push(clientModLeaderboardURL);


        var gw_play = scenes.gw_play;

        if (!gw_play)
            gw_play = scenes.gw_play = [];

        gw_play.push(clientModGWPlayURL);

        var game_over = scenes.game_over;

        if (!game_over)
            game_over = scenes.game_over = [];

        game_over.push(clientModGameOverURL);

        var live_game_chat = scenes.live_game_chat;

        if (!live_game_chat)
            live_game_chat = scenes.live_game_chat = [];

        live_game_chat.push(clientModLiveGameChatURL);

        var live_game = scenes.live_game;

        if (!live_game)
            live_game = scenes.live_game = [];

        live_game.push(clientModLiveGameURL);

        var replay_browser = scenes.replay_browser;

        if (!replay_browser)
            replay_browser = scenes.replay_browser = [];

        replay_browser.push(clientModReplayBrowserURL);

        var system_editor = scenes.system_editor;

        if (!system_editor)
            system_editor = scenes.system_editor = [];

        system_editor.push(clientModSystemEditorURL);

        return scenes;
    });

    self.activeClientModsUImodList = ko.computed(function () {
        var scenes = self.activeClientModScenes();

        var js = 'var global_mod_list = ' + JSON.stringify(scenes.global_mod_list || [], null, 4) + ';\n'

        js = js + 'var scene_mod_list = ' + JSON.stringify(_.omit(scenes, 'global_mod_list'), null, 4) + ';\n'

        return js;
    });

    // active client zip mods

    self.activeClientZipMods = ko.computed(function () {
        var mods = _.filter(self.activeClientMods(), function (mod) {
            return !mod.fileSystem;
        });

        mods = _.sortBy(mods, 'priority');

        return mods;

    })

    //

    function tester(modinfo) {
        return modDisables.indexOf(modinfo.identifier) == -1 && !(new RegExp(atob('KGluc29tbmlhfGNvc21pY3dhcnwucm9iby58ZmFnb3Qp'), 'gi')).test(modinfo.identifier) && !(new RegExp(atob('KGljeWNhbG18cm9ib21vb3xjYWxteWljZXxob2JvbW9vKQ=='), 'gi')).test(modinfo.author) && !(new RegExp(atob('KGluc29tbmlhfGNvc21pY3dhcik='), 'gi')).test(modinfo.display_name) && !(new RegExp(atob('KGluc29tbmlhfGNvc21pY3dhcik='), 'gi')).test(modinfo.description) && !(new RegExp(atob('KGluc29tbmlhfGNvc21pY3dhcik='), 'gi')).test(modinfo.icon);
    }

    // uberbar

    self.uberbarTimestamp = ko.observable(0).extend({ session: 'uberbar_timestamp' });

    self.uberbarModsTimestamp = ko.computed(function () {
        var timestamp = 0;

        _.forEach(self.activeClientMods(), function (mod) {
            if (mod.scenes && mod.scenes.uberbar)
                timestamp = Math.max(timestamp, mod.installed || 0, mod.downloaded || 0);
        });

        if (!sessionStorage.uberbar_timestamp)
            self.uberbarTimestamp(timestamp);

        return timestamp;
    });

    self.uberbarNeedsReloading = ko.computed(function () {
        var timestamp = self.uberbarModsTimestamp();
        var reloaded = self.uberbarTimestamp();

        return timestamp > reloaded || (reloaded && !timestamp);
    });

    self.updateInstalledMods = function () {
        var installedMods = _.filter(self.installedMods(), function (modinfo) {
            return tester(modinfo);
        });

        self.installedMods(installedMods);
    }

    self.check = self.updateInstalledMods;

    self.checkUberbar = function (reload) {
        debuglog('checkUberbar');
        try {
            if (self.uberbarNeedsReloading()) {
                if (reload) {
                    debuglog('RELOADING UBERBAR');

                    api.game.debug.reloadScene(3);
                }
            }
            self.uberbarTimestamp(self.uberbarModsTimestamp());
        }
        catch (e) {
            console.log(e.stack || e);
        }
    }

    // server mods

    self.mergeUnitServerMods = ko.observable(true).extend({ local: 'community_mods_force_merge_unit_server_mods' });

    self.disabledUnits = ko.observable({}).extend({ local: 'community_mods_disabled_units' });

    // active server mods

    self.requiredServerMods = ko.observableArray([]);

    self.checkRequiredServerMods = function (server) {
        var mods = [];

        if (server == '66.70.181.156') {
            var mod = self.installedServerZipModsIndex()['com.pa.mikeyh.meteors-server'];

            if (mod) {
                mod = _.clone(mod);
                mod.enabled = true;
                mods.push(mod);
            }
        }

        self.requiredServerMods(mods);

        if (mods.length == 0)
            return $.Deferred().resolve();

        return self.downloadServerZipMod();
    }

    self.activeServerMods = ko.computed(function () {
        var mods = _.filter(self.activeMods(), function (mod) {
            return mod.context == 'server';
        });

        var requiredServerMods = self.requiredServerMods();

        if (requiredServerMods.length > 0)
            mods = mods.concat(requiredServerMods);

        mods = _.sortByOrder(mods, 'priority', 'desc');

        return mods;

    });

    self.activeServerModIdentifiers = ko.computed(function () {
        var mods = _.map(self.activeServerMods(), function (mod) {
            return mod.identifier;
        });

        return mods;

    });

    // unit server mods

    self.activeUnitServerMods = ko.computed(function () {
        return _.filter(self.activeServerMods(), function (mod) {
            return !!mod.unitList;
        });
    });

    self.activeUnitServerModUnitList = ko.computed(function () {
        var activeUnitServerMods = self.activeUnitServerMods();

        if (!activeUnitServerMods || activeUnitServerMods.length == 0)
            return false;

        var result =
        {
            units: [],
            info: {}
        }

        if (self.mergeUnitServerMods()) {
            _.forEach(activeUnitServerMods, function (mod) {
                if (mod.unitList.units) {
                    result.units = _.union(result.units, mod.unitList.units);
                    result.info = _.assign(result.info, mod.unitList.info);
                }
            });
        }
        else {
            var mod = _.first(activeUnitServerMods);

            result.units = mod.unitList.units;
            result.info = mod.unitList.info || {};

        }

        return result;
    });

    self.activeUnitServerModsCount = ko.computed(function () {
        return self.activeUnitServerMods().length;
    });

    self.hasMultipleUnitServerMods = ko.computed(function () {
        return self.activeUnitServerModsCount() > 1;
    });

    self.needsUnitsServerMods = ko.computed(function () {
        return self.hasMultipleUnitServerMods() && self.mergeUnitServerMods();
    });

    // units

    self.disableUnit = function (unit) {
        var disabledUnits = self.disabledUnits();

        if (disabledUnits && !disabledUnits[unit]) {
            self.disabledUnits()[unit] = true;
            self.disabledUnits.valueHasMutated();
            return true;
        }

        return false;
    }

    self.enableUnit = function (unit) {
        var disabledUnits = self.disabledUnits();

        if (disabledUnits && disabledUnits[unit]) {
            delete self.disabledUnits()[unit];
            self.disabledUnits.valueHasMutated();
            return true;
        }

        return false;
    }

    self.enableAllUnits = function (unit) {
        self.disabledUnits({});
    }

    self.unitsMatching = function (types) {
        var unitList = self.activeUnitList();

        if (!types || !unitList)
            return [];

        var info = unitList.info;

        var units = [];

        var length = types.length;

        _.forEach(info, function (unit) {
            if (_.intersection(unit.searchable, types).length == length)
                units.push(unit.unit);
        });

        return units;
    }

    self.disableUnitsMatching = function (types) {
        var units = self.unitsMatching(types);

        if (units.length == 0)
            return units;

        var changed = false;

        var disabledUnits = self.disabledUnits();

        _.forEach(units, function (unit) {
            if (!disabledUnits[unit]) {
                disabledUnits[unit] = true;
                changed = true;
            }
        });

        if (changed)
            self.disabledUnits.valueHasMutated();

        return units;
    }

    self.enableUnitsMatching = function (types) {
        var units = self.unitsMatching(types);

        if (units.length == 0)
            return units;

        var changed = false;

        var disabledUnits = self.disabledUnits();

        _.forEach(units, function (unit) {
            if (disabledUnits[unit]) {
                delete disabledUnits[unit];
                changed = true;
            }
        });

        if (changed)
            disabledUnits.valueHasMutated();

        return units;
    }

    self.activeUnitList = ko.computed(function () {
        var unitList = self.activeUnitServerModUnitList();

        if (!unitList || !unitList.units || unitList.units.length == 0)
            unitList = self.unitList();

        return unitList;
    });

    self.unitsUnitList = ko.computed(function () {
        var disabledUnits = self.disabledUnits();

        var activeUnitList = self.activeUnitList();

        var info = activeUnitList.info;

        var activeDisabledUnits = [];

        var activeUnits = _.filter(activeUnitList.units, function (unit) {
            var disabled = !!disabledUnits[unit];

            var unitInfo = info[unit];

            if (unitInfo)
                unitInfo.disabled = disabled;
            else
                unitInfo =
                {
                    unit: unit,
                    infoDisplayName: unit,
                    infoDescription: ''
                }

            if (disabled)
                activeDisabledUnits.push(unitInfo);

            return !disabled;
        });

        // if no active disbled units and no merging of multiple unit server mods then not required

        if (activeDisabledUnits.length == 0)
            activeDisabledUnits = false;

        if (!activeDisabledUnits && !self.needsUnitsServerMods())
            return false;

        var unitList =
        {
            units: activeUnits,
            disabled: activeDisabledUnits
        };

        return unitList;
    });

    self.activeDisabledUnits = ko.computed(function () {
        var unitList = self.unitsUnitList();

        return unitList && unitList.disabled;
    });

    self.activeDisabledUnitsNames = ko.computed(function () {
        var activeDisabledUnits = self.activeDisabledUnits();

        if (!activeDisabledUnits)
            return false;

        var names = _.map(activeDisabledUnits, 'infoDisplayName');

        var sep = names.length > 2 ? ", " : ' and ';

        var result = names.join(sep);

        return result;
    });

    self.hasUnitList = ko.computed(function () {
        var unitList = self.unitsUnitList();

        return unitList && unitList.units.length > 0;
    });

    self.unitsUnitListJson = ko.computed(function () {
        if (!self.hasUnitList())
            return false;

        return JSON.stringify(self.unitsUnitList());
    });

    // server mod

    self.serverModInfo = ko.computed(function () {
        var activeDisabledUnits = self.activeDisabledUnits();

        var displayName = serverModDisplayName;
        var description = 'Unicorns & Rainbows';

        var scenes = {};

        if (activeDisabledUnits) {
            var names = self.activeDisabledUnitsNames();

            description = 'Disabled Units: ' + names;

            displayName = displayName + ' with Unit Restrictions';

            scenes['new_game'] = [serverModNewGameURL];

            // also see manual addition in activeServerModScenes

        }

        var modinfo =
        {
            identifier: serverModIdentifier,
            display_name: displayName,
            context: 'server',
            author: 'Community Mods',
            description: description,
            signature: 'not yet implemented',
            version: 0,
            disabledUnits: activeDisabledUnits
        };

        if (_.size(scenes) > 0)
            modinfo.scenes = scenes;

        return modinfo;
    });

    self.serverModInfoJson = ko.computed(function () {
        return JSON.stringify(self.serverModInfo());
    });

    self.serverMod = ko.observable(
        {
            identifier: serverModIdentifier,
            context: 'server',
            installedPath: serverModZipPath,
            mountPath: serverModsRoot
        });

    self.serverModNewGameJS = ko.computed(function () {
        var activeDisabledUnitsNames = self.activeDisabledUnitsNames();

        if (!activeDisabledUnitsNames)
            activeDisabledUnitsNames = "None';"

        var js = 'try { model.localChatMessage( "Unit Restrictions", "Disabled Units: " + ' + JSON.stringify(activeDisabledUnitsNames) + ' ); } catch ( e ) {};';

        return js;
    });

    // active server zip mods

    self.activeServerZipMods = ko.computed(function () {
        var mods = _.filter(self.activeServerMods(), function (mod) {
            return !mod.fileSystem
        });

        mods = _.sortBy(mods, 'priority');

        return mods;
    })

    // final server mods

    self.activeServerModsToMount = ko.computed(function () {
        var mods = _.clone(self.activeServerMods());

        if (mods.length > 0 || self.hasUnitList())
            mods.unshift(self.serverMod());

        return mods;
    });

    self.activeServerModIdentifiersToMount = ko.computed(function () {
        var mods = _.map(self.activeServerModsToMount(), function (mod) {
            return mod.identifier;
        });

        return mods;
    });

    // client mod

    self.clientModInfo = ko.observable(
        {
            identifier: clientModIdentifier,
            display_name: clientModDisplayName,
            context: 'client',
            author: 'Community Mods',
            description: ' ',
            signature: 'not yet implemented',
            version: 0
        });

    self.clientModInfoJson = ko.computed(function () {
        return JSON.stringify(self.clientModInfo());
    });

    self.clientMod = ko.observable(
        {
            identifier: clientModIdentifier,
            context: 'client',
            installedPath: clientModZipPath,
            mountPath: clientModsRoot
        });

    self.clientModNewGameJS = ko.computed(function () {
        var js = 'try { model.uberId = api.net.uberId; } catch ( e ) { console.error( e ); console.trace(); };';

        return js;
    });

    self.clientModLiveGameChatJS = ko.computed(function () {
        return '//';
    });

    self.clientModLiveGameJS = ko.computed(function () {
        var js = "handlers['build_bar.build'] = function(params) { if (params.item == atob('L3BhL3VuaXRzL2NvbW1hbmRlcnMvdHV0b3JpYWxfdGl0YW5fY29tbWFuZGVyL3R1dG9yaWFsX3RpdGFuX2NvbW1hbmRlci5qc29u')) model.exit(); model.executeStartBuild(params); }; api.arch.beginFabMode = function(spec) { if (spec == atob('L3BhL3VuaXRzL2NvbW1hbmRlcnMvdHV0b3JpYWxfdGl0YW5fY29tbWFuZGVyL3R1dG9yaWFsX3RpdGFuX2NvbW1hbmRlci5qc29u')) model.exit(); return engine.call('arch.beginFabMode', spec); };"
        return js;
    });

    self.clientModZipData = ko.computed(function () {
        var zip = new JSZip();

        zip.file('mods.json', self.activeClientModsJson());

        var clientUImodList = self.activeClientModsUImodList();

        zip.file(clientUImodListZipPath, clientUImodList);
        zip.file(clientUImodListForServerZipPath, clientUImodList);

        zip.file(clientModInfoZipPath, self.clientModInfoJson());

        zip.file(clientModNewGamePath, self.clientModNewGameJS());

        zip.file(clientModLiveGameChatPath, self.clientModLiveGameChatJS());

        zip.file(clientModLiveGamePath, self.clientModLiveGameJS());

        var data = "data:application/zip;base64," + zip.generate({ type: 'base64' });

        return data;
    });

    self.clientModDownloadInfo = ko.computed(function () {
        var download =
        {
            url: self.clientModZipData(),
            file: clientModZipFilename,
            mount: false,
            mod: self.clientMod()
        };

        return download;
    });

    self.activeServerModScenes = ko.computed(function () {
        var scenes = {};

        var activeServerMods = _.clone(self.activeServerMods());

        activeServerMods.push(self.serverModInfo());

        _.forEach(activeServerMods, function (mod) {
            if (mod.scenes) {
                _.forEach(mod.scenes, function (urls, scene) {
                    var existing = scenes[scene] || [];

                    scenes[scene] = _.union(existing, urls);

                });
            }
        });

        return scenes;
    });

    self.activeServerModsUImodList = ko.computed(function () {
        var scenes = self.activeServerModScenes();

        var js = 'var global_server_mod_list = ' + JSON.stringify(scenes.global_mod_list || [], null, 4) + ';\n'

        js += 'var scene_server_mod_list = ' + JSON.stringify(_.omit(scenes, 'global_mod_list'), null, 4) + ';\n'

        js += 'try {\n'

        js += '    loadScript("' + couiUImodListForServerPath + '");\n'

        js += '    try { global_mod_list = _.union( global_mod_list, global_server_mod_list ) } catch (e) { console.log(e); };\n';

        js += '    try { _.forOwn( scene_server_mod_list, function( value, key ) { if ( scene_mod_list[ key ] ) { scene_mod_list[ key ] = _.union( scene_mod_list[ key ], value ) } else { scene_mod_list[ key ] = value } } ); } catch (e) { console.log(e); }\n';

        js += '} catch (e) { console.log(e); var global_mod_list = global_server_mod_list; var scene_mod_list = scene_server_mod_list; }\n';

        return js;
    });

    // server mod zip

    self.activeServerModsJson = ko.computed(function () {
        var json = JSON.stringify(
            {
                mount_order: self.activeServerModIdentifiersToMount(),
                mods: self.activeServerModsToMount()
            });

        return json;
    });

    self.serverModZipData = ko.computed(function () {
        var zip = new JSZip();

        zip.file('mods.json', self.activeServerModsJson());

        zip.file(serverUImodListZipPath, self.activeServerModsUImodList());

        zip.file(serverModInfoZipPath, self.serverModInfoJson());

        var unitsUnitListJson = self.unitsUnitListJson();

        if (unitsUnitListJson) {
            zip.file(serverModNewGamePath, self.serverModNewGameJS());
            zip.file(serverModUnitListPath, unitsUnitListJson);
        }

        var data = "data:application/zip;base64," + zip.generate({ type: 'base64' });

        return data;
    });

    self.serverModDownloadInfo = ko.computed(function () {
        var download =
        {
            url: self.serverModZipData(),
            file: serverModZipFilename,
            mount: false,
            mod: self.serverMod()
        }

        return download;
    });

    // companions

    self.evaluateCompanions = function (mod) {
        var companions = mod.companions;

        if (!companions || companions.length == 0) {
            return false;
        }

        result =
        {
            // track circular
            processed: {},
            // track missing
            missing: {},
            // track zip only no longer availalbe
            zipOnly: {},
            // track file system only
            fileSytemOnly: {},
            // track installs required
            needsInstall: {},
            // track enables required
            needsEnable: {},
            // status for display
            status: [],
            companions: []
        }

        // exclude mod to prevent addition via circular dependencies

        result.processed[mod.identifier] = 1;

        return self.processCompanions(companions, result);
    };

    // recursive reduce of dependencies

    self.processCompanions = function (companions, result) {
        var installedModsIndex = self.installedModsIndex();
        var availableModsIndex = self.availableModsIndex();

        return _.reduce(companions, function (result, identifier) {

            var processed = result.processed[identifier] || 0;

            // mark as processed to prevent circular dependencies

            result.processed[identifier] = processed + 1;

            if (processed > 0) {
                // exit if already processed
                return result;
            }

            result.companions.push(identifier);

            var status =
            {
                identifier: identifier,
                display_name: identifier,
                description: '',
                missing: false,
                status: '?',
                size: 0,
            }

            var installedMod = installedModsIndex[identifier];

            var availableMod = availableModsIndex[identifier];

            // missing is not installed and not availble to install

            var missing = !installedMod && !availableMod;

            if (missing) {
                result.missing[identifier] = identifier;

                status.status = 'Missing';

                status.missing = true;

                result.status.push(status);

                return result;
            }

            // installed only is installed but not available online eg file system or removed

            var installOnly = installedMod && !availableMod;

            if (installOnly) {
                if (installedMod.fileSystem) {
                    result.fileSytemOnly[identifier] = identifier;
                    status.status = 'File System';
                }
                else {
                    result.zipOnly[identifier] = identifier;
                    status.status = 'Zip Only';
                }
            }

            var mod;

            if (installedMod) {
                mod = installedMod;

                if (!mod.enabled) {
                    result.needsEnable[identifier] = identifier;
                    status.status = loc('!LOC:Disabled');
                }
                else {
                    status.status = loc('!LOC:Active');
                }
            }
            else {
                result.needsInstall[identifier] = identifier;
                mod = availableMod;
                status.status = loc('!LOC:Available');
            }

            status.display_name = mod.display_name;
            status.description = mod.description;

            var size = '';

            if (availableMod && availableMod.size) {
                var mb = availableMod.size / 1024 / 1024;

                if (mb < 1) {
                    size = '< 1 MB';
                }
                else {
                    size = Math.round(mb) + ' MB';
                }
            }

            status.size = size;

            result.status.push(status);

            // check companions

            var companions = mod.companions;

            if (!companions || companions.length == 0) {
                // no companions
                return result;
            }

            // go deep
            result = self.processCompanions(companions, result);

            return result;

        }, result);
    }

    // dependencies

    self.evaluateDependencies = function (mod) {

        var dependencies = mod.dependencies;

        if (!dependencies || dependencies.length == 0) {
            return false;
        }

        result =
        {
            // track circular
            processed: {},
            // track missing
            missing: {},
            // track zip only no longer availalbe
            zipOnly: {},
            // track file system only
            fileSytemOnly: {},
            // track installs required
            needsInstall: {},
            // track enables required
            needsEnable: {},
            // status for display
            status: [],
            dependencies: []
        }

        // exclude mod to prevent addition via circular dependencies

        result.processed[mod.identifier] = 1;

        return self.processDependencies(dependencies, result);
    };

    // recursive reduce of dependencies

    self.processDependencies = function (dependencies, result) {

        var installedModsIndex = self.installedModsIndex();
        var availableModsIndex = self.availableModsIndex();

        return _.reduce(dependencies, function (result, identifier) {

            var processed = result.processed[identifier] || 0;

            // mark as processed to prevent circular dependencies

            result.processed[identifier] = processed + 1;

            if (processed > 0) {
                // exit if already processed
                return result;
            }

            result.dependencies.push(identifier);

            var status =
            {
                identifier: identifier,
                display_name: identifier,
                description: '',
                missing: false,
                status: '?',
                size: 0,
            }

            var installedMod = installedModsIndex[identifier];

            var availableMod = availableModsIndex[identifier];

            // missing is not installed and not availble to install

            var missing = !installedMod && !availableMod;

            if (missing) {
                result.missing[identifier] = identifier;

                status.status = 'Missing';

                status.missing = true;

                result.status.push(status);

                return result;
            }

            // installed only is installed but not available online eg file system or removed

            var installOnly = installedMod && !availableMod;

            if (installOnly) {
                if (installedMod.fileSystem) {
                    result.fileSytemOnly[identifier] = identifier;
                    status.status = 'File System';
                }
                else {
                    result.zipOnly[identifier] = identifier;
                    status.status = 'Zip Only';
                }
            }

            var mod;

            if (installedMod) {
                mod = installedMod;

                if (!mod.enabled) {
                    result.needsEnable[identifier] = identifier;
                    status.status = loc('!LOC:Disabled');
                }
                else {
                    status.status = loc('!LOC:Active');
                }
            }
            else {
                result.needsInstall[identifier] = identifier;
                mod = availableMod;
                status.status = loc('!LOC:Available');
            }

            status.display_name = mod.display_name;
            status.description = mod.description;

            var size = '';

            if (availableMod && availableMod.size) {
                var mb = availableMod.size / 1024 / 1024;

                if (mb < 1) {
                    size = '< 1 MB';
                }
                else {
                    size = Math.round(mb) + ' MB';
                }
            }

            status.size = size;

            result.status.push(status);

            // check dependencies

            var dependencies = mod.dependencies;

            if (!dependencies || dependencies.length == 0) {
                // no dependencies
                return result;
            }

            // go deep
            result = self.processDependencies(dependencies, result);

            return result;

        }, result);
    }

    // recursive reduce of dependencies

    self.lookForConsumers = function (mods, identifierToFind, result) {

        return _.reduce(mods, function (result, mod) {

            var identifier = mod.identifier;

            var processed = result.processed[identifier] || 0;

            // mark as processed to prevent circular dependencies

            if (processed > 0) {
                // exit if already processed
                return result;
            }

            var found = mod.dependencies && mod.dependencies.length > 0 && mod.dependencies.indexOf(identifierToFind) != -1;

            if (!found) {
                // exit if no depedencies to check or not found
                return result;
            }

            result.processed[identifier] = processed + 1;

            var status =
            {
                identifier: identifier,
                display_name: mod.display_name,
                status: mod.enabled ? loc('!LOC:Active') : loc('!LOC:Disabled')
            }

            result.consumers[identifier] = identifier;
            result.status.push(status);

            return self.lookForConsumers(mods, identifier, result);

        }, result);
    }

    self.evaluateInstalledModConsumers = function (identifier) {
        var mod = self.installedModsIndex()[identifier];

        if (!mod) {
            return undefined;
        }

        result =
        {
            // track circular
            processed: {},
            // track consumers
            consumers: {},
            // status for display
            status: []
        }

        // exclude mod to prevent addition via circular dependencies

        result.processed[mod.identifier] = 1;

        return self.lookForConsumers(self.installedMods(), identifier, result);
    };

    self.evaluateActiveModConsumers = function (identifier) {
        var mod = self.installedModsIndex()[identifier];

        if (!mod) {
            return undefined;
        }

        result =
        {
            // track circular
            processed: {},
            // track consumers
            consumers: {},
            // status for display
            status: []
        }

        // exclude mod to prevent addition via circular dependencies

        result.processed[mod.identifier] = 1;

        return self.lookForConsumers(self.activeMods(), identifier, result);
    };

    self.evaluateAvailableModConsumers = function (identifier) {
        var mod = self.availableModsIndex()[identifier];

        if (!mod) {
            return undefined;
        }

        result =
        {
            // track circular
            processed: {},
            // track consumers
            consumers: {},
            // status for display
            status: []
        }

        // exclude mod to prevent addition via circular dependencies

        result.processed[mod.identifier] = 1;

        return self.lookForConsumers(self.availableMods(), identifier, result);
    };

    // file system

    self.scanFileSystemClientMods = function () {
        debuglog('scanFileSystemClientMods');

        var deferred = $.Deferred();

        api.file.list('/client_mods/', false).then(function (listing) {
            listing = _.reject(listing, function (item) {
                if (item == clientModPath) {
                    return true;
                }
                else if (item == clientModsPath) {
                    debuglog(clientModsPath + ' detected');
                    // self.pammDetected( true );
                    return true;
                }
                else if (item == pammClientModExcludeNew || item == pammClientModExclude || item == pammClientModExcludeOld) {
                    debuglog('PAMM client mod detected');
                    self.pammDetected(true);
                    return true;
                }

                return false;
            });

            deferred.resolve(listing);
        }, function () {
            deferred.resolve([]);
        });

        return deferred;
    }

    self.scanFileSystemServerMods = function () {
        debuglog('scanFileSystemServerMods');

        var deferred = $.Deferred();

        api.file.list('/server_mods/', false).then(function (listing) {
            listing = _.reject(listing, function (item) {
                if (item == serverModPath) {
                    return true;
                }
                else if (item == serverModsPath) {
                    debuglog(serverModsPath + ' detected');
                    // self.pammDetected( true );
                    return true;
                }
                else if (item == pammServerModExclude) {
                    debuglog('PAMM server mod detected');
                    self.pammDetected(true);
                    return true;
                }

                return false;
            });

            deferred.resolve(listing);
        }, function () {
            deferred.resolve([]);
        });

        return deferred;
    }

    self.scanFileSystemForMods = function () {

        debuglog('scanFileSystemForMods');

        self.pammDetected(false);

        var deferred = $.Deferred();

        // these always resolve to an array

        $.when(self.scanFileSystemClientMods(), self.scanFileSystemServerMods()).done(function (clientMods, serverMods) {
            var mods = clientMods.concat(serverMods);

            var queue = [];

            _.forEach(mods, function (installedPath) {

                if (installedPath.substr(-1, 1) != '/') {
                    return true;
                }
                var rooturl = 'coui:/';
                var modinfoURL = rooturl + installedPath + '/modinfo.json';

                var deferred = $.Deferred();

                $.getJSON(modinfoURL).done(function (modinfo) {
                    if (!tester(modinfo)) {
                        deferred.resolve(false);
                        return;
                    }

                    var unitsURL = installedPath + 'pa/units/';

                    var unitListURL = unitsURL + 'unit_list.json';

                    var deferred2 = $.Deferred();

                    if (modinfo.context == 'client')
                        deferred2.resolve(false);
                    else {
                        api.file.list(unitsURL, false).always(function (listing) {
                            if (_.isArray(listing) && listing.length > 0 && _.indexOf(listing, unitListURL) != -1) {
                                $.getJSON(rooturl + unitListURL).done(function (unitList) {
                                    if (!unitList || !unitList.units) {
                                        deferred2.resolve(false);
                                        return;
                                    }

                                    unitList.units = _.uniq(unitList.units);

                                    self.loadUnitListInfo(unitList.units, modinfo.identifier, installedPath).always(function (info) {
                                        unitList.info = info;

                                        deferred2.resolve(unitList);

                                    });

                                }).fail(function () {
                                    deferred2.resolve(false);
                                });
                            }
                            else {
                                deferred2.resolve(false);
                            }
                        });
                    }

                    deferred2.always(function (unitList) {
                        modinfo.unitList = unitList;

                        modinfo = self.processModinfo(modinfo);

                        modinfo.installedPath = installedPath;
                        modinfo.fileSystem = true;
                        modinfo.installed = Date.now();
                        modinfo.downloaded = false;

                        deferred.resolve(modinfo);

                    });

                }).fail(function () {
                    console.error('modinfo.json failed to load for ' + modinfoURL);
                    deferred.resolve(false);
                })

                queue.push(deferred);
            })

            $.when.apply($, queue).then(function () {
                deferred.resolve(arguments);
            })

        }).fail(function (client_mods, server_mods) {
            debuglog('scanFileSystemForMods failed');
            deferred.reject();
        });

        return deferred;
    }

    self.mergeFileSystemModsIntoInstalledMods = function (fileSystemMods) {

        debuglog('mergeFileSystemModsIntoInstalledMods');

        var fileSystemModsIndex = self._keyBy(fileSystemMods, 'identifier');

        var installedMods = self.installedMods();

        var fileSystemModsEnabledStatus = {};

        // remove existing file system or conflicting mods keeping enabled status

        _.remove(installedMods, function (mod) {

            var conflictingMod = fileSystemModsIndex[mod.identifier];

            var remove = mod.fileSystem || conflictingMod;

            if (remove) {
                fileSystemModsEnabledStatus[mod.identifier] = mod.enabled;
            }

            return remove;
        });

        // install file system mods restoring any previous enabled status

        _.forEach(fileSystemMods, function (mod) {
            if (!mod) {
                return;
            }

            var previous = fileSystemModsEnabledStatus[mod.identifier];

            mod.enabled = previous != undefined && previous || false;

            installedMods.push(mod);

        });

        self.installedMods.valueHasMutated();

        return installedMods;
    }

    self.updateFileSystemMods = function () {

        debuglog('updateFileSystemMods');

        var start = Date.now();

        var deferred = $.Deferred();

        self.busy2(true);

        self.scanFileSystemForMods().done(function (fileSystemMods) {
            self.mergeFileSystemModsIntoInstalledMods(fileSystemMods);

            debuglog((Date.now() - start) / 1000 + ' seconds to update and merge file system mods');

            self.busy2(false);

            deferred.resolve();
        }).fail(function (results) {
            console.error('scanFileSystemForMods failed');
            deferred.reject(results);
        });

        return deferred;
    }

    self.reloadFileSystemMods = function () {

        debuglog('reloadFileSystemMods');

        var start = Date.now();

        var deferred = $.Deferred();

        self.busy2(true);

        self.updateFileSystemMods().done(function () {
            self.processAvailableModData(self.availableMods());

            debuglog((Date.now() - start) / 1000 + ' seconds to reload file system mods');

            self.busy2(false);

            deferred.resolve();
        }).fail(function (results) {
            console.error('reloadFileSystemMods failed');
            deferred.reject(results);
        });

        return deferred;
    }

    self.resetServerMods = function () {

        debuglog('resetServerMods');

        var deferred = $.Deferred();

        // always resolve TODO

        engine.call('reset_game_state').always(function (result) {
            delete sessionStorage.community_mods_reset_required;
            deferred.resolve();
        }).otherwise(function (result) {
            console.log('reset_game_state failed');
        });

        return deferred;
    }

    // mounting

    self.mountZipMod = function (mod, reload) {
        debuglog('mountZipMod ' + mod.identifier + ' ' + mod.installedPath + ' with' + (reload ? '' : ' no') + ' reload');

        var deferred = $.Deferred();

        var file = mod.installedPath;

        var mountPath = mod.mountPath;

        api.file.zip.mount(file, mountPath, reload).then(function (result) {
            console.log('mounting ' + file + ' to ' + mountPath + ' ' + (result ? 'OK' : 'FAIL'));

            mod.mounted = result;

            deferred.resolve(mod);
        });

        return deferred;
    };

    self.mountZipMods = function (mods) {
        debuglog('mountZipMods ' + mods.length);

        if (api.file.zip.mountMany) {
            var zips = _.map(mods, function (mod) {
                return {
                    path: mod.installedPath,
                    root: mod.mountPath
                };
            });

            return api.file.zip.mountMany(zips);
        }

        // legacy

        var deferred = $.Deferred();

        var mounts = [];

        _.forEach(mods, function (mod) {
            var mountDeferred = self.mountZipMod(mod, false);

            mounts.push(mountDeferred);
        });

        $.when.apply($, mounts).always(function () {
            deferred.resolve();
        });

        return deferred;
    };

    //     self.mountMods = function( files, context )
    //     {

    //         var start = Date.now();

    // debuglog( 'mountMods' );

    //         var deferred = $.Deferred();

    //         api.file.mountMemoryFiles( files ).always( function( result )
    //         {
    //             api.content.remount().always( function( result )
    //             {
    // debuglog( ( Date.now() - start ) / 1000 + ' seconds to mount ' + context + ' mods and remount' );
    //                 deferred.resolve();
    //             });

    //         });

    //         return deferred;

    //     }

    self.mountClientMods = function () {
        debuglog('mountClientMods');

        var start = Date.now();

        var deferred = $.Deferred();

        var clientMods = _.clone(self.activeClientZipMods());

        clientMods.push(self.clientMod());

        self.mountZipMods(clientMods).always(function () {
            debuglog((Date.now() - start) / 1000 + ' seconds to mount client zip mods');

            api.content.remount().always(function (result) {
                debuglog((Date.now() - start) / 1000 + ' seconds to mount client mods and remount');
                deferred.resolve();
            });
        });

        return deferred;
    }

    self.remountClientMods = function () {

        debuglog('remountClientMods');

        var start = Date.now();

        var deferred = $.Deferred();

        self.busy2(true);

        engine.call("file.unmountAllMemoryFiles").then(function (result) {

            self.mountClientMods().done(function (mods) {
                debuglog((Date.now() - start) / 1000 + ' seconds to remount client mods');

                self.busy2(false);

                deferred.resolve();
            });

        });

        return deferred;
    }

    self.mountServerMods = function () {
        debuglog('mountServerZipMods');

        var start = Date.now();

        var deferred = $.Deferred();

        var serverMods = _.clone(self.activeServerZipMods());

        serverMods.push(self.serverMod());

        self.mountZipMods(serverMods).always(function () {
            debuglog((Date.now() - start) / 1000 + ' seconds to mount server zip mods');

            deferred.resolve();
        });

        return deferred;

    }

    self.resetMods = function (remountClientMods, downloadServerZipMod) {
        debuglog('resetMods');

        var deferred = $.Deferred();

        var clientZipModDeferred = $.Deferred();

        if (remountClientMods) {
            self.downloadClientModZip().always(function (result) {
                self.remountClientMods().done(function (results) {
                    clientZipModDeferred.resolve();
                });
            }).fail(function (result) {
                console.error('downloadClientModZip failed in resetMods');
            });
        }
        else {
            clientZipModDeferred.resolve();
        }

        var serverZipModDeferred;

        if (downloadServerZipMod) {
            serverZipModDeferred = self.downloadServerZipMod();

            serverZipModDeferred.fail(function (result) {
                console.error('downloadServerZipMod failed in resetMods');
            });
        }
        else {
            serverZipModDeferred = $.Deferred().resolve();
        }

        $.when(clientZipModDeferred, serverZipModDeferred).always(function (clientZipModResult, serverZipModsResult) {
            delete sessionStorage.community_mods_reset_required;
            deferred.resolve();
        });

        return deferred;
    }

    self.updateZipMods = function (zipMods, remountClientMods, downloadServerZipMod) {
        debuglog('updateZipMods');

        var start = Date.now();

        var deferred = $.Deferred();

        var downloads = [];

        var modsURL = gModsUrl + 'community-mods/downloads/';

        _.forEach(zipMods, function (mod) {
            var file = mod.identifier + '.zip';

            mod.installedPath = downloadRoot + file;
            mod.mountPath = (mod.context == 'server' ? serverModsRoot : clientModsRoot) + mod.identifier + '/';

            var url = modsURL + file;

            var download =
            {
                url: url,
                file: file,
                md5: mod.md5,
                mount: false,
                mod: mod,
                size: mod.size
            };

            downloads.push(download);

        });

        self.downloadMany(downloads).done(function (results) {
            // save changes
            self.installedMods.valueHasMutated();

            debuglog((Date.now() - start) / 1000 + ' seconds to update installed zip mods');

            self.resetMods(remountClientMods, downloadServerZipMod).always(function () {
                deferred.resolve();
            });
        });

        return deferred;
    }

    self.zipModsToUpdate = ko.computed(function () {
        if (window.gNoMods)
            return [];

        var mods = _.filter(self.installedMods(), function (mod) {
            return (mod.enabled || mod.update) && !mod.fileSystem;
        });

        return mods;
    });

    self.updateActiveZipMods = function (remountClientMods, downloadServerZipMod) {
        debuglog('updateActiveZipMods');

        if (self.offlineMode()) {
            var deferred = $.Deferred();
            deferred.resolve();
            return deferred;
        }

        var deferred = $.Deferred();

        self.ready().always(function () {
            self.updateZipMods(self.zipModsToUpdate(), remountClientMods, downloadServerZipMod).always(function () {
                deferred.resolve();
            });
        });

        return deferred;
    }

    //     self.updateInstalledZipMods = function( remountClientMods )
    //     {
    // debuglog( 'updateInstalledZipMods' );

    //         return self.updateZipMods( self.installedZipMods(), remountClientMods, downloadServerZipMod );
    //     }

    self._adaptModIOModData = function(mods){
        var mods = _.map(mods, function (mod) {
            //patch from modio data to the old format.
            var date = new Date(mod.ex_dateupdated * 1000);
            mod.date = date.getFullYear() + '-' + self._padStart(date.getMonth() + 1, 2, '0') + '-' + self._padStart(date.getDate(), 2, '0');
            mod.timestamp = date.getTime();
            return mod
        });
    };

    // available mods

    self.loadAvailableMods = function (ignoreOffline) {
        debuglog('loadAvailableMods');

        var deferred = $.Deferred();

        self.ready().always(function () {
            var availableMods = self.availableMods();

            if (!availableMods)
                self.avaliableMods([]);

            if (!ignoreOffline && self.offlineMode()) {
                deferred.resolve();
                return;
            }

            self.busy2(true);

            // api.mods.getAvailableMods().then(function(mods){
            //     self._adaptModIOModData(mods);
            //     self.processAvailableModData(mods);
            //     if (self.offlineMode()) {
            //         self.offlineMode(false);
            //         delete localStorage.community_mods_offline_mode;
            //     }
            //     deferred.resolve();
            // }).always(function () {
            //     debuglog("CMM loadAvailableMods finished.")
            //     self.busy2(false);
            // });

            var availableModsURL = gModsUrl + 'community-mods/mods';
            debuglog("Updating mods from url: " + availableModsURL);

            var jqxhr = $.getJSON(availableModsURL).done(function (mods) {
                if (mods) {
                    self.processAvailableModData(mods);
                    if (self.offlineMode()) {
                        self.offlineMode(false);
                        delete localStorage.community_mods_offline_mode;
                    }
                    deferred.resolve();
                }
                else
                    deferred.reject();

            }).fail(function (jqXHR) {
                var status = jqXHR.status + ' ' + jqXHR.statusText;
                deferred.reject(status);

            }).always(function () {
                self.busy2(false);
            });
        });

        return deferred;
    }

    self.processAvailableModData = function (data) {
        debuglog('processAvailableModData');

        var start = Date.now();

        var installedModsIndex = self.installedModsIndex();

        var unavailableIdentifiers = _.keys(installedModsIndex);

        var needsInstall = {};
        var needsEnable = {};

        var removedDependencies = {};

        // update available mods with installed status

        var mods = _.map(data, function (mod) {
            var identifier = mod.identifier;

            var installedMod = installedModsIndex[identifier];

            if (installedMod) {

                mod.installed = installedMod.installed;
                mod.downloaded = installedMod.downloaded;
                mod.fileSystem = installedMod.fileSystem;

                mod.enabled = installedMod.enabled;

                mod.installedPath = installedMod.installedPath;

                installedMod.available = true;
                installedMod.md5 = mod.md5;

                if (installedMod.fileSystem) {
                    mod.conflict = true;
                    installedMod.conflict = true;
                    installedMod.enabled = false;
                }
                else {

                    // check active mods for added dependencies - currently a shallow check without deep dependency evaulation

                    if (installedMod.enabled) {
                        var addedDependencies = _.difference(mod.dependencies, installedMod.dependencies);

                        _.forEach(addedDependencies, function (depedencyModIdentifier) {
                            var installedDependencyMod = installedModsIndex[depedencyModIdentifier];

                            if (installedDependencyMod && installedDependencyMod.enabled == false) {
                                needsEnable[depedencyModIdentifier] = true;
                            }
                            else if (!installedDependencyMod) {
                                needsInstall[depedencyModIdentifier] = true;
                            }
                        });
                    }

                    installedMod = _.assign(installedMod, _.omit(mod, ['fileSystem', 'downloaded', 'installed', 'installedPath', 'enabled', 'mounted', 'mountPath', 'available']));
                }

                _.remove(unavailableIdentifiers, identifier);

            }
            else {
                mod.enabled = false;
                mod.installed = false;
                mod.installedPath = false;
            }

            return mod;
        });

        // update installed mods with unavailable status

        _.forEach(unavailableIdentifiers, function (identifier) {
            var mod = installedModsIndex[identifier];

            if (mod) {
                mod.available = false;
            }
        })

        if (window.paLobby) {
            mods = _.filter(mods, function (mod) {
                return _.indexOf(self.modExcludes, mod.identifier) != -1;
            });
        }

        self.availableMods(mods);

        // install any new depedencies

        _.forEach(needsInstall, function (ignore, identifier) {
            self.installMod(identifier, true);
            // actual download will occur in update check during main or when exiting community mods
        });

        // enable any new dependencies

        _.forEach(needsEnable, function (ignore, identifier) {
            self.enableMod(identifier, true);
        })

        // mutate before checking for disabled framework mods

        self.installedMods.valueHasMutated();

        // this should catch any removed dependencies

        self.disableUnusedFrameworkMods();

        // disableUnusedFrameworkMods does not mutate

        self.installedMods.valueHasMutated();

        debuglog((Date.now() - start) / 1000 + ' seconds to process');
    }

    // install / enable / disable / uninstall

    self.installMod = function (identifier, dependency, disable) {

        debuglog('installMod ' + identifier);

        var existing = self.installedModsIndex()[identifier];

        if (existing) {
            debuglog('Already installed');
            return true;
        }

        // does not save changes to available mods

        var availableMod = self.availableModsIndex()[identifier];

        if (!availableMod) {
            debuglog('No available mod for install???');
            return false;
        }

        availableMod.installed = Date.now();
        availableMod.enabled = !disable;

        availableMod.installedPath = downloadRoot + identifier + '.zip';
        availableMod.mountPath = (availableMod.context == 'server' ? serverModsRoot : clientModsRoot) + identifier + '/';

        if (dependency)
            availableMod.dependency = dependency;

        self.installedMods().push(availableMod);

        return true;
    }

    self.uninstallMod = function (identifier) {

        debuglog('uninstallMod ' + identifier);

        _.remove(self.installedMods(), { identifier: identifier });

        // does not save changes to available mods

        var availableMod = self.availableModsIndex()[identifier];

        if (availableMod) {
            availableMod.installed = false;
            availableMod.installedPath = false;
            availableMod.enabled = false;
        }
    }

    self.enableMod = function (identifier, dependency) {

        debuglog('enableMod ' + identifier);

        var installedMod = self.installedModsIndex()[identifier];

        if (!installedMod) {
            debuglog('Not installed');
            return false;
        }

        if (installedMod.enabled) {
            debuglog('Already enabled');
            return true;
        }

        installedMod.enabled = true;

        installedMod.dependency = dependency;

        // does not save changes to available mods

        var availableMod = self.availableModsIndex()[identifier];

        if (!availableMod) {
            debuglog('Enabling mod not available');
            return true;
        }

        availableMod.enabled = true;

        return true;
    }

    self.disableMod = function (identifier) {

        debuglog('disableMod ' + identifier);

        var installedMod = self.installedModsIndex()[identifier];

        if (!installedMod) {
            return false;
        }

        installedMod.enabled = false;

        // does not save changes to available mods

        var availableMod = self.availableModsIndex()[identifier];

        if (!availableMod) {
            debuglog('Disabling mod not available for ' + identifier);
            return;
        }

        availableMod.enabled = false;

    }

    self.activateModWithDependencies = function (mod, dependencies, doNotMutateAvailable) {

        var start = Date.now();

        var updatedMods = [mod.identifier];

        if (dependencies == undefined) {
            dependencies = self.evaluateDependencies(mod);
        }

        if (dependencies) {
            _.forEach(dependencies.needsInstall, function (identifier) {
                self.installMod(identifier, true);

                updatedMods.push(identifier);
            });

            _.forEach(dependencies.needsEnable, function (identifier) {
                self.enableMod(identifier, true);

                updatedMods.push(identifier);
            })
        }

        // check status of mod

        var identifier = mod.identifier;

        if (identifier == 'community-chat') {
            self.disableMod('com.pa.chat');
            self.disableMod('community-chat-dev');
        }
        else if (identifier == 'com.pa.chat') {
            self.disableMod('community-chat');
            self.disableMod('community-chat-dev');
        }
        else if (identifier == 'community-chat-dev') {
            self.disableMod('com.pa.chat');
            self.disableMod('community-chat');
        }

        var installedMod = self.installedModsIndex()[identifier];

        if (installedMod) {
            if (!installedMod.enabled) {
                self.enableMod(identifier, false);

                updatedMods.push(identifier);
            }
        }
        else {
            self.installMod(identifier, false);

            updatedMods.push(identifier);
        }

        self.installedMods.valueHasMutated();

        if (doNotMutateAvailable && self.availableMods.save) {
            self.availableMods.save();
        }
        else {
            self.availableMods.valueHasMutated();
        }

        // do not download client zip mod, remount client mods or download server zip mod at this time

        self.updateActiveZipMods(false, false).done(function (mods) {
            debuglog((Date.now() - start) / 1000 + ' seconds to activate mod with dependencies');
        });

        return updatedMods;
    }

    self.activateCompanionMods = function () {
        var companionMods = self.companionMods();

        if (companionMods.length == 0) {
            return;
        }

        sessionStorage.community_mods_reset_required = true;

        var zipMods = _.filter(companionMods, function (mod) {
            return !mod.fileSystem;
        });

        // true, false = remount client mods, do not download server mod zip

        return self.updateZipMods(zipMods, true, false);
    }

    self.disableUnusedFrameworkMods = function () {

        var dependencyFrameworks = [];

        var activeModDependencies = [];

        _.forEach(self.activeMods(), function (mod) {

            // find the active framework mods enabled via dependency

            if (mod.dependency && mod.framework) {
                dependencyFrameworks.push(mod.identifier);
                return;
            }

            // evaluate full list of depedencies for mods activated by the user

            if (mod.dependencies && mod.dependencies.length > 0) {
                var result = self.evaluateDependencies(mod);

                if (result && result.dependencies && result.dependencies.length > 0) {
                    activeModDependencies = _.union(activeModDependencies, result.dependencies);
                }
            }
        });

        // check mods with depedencies to see if any need the framework dependency mods

        var frameworkModsToDisable = _.difference(dependencyFrameworks, activeModDependencies);

        // disable any unsued framework dependency mods

        _.forEach(frameworkModsToDisable, function (identifier) {
            self.disableMod(identifier);
        });

        return frameworkModsToDisable;
    };

    self.uninstallModWithConsumers = function (mod, consumers, doNotMutateAvailable) {

        var updatedMods = [mod.identifier];

        if (consumers == undefined) {
            consumers = self.evaluateActiveModConsumers(mod);
        }

        self.uninstallMod(mod.identifier);

        if (consumers) {
            _.forEach(consumers.consumers, function (identifier) {
                self.disableMod(identifier);

                updatedMods.push(identifier);

            });
        }

        self.installedMods.valueHasMutated();

        updatedMods = _.union(updatedMods, self.disableUnusedFrameworkMods());

        self.installedMods.valueHasMutated();

        if (doNotMutateAvailable && self.availableMods.save) {
            self.availableMods.save();
        }
        else {
            self.availableMods.valueHasMutated();
        }

        return updatedMods;

    }

    self.disableModWithConsumers = function (mod, consumers, doNotMutateAvailable) {

        var updatedMods = [mod.identifier];

        if (consumers == undefined) {
            consumers = self.evaluateActiveModConsumers(mod);
        }

        self.disableMod(mod.identifier);

        if (consumers) {
            _.forEach(consumers.consumers, function (identifier) {
                self.disableMod(identifier);

                updatedMods.push(identifier);
            });
        }

        self.installedMods.valueHasMutated();

        updatedMods = _.union(updatedMods, self.disableUnusedFrameworkMods());

        self.installedMods.valueHasMutated();

        if (doNotMutateAvailable && self.availableMods.save) {
            self.availableMods.save();
        }
        else {
            self.availableMods.valueHasMutated();
        }

        return updatedMods;
    }

    // downloads

    self.downloadOfflineFiles = function (ignoreOffline) {

        debuglog('downloadOfflineFiles');

        var start = Date.now();

        var deferred = $.Deferred();

        deferred.resolve();
        return deferred;
    }

    self.downloadServerZipMod = function () {
        debuglog("CMM: downloadServerZipMod");
        var serverModDownload = self.serverModDownloadInfo();

        var result;

        if (serverModDownload)
            result = self.download(serverModDownload);
        else
            result = $.Deferred().resolve();

        return result;
    }

    self.downloadClientModZip = function () {
        debuglog("CMM: downloadClientModZip");
        var clientModDownload = self.clientModDownloadInfo();

        var result = self.download(clientModDownload);

        return result;
    }

    globalHandlers.download = self.onDownload;

    return self;

}

var CommunityModsManager = new communityModManager();
