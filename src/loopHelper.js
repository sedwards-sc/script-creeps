/* jshint esversion: 6 */

require('class.Empire');
require('class.Colony');
require('class.SpawnGroup');
require('class.Quest');
require('class.EmergencyHarvesterQuest');
require('class.HarvesterQuest');

global.QUEST_CLASSES = {
	'emergencyHarvester': EmergencyHarvesterQuest,
	'harvester': HarvesterQuest
};

var loopHelper = {};

loopHelper.initMemory = function() {
	_.defaultsDeep(Memory, {
		logLevel: 1,
		notifyLevel: 5,
		config: {
			enableProfiler: false,
			muteSpawn: false,
		},
		stats: {},
		/*
		temp: {},
		playerConfig: {
			terminalNetworkRange: 6,
			muteSpawn: false,
			enableStats: false,
			creditReserveAmount: Number.MAX_VALUE,
			powerMinimum: 9000,
		},
		profiler: {},
		traders: {},
		powerObservers: {},
		notifier: [],
		cpu: {
			history: [],
			average: Game.cpu.getUsed(),
		},
		*/
	});
};

loopHelper.initEmpire = function() {
	let empire = new Empire();
	global.empire = empire;
	empire.init();
	return empire;
};

loopHelper.getColonies = function() {
	// gather flag data, instantiate colonies
	let colonyList = {};
	for(let flagName in Game.flags) {
		if(flagName.substring(0, FLAG_STRING_COLONY.length) === FLAG_STRING_COLONY) {
			let flag = Game.flags[flagName];
			let colonyName = flagName.substring(flagName.indexOf("_") + 1);

			if(colonyList.hasOwnProperty(colonyName)) {
				Logger.errorLog(`colony with name ${colonyName} already exists, please use a different name`, ERR_NAME_EXISTS, 4);
				continue;
			}

			let colony;
			try {
				colony = new Colony(colonyName, flag);
			} catch (e) {
				Logger.errorLog("error parsing flag name and bootstrapping colony", ERR_NOT_FOUND, 4);
				Logger.log(e, 4);
			}

			colonyList[colonyName] = colony;
			global[colonyName] = colony;
		}
	}

	Game.colonies = colonyList;

	return _.sortBy(colonyList, (colony) => colony.priority);
};

module.exports = loopHelper;
