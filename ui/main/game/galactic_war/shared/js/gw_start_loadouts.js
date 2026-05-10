define([], function() {
    var startLoadouts = [
        { id: 'gwc_start_vehicle' },
        { id: 'gwc_start_air' },
        { id: 'gwc_start_orbital' },
        { id: 'gwc_start_bot' },
        { id: 'gwc_start_artillery' },
        { id: 'gwc_start_subcdr' },
        { id: 'gwc_start_combatcdr' },
        { id: 'gwc_start_allfactory' }
    ];

    var buildStartLoadoutCards = function(params) {
        var bank = params.bank;
        var makeKnown = params.makeKnown;
        var makeUnknown = params.makeUnknown;

        var known = _.map(startLoadouts, function(cardData, index) {
            if (index !== 0 && !bank.hasStartCard(cardData))
                return makeUnknown(cardData);

            return makeKnown(cardData);
        });

        var extraKnown = _.filter(_.map(bank.startCards(), function(cardData) {
            var isAlreadyListed = _.some(startLoadouts, _.bind(_.isEqual, null, cardData));
            if (isAlreadyListed)
                return undefined;

            return makeKnown(cardData);
        }));

        return known.concat(extraKnown);
    };

    return {
        all: function() {
            return _.cloneDeep(startLoadouts);
        },
        buildStartLoadoutCards: buildStartLoadoutCards
    };
});
