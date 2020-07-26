/* jshint esversion: 6 */

class HarvesterQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('harvester', PRIORITY_MEDIUM, id, flag, colony);
	}

	initQuest() {
		this.harvesters = [];
	}

	runCensus() {
		// TODO: check if there are other creeps in the room. if not, size based on energy available instead of max energy
		this.harvesters = this.attendance(this.nameId, this.spawnGroup.workerBodyRatio(1, 1, 2, 1), 1);
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
				return creep.pos.findClosestByRange(FIND_SOURCES);
			};
			let forgetEnergy = (e) => {
				if(e instanceof Source) {
					if(e.energy > 0) {
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

	harvesterActions_old(creep) {
		// state 0 is harvest
		// state 1 is transfer energy

		if(creep.pos.roomName !== this.epic.flag.pos.roomName) {
			creep.moveTo(this.epic.flag);
			return;
		}

		if(creep.memory.state === undefined) {
			creep.memory.state = 0;
		}

		if(creep.store.getUsedCapacity() === creep.store.getCapacity()) {
			if(creep.memory.state === 0) {
				creep.say('I\'m full!');
			}
			creep.memory.state = 1;
		}

		if(creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
			if(creep.memory.state == 1) {
				creep.say('I\'m empty!');
			}
			creep.memory.state = 0;
		}

		if(creep.memory.state === 0) {
			// harvest
			let mySource = Game.getObjectById(creep.memory.mySourceId);
			if(mySource === null) {
				mySource = creep.pos.findClosestByRange(FIND_SOURCES);
				creep.memory.mySourceId = mySource.id;
			}

			// TODO: do this without calling harvest every time
			if(creep.harvest(mySource) === ERR_NOT_IN_RANGE) {
				creep.moveTo(mySource);
			}
		} else {
			// transfer energy
			// TODO: cache targets in memory. check if null or full each tick
			var closestTarget;

			// if room energy is < 300, fill extensions first so spawn can generate energy
			if(creep.room.energyAvailable < 300) {
				closestTarget = creep.pos.findClosestByRange(FIND_STRUCTURES, {
						filter: (structure) => {
							return (structure.structureType === STRUCTURE_EXTENSION) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
						}
				});

				if(!closestTarget) {
					closestTarget = creep.pos.findClosestByRange(FIND_STRUCTURES, {
							filter: (structure) => {
								return (structure.structureType === STRUCTURE_SPAWN) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
							}
					});
				}
			} else {
				closestTarget = creep.pos.findClosestByRange(FIND_STRUCTURES, {
						filter: (structure) => {
							return (structure.structureType === STRUCTURE_EXTENSION ||
									structure.structureType === STRUCTURE_SPAWN) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
						}
				});
			}

			if(!closestTarget) {
				closestTarget = creep.pos.findClosestByRange(FIND_STRUCTURES, {
						filter: (structure) => {
							return (structure.structureType === STRUCTURE_TOWER) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
						}
				});
			}

			if(closestTarget) {
				if(creep.transfer(closestTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
					creep.moveTo(closestTarget);
				}
			} else {
				// build
				var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
				if(targets.length) {
					if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
						creep.moveTo(targets[0]);
					}
				} else {
					//else transfer to storage
					//var closestStorage = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_STORAGE}});
					//if(creep.transfer(closestStorage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
					//    creep.moveTo(closestStorage);
					//}

					// else upgrade
					if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
						creep.moveTo(creep.room.controller);
					}
				}
			}
		}
	}
}

global.HarvesterQuest = HarvesterQuest;
