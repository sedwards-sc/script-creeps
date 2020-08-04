/* jshint esversion: 6 */

const EMERGENCY_CARRIER_DELAY = 250;

class CarrierQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('carrier', PRIORITY_HIGH, id, flag, colony);
		if(!this.memory.lastTick) {
			this.memory.lastTick = Game.time;
		}
	}

	initQuest() {
		this.carriers = [];
	}

	runCensus() {
		let options = {
			prespawn: 0
		};
		if(this.colony.flag.room.storage) {
			options.destination = this.colony.flag.room.storage;
		}

		if(!this.memory.lastTick || Game.time > this.memory.lastTick + EMERGENCY_CARRIER_DELAY) {
			this.log('emergency carrier mode activated', 5);
			this.carriers = this.attendance(this.nameId, [CARRY, MOVE, CARRY, MOVE, CARRY, MOVE], 1, options);
		} else {
			this.carriers = this.attendance(this.nameId, this.spawnGroup.workerBodyRatio(0, 1, 1, 1, 8), 1, options);
		}

		if(this.carriers.length > 0) {
			this.memory.lastTick = Game.time;
		}
	}

	runActivities() {
		for(let creep of this.carriers) {
			if(!creep.spawning) {
				this.carrierActions(creep)
				if(creep.bored) {
					creep.memory.avoidMe = true;
				} else {
					creep.memory.avoidMe = false;
				}
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
				creep.idleOffRoad(this.flag);
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
			let isFull = creep.store.getUsedCapacity() === creep.store.getCapacity();
			creep.memory.hasLoad = isFull;
			if(isFull) {
				if(creep.pos.isNearTo(this.flag)) {
					creep.say('bored');
					creep.bored = true;
				} else {
					creep.blindMoveTo(this.flag);
				}
			}
		}
	}
}

global.CarrierQuest = CarrierQuest;
