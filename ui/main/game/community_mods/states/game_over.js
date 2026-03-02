// (C)COPYRIGHT 2016-2021 Planetary Annihilation Inc. All rights reserved.

function CommunityMods() {
    model.leaguePosition = ko.observable(-1);

    model.leagueText = ko.computed(function () {
        var position = model.leaguePosition();

        if (position && position > 0)
            position = '#' + position + ' ';
        else
            position = '';

        return position + MatchmakingUtility.getTitle(model.league());
    });

    model.getPlayerRank = function (gameType) {
        model.showLeagueLoading(true);
        model.league(-1);
        model.leaguePosition(-1);

        api.Panel.query(api.Panel.parentId, 'panel.invoke', ['uberId']).then(function (uberId) {
            if (!uberId)
                return;

            $.getJSON('https://api.planetaryannihilation.net/leaderboard/player?GameType=' + gameType + '&UserId=' + uberId, 'GET', 'json').done(function (data) {
                api.debug.log('getPlayerRank succeded', data);
                model.league(data.League);
                model.leaguePosition(data.LeaguePosition);
                model.showLeagueLoading(false);
            }).fail(function (data) {
                console.error('getPlayerRank failed', data);
                model.showLeagueLoading(false);
            });
        })
    };

    model.navToMatchMaking = function () {
        api.Panel.message(api.Panel.parentId, 'game_over.nav', {
            url: 'coui://ui/main/game/start/start.html?startMatchMaking=true',
            disconnect: true
        });
    };
}

try {
    CommunityMods();
}
catch (e) {
    console.trace(JSON.stringify(e));
}
