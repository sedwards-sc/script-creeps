/* jshint esversion: 6 */

var Empire = require('empire');

var loopHelper = {};

loopHelper.initMemory = function() {
	_.defaultsDeep(Memory, {
		logLevel: 1,
		notifyLevel: 5,
		config: {
			enableProfiler: false,
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
	let empire = Empire.newEmpire();
	empire.init();
	global.emp = empire;
	return empire;
};

module.exports = loopHelper;
