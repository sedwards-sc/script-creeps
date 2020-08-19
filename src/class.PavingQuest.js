/* jshint esversion: 6 */

const REMEMBER_ENERGY_KEY = "remEnergyId";
const REMEMBER_ROAD_KEY = "remRoadId";
const REMEMBER_CONSTRUCTION_KEY = "remConId";
const STORAGE_THRESHOLD = 5000;

class PavingQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('paving', PRIORITY_TRIVIAL, id, flag, colony);
	}

	initQuest() {
		if(this.memory.cache.partsRequired === undefined) {
			let sum = _.sum(this.flag.room.findStructures(STRUCTURE_ROAD), r => r.hitsMax);
			this.memory.cache.partsRequired = Math.max(Math.ceil(sum / 500000), 1);
		}

		if(this.memory.cache.roomPaved === undefined) {
			this.memory.cache.roomPaved = true;

			// TODO: make this a cached find
			let pavingStructures = _.filter(
				this.flag.room.find(FIND_MY_STRUCTURES),
				s => s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION
			);
			pavingStructures.forEach(
				structure => {
					let openSpots = structure.pos.openAdjacentSpots(true);
					openSpots.forEach(
						pos => {
							let notAConstructionSite = pos.lookFor(LOOK_CONSTRUCTION_SITES).length === 0;
							let notARoad = pos.lookForStructure(STRUCTURE_ROAD) === undefined;
							if(notAConstructionSite && notARoad) {
								this.flag.room.visual.circle(pos, {fill: 'transparent', radius: 0.55, stroke: 'red'});
							}
						}
					);
				}
			);
		}

		this.pavers = [];
	}

	runCensus() {
		let options = {};
		options.prespawn = 0;
		if(this.colony.flag.room.storage) {
			options.destination = this.colony.flag.room.storage;
		}
		this.pavers = this.attendance("paver_" + this.id, this.spawnGroup.workerBodyRatio(1, 3, 2, 1, this.memory.cache.partsRequired), 1, options);
	}

	runActivities() {
		for(let creep of this.pavers) {
			if(!creep.spawning) {
				this.paverActions(creep)
			}
		}
	}

	questEnd() {
	}

	paverActions(creep) {
		if(creep.fleeHostiles()) {
			return;
		}

		let withinRoom = creep.pos.roomName === this.flag.pos.roomName;
		if(!withinRoom) {
			creep.blindMoveTo(this.flag);
			return;
		}

		if(!creep.hasLoad()) {
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
			return;
		}

		// I'm in the room and I have energy

		let findRoad = () => {
			return creep.pos.findClosestByPath(_.filter(creep.room.findStructures(STRUCTURE_ROAD), (s) => s.hits < s.hitsMax - 1000));
		};
		let forgetRoad = (s) => s.hits === s.hitsMax;
		let target = creep.rememberStructure(findRoad, forgetRoad, REMEMBER_ROAD_KEY);

		if(!target) {
			// look for construction site roads if there are no roads to repair
			let findRoadUnderConstruction = () => {
				let roadSites = creep.room.findConstructionSitesByType(STRUCTURE_ROAD);
				if(roadSites.length > 0) {
					return creep.pos.findClosestByPath(roadSites);
				}
			};
			let forgetRoadUnderConstruction = (s) => s.progress === s.progressTotal;
			target = creep.rememberStructure(findRoadUnderConstruction, forgetRoadUnderConstruction, REMEMBER_CONSTRUCTION_KEY);
		}

		if(!target) {
			// no roads to repair or build. fill up and head to flag
			let isFull = creep.store.getUsedCapacity() === creep.store.getCapacity();
			creep.memory.hasLoad = isFull;
			if(isFull) {
				if(creep.pos.inRangeTo(this.flag, 3)) {
					creep.say('idle');
					creep.yieldRoad(this.flag);
				} else {
					creep.blindMoveTo(this.flag);
				}
			}
			return;
		}

		// and I have a target

		let range = creep.pos.getRangeTo(target);
		if(range > 3) {
			creep.blindMoveTo(target);
			// repair any damaged road I'm standing on
			let road = creep.pos.lookForStructure(STRUCTURE_ROAD);
			if(road && road.hits < road.hitsMax - 100) {
				creep.repair(road);
			}
			return;
		}

		// and I'm in range

		if(target instanceof StructureRoad) {
			creep.repair(target);
		} else if(target instanceof ConstructionSite) {
			creep.build(target);
		} else {
			creep.errorLog(`unknown target: ${target}`, ERR_INVALID_TARGET, 5);
			delete creep.memory[REMEMBER_ROAD_KEY];
			delete creep.memory[REMEMBER_CONSTRUCTION_KEY];
		}
		creep.yieldRoad(target);
	}
}

global.PavingQuest = PavingQuest;
