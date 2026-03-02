// (C)COPYRIGHT 2016-2021 Planetary Annihilation Inc. All rights reserved.

function CommunityMods() {
    model.uberId = api.net.uberId;
}

try {
    CommunityMods();
}
catch (e) {
    console.trace(JSON.stringify(e));
}
