define([
    'shared/gw_common'
], function (
    GW
) {

    
    var armyHasAI = function(army) {
        return !!(army && _.isArray(army.slots) && _.any(army.slots, 'ai'));
    };

    var getConnectedPlayerCount = function(options) {
        var connectedClients = options && options.connectedClients;
        if (_.isArray(connectedClients) && connectedClients.length)
            return connectedClients.length;

        console.log('[GW COOP] Per-player tech referee has no connected players.');
        return 0;
    };

    var collectHumanArmies = function(config) {
        var humanArmies = [];

        _.forEach(config.armies, function(army) {
            if (!armyHasAI(army))
                humanArmies.push(army);
        });

        return humanArmies;
    };

    var getPlayerTagGivenIndex = function(index) {
        // Host is still .player, and then subsequent players are .player0, .player1, etc.
        if (index === 0) {
            return '.player';
        } else {
            return '.player' + (index - 1);
        }
    };

    var stringEndsWith = function(value, suffix) {
        return _.isString(value) && value.slice(-suffix.length) === suffix;
    };

    // Helper function to strip the player tag from a string to get the base name.
    var stripPlayerTag = function(value) {
        var tag = '.player';
        if (!stringEndsWith(value, tag)) {
            console.log('[GW COOP] stripPlayerTag: value does not end with .player');
            return value;
        }

        return value.slice(0, -tag.length);
    };

    // Helper function which takes in a player's inventory and their tag, 
    // and generates the appropriate unit specs.
    var generateUnitSpecsForPlayer = function(inventory, playerTag) {
        var done = $.Deferred();
        var titans = api.content.usingTitans();
        var aiMapLoad = $.get('spec://pa/ai/unit_maps/ai_unit_map.json');
        var aiX1MapLoad = titans ? $.get('spec://pa/ai/unit_maps/ai_unit_map_x1.json') : {};
        $.when(aiMapLoad, aiX1MapLoad).then(function (
            aiMapGet,
            aiX1MapGet
        ) {
            var aiUnitMap = parse(aiMapGet[0]);
            var aiX1UnitMap = parse(aiX1MapGet[0]);

            var playerAIUnitMap = GW.specs.genAIUnitMap(aiUnitMap, playerTag);
            var playerX1AIUnitMap = titans ? GW.specs.genAIUnitMap(aiX1UnitMap, playerTag) : {};

            GW.specs.genUnitSpecs(inventory.units(), playerTag).then(function (playerSpecFiles) {
                var classicPath = '/pa/ai/unit_maps/ai_unit_map.json' + playerTag;
                var x1Path = '/pa/ai/unit_maps/ai_unit_map_x1.json' + playerTag;

                var playerFilesClassic = {};
                playerFilesClassic[classicPath] = playerAIUnitMap;

                var playerFilesX1 = {};
                if (titans) {
                    playerFilesX1[x1Path] = playerX1AIUnitMap;
                }
                
                var playerFiles = _.assign({}, playerFilesClassic, playerFilesX1, playerSpecFiles);
                GW.specs.modSpecs(playerFiles, inventory.mods(), playerTag);
                done.resolve(playerFiles);
            });
        });

        return done.promise();
    };

    // This referee should be applied after the co-op referee has done its work.
    // If per-player tech is enabled, this referee will generate the appropriate config
    // handling each player's
    //
    // Parameters:
    // - Referee: the already-hired GW referee object. This function expects it to expose
    //   a config observable, where referee.config() reads the generated battle
    //   config and referee.config(config) writes the mutated config back for later launch steps.
    //
    // - Options: a map/object describing the current launch context. Expected fields are:
    //       * active: true when this is a co-op Galactic War campaign fight; false for normal
    //             single-player GW, where this referee should do nothing and succeed.
    //       * sharedControl: true when all connected humans should share one army; false when
    //             each connected human should get a separate allied army.
    //       * perPlayerTechCards: true when per-player tech is enabled. This referee does not
    //             use it directly, but it comes with the options struct and should imply
    //             sharedControl has already been forced false by earlier code.
    //       * connectedClients: an array of connected campaign clients for this fight. Its
    //             length is the number of human slots/armies this referee prepares.
    //             Each client object within the array has an id, name, role ('host' or 'viewer')
    //             and loading status (loading = true or loading = false).
    var apply = function(referee, options) {
        var done = $.Deferred();

        var config = null;
        var inventory = null;
        var player = null;
        var playerCommander = null;
        var game = null;
        var playerCount = null;
        var humanArmies = null;


        // ERROR CHECKING
        // ==============

        config = referee && _.isFunction(referee.config) && referee.config();

        if (!config || !_.isArray(config.armies)) {
            console.log('[GW COOP] Per-player tech referee received invalid battle config.');
            done.resolve(false);
            return done.promise();
        }

        // No options means no co-op.
        if (!options || !options.active) {
            console.log('[GW COOP] Per-player tech referee called without co-op options.');
            done.resolve(true);
            return done.promise();
        }
        
        // Likewise no per-player tech means this referee is out of a job.
        if (!options.perPlayerTechCards) {
            console.log('[GW COOP] Per-player tech referee called without per-player tech enabled.');
            done.resolve(true);
            return done.promise();
        }

        playerCount = getConnectedPlayerCount(options);
        if (playerCount < 1) {
            console.log('[GW COOP] Per-player tech referee has no connected players.');
            config.per_player_tech_ready = false;
            referee.config(config);
            done.resolve(false);
            return done.promise();
        }

        var sharedControl = !!options.sharedControl;
        if (sharedControl) {
            console.log('[GW COOP] Per-player tech referee does not support shared control.');
            config.per_player_tech_ready = false;
            referee.config(config);
            done.resolve(false);
            return done.promise();
        }

        humanArmies = collectHumanArmies(config);
        if (humanArmies.length < 1) {
            console.log('[GW COOP] Per-player tech referee has no human armies.');
            config.per_player_tech_ready = false;
            referee.config(config);
            done.resolve(false);
            return done.promise();
        }

        if (playerCount !== humanArmies.length) {
            console.log('[GW COOP] Per-player tech referee has a mismatch between connected players and human armies.');
            config.per_player_tech_ready = false;
            referee.config(config);
            done.resolve(false);
            return done.promise();
        }

        var files = _.isFunction(referee.files) && referee.files();

        if (!files || !_.isObject(files)) {
            console.log('[GW COOP] Per-player tech referee has no files.');
            config.per_player_tech_ready = false;
            referee.config(config);
            done.resolve(false);
            return done.promise();
        }

        game = _.isFunction(referee.game) && referee.game();

        if (!game) {
            console.log('[GW COOP] Per-player tech referee has no game.');
            config.per_player_tech_ready = false;
            referee.config(config);
            done.resolve(false);
            return done.promise();
        }

        inventory = _.isFunction(game.inventory) && game.inventory();

        if (!inventory) {
            console.log('[GW COOP] Per-player tech referee has no inventory.');
            config.per_player_tech_ready = false;
            referee.config(config);
            done.resolve(false);
            return done.promise();
        }

        if (!_.isFunction(inventory.units) || !_.isFunction(inventory.mods)) {
            console.log('[GW COOP] Per-player tech referee has invalid inventory units or mods.');
            console.log('[GW COOP] Per-player tech game inventory is: ' + JSON.stringify(inventory));
            config.per_player_tech_ready = false;
            referee.config(config);
            done.resolve(false);
            return done.promise();
        }

        player = config.player;

        if (!player || !_.isObject(player)) {
            console.log('[GW COOP] Per-player tech referee has no player.');
            config.per_player_tech_ready = false;
            referee.config(config);
            done.resolve(false);
            return done.promise();
        }

        playerCommander = player.commander;

        if (!playerCommander || !_.isString(playerCommander)) {
            console.log('[GW COOP] Per-player tech referee has no player commander.');
            config.per_player_tech_ready = false;
            referee.config(config);
            done.resolve(false);
            return done.promise();
        }

        // ERROR CHECKING DONE
        // ===================

        var playerTags = _.map(_.range(0, playerCount), getPlayerTagGivenIndex);

        var baseCommander = stripPlayerTag(playerCommander);

        // Keeps track of all the promises for generating player-specific specs.
        var playerSpecPromises = [];

        // We've already generated the .player tag, so we just need to generate subsequent tags.
        for (var i = 1; i < playerTags.length; i++) {
            playerSpecPromises.push(generateUnitSpecsForPlayer(inventory, playerTags[i]));
        }

        $.when.apply($, playerSpecPromises).then(function() {
            var thisPlayersFiles = Array.prototype.slice.call(arguments);
            var generatedFiles = {};

            console.log('[GW COOP] Generating player-specific files.');

            // Arguments is an array of the resolved values from the promises.
            for (var i = 0; i < thisPlayersFiles.length; i++) {
                _.assign(generatedFiles, thisPlayersFiles[i]);
            }

            var mergedFiles = _.assign({}, files, generatedFiles);

            console.log('[GW COOP] Merged ' + _.keys(mergedFiles).length + ' files.');

            referee.files(mergedFiles);
            config.files = mergedFiles;

            _.forEach(humanArmies, function(army, index) {
                army.spec_tag = playerTags[index];

                // Per player tech cards requires that all armies are unshared,
                // thus each army only has one commander. So this is sensible.
                // If in the future we have multiple commanders, this will not be sensible.
                army.commander = baseCommander + playerTags[index];
            });

            config.per_player_tech_ready = true;
            config.per_player_tech_tags = playerTags;
            console.log('[GW COOP] Per-player tech tags: ' + JSON.stringify(playerTags));
            referee.config(config);
            done.resolve(true);
        });
        return done.promise();
    };

    return {
        apply: apply
    };
});

/*
 * Galactic War battle config reference
 * ====================================
 *
 * This file intentionally keeps a broad reference for the battle config object
 * because per-player tech card support is expected to touch several parts of
 * that object at once. The config is not currently defined by a formal schema;
 * it is an implicit contract between gw_referee/gw_play, gw_lobby, landing,
 * playing_shared, playing, live_game, and reconnect handling.
 *
 * High-level lifecycle
 * --------------------
 *
 * 1. gw_referee generates the base config from the active GW save.
 * 2. gw_coop_referee reshapes human armies/slots for shared or unshared play.
 * 3. gw_per_player_tech_referee may add per-player tagged specs and config
 *    metadata for each human army.
 * 4. gw_play adds campaign/lobby metadata and sends the config to gw_lobby.
 * 5. gw_lobby assigns real server clients to prepared human slots, builds the
 *    players map, and creates landingConfig.
 * 6. landing/playing_shared convert armies, slots, and players into sim armies
 *    and runtime player objects.
 * 7. playing uses the runtime objects for commander spawning, defeat handling,
 *    reconnect state, and game-over state.
 *
 * Top-level battle config
 * -----------------------
 *
 * config: {
 *     files: FilesMap,
 *     armies: ArmyConfig[],
 *     player: PlayerTemplateConfig,
 *     system: SystemConfig,
 *     gw: SavedGalacticWarGame,
 *
 *     gw_campaign_active: Boolean,
 *     gw_campaign_settings: GwCampaignSettings,
 *     gw_campaign_access: GwCampaignAccess,
 *     shared_control: Boolean,
 *     per_player_tech_cards: Boolean,
 *
 *     sandbox: Boolean,
 *     land_anywhere: Boolean,
 *     shuffle_landing_zones: Boolean,
 *     sudden_death_mode: Boolean,
 *     eradication_mode: Boolean,
 *     eradication_mode_sub_commanders: Boolean,
 *     eradication_mode_factories: Boolean,
 *     eradication_mode_fabricators: Boolean,
 *     bounty_mode: Boolean,
 *     bounty_value: Number,
 *
 *     coop_human_armies_ready: Boolean,
 *     per_player_tech_ready: Boolean
 * }
 *
 * files
 * -----
 *
 * files is a map from virtual mounted file path to either a JSON-compatible
 * object or an already-stringified file body.
 *
 * FilesMap: {
 *     [virtualPath: String]: Object | String
 * }
 *
 * Common virtual paths:
 *
 *     /pa/units/unit_list.json.player
 *     /pa/units/unit_list.json.ai
 *     /pa/ai/unit_maps/ai_unit_map.json.player
 *     /pa/ai/unit_maps/ai_unit_map.json.ai
 *     /pa/ai/unit_maps/ai_unit_map_x1.json.player
 *     /pa/ai/unit_maps/ai_unit_map_x1.json.ai
 *     /pa/units/some_unit/some_unit.json.player
 *     /pa/units/some_unit/some_unit.json.ai
 *
 * Tags are appended directly to original spec paths. For example:
 *
 *     /pa/units/commanders/foo/foo.json
 *     /pa/units/commanders/foo/foo.json.player
 *     /pa/units/commanders/foo/foo.json.player0
 *     /pa/units/commanders/foo/foo.json.ai
 *
 * Per-player tech card support is expected to add additional tagged player
 * files:
 *
 *     /pa/units/unit_list.json.player0
 *     /pa/ai/unit_maps/ai_unit_map.json.player0
 *     /pa/ai/unit_maps/ai_unit_map_x1.json.player0
 *     /pa/units/some_unit/some_unit.json.player0
 *
 * The untagged /pa/units/unit_list.json may be synthesized later for local UI
 * overlays/reconnect support by combining discovered tagged unit lists.
 *
 * armies
 * ------
 *
 * armies is the authoritative pre-landing list of army definitions.
 *
 * ArmyConfig: {
 *     slots: SlotConfig[],
 *     color: ColorPair,
 *     econ_rate: Number,
 *     spec_tag: String,
 *     alliance_group: Number,
 *     personality: Object,
 *     player_config: PlayerTemplateConfig
 * }
 *
 * Required/common fields:
 *
 * slots:
 *     Array of human or AI slots. An army with any AI slot is treated as an AI
 *     army by current GW code. A human army should contain only human slots.
 *
 * color:
 *     A pair of RGB color arrays:
 *
 *         [[primaryR, primaryG, primaryB], [secondaryR, secondaryG, secondaryB]]
 *
 *     Each channel is expected to be an integer from 0 to 255.
 *
 * econ_rate:
 *     Economy multiplier for this army. Vanilla player armies usually use 1. Float.
 *
 * spec_tag:
 *     String appended to specs for this army. The leading dot is part of the
 *     tag. Common values include:
 *
 *         .player
 *         .player0
 *         .player1
 *         .ai
 *         .ai0
 *         .ai1
 *
 * alliance_group:
 *     Armies with the same non-zero alliance group are allied by default.
 *     Vanilla GW uses 1 for the player side and 2 for the enemy AI side. Integer.
 *
 * personality:
 *     AI personality object. Usually only present for AI armies.
 *
 * player_config:
 *     Optional extension point for co-op/per-player tech. If present, gw_lobby
 *     can use it instead of config.player when building config.players for the
 *     client assigned to this army. This is useful because human commander
 *     specs are read from config.players[client.id].commander, not from the
 *     human slot itself.
 *
 * slots
 * -----
 *
 * SlotConfig is either a human slot or an AI slot.
 *
 * HumanSlotConfig: {
 *     name: String,
 *     client: ServerClient,
 *     player_config: PlayerTemplateConfig
 * }
 *
 * AISlotConfig: {
 *     ai: true,
 *     name: String,
 *     commander: String
 * }
 *
 * Human slot fields:
 *
 * name:
 *     Display name. Before gw_lobby assigns real clients, this is often
 *     "Player" or missing. gw_lobby overwrites it with client.name.
 *
 * client:
 *     Server-only client object assigned by gw_lobby. Referees should not
 *     create this because they run in the UI and only have lightweight client
 *     summaries.
 *
 * player_config:
 *     Optional per-slot override for the player config gw_lobby should use for
 *     the assigned client.
 *
 * AI slot fields:
 *
 * ai:
 *     True for AI slots. Missing or false means the slot is treated as human.
 *
 * name:
 *     AI display name.
 *
 * commander:
 *     Fully tagged commander spec path, such as:
 *
 *         /pa/units/commanders/foo/foo.json.ai
 *         /pa/units/commanders/foo/foo.json.player
 *         /pa/units/commanders/foo/foo.json.player0
 *
 *     Allied subcommanders use the player-side tag for their owner.
 *
 * player
 * ------
 *
 * player is the default template gw_lobby clones into config.players for each
 * connected human client.
 *
 * PlayerTemplateConfig: {
 *     commander: String,
 *     creator: Boolean
 * }
 *
 * commander:
 *     Fully tagged commander spec path used when spawning the human player's
 *     commander in playing_shared.
 *
 * creator:
 *     True if this player is the lobby/campaign host. This is normal lobby
 *     metadata and may be useful to distinguish host-specific behavior.
 *
 * Important: human commander spawning reads from config.players[client.id],
 * not from the human army slot. That means per-player tech cannot fully work
 * by only changing ArmyConfig.spec_tag; it must also ensure each connected
 * client's PlayerTemplateConfig has the matching tagged commander.
 *
 * players
 * -------
 *
 * config.players is not normally present in the referee-created battle config.
 * gw_lobby creates it when building landingConfig.
 *
 * PlayersMap: {
 *     [clientId: String | Number]: PlayerTemplateConfig
 * }
 *
 * gw_lobby currently uses connected server clients to map players into prepared
 * human slots. The player config is then consumed by playing_shared:
 *
 *     var playerConfig = config.players[client.id];
 *     var commander = playerConfig && playerConfig.commander;
 *
 * Per-player tech likely needs gw_lobby to choose player_config in this order:
 *
 *     slot.player_config
 *     army.player_config
 *     config.player
 *
 * system
 * ------
 *
 * system is the PA system config for the battle.
 *
 * SystemConfig: {
 *     name: String,
 *     planets: PlanetConfig[],
 *     force_start: Boolean
 * }
 *
 * PlanetConfig is the normal PA planet/system shape and may include planet
 * generation data, CSG, metal spots, landing zones, and preplaced units.
 * Referees usually pass this through unchanged unless they implement gameplay
 * cards or system mutation.
 *
 * gw
 * --
 *
 * gw is the saved Galactic War game object used for diagnostics/replay config
 * and post-battle continuation. gw_referee writes:
 *
 *     config.gw = game.save();
 *
 * Then stripSystems() removes bulky system data from config.gw via:
 *
 *     GW.Game.saveSystems(config.gw);
 *
 * Referees that only prepare battle specs/armies generally should not mutate
 * config.gw.
 *
 * gw_campaign_settings
 * --------------------
 *
 * GwCampaignSettings: {
 *     game_name: String,
 *     tag: String,
 *     public: Boolean,
 *     friends: Boolean,
 *     hidden: Boolean,
 *     shared_control: Boolean,
 *     per_player_tech_cards: Boolean,
 *     max_clients: Number
 * }
 *
 * These settings allow the battle lobby beacon, game_over, and Continue War
 * restart flow to preserve the campaign lobby identity and control settings.
 *
 * gw_campaign_access
 * ------------------
 *
 * GwCampaignAccess: {
 *     password: String,
 *     friends: Array,
 *     blocked: Array
 * }
 *
 * This is copied from the campaign lobby so the battle lobby/restart flow can
 * preserve access control.
 *
 * gameplay flags
 * --------------
 *
 * sandbox:
 *     Enables sandbox-style behavior.
 *
 * land_anywhere:
 *     Allows landing outside normal landing zones.
 *
 * shuffle_landing_zones:
 *     Enables landing zone shuffling when supported by the mode.
 *
 * sudden_death_mode:
 *     If true, losing a commander can immediately defeat the army.
 *
 * eradication_mode:
 *     If true, defeat is based on the configured eradication unit categories
 *     rather than only commander life.
 *
 * eradication_mode_sub_commanders:
 *     Includes subcommanders in eradication checks.
 *
 * eradication_mode_factories:
 *     Includes factories in eradication checks.
 *
 * eradication_mode_fabricators:
 *     Includes fabricators in eradication checks.
 *
 * bounty_mode:
 *     Enables bounty behavior.
 *
 * bounty_value:
 *     Numeric bounty value, commonly defaulted to 0.5 when absent.
 *
 * referee readiness flags
 * -----------------------
 *
 * coop_human_armies_ready:
 *     Written by gw_coop_referee. True means the co-op referee successfully
 *     prepared enough human slots/armies for the connected players.
 *
 * per_player_tech_ready:
 *     Suggested field for gw_per_player_tech_referee. True should mean every
 *     required player tag has generated files and every affected human/allied
 *     army has the correct spec_tag/player_config/commander references.
 *
 * connected client summaries
 * --------------------------
 *
 * Referee options.connectedClients is not an array of server client objects.
 * It is an array of UI-safe summaries from gw_campaign control state:
 *
 * ConnectedClientSummary: {
 *     id: String | Number,
 *     name: String,
 *     role: "host" | "viewer",
 *     loading: Boolean
 * }
 *
 * ServerClient objects with methods like client.message(...) only exist in
 * server states such as gw_lobby, landing, and playing. Referees should use
 * connected client summaries for ordering/counting/metadata, but should not
 * expect them to have server-only methods.
 */
