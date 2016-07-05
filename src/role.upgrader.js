/* jshint esversion: 6 */
/*
 * role.upgrader
 */

module.exports = {
	run(creep) {
	    // state 0 is harvest
	    // state 1 is upgrade

	    if(creep.memory.state === undefined) {
	        creep.memory.state = 0;
	    }

	    if(creep.carry.energy === creep.carryCapacity) {
	        creep.memory.state = 1;
	    }

	    if (creep.carry.energy === 0) {
	        creep.memory.state = 0;
	    }

	    if(creep.memory.state === 0) {
	        // get energy piles
			var droppedEnergy = creep.room.find(FIND_DROPPED_ENERGY, {
					filter: (pile) => {
						return (pile.energy >= (creep.carryCapacity / 2)) && (pile.pos.roomName === creep.memory.spawnRoom);
					}
			});

			//get links with energy or storage with enough surplus energy
			var structuresWithEnergy = creep.room.find(FIND_STRUCTURES, {
					filter: (structure) => {
						return ((structure.structureType === STRUCTURE_LINK) && (structure.energy >= creep.carryCapacity)) || ((structure.structureType === STRUCTURE_STORAGE) && (structure.store[RESOURCE_ENERGY] >= 1000));
					}
			});

			var energySources = [];

			for(let i in droppedEnergy) {
				energySources.push(droppedEnergy[i]);
			}

			for(let i in structuresWithEnergy) {
				energySources.push(structuresWithEnergy[i]);
			}

			var closestEnergy = creep.pos.findClosestByPath(energySources);

			if(closestEnergy) {
				//if((closestEnergy.structureType === STRUCTURE_LINK) || (closestEnergy.structureType === STRUCTURE_STORAGE)) {
				//	if(!creep.pos.isNearTo(closestEnergy)) {
				//		creep.moveTo(closestEnergy);
				//	}
				//} else {
				//	if(creep.pickup(closestEnergy) === ERR_NOT_IN_RANGE) {
				//		creep.moveTo(closestEnergy);
				//	}
				//}

				if(creep.pos.isNearTo(closestEnergy)) {
				    creep.takeResource(closestEnergy, RESOURCE_ENERGY);
				} else {
				    creep.moveTo(closestEnergy);
				}
			} else {
				creep.say('no energy');
			}
        } else {
            // upgrade
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }
        }
	}
};
