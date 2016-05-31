/*
 * object.rosters
 */

module.exports = {
	RoomRoster: function (harvesters, builders, upgraders, explorers, remoteMiners, remoteCarriers, miners, carriers, linkers, reinforcers, reservers, claimers, remoteUpgraders, remoteBuilders) {
		this.harvesters = harvesters || 0;
		this.builders = builders || 0;
		this.upgraders = upgraders || 0;
		this.explorers = explorers || 0;
		this.remoteMiners = remoteMiners;
		this.remoteCarriers = remoteCarriers;
		this.miners = miners;
		this.carriers = carriers;
		this.linkers = linkers;
		this.reinforcers = reinforcers;
		this.reservers = reservers;
		this.claimers = claimers;
		this.remoteUpgraders = remoteUpgraders;
		this.remoteBuilders = remoteBuilders;
	}
};

/*
Memory.roster[roomName] = {
		harvesters: 0,
		builders: 0,
		upgraders: 0,
		explorers: 0,
		remoteMiners: 0,
		remoteCarriers: 0,
		miners: 0,
		carriers: 0,
		linkers: 0,
		reinforcers: 0,
		reservers: 0,
		claimers: 0,
		remoteUpgraders: 0,
		remoteBuilders: 0
};
*/

