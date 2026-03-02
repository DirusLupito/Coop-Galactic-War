// !LOCNS:galactic_war
define(['shared/gw_common'], function(GW)
{
    return {
        visible: function(params) { return true; },
        describe: function(params)
        {
            return "!LOC:Improved Energy Weapons tech reduces energy costs for energy based weapons by 75%";
        },
        summarize: function(params)
        {
            return '!LOC:Improved Energy Weapons';
        },
        icon: function(params)
        {
            return 'coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_energy.png';
        },
        audio: function(params)
        {
            return {
                found: '/VO/Computer/gw/board_tech_available_weapon_upgrade'
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

            return { chance: chance };
        },
        buff: function(inventory, params)
        {
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
            var mods = [];
            var modWeap = function(weap)
            {
                mods.push({
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
