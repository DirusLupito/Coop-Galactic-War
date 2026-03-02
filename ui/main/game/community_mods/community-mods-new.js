// (C)COPYRIGHT 2016-2021 Planetary Annihilation Inc. All rights reserved.

// !LOCNS:community_mods

var model;
var handlers;

var communityModsLoaded = false;

ko.bindingHandlers.selectPicker2 =
{
    init: function (element, valueAccessor, allBindingsAccessor) {

        if ($(element).is('select')) {
            var selectPickerOptions = allBindingsAccessor().selectPickerOptions;
            if (typeof selectPickerOptions !== 'undefined' && selectPickerOptions !== null) {
                var options = selectPickerOptions.optionsArray,
                    optionsText = selectPickerOptions.optionsText,
                    optionsValue = selectPickerOptions.optionsValue,
                    optionsCaption = selectPickerOptions.optionsCaption,
                    isDisabled = selectPickerOptions.disabledCondition || false,
                    resetOnDisabled = selectPickerOptions.resetOnDisabled || false,
                    style = selectPickerOptions.style,
                    required = selectPickerOptions.required || false,
                    title = selectPickerOptions.title;

                if (ko.utils.unwrapObservable(options).length > 0) {
                    // call the default Knockout options binding
                    if (ko.isObservable(options) == false) {
                        options = ko.observableArray(options);
                    }

                    ko.bindingHandlers.options.update(element, options, allBindingsAccessor);
                }
                if (isDisabled && resetOnDisabled) {
                    // the dropdown is disabled and we need to reset it to its first option
                    $(element).selectpicker('val', $(element).children('option:first').val());
                }
                $(element).prop('disabled', isDisabled);
                if (style)
                    $(element).addClass(style).selectpicker('setStyle');

                if (title)
                    $(element).prop('title', title);

                if (required === true)
                    $(element).attr('required', true);
            }
            if (ko.isObservable(valueAccessor())) {
                if ($(element).prop('multiple') && $.isArray(ko.utils.unwrapObservable(valueAccessor()))) {
                    // in the case of a multiple select where the valueAccessor() is an observableArray, call the default Knockout selectedOptions binding
                    ko.bindingHandlers.selectedOptions.init(element, valueAccessor, allBindingsAccessor);
                }
                else {
                    // regular select and observable so call the default value binding
                    ko.bindingHandlers.value.init(element, valueAccessor, allBindingsAccessor);
                }
            }
            $(element).addClass('selectpicker').selectpicker();
        }
    },
    update: function (element, valueAccessor, allBindingsAccessor) {
        if ($(element).is('select')) {
            var selectPickerOptions = allBindingsAccessor().selectPickerOptions;
            if (typeof selectPickerOptions !== 'undefined' && selectPickerOptions !== null) {
                var options = selectPickerOptions.optionsArray,
                    optionsText = selectPickerOptions.optionsText,
                    optionsValue = selectPickerOptions.optionsValue,
                    optionsCaption = selectPickerOptions.optionsCaption,
                    isDisabled = selectPickerOptions.disabledCondition || false,
                    resetOnDisabled = selectPickerOptions.resetOnDisabled || false,
                    style = selectPickerOptions.style,
                    required = selectPickerOptions.required || false,
                    title = selectPickerOptions.title;

                if (ko.utils.unwrapObservable(options).length > 0) {
                    // call the default Knockout options binding
                    if (ko.isObservable(options) == false)
                        options = ko.observableArray(options);

                    ko.bindingHandlers.options.update(element, options, allBindingsAccessor);
                }

                // the dropdown is disabled and we need to reset it to its first option
                if (isDisabled && resetOnDisabled)
                    $(element).selectpicker('val', $(element).children('option:first').val());

                $(element).prop('disabled', isDisabled);
                if (style)
                    $(element).addClass(style).selectpicker('setStyle');

                if (title)
                    $(element).prop('title', title);

                if (required === true)
                    $(element).attr('required', true);
            }

            if (ko.isObservable(valueAccessor())) {
                // in the case of a multiple select where the valueAccessor() is an observableArray, call the default Knockout selectedOptions binding
                if ($(element).prop('multiple') && $.isArray(ko.utils.unwrapObservable(valueAccessor())))
                    ko.bindingHandlers.selectedOptions.update(element, valueAccessor);
                else
                    element.setAttribute('value', ko.utils.unwrapObservable(valueAccessor()))
            }

            ko.unwrap(allBindingsAccessor.get('options'));
            ko.unwrap(allBindingsAccessor.get('value'));

            $(element).selectpicker('refresh');
        }
    }
}

function CommunityMods() {
    if (communityModsLoaded) {
        return;
    }

    if (ko.options)
        ko.options.deferUpdates = true;

    var dev = localStorage.community_mods_dev;

    // var url = 'coui://ui/main/game/community_mods/community-mods-manager.js';

    // if ( ! loadScript( url ) )
    // {
    //         return;
    // }

    communityModsLoaded = true;

    function CommunityModsViewModel() {
        var self = this;

        // lodash 4.x vs lodash 3.x

        var _keyBy = CommunityModsManager._keyBy;

        var wordsRegEx = CommunityModsManager.wordsRegEx;

        // _.orderBy (4.x) vs _.sortByOrder (3.10.x) vs _.sortBy (3.9.x and older) requires manual check

        self.offlineMode = CommunityModsManager.offlineMode;

        self.showCommunityModsBusy = CommunityModsManager.busy;

        self.buildVersion = ko.observable().extend({ session: 'build_version' });

        self.openURL = function (url) {
            if (!url.startsWith('http')) {
                return;
            }

            engine.call('web.launchPage', url);
        }

        // search and sort

        self.searchFilter = ko.observable('');

        self.modsSearchFilter = ko.observable('');

        self.searchUsingAnd = ko.observable(false).extend({ local: 'community_mods_search_type' });

        self.sortKey = ko.observable('updated');
        self.modsSortKey = ko.observable('updated');
        self.unitsSortKey = ko.observable('disabled');

        self.sortKey.subscribe(function (sortKey) {
            var selectedTab = self.selectedTab();

            if (selectedTab)
                selectedTab.sortKey = sortKey;

            if (self.selectedTabIsUnits())
                self.unitsSortKey(sortKey);
            else
                self.modsSortKey(sortKey);
        });

        self.contextKey = ko.observable('');

        self.contextOptions = ko.computed(function () {
            return [
                { text: 'Any', value: '' },
                { text: 'Server', value: 'server' },
                { text: 'Client', value: 'client' }
            ];
        });

        // ! downloads

        self.downloadsStatus = CommunityModsManager.downloadsStatus;

        self.hasDownloads = CommunityModsManager.hasDownloads;

        self.downloadStyles = function (download) {
            return { backgroundColor: download.retries ? '#8f0000' : 'transparent' };
        }

        self.downloadProgressStyles = function (download) {
            return { width: download.percent * 100 + '%' };
        }

        // ! available

        self.availableMods = ko.computed(function () {
            var uberId = sessionStorage.uberId;

            if (uberId) {
                uberId = decode(uberId);
            }

            return _.filter(CommunityModsManager.availableMods(), function (mod) {
                if (mod.hidden) {
                    return false;
                }

                var authorised = mod.authorised;

                if (!authorised || !_.isArray(authorised)) {
                    return true;
                }

                return authorised.indexOf(uberId) != -1;
            });

        });

        self.hiddenAvailableMods = ko.computed(function () {
            return _.filter(CommunityModsManager.availableMods(), function (mod) {
                return mod.hidden;
            });
        });

        self.availableModsIndex = CommunityModsManager.availableModsIndex;

        // wrap available mods as observables

        self.availableModsObservable = ko.computed(function () {
            return _.map(self.availableMods(), function (mod) {
                return ko.observable(mod);
            })
        });

        self.availableMapModsObservable = ko.computed(function () {
            return _.map(self.availableMods(), function (mod) {
          
  
                return ko.observable(mod);
  
            })
        });

        self.hiddenAvailableModsObservable = ko.computed(function () {
            return _.map(self.hiddenAvailableMods(), function (mod) {
                return ko.observable(mod);
            })
        });

        self.availableModsObservableIndex = ko.computed(function () {
            return _keyBy(self.availableModsObservable().concat(self.hiddenAvailableModsObservable()), function (mod) {
                return mod().identifier;
            });
        });

        self.availableMapModsObservableIndex = ko.computed(function () {
            return _keyBy(self.availableMapModsObservable().concat(self.hiddenAvailableModsObservable()), function (mod) {
                return mod().identifier;
            });
        });

        // !installed


        self.installedMods = CommunityModsManager.installedMods;

        self.installedFileSystemMods = CommunityModsManager.installedFileSystemMods;

        self.installedModsIndex = CommunityModsManager.installedModsIndex;


        // wrap installed mods as observables

        self.installedModsObservable = ko.computed(function () {
            return _.map(self.installedMods(), function (mod) {
                return ko.observable(mod);
            })
        });

        self.installedModsObservableIndex = ko.computed(function () {
            return _keyBy(self.installedModsObservable(), function (mod) {
                return mod().identifier;
            });
        });

        // ! active server

        self.disabledUnits = CommunityModsManager.disabledUnits;

        self.showMergeUnitServerMods = ko.observable(CommunityModsManager.devMode);

        self.mergeUnitServerMods = CommunityModsManager.mergeUnitServerMods;

        self.activeUnitList = CommunityModsManager.activeUnitList;

        self.activeUnitsInfo = ko.computed(function () {
            var info = self.activeUnitList().info;

            info = _.sortBy(info, function (unit) {
                return unit.sort;
            });

            return info;
        });

        self.hasMultipleUnitServerMods = CommunityModsManager.hasMultipleUnitServerMods;

        self.activeUnitServerModsCount = CommunityModsManager.activeUnitServerModsCount;

        self.activeUnitServerModTooltip = ko.computed(function () {
            return _.map(CommunityModsManager.activeUnitServerMods(), function (mod) {
                return mod.display_name;
            }).join(' | ');
        });

        self.activeServerMods = ko.computed(function () {
            return _.filter(self.installedModsObservable(), function (mod) {
                var mod = mod();

                return mod.context == 'server' && mod.enabled;
            });
        });

        self.activeServerModsIndex = ko.computed(function () {
            return _keyBy(self.activeServerMods(), function (mod) {
                return mod().identifier;
            });
        });

        // ! active client

        self.activeClientMods = ko.computed(function () {
            return _.filter(self.installedModsObservable(), function (mod) {
                var mod = mod();
                return mod.context == 'client' && mod.enabled;
            });

        });

        self.activeClientModsIndex = ko.computed(function () {
            return _keyBy(self.activeClientMods(), function (mod) {
                return mod().identifier;
            });
        });


        // ! recommended

        self.recommendedMods = ko.computed(function () {
            var recommendedIdentifiers = CommunityModsManager.recommendedModIdentifiers;

            var mods = [];

            var modsIndexed = self.availableModsObservableIndex();

            _.forEach(recommendedIdentifiers, function (recommendedIdentifier) {
                var mod = modsIndexed[recommendedIdentifier];

                if (mod) {
                    mods.push(mod);
                }
            })

            return mods;
        });

        self.recommendedModsIndex = ko.computed(function () {
            return _keyBy(self.recommendedMods(), function (mod) {
                return mod().identifier;
            });
        });

        /*
                self.recommendedeModsObservable = ko.computed( function()
                {
                    return _.map( self.recommendedMods(), function( mod )
                    {
                        return ko.observable( mod );
                    })
                });
        
                self.recommendedeModsObservableIndex = ko.computed( function()
                {
                    return _keyBy( self.recommendedeModsObservable(), function( mod )
                    {
                        return mod().identifier ;
                    });
                });
        */

        // ! tabs


        self.activeModSortOptions =
            [
                { text: loc('!LOC:Updated'), value: 'timestamp', desc: true },
                { text: loc('!LOC:Priority'), value: 'priority' },
                { text: loc('!LOC:Name'), value: 'sort' }
            ];

        self.availableModSortOptions =
            [
                { text: loc('!LOC:Updated'), value: 'timestamp', desc: true },
                { text: loc('!LOC:Active/Inactive'), value: 'enabled', desc: true },
                { text: loc('!LOC:Priority'), value: 'priority' },
                { text: loc('!LOC:Name'), value: 'sort' }
            ];

        self.tabsIndex = ko.computed(function () {
            var tabs =
            {
                'units':
                {
                    key: 'units',
                    name: loc('!LOC:Units'),
                    sortOptions:
                        [
                            { text: loc('!LOC:Enabled/Disabled'), value: 'disabled' },
                            { text: loc('!LOC:Type'), value: 'sort' },
                            { text: loc('!LOC:Name'), value: 'infoDisplayName' }
                        ],
                    sortKey: 'disabled',
                    tooltip: loc('!LOC:Unit restrictions to disable specific units for all players in AI skirmish & multiplayer games you create')
                },
                'active-server-mods':
                {
                    key: 'active-server-mods',
                    name: window.gNoMods ? loc('!LOC:Enabled Server') : loc('!LOC:Active Server'),
                    sourceIsInstalled: true,
                    mods: self.activeServerMods,
                    modsIndex: self.installedModsObservableIndex,
                    selectedModIdentifier: ko.observable(),
                    sortOptions: self.activeModSortOptions,
                    sortKey: 'priority',
                    tooltip: 'Enabled server mods for all players in AI skirmish & multiplayer games you create'
                },
                'active-client-mods':
                {
                    key: 'active-client-mods',
                    name: window.gNoMods ? loc('!LOC:Enabled Client') : loc('!LOC:Active Client'),
                    sourceIsInstalled: true,
                    mods: self.activeClientMods,
                    modsIndex: self.installedModsObservableIndex,
                    selectedModIdentifier: ko.observable(),
                    sortOptions: self.activeModSortOptions,
                    sortKey: 'priority',
                    tooltip: loc('!LOC:Enabled client mods for only your client in any games you play or spectate')
                },
                'installed':
                {
                    key: 'installed',
                    name: loc('!LOC:Installed'),
                    sourceIsInstalled: true,
                    mods: self.installedModsObservable,
                    modsIndex: self.installedModsObservableIndex,
                    selectedModIdentifier: ko.observable(),
                    sortOptions: self.availableModSortOptions,
                    sortKey: 'timestamp',
                    tooltip: loc('!LOC:Installed server & client mods in the download cache')
                }
            };

            if (!self.offlineMode()) {
                tabs['recommended-mods'] =
                {
                    key: 'recommended-mods',
                    name: loc('!LOC:Recommended'),
                    sourceIsInstalled: false,
                    mods: self.recommendedMods,
                    modsIndex: self.recommendedModsIndex,
                    selectedModIdentifier: ko.observable(),
                    sortOptions: self.availableModSortOptions,
                    sortKey: 'name',
                    tooltip: loc('!LOC:Recommended mods')
                };

                tabs['available-mods'] =
                {
                    key: 'available-mods',
                    name: loc('!LOC:Available'),
                    sourceIsInstalled: false,
                    mods: self.availableModsObservable,
                    modsIndex: self.availableModsObservableIndex,
                    selectedModIdentifier: ko.observable(),
                    sortOptions: self.availableModSortOptions,
                    sortKey: 'timestamp',
                    tooltip: loc('!LOC:Mods available to install')
                }
                tabs['maps'] =
                {
                    key: 'maps',
                    name: loc('!LOC:Maps'),
                    sourceIsInstalled: false,
                    mods: self.availableModsObservable,
                    modsIndex: self.availableModsObservableIndex,
                    selectedModIdentifier: ko.observable(),
                    sortOptions: self.availableModSortOptions,
                    sortKey: 'timestamp',
                    tooltip: loc('!LOC:Maps available to install')
                }
            }

            return tabs;
        });

        self.selectedTabIndex = ko.observable('units');

        self.selectedTabIsUnits = ko.observable(true);

        self.selectedTabIsMods = ko.computed(function () {
            return !self.selectedTabIsUnits();
        });

      

        self.sortOptions = ko.observableArray([]);

        self.selectedTab = ko.computed(function () {
            return self.tabsIndex()[self.selectedTabIndex()];
        });

        self.selectedTabIsMaps = ko.computed(function () {
            if(self.selectedTab()){
                if(self.selectedTab().key == "maps"){
                    return true
                }
            }
            return false
        });

        self.selectedTabModsSource = ko.computed(function () {
            if (self.selectedTabIsUnits())
                return false;
            return self.selectedTab().mods();
        });

        self.selectedTabModsSourceIndex = ko.computed(function () {
            if (self.selectedTabIsUnits())
                return false;
            return self.selectedTab().modsIndex();
        });

        self.selectedTabModsSourceIsInstalled = ko.computed(function () {
            return self.selectedTab().sourceIsInstalled;
        });

        self.selectedTabMessage = ko.computed(function () {
            var message = '';

            var description = self.selectedTab().name;

            if (self.searchFilter() || self.contextKey() != '') {

                if (self.selectedTabIsEmpty()) {
                    message = loc('!LOC:No __description__ mods match your criteria', { description: description });
                }
                else {
                    message = loc('!LOC:__description__ mods matching your criteria', { description: description })
                }
            }

            return message;
        });

        self.showTab = function (tab) {
            self.selectedTabIndex(tab.key);

            var sortOptions = tab.sortOptions;
            var sortKey = tab.sortKey;

            self.sortOptions(sortOptions);
            self.sortKey(sortKey);

            var units = tab.key == 'units';

            self.selectedTabIsUnits(units);

            if (units)
                self.loadUnitImagesDelayed();
            else
                self.loadModImagesDelayed();
        }

        self.showTabKey = function (key) {
            var tab = self.tabsIndex()[key];

            if (tab)
                self.showTab(tab);
        }

        self.loadModImages = function () {

            const modHeight = 42;

            var scrollTop = $('#mods').scrollTop();

            var modsHeight = $('#mods').outerHeight();

            var first = Math.floor(scrollTop / modHeight);

            var count = Math.round(modsHeight / modHeight) + 1;

            var offlineMode = self.offlineMode();

            $('div.one-mod').slice(first, first + count).find('div.mod-icon img[src=""]').each(function (index, img) {
                var $img = $(img);

                var src = $img.attr('data-src');

                if (!offlineMode || src.startsWith('coui://'))
                    $img.attr('src', src);
            });

        }

        self.loadModImagesDelayed = _.debounce(self.loadModImages, 200);

        self.tabs = ko.computed(function () {
            return _.values(self.tabsIndex());
        });

        // units

        self.unitsMessage = ko.computed(function () {
            var message = false; // 'Unit restrictions for all players in AI skirmish & multiplayer games you create';

            var description = self.selectedTab().name;

            if (self.searchFilter()) {

                if (self.sortedFilteredUnits().length == 0) {
                    message = loc('!LOC:No units match your criteria')
                }
                else {
                    message = loc('!LOC:Units matching your criteria')
                }
            }

            return message;
        });

        self.loadUnitImages = function () {

            const unitHeight = 42;

            var scrollTop = $('#units').scrollTop();

            var unitsHeight = $('#units').outerHeight();

            var first = Math.floor(scrollTop / unitHeight);

            var count = Math.round(unitsHeight / unitHeight) + 1;

            var offlineMode = self.offlineMode();

            $('div.one-unit').slice(first, first + count).find('div.unit-icon img[src=""]').each(function (index, img) {
                var $img = $(img);

                var src = $img.attr('data-src');

                if (!offlineMode || src.startsWith('coui://'))
                    $img.attr('src', src);
            });

        }

        self.loadUnitImagesDelayed = _.debounce(self.loadUnitImages, 200);

        self.selectedUnitKey = ko.observable();

        self.selectUnit = function (unit) {
            self.selectedUnitKey(unit.unit);
        }

        self.selectedUnit = ko.computed(function () {
            if (!self.selectedTabIsUnits())
                return false;

            var selectedUnitKey = self.selectedUnitKey();

            if (!selectedUnitKey)
                return undefined;

            var unit = self.activeUnitsIndex()[selectedUnitKey];

            return unit && unit();
        });

        self.canEnableUnit = ko.computed(function () {
            var selectedUnit = self.selectedUnit();

            return selectedUnit && selectedUnit.disabled && !selectedUnit.unavailable;
        });

        self.canDisableUnit = ko.computed(function () {
            var selectedUnit = self.selectedUnit();

            return selectedUnit && !selectedUnit.disabled && !selectedUnit.unavailable;
        });

        self.enableSelectedUnit = function () {
            var selectedUnitKey = self.selectedUnitKey();

            if (!selectedUnitKey)
                return;

            CommunityModsManager.enableUnit(selectedUnitKey);

            var unit = self.activeUnitsIndex()[selectedUnitKey];

            if (!unit)
                return;

            unit().disabled = false;

            unit.valueHasMutated();
        };

        self.disableSelectedUnit = function () {
            var selectedUnitKey = self.selectedUnitKey();

            if (!selectedUnitKey)
                return;

            CommunityModsManager.disableUnit(selectedUnitKey);

            var unit = self.activeUnitsIndex()[selectedUnitKey];

            if (!unit)
                return;

            unit().disabled = true;

            unit.valueHasMutated();
        };

        self.disableMatchingUnits = function (types) {
            var units = CommunityModsManager.disableUnitsMatching(types);

            _.forEach(units, function (unit) {
                var unitObservable = self.activeUnitsIndex()[unit];

                if (unitObservable) {
                    unitObservable().disabled = true;
                    unitObservable.valueHasMutated();
                }
            });
        }

        self.disableRanaroks = function () {
            self.disableMatchingUnits(['destruct', 'structure', 'advanced']);
        };

        self.disableTitans = function () {
            self.disableMatchingUnits(['titan']);
        };

        self.disableNukes = function () {
            self.disableMatchingUnits(['nuke', 'structure', 'offense']);
        };

        self.enableAllUnits = function () {
            CommunityModsManager.enableAllUnits();

            _.forEach(self.activeUnitsIndex(), function (unitObservable) {
                var unit = unitObservable();

                if (unit.disabled) {
                    unit.disabled = false;
                    unitObservable.valueHasMutated();
                }
            });

        };

        self.activeUnitsObservable = ko.computed(function () {

            // we peek here to prevent full update on enable / disabled

            var disabledUnits = self.disabledUnits.peek();

            var classic = !api.content.usingTitans();

            var units = _.map(self.activeUnitsInfo(), function (unitInfo) {
                unitInfo.disabled = !!disabledUnits[unitInfo.unit];

                unitInfo.unavailable = classic && unitInfo.titans && !unitInfo.classic;

                unitInfo = ko.observable(unitInfo);

                return unitInfo;
            })

            return units;
        });

        self.activeUnitsIndex = ko.computed(function () {
            return _keyBy(self.activeUnitsObservable(), function (unit) {
                return unit().unit;
            });
        });

        self.sortedFilteredUnits = ko.computed(function () {
            var searchFilter = self.searchFilter().toLowerCase();

            var units = self.activeUnitsObservable();

            if (searchFilter) {
                var searchTerms = false;

                if (searchFilter)
                    searchTerms = _.words(searchFilter, wordsRegEx);

                var searchUsingAnd = model.searchUsingAnd();

                units = _.filter(units, function (unit) {
                    unit = unit();

                    var found = true;

                    if (searchTerms) {
                        found = false;

                        _.forEach(searchTerms, function (searchTerm) {
                            if (searchUsingAnd)
                                found = false;

                            _.forEach(unit.searchable, function (search) {
                                if (search.indexOf(searchTerm) != -1)
                                    found = true;

                                return !found;
                            });

                            return searchUsingAnd ? found : !found;
                        })
                    }

                    return found;
                });
            }

            var sortKey = self.unitsSortKey();

            if (sortKey == 'disabled') {
                units = _.sortByOrder(units, function (unit) {
                    var unit = unit();

                    return (unit.disabled ? 0 : 100000) + unit.sort;
                });
            }
            else {
                units = _.sortBy(units, function (unit) {
                    var unit = unit();
                    return unit[sortKey];
                });
            }

            self.loadUnitImagesDelayed();

            return units;
        });

        //  mod filtering and sorting

        self.sortedFilteredMods = ko.computed(function () {
            var searchFilter = self.searchFilter().toLowerCase();

            var context = self.contextKey();

            var mods = self.selectedTabModsSource();

            if (searchFilter || context) {
                var searchTerms = false;

                if (searchFilter)
                    searchTerms = _.words(searchFilter, wordsRegEx);

                var searchUsingAnd = model.searchUsingAnd();

                mods = _.filter(mods, function (mod) {
                    var mod = mod();

                    if (context && context != mod.context)
                        return false;

                    var found = true;

                    if (searchTerms) {
                        found = false;

                        _.forEach(searchTerms, function (searchTerm) {
                            if (searchUsingAnd)
                                found = false;

                            _.forEach(mod.searchable, function (search) {
                                if (search.startsWith(searchTerm))
                                    found = true;

                                return !found;
                            });

                            return searchUsingAnd ? found : !found;
                        })
                    }

                    return found;
                });
            }

            var sortKey = self.modsSortKey();

            if (sortKey == 'timestamp') {
                if (self.selectedTabIndex() != 'available-mods' || true) {
                    mods = _.sortByOrder(mods, function (mod) {
                        return [mod().timestamp];
                    }, [false]);
                }
            }
            else if (sortKey == 'enabled') {
                mods = _.sortByOrder(mods, function (mod) {
                    var mod = mod();
                    return [mod.installed, mod.enabled, mod.prority];
                }, [true, true, false]);
            }
            // else if ( sortKey == 'priority' )
            // {
            //     mods = _.sortByOrder( mods, function( mod )
            //     {
            //         var mod = mod();

            //         return [ mod[ 'priority' ], mod[ 'name' ]];
            //     }, false );
            // }
            else {
                mods = _.sortBy(mods, function (mod) {
                    return mod()[sortKey];
                });
            }

            self.loadModImagesDelayed();

            return mods;
        });

        // self.sortedFilteredModsObservable = ko.computed( function()
        // {
        //     return _.map( self.sortedFilteredMods(), function( mod )
        //     {
        //         return mod; // ko.observable( mod );
        //     })
        // });

        self.selectedTabMods = ko.computed(function () {
            return self.sortedFilteredMods();
        });

        self.selectedTabIsEmpty = ko.computed(function () {
            return self.selectedTabMods().length == 0;
        });

        // ! mod selection in tab

        self.selectedModIdentifier = ko.computed(function () {
            if (self.selectedTabIsUnits())
                return false;

            return self.selectedTab().selectedModIdentifier();
        });

        self.selectedMod = ko.computed(function () {
            var identifier = self.selectedModIdentifier();

            if (!identifier) {
                return undefined;
            }

            var mod = self.selectedTabModsSourceIndex()[identifier];


            if (!mod) {
                mod = self.availableModsObservableIndex()[identifier];
            }


            if (!mod) {
                console.log('no mod for selectedModIdentifier');
                return undefined;
            }

            return mod();
        });

        self.selectedModUnitCount = ko.computed(function () {
            var selectedMod = self.selectedMod();

            if (!selectedMod || !selectedMod.unitList || !selectedMod.unitList.units) {
                return '';
            }

            var units = selectedMod.unitList.units;

            return units && units.length;
        });

        self.selectedModSize = ko.computed(function () {
            var selectedMod = self.selectedMod();

            if (!selectedMod || !selectedMod.size) {
                return '';
            }

            var size = selectedMod.size / 1024 / 1024;

            if (size < 1) {
                size = '< 1 MB';
            }
            else {
                size = Math.round(size) + ' MB';
            }

            return size;
        });

        self.selectedModHasForumLink = ko.computed(function () {
            var selectedMod = self.selectedMod();

            return selectedMod && selectedMod.forum;
        });

        self.selectedModForumLinkClicked = function () {
            var selectedMod = self.selectedMod();

            if (selectedMod && selectedMod.forum)
                self.openURL(selectedMod.forum);
        };

        self.selectedModGithubLinkClicked = function () {
            var selectedMod = self.selectedMod();

            if (selectedMod && selectedMod.github)
                self.openURL(selectedMod.github);
        };

        //

        self.selectedModHasCompanions = ko.computed(function () {
            var selectedMod = self.selectedMod();

            return selectedMod && selectedMod.companions && selectedMod.companions.length > 0;
        });

        self.selectedModCompanions = ko.computed(function () {
            var selectedMod = self.selectedMod();

            if (!selectedMod || !selectedMod.companions || selectedMod.companions.length == 0) {
                return false;
            }

            return CommunityModsManager.evaluateCompanions(selectedMod);
        });

        self.selectedModCompanionsStatus = ko.computed(function () {
            var result = self.selectedModCompanions();

            return result && result.status;
        });

        //

        self.selectedModHasDependencies = ko.computed(function () {
            var selectedMod = self.selectedMod();

            return selectedMod && selectedMod.dependencies && selectedMod.dependencies.length > 0;
        });

        self.selectedModDependencies = ko.computed(function () {
            var selectedMod = self.selectedMod();

            if (!selectedMod || !selectedMod.dependencies || selectedMod.dependencies.length == 0) {
                return false;
            }

            return CommunityModsManager.evaluateDependencies(selectedMod);
        });

        self.selectedModHasMissingDependencies = ko.computed(function () {
            var selectedModDependencies = self.selectedModDependencies();

            return selectedModDependencies && _.size(selectedModDependencies.missing) > 0;
        });

        self.selectedModDependenciesStatus = ko.computed(function () {
            var result = self.selectedModDependencies();

            return result && result.status;
        });

        self.selectedModConsumers = ko.computed(function () {
            var selectedModIdentifier = self.selectedModIdentifier();

            if (!selectedModIdentifier) {
                return undefined;
            }

            return CommunityModsManager.evaluateInstalledModConsumers(selectedModIdentifier);
        });

        self.selectedModConsumersStatus = ko.computed(function () {
            var result = self.selectedModConsumers();

            return result && result.status;
        });

        self.selectedModHasConsumers = ko.computed(function () {
            var selectedModConsumersStatus = self.selectedModConsumersStatus();

            return selectedModConsumersStatus && selectedModConsumersStatus.length > 0;
        });


        self.selectedModConflictsWithFileSystem = ko.computed(function () {
            var selectedMod = self.selectedMod();

            return selectedMod && selectedMod.conflict; // eturn selectedMod && selectedMod.fileSystem && selectedMod.available;

        });

        self.selectedModIsFileSystemOnly = ko.computed(function () {
            var selectedMod = self.selectedMod();

            return selectedMod && selectedMod.fileSystem && !selectedMod.available; r
        });

        self.selectedModScenes = ko.computed(function () {
            var selectedMod = self.selectedMod();

            return selectedMod && selectedMod.scenes && _.keys(selectedMod.scenes) || [];
        });

        self.selectedModHasScenes = ko.computed(function () {
            return self.selectedModScenes().length > 0;
        });

        self.selectedModSystems = ko.computed(function () {
            var selectedMod = self.selectedMod();

            return selectedMod && selectedMod.systems || [];
        });

        self.selectedModHasSystems = ko.computed(function () {
            return self.selectedModSystems().length > 0;
        });
        //
        self.selectMod = function (data) {
            self.selectedTab().selectedModIdentifier(data.identifier);
        }

        // ! actions

        self.canInstall = ko.computed(function () {
            var selectedMod = self.selectedMod();

            if (!selectedMod) {
                return false;
            }

            if (selectedMod.titansOnly && !api.content.usingTitans()) {
                return false;
            }

            if (selectedMod.classicOnly && api.content.usingTitans()) {
                return false;
            }

            return !selectedMod.installed && !self.selectedModHasMissingDependencies();

        });

        self.canUninstall = ko.computed(function () {
            var selectedMod = self.selectedMod();

            return selectedMod && selectedMod.installed && !selectedMod.fileSystem;

        });

        self.canEnableMod = ko.computed(function () {
            var selectedMod = self.selectedMod();

            if (!selectedMod) {
                return false;
            }

            if (selectedMod.titansOnly && !api.content.usingTitans()) {
                return false;
            }

            if (selectedMod.classicOnly && api.content.usingTitans()) {
                return false;
            }

            return selectedMod.installed && !selectedMod.conflict && !selectedMod.enabled && !self.selectedModHasMissingDependencies() && !(!self.selectedTabModsSourceIsInstalled() && self.selectedModConflictsWithFileSystem());
        });

        self.canDisableMod = ko.computed(function () {
            var selectedMod = self.selectedMod();

            return selectedMod && selectedMod.installed && selectedMod.enabled && !(!self.selectedTabModsSourceIsInstalled() && self.selectedModConflictsWithFileSystem());
        });

        //

        self.updateInstalledModsObservables = function (mods) {
            _.forEach(mods, function (identifier) {
                var installedMod = self.installedModsObservableIndex()[identifier];

                if (!installedMod) {
                    console.log('No installed mod to update???');
                    return;
                }

                installedMod.valueHasMutated();
            });

        }

        self.updateAvailableModsObservables = function (mods) {
            _.forEach(mods, function (identifier) {
                var availableMod = self.availableModsObservableIndex()[identifier];

                if (!availableMod) {
                    var possibleHiddenMod = self.availableModsIndex()[identifier];

                    if (!possibleHiddenMod) {
                        console.log('No available mod to update for ' + identifier + '???');
                    }
                    return;
                }

                availableMod.valueHasMutated();
            });

        }

        self.installSelectedMod = function () {
            var mod = self.selectedMod();

            if (!mod) {
                return false;
            }

            // true = do not mutate available

            var updatedMods = CommunityModsManager.activateModWithDependencies(mod, model.selectedModDependencies(), true);

            // installed mods will change triggering UI updates

            // update available mods UI

            self.updateAvailableModsObservables(updatedMods);

        }

        self.uninstallSelectedMod = function () {
            var mod = self.selectedMod();

            if (!mod) {
                return false;
            }

            // true = do not mutate available

            var updatedMods = CommunityModsManager.uninstallModWithConsumers(mod, model.selectedModConsumers(), true);

            // installed mods will change triggering UI updates

            // update available mods UI

            self.updateAvailableModsObservables(updatedMods);
        }

        self.enableSelectedMod = function () {
            var mod = self.selectedMod();

            if (!mod) {
                return false;
            }

            // ftrue = do not mutate available

            var updatedMods = CommunityModsManager.activateModWithDependencies(mod, model.selectedModDependencies(), true);

            // update UI

            self.updateAvailableModsObservables(updatedMods);
            self.updateInstalledModsObservables(updatedMods);

        }

        self.disableSelectedMod = function () {
            var mod = self.selectedMod();

            if (!mod) {
                return false;
            }

            // true = do not mutate available

            var updatedMods = CommunityModsManager.disableModWithConsumers(mod, model.selectedModConsumers(), true);

            // update UI

            self.updateAvailableModsObservables(updatedMods);
            self.updateInstalledModsObservables(updatedMods);
        }

        self.showHelp = ko.computed(function () {
            var result = (self.selectedTabIsUnits() && !self.selectedUnit()) || (!self.selectedTabIsUnits() && !self.selectedMod());
            return result;
        });

        self.canReloadFileSystemMods = ko.observable(false);
        //

        self.reloadFileSystemMods = function () {
            self.canReloadFileSystemMods(false);
            CommunityModsManager.reloadFileSystemMods().always(function () {
                self.canReloadFileSystemMods(true);
            });
        }

        // navigation

        self.back = function (data, event) {
            CommunityModsManager.busy2(true);

            _.delay(function () {
                // true, true = update zip mods, download client zip mod, remount client mods and download server mod zip

                CommunityModsManager.updateActiveZipMods(true, true).always(function (results) {
                    CommunityModsManager.checkUberbar(true);

                    window.location.href = 'coui://ui/main/game/start/start.html';
                    return;
                });
            }, 200);
        };

        self.setup = function () {
            if (self.offlineMode()) {
                console.log('Community Mods in offline mode');
                self.canReloadFileSystemMods(true);
                CommunityModsManager.busy2(false);

                CommunityModsManager.loadAvailableMods(true).done(function () {
                    self.offlineMode(false);
                });
            }
            else {
                CommunityModsManager.loadAvailableMods(false).fail(function () {
                    self.offlineMode(true);
                }).always(function () {
                    self.canReloadFileSystemMods(true);
                });
            }

            self.showTabKey('units');

            // we made it this far so remove back onclick handler

            $('#back').prop('onclick', null).off('click');
        }

        self.openWebsite = function () {
            engine.call('web.launchPage', 'https://planetaryannihilation.com/');
        }

        self.openLegionExpansion = function () {
            engine.call('web.launchPage', 'https://exodusesports.com/article/legion-expansion-community-faction-mod/');
        }
    }

    model = new CommunityModsViewModel();

    model.setup();

    handlers = {};

    app.registerWithCoherent(model, handlers);

    ko.applyBindings(model);

}

$(document).ready(function () {
    CommunityMods();
});