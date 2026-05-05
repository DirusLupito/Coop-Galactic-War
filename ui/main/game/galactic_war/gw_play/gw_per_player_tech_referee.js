define(function() {
    var apply = function(referee, options) {
        var done = $.Deferred();

        // Shell for future per-player tagged spec/config generation. For now this
        // deliberately does nothing.
        done.resolve(true);
        return done.promise();
    };

    return {
        apply: apply
    };
});
