/* jshint esversion: 6 */

const ENERGY_PER_TICK = 9;

class UpgradingCartQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('upgradingCart', PRIORITY_TRIVIAL, id, flag, colony);
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

			// TODO: maybe this should be Math.ceil to account for the upgrading time
			this.memory.cache.carryPartsRequired = Math.max(Math.floor(energyPerTrip / CARRY_CAPACITY), 1);
		}

		this.carts = [];
	}

	runCensus() {
		// TODO: spawn extra carts if the max spawn energy isn't sufficient to produce maxBodyUnits
		let maxBodyUnits = Math.max(Math.ceil(this.memory.cache.carryPartsRequired / 2), 1);
		this.carts = this.attendance(this.nameId, this.spawnGroup.workerBodyRatio(1, 2, 3, 1, maxBodyUnits), 1, {prespawn: this.memory.cache.prespawn});
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
			let workTarget = this.colony.flag.room.controller;

			if(this.memory.build) {
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
					workTarget = site;
				}
			}

			if(creep.buildOrUpgrade(workTarget) === ERR_NOT_IN_RANGE) {
				creep.moveTo(workTarget);
			} else {
				creep.yieldRoad(workTarget);
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

global.UpgradingCartQuest = UpgradingCartQuest;
