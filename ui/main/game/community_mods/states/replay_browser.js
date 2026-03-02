// (C)COPYRIGHT 2016-2021 Planetary Annihilation Inc. All rights reserved.

function CommunityMods() {
    if (parseInt(window.gVersion) >= 113892)
        return;

    $('#game-list-header').replaceWith('<div class="row" id="game-list-header"><div class="col-md-5 game"><loc>Game</loc></div><div class="col-md-3 winners"><loc>Winner</loc></div><div class="col-md-1 duration"><loc>Duration</loc></div><div class="col-md-1 buildVersion"><loc>BuildVersion</loc></div><div class="col-md-2 lobbyId"><loc>Lobby Id</loc></div></div>');

    $('#game-list').replaceWith('<div id="game-list" data-bind="foreach: filteredGameList, style: { height: listHeight }"><div class="btn_std_ix row one-game" data-bind="css: {\'ui-selected\': (host_id === model.currentSelectedGameHost()) },click: $parent.setSelected"><div style="white-space: normal;" class="col-md-5 game" data-bind="text: name, event: { dblclick: $parent.viewSelectedReplay }"></div><div style="padding-left: 15px" class="col-md-3 winner" data-bind="text: winner"></div><div style="padding-left: 15px" class="col-md-1 duration" data-bind="text: duration"></div><div style="padding-left: 15px" class="col-md-1 buildVersion" data-bind="text: buildVersion"></div><div style="padding-left: 15px" class="col-md-2 buildVersion allowTextSelection" data-bind="text: host_id"></div></div></div>');

    var cm_processReplay = model.processReplay;

    model.processReplay = function (beacon, host_id, origGameInfo) {
        var replay = cm_processReplay(beacon, host_id, origGameInfo);

        replay.winners = _.map(_.filter(replay.armies, function (army) {
            return !army.defeated;
        }), function (army) {
            return army.name + (army.ai ? ' (AI)' : '');
        });

        replay.winner = replay.winners.join(' ');

        return replay;
    }
}

try {
    CommunityMods();
}
catch (e) {
    console.trace(JSON.stringify(e));
}
