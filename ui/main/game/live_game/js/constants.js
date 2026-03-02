var constants = (function () {

    var watch_types = [ /* the order of these items is important */
        'ready', // 0
        'damage', // 1
        'death', // 2
        'ping', // 3
        'sight', // 4
        'projectile', // 5
        'first_contact', // 6
        'target_destroyed', //7,
        'allied_death', //8
        'idle', //9
        'arrival', //10
        'departure', //11
        'linked', //12
        'energy_requirement_met_change', //13
        'ammo_fraction_change' //14
    ];

    var event_types = [
        'low_metal', // 8
        'low_energy', // 9
        'full_metal', // 10
        'full_energy', // 11
        'under_attack',
        'allied_commander_under_attack',
        'commander_under_attack',
        'commander_healed',
        'commander_low_health',
        'allied_commander_low_health',
        'enemy_commander_low_health',
        'enemy_commander_under_attack',
        'commander_under_attack_very_low_health',
        'commander_destroyed',
        'asteroid_incoming',
        'asteroid_imminent', /* maps to self_guided. event system and the sim have different concepts of imminent */
        'asteroid_impact',
        'new_enemy_contact',
        'enemy_commander_sighted',
        'enemy_commander_destroyed',
        'in_combat',
        'enemy_metal_destroyed',
        'metal_lost',
        'thrust_control_established',
        'weapon_control_established',
        'allied_commander_destroyed',
        'asteroid_respawned',
        'commander_arrival',
        'transport_arrival',
        'teleporter_linked',
        'enemy_commander_departure',
        'unit_energy_shutdown',
        'unit_energy_startup',
        'anti_nuke_ready',
        'unitcannon_full',
        'nuke_ready',
        'ragnarok_loaded',
        'bounty_recieved',
        'bounty_claimed_ally',
        'bounty_claimed_enemy',
        'construction_continuous_on',
        'construction_continuous_off'
    ];

    var unit_types = [
        'Commander',
        'SupportCommander',
        'Fabber',
        'Debug',
        'Tank',

        'Bot',
        'Bomber',
        'Fighter',
        'Gunship',

        'Transport',
        'Teleporter',
        'Scout',
        'Structure',

        'Mobile',
        'Hover',
        'Wall',
        'Sub',
        'Nuke',

        'NukeDefense',
        'Heavy',
        'Artillery',
        'SelfDestruct',

        'Tactical',
        'MissleDefense',
        'LaserPlatform',
        'AirDefense',
        'SurfaceDefense',

        'OrbitalDefense',
        'ControlModule',
        'PlanetEngine',
        'CannonBuildable',
        'Titan',

        'MetalProduction',
        'EnergyProduction',
        'Construction',
        'Deconstruction',

        'Land',
        'Naval',
        'Air',
        'Orbital',

        'Basic',
        'Advanced',
        'CmdBuild',
        'FabBuild',

        'FabAdvBuild',
        'FabOrbBuild',
        'FactoryBuild',
        'CombatFabBuild',

        'CombatFabAdvBuild',
        'Economy',
        'Factory',
        'Defense',

        'Offense',
        'Recon',
        'NoBuild',
        'Important',

        'Custom1',
        'Custom2',
        'Custom3',
        'Custom4',

        'Vehicle',
        'Shield',
        'Amphibious',

        'WaterHover',

        'Interplanetary',
        'TacticalDefense',

        'Radar',
        'RadarJammer',

        'Custom5',
        'Custom6',
        'Custom7',
        'Custom8',
        'Custom9',
        'Custom10',
        'Custom11',
        'Custom12',
        'Custom13',
        'Custom14',
        'Custom15',
        'Custom16',
        'Custom17',
        'Custom18',
        'Custom19',
        'Custom20',
        'Custom21',
        'Custom22',
        'Custom23',
        'Custom24',
        'Custom25',
        'Custom26',
        'Custom27',
        'Custom28',
        'Custom29',
        'Custom30',
        'Custom31',
        'Custom32',
        'Custom33',
        'Custom34',
        'Custom35',
        'Custom36',
        'Custom37',
        'Custom38',
        'Custom39',
        'Custom40',
        'Custom41',
        'Custom42',
        'Custom43',
        'Custom44',
        'Custom45',
        'Custom46',
        'Custom47',
        'Custom48',
        'Custom49',
        'Custom50',
        'Custom51',
        'Custom52',
        'Custom53',
        'Custom54',
        'Custom55',
        'Custom56',
        'Custom57',
        'Custom58'
    ];

    function generateMap(array) {
        var result = {};

        _.forEach(array, function (element, index) {
            result[element] = index;
        });

        return result;
    }

    return {
        watch_type: generateMap(watch_types),
        event_type: generateMap(watch_types.concat(event_types)),
        unit_type: generateMap(unit_types)
    };
})();


