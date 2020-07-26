/* jshint esversion: 6, loopfunc: true */

require('constants');
require('utils').populateUtils(global);
// 3rd party debug/helper utilities
require('debug').populate(global);

global.Logger = require('logger');

global.loopHelper = require('loopHelper');
loopHelper.initMemory();

require('prototype.creep');
require('prototype.room');
require('prototype.roomposition');
require('prototype.structure');

// require creep talk after creep prototypes
require('creeptalk')({
	'public': false,
	'language': require('creeptalk_basic')
});

/**
 * main function called in tick loop
 */
var main = function () {
	if(Game.cpu.bucket < 2 * Game.cpu.tickLimit) {
		Logger.errorLog(`skipping tick ${Game.time} due to lack of CPU`, ERR_BUSY, 5);
		return;
	}

	Logger.log(Game.time, 3);

	// create cache for this tick
	// TODO: change things that use this to an object cache (probably all room prototypes?)
	Game.cache = {
		structures: {},
		creeps: {},
		hostiles: {},
		hostilesAndLairs: {},
		// mineralCount: {},
		// labProcesses: {},
		// activeLabCount: 0,
		// placedRoad: false,
	};

	loopHelper.initEmpire();
	let prioritizedColonies = loopHelper.getColonies();

	for(let colony of prioritizedColonies) {
		colony.init();
	}

	for(let colony of prioritizedColonies) {
		colony.runCensus();
	}

	for(let colony of prioritizedColonies) {
		colony.runActivities();
	}

	for(let colony of prioritizedColonies) {
		colony.invalidateCache();
	}

	for(let colony of prioritizedColonies) {
		colony.theEnd();
	}

	try {
		empire.runActivities();
	} catch(e) {
		Logger.errorLog("error with empire activities", ERR_TIRED, 5);
		Logger.log(e, 5);
	}

	// loop to clean dead creeps out of memory
	for(let name in Memory.creeps) {
		if(!Game.creeps[name]) {
			delete Memory.creeps[name];
		}
	}

	if(Game.cpu.bucket > 9000) {
		Logger.log(Game.time + " - generating pixel", 3);
		Game.cpu.generatePixel();
	}
};

function cleanOldFlagsFromMemory() {
	for(let name in Memory.flags) {
		if(!Game.flags[name]) {
			delete Memory.flags[name];
		}
	}
	return OK;
}
global.cleanOldFlagsFromMemory = cleanOldFlagsFromMemory;

var reset_memory = function () {
	let default_keys = ['creeps', 'spawn', 'rooms', 'flags'];
	let keys = Object.keys(Memory);
	for(let key_index in keys) {
		let key = keys[key_index];
		delete Memory[key];
	}

	for(let key_index in default_keys) {
		let key = default_keys[key_index];
		Memory[key] = {};
	}

	return true;
};
global.reset_memory = reset_memory;

/**
 * main tick loop
 */
module.exports.loop = function() {
	main();
};
