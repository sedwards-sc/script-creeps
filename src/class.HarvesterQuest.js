/* jshint esversion: 6 */

class HarvesterQuest extends Quest {

	/**
	 *
	 */
	constructor(epic) {
		super('harvester', epic);
	}

	initQuest() {
	}

	collectCensus() {
		this.harvesters = this.attendance("harvester", () => configBody({ work: 2, move: 1, carry: 1 }), 1);
	}

	runActivities() {
		for(let creep of this.harvesters) {
			harvesterActions(creep)
		}
	}

	questEnd() {
	}

	invalidateQuestCache() {
	}

	harvesterActions(creep) {
		// state 0 is harvest
		// state 1 is transfer energy

		// TODO: add return for spawning state? (check if needed)

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
