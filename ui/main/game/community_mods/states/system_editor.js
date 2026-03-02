// (C)COPYRIGHT 2016-2021 Planetary Annihilation Inc. All rights reserved.

try {
    api.camera.lookAt = function (target, smooth) {
        if (!_.isString(target))
            target = JSON.stringify(target);

        return engine.call('camera.lookAt', target, !!smooth);
    }

    model.removePlanet = function () {
        model.advancedEditMode(false);
        model.system().planets.splice(model.selectedPlanetIndex(), 1);
        engine.call('execute', 'remove_planet', JSON.stringify({}));
        model.selectPlanet('sun');
    };
}
catch (e) {
    console.trace(JSON.stringify(e));
}