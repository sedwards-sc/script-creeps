/*
 * object.rosters
 */

module.exports = (function(){

	RoomRoster = function(harvesters, builders, upgraders, explorers, remoteMiners, remoteCarriers, miners, carriers, linkers, reinforcers, reservers, claimers, remoteUpgraders, remoteBuilders) {
		this.harvesters = harvesters || 0;
		this.builders = builders || 0;
		this.upgraders = upgraders || 0;
		this.explorers = explorers || 0;
		this.remoteMiners = remoteMiners || 0;
		this.remoteCarriers = remoteCarriers || 0;
		this.miners = miners || 0;
		this.carriers = carriers || 0;
		this.linkers = linkers || 0;
		this.reinforcers = reinforcers || 0;
		this.reservers = reservers || 0;
		this.claimers = claimers || 0;
		this.remoteUpgraders = remoteUpgraders || 0;
		this.remoteBuilders = remoteBuilders || 0;
	}
	
	WorldRoster = function() {
		this.E8S23 = new RoomRoster(
				0, //harvesters
				4, //builders
				0, //upgraders
				0, //explorers
				3, //remoteMiners
				7, //remoteCarriers
				1, //miners
				2, //carriers
				1, //linkers
				2, //reinforcers
				2, //reservers
				0, //claimers
				0, //remoteUpgraders
				0 //remoteBuilders
		);
		
		this.E9S27 = new RoomRoster(
				0, //harvesters
				4, //builders
				0, //upgraders
				0, //explorers
				0, //remoteMiners
				0, //remoteCarriers
				1, //miners
				2, //carriers
				0, //linkers
				0, //reinforcers
				0, //reservers
				0, //claimers
				0, //remoteUpgraders
				0 //remoteBuilders
		);
		
	}
	
})();

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
