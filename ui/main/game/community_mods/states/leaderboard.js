// (C)COPYRIGHT 2016-2021 Planetary Annihilation Inc. All rights reserved.

function CommunityMods() {
    $('.nav-pills li:eq(4) loc').replaceWith('Star');

    model.playerBadgeTitle = ko.computed(function () {
        var league = self.playerRatingInfo().League;

        if (league == 1)
            return 'Star';

        return MatchmakingUtility.getTitle(league);
    });
}

try {
    CommunityMods();
}
catch (e) {
    console.trace(JSON.stringify(e));
}
