var model;
var handlers;

$(document).ready(function () {

    var CASE_NAMES = [
        'ZeroByte',
        'SmallFastPath',
        'BoundaryJustUnderThreshold',
        'BoundaryAtChunkSize',
        'ModerateMultiChunk',
        'TenMegabyteBundle',
        'LargeSimulatedModBundle',
        'MixedSequence',
        'TwoChunkedBackToBack',
        'Bidirectional'
    ];

    function CaseRow(name) {
        var self = this;
        self.name = name;
        self.status = ko.observable('pending');
        self.message = ko.observable('');
        self.durationMs = ko.observable(0);

        self.statusLabel = ko.computed(function () {
            return self.status();
        });
        self.statusClass = ko.computed(function () {
            return 'status_' + self.status();
        });
        self.durationLabel = ko.computed(function () {
            var d = self.durationMs();
            return d > 0 ? d + ' ms' : '';
        });
    }

    function SteamP2PTestViewModel() {
        var self = this;

        self.lastSceneUrl = ko.observable().extend({ session: 'last_scene_url' });

        self.cases = ko.observableArray(_.map(CASE_NAMES, function (n) { return new CaseRow(n); }));

        self.caseByName = {};
        _.each(self.cases(), function (c) { self.caseByName[c.name] = c; });

        self.logLines = ko.observableArray([]);
        self.logText = ko.computed(function () {
            return self.logLines().join('\n');
        });

        self.anyRunning = ko.computed(function () {
            return _.some(self.cases(), function (c) { return c.status() === 'running' || c.status() === 'started'; });
        });

        self.appendLog = function (line) {
            var stamp = new Date().toISOString().slice(11, 23);
            self.logLines.push('[' + stamp + '] ' + line);
            while (self.logLines().length > 200)
                self.logLines.shift();
        };

        self.runOne = function (row) {
            self.appendLog('run ' + row.name);
            row.status('running');
            row.message('');
            row.durationMs(0);
            engine.call('dev.steam_p2p_test.run', row.name);
        };

        self.runAll = function () {
            if (self.anyRunning())
                return;
            self.appendLog('run_all (' + CASE_NAMES.length + ' cases)');
            _.each(self.cases(), function (c) {
                c.status('pending');
                c.message('');
                c.durationMs(0);
            });
            engine.call('dev.steam_p2p_test.run_all');
        };

        self.cancelRun = function () {
            self.appendLog('cancel');
            engine.call('dev.steam_p2p_test.cancel');
        };

        self.resetResults = function () {
            if (self.anyRunning())
                return;
            _.each(self.cases(), function (c) {
                c.status('pending');
                c.message('');
                c.durationMs(0);
            });
            self.logLines.removeAll();
        };

        self.back = function () {
            var last = self.lastSceneUrl();
            self.lastSceneUrl(window.location.href);
            window.location.href = last || 'coui://ui/main/game/start/start.html';
        };

        self.onResult = function (payload) {
            var row = self.caseByName[payload['case']];
            if (!row)
                return;
            row.status(payload.status);
            row.message(payload.message || '');
            if (payload.durationMs)
                row.durationMs(payload.durationMs);
            self.appendLog(payload['case'] + ': ' + payload.status
                + (payload.message ? ' — ' + payload.message : '')
                + (payload.durationMs ? ' (' + payload.durationMs + ' ms)' : ''));
        };
    }

    handlers = {};

    handlers.dev_steam_p2p_result = function (payload) {
        model.onResult(payload);
    };

    model = new SteamP2PTestViewModel();

    app.registerWithCoherent(model, handlers);

    ko.applyBindings(model);
});
