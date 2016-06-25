/* jshint esversion: 6 */
/*
 * role.carrier - DEPRECATED
 */

module.exports = {
    run(creep) {
        //creep.say('carrier');
		// state 0 is get energy from storage
	    // state 1 is transfer energy to structures
	    if(creep.memory.state === undefined) {
	        creep.memory.state = 0;
	    }

	    if(creep.carry.energy === creep.carryCapacity) {
			if(creep.memory.state === 0) {
				creep.say('I\'m full!');
			}
	        creep.memory.state = 1;
	    }

	    if (creep.carry.energy === 0) {
			if(creep.memory.state === 1) {
				creep.say('I\'m empty!');
			}
	        creep.memory.state = 0;
	    }

	    if(creep.memory.state === 0) {
	        // find storage
            var roomStorage = creep.room.storage;
            if(!creep.pos.isNearTo(roomStorage)) {
                creep.moveTo(roomStorage);
            }
        } else if(creep.memory.state == 1) {
			// transfer energy to structures
			var closestTarget;

			// if room energy is < 300, fill extensions first so spawn can generate energy
			if(creep.room.energyAvailable < 300) {
				closestTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
						filter: (structure) => {
							return (structure.structureType == STRUCTURE_EXTENSION) && structure.energy < structure.energyCapacity;
						}
				});

				if(!closestTarget) {
					closestTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
							filter: (structure) => {
								return (structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
							}
					});
				}
			} else {
				closestTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
						filter: (structure) => {
							return (structure.structureType == STRUCTURE_EXTENSION ||
									structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
						}
				});
			}

			if(!closestTarget) {
				closestTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
						filter: (structure) => {
							return (structure.structureType == STRUCTURE_TOWER) && structure.energy < (structure.energyCapacity - 20);
						}
				});
			}

            if(closestTarget) {
                if(creep.transfer(closestTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(closestTarget);
                }
            } else {
				creep.say('bored');
			}
		} else {
			creep.memory.state = 0;
		}
    }
};
