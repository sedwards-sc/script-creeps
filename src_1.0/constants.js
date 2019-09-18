/* jshint esversion: 6 */
/*
 * constants
 */

global.DESTINATION_REACHED = -1501;
global.ROOMTYPE_SOURCEKEEPER = -1601;
global.ROOMTYPE_CORE = -1602;
global.ROOMTYPE_CONTROLLER = -1603;
global.ROOMTYPE_ALLEY = -1604;

global.ALLIES = {
    "Adimus": true,
};

global.USERNAME = _.first(_.toArray(Game.structures)).owner.username;

global.TOWER_RESERVE_ENERGY = 400;

//global.LINK_TRANSFER_THRESHOLD = LINK_CAPACITY * 0.8
global.LINK_TRANSFER_THRESHOLD = LINK_CAPACITY * 0.5;

global.POWER_BANK_DECAY_THRESHOLD = 4250;
global.POWER_BANK_POWER_THRESHOLD = 1500;
global.POWER_BANK_FINISHING_THRESHOLD = 400000;
global.POWER_MINING_STORAGE_THRESHOLD = 500000;
// processing rate during expansion
//global.POWER_PROCESS_INTERVAL = 5;
// processing rate when empire is all RCL8
global.POWER_PROCESS_INTERVAL = 3;


global.CACHE_INVALIDATION_CHANCE = 0.01;

global.PRIORITY_EMERGENCY = 0;
global.PRIORITY_HIGH = 1;
global.PRIORITY_MEDIUM = 10;
global.PRIORITY_LOW = 20;
global.PRIORITY_TRIVIAL = 50;
