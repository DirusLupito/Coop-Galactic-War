var model;

$(document).ready(function () {
    var currentTimeSeconds = UberUtility.getCurrentTimeObservable();

    function LeagueModel(leaderboard, league)
    {
        var self = this;
        self.players = ko.observableArray();
        self.size = ko.observable(0);
        self.displaySize = ko.computed(function() {
            if (self.size() === 1)
                return '!LOC:One ranked player at this level.';
            else if (self.size() === 0)
                return '!LOC:No ranked players at this level.';
            else
                return ['!LOC:__num_players__ ranked players at this level.', { num_players: self.size() }];
        });

        self.showYourselfException = ko.computed(function() {
            var playerLeague = leaderboard.playerRatingInfo().League;

            return playerLeague === league && leaderboard.playerLeaguePosition() > self.players().length;
        });

        self.showLeaderboardLoading = ko.observable(true);
        self.showLeaderboardError = ko.observable(false);

        self.showLeaderboardEmpty = ko.computed(function() {
            return !self.showLeaderboardError() && !self.showLeaderboardLoading() && self.players().length === 0;
        });

        self.showLeaderboard = ko.computed(function() {
            return !self.showLeaderboardError() && !self.showLeaderboardLoading() && !self.showLeaderboardEmpty();
        });
    }

    function LeaderboardViewModel() {
        var self = this;

        // This is populated by start.js.
        self.playerDisplayName = ko.observable('').extend({ session: 'displayName' });

        // This one is populated by start.js, but we update it.
        self.playerRatingInfo = ko.observable({}).extend({ session: 'playerRatingInfo' });

        // Tracked for knowing where we've been for pages that can be accessed in more than one way
        self.lastSceneUrl = ko.observable().extend({ session: 'last_scene_url' });

        self.leagues = {};

        self.allowRanked = ko.computed( function()
        {
            return api.content.usingTitans() && api.net.uberId().length > 0;
        });

        self.playerInactive = ko.computed(function()
        {
            var info = self.playerRatingInfo();

            if ( ! info )
                return undefined;

            return info.Inactive;
        });

        self.playerInactiveDays = ko.computed( function()
        {
            var info = self.playerRatingInfo();

            if ( ! info )
                return undefined;

            if ( ! info.Inactive )
                return undefined;

            if ( info.InactiveDays )
                return info.InactiveDays;

            var lastMatchAt = info.LastMatchAt;

            if ( !lastMatchAt )
                return undefined;

            var last = Date.parse( lastMatchAt );

            if ( ! last )
                return undefined;

            var inactive = ( Date.now() - last - 14 * 24 * 60 * 60 * 1000 ) / ( 24 * 60 * 60 * 1000 );

            return inactive;
        });

        self.playerBadgeOpacity = ko.computed( function()
        {
            var info = self.playerRatingInfo();

            if ( ! info || info.League == -1)
                return 0.4;

            if (info.League == 0)
                return Math.max( 0.4, info.GameCount / MatchmakingUtility.getMinimumGames() );

            if (!info.Inactive)
                return 1.0;

            var inactiveDays = self.playerInactiveDays();

            if ( inactiveDays == undefined )
                return 0.4;

            if ( inactiveDays <= 0 )
                return 1.0;

            return opacity = Math.max( 0.4, 1 - inactiveDays / 14 );
        });

        self.playerRankInactive = self.playerInactive;

        self.playerRating = ko.computed(function() {
            var rating = self.playerRatingInfo().StableRating || 0;
            if (rating > 0)
                return Math.round(rating);
            return '?';
        });

        self.playerLeaguePosition = ko.computed(function() {
            var position = self.playerRatingInfo().LeaguePosition | 0;
            if (position > 0)
                return position;
            if (self.playerInactive())
                return loc("!LOC:Inactive");
            return '?';
        });

        self.playerRankPosition = self.playerLeaguePosition;

        self.playerBadge = ko.computed(function() {
            var league = self.playerRatingInfo().League;
            // if (league < 0)
            //     return MatchmakingUtility.getBadgeSlotURL();
            return MatchmakingUtility.getBadgeURL(league);
        });

        self.playerBadgeTitle = ko.computed(function() {
            var league = self.playerRatingInfo().League;
            // if (league == -1)
            //     return loc("!LOC:Unrank");
            // if (league < 1)
            //     return loc("!LOC:Unranked");
            return MatchmakingUtility.getTitle(league);
        });

        self.playerGameCount = ko.computed(function()
        {
            var info = self.playerRatingInfo();

            if (!info || info.GameCount == undefined)
                return '?';

            return info.GameCount;
        });

        self.playerHasRank = ko.computed(function()
        {
            var league = self.playerRatingInfo().League;
            return league > 0;
        });

        self.playerLastMatchPlayed = ko.computed(function()
        {
            var info = self.playerRatingInfo();

            if (!info || !info.LastMatchAt)
                return '?';

            if (self.yourself)
                return self.yourself.timeSinceLastGame();

            return info.LastMatchAt;
        });

        self.playerIsProvisional = ko.computed(function()
        {
            var info = self.playerRatingInfo();

            if (!info)
                return false;

            return info.league < 0;
        });

        self.playerMessage = ko.computed(function()
        {
            var info = self.playerRatingInfo();

            if (!info)
                return '';

            return info.League < 1 ? loc('!LOC:You need to play __number__ ranked games to receive a rank', { number: MatchmakingUtility.getMinimumGames() }) : '';
        });

        self.yourEntry = {
            LastMatchAt: ko.computed(function() { return self.playerRatingInfo().LastMatchAt; }),
            LastLobbyId: ko.computed(function() { return self.playerRatingInfo().LastLobbyId; }),
            LastRankChange: ko.computed(function() { return self.playerRatingInfo().LastRankChange; }),
            UberId: api.net.uberId(),
            UserId: api.net.uberId()
        };

        self.yourself = new LeaderboardUtility.RankedPlayerModel(self.playerLeaguePosition, self.playerDisplayName, self.yourEntry);

        // Click handler for back button
        self.back = function () {
            window.location.href = 'coui://ui/main/game/start/start.html';
            return; /* window.location.href will not stop execution. */
        };

        self.getPlayerStats = function ()
        {
            LeaderboardUtility.getPlayerStats(MatchmakingUtility.getMatchmakingStatsType(), api.net.uberId())
            .done(function (data){
                if (data)
                    self.playerRatingInfo(data);
            }).fail(function (data) {
                console.error('get player rank fail');
            });
        };

        self.getPlayerInfo = self.getPlayerStats;

        self.getLeagueInfo = function (league) {
            self.leagues[league].showLeaderboardError(false);
            self.leagues[league].showLeaderboardLoading(true);
            LeaderboardUtility.fetchLeagueInfo(league, MatchmakingUtility.getMatchmakingStatsType()).done(function(numberOfPlayersWithRank, players) {
                self.leagues[league].players(players);
                self.leagues[league].size(numberOfPlayersWithRank);
            }).fail(function(textStatus, errorThrown) {
                self.leagues[league].showLeaderboardError(true);
                self.leagues[league].players([]);
                self.leagues[league].size(0);

                console.error("Unable to fetch league info", league, textStatus, errorThrown);
            }).always(function() {
                self.leagues[league].showLeaderboardLoading(false);
            });
        };

        self.startMatchmaking = function() {
            window.location.href = 'coui://ui/main/game/start/start.html?startMatchMaking=true';
        };

        self.seasonText = ko.computed(function()
        {
            return ['!LOC:Season ends __date__', { date: MatchmakingUtility.getSeasonEndDate() }];
        });

        self.setup = function()
        {
            for (var league = 1; league <= 5; ++league)
                self.leagues[league] = new LeagueModel(self, league);

            if (self.allowRanked())
                self.getPlayerInfo();

            var firstLeague = self.playerRatingInfo().League;
            if (firstLeague > 0)
                self.getLeagueInfo(firstLeague);
            for (var league = 1; league <= 5; ++league)
            {
                if (league === firstLeague)
                    continue;
                self.getLeagueInfo(league);
            }
        }
    }

    model = new LeaderboardViewModel();
    model.lastSceneUrl('coui://ui/main/game/leaderboard/leaderboard.html');

    // inject per scene mods
    if (scene_mod_list['leaderboard']) {
        loadMods(scene_mod_list['leaderboard']);
    }

    model.setup();

    // setup send/recv messages and signals
    app.registerWithCoherent(model, {});

    // Activates knockout.js
    ko.applyBindings(model);
});
