/* jshint esversion: 6 */

require('class.Empire');

var loopHelper = {};

loopHelper.initMemory = function() {
	_.defaultsDeep(Memory, {
		logLevel: 1,
		notifyLevel: 5,
		config: {
			enableProfiler: false,
			muteSpawn: false,
		},
		/*
		stats: {},
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

loopHelper.getEpics = function() {

	// gather flag data, instantiate operations
	let epicList = {};
	for(let flagName in Game.flags) {
		for(let typeName in EPIC_CLASSES) {
			if(!EPIC_CLASSES.hasOwnProperty(typeName)) {
				continue;
			}
			if(flagName.substring(0, typeName.length) === typeName) {
				let epicClass = EPIC_CLASSES[typeName];
				let flag = Game.flags[flagName];
				let epicName = flagName.substring(flagName.indexOf("_") + 1);

				if(epicList.hasOwnProperty(epicName)) {
					Logger.errorLog(`epic with name ${epicName} already exists (type: ${epicList[epicName].type}), please use a different name`, ERR_NAME_EXISTS, 4);
					continue;
				}

				let epic;
				try {
					epic = new epicClass(flag, typeName, epicName);
				} catch (e) {
					Logger.errorLog("error parsing flag name and bootstrapping operation", ERR_NOT_FOUND, 4);
					Logger.log(e, 4);
				}

				epicList[epicName] = epic;
				global[epicName] = epic;
			}
		}
	}

	Game.epics = epicList;

	return _.sortBy(epicList, (epic) => epic.priority);
};

module.exports = loopHelper;
