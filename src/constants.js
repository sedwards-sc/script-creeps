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

global.CACHE_INVALIDATION_CHANCE = 0.01;

global.EPIC_CLASSES = {
	
};
