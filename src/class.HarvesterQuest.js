/* jshint esversion: 6 */

class HarvesterQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('harvester', id, flag, colony);
	}

	initQuest() {
	}

	runCensus() {
		this.harvesters = this.attendance(this.nameId, this.spawnGroup.workerBodyRatio(1, 1, 2, 1), 1);
	}

	runActivities() {
		for(let creep of this.harvesters) {
			if(!creep.spawning) {
				this.harvesterActions2(creep)
			}
		}
	}

	questEnd() {
	}

	invalidateQuestCache() {
	}

	harvesterActions(creep) {
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

	harvesterActions2(creep) {
		let withinRoom = creep.pos.roomName === this.flag.pos.roomName;
		if(!withinRoom) {
			// TODO: move to position in same room as flag instead in case flag position isn't reachable
			creep.moveTo(this.flag);
			return;
		}

		let hasLoad = creep.hasLoad();
		if(!hasLoad) {
			let findSource = () => {
				return creep.pos.findClosestByRange(FIND_SOURCES);
			};
			let forgetSource = (s) => {
				if(s.structureType) {
					return true;
				}
				// TODO: forget is source is empty
				return false;
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

global.HarvesterQuest = HarvesterQuest;
