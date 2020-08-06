/* jshint esversion: 6 */

class LinkMinerQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('linkMiner', PRIORITY_MEDIUM, id, flag, colony);
	}

	initQuest() {
		if(this.memory.cache.prespawn === undefined) {
			const ROAD_COST = 1;
			const PLAIN_COST = 2;
			const SWAMP_COST = 10;
			let pathFinderResults = PathFinder.search(this.spawnGroup.pos, this.flag.pos, {
				plainCost: PLAIN_COST,
				swampCost: SWAMP_COST,
				maxOps: 8000,
				roomCallback: function(roomName) {
					let room = Game.rooms[roomName];
					if(!room) {
						return;
					}

					let costs = new PathFinder.CostMatrix();
					room.find(FIND_STRUCTURES).forEach(function(structure) {
						if(structure.structureType === STRUCTURE_ROAD) {
							costs.set(structure.pos.x, structure.pos.y, ROAD_COST);
						} else if(structure.structureType !== STRUCTURE_CONTAINER && (structure.structureType !== STRUCTURE_RAMPART || !structure.my)) {
							// Can't walk through non-walkable buildings
							costs.set(structure.pos.x, structure.pos.y, 0xff);
						}
					});
					return costs;
				},
			});
			this.memory.cache.prespawn = Math.max(pathFinderResults.path.length - 1, 0);
		}

		this.miners = [];
	}

	runCensus() {
		let minerBody = [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, WORK, WORK, WORK, WORK, WORK];
		let maxMiners = 1;
		if(this.spawnGroup.maxSpawnEnergy < calculateCreepCost(minerBody)) {
			this.errorLog("insufficient energy capacity to spawn link miner", ERR_NOT_ENOUGH_RESOURCES)
			maxMiners = 0;
		}
		this.miners = this.attendance(this.nameId, minerBody, maxMiners, {prespawn: this.memory.cache.prespawn, blindSpawn: true});
	}

	runActivities() {
		for(let creep of this.miners) {
			if(!creep.spawning) {
				this.minerActions(creep)
			}
		}
	}

	questEnd() {
	}

	minerActions(creep) {
		if((Game.time % 50) === 1) {
			let reqParts = _.filter(creep.body, function(bodyPart) { return (bodyPart.type === WORK) && (bodyPart.hits > 0); });

			if(typeof reqParts === 'undefined' || reqParts.length === 0) {
				creep.errorLog('missing required body parts; attempting suicide', ERR_NO_BODYPART, 4);
				creep.suicide();
			}
		}

		if(creep.pos.isEqualTo(this.flag)) {
			creep.memory.avoidMe = true;

			let mySource = Game.getObjectById(creep.memory.mySourceId);
			if(mySource === null) {
				mySource = this.flag.pos.findClosestByRange(FIND_SOURCES);
				creep.memory.mySourceId = mySource.id;
			}

			let harvestReturn = creep.harvest(mySource);
			if(harvestReturn !== OK && harvestReturn !== ERR_NOT_ENOUGH_RESOURCES) {
				creep.errorLog('could not successfully harvest', harvestReturn, 4);
			}

			if(creep.store.getUsedCapacity() === creep.store.getCapacity()) {
				let myTransferStructure = Game.getObjectById(creep.memory.myTransferStructureId);
				if(myTransferStructure === null) {
					let energyStores = this.flag.room.findStructures(STRUCTURE_LINK);
					if(this.flag.room.storage) {
						energyStores.push(this.flag.room.storage)
					}
					myTransferStructure = this.flag.pos.findClosestByRange(energyStores);
					if(myTransferStructure) {
						creep.memory.myTransferStructureId = myTransferStructure.id;
					}
				}

				let transferReturn = creep.transfer(myTransferStructure, RESOURCE_ENERGY);
				if(transferReturn != OK) {
					creeps.errorLog('could not successfully transfer', transferReturn);
				}
			}
		} else {
			creep.blindMoveTo(this.flag);
		}
	}
}

global.LinkMinerQuest = LinkMinerQuest;
