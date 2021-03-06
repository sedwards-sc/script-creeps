/* jshint esversion: 6 */

const ENERGY_PER_TICK = 9;

class MiningCartQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('miningCart', PRIORITY_TRIVIAL, id, flag, colony);
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

		if(this.memory.cache.carryPartsRequired === undefined) {
			if(this.colony.flag.room.storage) {
				const ROAD_COST = 1;
				const PLAIN_COST = 2;
				const SWAMP_COST = 10;
				let pathFinderResults = PathFinder.search(this.flag.pos, {pos: this.colony.flag.room.storage.pos, range: 1}, {
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

				let pathLength = Math.max(pathFinderResults.path.length * 2, 1);
				let energyPerTrip = pathLength * ENERGY_PER_TICK;

				this.memory.cache.carryPartsRequired = Math.max(Math.ceil(energyPerTrip / CARRY_CAPACITY), 1);
			} else {
				this.memory.cache.carryPartsRequired = 0;
			}
		}

		this.carts = [];
	}

	runCensus() {
		let maxCarts = 0;
		let carrysPerCreep = this.memory.cache.carryPartsRequired;
		if(carrysPerCreep > 0) {
			maxCarts = 1;
			while(carrysPerCreep > 20 || calculateCreepCost(workerBody(0, carrysPerCreep, carrysPerCreep)) > this.spawnGroup.maxSpawnEnergy) {
				// TODO: add a limit to the number of carts
				maxCarts++;
				carrysPerCreep = Math.ceil(this.memory.cache.carryPartsRequired / maxCarts);
			}
		}

		let body = [];
		if(this.colony.paved) {
			body = this.spawnGroup.workerBodyRatio(0, 2, 1, 1, Math.ceil(carrysPerCreep / 2));
		} else {
			body = this.spawnGroup.workerBodyRatio(0, 1, 1, 1, carrysPerCreep);
		}

		this.carts = this.attendance(this.nameId, body, maxCarts, {prespawn: this.memory.cache.prespawn});
	}

	runActivities() {
		for(let creep of this.carts) {
			if(!creep.spawning) {
				this.cartActions(creep)
			}
		}
	}

	questEnd() {
	}

	cartActions(creep) {
		if(creep.fleeHostiles()) {
			return;
		}

		if(creep.hasLoad()) {
			let storage = this.colony.flag.room.storage;
			if(!storage) {
				creep.errorLog('could not find colony storage', ERR_NOT_FOUND, 4);
				return;
			}
			if(storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
				if(creep.pos.isNearTo(storage)) {
					creep.transfer(storage, RESOURCE_ENERGY);
				} else {
					creep.blindMoveTo(storage);
				}
			} else {
				creep.say('storage full');
				if(creep.pos.isEqualTo(this.colony.flag)) {
					creep.drop(RESOURCE_ENERGY);
				} else {
					creep.blindMoveTo(this.colony.flag);
				}
			}
			return;
		}

		let inPickUpRoom = creep.pos.roomName === this.flag.pos.roomName;
		if(!inPickUpRoom) {
			creep.blindMoveTo(this.flag);
			return;
		}

		let findSource = () => {
			return this.flag.pos.findClosestByRange(FIND_SOURCES);
		};
		let forgetSource = (s) => {
			return false;
		};
		let source = creep.rememberStructure(findSource, forgetSource, 'sourceStructureId', true);
		if(!source) {
			creep.errorLog('could not find source near flag', ERR_NOT_FOUND, 4);
			return;
		}

		if(creep.pos.getRangeTo(source) > 3) {
			creep.blindMoveTo(source);
			return;
		}

		// TODO: add container awareness
		let energyPiles = _.filter(creep.room.findDroppedResources(), (r) => r.resourceType === RESOURCE_ENERGY && r.amount >= 20 && source.pos.getRangeTo(r) <= 3)
		if(energyPiles.length > 0) {
			let target = creep.pos.findClosestByRange(energyPiles);
			if(creep.pos.isNearTo(target)) {
				creep.takeResource(target, RESOURCE_ENERGY);
			} else {
				creep.blindMoveTo(target);
			}
		} else {
			creep.yieldRoad(source);
			creep.say('waiting');
		}
	}
}

global.MiningCartQuest = MiningCartQuest;
