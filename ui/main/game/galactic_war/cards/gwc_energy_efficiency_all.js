// !LOCNS:galactic_war
define(['shared/gw_common'], function(GW)
{
    return {
        visible: function(params) { return true; },
        describe: function(params)
        {
            return "!LOC:Complete Energy Tech reduces energy costs for intelligence structures by 75%, weapon energy costs by 75%.";
        },
        summarize: function(params)
        {
            return '!LOC:Complete Energy Tech';
        },
        icon: function(params)
        {
            return 'coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_energy.png';
        },
        audio: function(params)
        {
            return {
                found: '/VO/Computer/gw/board_tech_available_efficiency'
            }
        },
        getContext: function(galaxy)
        {
            return {
                totalSize: galaxy.stars().length
            };
        },
        deal: function(system, context, inventory)
        {
            var chance = 0;
            var dist = system.distance();
            if (dist > 0)
            {
                if (context.totalSize <= GW.balance.numberOfSystems[0])
                {
                    chance = 33;
                    if (dist > 4)
                        chance = 166;
                    else if (dist > 2)
                        chance = 333;
                }
                else if (context.totalSize <= GW.balance.numberOfSystems[1])
                {
                    chance = 33;
                    if (dist > 6)
                        chance = 166;
                    else if (dist > 3)
                        chance = 333;
                }
                else if (context.totalSize <= GW.balance.numberOfSystems[2])
                {
                    chance = 33;
                    if (dist > 9)
                        chance = 166;
                    else if (dist > 5)
                        chance = 333;
                }
                else if (context.totalSize <= GW.balance.numberOfSystems[3])
                {
                    chance = 33;
                    if (dist > 10)
                        chance = 166;
                    else if (dist > 6)
                        chance = 333;
                }
                else
                {
                    chance = 33;
                    if (dist > 12)
                        chance = 166;
                    else if (dist > 7)
                        chance = 333;
                }
            }
            return { chance: chance };
        },
        buff: function(inventory, params)
        {
            var units =
            [
                '/pa/units/orbital/deep_space_radar/deep_space_radar.json',
                '/pa/units/orbital/radar_satellite/radar_satellite.json',
                '/pa/units/orbital/radar_satellite_adv/radar_satellite_adv.json',
                '/pa/units/land/radar/radar.json',
                '/pa/units/land/radar_adv/radar_adv.json',
                '/pa/units/land/radar_jammer/radar_jammer.json',
                '/pa/units/land/tank_jammer/tank_jammer.json',
                '/pa/units/land/tank_anti_nuke/tank_anti_nuke.json'
            ];
            var mods = [];
            var modUnit = function(unit)
            {
                mods.push(
                {
                    file: unit,
                    path: 'consumption.energy',
                    op: 'multiply',
                    value: 0.25
                });
            };
            _.forEach(units, modUnit);
            var weaps =
            [
                '/pa/units/orbital/orbital_laser/orbital_laser_tool_weapon.json',
                '/pa/units/land/artillery_short/artillery_short_tool_weapon.json',
                '/pa/units/land/artillery_long/artillery_long_tool_weapon.json',
                '/pa/units/air/bomber/bomber_tool_weapon.json',
                '/pa/tools/uber_cannon/uber_cannon.json',
                '/pa/units/land/bot_tesla/bot_tesla_tool_weapon.json',
                '/pa/units/air/solar_drone/solar_drone_tool_weapon.json',
                '/pa/units/air/bomber_heavy/bomber_heavy_tool_weapon.json',
                '/pa/units/air/titan_air/titan_air_tool_weapon.json',
                '/pa/units/orbital/orbital_railgun/orbital_railgun_tool_weapon.json',
            ];
            var modWeap = function(weap)
            {
                mods.push(
                {
                    file: weap,
                    path: 'ammo_capacity',
                    op: 'multiply',
                    value: 0.25
                });
                mods.push(
                {
                    file: weap,
                    path: 'ammo_demand',
                    op: 'multiply',
                    value: 0.25
                });
                mods.push(
                {
                    file: weap,
                    path: 'ammo_per_shot',
                    op: 'multiply',
                    value: 0.25
                });
            };
            _.forEach(weaps, modWeap);
            inventory.addMods(mods);
        },
        dull: function(inventory) {}
    };
});
