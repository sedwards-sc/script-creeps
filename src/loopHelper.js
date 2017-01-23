/* jshint esversion: 6 */

var loopHelper = {};

loopHelper.initMemory = function() {
	_.defaultsDeep(Memory, {
		logLevel: 1,
		notifyLevel: 5,
		enableProfiler: false,
		config: {
			logLevel: 1,
			notifyLevel: 5,
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

};

module.exports = loopHelper;
