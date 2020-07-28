/* jshint esversion: 6 */
/*
 * constants
 */

global.USERNAME = _.first(_.toArray(Game.structures)).owner.username;

global.ALLIES = {
    "Adimus": true,
};

global.FLAG_STRING_COLONY = "colony";

global.TOWER_RESERVE_ENERGY = 400;
global.MINIMUM_RAMPART_HEALTH = 1000;
global.MINIMUM_WALL_HEALTH = 1000;

global.DESTINATION_REACHED = -1501;
global.ROOMTYPE_SOURCEKEEPER = -1601;
global.ROOMTYPE_CORE = -1602;
global.ROOMTYPE_CONTROLLER = -1603;
global.ROOMTYPE_ALLEY = -1604;

global.CACHE_INVALIDATION_CHANCE = 0.01;

global.PRIORITY_EMERGENCY = 0;
global.PRIORITY_HIGH = 1;
global.PRIORITY_MEDIUM = 10;
global.PRIORITY_LOW = 20;
global.PRIORITY_TRIVIAL = 50;
