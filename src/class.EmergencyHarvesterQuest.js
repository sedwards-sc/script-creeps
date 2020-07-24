/* jshint esversion: 6 */

const MAX_EMERGENCY_HARVESTERS = 2;
const EMERGENCY_RESPONSE_DELAY = 100;

class EmergencyHarvesterQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('emergencyHarvester', id, flag, colony);
	}

	initQuest() {
		if(!this.hasVision) {
			return;
		}
		let myRoomCreeps = this.flag.room.findMyCreeps();
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
		for(let creep of this.harvesters) {
			if(!creep.spawning) {
				this.harvesterActions(creep)
			}
		}
	}

	questEnd() {
	}

	invalidateQuestCache() {
	}

	harvesterActions(creep) {
		let withinRoom = creep.pos.roomName === this.flag.pos.roomName;
		if(!withinRoom) {
			creep.moveTo(this.flag);
			return;
		}

		let hasLoad = creep.hasLoad();
		if(!hasLoad) {
			let findSource = () => {
				return creep.pos.findClosestByRange(FIND_SOURCES);
			};
			let forgetSource = (s) => {
				if(s instanceof Source) {
					// TODO: forget if source is empty
					return false;
				}
				return true;
			};
			let mySource = creep.rememberStructure(findSource, forgetSource, "remStructureId", true);

			if(creep.harvest(mySource) === ERR_NOT_IN_RANGE) {
				creep.moveTo(mySource);
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
