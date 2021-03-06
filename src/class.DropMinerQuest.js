/* jshint esversion: 6 */

const PAVED_BODY = [MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK];

class DropMinerQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		// TODO: adjust priority vs harvesters
		super('dropMiner', PRIORITY_MEDIUM, id, flag, colony);
		this.poi = true;
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
		// TODO: remove blindSpawn after introducing "sentinal" or something for guarding remote rooms (reservers might be enough...)
		// TODO: spawn smaller miner if room isn't owned or reserved (e.g. not owned or resered for the last x ticks in case reserve gets temporarily lost while this creep happens to be spawning)

		let body = [];
		if(this.colony.paved && this.spawnGroup.maxSpawnEnergy >= calculateCreepCost(PAVED_BODY)) {
			body = PAVED_BODY;
		} else {
			body = this.spawnGroup.workerBodyRatio(1, 0, 1, 1, 5).reverse();
		}

		this.miners = this.attendance(this.nameId, body, 1, {prespawn: this.memory.cache.prespawn, blindSpawn: true});
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
		if(creep.fleeHostiles()) {
			return;
		}

		if((Game.time % 50) === 1) {
			let reqParts = _.filter(creep.body, function(bodyPart) { return (bodyPart.type === WORK) && (bodyPart.hits > 0); });

			if(typeof reqParts === 'undefined' || reqParts.length === 0) {
				creep.errorLog('missing required body parts; attempting suicide', ERR_NO_BODYPART, 4);
				creep.suicide();
			}
		}

		const rangeToFlag = creep.pos.getRangeTo(this.flag);
		if(rangeToFlag === 0) {
			let mySource = Game.getObjectById(creep.memory.mySourceId);
			if(mySource === null) {
				mySource = this.flag.pos.findClosestByRange(FIND_SOURCES);
				creep.memory.mySourceId = mySource.id;
			}

			let harvestReturn = creep.harvest(mySource);
			if(harvestReturn !== OK && harvestReturn !== ERR_NOT_ENOUGH_RESOURCES) {
				creep.errorLog('could not successfully harvest', harvestReturn, 4);
				if(harvestReturn === ERR_NOT_IN_RANGE) {
					delete creep.memory.mySourceId;
				}
			}
		} else {
			if(rangeToFlag === 1) {
				const otherCreep = _.first(this.flag.pos.lookFor(LOOK_CREEPS));
				if(otherCreep && otherCreep.getActiveBodyparts(WORK) <= 1) {
					this.log("creep in the way: " + otherCreep);
					otherCreep.blindMoveTo(creep);
				}
			}
			creep.blindMoveTo(this.flag);
		}
	}
}

global.DropMinerQuest = DropMinerQuest;
