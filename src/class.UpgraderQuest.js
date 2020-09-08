/* jshint esversion: 6 */

const REMEMBER_ENERGY_KEY = "remEnergyId";
const STORAGE_THRESHOLD = 5000;

class UpgraderQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('upgrader', PRIORITY_LOW, id, flag, colony);
		this.poi = true;
	}

	initQuest() {
		if(this.memory.cache.prespawn === undefined) {
			const ROAD_COST = 1;
			const PLAIN_COST = 2;
			const SWAMP_COST = 10;
			let pathFinderResults = PathFinder.search(this.spawnGroup.pos, this.flag.room.controller, {
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

		this.upgraders = [];
	}

	runCensus() {
		let maxUpgraders = 1;
		let body = [];
		let options = {};
		options.prespawn = this.memory.cache.prespawn;
		if(this.colony.flag.room.storage) options.destination = this.colony.flag.room.storage;

		if(this.colony.flag.room.controller.level === 8) {
			if(this.colony.paved) {
				body = this.spawnGroup.workerBodyRatio(1, 1, 1, 1, 15);
			} else {
				maxUpgraders = 3;
				body = this.spawnGroup.workerBodyRatio(1, 1, 2, 1, 5);
			}
		} else {
			if(this.colony.flag.room.storage) {
				let storageEnergy = this.colony.flag.room.storage.store.getUsedCapacity(RESOURCE_ENERGY);
				if(storageEnergy > 0) {
					maxUpgraders = Math.floor(storageEnergy / 100000) + 1;
				}
			}

			if(this.colony.paved) {
				body = this.spawnGroup.workerBodyRatio(1, 1, 1, 1);
			} else {
				body = this.spawnGroup.workerBodyRatio(1, 1, 2, 1);
			}
		}

		this.upgraders = this.attendance(this.nameId, body, maxUpgraders, options);
	}

	runActivities() {
		for(let creep of this.upgraders) {
			if(!creep.spawning) {
				this.upgraderActions(creep)
				if(creep.working) {
					creep.memory.avoidMe = true;
				} else {
					creep.memory.avoidMe = false;
				}
			}
		}
	}

	questEnd() {
	}

	upgraderActions(creep) {
		let withinRoom = creep.pos.roomName === this.flag.pos.roomName;
		if(!withinRoom) {
			creep.moveTo(this.flag);
			return;
		}

		if(creep.hasLoad()) {
			let workTarget = this.colony.flag.room.controller;

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

			if(creep.buildOrUpgrade(workTarget) === ERR_NOT_IN_RANGE) {
				creep.blindMoveTo(workTarget);
			} else {
				creep.working = true;
				if(workTarget instanceof ConstructionSite) {
					creep.yieldRoad(workTarget);
				}
			}
			return;
		}

		let findEnergy = () => {
			let energySources = [];
			if(creep.room.storage && creep.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) > STORAGE_THRESHOLD) {
				energySources.push(creep.room.storage);
			}
			if(creep.room.terminal && creep.room.terminal.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
				energySources.push(creep.room.terminal);
			}
			// TODO: check for minimum pile size based on creep's carry capacity
			energySources = energySources.concat(
				_.filter(creep.room.findDroppedResources(), (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 20)
			);
			energySources = energySources.concat(
				_.filter(creep.room.findTombstones(), (t) => t.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
			);
			energySources = energySources.concat(
				_.filter(creep.room.findRuins(), (r) => r.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
			);
			energySources = energySources.concat(
				_.filter(creep.room.findStructures(STRUCTURE_CONTAINER), (s) => s.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
			);
			energySources = energySources.concat(
				_.filter(creep.room.findStructures(STRUCTURE_LINK), (s) => s.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
			);
			if(energySources.length > 0) {
				return creep.pos.findClosestByPath(energySources);
			}
		};
		let forgetEnergy = (e) => {
			if(e instanceof Resource) {
				if(e.amount > 20) {
					return false;
				}
			} else if(e.store && e.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
				return false;
			}
			return true;
		};
		let energySource = creep.rememberStructure(findEnergy, forgetEnergy, REMEMBER_ENERGY_KEY, true);

		if(energySource) {
			if(creep.pos.isNearTo(energySource)) {
				creep.takeResource(energySource, RESOURCE_ENERGY);
				delete creep.memory[REMEMBER_ENERGY_KEY];
			} else {
				creep.blindMoveTo(energySource);
			}
		} else {
			creep.say("no energy");
			creep.idleOffRoad(this.flag);
		}
	}
}

global.UpgraderQuest = UpgraderQuest;
