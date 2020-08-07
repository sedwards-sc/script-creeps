/* jshint esversion: 6 */

const MAX_EMERGENCY_HARVESTERS = 2;
const EMERGENCY_RESPONSE_DELAY = 100;

class EmergencyHarvesterQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('emergencyHarvester', PRIORITY_EMERGENCY, id, flag, colony);
	}

	initQuest() {
		this.harvesters = [];

		if(!this.hasVision) {
			return;
		}
		let myRoomCreeps = this.flag.room.findMyCreeps();
		// TODO: also check if creeps are spawning because find() doesn't seem to return spawning creeps
		// check if this.spawnGroup.availableSpawnCount === this.spawnGroup.spawns.length
		if(myRoomCreeps.length === 0) {
			return;
		}
		let myNonQuestRoomCreeps = _.filter(myRoomCreeps, (creep) => creep.name.indexOf(this.nameId) < 0)
		// TODO: add requirement for non-quest room creeps to also have a work or carry part
		if(myNonQuestRoomCreeps.length === 0) {
			return;
		}

		// non-quest creeps are in the room so reset emergency timer
		this.memory.lastTick = Game.time;
	}

	runCensus() {
		let max = 0;
		if(!this.memory.lastTick || Game.time > this.memory.lastTick + EMERGENCY_RESPONSE_DELAY) {
			if(Game.time % 5 === 0) {
				this.log("emergency harvesting activated", 3);
			}
			max = MAX_EMERGENCY_HARVESTERS;
		}

		this.harvesters = this.attendance(this.nameId, workerBody(1, 1, 2), max, {blindSpawn: true});
	}

	runActivities() {
		// TODO: recycle creeps after recovery (e.g. after >= 2 non-quest creeps in the room)
		for(let creep of this.harvesters) {
			if(!creep.spawning) {
				this.harvesterActions(creep)
			}
		}
	}

	questEnd() {
	}

	harvesterActions(creep) {
		let withinRoom = creep.pos.roomName === this.flag.pos.roomName;
		if(!withinRoom) {
			creep.moveTo(this.flag);
			return;
		}

		let hasLoad = creep.hasLoad();
		if(!hasLoad) {
			let findEnergy = () => {
				let energySources = [];
				if(creep.room.storage && creep.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
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
					_.filter(creep.room.findStructures(STRUCTURE_CONTAINER), (s) => s.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
				);
				energySources = energySources.concat(
					_.filter(creep.room.findStructures(STRUCTURE_LINK), (s) => s.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
				);
				if(energySources.length > 0) {
					return creep.pos.findClosestByPath(energySources);
				}
				return this.flag.pos.findClosestByRange(FIND_SOURCES);
			};
			let forgetEnergy = (e) => {
				if(e instanceof Source) {
					if(e.energy > 0 && e.pos.openAdjacentSpots().length > 0) {
						return false;
					}
				} else if(e instanceof Resource) {
					if(e.amount > 20) {
						return false;
					}
				} else if(e instanceof Structure) {
					// TODO: make this cleaner
					if(s.structureType !== STRUCTURE_STORAGE &&
						s.structureType !== STRUCTURE_TERMINAL &&
						s.structureType !== STRUCTURE_LINK &&
						s.structureType !== STRUCTURE_CONTAINER
					) {
						return true;
					}
					if(e.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
						return false;
					}
				}
				return true;
			};
			let myEnergySource = creep.rememberStructure(findEnergy, forgetEnergy, "remStructureId", true);

			if(creep.takeResource(myEnergySource, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
				creep.moveTo(myEnergySource);
			}
			return;
		}

		let findRefillTarget = () => {
			return creep.getRefillTarget();
		};
		let forgetRefillTarget = (s) => {
			if(!s.structureType) {
				return true;
			}
			if(s.structureType === STRUCTURE_STORAGE ||
				s.structureType === STRUCTURE_TERMINAL ||
				s.structureType === STRUCTURE_LINK ||
				s.structureType === STRUCTURE_CONTAINER
			) {
				return true;
			}
			if(s.structureType === STRUCTURE_TOWER) {
				return s.store.getUsedCapacity(RESOURCE_ENERGY) > s.store.getCapacity(RESOURCE_ENERGY) * 0.95;
			}
			return s.store.getFreeCapacity(RESOURCE_ENERGY) === 0;
		};
		let refillTarget = creep.rememberStructure(findRefillTarget, forgetRefillTarget, "remStructureId", true);

		if(refillTarget) {
			if(creep.transfer(refillTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
				creep.moveTo(refillTarget);
			}
		} else {
			// build
			let targets = creep.room.find(FIND_CONSTRUCTION_SITES);
			if(targets.length) {
				if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
					creep.moveTo(targets[0]);
				}
			} else {
				// else upgrade
				if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
					creep.moveTo(creep.room.controller);
				}
			}
		}
	}
}

global.EmergencyHarvesterQuest = EmergencyHarvesterQuest;
