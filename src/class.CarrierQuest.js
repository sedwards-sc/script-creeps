/* jshint esversion: 6 */

class CarrierQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('carrier', PRIORITY_HIGH, id, flag, colony);
	}

	initQuest() {
		this.carriers = [];
	}

	runCensus() {
		// TODO: check if there are other creeps in the room. if not, size based on energy available instead of max energy
		this.carriers = this.attendance(this.nameId, this.spawnGroup.workerBodyRatio(0, 1, 1, 1, 8), 1, {prespawn: 0});
	}

	runActivities() {
		for(let creep of this.carriers) {
			if(!creep.spawning) {
				this.carrierActions(creep)
			}
		}
	}

	questEnd() {
	}

	carrierActions(creep) {
		let withinRoom = creep.pos.roomName === this.flag.pos.roomName;
		if(!withinRoom) {
			creep.moveTo(this.flag);
			return;
		}

		if(!creep.hasLoad()) {
			// TODO: add terminal awareness
			let energySource;

			if(creep.room.storage && creep.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
				energySource = creep.room.storage;
			} else {
				let findEnergy = () => {
					let energySources = [];
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
				};
				let forgetEnergy = (e) => {
					if(e instanceof Resource) {
						if(e.amount > 20) {
							return false;
						}
					} else if(e instanceof Structure) {
						if(e.store && e.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
							return false;
						}
					}
					return true;
				};
				energySource = creep.rememberStructure(findEnergy, forgetEnergy, "remEnergyId");
			}

			if(energySource) {
				if(creep.pos.isNearTo(energySource)) {
					creep.takeResource(energySource, RESOURCE_ENERGY);
				} else {
					creep.blindMoveTo(energySource);
				}
			} else {
				creep.say("no energy");
			}

			return;
		}

		let findTarget = () => {
			return creep.getRefillTarget();
		};
		let forgetTarget = (s) => {
			if(s.structureType === STRUCTURE_TOWER) {
				return s.store.getUsedCapacity(RESOURCE_ENERGY) > s.store.getCapacity(RESOURCE_ENERGY) * 0.95;
			}
			return s.store.getFreeCapacity(RESOURCE_ENERGY) === 0;
		};
		let target = creep.rememberStructure(findTarget, forgetTarget);

		if(target) {
			if(creep.pos.isNearTo(target)) {
				creep.transfer(target, RESOURCE_ENERGY);
			} else {
				creep.blindMoveTo(target);
			}
		} else {
			creep.say('bored');
			// TODO: add avoidMe if not working (need to clear it when moving again)

			// need them to go to flag after refilling or theyll block the storage
			//creep.memory.hasLoad = creep.carry.energy === creep.carryCapacity;

			// creep.idleOffRoad(this.flag);
			// creep.blindMoveTo(this.flag);
		}
	}
}

global.CarrierQuest = CarrierQuest;
