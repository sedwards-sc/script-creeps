/*
 * object.rosters
 */

module.exports = (function(){

	RoomRoster = function(harvesters, builders, upgraders, explorers, remoteMiners, remoteCarriers, miners, carriers, linkers, reinforcers, reservers, claimers, remoteUpgraders, remoteBuilders, mineralHarvesters) {
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
		this.mineralHarvesters = mineralHarvesters || 0;
	};

	WorldRoster = function() {
		this.E8S23 = new RoomRoster(
				0, //harvesters
				2, //builders
				0, //upgraders
				0, //explorers
				4, //remoteMiners
				9, //remoteCarriers
				1, //miners
				2, //carriers
				1, //linkers
				1, //reinforcers
				3, //reservers
				0, //claimers
				0, //remoteUpgraders
				0, //remoteBuilders
				0 //mineralHarvesters
		);

		this.E9S27 = new RoomRoster(
				0, //harvesters
				2, //builders
				0, //upgraders
				0, //explorers
				2, //remoteMiners
				5, //remoteCarriers
				1, //miners
				2, //carriers
				1, //linkers
				1, //reinforcers
				2, //reservers
				0, //claimers
				0, //remoteUpgraders
				0, //remoteBuilders
				0 //mineralHarvesters
		);

		this.E9S28 = new RoomRoster(
				0, //harvesters
				2, //builders
				0, //upgraders
				0, //explorers
				1, //remoteMiners
				2, //remoteCarriers
				0, //miners
				0, //carriers
				0, //linkers
				1, //reinforcers
				1, //reservers
				0, //claimers
				0, //remoteUpgraders
				0, //remoteBuilders
				0 //mineralHarvesters
		);

		this.E7S25 = new RoomRoster(
				6, //harvesters
				0, //builders
				0, //upgraders
				0, //explorers
				1, //remoteMiners
				2, //remoteCarriers
				0, //miners
				0, //carriers
				0, //linkers
				1, //reinforcers
				2, //reservers
				0, //claimers
				0, //remoteUpgraders
				0, //remoteBuilders
				0 //mineralHarvesters
		);

		this.E7S24 = new RoomRoster(
				0, //harvesters
				0, //builders
				0, //upgraders
				0, //explorers
				0, //remoteMiners
				0, //remoteCarriers
				0, //miners
				0, //carriers
				0, //linkers
				1, //reinforcers
				0, //reservers
				0, //claimers
				0, //remoteUpgraders
				0, //remoteBuilders
				0 //mineralHarvesters
		);

		this.E9S24 = new RoomRoster(
				2, //harvesters
				0, //builders
				0, //upgraders
				0, //explorers
				0, //remoteMiners
				0, //remoteCarriers
				0, //miners
				0, //carriers
				0, //linkers
				1, //reinforcers
				2, //reservers
				0, //claimers
				0, //remoteUpgraders
				0, //remoteBuilders
				0 //mineralHarvesters
		);

		this.E6S32 = new RoomRoster(
				0, //harvesters
				0, //builders
				0, //upgraders
				0, //explorers
				0, //remoteMiners
				0, //remoteCarriers
				0, //miners
				0, //carriers
				0, //linkers
				1, //reinforcers
				3, //reservers
				0, //claimers
				0, //remoteUpgraders
				0, //remoteBuilders
				0 //mineralHarvesters
		);

		this.E8S32 = new RoomRoster(
				0, //harvesters
				0, //builders
				0, //upgraders
				0, //explorers
				0, //remoteMiners
				0, //remoteCarriers
				0, //miners
				0, //carriers
				0, //linkers
				1, //reinforcers
				2, //reservers
				0, //claimers
				0, //remoteUpgraders
				0, //remoteBuilders
				0 //mineralHarvesters
		);

		this.E7S34 = new RoomRoster(
				0, //harvesters
				0, //builders
				0, //upgraders
				0, //explorers
				0, //remoteMiners
				0, //remoteCarriers
				0, //miners
				0, //carriers
				0, //linkers
				1, //reinforcers
				2, //reservers
				0, //claimers
				0, //remoteUpgraders
				0, //remoteBuilders
				0 //mineralHarvesters
		);

		this.E9S33 = new RoomRoster(
				0, //harvesters
				0, //builders
				0, //upgraders
				0, //explorers
				0, //remoteMiners
				0, //remoteCarriers
				0, //miners
				0, //carriers
				0, //linkers
				1, //reinforcers
				2, //reservers
				0, //claimers
				0, //remoteUpgraders
				0, //remoteBuilders
				0 //mineralHarvesters
		);

		this.E7S35 = new RoomRoster(
				0, //harvesters
				0, //builders
				0, //upgraders
				0, //explorers
				0, //remoteMiners
				0, //remoteCarriers
				0, //miners
				0, //carriers
				0, //linkers
				1, //reinforcers
				2, //reservers
				0, //claimers
				0, //remoteUpgraders
				0, //remoteBuilders
				0 //mineralHarvesters
		);

		this.E9S38 = new RoomRoster(
				0, //harvesters
				0, //builders
				0, //upgraders
				0, //explorers
				0, //remoteMiners
				0, //remoteCarriers
				0, //miners
				0, //carriers
				0, //linkers
				2, //reinforcers
				1, //reservers
				0, //claimers
				0, //remoteUpgraders
				0, //remoteBuilders
				0 //mineralHarvesters
		);

		this.E6S29 = new RoomRoster(
				0, //harvesters
				0, //builders
				0, //upgraders
				0, //explorers
				0, //remoteMiners
				0, //remoteCarriers
				0, //miners
				0, //carriers
				0, //linkers
				2, //reinforcers
				1, //reservers
				0, //claimers
				0, //remoteUpgraders
				0, //remoteBuilders
				0 //mineralHarvesters
		);

		this.E11S31 = new RoomRoster(
				0, //harvesters
				0, //builders
				0, //upgraders
				0, //explorers
				0, //remoteMiners
				0, //remoteCarriers
				0, //miners
				0, //carriers
				0, //linkers
				3, //reinforcers
				1, //reservers
				0, //claimers
				0, //remoteUpgraders
				0, //remoteBuilders
				0 //mineralHarvesters
		);

		this.E4S31 = new RoomRoster(
				0, //harvesters
				0, //builders
				0, //upgraders
				0, //explorers
				0, //remoteMiners
				0, //remoteCarriers
				0, //miners
				0, //carriers
				0, //linkers
				2, //reinforcers
				1, //reservers
				0, //claimers
				0, //remoteUpgraders
				0, //remoteBuilders
				0 //mineralHarvesters
		);

		this.E12S34 = new RoomRoster(
				0, //harvesters
				0, //builders
				0, //upgraders
				0, //explorers
				0, //remoteMiners
				0, //remoteCarriers
				0, //miners
				0, //carriers
				0, //linkers
				2, //reinforcers
				0, //reservers
				0, //claimers
				0, //remoteUpgraders
				0, //remoteBuilders
				0 //mineralHarvesters
		);

		this.E8S21 = new RoomRoster(
				0, //harvesters
				0, //builders
				0, //upgraders
				0, //explorers
				0, //remoteMiners
				0, //remoteCarriers
				0, //miners
				0, //carriers
				0, //linkers
				2, //reinforcers
				0, //reservers
				0, //claimers
				0, //remoteUpgraders
				0, //remoteBuilders
				0 //mineralHarvesters
		);

		this.E11S35 = new RoomRoster(
				0, //harvesters
				0, //builders
				0, //upgraders
				0, //explorers
				0, //remoteMiners
				0, //remoteCarriers
				0, //miners
				0, //carriers
				0, //linkers
				2, //reinforcers
				0, //reservers
				0, //claimers
				0, //remoteUpgraders
				0, //remoteBuilders
				0 //mineralHarvesters
		);

		this.E7S29 = new RoomRoster(
				0, //harvesters
				0, //builders
				0, //upgraders
				0, //explorers
				0, //remoteMiners
				0, //remoteCarriers
				0, //miners
				0, //carriers
				0, //linkers
				0, //reinforcers
				0, //reservers
				0, //claimers
				0, //remoteUpgraders
				0, //remoteBuilders
				0 //mineralHarvesters
		);

		this.E11S38 = new RoomRoster(
				0, //harvesters
				0, //builders
				0, //upgraders
				0, //explorers
				0, //remoteMiners
				0, //remoteCarriers
				0, //miners
				0, //carriers
				0, //linkers
				0, //reinforcers
				0, //reservers
				0, //claimers
				0, //remoteUpgraders
				0, //remoteBuilders
				0 //mineralHarvesters
		);

	};

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
