// !LOCNS:live_game
var model;
var handlers = {};

$(document).ready(function () {

    function BuildItem(params) {
        var self = this;

        params = params || {};
        _.assign(this, params);
        self.count = ko.observable(0);
        self.hotkey = ko.observable('');
        self.empty = ko.observable(true);
        self.filled = ko.computed(function() { return !self.empty(); });
        self.active = ko.observable(false);
        self.visible = ko.observable(false);
        self.buildIcon = ko.observable(params.buildIcon || '');
    }

    function BuildTab(group, label, skipLastRow) {
        var self = this;

        self.group = ko.observable(group);
        self.items = ko.observableArray();
        self.label = ko.observable(label);
        self.hotkey = ko.observable('');
        self.active = ko.observable(false);
        self.visible = ko.observable(false);
        self.itemCount = ko.observable(BuildTab.ITEMS_PER_ROW * BuildTab.ROWS_PER_TAB); // deprecated
        self.skipLastRow = ko.observable(!!skipLastRow); // deprecated
        self.maxColumns = 0;
    }

    BuildTab.ROWS_PER_TAB = 3; // deprecated
    BuildTab.ITEMS_PER_ROW = 6; // deprecated

    function BuildSet(params) {
        var units = params.units;
        var buildLists = params.buildLists;
        var grid = params.grid;
        var specTag = params.specTag;
        var self = this;

        self.units = units;
        // buildLists captured later
        self.grid = grid;
        self.specTag = specTag;

        // Maps a spec in the current selection to a build list
        self.selectedSpecs = ko.observable({});
        // Maps a build item spec id to a BuildItem
        self.buildItems = ko.observable({});
        // Maintains the tab list
        self.tabs = ko.observableArray(
            BuildSet.tabsTemplate.map(function(template) {
                return new model.BuildTab(template[0], template[1], template[2])
            })
        );
        self.tabOrder = _.invert(self.tabs().map(function(tab) {
            return tab.group()
        }));

        var maxRows = 0;

        var buildItems = self.buildItems();

        _.forIn(grid, function(tabInfo, spec)
        {
            var unit = units[spec + specTag];
            if (!unit)
                return;
            var item = new model.BuildItem(unit);
            var tab = self.tabs()[self.tabOrder[item.buildGroup]];
            if (!tab)
            {
                self.tabOrder[item.buildGroup] = self.tabs().length;
                tab = new model.BuildTab(item.buildGroup);
                self.tabs().push(tab);
            }

            var items = tab.items();
            var row = item.buildRow;
            var column = item.buildColumn;

            if (!items[row])
                items[row] = [];

            items[row][column] = item;

            tab.maxColumns = Math.max(tab.maxColumns, column + 1);

            buildItems[unit.id] = item;
            maxRows = Math.max(maxRows, row + 1);
        });

        // add empty

        _.forEach(self.tabs(), function(tab)
        {
            var maxColumns = tab.maxColumns;

            var items = tab.items();

            for (var row = 0; row < maxRows; row++)
            {
                var rowItems = items[row];

                if (!rowItems)
                    rowItems = items[row] = [];

                for (var column = 0; column < maxColumns; column++)
                {
                    if (!rowItems[column])
                        rowItems[column] = new model.BuildItem({buildRow: row, buildColumn: column});
                }
            }

            tab.items(items);

            // tab.items(_.times(tab.itemCount(), function(index) {
            //     return items[index] || new model.BuildItem();
            // }));
        });

        self.selectedSpecs.subscribe(function(selected)
        {
            var items = self.buildItems();
            var visibleItems = {};

            _.forIn(items, function(item, spec)
            {
                item.visible(false);
                item.empty(true);
            });

            var tabs = self.tabs();
            var visibleTabs = {};

            for (var i = 0; i < tabs.length; i++)
            {
                var tab= tabs[i];
                tab.visible(false);
                tab.firstColumn = tab.maxColumns;
                tab.lastColumn = 0;
            }

            if (_.isEmpty(selected))
                return;

            var firstRow = maxRows;
            _.forIn(selected, function(units, spec)
            {
                _.forEach(buildLists[spec], function(unit)
                {
                    var buildSpec = unit.id;
                    if (visibleItems[buildSpec])
                        return;
                    visibleItems[buildSpec] = true;
                    var item = items[buildSpec];
                    if (!item)
                        return;
                    item.visible(true);
                    item.empty(false);
                    firstRow = Math.min(unit.buildRow, firstRow);

                    var tabIndex = self.tabOrder[item.buildGroup];
                    var tab = tabs[tabIndex];

                    tab.firstColumn = Math.min(unit.buildColumn, tab.firstColumn);
                    tab.lastColumn = Math.max(unit.buildColumn, tab.lastColumn);

                    if (!visibleTabs[unit.buildGroup])
                    {
                        visibleTabs[unit.buildGroup] = tab;
                        if (tab)
                            tab.visible(true);
                    }
                });
            });

            // show empty items

            _.forEach(visibleTabs, function (tab)
            {
                var firstColumn = tab.firstColumn;
                var lastColumn = tab.lastColumn;

                var items = tab.items();

                for (var row = 0; row < maxRows; row++)
                {
                    var rowItems = items[row];

                    var visible = row >= firstRow;

                    for (var column = 0; column < rowItems.length; column++)
                    {
                        // rowItems[column].visible(visible);
                        rowItems[column].visible(visible && column >= firstColumn && column <= lastColumn);
                    }
                }

                // _.forEach(tab.items(), function(item, index)
                // {
                //     var show = index >= minIndex;

                //     if (show & tab.skipLastRow())
                //         show = ((index + 1) % BuildTab.ITEMS_PER_ROW) != 0;

                //     item.visible(show);
                // });
            });
        });

        self.tabsByGroup = ko.computed(function()
        {
            return _.transform(self.tabs(), function(result, tab, index) {
                result[tab.group()] = tab;
            }, {});
        });

        self.empty = ko.computed(function() {
            return _.isEmpty(self.selectedSpecs());
        });

        self.buildLists = buildLists;
        self.gwCoopResolutionLogSeen = {};

        self.logGwCoopResolutionOnce = function(kind, fromId, toId) {
            var key = kind + '|' + fromId + '|' + (toId || '');
            if (self.gwCoopResolutionLogSeen[key]) {
                return;
            }

            self.gwCoopResolutionLogSeen[key] = true;
            console.log('[GW COOP] build_bar ' + kind + ' from=' + fromId + ' to=' + (toId || '') + ' tag=' + (self.specTag || '.player'));
        };

        self.parseSelection = function(selection)
        {
            var curSpecs = self.selectedSpecs();
            var removeSpecs = _.clone(curSpecs);
            var addSpecs = {};

            var resolveBuildSpecId = function(id) {
                if (self.buildLists[id])
                    return id;

                var currentTag = self.specTag || '.player';

                // Fallback across tagged/untagged ids:
                // foo/bar/unit.json.player <-> foo/bar/unit.json
                var strip = /(.*\.json)[^\/]*$/.exec(id);
                if (strip && strip[1]) {
                    if (self.buildLists[strip[1] + currentTag]) {
                        self.logGwCoopResolutionOnce('resolveBuildSpecId canonical+current tag fallback', id, strip[1] + currentTag);
                        return strip[1] + currentTag;
                    }
                    if (self.buildLists[strip[1] + '.player']) {
                        self.logGwCoopResolutionOnce('resolveBuildSpecId canonical+player fallback', id, strip[1] + '.player');
                        return strip[1] + '.player';
                    }
                    if (self.buildLists[strip[1] + '.ai']) {
                        self.logGwCoopResolutionOnce('resolveBuildSpecId canonical+ai fallback', id, strip[1] + '.ai');
                        return strip[1] + '.ai';
                    }
                }

                if (strip && strip[1] && self.buildLists[strip[1]])
                {
                    self.logGwCoopResolutionOnce('resolveBuildSpecId canonical fallback', id, strip[1]);
                    return strip[1];
                }

                if (self.buildLists[id + currentTag])
                {
                    self.logGwCoopResolutionOnce('resolveBuildSpecId current tag fallback', id, id + currentTag);
                    return id + currentTag;
                }
                if (self.buildLists[id + '.player'])
                {
                    self.logGwCoopResolutionOnce('resolveBuildSpecId player fallback', id, id + '.player');
                    return id + '.player';
                }
                if (self.buildLists[id + '.ai'])
                {
                    self.logGwCoopResolutionOnce('resolveBuildSpecId ai fallback', id, id + '.ai');
                    return id + '.ai';

                }

                self.logGwCoopResolutionOnce('resolveBuildSpecId unresolved', id);
                return null;
            };

            var resolveBuildItemId = function(id, items) {
                if (items[id])
                    return id;

                var currentTag = self.specTag || '.player';
                var strip = /(.*\.json)[^\/]*$/.exec(id);
                if (strip && strip[1]) {
                    if (items[strip[1] + currentTag]) {
                        self.logGwCoopResolutionOnce('resolveBuildItemId canonical+current tag fallback', id, strip[1] + currentTag);
                        return strip[1] + currentTag;
                    }
                    if (items[strip[1] + '.player']) {
                        self.logGwCoopResolutionOnce('resolveBuildItemId canonical+player fallback', id, strip[1] + '.player');
                        return strip[1] + '.player';
                    }
                    if (items[strip[1] + '.ai']) {
                        self.logGwCoopResolutionOnce('resolveBuildItemId canonical+ai fallback', id, strip[1] + '.ai');
                        return strip[1] + '.ai';
                    }
                }

                if (strip && strip[1] && items[strip[1]])
                {
                    self.logGwCoopResolutionOnce('resolveBuildItemId canonical fallback', id, strip[1]);
                    return strip[1];
                }

                if (items[id + currentTag])
                {
                    self.logGwCoopResolutionOnce('resolveBuildItemId current tag fallback', id, id + currentTag);
                    return id + currentTag;
                }
                if (items[id + '.player'])
                {
                    self.logGwCoopResolutionOnce('resolveBuildItemId player fallback', id, id + '.player');
                    return id + '.player';
                }
                if (items[id + '.ai'])
                {
                    self.logGwCoopResolutionOnce('resolveBuildItemId ai fallback', id, id + '.ai');
                    return id + '.ai';

                }

                self.logGwCoopResolutionOnce('resolveBuildItemId unresolved', id);
                return null;
            };

            // Calculate the spec delta
            _.forIn(selection.spec_ids, function(count, id)
            {
                var resolvedId = resolveBuildSpecId(id);
                if (!resolvedId)
                    return;

                if (removeSpecs[resolvedId] || curSpecs[resolvedId])
                {
                    delete removeSpecs[resolvedId];
                    return;
                }

                addSpecs[resolvedId] = self.buildLists[resolvedId];
            });

            var addEmpty = _.isEmpty(addSpecs);
            var removeEmpty = _.isEmpty(removeSpecs);
            if (!addEmpty || !removeEmpty)
            {
                if (!removeEmpty)
                {
                    _.forIn(removeSpecs, function(build, id)
                    {
                        delete curSpecs[id];
                    });
                }
                if (!addEmpty)
                {
                    _.assign(curSpecs, addSpecs);
                }
                self.selectedSpecs.notifySubscribers(curSpecs);
            }

            // Update counts
            var buildItems = self.buildItems();
            var clears = _.transform(buildItems, function(result, item, id) { result[id] = item.count(); });
            _.forIn(selection.build_orders, function(count, id)
            {
                var resolvedBuildId = resolveBuildItemId(id, buildItems);
                if (!resolvedBuildId)
                    return;

                if (count)
                    delete clears[resolvedBuildId];
                buildItems[resolvedBuildId].count(count);
            });
            _.forIn(clears, function(value, id)
            {
                if (value)
                    buildItems[id].count(0);
            });
        };

        self.hasTab = function(group)
        {
            return !!self.tabsByGroup()[group];
        };
    }

    BuildSet.tabsTemplate = [
        ['factory', '!LOC:factory', true],
        ['combat', '!LOC:combat', true],
        ['utility', '!LOC:utility', true],
        ['vehicle', '!LOC:vehicle'],
        ['bot', '!LOC:bot'],
        ['air', '!LOC:air'],
        ['sea', '!LOC:sea'],
        ['orbital', '!LOC:orbital', true],
        ['orbital_structure', 'orbital structure', true],
        ['ammo', '!LOC:ammo', true]
    ];

    function BuildBarViewModel() {
        var self = this;
        self.gwCoopMode = ko.observable(false).extend({ session: 'gw_coop_mode' });
        self.gwCampaignUnitSpecTag = ko.observable('.player').extend({ session: 'gw_campaign_unit_spec_tag' });

        self.unitSpecs = $.Deferred();
        self.getSpecTag = api.game.getUnitSpecTag().then(function(tag) {
            var sessionTag = self.gwCampaignUnitSpecTag();
            if (self.gwCoopMode()) {
                self.specTag = tag && tag !== '.player' ? tag : (sessionTag || tag || '.player');
            }
            else {
                self.specTag = tag;
            }
            console.log('[GW COOP] build_bar spec tag resolved apiTag=' + tag + ' sessionTag=' + sessionTag + ' gwCoopMode=' + self.gwCoopMode() + ' finalTag=' + self.specTag);
        });

        self.buildSet = ko.observable();

        self.buildHotkeyModel = new Build.HotkeyModel();

        self.showBuildBar = ko.computed(function() {
            return self.buildSet() && !self.buildSet().empty();
        });

        self.activeBuildGroup = ko.observable('');
        self.activeBuildGroupLocked = ko.observable(false);

        self.activeTab = ko.computed(function() {
            if (!self.activeBuildGroup() || !self.buildSet())
                return;
            return self.buildSet().tabsByGroup()[self.activeBuildGroup()];
        });
        self.activeBuildList = ko.computed(function() {
            var tab = self.activeTab();
            return tab && tab.items();
        });
        ko.computed(function() {
            if (!self.buildSet())
                return;
            var activeTab = self.activeTab();
            _.forEach(self.buildSet().tabs(), function(tab) {
                tab.active(tab === activeTab);
            });
        });

        self.activeBuildId = ko.observable();
        ko.computed(function() {
            if (!self.buildSet())
                return;
            var activeId = self.activeBuildId();
            _.forEach(self.buildSet().buildItems(), function(item) {
                item.active(item.id === activeId);
            });
        });

        self.executeStartBuild = function (event, item)
        {
            api.Panel.message(api.Panel.parentId, "build_bar.build", {
                item: item.id,
                batch: event.shiftKey,
                cancel: event.button === 2,
                urgent: event.ctrlKey,
                more: item.count > 0
            });
        };

        self.selectBuildGroup = function(group) {
            api.Panel.message(api.Panel.parentId, "build_bar.select_group", group);
        };

        self.setBuildHover = function(id) {
            api.Panel.message(api.Panel.parentId, 'build_bar.set_hover', id);
        };
        self.clearBuildHover = function(id) {
            self.setBuildHover('');
        };

        self.clearBuildSequence = function () {
            self.activeBuildGroup(null);
            self.activeBuildGroupLocked(false);
        };

        self.startBuildSequence = function(params) {
            var group = params.group;
            var locked = params.locked;

            var tab = self.buildSet().tabsByGroup()[group];
            if (!tab.visible())
                return;

            self.activeBuildGroup(group);
            if (locked)
                self.activeBuildGroupLocked(locked);
        };

        self.buildItem = function (payload)
        {
            var row, column;

            if (_.isObject(payload))
            {
                row = payload.row;
                column = payload.column;
            }
            else if (_.isNumber(payload))
            {
                row = Math.floor(payload / 6);
                column = payload % 6
            }
            else
                return;

            var items = self.activeBuildList();

            if (!items)
                return;

            var item = items[row][column];

            if (!item || !item.id || !item.filled())
                return;

            self.activeBuildGroupLocked(true);

            return item.id;
        };

        self.parseSelection = function(payload) {
            var buildSet = self.buildSet();

            buildSet.parseSelection(payload, self.buildLists);

            if (!buildSet.hasTab(self.activeBuildGroup())) {
                self.activeBuildGroup(null);
                self.clearBuildSequence();
            }

            api.Panel.onBodyResize();
            _.delay(api.Panel.onBodyResize);
        };

        self.hotkeys = ko.observable({});

        self.computeHotkeys = function()
        {
            var result = {};

            _.forIn(input_maps.build.keymap, function(name, hotkey)
            {
                result['item_' + /build_item_(.*)/.exec(name).pop()] = hotkey;
            });

            _.forEach(['build structure', 'build unit'], function (group)
            {
                _.forIn(input_maps[group].keymap, function (name, hotkey)
                {
                    if (/_unit$/.test(name))
                        name = name.replace('_unit', '');
                    result['tab_' + /start_build_(.*)/.exec(name).pop()] = hotkey;
                });
            });

            self.hotkeys(result);
        };
        self.computeHotkeys();
        input_maps_reload.progress(self.computeHotkeys);

        ko.computed(function()
        {
            var buildSet = self.buildSet();
            if (!buildSet)
                return;
            var hotkeys = self.hotkeys();
            var activeTab = self.activeTab();

            // Get tab hotkeys
            _.forEach(buildSet.tabs(), function(tab)
            {
                tab.hotkey(hotkeys['tab_' + tab.group()] || '');
            });

            // Clear out all current build items
            _.forEach(buildSet.buildItems(), function(item)
            {
                item.hotkey('');
            });

            // Get the active tab build item hotkeys

            if (activeTab)
            {
                var items = activeTab.items();

                for (var row = 0; row < items.length; row++)
                {
                    var rowItems = items[row];

                    for (var column = 0; column < rowItems.length; column++)
                    {
                        // legacy key binds use index into 3 x 6 grid
                        rowItems[column].hotkey(hotkeys['item_' + ((row < 3 && column < 6) ? 1 + row * 6 + column : (1 + row) + '_' + (1 + column))] || '');
                    }
                }
            }
            // var count = 0;
            // _.forEach(activeTab && activeTab.items(), function(item, index) {
            //     if (item) {
            //         item.hotkey(hotkeys['item_' + (count + 1).toString()] || '');
            //     }
            //     count++;
            // });
        });

        self.processUnitSpecs = function(payload) {
            // Fix up cross-unit references
            function crossRef(units) {
                for (var id in units) {
                    var unit = units[id];
                    unit.id = id;
                    if (unit.build) {
                        for (var b = 0; b < unit.build.length; ++b) {
                            var ref = units[unit.build[b]];
                            if (!ref) {
                                ref = { id: unit.build[b] };
                                units[ref.id] = ref;
                            }
                            unit.build[b] = ref;
                        }
                    }
                    if (unit.projectiles) {
                        for (var p = 0; p < unit.projectiles.length; ++p) {
                            var ref = units[unit.projectiles[p]];
                            if (!ref) {
                                ref = { id: unit.projectiles[p] };
                                units[ref.id] = ref;
                            }
                            unit.projectiles[p] = ref;
                        }
                    }
                }
            }
            crossRef(payload);

            var misc_unit_count = 0;

            function addBuildInfo(unit, id) {
                unit.buildIcon = Build.iconForUnit(unit);

                // Remove spec tag. (foo/bar/baz.json.ai -> foo/bar/baz.json)
                var strip = /(.*\.json)[^\/]*$/.exec(id);
                if (_.size(strip) > 1)
                    id = strip[1];
                var target = self.buildHotkeyModel.SpecIdToGridMap()[id];
                if (!target) {
                    target = ['misc', misc_unit_count, {row: 0, column: misc_unit_count}];
                    misc_unit_count++;
                }

                unit.buildGroup = target[0];
                var buildIndex = unit.buildIndex = target[1]; // deprecated

                // fall back if build.js has been shadowed

                var buildOptions = target[2] || { row: Math.floor( buildIndex / 6), column: buildIndex % 6 };

                unit.buildRow = buildOptions.row;
                unit.buildColumn = buildOptions.column;
            };

            for (var id in payload) {
                addBuildInfo(payload[id], id);
            }

            function makeBuildLists(units) {
                var result = {};
                for (var id in units) {
                    var unit = units[id];
                    if (!unit.build && !unit.projectiles)
                        continue;

                    var rawList = [];

                    _.forEach(['build', 'projectiles'], function (element) {
                        if (unit[element]) {
                            for (var b = 0; b < unit[element].length; ++b) {
                                var target = unit[element][b];
                                if (typeof (target) === 'string')
                                    continue;

                                rawList.push(target);
                            }
                        }
                    });

                    var build = _.filter(rawList, function (element) {
                        return (element.buildGroup !== 'misc');
                    });
                    if (build.length)
                        result[id] = build;
                }
                return result;
            }

            var buildLists = makeBuildLists(payload);
            self.buildSet(new model.BuildSet({
                units: payload,
                buildLists: buildLists,
                grid: self.buildHotkeyModel.SpecIdToGridMap(),
                specTag: self.specTag
            }));
        };
        self.unitSpecs.then(function(payload) {
            $.when(self.getSpecTag).then(function() {
                return self.processUnitSpecs(payload);
            });
        });

        self.BuildItem = BuildItem;
        self.BuildTab = BuildTab;
        self.BuildSet = BuildSet;

        self.active = ko.observable(true);

        self.buildBarImageScale = ko.observable(1);

        self.buildBarScaleCss = ko.computed(function()
        {
            return 60 * self.buildBarImageScale() + 'px';
        });

        self.refreshSettings = function()
        {
            self.buildBarImageScale(api.settings.getSynchronous('ui', 'buildbar_scale') || 1.0);
        }

        self.setup = function ()
        {
            self.refreshSettings();

            $(window).focus(function() { self.active(true); });
            $(window).blur(function () { self.active(false); });

            if (self.unitSpecs.state() != 'resolved')
                engine.call('request_spec_data', api.Panel.pageId);

            /* prevent the build bar from scrolling. */
            function sqelch (e) {
                e.preventDefault(e);
            }

            if (window.addEventListener)
                window.addEventListener('DOMMouseScroll', sqelch, false);
            window.onmousewheel = document.onmousewheel = sqelch;
        };
    }
    model = new BuildBarViewModel();

    handlers.selection = function(payload) {
        $.when(
            model.unitSpecs,
            model.getSpecTag
        ).then(function() {
            model.parseSelection(payload);
        });
    };

    handlers.unit_specs = function (payload)
    {
        delete payload.message_type;
        $.when(model.getSpecTag).then(function() {
            var tag = model.specTag || '.player';
            var keys = _.keys(payload || {});
            var taggedCount = _.filter(keys, function(key) {
                return _.isString(key) && tag && key.slice(-tag.length) === tag;
            }).length;
            console.log('[GW COOP] build_bar unit_specs received count=' + keys.length + ' tag=' + tag + ' taggedCount=' + taggedCount);
            model.unitSpecs.resolve(payload);
        });
    };

    handlers.clear_build_sequence = model.clearBuildSequence;
    handlers.start_build_sequence = model.startBuildSequence;
    handlers.build_item = model.buildItem;
    handlers.active_build_id = model.activeBuildId;
    handlers.refresh_settings = model.refreshSettings;

    // volunteer to let the preview holodeck be in front of us
    preview.injectClipHandler(handlers, [0, 31]);

    // inject per scene mods
    if (scene_mod_list['live_game_build_bar'])
        loadMods(scene_mod_list['live_game_build_bar']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});
