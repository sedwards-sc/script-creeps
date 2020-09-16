/* jshint esversion: 6 */

const ENERGY_PER_TICK = 9;

class WorkingCartQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('workingCart', PRIORITY_LOW, id, flag, colony);
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
			const ROAD_COST = 1;
			const PLAIN_COST = 2;
			const SWAMP_COST = 10;
			let pathFinderResults = PathFinder.search(this.flag.pos, {pos: this.colony.flag.room.controller.pos, range: 3}, {
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

			this.memory.cache.carryPartsRequired = Math.max(Math.ceil(energyPerTrip / CARRY_CAPACITY), 1) * 2;
		}

		this.carts = [];
	}

	runCensus() {
		let maxCarts = 1;
		let carrysPerCreep = this.memory.cache.carryPartsRequired;
		while((carrysPerCreep > 20 || calculateCreepCost(workerBody(carrysPerCreep, carrysPerCreep, carrysPerCreep * 2)) > this.spawnGroup.maxSpawnEnergy) && maxCarts < 4) {
			maxCarts++;
			carrysPerCreep = Math.ceil(this.memory.cache.carryPartsRequired / maxCarts);
		}

		let body = [];
		if(this.colony.paved) {
			body = this.spawnGroup.workerBodyRatio(1, 1, 1, 1, carrysPerCreep);
		} else {
			body = this.spawnGroup.workerBodyRatio(1, 1, 2, 1, carrysPerCreep);
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
			// need to be within colony room for getRefillTarget() to work
			// TODO: make it so that the creep can get refill targets from outside the colony room
			let withinColonyRoom = creep.pos.roomName === this.colony.flag.pos.roomName;
			if(!withinColonyRoom) {
				creep.moveTo(this.colony.flag);
				return;
			}

			let findRefillTarget = () => {
				return creep.getRefillTarget();
			};
			let forgetRefillTarget = (s) => {
				if(s.structureType === STRUCTURE_TOWER) {
					return s.store.getUsedCapacity(RESOURCE_ENERGY) > s.store.getCapacity(RESOURCE_ENERGY) * 0.95;
				}
				return s.store.getFreeCapacity(RESOURCE_ENERGY) === 0;
			};
			let refillTarget = creep.rememberStructure(findRefillTarget, forgetRefillTarget, "remRefillId");

			if(refillTarget) {
				if(creep.transfer(refillTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
					creep.moveTo(refillTarget);
				}
			} else {
				// build
				let findConstructionSite = () => {
					return _.first(this.colony.flag.room.find(FIND_CONSTRUCTION_SITES));
				};
				let forgetConstructionSite = (o) => {
					if(o instanceof ConstructionSite) {
						return false;
					}
					return true;
				};
				let site = creep.rememberStructure(findConstructionSite, forgetConstructionSite, "remSiteId");

				if(site) {
					let buildReturn = creep.build(site);
					if(buildReturn === ERR_NOT_IN_RANGE) {
						creep.moveTo(site);
					} else if(buildReturn === ERR_INVALID_TARGET && creep.pos.isEqualTo(site)) {
						let openPositions = creep.pos.openAdjacentSpots(false);
						if(openPositions.length > 0) {
							creep.moveTo(_.first(openPositions));
						} else {
							this.errorLog("unable to move off construction site");
						}
					}
				} else {
					// else upgrade
					if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
						creep.moveTo(creep.room.controller, {range: 3});
					}
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

global.WorkingCartQuest = WorkingCartQuest;
